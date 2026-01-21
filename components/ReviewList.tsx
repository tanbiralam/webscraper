"use client";

import { Review } from "@/types/review";
import { ReviewCard } from "./ReviewCard";

interface ReviewListProps {
  reviews: Review[];
  reviewCount: number;
}

export function ReviewList({ reviews, reviewCount }: ReviewListProps) {
  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
        <div className="flex items-center gap-2">
          <svg
            className="w-5 h-5 text-green-600 dark:text-green-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span className="font-medium text-green-700 dark:text-green-300">
            Found {reviewCount} review{reviewCount !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      <div className="grid gap-4">
        {reviews.map((review, index) => (
          <ReviewCard key={index} review={review} index={index} />
        ))}
      </div>
    </div>
  );
}
