# SRL

SRL is a focused, beginner-friendly piano sight-reading practice app built with React and TypeScript.

## Features

- Guided setup for training ranges (treble, bass, and grand staff presets)
- Practice session flow with real-time note input handling
- MIDI keyboard support via the Web MIDI API
- Session results tracking (accuracy, speed, and improvement hints)
- Offline-first persistence using IndexedDB (settings, custom trainings, and session runs)

## Tech Stack

- React 19
- TypeScript
- Vite
- React Router
- Vitest + ESLint + Prettier

## Getting Started

### Prerequisites

- Node.js 20+ (recommended)
- npm

### Install

```bash
npm install
```

### Run in Development

```bash
npm run dev
```

Open the local URL shown by Vite (usually `http://localhost:5173`).

## Browser Notes

- MIDI features require a browser with Web MIDI API support.
- If MIDI is unavailable or permission is denied, the app continues with non-MIDI flows.
- Data is stored locally in your browser via IndexedDB.
