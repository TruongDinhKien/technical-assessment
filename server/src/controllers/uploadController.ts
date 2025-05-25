import { Request, Response } from 'express';
import multer from 'multer';
import csv from 'csv-parser';
import { InferInsertModel } from 'drizzle-orm';
import { PassThrough } from 'stream';
import { feedback } from '../database/schema';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import * as schema from '../database/schema';
import { MAX_CSV_FILE_SIZE } from '../constant';
type NewFeedback = InferInsertModel<typeof feedback>;

const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: MAX_CSV_FILE_SIZE,
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(null, false);
    }
  },
});

export const uploadMiddleware = upload.single('csvFile');

export const uploadFeedbacksCsv = async (request: Request, response: Response, dbInstance: PostgresJsDatabase<typeof schema>) => {
  if (!request.file) {
    return response.status(400).json({ error: 'No CSV file uploaded.' });
  }

  const csvBuffer = request.file.buffer;
  const results: NewFeedback[] = [];
  const errors: string[] = [];
  const passthrough = new PassThrough();
  passthrough.end(csvBuffer);

  passthrough
    .pipe(csv(
      {
        mapHeaders: ({ header }) => {
          const cleanedHeader = header.replace(/"/g, '').trim();
          return cleanedHeader;
        }
      }
    ))
    .on('data', (data) => {
      const id = data.id ? Number(data.id) : undefined;
      const postId = data.postId;
      const name = data.name
      const body = data.body
      const email = data.email

      if (id && postId && name && body && email)
        results.push({
          id,
          name,
          body: data.body.replace(/\\n/g, '\n'),
          postId,
          email,
        });
    })
    .on('end', async () => {
      if (results.length === 0) {
        return response.status(400).json({ error: 'CSV file is empty or malformed.' });
      }

      try {
        await dbInstance.insert(feedback).values(results);
        response.status(200).json({
          message: `Successfully uploaded and added ${results.length} feedback entr${results.length == 1 ? 'y' : 'ies' }.`,
          count: results.length,
        });
      } catch (error) {
        console.error("Error inserting feedbacks from CSV:", error);
        if (error instanceof Error && error.message)
          response.status(500).json({ error: error.message});
        else
          response.status(500).json({ error: "Failed to insert feedbacks. Check CSV format or server logs." });
      }
    })
    .on('error', (error) => {
      console.error("Error parsing CSV:", error);
      response.status(400).json({ error: "Failed to parse CSV file. Ensure it's valid." });
    });
};