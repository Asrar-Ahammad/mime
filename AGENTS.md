# Mime - Agent Documentation & Codebase Guide

Welcome to the **Mime** codebase! This document is specifically written to provide AI coding agents (like yourself) with context about the application's architecture, design language, state management, and feature set. Read this before making architectural changes or UI modifications.

## Project Overview
Mime is an automated job search and application tracking platform. It allows users to track applications, manage resumes, sync updates from their Gmail inbox, and use an autonomous AI browser agent to discover job postings across any web platform.

## Tech Stack
- **Frontend / Fullstack:** Next.js (App Router), React, TypeScript.
- **Styling:** Tailwind CSS v4, custom glass-morphism utilities, Lucide React icons.
- **Database:** Prisma ORM.
- **Authentication:** NextAuth (Auth.js) - Session is accessed via `auth()` in server components.
- **Python Backend (Agent):** Hosted on [Modal](https://modal.com/). Uses Playwright (with `playwright-stealth` v2) for browser automation, LangGraph/LangChain, and OpenAI GPT-4o for autonomous web scraping and DOM analysis.

## Key Features & Routes
- `app/(dashboard)/dashboard` - Main overview of applications.
- `app/(dashboard)/applications` - Job application tracker.
- `app/(dashboard)/resumes` - Resume management.
- `app/(dashboard)/emails` - Gmail inbox sync interface.
- `app/(dashboard)/agent` - The autonomous AI Job Agent UI. Users input a Target Platform URL and Keywords. The UI features a simulated terminal (`TerminalLoading`) while waiting for the Modal Python backend to return Markdown results.
- `app/(dashboard)/settings` - Global configuration. Uses a 1-column responsive layout with "Global Agent Parameters" and "Scheduled Execution" (Vercel Cron syncs at midnight UTC).

## Design System & Aesthetic Rules
CRITICAL: When building or modifying UI components, you must adhere to Mime's specific aesthetic constraints:
1. **Dark Mode First:** The app is heavily dark-mode styled.
2. **Glassmorphism:** Use the `.glass-card` utility class along with `bg-card/50 backdrop-blur shadow-lg border-border/40` for card containers.
3. **Icons:** Exclusively use `lucide-react` icons. Do not use `@phosphor-icons/react` or others.
4. **Interactive Elements:** Use `transition-smooth` for buttons and hover states. Primary buttons should have a glowing shadow (`shadow-lg shadow-primary/15`).
5. **Markdown Rendering:** For LLM outputs, use `react-markdown` with `remark-gfm`. Global typography styles for markdown (`.prose`) are manually defined in `app/globals.css` to bypass Tailwind resets.

## The Autonomous Modal Agent (`modal_agent/agent.py`)
- The agent is deployed serverlessly via Modal (`modal deploy agent.py`).
- It exposes a web endpoint `/api/agent/discover` (proxying from Next.js).
- **Stealth Browsing:** It uses pure Playwright with the `from playwright_stealth import Stealth` context manager (v2 syntax) to bypass Cloudflare.
- **Extraction:** The LangGraph agent reads the DOM (stripping scripts/styles), turns links into inline text with `(URL: https...)`, and uses GPT-4o to extract matching job listings.
- **Output:** It strictly returns standard Markdown with proper links `[Link Text](URL)`.

## Database (Prisma)
- The settings and global parameters are stored in the `agentConfig` table.
- When modifying the UI to remove legacy settings (like old job platforms), always preserve the underlying schema data flow to prevent Prisma crashes, unless instructed to run a migration.

## Development Workflows
- Next.js Dev Server: `bun run dev`
- Modal Deploy: `cd modal_agent && modal deploy agent.py`

*When completing a task, always ensure your UI additions respect the glass-morphism aesthetic and your server code handles Next.js App Router rules correctly.*
