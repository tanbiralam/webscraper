import * as cheerio from "cheerio";
import { Review } from "@/types/review";
import { detectReviewBlocks, DetectedBlock } from "./detectors";

type CheerioAPI = ReturnType<typeof cheerio.load>;
type CheerioElement = ReturnType<CheerioAPI>;

const MAX_REVIEWS = 50;

function cleanText(text: string): string {
  return text.replace(/\s+/g, " ").replace(/\n+/g, " ").trim();
}

function extractRating($el: CheerioElement, $: CheerioAPI): number | undefined {
  // Try various rating patterns

  // Check for star rating in aria-label
  const ariaLabel = $el
    .find('[aria-label*="star"], [aria-label*="rating"]')
    .first()
    .attr("aria-label");
  if (ariaLabel) {
    const match = ariaLabel.match(/(\d+(?:\.\d+)?)/);
    if (match) return parseFloat(match[1]);
  }

  // Check for rating value in schema.org
  const ratingValue = $el
    .find('[itemprop="ratingValue"]')
    .first()
    .text()
    .trim();
  if (ratingValue) {
    const num = parseFloat(ratingValue);
    if (!isNaN(num)) return num;
  }

  // Check for class-based star ratings (e.g., "stars-4", "rating-5")
  const ratingClass = $el
    .find('[class*="star"], [class*="rating"]')
    .first()
    .attr("class");
  if (ratingClass) {
    const match = ratingClass.match(/(?:star|rating)s?-?(\d)/i);
    if (match) return parseInt(match[1]);
  }

  // Check for data attributes
  const dataRating =
    $el.find("[data-rating], [data-score]").first().attr("data-rating") ||
    $el.find("[data-rating], [data-score]").first().attr("data-score");
  if (dataRating) {
    const num = parseFloat(dataRating);
    if (!isNaN(num)) return num;
  }

  return undefined;
}

function extractAuthor($el: CheerioElement, $: CheerioAPI): string | undefined {
  // Try various author patterns

  // Schema.org author
  let author = $el.find('[itemprop="author"]').first().text().trim();
  if (author) return cleanText(author);

  // Common class patterns
  const authorSelectors = [
    ".author",
    ".reviewer",
    ".user-name",
    ".username",
    ".review-author",
    ".comment-author",
    '[class*="author"]',
    '[class*="reviewer"]',
    '[class*="user-name"]',
  ];

  for (const selector of authorSelectors) {
    author = $el.find(selector).first().text().trim();
    if (author && author.length < 100) {
      return cleanText(author);
    }
  }

  return undefined;
}

function extractReviewText($el: CheerioElement, $: CheerioAPI): string {
  // Try to find the main review text

  // Schema.org reviewBody
  let text = $el.find('[itemprop="reviewBody"]').first().text().trim();
  if (text) return cleanText(text);

  // Common text containers
  const textSelectors = [
    ".review-text",
    ".review-body",
    ".comment-text",
    ".comment-body",
    ".testimonial-text",
    '[class*="review-text"]',
    '[class*="comment-content"]',
    "p",
  ];

  for (const selector of textSelectors) {
    const found = $el.find(selector).first();
    if (found.length) {
      text = found.text().trim();
      if (text.length >= 20) {
        return cleanText(text);
      }
    }
  }

  // Fallback to element's full text
  return cleanText($el.text());
}

function extractFromJsonLd(html: string): Review[] {
  const reviews: Review[] = [];
  const $ = cheerio.load(html);

  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const json = JSON.parse($(el).html() || "");
      const processItem = (item: Record<string, unknown>) => {
        if (item["@type"] === "Review") {
          const review: Review = {
            text: cleanText(String(item.reviewBody || item.description || "")),
            author:
              typeof item.author === "object" && item.author !== null
                ? String((item.author as Record<string, unknown>).name || "")
                : String(item.author || ""),
            rating:
              typeof item.reviewRating === "object" &&
              item.reviewRating !== null
                ? Number(
                    (item.reviewRating as Record<string, unknown>).ratingValue
                  )
                : undefined,
          };
          if (review.text) reviews.push(review);
        }
        if (Array.isArray(item.review)) {
          item.review.forEach((r: unknown) =>
            processItem(r as Record<string, unknown>)
          );
        }
      };

      const items = Array.isArray(json) ? json : [json];
      items.forEach(processItem);
    } catch {
      // Invalid JSON, skip
    }
  });

  return reviews;
}

function extractFromBlocks(blocks: DetectedBlock[], $: CheerioAPI): Review[] {
  const reviews: Review[] = [];

  for (const block of blocks) {
    if (reviews.length >= MAX_REVIEWS) break;

    const text = extractReviewText(block.element, $);

    // Skip if text is too short or too long
    if (text.length < 20 || text.length > 5000) continue;

    const review: Review = {
      text,
      author: extractAuthor(block.element, $),
      rating: extractRating(block.element, $),
    };

    // Avoid duplicates
    const isDuplicate = reviews.some(
      (r) =>
        r.text === review.text ||
        r.text.includes(review.text) ||
        review.text.includes(r.text)
    );

    if (!isDuplicate) {
      reviews.push(review);
    }
  }

  return reviews;
}

export function parseReviews(html: string): Review[] {
  // First try JSON-LD structured data
  const jsonLdReviews = extractFromJsonLd(html);
  if (jsonLdReviews.length > 0) {
    return jsonLdReviews.slice(0, MAX_REVIEWS);
  }

  // Fall back to heuristic detection
  const $ = cheerio.load(html);
  const blocks = detectReviewBlocks($);
  const reviews = extractFromBlocks(blocks, $);

  return reviews.slice(0, MAX_REVIEWS);
}
