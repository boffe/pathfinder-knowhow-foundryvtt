# Pathfinder KnowHow — Foundry VTT Module

A Foundry VTT module that connects to your [Pathfinder KnowHow](https://github.com/boffe/pathfinder-knowhow-foundryvtt) campaign knowledge base. Ask questions about your campaign notes and save new entries directly from within Foundry.

## Features

- **Ask** — Query your campaign knowledge base from inside Foundry. Optionally filter by category (NPC, Location, Event, Equipment, Faction, Lore, Spell, Feat, Session Notes). Answers include source references with category badges.
- **Save** — Paste or type campaign notes and save them to your knowledge base. The category is automatically detected by the API.
- **Access** — Open via the book icon in the token scene controls, or type `/knowhow` in chat.

## Requirements

- Foundry VTT v12 or later
- A running Pathfinder KnowHow API server

## Installation

Clone this repo directly into your Foundry VTT modules directory. The folder **must** be named `pathfinder-knowhow` to match the module ID:

```bash
cd /path/to/FoundryVTT/Data/modules
git clone https://github.com/boffe/pathfinder-knowhow-foundryvtt.git pathfinder-knowhow
```

Then in Foundry:

1. Go to **Settings > Manage Modules** and enable **Pathfinder KnowHow**
2. Go to **Settings > Module Settings** and configure:
   - **KnowHow URL** — Base URL of your KnowHow API server (e.g. `http://localhost:3000`)
   - **API Key** — Your API key for authenticating with the server

## Usage

Once configured, click the book icon in the left-side token controls or type `/knowhow` in the chat box to open the KnowHow window.

### Ask Tab

Type a question about your campaign and click **Ask**. You can optionally select a category to narrow results. The answer and any source references will appear below.

### Save Tab

Paste or type your campaign notes and click **Save Entry**. The API will automatically detect the appropriate category and format the content before saving.

## Updating

Pull the latest changes from the repository and reload your Foundry world:

```bash
cd /path/to/FoundryVTT/Data/modules/pathfinder-knowhow
git pull
```

## License

MIT
