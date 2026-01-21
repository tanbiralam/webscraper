import { NextRequest, NextResponse } from "next/server";
import { fetchHtml } from "@/lib/scraper";
import { parseReviews } from "@/lib/parser";
import { AnalyzeResponse } from "@/types/review";

export async function POST(
  request: NextRequest
): Promise<NextResponse<AnalyzeResponse>> {
  try {
    const body = await request.json();
    const { url } = body;

    if (!url || typeof url !== "string") {
      return NextResponse.json(
        {
          success: false,
          error: "URL is required",
        },
        { status: 400 }
      );
    }

    // Fetch HTML with validation and security checks
    const { html, error: fetchError } = await fetchHtml(url);

    if (fetchError) {
      return NextResponse.json(
        {
          success: false,
          error: fetchError,
        },
        { status: 400 }
      );
    }

    // Parse and extract reviews
    const reviews = parseReviews(html);

    if (reviews.length === 0) {
      return NextResponse.json({
        success: false,
        error: "No reviews found",
      });
    }

    return NextResponse.json({
      success: true,
      reviewCount: reviews.length,
      reviews,
    });
  } catch (error) {
    console.error("Analyze error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "An unexpected error occurred",
      },
      { status: 500 }
    );
  }
}
