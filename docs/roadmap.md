# Delivery roadmap

Status: Proposed  
Last updated: 2026-10-06

This roadmap uses outcome gates rather than calendar promises. A phase is complete only when its acceptance criteria pass.

## Phase 0: Foundation and reference capture

Deliverables:

- Approve product specification
- Record unresolved owner decisions
- Establish repository conventions
- Inventory reusable brand assets
- Export representative Unity puzzles
- Capture known boards for every supported hint strategy
- Define security exclusions for keys and credentials

Acceptance:

- Product scope is approved
- No signing key or secret is present in the repository
- Reference fixtures are sufficient to detect behavior changes

## Phase 1: Engine proof

Deliverables:

- TypeScript project setup
- Board and cell model
- Puzzle parser
- Candidate calculation
- Place, note, erase, reset, and undo commands
- Completion validation
- Initial legacy puzzle converter
- Automated unit tests

Acceptance:

- All four legacy difficulty samples load
- The same moves always produce the same state
- Invalid puzzles are rejected with useful diagnostics
- Core package has no React or browser dependency

## Phase 2: Interaction prototype

Deliverables:

- Home screen
- New-game selection
- Responsive game board
- Number pad and action controls
- Light and dark visual tokens
- Keyboard and pointer input
- Temporary in-memory game state

Acceptance:

- Usable on a small phone and desktop browser
- Board remains the primary visual element
- Complete game flow works without persistence
- Owner approves visual direction and interaction model

## Phase 3: Web MVP

Deliverables:

- IndexedDB persistence
- Continue game
- Timer and pause handling
- Settings and localization foundation
- Statistics
- Basic hints
- Sound
- PWA installation and offline behavior
- Error recovery
- End-to-end tests

Acceptance:

- Refresh, browser close, and offline reload preserve progress
- Traditional Chinese and English layouts do not clip
- Phone touch and desktop keyboard journeys pass
- Production build meets agreed performance targets

## Phase 4: Teaching hints

Deliverables:

- Semantic hint result model
- Progressive hint reveal
- Groups and intersection strategies
- Fish, coloring, cycle, and wing strategies
- Web Worker execution where required
- Per-strategy fixture and regression tests

Acceptance:

- Every enabled strategy has positive and negative fixtures
- Hint explanations never depend on theme colors
- Applying a hint produces a valid and auditable state change
- Long-running analysis cannot freeze board interaction

## Phase 5: Content and retention

Possible deliverables after prioritization:

- Expanded curated puzzle packs
- Daily Challenge
- Streaks
- Achievements
- Richer progress views
- Background puzzle generation
- Data export and import improvements

Acceptance criteria are defined when features enter scope.

## Phase 6: Native packaging

Deliverables:

- Capacitor Android and iOS projects
- App lifecycle integration
- Safe area and orientation handling
- Haptics
- Native advertising adapters
- Purchase and restore-purchase flow
- Privacy disclosures
- Store assets and release builds

Acceptance:

- Web game logic is unchanged
- Purchases and rewarded grants are idempotent
- Resume, suspend, offline, and upgrade scenarios pass on real devices
- Signed builds pass store pre-submission checks

## Recommended next implementation task

After approval of the documents:

1. Resolve the open product decisions.
2. Scaffold TypeScript, React, Vite, Vitest, and Playwright.
3. Define the first puzzle schema.
4. Convert one puzzle from each legacy difficulty.
5. Build the tested engine proof before styling the full application.
