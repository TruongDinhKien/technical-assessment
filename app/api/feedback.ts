import { BASE_URL } from "~/constant";

async function getFeedbacks(queryParams: URLSearchParams) {
  const response = await fetch(`${BASE_URL}/feedbacks?${queryParams.toString()}`);
  if (!response.ok)
    throw new Error(`HTTP error! status: ${response.status}`);

  const data: PaginatedFeedbackResponse = await response.json();

  return data
}

async function postFeedbacks(formData: FormData) {
  const response = await fetch(`${BASE_URL}/feedbacks/upload-csv`, {
    method: "POST",
    body: formData,
  });

  return response
}

export { getFeedbacks, postFeedbacks };