<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import Phaser from 'phaser';
  import {
    balance,
    getBarracksTowerCap,
    missionReward,
    heroXpForLevel,
    heroUpgradeCost as heroUpgradeCostFormula,
    towerDps,
    type SaveState
  } from '$lib/sim';
  import { loadSave, saveGame } from '$lib/save';
  import { page } from '$app/stores';

  let container: HTMLDivElement | null = null;
  let game: Phaser.Game | null = null;
  let save: SaveState | null = null;
  let tier = 1;
  let buildPoints = balance.missions.buildPoints;
  let selectedTower: keyof typeof balance.towers = 'archer';
  let selectedSlotIndex: number | null = null;
  let heroCooldown = 0;
  let missionStatus: 'running' | 'victory' | 'defeat' = 'running';
  let gateHp = balance.missions.gateHp;
  let heroUpgradeAvailable = false;
  let heroUpgradeCostValue = 0;

  const slots = [
    { x: 160, y: 120 },
    { x: 240, y: 220 },
    { x: 320, y: 140 },
    { x: 400, y: 240 },
    { x: 480, y: 160 },
    { x: 560, y: 220 }
  ];

  const towerState: {
    type: keyof typeof balance.towers;
    level: number;
  }[] = slots.map(() => ({ type: 'archer', level: 1 }));

  let placedTowers = new Set<number>();

  function setTowerType(type: keyof typeof balance.towers) {
    selectedTower = type;
  }

  function placeOrUpgrade() {
    if (selectedSlotIndex === null || missionStatus !== 'running') return;
    const slot = selectedSlotIndex;
    if (!placedTowers.has(slot)) {
      const cost = balance.towers[selectedTower].buildCost;
      if (buildPoints < cost) return;
      placedTowers.add(slot);
      towerState[slot] = { type: selectedTower, level: 1 };
      buildPoints -= cost;
      if (save && selectedTower === 'archer' && save.tutorialStep === 3) {
        save.tutorialStep = 4;
        saveGame(save);
      }
      return;
    }
    const cap = save ? getBarracksTowerCap(save.buildings.barracks, balance) : 1;
    const current = towerState[slot];
    if (current.level >= cap) return;
    current.level += 1;
  }

  function triggerHeroAbility(scene: Phaser.Scene) {
    if (heroCooldown > 0 || missionStatus !== 'running') return;
    const hero = save?.heroes.find((entry) => entry.unlocked);
    if (!hero) return;
    const heroData = balance.heroes.list.find((entry) => entry.id === hero.id);
    if (!heroData) return;
    heroCooldown = heroData.active.cooldown;
    if (heroData.active.type === 'blast') {
      const enemies = scene.data.get('enemies') as Phaser.GameObjects.Ellipse[];
      enemies.forEach((enemy) => {
        enemy.setData('hp', Math.max(0, enemy.getData('hp') - heroData.active.damage));
      });
    } else if (heroData.active.type === 'slow') {
      const enemies = scene.data.get('enemies') as Phaser.GameObjects.Ellipse[];
      enemies.forEach((enemy) => {
        enemy.setData('slowUntil', scene.time.now + heroData.active.duration * 1000);
      });
    } else if (heroData.active.type === 'shield') {
      gateHp = Math.min(balance.missions.gateHp, gateHp + heroData.active.gateHeal);
    }
  }

  function getHeroPassive() {
    const hero = save?.heroes.find((entry) => entry.unlocked);
    if (!hero) return { damage: 1, range: 1, rate: 1 };
    const heroData = balance.heroes.list.find((entry) => entry.id === hero.id);
    if (!heroData) return { damage: 1, range: 1, rate: 1 };
    return {
      damage: 1 + (heroData.passive.towerDamagePct ?? 0),
      range: 1 + (heroData.passive.towerRangePct ?? 0),
      rate: 1 + (heroData.passive.towerRatePct ?? 0)
    };
  }

  function completeMission(victory: boolean, wavesCleared: number, totalWaves: number) {
    if (!save) return;
    missionStatus = victory ? 'victory' : 'defeat';
    const rewardCoins = missionReward(tier, wavesCleared, totalWaves, balance);
    save.resources.coins += rewardCoins;
    const hero = save.heroes.find((entry) => entry.unlocked);
    if (hero) {
      hero.xp += rewardCoins;
      while (hero.xp >= heroXpForLevel(hero.level, balance)) {
        hero.xp -= heroXpForLevel(hero.level, balance);
        hero.level += 1;
      }
      heroUpgradeCostValue = heroUpgradeCostFormula(hero.level, balance);
      heroUpgradeAvailable = save.resources.coins >= heroUpgradeCostValue;
    }
    saveGame(save);
  }

  function upgradeHero() {
    if (!save) return;
    const hero = save.heroes.find((entry) => entry.unlocked);
    if (!hero) return;
    const cost = heroUpgradeCostFormula(hero.level, balance);
    if (save.resources.coins < cost) return;
    save.resources.coins -= cost;
    hero.level += 1;
    if (save.tutorialStep === 4) {
      save.tutorialStep = 5;
    }
    saveGame(save);
    heroUpgradeCostValue = heroUpgradeCostFormula(hero.level, balance);
    heroUpgradeAvailable = save.resources.coins >= heroUpgradeCostValue;
  }

  function buildScene() {
    if (!container) return;
    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      width: 720,
      height: 360,
      parent: container,
      backgroundColor: '#0d121c',
      scene: {
        create() {
          const scene = this;
          scene.data.set('enemies', []);
          scene.add.rectangle(360, 180, 640, 40, 0x1f2b3e).setStrokeStyle(2, 0x3d4e6b);
          scene.add.rectangle(680, 180, 40, 120, 0x3d4e6b).setStrokeStyle(2, 0x5f77a6);

          slots.forEach((slot, index) => {
            const marker = scene.add.circle(slot.x, slot.y, 14, 0x26324a);
            marker.setStrokeStyle(2, 0x4b5e82);
            marker.setInteractive({ useHandCursor: true });
            marker.on('pointerdown', () => {
              selectedSlotIndex = index;
            });
          });

          spawnWaves(scene);
        },
        update(time, delta) {
          if (missionStatus !== 'running') return;
          heroCooldown = Math.max(0, heroCooldown - delta / 1000);
          updateEnemies(this, time, delta);
          updateTowers(this, delta);
        }
      }
    };

    game = new Phaser.Game(config);
  }

  function spawnWaves(scene: Phaser.Scene) {
    const tierConfig = balance.missions.tiers[tier - 1];
    let waveIndex = 0;
    let spawnedEnemies = 0;
    const totalWaves = tierConfig.waves.length;
    const enemies = scene.data.get('enemies') as Phaser.GameObjects.Ellipse[];
    let clearedWaves = 0;

    const timer = scene.time.addEvent({
      delay: 800,
      loop: true,
      callback: () => {
        if (missionStatus !== 'running') {
          timer.remove();
          return;
        }
        const wave = tierConfig.waves[waveIndex];
        if (!wave) {
          if (enemies.length === 0) {
            completeMission(true, totalWaves, totalWaves);
            timer.remove();
          }
          return;
        }
        if (spawnedEnemies < wave.count) {
          const enemy = scene.add.ellipse(40, 180, 16, 16, 0xd96f5f);
          enemy.setData('hp', wave.hp * tierConfig.enemyHpMultiplier);
          enemy.setData('speed', wave.speed);
          enemy.setData('slowUntil', 0);
          enemies.push(enemy);
          spawnedEnemies += 1;
        } else {
          waveIndex += 1;
          spawnedEnemies = 0;
          clearedWaves += 1;
          scene.data.set('wavesCleared', clearedWaves);
        }
      }
    });

    scene.data.set('waveCount', totalWaves);
    scene.data.set('wavesCleared', 0);
  }

  function updateEnemies(scene: Phaser.Scene, time: number, delta: number) {
    const enemies = scene.data.get('enemies') as Phaser.GameObjects.Ellipse[];
    enemies.forEach((enemy) => {
      const slowUntil = enemy.getData('slowUntil') as number;
      const slowMultiplier = slowUntil > time ? 0.6 : 1;
      const speed = (enemy.getData('speed') as number) * slowMultiplier;
      enemy.x += (speed * delta) / 1000;
    });

    const remaining = enemies.filter((enemy) => enemy.x < 680 && enemy.getData('hp') > 0);
    const escaped = enemies.filter((enemy) => enemy.x >= 680 && enemy.getData('hp') > 0);
    gateHp = Math.max(0, gateHp - escaped.length * 5);
    escaped.forEach((enemy) => enemy.destroy());
    if (gateHp <= 0) {
      completeMission(
        false,
        (scene.data.get('wavesCleared') as number) ?? 0,
        scene.data.get('waveCount') as number
      );
    }
    enemies.forEach((enemy) => {
      if (enemy.getData('hp') <= 0) {
        enemy.destroy();
      }
    });
    scene.data.set('enemies', remaining.filter((enemy) => enemy.active));
  }

  function updateTowers(scene: Phaser.Scene, delta: number) {
    const enemies = scene.data.get('enemies') as Phaser.GameObjects.Ellipse[];
    const passive = getHeroPassive();
    slots.forEach((slot, index) => {
      if (!placedTowers.has(index)) return;
      const tower = towerState[index];
      const stats = balance.towers[tower.type].levels[tower.level - 1];
      const damage = stats.damage * passive.damage;
      const rate = stats.rate * passive.rate;
      const range = stats.range * passive.range;
      const towerKey = `cooldown-${index}`;
      const currentCooldown = (scene.data.get(towerKey) as number) ?? 0;
      const nextCooldown = Math.max(0, currentCooldown - delta / 1000);
      scene.data.set(towerKey, nextCooldown);
      if (nextCooldown > 0) return;
      const target = enemies.find((enemy) => Phaser.Math.Distance.Between(slot.x, slot.y, enemy.x, enemy.y) <= range);
      if (!target) return;
      scene.data.set(towerKey, 1 / rate);
      if ('splash' in stats) {
        enemies.forEach((enemy) => {
          const distance = Phaser.Math.Distance.Between(target.x, target.y, enemy.x, enemy.y);
          if (distance <= stats.splash) {
            enemy.setData('hp', Math.max(0, enemy.getData('hp') - damage));
          }
        });
      } else {
        target.setData('hp', Math.max(0, target.getData('hp') - damage));
      }
      const shot = scene.add.circle(slot.x, slot.y, 4, 0x9fb3ff);
      scene.tweens.add({
        targets: shot,
        x: target.x,
        y: target.y,
        duration: 200,
        onComplete: () => shot.destroy()
      });
    });
  }

  onMount(() => {
    const unsubscribe = page.subscribe((pageData) => {
      const param = pageData.url.searchParams.get('tier');
      tier = param ? Number(param) : 1;
    });
    save = loadSave(Date.now());
    buildPoints = balance.missions.buildPoints;
    gateHp = balance.missions.gateHp;
    if (save) {
      const hero = save.heroes.find((entry) => entry.unlocked);
      if (hero) {
        heroUpgradeCostValue = heroUpgradeCostFormula(hero.level, balance);
        heroUpgradeAvailable = save.resources.coins >= heroUpgradeCostValue;
      }
    }
    buildScene();
    return () => {
      unsubscribe();
      game?.destroy(true);
    };
  });
