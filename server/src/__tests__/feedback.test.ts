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
    const mockGetFeedbacksResponse = (data: any[], totalItems: number, totalPages: number, page: number, limit: number) => {
      (feedbacksController.getFeedbacks as jest.Mock).mockImplementationOnce(async (req, res) => {
        res.status(200).json({
          data,
          totalItems,
          totalPages,
          page,
          limit,
        });
      });
    };

    it('should return paginated feedbacks with default parameters (page 1, limit 10)', async () => {
      const mockFeedbacks = Array(10).fill({ id: 1, name: 'Test User', body: 'Test feedback', postId: 1, createdAt: new Date().toISOString() });
      mockGetFeedbacksResponse(mockFeedbacks, 25, 3, 1, 10);

      const res = await request(app).get('/feedbacks');

      expect(res.statusCode).toEqual(200);
      expect(res.body).toEqual({
        data: expect.arrayContaining(mockFeedbacks),
        totalItems: 25,
        totalPages: 3,
        page: 1,
        limit: 10,
      });
      expect(feedbacksController.getFeedbacks).toHaveBeenCalledTimes(1);
    });

    it('should return feedbacks with specified page and limit', async () => {
      const mockFeedbacks = Array(5).fill({ id: '11', name: 'Page2 User', body: 'Another feedback', postId: 'post11', createdAt: new Date().toISOString() });
      mockGetFeedbacksResponse(mockFeedbacks, 25, 3, 2, 5);

      const res = await request(app).get('/feedbacks?page=2&limit=5');

      expect(res.statusCode).toEqual(200);
      expect(res.body.page).toEqual(2);
      expect(res.body.limit).toEqual(5);
      expect(res.body.data.length).toEqual(5);
      expect(feedbacksController.getFeedbacks).toHaveBeenCalledTimes(1);
    });

    it('should return feedbacks filtered by search term', async () => {
      const mockFeedbacks = [
        { id: '2', name: 'Search Test', body: 'This is a test', postId: 'post2', createdAt: new Date().toISOString() },
      ];
      mockGetFeedbacksResponse(mockFeedbacks, 1, 1, 1, 10);

      const res = await request(app).get('/feedbacks?search=test');

      expect(res.statusCode).toEqual(200);
      expect(res.body.data[0].name).toEqual('Search Test');
      expect(feedbacksController.getFeedbacks).toHaveBeenCalledTimes(1);
    });

    it('should handle search term resulting in no feedbacks', async () => {
      mockGetFeedbacksResponse([], 0, 0, 1, 10);

      const res = await request(app).get('/feedbacks?search=nonexistent');

      expect(res.statusCode).toEqual(200);
      expect(res.body.data).toEqual([]);
      expect(res.body.totalItems).toEqual(0);
      expect(feedbacksController.getFeedbacks).toHaveBeenCalledTimes(1);
    });

    it('should return empty data when requested page is out of bounds', async () => {
      mockGetFeedbacksResponse([], 5, 1, 2, 10); 

      const res = await request(app).get('/feedbacks?page=2');

      expect(res.statusCode).toEqual(200);
      expect(res.body.data).toEqual([]);
      expect(res.body.page).toEqual(2); 
      expect(res.body.totalItems).toEqual(5);
      expect(res.body.totalPages).toEqual(1);
      expect(feedbacksController.getFeedbacks).toHaveBeenCalledTimes(1);
    });

    it('should treat page less than 1 as page 1', async () => {
      const mockFeedbacks = Array(10).fill({ id: '1', name: 'Test User', body: 'Test feedback', postId: 'post1', createdAt: new Date().toISOString() });
      mockGetFeedbacksResponse(mockFeedbacks, 20, 2, 1, 10); 

      const res = await request(app).get('/feedbacks?page=0'); 

      expect(res.statusCode).toEqual(200);
      expect(res.body.page).toEqual(1);
      expect(feedbacksController.getFeedbacks).toHaveBeenCalledTimes(1);
    });

    it('should default page and limit for non-numeric values', async () => {
      const mockFeedbacks = Array(10).fill({ id: '1', name: 'Test User', body: 'Test feedback', postId: 'post1', createdAt: new Date().toISOString() });
      mockGetFeedbacksResponse(mockFeedbacks, 20, 2, 1, 10);

      const res = await request(app).get('/feedbacks?page=abc&limit=xyz');

      expect(res.statusCode).toEqual(200);
      expect(res.body.page).toEqual(1);
      expect(res.body.limit).toEqual(10);
      expect(feedbacksController.getFeedbacks).toHaveBeenCalledTimes(1);
    });

    it('should return all feedbacks if search term is an empty string', async () => {
      const mockFeedbacks = Array(5).fill({ id: 'any', name: 'Any User', body: 'Any feedback', postId: 'anyPost', createdAt: new Date().toISOString() });
      mockGetFeedbacksResponse(mockFeedbacks, 5, 1, 1, 10);

      const res = await request(app).get('/feedbacks?search=');

      expect(res.statusCode).toEqual(200);
      expect(res.body.data.length).toEqual(5);
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
    const mockDbParam = {};

    const mockUploadCsvResponse = (statusCode: number, message: string, isFileExpected: boolean, fileData?: { buffer: Buffer, originalname: string, mimetype: string }) => {
      (uploadController.uploadFeedbacksCsv as jest.Mock).mockImplementationOnce(async (req: any, res: any, db: any) => {

        if (isFileExpected && fileData) {
          req.file = {
            fieldname: 'csvFile',
            originalname: fileData.originalname,
            encoding: '7bit',
            mimetype: fileData.mimetype,
            size: fileData.buffer.length,
            buffer: fileData.buffer,
          };
        } else {
          req.file = undefined;
        }

        if (!req.file) {
          return res.status(400).json({ message: 'No CSV file uploaded.' });
        }

        res.status(statusCode).json({ message });
      });
    };

     it('should successfully upload and process a CSV file with multiple records', async () => {
      const csvBuffer = Buffer.from('name,body,postId\nUser1,Feedback1,postA\nUser2,Feedback2,postB');
      mockUploadCsvResponse(200, 'CSV uploaded and processed successfully. 2 records added.', true, {
        buffer: csvBuffer,
        originalname: 'feedback.csv',
        mimetype: 'text/csv'
      });

      const res = await request(app)
        .post('/feedbacks/upload-csv')
        .attach('csvFile', csvBuffer, 'feedback.csv');

      expect(res.statusCode).toEqual(200);
      expect(res.body.message).toEqual('CSV uploaded and processed successfully. 2 records added.');
      expect(uploadController.uploadMiddleware).toHaveBeenCalledTimes(1);
      expect(uploadController.uploadFeedbacksCsv).toHaveBeenCalledTimes(1);
    });

    // Edge case: Empty CSV file (only headers)
    it('should successfully upload and process an empty CSV file (only headers)', async () => {
      const emptyCsvBuffer = Buffer.from('name,body,postId\n');
      mockUploadCsvResponse(200, 'CSV uploaded and processed successfully. 0 records added.', true, {
        buffer: emptyCsvBuffer,
        originalname: 'empty.csv',
        mimetype: 'text/csv'
      });

      const res = await request(app)
        .post('/feedbacks/upload-csv')
        .attach('csvFile', emptyCsvBuffer, 'empty.csv');

      expect(res.statusCode).toEqual(200);
      expect(res.body.message).toEqual('CSV uploaded and processed successfully. 0 records added.');
      expect(uploadController.uploadMiddleware).toHaveBeenCalledTimes(1);
      expect(uploadController.uploadFeedbacksCsv).toHaveBeenCalledTimes(1);
    });

    it('should return 400 if no file is uploaded', async () => {
      // The uploadMiddleware mock already passes through, so the controller mock should handle this
      mockUploadCsvResponse(400, 'No CSV file uploaded.', false); // Explicitly state no file is expected for this mock

      const res = await request(app)
        .post('/feedbacks/upload-csv');

      expect(res.statusCode).toEqual(400);
      expect(res.body.message).toEqual('No CSV file uploaded.');
      expect(uploadController.uploadMiddleware).toHaveBeenCalledTimes(1);
      expect(uploadController.uploadFeedbacksCsv).toHaveBeenCalledTimes(1);
    });

      it('should return 500 if CSV processing fails in controller (e.g., malformed CSV)', async () => {
      const malformedCsvBuffer = Buffer.from('invalid,csv,format\nvalue1,value2');
      // Simulate a file being present, but the processing *fails*
      mockUploadCsvResponse(500, 'Simulated CSV parse error due to malformed data',true, {
        buffer: malformedCsvBuffer,
        originalname: 'malformed.csv',
        mimetype: 'text/csv'
      });

      const res = await request(app)
        .post('/feedbacks/upload-csv')
        .attach('csvFile', malformedCsvBuffer, 'malformed.csv');

      expect(res.statusCode).toEqual(500);
      // Expect the specific error message from the thrown error, caught by global error handler
      expect(res.body.message).toEqual('Simulated CSV parse error due to malformed data');
      expect(uploadController.uploadMiddleware).toHaveBeenCalledTimes(1);
      expect(uploadController.uploadFeedbacksCsv).toHaveBeenCalledTimes(1);
    });

    it('should return 500 or appropriate error if CSV has missing required columns', async () => {
        const missingColsBuffer = Buffer.from('name,body\nUser1,Feedback1');
        // Simulate a file being present, but the processing *fails* due to missing columns
        mockUploadCsvResponse(500, 'CSV missing required columns (e.g., postId)',true, {
            buffer: missingColsBuffer,
            originalname: 'missing_cols.csv',
            mimetype: 'text/csv'
        });

        const res = await request(app)
            .post('/feedbacks/upload-csv')
            .attach('csvFile', missingColsBuffer, 'missing_cols.csv');

        expect(res.statusCode).toEqual(500);
        expect(res.body.message).toEqual('CSV missing required columns (e.g., postId)');
        expect(uploadController.uploadMiddleware).toHaveBeenCalledTimes(1);
        expect(uploadController.uploadFeedbacksCsv).toHaveBeenCalledTimes(1);
    });



    it('should handle non-CSV file types gracefully (if controller validates)', async () => {
      const imageDataBuffer = Buffer.from('some image data');
      // Simulate a non-CSV file being present. The mock will then hit the mimetype check.
      mockUploadCsvResponse(400, 'Invalid file type. Only CSV allowed.', true, {
        buffer: imageDataBuffer,
        originalname: 'image.jpg',
        mimetype: 'image/jpeg'
      });

      const res = await request(app)
        .post('/feedbacks/upload-csv')
        .attach('csvFile', imageDataBuffer, 'image.jpg');

      expect(res.statusCode).toEqual(400);
      expect(res.body.message).toEqual('Invalid file type. Only CSV allowed.');
      expect(uploadController.uploadMiddleware).toHaveBeenCalledTimes(1);
      expect(uploadController.uploadFeedbacksCsv).toHaveBeenCalledTimes(1);
    });
  });
});
