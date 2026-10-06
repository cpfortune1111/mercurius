# Technical architecture

Status: Proposed  
Last updated: 2026-10-06

## 1. Architecture goals

- Keep Sudoku rules independent from the user interface.
- Make every rule and hint strategy testable without a browser.
- Share one web codebase across browsers and Capacitor applications.
- Keep platform-specific services behind interfaces.
- Support offline play and safe data migration.
- Avoid carrying Unity framework patterns into the new application.

## 2. Proposed stack

- TypeScript
- React for application screens and interactive UI
- Vite for development and production builds
- Vitest for unit and integration tests
- Playwright for browser journeys
- IndexedDB for durable local data
- Web Workers for expensive solving and generation work
- Service Worker and Web App Manifest for PWA behavior
- Capacitor for Android and iOS packaging after the web MVP

Library choices should remain minimal. A dependency is accepted only when it removes meaningful maintenance risk.

## 3. Module boundaries

### core

Pure TypeScript with no React, DOM, storage, network, or Capacitor imports.

Responsibilities:

- Board and cell models
- Legal-move and candidate calculation
- Move commands
- Notes behavior
- Undo and redo state
- Completion validation
- Puzzle parsing and validation
- Solver and uniqueness checks
- Hint strategy contracts and results
- Deterministic serialization types

### content

Responsibilities:

- Versioned puzzle schema
- Bundled puzzle packs
- Puzzle validation reports
- Legacy Unity puzzle conversion
- Difficulty metadata and technique requirements

### application

Responsibilities:

- New-game orchestration
- Active-game lifecycle
- Timer behavior
- Hint progression
- Statistics updates
- Settings
- Data migrations
- Platform service coordination

### ui

Responsibilities:

- React screens and components
- Responsive layouts
- Input handling
- Accessibility
- Animation and sound triggers
- Localization rendering

The UI may ask the application layer to perform an action. It must not modify board state directly.

### persistence

Responsibilities:

- IndexedDB repositories
- Atomic active-game saves
- Statistics storage
- Settings storage
- Schema versioning and migrations
- Import and export
- Recovery from invalid records

### workers

Responsibilities:

- Puzzle validation
- Uniqueness checks
- Advanced hint analysis
- Future puzzle generation

Worker messages use explicit versioned request and response types.

### platform

Responsibilities:

- Browser implementation
- Capacitor implementation
- Haptics
- Advertising
- Purchases
- App lifecycle
- External links
- Optional analytics

Game logic must not know which platform adapter is active.

## 4. Suggested source layout

- src/app
- src/core
- src/content
- src/features/game
- src/features/home
- src/features/settings
- src/features/statistics
- src/persistence
- src/platform
- src/ui
- src/workers
- src/locales
- tests/fixtures
- tests/e2e
- public/assets
- docs/decisions

Exact folders may change during scaffolding, but the dependency direction must remain:

UI to application to core.

Platform and persistence implement interfaces owned by the application layer.

## 5. State model

Use explicit commands for player actions:

- Select cell
- Place number
- Toggle note
- Erase cell
- Undo move
- Reset puzzle
- Request hint
- Apply hint
- Pause or resume

A command produces a new game state and optional domain events. Domain events drive sound, animation, statistics, and persistence without embedding those concerns in the engine.

## 6. Persistence model

Separate records:

- settings
- active game
- puzzle progress
- aggregate statistics
- content-pack metadata
- application schema metadata

Do not update the bundled puzzle definition when a player completes a puzzle. Completion data references a stable puzzle ID.

Every saved object includes:

- schema version
- updated timestamp
- stable identifiers
- checksum or validation where useful

Migration failures must preserve the original record for recovery.

## 7. Puzzle schema direction

A puzzle definition should include:

- stable ID
- schema version
- size and box dimensions
- givens
- complete solution or a verified solution reference
- difficulty
- required strategies
- source and content version

Player state should include:

- puzzle ID
- elapsed time
- entries
- notes
- mistake count
- hint history
- undo stack
- completion state

The permanent schema will be finalized after legacy sample conversion and tests.

## 8. Hint engine contract

A hint result should describe meaning, not UI colors.

Suggested information:

- strategy identifier
- localization message key and parameters
- focus cells
- candidate cells
- elimination cells and digits
- placement cell and digit
- logical links
- ordered explanation steps
- optional action that may be applied

The UI maps semantic roles to theme colors and animations. This prevents the current tight coupling between hint logic and presentation.

## 9. Testing strategy

### Unit tests

- Candidate calculation
- Move legality
- Notes behavior
- Undo boundaries
- Completion validation
- Puzzle parsing
- Save serialization
- Each hint strategy using fixed boards
- Solver uniqueness

### Integration tests

- Start, save, reload, and complete a game
- Replace an active game
- Apply and undo hints
- Data migrations
- Worker request and cancellation behavior

### End-to-end tests

- Phone viewport touch flow
- Desktop keyboard flow
- Offline reload
- Theme and language switching
- Corrupt-save recovery
- PWA update flow

Legacy Unity puzzles and known hint cases should become fixtures before algorithms are rewritten.

## 10. Performance boundaries

- The playable screen should not wait for advanced solver initialization.
- Puzzle packs are loaded by difficulty, not as one unbounded payload.
- Audio uses compressed web formats and lazy loading.
- Heavy validation and generation run outside the main UI thread.
- Board interaction must remain responsive during saving.
- Decorative animation respects reduced motion and pauses when hidden.

## 11. Security and release hygiene

Never commit:

- Android keystores
- Apple signing certificates or profiles
- Store API keys
- Advertising secrets
- Production environment files
- Unity generated credential-obfuscation files

Use environment templates containing names only. Production secrets belong in approved CI or store systems.

## 12. Decision gates

Before application scaffolding:

- Approve the product specification
- Resolve the high-impact open product decisions
- Confirm package manager
- Confirm the initial supported languages

Before Smart Hint migration:

- Build the fixture suite from the Unity reference
- Finalize semantic hint result types
- Define expected behavior for notes and applied hints

Resolved on 2026-10-06:

- Traditional Chinese and English are the initial languages
- Mistakes are unlimited
- Placing a digit removes the same note from all row, column, and box peers
- Daily Challenge is phase two
- Hints remain a currency and a rewarded advertisement grants 3 hints

Before Capacitor work:

- Web MVP passes real mobile browser tests
- Persistence survives PWA updates
- Platform service interfaces are stable
