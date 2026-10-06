# ADR 0001: Build a web-first remake

Status: Accepted  
Date: 2026-10-06

## Context

The existing Mercurius Sudoku application is implemented in Unity and contains valuable Sudoku logic, puzzle data, smart hint knowledge, visual assets, and established game behavior.

The target product must run well as a website and later be packaged for Android and iOS. The product owner chose a remake rather than a one-to-one Unity-to-Web conversion.

The Unity project contains large presentation-oriented classes, direct filesystem persistence, Unity-specific lifecycle code, mobile advertising and purchase dependencies, and platform-specific audio behavior. Reproducing those structures in a Web build would also reproduce their maintenance constraints.

## Decision

Create a new TypeScript web application.

Treat the Unity project as:

- a behavioral reference
- a source of validated puzzle examples
- a source of solver and hint knowledge
- a source of approved brand and audio assets

Do not treat it as the new application's architecture.

The new Sudoku engine is pure TypeScript and independent from React, browser storage, and Capacitor. The web application is completed and verified before native packaging is introduced.

## Consequences

Benefits:

- Smaller and faster web delivery
- Responsive DOM-based interface
- Testable Sudoku and hint logic
- Cleaner offline storage
- Easier localization and accessibility
- One product codebase for web and packaged applications
- Platform advertising and purchases remain replaceable adapters

Costs:

- Core algorithms must be ported or rewritten carefully
- Unity behavior needs fixture-based comparison
- Initial delivery is slower than a minimal WebGL export
- Some visual effects and platform integrations must be rebuilt
- Full Smart Hint parity belongs after the MVP

## Rejected alternatives

### Unity Web build as the primary product

Rejected as the long-term architecture because it preserves Unity coupling, increases delivery weight, and does not provide the desired web-native product structure.

It may still be used privately as a behavioral comparison build.

### Screen-for-screen JavaScript port

Rejected because it would carry forward layout assumptions and tightly coupled presentation logic from the mobile Unity version.

### Separate native Android and iOS rewrites

Rejected because the stated product direction is web-first and maintaining three independent implementations would multiply testing and feature costs.
