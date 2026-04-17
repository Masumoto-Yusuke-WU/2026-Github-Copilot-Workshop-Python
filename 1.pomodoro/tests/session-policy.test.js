'use strict';

/**
 * session-policy.test.js
 *
 * SessionPolicy.nextMode の遷移ルールに対するユニットテスト。
 */

const { nextMode } = require('../static/js/session-policy');
const { MODE } = require('../static/js/timer-engine');

const LONG_BREAK_INTERVAL = 4; // テスト用の標準値

// ---------------------------------------------------------------------------
// work → short_break / long_break
// ---------------------------------------------------------------------------

describe('nextMode: work 完了後の遷移', () => {
  test('1回目の work 完了 → short_break', () => {
    expect(nextMode(MODE.WORK, 1, LONG_BREAK_INTERVAL)).toBe(MODE.SHORT_BREAK);
  });

  test('2回目の work 完了 → short_break', () => {
    expect(nextMode(MODE.WORK, 2, LONG_BREAK_INTERVAL)).toBe(MODE.SHORT_BREAK);
  });

  test('3回目の work 完了 → short_break', () => {
    expect(nextMode(MODE.WORK, 3, LONG_BREAK_INTERVAL)).toBe(MODE.SHORT_BREAK);
  });

  test('4回目の work 完了（longBreakInterval の倍数）→ long_break', () => {
    expect(nextMode(MODE.WORK, 4, LONG_BREAK_INTERVAL)).toBe(MODE.LONG_BREAK);
  });

  test('5回目の work 完了 → short_break', () => {
    expect(nextMode(MODE.WORK, 5, LONG_BREAK_INTERVAL)).toBe(MODE.SHORT_BREAK);
  });

  test('8回目の work 完了（2サイクル目の倍数）→ long_break', () => {
    expect(nextMode(MODE.WORK, 8, LONG_BREAK_INTERVAL)).toBe(MODE.LONG_BREAK);
  });
});

// ---------------------------------------------------------------------------
// break → work
// ---------------------------------------------------------------------------

describe('nextMode: break 完了後は work に戻る', () => {
  test('short_break 完了 → work', () => {
    expect(nextMode(MODE.SHORT_BREAK, 2, LONG_BREAK_INTERVAL)).toBe(MODE.WORK);
  });

  test('long_break 完了 → work', () => {
    expect(nextMode(MODE.LONG_BREAK, 4, LONG_BREAK_INTERVAL)).toBe(MODE.WORK);
  });
});

// ---------------------------------------------------------------------------
// カスタム longBreakInterval
// ---------------------------------------------------------------------------

describe('nextMode: カスタム longBreakInterval', () => {
  test('interval=2 のとき 2回目で long_break', () => {
    expect(nextMode(MODE.WORK, 2, 2)).toBe(MODE.LONG_BREAK);
  });

  test('interval=2 のとき 1回目は short_break', () => {
    expect(nextMode(MODE.WORK, 1, 2)).toBe(MODE.SHORT_BREAK);
  });

  test('interval=6 のとき 6回目で long_break', () => {
    expect(nextMode(MODE.WORK, 6, 6)).toBe(MODE.LONG_BREAK);
  });

  test('interval=6 のとき 3回目は short_break', () => {
    expect(nextMode(MODE.WORK, 3, 6)).toBe(MODE.SHORT_BREAK);
  });
});
