import request from 'supertest';
import app from '../index';
import { db } from '../index';

import * as feedbacksController from '../controllers/feedbacksController';
import * as uploadController from '../controllers/uploadController';
import { mockDataFeedback } from '../data/mockData';
import { feedback } from '../database/schema';
import { DEFAULT_LIMIT } from '../constant';
import { getErrorString } from '../utils/console';

describe('Feedback API (Scenario 1: Controllers contain DB logic)', () => {
  beforeEach(async () => {
    await db.delete(feedback).execute();
    await db.insert(feedback).values(mockDataFeedback.feedbacks).execute();
  });

  describe('GET /feedbacks', () => {
    it('should return paginated feedbacks with default parameters (page 1, limit 10)', async () => {
      const res = await request(app).get('/feedbacks');
      expect(res.statusCode).toEqual(200);
      expect(res.body).toEqual({
        data: expect.arrayContaining(mockDataFeedback.feedbacks.slice(0, 10)),
        totalItems: 50,
        totalPages: 5,
        page: 1,
        limit: DEFAULT_LIMIT,
      });
    });

    it('should return feedbacks with specified page and limit', async () => {
      const res = await request(app).get('/feedbacks?page=2&limit=10');
      expect(res.statusCode).toEqual(200);
      expect(res.body.page).toEqual(2);
      expect(res.body.limit).toEqual(DEFAULT_LIMIT);
      expect(res.body.data.length).toEqual(DEFAULT_LIMIT);
    });

    it('should return feedbacks filtered by search term', async () => {
      const name = mockDataFeedback.feedbacks[0].name;
      const res = await request(app).get(`/feedbacks?search=${name}`);
      expect(res.statusCode).toEqual(200);
      expect(res.body.data[0].name).toEqual(name);
    });

    it('should handle search term resulting in no feedbacks', async () => {

      const res = await request(app).get('/feedbacks?search=nonexistent');
      expect(res.statusCode).toEqual(200);
      expect(res.body.data).toEqual([]);
      expect(res.body.totalItems).toEqual(0);
    });

    it('should return empty data when requested page is out of bounds', async () => {

      const res = await request(app).get('/feedbacks?page=10');
      expect(res.statusCode).toEqual(200);
      expect(res.body.data).toEqual([]);
      expect(res.body.page).toEqual(10);
      expect(res.body.totalItems).toEqual(50);
      expect(res.body.totalPages).toEqual(5);
    });

    it('should treat page less than 1 as page 1', async () => {
      const res = await request(app).get('/feedbacks?page=0');
      expect(res.statusCode).toEqual(200);
      expect(res.body.page).toEqual(1);
    });

    it('should default page and limit for non-numeric values', async () => {
      const res = await request(app).get('/feedbacks?page=abc&limit=xyz');
      expect(res.statusCode).toEqual(200);
      expect(res.body.page).toEqual(1);
      expect(res.body.limit).toEqual(DEFAULT_LIMIT);
    });

    it('should return all feedbacks if search term is an empty string', async () => {
      const res = await request(app).get('/feedbacks?search=');
      expect(res.statusCode).toEqual(200);
      expect(res.body.data.length).toEqual(DEFAULT_LIMIT);
    });


    it('should return 500 if controller function throws an error', async () => {

      const getFeedbacksSpy = jest.spyOn(feedbacksController, 'getFeedbacks');
      getFeedbacksSpy.mockImplementationOnce(async (req, res) => {
        throw new Error('Simulated controller error');
      });

      const res = await request(app).get('/feedbacks');

      expect(res.statusCode).toEqual(500);
      expect(res.body.message).toEqual('Internal Server Error');
    });
  });

  describe('POST /feedbacks/upload-csv', () => {

    it('should successfully upload and process a CSV file with multiple records', async () => {
      const csvBuffer = Buffer.from('postId,id,name,email,body\n200,52,id labore ex et quam laborum,Eliseo@gardner.biz,laudantium enim quasi est quidem magnam voluptate ip et nam sapiente accusantium\n201,51,quo vero reiciendis velit similique earum,Jayne_Kuhic@sydney.com,est natus enim nihil est dolore omnis voluptatem numquatatem error expedita pariaturnihil sint nostrum voluptatem reiciendis et');

      const res = await request(app)
        .post('/feedbacks/upload-csv')
        .attach('csvFile', csvBuffer, 'feedback.csv');

      expect(res.statusCode).toEqual(200);
      expect(res.body.message).toEqual('Successfully uploaded and added 2 feedback entries.');
    });

    // Edge case: Empty CSV file (only headers)
    it('should return 400 if upload and process an empty CSV file (only headers)', async () => {
      const emptyCsvBuffer = Buffer.from('postId,id,name,email,body');
      const res = await request(app)
        .post('/feedbacks/upload-csv')
        .attach('csvFile', emptyCsvBuffer, 'empty.csv');
      expect(res.statusCode).toEqual(400);
      expect(getErrorString(res)).toEqual('CSV file is empty or malformed.');
    });

    it('should return 400 if no file is uploaded', async () => {
      const res = await request(app)
        .post('/feedbacks/upload-csv');

      expect(res.statusCode).toEqual(400);
      expect(getErrorString(res)).toEqual('No CSV file uploaded.');
    });

    it('should return 400 if CSV processing fails in controller (e.g., malformed CSV)', async () => {
      const malformedCsvBuffer = Buffer.from('invalid,csv,format\nvalue1,value2');
      // Simulate a file being present, but the processing *fails*
      const res = await request(app)
        .post('/feedbacks/upload-csv')
        .attach('csvFile', malformedCsvBuffer, 'malformed.csv');

      expect(res.statusCode).toEqual(400);
      expect(getErrorString(res)).toEqual('CSV file is empty or malformed.');

    });

    it('should return 400 or appropriate error if CSV has missing required columns', async () => {
      const missingColsBuffer = Buffer.from('name,body\nUser1,Feedback1');


      const res = await request(app)
        .post('/feedbacks/upload-csv')
        .attach('csvFile', missingColsBuffer, 'missing_cols.csv');

      expect(res.statusCode).toEqual(400);
      expect(getErrorString(res)).toEqual('CSV file is empty or malformed.');

    });



    it('should handle non-CSV file types gracefully', async () => {
      const imageDataBuffer = Buffer.from('some image data');
      // Simulate a non-CSV file being present. The mock will then hit the mimetype check.
      const res = await request(app)
        .post('/feedbacks/upload-csv')
        .attach('csvFile', imageDataBuffer, 'image.jpg');

      expect(res.statusCode).toEqual(400);
      expect(getErrorString(res)).toEqual('No CSV file uploaded.');

    });

    it('should handle CSV with more columns than expected (extra columns ignored)', async () => {
      const extraColsCsv = Buffer.from('postId,id,name,email,body,extra1,extra2\n400,70,User Extra,extra@example.com,Body extra,value1,value2');
      const res = await request(app)
        .post('/feedbacks/upload-csv')
        .attach('csvFile', extraColsCsv, 'extra_cols.csv');

      expect(res.statusCode).toEqual(200);
      expect(res.body.message).toEqual('Successfully uploaded and added 1 feedback entry.');
      const resGetFeedbacks = await request(app).get('/feedbacks');
      expect(resGetFeedbacks.body).toEqual({
        data: expect.arrayContaining(mockDataFeedback.feedbacks.slice(0, 10)),
        totalItems: 51,
        totalPages: 6,
        page: 1,
        limit: DEFAULT_LIMIT,
      });
    });

  });
});
