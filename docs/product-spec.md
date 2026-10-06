# Product specification

Status: Draft for approval  
Product: Mercurius Sudoku web-first remake  
Last updated: 2026-10-06

## 1. Product vision

Mercurius Sudoku is a calm, polished Sudoku game that helps players improve. It should be fast to open, comfortable on phones and desktops, usable offline, and capable of explaining Sudoku techniques step by step.

The product is a remake, not a screen-for-screen Unity port.

## 2. Product principles

1. The board is always the visual priority during play.
2. Core play must work offline and without an account.
3. Hints teach before they reveal.
4. Every game-state transition must be deterministic and testable.
5. Web, Android, and iOS share one game experience; platform services are adapters.
6. Monetization must never interrupt an unfinished input action or obscure the board.
7. Accessibility and localization are designed in from the first release.

## 3. Target platforms

### First release

- Current desktop Chrome, Edge, Firefox, and Safari
- Current mobile Safari and Chrome
- Installable Progressive Web App
- Portrait and landscape layouts where space permits

### Later release

- Android application packaged with Capacitor
- iOS application packaged with Capacitor
- Native advertising, purchases, haptics, and store distribution

## 4. Target players

- Casual players who want a clean daily puzzle
- Returning Sudoku players who value notes, undo, and statistics
- Learners who want technique-based explanations
- Advanced players who use X-Wing, coloring, fish, and wing strategies

No login is required for the first release.

## 5. Core user journeys

### Start a game

1. Open the app.
2. Continue an unfinished game or select New Game.
3. Choose Easy, Medium, Hard, or Expert.
4. See a brief difficulty description and personal statistics.
5. Start immediately.

### Play

1. Select a cell.
2. Enter a number or toggle notes.
3. Use Undo, Erase, Reset, or Hint as needed.
4. Leave at any time; progress saves automatically.
5. Return and continue from the exact prior state.

### Request a hint

1. Ask for a hint.
2. Receive a highlighted area or observation first.
3. Reveal the applicable technique and explanation.
4. Optionally apply the recommended change.
5. The action remains undoable where appropriate.

### Complete a puzzle

1. The board locks after a valid solution.
2. Completion time and relevant statistics are recorded.
3. The result screen shows time, best time, hints used, and mistakes.
4. The player can start another game or return home.

## 6. MVP scope

### Home

- Continue current game
- New Game
- Statistics
- Settings
- Theme selection
- Clear indication when no saved game exists

### New Game

- Easy, Medium, Hard, and Expert
- Difficulty descriptions
- Completed count and best time per difficulty
- Random selection that prioritizes unseen puzzles
- Confirmation before replacing an unfinished game

### Game board

- Standard 9 by 9 Sudoku
- Clear 3 by 3 box boundaries
- Selected cell highlight
- Row, column, and box highlight
- Matching-number highlight
- Conflict and incorrect-entry presentation
- Given, player-entered, note, hint, and error states
- Responsive phone, tablet, and desktop layout

### Controls

- Number input from 1 to 9
- Notes mode
- Erase
- Undo
- Reset with confirmation
- Pause
- Keyboard controls on desktop
- Touch and pointer controls
- Configurable mistake display
- Configurable hiding of completed number buttons
- Unlimited mistakes; mistakes never end a game
- Placing a number automatically removes the same candidate from notes in its row, column, and box

### Save and resume

- Automatic local save after meaningful state changes
- One active unfinished puzzle in MVP
- Restore elapsed time, entries, notes, undo history, and settings
- Versioned save format with migration support
- Corrupt-save recovery without losing global statistics

### Basic hints

MVP includes:

- Incorrect answer detection
- Invalid note detection
- Candidate-note assistance
- Last blank in a unit
- Last remaining position for a digit
- Naked single
- Hidden single

Advanced strategies are post-MVP.

### Hint currency and advertising

- Hints remain a spendable local currency
- A rewarded advertisement grants exactly 3 hints after a verified completion callback
- Banner advertising remains in the product
- Puzzle completion, missions, streaks, and other gameplay events do not grant hints
- Reward grants must be idempotent so a repeated callback cannot duplicate hints
- Advertising is implemented through a platform adapter and never imported by the Sudoku engine

### Statistics

Per difficulty:

- Puzzles completed
- Best completion time
- Average completion time
- Total play time
- Hints used
- Mistakes
- No-hint completions

Overall:

- Current and longest completion streak
- Recently completed puzzles
- Data reset and export options

### Settings

