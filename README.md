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

The repository is in the product-definition stage. Implementation has not started.

Read the project documents before development:

- [Product specification](docs/product-spec.md)
- [Technical architecture](docs/architecture.md)
- [Delivery roadmap](docs/roadmap.md)
- [Architecture decision: web-first remake](docs/decisions/0001-web-first-remake.md)

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
