import balanceData from '../../../data/balance.json';

export type ResourceKey = 'food' | 'wood' | 'stone' | 'coins';

export type Resources = Record<ResourceKey, number>;

export type BuildingKey = 'townHall' | 'farm' | 'lumberyard' | 'quarry' | 'barracks';

export type BuildingState = Record<BuildingKey, number>;

export type SurvivorAssignment = {
  farm: number;
  lumberyard: number;
  quarry: number;
};

export type SickSurvivor = {
  remainingMinutes: number;
};

export type HeroState = {
  id: string;
  level: number;
  xp: number;
  unlocked: boolean;
};

export type SaveState = {
  version: number;
  resources: Resources;
  buildings: BuildingState;
  survivors: {
    total: number;
    assigned: SurvivorAssignment;
    sick: SickSurvivor[];
  };
  heroes: HeroState[];
  lastSavedAt: number;
  rngSeed: number;
  tutorialStep: number;
  selectedTier: number;
};

export type Balance = typeof balanceData;

export const balance = balanceData as Balance;

export const DEFAULT_RESOURCES: Resources = {
  food: 40,
  wood: 60,
  stone: 40,
  coins: 0
};

export const DEFAULT_BUILDINGS: BuildingState = {
  townHall: 1,
  farm: 1,
  lumberyard: 1,
  quarry: 1,
  barracks: 1
};

export function createNewSave(now: number): SaveState {
  const heroes = balance.heroes.list.map((hero, index) => ({
    id: hero.id,
    level: 1,
    xp: 0,
    unlocked: index === 0
  }));

  return {
    version: balance.version,
    resources: { ...DEFAULT_RESOURCES },
    buildings: { ...DEFAULT_BUILDINGS },
    survivors: {
      total: balance.survivors.starting,
      assigned: { farm: 0, lumberyard: 0, quarry: 0 },
      sick: []
    },
    heroes,
    lastSavedAt: now,
    rngSeed: 12345,
    tutorialStep: 0,
    selectedTier: 1
  };
}

export function buildingUpgradeCost(building: BuildingKey, level: number, data: Balance = balance) {
  const info = data.buildings[building];
  const multiplier = info.growth ** (level - 1);
  const cost: Partial<Resources> = {};
  Object.entries(info.baseCost).forEach(([key, value]) => {
    cost[key as ResourceKey] = Math.ceil(value * multiplier);
  });
  return cost;
}

export function baseProductionPerMinute(building: BuildingKey, level: number, data: Balance = balance) {
  if (building === 'farm' || building === 'lumberyard' || building === 'quarry') {
    const info = data.buildings[building];
    return info.baseProductionPerMinute * (1 + (level - 1) * 0.1);
  }
  return 0;
}

export function productionPerMinute(
  building: BuildingKey,
  level: number,
  survivorsAssigned: number,
  sickMultiplier: number,
  data: Balance = balance
) {
  const baseRate = baseProductionPerMinute(building, level, data);
  const boost = 1 + survivorsAssigned * data.survivors.boostPercent;
  return baseRate * boost * sickMultiplier;
}

export function getSickMultiplier(sickCount: number, totalAssigned: number, data: Balance = balance) {
  if (sickCount <= 0 || totalAssigned === 0) return 1;
  const ratio = sickCount / totalAssigned;
  return 1 - ratio * (1 - data.survivors.sickness.sickMultiplier);
}

