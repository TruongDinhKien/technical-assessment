"use client";

import { use, Suspense, useState, useEffect } from "react";
import type { Feedback } from "server/global";
import { Pagination } from "./Pagination";
import { CsvUploadForm } from "./CsvUploadForm";
import { DEFAULT_ITEMS_PER_PAGE } from "~/constant";

interface PaginatedFeedbackResponse {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  data: Feedback[];
}

function RenderFeedbacks({ feedbackPromise }: { feedbackPromise: Promise<PaginatedFeedbackResponse> }) {
  const paginatedResponse: PaginatedFeedbackResponse = use(feedbackPromise);
  const feedbackEntries = paginatedResponse.data;

  if (!Array.isArray(feedbackEntries) || feedbackEntries.length === 0) {
    return <li className="p-3 text-gray-500 dark:text-gray-400">No feedback yet. Upload a CSV!</li>;
  }

  return (
    <>
      {feedbackEntries.map(({ id, name, body, postId, createdAt }) => (
        <li key={id} className="p-3 border-b border-gray-200 dark:border-gray-700 last:border-b-0 text-left">
          <p className="font-semibold text-gray-800 dark:text-gray-200">
            {name} (Post ID: {postId})
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">{body}</p>
        </li>
      ))}
    </>
  );
}

export function FeedbackContainer() {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(DEFAULT_ITEMS_PER_PAGE);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [feedbackPromise, setFeedbackPromise] = useState<Promise<PaginatedFeedbackResponse>>(
    Promise.resolve({ page: 1, limit: DEFAULT_ITEMS_PER_PAGE, totalItems: 0, totalPages: 1, data: [] })
  );
  const fetchFeedbacks = async () => {
    try {
      const response = await fetch(`http://localhost:3000/feedbacks?page=${currentPage}&limit=${itemsPerPage}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data: PaginatedFeedbackResponse = await response.json();
      setFeedbackPromise(Promise.resolve(data));
      setTotalItems(data.totalItems);
      setTotalPages(data.totalPages);
    } catch (error) {
      console.error("Failed to fetch feedbacks:", error);
      setFeedbackPromise(Promise.resolve({ page: currentPage, limit: itemsPerPage, totalItems: 0, totalPages: 1, data: [] }));
    }
  };
  useEffect(() => {
    fetchFeedbacks();
  }, [currentPage, itemsPerPage]); // Re-run effect when these dependencies change


  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleUploadSuccess = () => {
    setCurrentPage(1);
  };


  return (  
    <div className="flex flex-col items-center p-4">
      <CsvUploadForm onUploadSuccess={handleUploadSuccess} />
      <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-100">Feedback Entries</h2>
      <ul className="text-center w-full max-w-2xl bg-white dark:bg-gray-800 shadow-lg rounded-lg overflow-hidden">
        <Suspense fallback={<p className="p-3 h-200 text-gray-500 dark:text-gray-400">⌛ Loading feedback...</p>}>
          <RenderFeedbacks feedbackPromise={feedbackPromise} />
        </Suspense>
      </ul>

      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      )}
      {totalItems > 0 && (
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">Total Feedbacks: {totalItems}</p>
      )}
    </div>
  );
}