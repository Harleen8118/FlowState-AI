# FlowState.ai

FlowState.ai is a landing page personalization engine that automatically aligns your page's copy with your ad creative to improve conversion rates and ad relevance.

## Key Features

-   **Ad Analysis**: Uses Gemini 2.0 Flash Vision to extract headline, CTA, tone, audience, and key benefits from ad creative (image or URL).
-   **Surgical Content Rewriting**: Dynamically modifies your landing page's HTML to align with the ad's message without breaking layout or functionality.
-   **Message Match Scoring**: Provides an instant 0–100 heuristic score comparing the page alignment before and after personalization.
-   **Premium Dark UI**: A modern, non-AI aesthetic with a charcoal palette and warm coral accents.
-   **Zero Infrastructure**: Pure client-side implementation with Proxy integration for HTML fetching.

## Tech Stack

-   **Frontend**: React, Vite, Material UI
-   **AI**: Google Gemini 2.0 Flash
-   **Styling**: Custom Theme (MUI) & CSS
-   **Utility**: Base64 image conversion, HTML sanitation, CORS Proxy integration

## Getting Started

1.  Clone the repository.
2.  Install dependencies: `npm install`.
3.  Start the development server: `npm run dev`.
4.  Open the application and provide your **Gemini API Key** in the modal when prompted.

## Usage

1.  Drop an ad creative image or provide an image URL.
2.  Provide the URL of the landing page you want to personalize.
3.  Click "Run Personalization".
4.  View the "Message Match Score" improvement and preview/download the personalized HTML.

## Development

Currently running as a Vite project.
- `npm run dev` - Start local development server
- `npm run build` - Create production build
