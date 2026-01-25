import { applyOfflineProgress, createNewSave, type SaveState, balance } from '../sim';

const STORAGE_KEY = 'game-of-towers-save';

export function loadSave(now: number): SaveState {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return createNewSave(now);
  }
  try {
    const parsed = JSON.parse(raw) as SaveState;
    const migrated = migrateSave(parsed, now);
    return applyOfflineProgress(migrated, now, balance);
  } catch {
    return createNewSave(now);
  }
}

export function saveGame(state: SaveState) {
  const toSave = { ...state, lastSavedAt: Date.now() };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
}

export function migrateSave(save: SaveState, now: number): SaveState {
  if (save.version === balance.version) {
    return save;
  }
  return { ...createNewSave(now), ...save, version: balance.version };
}
