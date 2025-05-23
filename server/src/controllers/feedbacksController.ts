// src/controllers/feedbackController.ts
import { Request, Response } from 'express';
import { asc, count } from 'drizzle-orm';
import { database } from '../database/context';
import { feedback } from '../database/schema';
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 50;

export const getFeedbacks = async (request: Request, response: Response) => {
  const page = parseInt(request.query.page as string || '1', 10);
  const limit = Math.min(
    parseInt(request.query.limit as string || String(DEFAULT_LIMIT), 10),
    MAX_LIMIT
  );
  const offset = Math.max(0, (page - 1) * limit);

  try {
    const feedbackEntries = await database()
      .select()
      .from(feedback)
      .orderBy(asc(feedback.id))
      .limit(limit)
      .offset(offset);

    const totalCountResult = await database()
      .select({
        count: count()
      })
      .from(feedback);

    const totalItems = totalCountResult[0].count;
    const totalPages = Math.ceil(totalItems / limit);

    return response.status(200).json({
      page,
      limit,
      totalItems,
      totalPages,
      data: feedbackEntries,
    });

  } catch (error) {
    console.error("Error fetching feedbacks with Drizzle:", error);
    return response.status(500).json({ error: "Internal Server Error" });
  }
};
