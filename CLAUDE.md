# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Foundry VTT module (v12+) that connects to an external **Pathfinder KnowHow** API server. It provides a UI window inside Foundry for GMs to query their campaign knowledge base and save new entries. There is no build step, bundler, or test framework — the module is plain ES modules loaded directly by Foundry.

## Architecture

- **`module.json`** — Foundry module manifest. Declares `scripts/module.js` as the ES module entry point.
- **`scripts/module.js`** — Entry point. Registers module settings (`apiUrl`, `apiKey`), adds a scene control button, and a `/knowhow` chat command. All three open a `KnowHowApp` window.
- **`scripts/knowhow-app.js`** — `KnowHowApp` extends Foundry's `Application` class. Renders inline HTML (no template file) with two tabs: **Ask** (query the knowledge base) and **Save** (add new entries). Uses jQuery via Foundry's built-in `$`.
- **`scripts/api-client.js`** — `KnowHowAPI` class. Wraps three REST endpoints on the external server: `POST /api/query`, `POST /api/entries`, `POST /api/detect-and-format`. Uses private class fields (`#baseUrl`, `#apiKey`) read from Foundry settings. Auth via `X-API-Key` header.
- **`styles/knowhow.css`** — All styles scoped under `.knowhow-window` to avoid leaking into Foundry UI.
- **`languages/en.json`** — i18n strings under the `KNOWHOW` namespace.

## Key Conventions

- Module ID is `pathfinder-knowhow` — used in `game.settings`, CSS class scoping, and template paths.
- Categories are hardcoded in `knowhow-app.js`: NPC, Location, Event, Equipment, Faction, Lore, Spell, Feat, Session Notes. Each has a color scheme in `CATEGORY_COLORS`.
- No build/compile step. Edit JS/CSS files directly and reload Foundry to test.
- Foundry globals available at runtime: `game`, `Hooks`, `Application`, `foundry`, `ui`, `$` (jQuery).

## Development

To test changes, copy or symlink this folder into your Foundry VTT `Data/modules/` directory and reload the world. There are no npm scripts, linters, or automated tests configured.
