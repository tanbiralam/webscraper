"use client";

import { useState } from "react";
import { UrlInput } from "@/components/UrlInput";
import { ReviewList } from "@/components/ReviewList";
import { LoadingState } from "@/components/LoadingState";
import { AnalyzeResponse } from "@/types/review";

export default function Home() {
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [result, setResult] = useState<AnalyzeResponse | null>(null);

  const handleAnalyze = async () => {
    if (!url.trim()) return;

    setIsLoading(true);
    setError(undefined);
    setResult(null);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url: url.trim() }),
      });

      const data: AnalyzeResponse = await response.json();

      if (!data.success) {
        setError(data.error || "Failed to analyze URL");
      } else {
        setResult(data);
      }
    } catch {
      setError("Failed to connect to server. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Review Scraper
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-xl mx-auto">
            Enter any URL to analyze and extract reviews from the page. Works
            with product pages, testimonials, and review sections.
          </p>
        </header>

        {/* URL Input */}
        <section className="mb-12">
          <UrlInput
            url={url}
            onUrlChange={setUrl}
            onSubmit={handleAnalyze}
            isLoading={isLoading}
            error={error}
          />
        </section>

        {/* Results */}
        <section>
          {isLoading && <LoadingState />}

          {!isLoading && result?.success && result.reviews && (
            <ReviewList
              reviews={result.reviews}
              reviewCount={result.reviewCount || 0}
            />
          )}

          {!isLoading && !result && !error && (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 mb-4">
                <svg
                  className="w-8 h-8 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              <p className="text-gray-500 dark:text-gray-400">
                Enter a URL above to start analyzing
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
