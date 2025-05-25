"use client";

import { use, Suspense, useState, useEffect, useCallback } from "react";
import { Pagination } from "./Pagination";
import { CsvUploadForm } from "./CsvUploadForm";
import { DEBOUNDED_SEARCH_DELAY, DEFAULT_ITEMS_PER_PAGE } from "~/constant";
import { useDebounce } from "~/hooks/useDebounce";
import { getFeedbacks } from "~/api/feedback";

function RenderFeedbacks({ feedbackPromise, searchTerm }: { feedbackPromise: Promise<PaginatedFeedbackResponse>, searchTerm?: string }) {
  const paginatedResponse: PaginatedFeedbackResponse = use(feedbackPromise);
  const feedbackEntries = paginatedResponse.data || [];

  if (!Array.isArray(feedbackEntries) || feedbackEntries.length === 0) {
    if (searchTerm)
      return <li className="p-3 text-gray-500 dark:text-gray-400">No feedback found for "{searchTerm}"</li>;
    else
      return <li className="p-3 text-gray-500 dark:text-gray-400">No feedback yet. Upload a CSV!</li>;
  }

  return (
    <>
      {feedbackEntries.map(({ id, name, body, postId, createdAt }) => (
        <li key={id} className="p-3 border-b border-gray-200 dark:border-gray-700 last:border-b-0 text-left h-28 md:h-20">
          <p className="font-semibold text-gray-800 dark:text-gray-200">
            {name} (Post ID: {postId})
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap line-clamp-2">{body}</p>
        </li>
      ))}
    </>
  );
}

export function FeedbackContainer() {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(DEFAULT_ITEMS_PER_PAGE);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, DEBOUNDED_SEARCH_DELAY);

  const [feedbackPromise, setFeedbackPromise] = useState<Promise<PaginatedFeedbackResponse>>(
    Promise.resolve({ page: 1, limit: DEFAULT_ITEMS_PER_PAGE, totalItems: 0, totalPages: 1, data: [] })
  );

  const fetchFeedbacks = useCallback(async () => {
    try {
      const queryParams = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
      });

      if (debouncedSearchTerm)
        queryParams.append('search', debouncedSearchTerm);

      const data = await getFeedbacks(queryParams)
      setFeedbackPromise(Promise.resolve(data));
      setTotalItems(data.totalItems);
      setTotalPages(data.totalPages);
    } catch (error) {
      console.error("Failed to fetch feedbacks:", error);
      setFeedbackPromise(Promise.resolve({ page: currentPage, limit: itemsPerPage, totalItems: 0, totalPages: 1, data: [] }));
    }
  }, [currentPage, itemsPerPage, debouncedSearchTerm]);



  useEffect(() => {
    fetchFeedbacks();
  }, [fetchFeedbacks]);


  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleUploadSuccess = () => {
    setCurrentPage(1);
    setSearchTerm('');
    setTimeout(() => {

      fetchFeedbacks()
    }, DEBOUNDED_SEARCH_DELAY);
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setSearchTerm(value);
    setCurrentPage(1);
  };


  return (
    <div className="flex flex-col items-center p-4">
      {/* Search Bar */}
      <div className="mb-4 w-full max-w-2xl">
        <CsvUploadForm onUploadSuccess={handleUploadSuccess} />

        <input
          type="text"
          placeholder="Search feedbacks by name or body..."
          value={searchTerm}
          onChange={handleSearchChange}
          className="w-full p-2 border border-gray-300 rounded-md shadow-sm
                     focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                     dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
        />
      </div>

      <ul className="text-center w-full max-w-2xl bg-white dark:bg-gray-800 shadow-lg rounded-lg overflow-hidden">
        <Suspense fallback={<div className="p-3 h-140 md:h-100 text-gray-500 dark:text-gray-400 place-content-center">⌛ Loading feedback...</div>}>
          <RenderFeedbacks feedbackPromise={feedbackPromise} searchTerm={searchTerm} />
        </Suspense>
      </ul>
      {totalItems > 1 &&
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      }
      {totalItems > 0 && (
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">Total Feedbacks: {totalItems}</p>
      )}
    </div>
  );
}