'use strict';

const {
  formatDateKey,
  todayKey,
  createProgress,
  ensureToday,
  recordWorkCompletion,
} = require('../static/js/progress-service');

describe('progress-service', () => {
  test('formatDateKey は YYYY-MM-DD を返す', () => {
    const key = formatDateKey(new Date('2026-04-17T12:00:00Z'));
    expect(key).toBe('2026-04-17');
  });

  test('todayKey は timeProvider から日付キーを作る', () => {
    const provider = { now: () => new Date('2026-04-17T08:30:00Z').getTime() };
    expect(todayKey(provider)).toBe('2026-04-17');
  });

  test('createProgress は初期進捗を作る', () => {
    const progress = createProgress('2026-04-17');
    expect(progress).toEqual({
      dateKey: '2026-04-17',
      completedCount: 0,
      focusedMinutes: 0,
    });
  });

  test('ensureToday は日付が同じなら値を維持する', () => {
    const progress = ensureToday({
      dateKey: '2026-04-17',
      completedCount: 2,
      focusedMinutes: 50,
    }, '2026-04-17');

    expect(progress).toEqual({
      dateKey: '2026-04-17',
      completedCount: 2,
      focusedMinutes: 50,
    });
  });

  test('ensureToday は日付が違うとリセットする', () => {
    const progress = ensureToday({
      dateKey: '2026-04-16',
      completedCount: 4,
      focusedMinutes: 100,
    }, '2026-04-17');

    expect(progress).toEqual({
      dateKey: '2026-04-17',
      completedCount: 0,
      focusedMinutes: 0,
    });
  });

  test('recordWorkCompletion は回数と分数を加算する', () => {
    const updated = recordWorkCompletion({
      dateKey: '2026-04-17',
      completedCount: 1,
      focusedMinutes: 25,
    }, 25, '2026-04-17');

    expect(updated).toEqual({
      dateKey: '2026-04-17',
      completedCount: 2,
      focusedMinutes: 50,
    });
  });

  test('recordWorkCompletion は日付が変わったら当日分から加算する', () => {
    const updated = recordWorkCompletion({
      dateKey: '2026-04-16',
      completedCount: 3,
      focusedMinutes: 75,
    }, 30, '2026-04-17');

    expect(updated).toEqual({
      dateKey: '2026-04-17',
      completedCount: 1,
      focusedMinutes: 30,
    });
  });
});
