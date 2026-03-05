# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Foundry VTT module (v12+) that connects to an external Pathfinder KnowHow API server. Provides a UI window inside Foundry for GMs to query their campaign knowledge base and save new entries. No build step, bundler, or test framework — plain ES modules loaded directly by Foundry.

## Architecture

- **`module.json`** — Foundry module manifest. Entry point is `scripts/module.js`. Module ID: `pathfinder-knowhow`.
- **`scripts/module.js`** — Registers settings (`apiUrl`, `apiKey`), adds a scene control button via `getSceneControlButtons` hook (v12 object-based API on `controls.tokens.tools`), and a `/knowhow` chat command.
- **`scripts/knowhow-app.js`** — `KnowHowApp` extends Foundry's `Application`. Renders inline HTML (no template file) with two tabs: **Ask** (query with optional category filter) and **Save** (auto-detects category via API). Uses jQuery via Foundry's built-in `$`.
- **`scripts/api-client.js`** — `KnowHowAPI` class wrapping three REST endpoints: `POST /api/query`, `POST /api/entries`, `POST /api/detect-and-format`. Uses private class fields for settings. Auth via `X-API-Key` header.
- **`styles/knowhow.css`** — Scoped under `.knowhow-window`. Inherits Foundry's native theme via CSS variables rather than forcing its own color scheme.
- **`languages/en.json`** — i18n strings under the `KNOWHOW` namespace.

## Key Conventions

- Module ID `pathfinder-knowhow` is used in `game.settings`, CSS scoping, and the manifest. The repo/folder must be cloned as `pathfinder-knowhow` for Foundry to accept it.
- Categories (NPC, Location, Event, Equipment, Faction, Lore, Spell, Feat, Session Notes) are hardcoded in `knowhow-app.js` with per-category badge colors in `CATEGORY_COLORS`.
- CSS uses Foundry CSS variables (`--color-text-dark-primary`, `--color-border-light-tertiary`, etc.) to stay compatible with Foundry's theme.
- The Save tab always auto-detects category — no manual category selector.
- Foundry globals available at runtime: `game`, `Hooks`, `Application`, `foundry`, `ui`, `$` (jQuery).

## Development

No npm/build/lint/test tooling. Edit files directly and reload the Foundry world. The module folder must live at `Data/modules/pathfinder-knowhow/` — clone with:
```
git clone <repo-url> pathfinder-knowhow
```
