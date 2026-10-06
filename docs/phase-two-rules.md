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
- Difficulty follows a fixed weekday curve:
  - Monday: Easy
  - Tuesday: Medium
  - Wednesday: Hard
  - Thursday: Expert
  - Friday: Hard
  - Saturday: Medium
  - Sunday: Easy
- A Daily puzzle cannot be restarted
- An unfinished Daily puzzle can be continued
- Only the first completion grants rewards
- First completion grants 5 Mercury Points and that day's Calendar stamp
- Missed dates cannot be backfilled or stamped later

## Calendar and stamp rewards

- Use a blue side-profile Mercury silhouette as the Calendar stamp
- Award 15 Mercury Points at 7, 14, 21, and 28 stamps
- Stamp rewards are granted once per threshold
- A missed stamp cannot be restored retroactively

## Missions and Mercury Points

- One Category A mission and one Category B mission are active for the day
- Each completed category mission grants 5 MP
- Completing both active missions grants an additional 5 MP
- Final mission pool:
  - A01: complete one Medium-or-higher puzzle
  - A02: complete one Hard-or-higher puzzle
  - A03: complete one Expert puzzle
  - B01: complete one puzzle without using a Hint
  - B03: complete one puzzle without mistakes
- Maximum Mercury Points earned from daily activity: 20 MP per day
- Weekly Missions are removed
- Public ranking is removed
- Competitive anti-cheat is removed

Daily MP composition is fixed at: Daily Challenge 5 MP + Category A 5 MP + Category B 5 MP + Complete All 5 MP.

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