export function applyOfflineProgress(save: SaveState, now: number, data: Balance = balance) {
  const maxMinutes = 60 * 8;
  const elapsedMinutes = Math.min(maxMinutes, Math.max(0, (now - save.lastSavedAt) / 60000));
  if (elapsedMinutes <= 0) return save;

  let updated = { ...save, resources: { ...save.resources }, survivors: { ...save.survivors } };
  const sickTimers = [...save.survivors.sick];
  let seed = save.rngSeed;

  for (let minute = 0; minute < Math.floor(elapsedMinutes); minute += 1) {
    const sicknessChance = data.survivors.sickness.chancePerMinute;
    if (updated.resources.food < data.survivors.sickness.foodThreshold) {
      const rng = nextRandom(seed);
      seed = rng.seed;
      if (rng.value < sicknessChance && updated.survivors.total > sickTimers.length) {
        sickTimers.push({ remainingMinutes: data.survivors.sickness.sickDurationMinutes });
      }
    }

    sickTimers.forEach((entry) => {
      entry.remainingMinutes = Math.max(0, entry.remainingMinutes - 1);
    });
    const activeSick = sickTimers.filter((entry) => entry.remainingMinutes > 0);

    const totalAssigned =
      updated.survivors.assigned.farm +
      updated.survivors.assigned.lumberyard +
      updated.survivors.assigned.quarry;
    const sickMultiplier = getSickMultiplier(activeSick.length, totalAssigned, data);

    updated.resources.food += productionPerMinute(
      'farm',
      updated.buildings.farm,
      updated.survivors.assigned.farm,
      sickMultiplier,
      data
    );
    updated.resources.wood += productionPerMinute(
      'lumberyard',
      updated.buildings.lumberyard,
      updated.survivors.assigned.lumberyard,
      sickMultiplier,
      data
    );
    updated.resources.stone += productionPerMinute(
      'quarry',
      updated.buildings.quarry,
      updated.survivors.assigned.quarry,
      sickMultiplier,
      data
    );

    updated.resources.food = Math.max(0, updated.resources.food - 1);

    updated = {
      ...updated,
      survivors: { ...updated.survivors, sick: activeSick }
    };
  }

  return { ...updated, lastSavedAt: now, rngSeed: seed };
}

export function canAfford(resources: Resources, cost: Partial<Resources>) {
  return Object.entries(cost).every(([key, value]) => resources[key as ResourceKey] >= (value ?? 0));
}

export function payCost(resources: Resources, cost: Partial<Resources>): Resources {
  const next = { ...resources };
  Object.entries(cost).forEach(([key, value]) => {
    next[key as ResourceKey] = Math.max(0, next[key as ResourceKey] - (value ?? 0));
  });
  return next;
}

export function missionReward(tier: number, clearedWaves: number, totalWaves: number, data: Balance = balance) {
  const base = data.rewards.baseCoins * data.rewards.growth ** (tier - 1);
  const performance = clearedWaves / Math.max(1, totalWaves);
  const bonus = 1 + data.rewards.performanceBonus * performance;
  return Math.round(base * bonus);
}

export function heroXpForLevel(level: number, data: Balance = balance) {
  return Math.round(data.heroes.xpCurve.base * data.heroes.xpCurve.growth ** (level - 1));
}

export function heroUpgradeCost(level: number, data: Balance = balance) {
  return Math.round(data.heroes.upgradeCostBase * data.heroes.upgradeCostGrowth ** (level - 1));
}

export function towerDps(towerId: keyof Balance['towers'], level: number, data: Balance = balance) {
  const entry = data.towers[towerId].levels[level - 1];
  return entry.damage * entry.rate;
}

export function nextRandom(seed: number) {
  let t = seed + 0x6d2b79f5;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  const value = ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  return { value, seed: t };
}

export function getMissionTierCap(buildings: BuildingState, data: Balance = balance) {
  const level = buildings.townHall;
  return data.buildings.townHall.missionTierUnlock[Math.max(0, level - 1)] ?? 1;
}

export function getBarracksHeroSlots(level: number, data: Balance = balance) {
  return data.buildings.barracks.heroSlots[Math.max(0, level - 1)] ?? 1;
}

export function getBarracksTowerCap(level: number, data: Balance = balance) {
  return data.buildings.barracks.towerUpgradeCap[Math.max(0, level - 1)] ?? 1;
}
