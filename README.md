# Mercurius Sudoku

Mercurius Sudoku is a web-first remake of the original Unity mobile game.

The new edition keeps the strongest parts of the original project—Sudoku rules, puzzle knowledge, smart hint strategies, brand identity, and proven gameplay ideas—while rebuilding the product for the web instead of porting the Unity application screen by screen.

## Product direction

- Mobile-first responsive web application
- Comfortable desktop and tablet experience
- Offline-capable Progressive Web App
- Android and iOS packaging through Capacitor after the web version is stable
- A teaching-oriented hint system that explains techniques instead of only revealing answers
- A platform-independent Sudoku engine with automated tests

## Current status

Foundation implementation has started. The repository now contains:

- A Vite, React, and TypeScript application shell
- A platform-independent Sudoku core
- Legacy Unity puzzle conversion
- Reference fixtures from all four original difficulties
- Automated tests for input, notes, mistakes, undo, candidates, completion, and legacy conversion

Read the project documents before development:

- [Product specification](docs/product-spec.md)
- [Technical architecture](docs/architecture.md)
- [Delivery roadmap](docs/roadmap.md)
- [Phase-two progression rules](docs/phase-two-rules.md)
- [Unity source audit](docs/legacy-audit.md)
- [Architecture decision: web-first remake](docs/decisions/0001-web-first-remake.md)

## Local development

Requirements: Node.js and pnpm.

1. Install dependencies with pnpm install.
2. Start the development server with pnpm dev.
3. Run the test suite with pnpm test:run.
4. Create a production build with pnpm build.

## Initial technology direction

- TypeScript
- React
- Vite
- IndexedDB
- Web Workers
- PWA
- Capacitor for Android and iOS packaging

The Sudoku engine must remain independent from React and Capacitor.

## Source project

The Unity project is a reference implementation and an asset/knowledge source. It is not intended to be copied into this repository wholesale. Signing keys, store credentials, generated Unity folders, and platform secrets must never be committed here.

## Project language

Code and technical identifiers use English. User-facing copy is designed for localization from the beginning, with Traditional Chinese and English as the first target languages.

## License

No license has been selected yet. All rights reserved until a license is explicitly added.
