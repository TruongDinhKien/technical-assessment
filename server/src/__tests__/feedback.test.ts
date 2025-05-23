import request from 'supertest';
import app from '../index'; 
import * as feedbacksController from '../controllers/feedbacksController';
import * as uploadController from '../controllers/uploadController';

jest.mock('../controllers/feedbacksController', () => ({
  getFeedbacks: jest.fn(),
}));

jest.mock('../controllers/uploadController', () => ({
  uploadFeedbacksCsv: jest.fn(),
  uploadMiddleware: jest.fn((req, res, next) => next()),
}));

describe('Feedback API (Scenario 1: Controllers contain DB logic)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /feedbacks', () => {
    it('should return paginated feedbacks with default parameters', async () => {
      const mockFeedbacks = [
        { id: '1', name: 'Test User', body: 'Test feedback', postId: 'post1', createdAt: new Date().toISOString() },
      ];
      // Mock the return value of getFeedbacks from the controller
      (feedbacksController.getFeedbacks as jest.Mock).mockImplementationOnce(async (req, res) => {
        res.status(200).json({
          data: mockFeedbacks,
          totalItems: 1,
          totalPages: 1,
          page: 1,
          limit: 10,
        });
      });

      const res = await request(app).get('/feedbacks');

      expect(res.statusCode).toEqual(200);
      expect(res.body).toEqual({
        data: expect.any(Array),
        totalItems: 1,
        totalPages: 1,
        page: 1,
        limit: 10,
      });

      expect(feedbacksController.getFeedbacks).toHaveBeenCalledTimes(1);
    });

    it('should return feedbacks filtered by search term', async () => {
      const mockFeedbacks = [
        { id: '2', name: 'Search Test', body: 'This is a test', postId: 'post2', createdAt: new Date().toISOString() },
      ];
      (feedbacksController.getFeedbacks as jest.Mock).mockImplementationOnce(async (req, res) => {
        res.status(200).json({
          data: mockFeedbacks,
          totalItems: 1,
          totalPages: 1,
          page: 1,
          limit: 10,
        });
      });

      const res = await request(app).get('/feedbacks?search=test');

      expect(res.statusCode).toEqual(200);
      expect(res.body.data[0].name).toEqual('Search Test');
      expect(feedbacksController.getFeedbacks).toHaveBeenCalledTimes(1);
    });

    it('should handle no feedbacks found', async () => {
      (feedbacksController.getFeedbacks as jest.Mock).mockImplementationOnce(async (req, res) => {
        res.status(200).json({
          data: [],
          totalItems: 0,
          totalPages: 0,
          page: 1,
          limit: 10,
        });
      });

      const res = await request(app).get('/feedbacks?search=nonexistent');

      expect(res.statusCode).toEqual(200);
      expect(res.body.data).toEqual([]);
      expect(res.body.totalItems).toEqual(0);
      expect(feedbacksController.getFeedbacks).toHaveBeenCalledTimes(1);
    });

    it('should return 500 if controller function throws an error', async () => {
      (feedbacksController.getFeedbacks as jest.Mock).mockImplementationOnce(async (req, res) => {
        throw new Error('Simulated database error');
      });

      const res = await request(app).get('/feedbacks');

      expect(res.statusCode).toEqual(500);
      expect(res.body.message).toEqual('Internal Server Error');
      expect(feedbacksController.getFeedbacks).toHaveBeenCalledTimes(1);
    });
  });

  describe('POST /feedbacks/upload-csv', () => {
    it('should successfully upload and process a CSV file', async () => {
      (uploadController.uploadFeedbacksCsv as jest.Mock).mockImplementationOnce(async (req, res, db) => {
        res.status(200).json({ message: 'CSV uploaded and processed successfully. 2 records added.' });
      });

      const res = await request(app)
        .post('/feedbacks/upload-csv')
        .attach('csvFile', Buffer.from('name,body,postId\nUser1,Feedback1,postA\nUser2,Feedback2,postB'), 'feedback.csv');

      expect(res.statusCode).toEqual(200);
      expect(res.body.message).toEqual('CSV uploaded and processed successfully. 2 records added.');
      expect(uploadController.uploadMiddleware).toHaveBeenCalledTimes(1); 
      expect(uploadController.uploadFeedbacksCsv).toHaveBeenCalledTimes(1);
    });

    it('should return 400 if no file is uploaded (handled by middleware or controller)', async () => {
      (uploadController.uploadFeedbacksCsv as jest.Mock).mockImplementationOnce(async (req, res, db) => {
        if (!req.file) {
          return res.status(400).json({ message: 'No CSV file uploaded.' });
        }
        res.status(200).json({ message: 'Simulated success with file.' });
      });

      const res = await request(app)
        .post('/feedbacks/upload-csv');

      expect(res.statusCode).toEqual(400);
      expect(res.body.message).toEqual('No CSV file uploaded.');
      expect(uploadController.uploadMiddleware).toHaveBeenCalledTimes(1);
      expect(uploadController.uploadFeedbacksCsv).toHaveBeenCalledTimes(1);
    });

    it('should return 500 if CSV processing fails in controller', async () => {
      (uploadController.uploadFeedbacksCsv as jest.Mock).mockImplementationOnce(async (req, res, db) => {
        throw new Error('Simulated CSV parse error');
      });

      const res = await request(app)
        .post('/feedbacks/upload-csv')
        .attach('csvFile', Buffer.from('invalid,csv'), 'invalid.csv');

      expect(res.statusCode).toEqual(500);
      expect(res.body.message).toEqual('Failed to process CSV file.');
      expect(uploadController.uploadMiddleware).toHaveBeenCalledTimes(1);
      expect(uploadController.uploadFeedbacksCsv).toHaveBeenCalledTimes(1);
    });
  });
});
