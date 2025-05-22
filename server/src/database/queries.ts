require("dotenv").config();
import { Request, Response } from 'express';
import { Pool, QueryResult } from 'pg';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("DATABASE_URL is not set in the environment variables.");
  process.exit(1);
}

const pool = new Pool({
  connectionString: connectionString,
});

export const getFeedbacks = (request: Request, response: Response) => {
  pool.query('SELECT * FROM feedback ORDER BY id ASC', (error: Error, results: QueryResult<Feedback>) => {
    if (error) {
      console.error("Error fetching feedbacks:", error);
      return response.status(500).json({ error: "Internal Server Error" });
    }
    response.status(200).json(results.rows);
  });
};