</script>

<div class="mission">
  <header class="mission-bar">
    <div>
      <h2>Mission Tier {tier}</h2>
      <p>Gate HP: {gateHp}</p>
    </div>
    <div class="resources">
      <span>Build Points: {buildPoints}</span>
      <span>Hero Cooldown: {heroCooldown.toFixed(1)}s</span>
    </div>
    <button on:click={() => goto('/town')}>Return</button>
  </header>

  <div class="mission-body">
    <div class="mission-ui">
      <h3>Build Towers</h3>
      {#each Object.keys(balance.towers) as tower}
        <button
          class:selected={selectedTower === tower}
          on:click={() => setTowerType(tower as keyof typeof balance.towers)}
        >
          {tower}
        </button>
        <p class="dps">DPS {towerDps(tower as keyof typeof balance.towers, 1, balance).toFixed(1)}</p>
      {/each}
      <button class="primary" on:click={placeOrUpgrade}>
        {selectedSlotIndex !== null && placedTowers.has(selectedSlotIndex) ? 'Upgrade Tower' : 'Place Tower'}
      </button>
      <button class="primary" on:click={() => game && triggerHeroAbility(game.scene.scenes[0])}>Hero Ability</button>
    </div>
    <div class="mission-scene" bind:this={container}></div>
  </div>

  {#if missionStatus !== 'running'}
    <div class="result">
      <div class="card">
        <h2>{missionStatus === 'victory' ? 'Victory!' : 'Defeat'}</h2>
        <p>{missionStatus === 'victory' ? 'The outpost holds strong.' : 'The gate has fallen.'}</p>
        {#if missionStatus === 'victory' && save}
          <div class="hero-upgrade">
            <p>Coins: {Math.floor(save.resources.coins)}</p>
            <button class="primary" disabled={!heroUpgradeAvailable} on:click={upgradeHero}>
              Upgrade Hero ({heroUpgradeCostValue})
            </button>
          </div>
        {/if}
        <button class="primary" on:click={() => goto('/town')}>Back to Town</button>
      </div>
    </div>
  {/if}

  {#if save && save.tutorialStep === 3}
    <div class="tutorial">
      <div class="bubble">Place an Archer tower on a slot.</div>
    </div>
  {/if}

  {#if save && save.tutorialStep === 4 && missionStatus === 'victory'}
    <div class="tutorial">
      <div class="bubble">Upgrade your hero with the coins you earned.</div>
    </div>
  {/if}
</div>

<style>
  .mission {
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  .mission-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 12px;
  }
  .mission-body {
    display: grid;
    grid-template-columns: 200px 1fr;
    gap: 16px;
  }
  .mission-ui {
    background: #171c28;
    padding: 12px;
    border-radius: 12px;
    border: 1px solid #22293a;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .mission-ui button {
    padding: 6px 10px;
  }
  .mission-ui button.selected {
    background: #3d78ff;
  }
  .mission-scene {
    border: 1px solid #22293a;
    border-radius: 12px;
    overflow: hidden;
  }
  .result {
    position: fixed;
    inset: 0;
    display: grid;
    place-items: center;
    background: rgba(0, 0, 0, 0.6);
  }
  .card {
    background: #1d2435;
    padding: 24px;
    border-radius: 12px;
    text-align: center;
  }
  .hero-upgrade {
    margin: 12px 0;
    display: flex;
    flex-direction: column;
    gap: 8px;
    align-items: center;
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
  }
  .dps {
    margin: 0 0 8px 0;
    font-size: 0.8rem;
    color: #a3a9b8;
  }
</style>
