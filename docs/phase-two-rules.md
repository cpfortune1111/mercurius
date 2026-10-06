# Phase-two progression rules

Status: Confirmed baseline with two outstanding definitions  
Last updated: 2026-10-06

## Home navigation

- Retain the original top bar concept
- Show three primary actions in the central area
- Keep Missions and Calendar entry points on the left side

## Daily Challenge

- The date comes from a minimal authoritative server-date endpoint
- All players receive the same puzzle for the same date
- Difficulty follows a fixed weekday curve
- A Daily puzzle cannot be restarted
- An unfinished Daily puzzle can be continued
- Only the first completion grants rewards
- First completion grants 5 Mercury Points and that day's Calendar stamp
- Missed dates cannot be backfilled or stamped later

The exact weekday-to-difficulty mapping still needs to be recorded before implementation.

## Calendar and stamp rewards

- Use a blue side-profile Mercury silhouette as the Calendar stamp
- Award 15 Mercury Points at 7, 14, 21, and 28 stamps
- Stamp rewards are granted once per threshold
- A missed stamp cannot be restored retroactively

## Missions and Mercury Points

- Final mission pool IDs: A01, A02, A03, B01, and B03
- Maximum Mercury Points earned from daily activity: 20 MP per day
- Weekly Missions are removed
- Public ranking is removed
- Competitive anti-cheat is removed

The exact definition and completion condition of each retained mission ID still needs to be copied from the approved prior design or source reference.

## Themes

- Four themes are available from the initial release
- Future themes cost 100 MP each
- Unlock ownership is stored locally unless cloud sync is introduced later

## Backend boundary

The product remains local-first. The smallest expected backend surface is:

- authoritative current date
- Daily puzzle identity or deterministic Daily seed

Personal records, active games, hints, Mercury Points, missions, stamps, and theme ownership remain local for the initial implementation.

Because public ranking and competitive rewards are absent, heavyweight anti-cheat is intentionally out of scope. Local data still uses validation and idempotent reward records to prevent accidental duplication.
