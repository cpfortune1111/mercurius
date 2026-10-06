# Unity source audit

Status: Initial static audit complete  
Source: local Unity project at F:\\Sudoku  
Audit date: 2026-10-06

## Source-of-truth areas inspected

- Puzzle data and legacy JSON format
- Easy, Medium, Hard, and Expert puzzle packs
- Generator and uniqueness checks
- Difficulty score and strategy metadata
- Board input, notes, erase, undo, and completion flow
- Smart Hint strategy registry and presentation coupling
- Save data and per-difficulty statistics
- Advertising and hint rewards
- Themes, visual assets, audio, and recorded screens

## Confirmed reusable knowledge

- Four difficulty groups
- Unseen-puzzle preference
- Supply rule based on fewer than 10 unseen puzzles
- Generator, solver, and uniqueness concepts
- Stable puzzle IDs and seed metadata
- Notes, undo, reset, continue, and personal records
- Advanced strategy knowledge through fish, coloring, cycles, and wings
- Mercurius visual identity and four-theme direction

## Migration constraints

- Unity scene and UI classes are not copied into the new architecture
- Legacy puzzle tokens store solution digits as zero-based values; a token prefixed with t is a given
- Display value follows 1 + ((raw value + shift amount) modulo board size)
- Puzzle definitions and player progress must become separate records
- File-system persistence and PlayerPrefs must be replaced by web persistence adapters
- Runtime generation and advanced analysis must not block the browser UI thread
- AdMob, in-app purchases, Android audio, and Unity lifecycle code require platform adapters

## Engineering risks found

- No automated unit-test suite in the Unity source
- Several very large, tightly coupled gameplay and hint files
- Damaged text encoding in many source comments
- Old asset import errors in retained Unity logs
- Large uncompressed WAV footprint unsuitable for direct web delivery
- Signing material and generated store credential code exist in the Unity project and must never be copied here

## Reference fixtures

The first implementation stage imports one puzzle from each legacy difficulty as test data. Additional fixtures are required before advanced hint strategies are ported.
