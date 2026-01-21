"use client";

import { ChangeEvent, FormEvent } from "react";

interface UrlInputProps {
  url: string;
  onUrlChange: (url: string) => void;
  onSubmit: () => void;
  isLoading: boolean;
  error?: string;
}

export function UrlInput({
  url,
  onUrlChange,
  onSubmit,
  isLoading,
  error,
}: UrlInputProps) {
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    onUrlChange(e.target.value);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSubmit();
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl mx-auto">
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="url"
          value={url}
          onChange={handleChange}
          placeholder="Enter URL to analyze (e.g., https://example.com/product)"
          className="flex-1 px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading || !url.trim()}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          {isLoading ? "Analyzing..." : "Analyze"}
        </button>
      </div>
      {error && (
        <p className="mt-2 text-red-600 dark:text-red-400 text-sm">{error}</p>
      )}
    </form>
  );
}
