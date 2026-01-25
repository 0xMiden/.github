<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import {
    balance,
    buildingUpgradeCost,
    canAfford,
    payCost,
    productionPerMinute,
    baseProductionPerMinute,
    getSickMultiplier,
    getMissionTierCap,
    getBarracksHeroSlots,
    getBarracksTowerCap,
    nextRandom,
    heroUpgradeCost,
    heroXpForLevel,
    type BuildingKey,
    type SaveState
  } from '$lib/sim';
  import { loadSave, saveGame } from '$lib/save';

  let save: SaveState | null = null;
  let lastTick = Date.now();
  let minuteAccumulator = 0;

  const buildingLabels: Record<BuildingKey, string> = {
    townHall: 'Town Hall',
    farm: 'Farm',
    lumberyard: 'Lumberyard',
    quarry: 'Quarry',
    barracks: 'Barracks'
  };

  const resourceLabels: Record<'food' | 'wood' | 'stone' | 'coins', string> = {
    food: 'Food',
    wood: 'Wood',
    stone: 'Stone',
    coins: 'Coins'
  };

  function tick(now: number) {
    if (!save) return;
    const deltaSeconds = (now - lastTick) / 1000;
    lastTick = now;
    syncHeroUnlocks();

    const totalAssigned =
      save.survivors.assigned.farm +
      save.survivors.assigned.lumberyard +
      save.survivors.assigned.quarry;
    const sickMultiplier = getSickMultiplier(save.survivors.sick.length, totalAssigned, balance);

    save.resources.food +=
      (productionPerMinute('farm', save.buildings.farm, save.survivors.assigned.farm, sickMultiplier) /
        60) *
      deltaSeconds;
    save.resources.wood +=
      (productionPerMinute(
        'lumberyard',
        save.buildings.lumberyard,
        save.survivors.assigned.lumberyard,
        sickMultiplier
      ) /
        60) *
      deltaSeconds;
    save.resources.stone +=
      (productionPerMinute('quarry', save.buildings.quarry, save.survivors.assigned.quarry, sickMultiplier) /
        60) *
      deltaSeconds;
    save.resources.food = Math.max(0, save.resources.food - deltaSeconds / 60);

    minuteAccumulator += deltaSeconds;
    if (minuteAccumulator >= 60) {
      minuteAccumulator = 0;
      maybeApplySickness();
    }

    saveGame(save);
  }

  function maybeApplySickness() {
    if (!save) return;
    const { sickness } = balance.survivors;
    save.survivors.sick = save.survivors.sick
      .map((entry) => ({ ...entry, remainingMinutes: entry.remainingMinutes - 1 }))
      .filter((entry) => entry.remainingMinutes > 0);
    if (save.resources.food >= sickness.foodThreshold) return;
    const available = save.survivors.total - save.survivors.sick.length;
    if (available <= 0) return;
    const rng = nextRandom(save.rngSeed);
    save.rngSeed = rng.seed;
    if (rng.value < sickness.chancePerMinute) {
      save.survivors.sick.push({ remainingMinutes: sickness.sickDurationMinutes });
    }
  }

  function upgradeBuilding(building: BuildingKey) {
    if (!save) return;
    const level = save.buildings[building];
    const maxLevel =
      building === 'townHall'
        ? balance.buildings[building].maxLevel
        : Math.min(balance.buildings[building].maxLevel, save.buildings.townHall);
    if (level >= maxLevel) return;
    const cost = buildingUpgradeCost(building, level + 1);
    if (!canAfford(save.resources, cost)) return;
    save.resources = payCost(save.resources, cost);
    save.buildings[building] += 1;
    if (building === 'farm' && save.tutorialStep === 0) {
      save.tutorialStep = 1;
    }
    saveGame(save);
  }

  function assignSurvivor(building: 'farm' | 'lumberyard' | 'quarry', delta: number) {
    if (!save) return;
    const current = save.survivors.assigned[building];
    const totalAssigned =
      save.survivors.assigned.farm +
      save.survivors.assigned.lumberyard +
      save.survivors.assigned.quarry;
    const available = save.survivors.total - totalAssigned;
    if (delta > 0 && available <= 0) return;
    if (delta < 0 && current <= 0) return;
    save.survivors.assigned[building] = current + delta;
    if (save.tutorialStep === 1) {
      save.tutorialStep = 2;
    }
    saveGame(save);
  }

  function syncHeroUnlocks() {
    if (!save) return;
    const slots = getBarracksHeroSlots(save.buildings.barracks, balance);
    save.heroes.forEach((hero, index) => {
      hero.unlocked = index < slots;
    });
  }

  function upgradeHero(heroId: string) {
    if (!save) return;
    const hero = save.heroes.find((entry) => entry.id === heroId && entry.unlocked);
    if (!hero) return;
    const cost = heroUpgradeCost(hero.level, balance);
    if (save.resources.coins < cost) return;
    save.resources.coins -= cost;
    hero.level += 1;
    if (save.tutorialStep === 4) {
      save.tutorialStep = 5;
    }
    saveGame(save);
  }

  function startMission() {
    if (!save) return;
    if (save.tutorialStep === 2) {
      save.tutorialStep = 3;
      saveGame(save);
    }
    goto(`/mission?tier=${save.selectedTier}`);
  }

  function updateTier(delta: number) {
    if (!save) return;
    const cap = getMissionTierCap(save.buildings, balance);
    save.selectedTier = Math.min(cap, Math.max(1, save.selectedTier + delta));
    saveGame(save);
  }

  onMount(() => {
    save = loadSave(Date.now());
    syncHeroUnlocks();
    lastTick = Date.now();
    const interval = setInterval(() => tick(Date.now()), 1000);
    return () => clearInterval(interval);
  });
