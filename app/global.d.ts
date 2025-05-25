interface PaginatedFeedbackResponse {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  data: Feedback[];
}