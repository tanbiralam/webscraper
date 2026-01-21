# Product: Review Scraper MVP

You are building a simple MVP web app using:

- Next.js (App Router)
- Tailwind CSS v4
- TypeScript

## Core Idea

The app has:

- A single input field where user pastes any URL
- A button: "Analyze"
- When clicked:
  - Backend fetches the HTML of the URL
  - Parses the page as plain HTML (no JS execution)
  - Tries to detect if the page contains reviews
  - If reviews are found:
    - Extract them
    - Return them to frontend
  - If not found:
    - Return "No reviews found"

- Frontend shows:
  - Total reviews found
  - List of reviews (text, author if available, rating if available)
  - Raw extracted data in a simple dashboard layout

## What counts as a "review"?

Look for:

- Common patterns like:
  - class names: "review", "comment", "testimonial", "rating"
  - schema.org Review markup
  - repeated blocks of text with author + text
- This is heuristic-based, not perfect.

## Backend Behavior

- Use a Next.js API route or Server Action
- Use:
  - fetch() or axios to download HTML
  - cheerio to parse HTML
- Never execute JS on the target page
- Only static HTML scraping

## Frontend

- Single page:
  - URL input
  - Submit button
  - Loading state
  - Results section:
    - Total reviews found
    - Cards for each review

## UX Requirements

- Show error if:
  - URL is invalid
  - Fetch fails
- Show loading spinner while analyzing
- Show "No reviews found" if none detected

## Code Quality

- Clean folder structure
- Separate:
  - scraping logic
  - parsing logic
  - API route
  - UI components

## Important Constraints

- This is an MVP
- Keep logic simple and heuristic-based
- No database
- No auth
- No queue
- No background jobs

Focus on:

- Shipping fast
- Readable code
- Simple architecture
