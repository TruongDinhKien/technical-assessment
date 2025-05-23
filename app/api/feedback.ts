import type { Feedback } from "server/global";

async function getFeedbacks(): Promise<Feedback[]> {
  const response = await fetch("http://localhost:3000/feedbacks");

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Failed to fetch feedbacks: ${response.status} - ${errorBody}`);
  }

  const data = await response.json();

  return data.data as Feedback[];
  // if (Array.isArray(data.data)) {
  //   return data.data as Feedback[];
  // }
  // // If your API returns [...] directly
  // else if (Array.isArray(data)) {
  //   return data as Feedback[];
  // }
  // // If the structure is unexpected, throw an error or return an empty array
  // else {
  //   console.error("API response is not an array or does not contain a 'data' array:", data);
  //   // Optionally, return an empty array to prevent crashing
  //   return [];
  //   // Or throw a specific error
  //   // throw new TypeError("Unexpected API response format for feedbacks");
  // }
}

export { getFeedbacks };