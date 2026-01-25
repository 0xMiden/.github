import { describe, it, expect } from 'vitest';
import {
  balance,
  buildingUpgradeCost,
  productionPerMinute,
  getSickMultiplier,
  towerDps,
  missionReward
} from '../src/lib/sim';

describe('economy formulas', () => {
  it('calculates building upgrade cost curve', () => {
    const level = 3;
    const cost = buildingUpgradeCost('farm', level, balance);
    const expectedWood = Math.ceil(balance.buildings.farm.baseCost.wood * balance.buildings.farm.growth ** (level - 1));
    expect(cost.wood).toBe(expectedWood);
  });

  it('calculates production with survivors and sickness', () => {
    const base = balance.buildings.farm.baseProductionPerMinute;
    const sickMultiplier = getSickMultiplier(1, 4, balance);
    const result = productionPerMinute('farm', 1, 2, sickMultiplier, balance);
    const expected = base * (1 + 2 * balance.survivors.boostPercent) * sickMultiplier;
    expect(result).toBeCloseTo(expected, 4);
  });
});

describe('combat formulas', () => {
  it('computes tower DPS', () => {
    const dps = towerDps('archer', 1, balance);
    expect(dps).toBeCloseTo(
      balance.towers.archer.levels[0].damage * balance.towers.archer.levels[0].rate,
      4
    );
  });

  it('computes mission reward scaling', () => {
    const reward = missionReward(2, 2, 2, balance);
    const base = balance.rewards.baseCoins * balance.rewards.growth;
    const expected = Math.round(base * (1 + balance.rewards.performanceBonus));
    expect(reward).toBe(expected);
  });
});
