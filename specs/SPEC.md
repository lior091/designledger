build the "Artifact Gallery" — a Neo-Industrial design ledger (React + Tailwind, not Next.js). Let me plan the architecture:

Key Features:

Minting Engine — Paste Slack text, AI extracts URLs/summaries/cover art
Gallery — Square "CD Cover" cards with technical data rails
Research Layer — One-sentence insights, maturity status, peer endorsements
Anti-Aging — Legacy badges, decay opacity for stale artifacts
Review Flow — Draft → Published workflow
Design System:

Neo-Industrial: #0D0D0D background, monoline borders, SF Mono typography
Glassmorphism data rails, high-contrast accents
Color palette: Deep black bg, warm amber accents, cool steel grays
Structure:

Entity: Artifact (url, title, research_summary, cover_url, status, endorsement_count, etc.)
Pages: Gallery (home), Minting Engine (admin), Artifact Detail
Components: ArtifactCard, TechnicalRail, MintingForm, StatusBadge, etc.



I. Project Vision & Aesthetic
The "Artifact Gallery" transforms ephemeral Slack messages into a permanent "Design Ledger".

Aesthetic: Neo-Industrial—characterized by minimalist monoline strokes, tactile schematic layouts, and high-end technical vector art.

Goal: Create a visual knowledge base for 44 designers that features "deliberate friction" (intentional review) rather than frictionless clutter.

The Artifact: Each article is rendered as a square "CD Cover" with a technical data rail for research and recommendations.

II. Technical Architecture (AI-Optimized)
This stack is optimized for building within Cursor or Claude using a "Zero-Infra" approach.

Front-End: Next.js 14 (App Router) with Tailwind CSS.

Database/Storage: Supabase (PostgreSQL for metadata, Bucket storage for images).

AI Logic:

Parsing/Summary: Claude 3.5 Sonnet API.

Visual Generation: DALL-E 3 or Flux via API.

III. Core Features & Requirements
1. The "Minting" Engine (Manual Batch Input)
Paste Area: A specialized admin page where you paste raw text from Slack.

AI Parsing: The system identifies URLs and uses the "AppSec UX 2030" vision style to summarize the article's core thesis into one sentence.

Cover Generation: AI generates an abstract, technical cover art piece for each unique link.

2. Research & Recommendations (Metadata Layer)
One-Sentence Insight: A concise summary of the "Research" layer visible on the card.

Maturity Status: Every card displays a status: Assess (Fresh), Trial (In-use), or Adopt (Company Standard).

Peer Endorsement: A counter showing how many of the 44 designers have "stamped" the artifact as a proven truth.

3. Anti-Aging Mechanism
Vintage Badging: Articles older than 6 months gain a "Legacy" badge, requiring re-validation.

Decay Logic: Cards not interacted with in 3 months slowly "fade" (lower opacity) to keep current trends prominent.

IV. Step-by-Step Implementation Plan
Phase 1: Database & Scaffolding
Prompt Cursor/Claude to set up the foundation:

"Initialize a Next.js project with Tailwind. Create a Supabase table named artifacts with columns for url, title, research_summary, cover_url, status, and endorsement_count."

Phase 2: The Parsing Logic
Build the Batch Entry system:

"Create a Next.js API route that accepts a string of text. Use Claude 3.5 Sonnet to extract URLs, generate a 20-word visual prompt for a CD cover (technical/schematic style), and write a 1-sentence research insight for each."

Phase 3: The High-Fidelity Gallery
Implement the Neo-Industrial UI:

"Design a CSS grid of square 'Artifact' cards. Use 1px monoline borders, #0D0D0D background, and SF Mono typography. The bottom 30% of each card should be a glassmorphism 'Technical Rail' showing the research summary and status icons."

Phase 4: Manual Review & Publish
Create a "Preview" state where you can review the AI-generated covers and summaries before they are officially "minted" into the permanent ledger.

V. Maintenance Rituals
The Batch Paste: Every two weeks, paste the Slack highlights into the Minting Engine.

The Stamp of Truth: Senior designers review "Assess" items and move them to "Adopt" if they meet "Premium UX" standards.

## articles harness
specs/design_bookmarks_full.json