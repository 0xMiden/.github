# Game of Towers

A small, deterministic prototype inspired by idle survival town builders + tower defense missions. Build your outpost, assign survivors, and defend against raiders in short missions.

## Setup

```bash
npm install
```

## Commands

```bash
npm run dev
npm run build
npm run preview
npm run test
```

## Architecture

- **Town screen** (`src/routes/town`): idle resource generation, survivor assignment, and building upgrades.
- **Mission screen** (`src/routes/mission`): Phaser 3 tower defense encounter embedded in SvelteKit.
- **Simulation layer** (`src/lib/sim`): deterministic formulas and balance helpers, no DOM usage.
- **Save layer** (`src/lib/save`): versioned localStorage save data with offline progress.
- **Balance data** (`data/balance.json`): all progression numbers and tuning values.

## Core Loop

1. Generate Food, Wood, and Stone over time in town.
2. Upgrade buildings and unlock higher mission tiers.
3. Run missions to earn Coins and Hero XP.
4. Spend Coins to upgrade heroes and improve mission outcomes.
