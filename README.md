# Wii Party

A LAN party leaderboard app for tracking competitive Wii game results. Players compete across multiple game stations, and the app tracks ELO rankings, win streaks, and live match status.

## Tech Stack

- **React 19** + **TypeScript**
- **Vite** — dev server & build tool
- **Tailwind CSS v4** — styling
- **Firebase Realtime Database** — real-time data sync across all clients

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- npm

### Installation

```bash
# Clone the repo
git clone https://github.com/stnkytofu/wii-party.git
cd wii-party

# Install dependencies
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Build for Production

```bash
npm run build
npm run preview
```

## How ELO Works

The rating system uses a placement-based ELO calculation:

- **Base delta** scales linearly from a small loss (last place) to a solid gain (1st place)
- **K-factor adjustment** (K=24) rewards beating higher-rated opponents
- **Streak bonus** — 15% ELO boost at 3+ consecutive wins
- **Chaos factor** — small random ±6 point swing to keep things spicy
- **Floor** — ELO cannot drop below 0

All players start at **1000 ELO**.