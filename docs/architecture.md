# Architecture

## Local-First Model
The application consists of two local services:
1. **Frontend (React/Vite)**: Runs on localhost and powers the dashboard UI and logic.
2. **Backend (Node.js/Express)**: Manages local browser automation via Playwright.

## Flow
1. User clicks "Connect".
2. Backend launches local Playwright.
3. User manually authenticates.
4. Backend extracts DOM data, normalizes it, and sends it to Frontend.
5. All state is cleared on disconnect.