</script>

{#if save}
  <div class="town">
    <header class="top-bar">
      <div class="title">
        <h1>Hearthfall Outpost</h1>
        <p>Keep the settlement alive and prepare for missions.</p>
      </div>
      <div class="resources">
        {#each Object.entries(save.resources) as [key, value]}
          <div class="resource">
            <span>{resourceLabels[key as keyof typeof resourceLabels]}</span>
            <strong>{Math.floor(value)}</strong>
          </div>
        {/each}
      </div>
    </header>

    <main class="content">
      <section class="panel buildings">
        <h2>Buildings</h2>
        {#each Object.keys(save.buildings) as key}
          {#key key}
            <div class="building">
              <div>
                <h3>{buildingLabels[key as BuildingKey]}</h3>
                <p>Level {save.buildings[key as BuildingKey]}</p>
              </div>
              <div class="actions">
                {#if key !== 'townHall'}
                  <p>
                    +{Math.round(baseProductionPerMinute(key as BuildingKey, save.buildings[key as BuildingKey], balance))}
                    /min
                  </p>
                {/if}
                <button
                  class="primary"
                  on:click={() => upgradeBuilding(key as BuildingKey)}
                  disabled={!canAfford(save.resources, buildingUpgradeCost(key as BuildingKey, save.buildings[key as BuildingKey] + 1))}
                >
                  Upgrade
                </button>
              </div>
            </div>
          {/key}
        {/each}
      </section>

      <section class="panel survivors">
        <h2>Survivors</h2>
        <p>Total: {save.survivors.total}</p>
        <p>Sick: {save.survivors.sick.length}</p>
        {#each ['farm', 'lumberyard', 'quarry'] as spot}
          <div class="assignment">
            <span>{buildingLabels[spot as BuildingKey]}</span>
            <div class="assignment-controls">
              <button on:click={() => assignSurvivor(spot as 'farm' | 'lumberyard' | 'quarry', -1)}>-</button>
              <strong>{save.survivors.assigned[spot as 'farm' | 'lumberyard' | 'quarry']}</strong>
              <button on:click={() => assignSurvivor(spot as 'farm' | 'lumberyard' | 'quarry', 1)}>+</button>
            </div>
          </div>
        {/each}
        <p class="hint">
          Assigned survivors boost production by {Math.round(balance.survivors.boostPercent * 100)}% each.
        </p>
      </section>

      <section class="panel mission">
        <h2>Mission Launch</h2>
        <p>Tier cap: {getMissionTierCap(save.buildings, balance)}</p>
        <div class="tier-select">
          <button on:click={() => updateTier(-1)}>-</button>
          <span>Tier {save.selectedTier}</span>
          <button on:click={() => updateTier(1)}>+</button>
        </div>
        <p>Build Points: {balance.missions.buildPoints}</p>
        <p>Hero Slots: {getBarracksHeroSlots(save.buildings.barracks, balance)}</p>
        <p>Tower Upgrade Cap: {getBarracksTowerCap(save.buildings.barracks, balance)}</p>
        <button class="primary" on:click={startMission}>Go on Mission</button>
      </section>

      <section class="panel heroes">
        <h2>Heroes</h2>
        {#each save.heroes as hero}
          <div class="hero-card">
            <div>
              <h3>{balance.heroes.list.find((entry) => entry.id === hero.id)?.name ?? hero.id}</h3>
              <p>Level {hero.level}</p>
              {#if hero.unlocked}
                <p>
                  XP {hero.xp}/{heroXpForLevel(hero.level, balance)}
                </p>
              {:else}
                <p class="locked">Locked (Upgrade Barracks)</p>
              {/if}
            </div>
            {#if hero.unlocked}
              <button
                class="primary"
                on:click={() => upgradeHero(hero.id)}
                disabled={save.resources.coins < heroUpgradeCost(hero.level, balance)}
              >
                Upgrade ({heroUpgradeCost(hero.level, balance)})
              </button>
            {/if}
          </div>
        {/each}
      </section>
    </main>

    {#if save.tutorialStep < 3}
      <div class="tutorial">
        <div class="bubble">
          <strong>Tutorial</strong>
          {#if save.tutorialStep === 0}
            <p>Upgrade the Farm to boost food production.</p>
          {:else if save.tutorialStep === 1}
            <p>Assign survivors to your production buildings.</p>
          {:else if save.tutorialStep === 2}
            <p>Start Mission Tier 1 to earn Coins and XP.</p>
          {/if}
        </div>
      </div>
    {/if}

    {#if save.tutorialStep === 4}
      <div class="tutorial">
        <div class="bubble">
          <strong>Tutorial</strong>
          <p>Spend coins to upgrade your hero after a victory.</p>
        </div>
      </div>
    {/if}
  </div>
{/if}

<style>
  .town {
    padding: 24px;
    display: flex;
    flex-direction: column;
    gap: 24px;
  }
  .top-bar {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 16px;
    flex-wrap: wrap;
  }
  .resources {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
  }
  .resource {
    background: #1b2030;
    padding: 8px 12px;
    border-radius: 8px;
  }
  .content {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
    gap: 16px;
  }
  .panel {
    background: #171c28;
    padding: 16px;
    border-radius: 12px;
    border: 1px solid #22293a;
  }
  .building {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 0;
    border-bottom: 1px solid #22293a;
  }
  .building:last-child {
    border-bottom: none;
  }
  .actions {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 6px;
  }
  .assignment {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin: 8px 0;
  }
  .assignment-controls {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .hero-card {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
    padding: 8px 0;
    border-bottom: 1px solid #22293a;
  }
  .hero-card:last-child {
    border-bottom: none;
  }
  .locked {
    color: #a3a9b8;
    font-size: 0.85rem;
  }
  button {
    background: #2a3550;
    color: #fff;
    border: none;
    padding: 6px 10px;
    border-radius: 6px;
    cursor: pointer;
  }
  button.primary {
    background: #3d78ff;
  }
  button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  .hint {
    font-size: 0.85rem;
    color: #a3a9b8;
  }
  .tutorial {
    position: fixed;
    bottom: 24px;
    right: 24px;
  }
  .bubble {
    background: #2b354f;
    padding: 12px 16px;
    border-radius: 12px;
    border: 1px solid #3b4b6b;
    max-width: 260px;
  }
</style>
