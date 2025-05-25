import { Request, Response } from 'express';
import { asc, count, ilike, or } from 'drizzle-orm';
import { database } from '../database/context';
import { feedback } from '../database/schema';
import { DEFAULT_LIMIT, MAX_LIMIT } from '../constant';

export const getFeedbacks = async (request: Request, response: Response) => {
  let page = parseInt(request.query.page as string || '1', 10);
  if (isNaN(page) || page < 1) {
    page = 1;
  }
  let limit = Math.min(
    parseInt(request.query.limit as string, 10),
    MAX_LIMIT
  );
  if( isNaN(limit) || limit < 1) {
    limit = DEFAULT_LIMIT;
  }
  const searchTerm = request.query.search as string | undefined;

  const offset = Math.max(0, (page - 1) * limit);

  try {
    const db = database();

    let searchCondition;
    if (searchTerm) {
      searchCondition = or(
        ilike(feedback.name, `%${searchTerm}%`),
        ilike(feedback.body, `%${searchTerm}%`)
      );
    }

    const feedbackEntries = await db
      .select()
      .from(feedback)
      .where(searchCondition)
      .orderBy(asc(feedback.id))
      .limit(limit)
      .offset(offset);

    const totalCountResult = await db
      .select({
        count: count()
      })
      .from(feedback)
      .where(searchCondition); 

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