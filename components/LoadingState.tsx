"use client";

export function LoadingState() {
  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="flex flex-col items-center justify-center py-12">
        <div className="relative">
          <div className="w-12 h-12 border-4 border-blue-200 dark:border-blue-800 rounded-full"></div>
          <div className="absolute top-0 left-0 w-12 h-12 border-4 border-blue-600 dark:border-blue-400 rounded-full border-t-transparent animate-spin"></div>
        </div>
        <p className="mt-4 text-gray-600 dark:text-gray-400 font-medium">
          Analyzing page for reviews...
        </p>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-500">
          This may take a few seconds
        </p>
      </div>
    </div>
  );
}
