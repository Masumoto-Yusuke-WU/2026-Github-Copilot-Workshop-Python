'use strict';

const {
  SettingsRepository,
  ProgressRepository,
  sanitizeSettings,
} = require('../static/js/repositories');

function createMemoryStorage() {
  const map = {};
  return {
    getItem(key) {
      return Object.prototype.hasOwnProperty.call(map, key) ? map[key] : null;
    },
    setItem(key, value) {
      map[key] = String(value);
    },
    removeItem(key) {
      delete map[key];
    },
  };
}

describe('sanitizeSettings', () => {
  const defaults = {
    workMinutes: 25,
    shortBreakMinutes: 5,
    longBreakMinutes: 15,
    longBreakInterval: 4,
  };

  test('正の整数のみ許容し、異常値はデフォルトに戻す', () => {
    const result = sanitizeSettings({
      workMinutes: '30',
      shortBreakMinutes: 0,
      longBreakMinutes: -1,
      longBreakInterval: 'abc',
    }, defaults);

    expect(result).toEqual({
      workMinutes: 30,
      shortBreakMinutes: 5,
      longBreakMinutes: 15,
      longBreakInterval: 4,
    });
  });
});

describe('SettingsRepository', () => {
  const defaults = {
    workMinutes: 25,
    shortBreakMinutes: 5,
    longBreakMinutes: 15,
    longBreakInterval: 4,
  };

  test('未保存時はデフォルトを返す', () => {
    const repo = new SettingsRepository(createMemoryStorage(), 'settings');
    expect(repo.load(defaults)).toEqual(defaults);
  });

  test('save 後に load で復元できる', () => {
    const repo = new SettingsRepository(createMemoryStorage(), 'settings');
    repo.save({
      workMinutes: 30,
      shortBreakMinutes: 10,
      longBreakMinutes: 20,
      longBreakInterval: 5,
    }, defaults);

    expect(repo.load(defaults)).toEqual({
      workMinutes: 30,
      shortBreakMinutes: 10,
      longBreakMinutes: 20,
      longBreakInterval: 5,
    });
  });

  test('不正 JSON はデフォルトへフォールバックする', () => {
    const storage = createMemoryStorage();
    storage.setItem('settings', '{invalid-json');
    const repo = new SettingsRepository(storage, 'settings');
    expect(repo.load(defaults)).toEqual(defaults);
  });
});

describe('ProgressRepository', () => {
  const defaultProgress = {
    dateKey: '2026-04-17',
    completedCount: 0,
    focusedMinutes: 0,
  };

  test('未保存時はデフォルト進捗を返す', () => {
    const repo = new ProgressRepository(createMemoryStorage(), 'progress');
    expect(repo.load(defaultProgress)).toEqual(defaultProgress);
  });

  test('save 後に load で復元できる', () => {
    const repo = new ProgressRepository(createMemoryStorage(), 'progress');
    repo.save({
      dateKey: '2026-04-17',
      completedCount: 3,
      focusedMinutes: 75,
    });

    expect(repo.load(defaultProgress)).toEqual({
      dateKey: '2026-04-17',
      completedCount: 3,
      focusedMinutes: 75,
    });
  });

  test('不正 JSON はデフォルト進捗へフォールバックする', () => {
    const storage = createMemoryStorage();
    storage.setItem('progress', '{broken');
    const repo = new ProgressRepository(storage, 'progress');
    expect(repo.load(defaultProgress)).toEqual(defaultProgress);
  });
});
