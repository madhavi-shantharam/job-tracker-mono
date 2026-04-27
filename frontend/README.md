# Job Tracker UI — React Frontend

React + TypeScript frontend for the AI-powered Job Tracker application.

## Tech Stack

- **Framework**: React 18 + TypeScript
- **Build tool**: Vite
- **Styling**: Tailwind CSS
- **HTTP client**: Axios
- **Routing**: React Router v6

## Features

- Dashboard with live application stats and status badges
- Add / Edit application form with client-side validation
- AI Analyze page — paste JD + resume, get Claude-powered match analysis
- Toast notification system
- Responsive two-column layout

## Running Locally

### Prerequisites

- Node.js 18+
- Job Tracker backend running on `http://localhost:8080`

### Setup

```bash
npm install
npm run dev
```

App runs at `http://localhost:3000`. API calls proxy to `localhost:8080`.

## Project Structure

src/
├── api/ # All axios HTTP calls
├── components/ # Reusable UI components
├── context/ # React context (Toast)
├── hooks/ # Custom hooks
├── pages/ # Full page components
└── types/ # TypeScript interfaces

## Related

Backend repository: https://github.com/madhavi-shantharam/job-tracker