- Music on or off
- Sound effects on or off
- Theme
- Show mistakes
- Hide completed numbers
- Language: Traditional Chinese or English
- Reduced motion
- Data reset

### Offline and installation

- App shell and bundled puzzle set work offline
- Installable PWA where supported
- Safe update flow that does not destroy saved games
- Friendly offline and update messages

## 7. Post-MVP scope

- Full teaching-oriented Smart Hint system
- Naked and hidden pairs, triples, and quads
- Intersection removal
- X-Wing, Swordfish, and Jellyfish
- Simple coloring and color wrap
- X-Cycle
- XY-Wing and XYZ-Wing
- Daily Challenge and Calendar
- Missions and Mercury Points progression
- Achievements and richer progress charts
- Background puzzle generation in a Web Worker
- Additional visual themes
- Android and iOS packaging
- Rewarded ads and remove-ads purchase
- Optional cloud sync or account system

## 8. Explicitly out of scope for MVP

- Multiplayer
- Social leaderboards
- Mandatory account creation
- Cloud synchronization
- Real-money competition
- Subscription plans
- In-app purchases
- One-to-one reproduction of Unity screens or internal classes
- Daily Challenge, Calendar stamps, and Missions
- Weekly Missions
- Public ranking and leaderboards
- Competitive anti-cheat systems

Banner and rewarded advertising remain in MVP scope, but are integrated after the ad-free game loop and persistence are stable.

## 9. Visual direction

Retain:

- Mercurius identity and Mercury symbol
- Aqua, navy, starlight, and subtle bubble motifs
- Light and dark themes
- A celebratory completion moment

Redesign:

- Reduce logo height on gameplay screens
- Use decoration mainly on home and completion screens
- Give the board maximum practical space
- Use one consistent icon family
- Reduce heavy outlines, gradients, and shadows
- Establish a clear type scale and spacing system
- Avoid text baked into images
- Support long translated labels without clipping

The Home screen evolves the original composition rather than replacing its identity:

- Retain the existing top bar concept
- Present three primary actions in the central area
- Reserve the left-side navigation area for Missions and Calendar when phase-two features are enabled
- Keep four themes available from the initial release
- Future unlockable themes cost 100 Mercury Points each

## 10. Localization and accessibility

- No user-facing strings inside game logic
- Traditional Chinese and English are the first target languages
- Layout must tolerate longer translations
- Keyboard-only play must be possible
- Visible focus states
- Screen-reader labels for controls and cells
- Do not rely on color alone for errors or selection
- Minimum practical touch target size
- Reduced-motion mode
- Appropriate contrast in every theme

## 11. Puzzle content

Initial direction:

- Use a versioned, validated puzzle format
- Bundle a larger curated starter library
- Keep puzzle definitions separate from player progress
- Preserve stable puzzle IDs across updates
- Validate every bundled puzzle for one solution
- Difficulty must be based on required solving techniques, not clue count alone
- Preserve the original Easy, Medium, Hard, and Expert generator behavior as the reference
- When a difficulty has fewer than 10 unseen puzzles, generate 10 additional puzzles

The original Unity JSON files may be converted after validation. They are reference data, not the permanent storage schema.

## 12. Data ownership and privacy

- MVP data remains on the device
- No analytics by default during prototype development
- Any future analytics must be documented and consent-aware
- Export and reset controls should be available
- Store credentials, signing keys, and ad identifiers must not enter the web source repository

## 13. MVP success criteria

The MVP is ready when:

- A player can finish games at all four difficulties on phone and desktop
- Reloading or closing the app never loses a valid move
- Core engine tests cover board rules, notes, undo, completion, save migration, and basic hints
- The game loads and remains playable offline after first successful load
- There are no blocking keyboard or touch interaction issues
- Lighthouse and real-device checks show acceptable startup and interaction performance
- A production build can be packaged by Capacitor without changing game logic

## 14. Confirmed product decisions

- Supported default languages: Traditional Chinese and English
- Mistakes are unlimited
- A placed number removes matching notes from its row, column, and box
- Hints remain a currency; a completed rewarded advertisement grants 3 hints
- Daily Challenge belongs to phase two
- The Mercurius visual identity is retained and modernized
- The first four themes are available immediately
- Records remain personal statistics only
- The application is local-first and any backend remains deliberately minimal

## 15. Remaining decisions

- Exact weekday-to-difficulty curve for Daily Challenge
- Definitions and completion conditions for mission IDs A01, A02, A03, B01, and B03
- Starting hint balance and the hint cost of each action
- Final public logo treatment
- Whether the original music and sound effects will be reused after web compression tests
