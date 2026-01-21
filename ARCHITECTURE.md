# Architecture: Review Scraper MVP

## Stack

- Next.js (App Router)
- Tailwind CSS v4
- TypeScript
- Cheerio (for HTML parsing)

---

## High-Level Flow

User
↓
Frontend (Next.js page)
↓
POST /api/analyze
↓
Fetcher: downloads HTML
↓
Parser: extracts review-like content
↓
Returns JSON
↓
Frontend renders results

---

## Folder Structure

/app
/api
/analyze
route.ts # POST endpoint
/page.tsx # Main UI

/lib
scraper.ts # Fetch HTML
parser.ts # Extract reviews
detectors.ts # Heuristics for detecting reviews

/components
UrlInput.tsx
ReviewList.tsx
ReviewCard.tsx
LoadingState.tsx

/types
review.ts

---

## API Contract

POST /api/analyze

Request:
{
"url": "https://example.com/product"
}

Response:
{
"success": true,
"reviewCount": 12,
"reviews": [
{
"author": "John",
"rating": 4,
"text": "Great product!"
}
]
}

Or:

{
"success": false,
"error": "No reviews found"
}

---

## Scraping Strategy

### Step 1: Fetch

- Use fetch(url)
- Get raw HTML string

### Step 2: Parse

- Load HTML into cheerio
- Search for:
  - Elements with class containing:
    - review
    - comment
    - testimonial
    - feedback
  - schema.org Review microdata
  - Repeated blocks of similar structure

### Step 3: Extract

For each detected review block:

- Try to extract:
  - text
  - author
  - rating (optional)

Normalize into:

{
text: string
author?: string
rating?: number
}

---

## Heuristics (MVP-level)

- If more than N (e.g. 3) similar blocks found → treat as reviews
- Ignore nav, footer, sidebar
- Prefer main content area

---

## Error Handling

- Invalid URL → return error
- Fetch failed → return error
- HTML parsed but no reviews → return "No reviews found"

---

## Non-Goals (For Now)

- No JS-rendered sites (no Puppeteer)
- No login
- No DB
- No saving results
- No crawling multiple pages
- No pagination

---

## Performance

- Timeout fetch after ~10s
- Limit HTML size
- Limit max reviews returned (e.g. 50)

---

## Security

- Validate URL
- Block:
  - localhost
  - private IPs
- Prevent SSRF

---

## Future Upgrade Ideas

- Add Playwright for JS-heavy sites
- Add Amazon / Google Maps specialized parsers
- Add sentiment analysis
- Add export CSV
- Add login & saved scans
