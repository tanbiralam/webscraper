import * as cheerio from "cheerio";

type CheerioAPI = ReturnType<typeof cheerio.load>;
type CheerioElement = ReturnType<CheerioAPI>;

// Class patterns that commonly indicate review content
const REVIEW_CLASS_PATTERNS = [
  "review",
  "comment",
  "testimonial",
  "feedback",
  "rating",
  "user-review",
  "customer-review",
];

// Selectors to ignore (navigation, footer, etc.)
const IGNORE_SELECTORS = [
  "nav",
  "header",
  "footer",
  ".nav",
  ".navigation",
  ".header",
  ".footer",
  ".sidebar",
  ".menu",
  '[role="navigation"]',
  '[role="banner"]',
  '[role="contentinfo"]',
];

export interface DetectedBlock {
  element: CheerioElement;
  type: "class" | "schema" | "repeated";
  confidence: number;
}

function isInIgnoredArea(
  $: cheerio.CheerioAPI,
  element: CheerioElement
): boolean {
  for (const selector of IGNORE_SELECTORS) {
    if (element.closest(selector).length > 0) {
      return true;
    }
  }
  return false;
}

// Detect by class name patterns
export function detectByClassName($: CheerioAPI): DetectedBlock[] {
  const blocks: DetectedBlock[] = [];

  for (const pattern of REVIEW_CLASS_PATTERNS) {
    $(`[class*="${pattern}"]`).each((_, el) => {
      const $el = $(el);

      if (isInIgnoredArea($, $el)) return;

      // Check if element has substantial text content
      const text = $el.text().trim();
      if (text.length < 20) return;

      blocks.push({
        element: $el,
        type: "class",
        confidence: 0.7,
      });
    });
  }

  return blocks;
}

// Detect schema.org Review markup
export function detectBySchema($: CheerioAPI): DetectedBlock[] {
  const blocks: DetectedBlock[] = [];

  // Check for JSON-LD reviews
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const json = JSON.parse($(el).html() || "");
      const items = Array.isArray(json) ? json : [json];

      items.forEach((item) => {
        if (item["@type"] === "Review" || item.review) {
          // Found review data in JSON-LD
          blocks.push({
            element: $(el),
            type: "schema",
            confidence: 0.9,
          });
        }
      });
    } catch {
      // Invalid JSON, skip
    }
  });

  // Check for itemtype Review
  $('[itemtype*="schema.org/Review"]').each((_, el) => {
    const $el = $(el);
    if (!isInIgnoredArea($, $el)) {
      blocks.push({
        element: $el,
        type: "schema",
        confidence: 0.9,
      });
    }
  });

  return blocks;
}

// Detect repeated similar structures that might be reviews
export function detectRepeatedBlocks($: CheerioAPI): DetectedBlock[] {
  const blocks: DetectedBlock[] = [];
  const MIN_SIMILAR_BLOCKS = 3;

  // Look for common list/article patterns in main content
  const containers = $(
    'main, article, [role="main"], .content, .reviews, .comments, #reviews, #comments'
  );

  const checkContainer = (container: CheerioElement) => {
    // Look for repeated children with similar structure
    const children = container.children();

    if (children.length < MIN_SIMILAR_BLOCKS) return;

    // Group by tag name
    const tagGroups: Map<string, CheerioElement[]> = new Map();

    children.each((_, el) => {
      const $el = $(el);
      const tagName = el.type === "tag" ? el.tagName.toLowerCase() : "";

      if (!tagName || isInIgnoredArea($, $el)) return;

      const text = $el.text().trim();
      if (text.length < 30) return;

      if (!tagGroups.has(tagName)) {
        tagGroups.set(tagName, []);
      }
      tagGroups.get(tagName)!.push($el);
    });

    // Check for groups with enough similar items
    tagGroups.forEach((elements) => {
      if (elements.length >= MIN_SIMILAR_BLOCKS) {
        elements.forEach(($el) => {
          blocks.push({
            element: $el,
            type: "repeated",
            confidence: 0.5,
          });
        });
      }
    });
  };

  if (containers.length > 0) {
    containers.each((_, el) => checkContainer($(el)));
  } else {
    // Fallback to body if no main content area found
    checkContainer($("body"));
  }

  return blocks;
}

export function detectReviewBlocks($: CheerioAPI): DetectedBlock[] {
  const schemaBlocks = detectBySchema($);
  const classBlocks = detectByClassName($);
  const repeatedBlocks = detectRepeatedBlocks($);

  // Combine and deduplicate, prioritizing by confidence
  const allBlocks = [...schemaBlocks, ...classBlocks, ...repeatedBlocks];

  // Simple deduplication - avoid nested elements
  const filtered: DetectedBlock[] = [];

  for (const block of allBlocks) {
    const html = block.element.html() || "";
    const isDuplicate = filtered.some((existing) => {
      const existingHtml = existing.element.html() || "";
      return existingHtml.includes(html) || html.includes(existingHtml);
    });

    if (!isDuplicate) {
      filtered.push(block);
    }
  }

  return filtered.sort((a, b) => b.confidence - a.confidence);
}
