"use client";

import { useState, type FC } from "react";

interface CsvUploadFormProps {
  onUploadSuccess?: () => void;
  onUploadError?: (message: string) => void;
}

export const CsvUploadForm: FC<CsvUploadFormProps> =
  ({ onUploadSuccess = () => { }, onUploadError = () => { } }) => {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [message, setMessage] = useState("");

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      if (event.target.files && event.target.files[0]) {
        setSelectedFile(event.target.files[0]);
        setMessage("");
      } else {
        setSelectedFile(null);
      }
    };

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!selectedFile) {
        setMessage("Please select a CSV file first.");
        return;
      }

      setUploading(true);
      setMessage("Uploading...");

      const formData = new FormData();
      formData.append("csvFile", selectedFile);

      try {
        const response = await fetch("http://localhost:3000/feedbacks/upload-csv", {
          method: "POST",
          body: formData,
        });

        const result = await response.json();

        if (response.ok) {
          setMessage(result.message || "CSV uploaded successfully!");
          setSelectedFile(null);
          onUploadSuccess();
        } else {
          const errorMessage = result.error || "Failed to upload CSV.";
          setMessage(`Error: ${errorMessage}`);
          onUploadError(errorMessage);
        }
      } catch (error) {
        console.error("Upload failed:", error);
        setMessage("Error: Network error or server unavailable.");
        onUploadError("Error: Network error or server unavailable.");
      } finally {
        setUploading(false);
      }
    };

    return (
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md mb-6 w-full max-w-md">
        <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-100">Upload Feedback CSV</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="file"
              id="csv-upload"
              accept=".csv"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-md file:border-0
              file:text-sm file:font-semibold
              file:bg-blue-50 file:text-blue-700
              hover:file:bg-blue-100 dark:file:bg-blue-900 dark:file:text-blue-300 dark:hover:file:bg-blue-800"
            />
          </div>
          <button
            type="submit"
            disabled={!selectedFile || uploading}
            className="w-full px-4 py-2 rounded-md bg-green-600 text-white font-semibold
            hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed
            transition-colors duration-200 shadow-md"
          >
            {uploading ? "Uploading..." : "Upload CSV"}
          </button>
          {message && (
            <p className={`text-sm mt-2 ${message.startsWith("Error") ? "text-red-500" : "text-green-600"}`}>{message}</p>
          )}
        </form>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">
          *CSV should have columns like  'postId', 'id', 'name', 'body', 'email'.
        </p>
      </div>
    );
  };
