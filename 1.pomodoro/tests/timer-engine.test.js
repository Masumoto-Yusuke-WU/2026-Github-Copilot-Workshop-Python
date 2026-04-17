'use strict';

/**
 * timer-engine.test.js
 *
 * TimerEngine の純粋ロジックに対するユニットテスト。
 * timeProvider をスタブ化して固定時刻を注入する。
 */

const {
  MODE,
  STATUS,
  DEFAULT_SETTINGS,
  createTimerState,
  totalMs,
  getRemainingMs,
  getRemainingSeconds,
  isComplete,
  start,
  pause,
  resume,
  reset,
  completeSession,
} = require('../static/js/timer-engine');

// ---------------------------------------------------------------------------
// テスト用ヘルパー
// ---------------------------------------------------------------------------

/** 固定時刻を返す TimeProvider スタブを生成する */
function fixedTime(ms) {
  return { now: () => ms };
}

const T0 = 1_000_000; // 基準時刻（ms）

// ---------------------------------------------------------------------------
// createTimerState
// ---------------------------------------------------------------------------

describe('createTimerState', () => {
  test('デフォルト設定で初期 state を生成できる', () => {
    const state = createTimerState();
    expect(state.mode).toBe(MODE.WORK);
    expect(state.status).toBe(STATUS.IDLE);
    expect(state.remainingMs).toBe(DEFAULT_SETTINGS.workMinutes * 60 * 1000);
    expect(state.endTime).toBeNull();
    expect(state.pausedRemaining).toBeNull();
  });

  test('カスタム設定を反映できる', () => {
    const state = createTimerState({ workMinutes: 30 });
    expect(state.settings.workMinutes).toBe(30);
    expect(state.remainingMs).toBe(30 * 60 * 1000);
  });
});

// ---------------------------------------------------------------------------
// totalMs
// ---------------------------------------------------------------------------

describe('totalMs', () => {
  test('work モードでは workMinutes × 60000 を返す', () => {
    const state = createTimerState({ workMinutes: 25 });
    expect(totalMs(state)).toBe(25 * 60 * 1000);
  });

  test('short_break モードでは shortBreakMinutes × 60000 を返す', () => {
    const state = Object.assign(createTimerState(), { mode: MODE.SHORT_BREAK });
    expect(totalMs(state)).toBe(DEFAULT_SETTINGS.shortBreakMinutes * 60 * 1000);
  });

  test('long_break モードでは longBreakMinutes × 60000 を返す', () => {
    const state = Object.assign(createTimerState(), { mode: MODE.LONG_BREAK });
    expect(totalMs(state)).toBe(DEFAULT_SETTINGS.longBreakMinutes * 60 * 1000);
  });
});

// ---------------------------------------------------------------------------
// start
// ---------------------------------------------------------------------------

describe('start', () => {
  test('idle 状態から開始すると RUNNING になる', () => {
    const state = createTimerState();
    const started = start(state, fixedTime(T0));
    expect(started.status).toBe(STATUS.RUNNING);
  });

  test('開始時の endTime = now + totalMs', () => {
    const state = createTimerState({ workMinutes: 25 });
    const started = start(state, fixedTime(T0));
    expect(started.endTime).toBe(T0 + 25 * 60 * 1000);
  });

  test('元の state を変更しない（イミュータブル）', () => {
    const state = createTimerState();
    start(state, fixedTime(T0));
    expect(state.status).toBe(STATUS.IDLE);
  });
});

// ---------------------------------------------------------------------------
// pause
// ---------------------------------------------------------------------------

describe('pause', () => {
  test('running 中に pause すると PAUSED になる', () => {
    const state = start(createTimerState(), fixedTime(T0));
    const paused = pause(state, fixedTime(T0 + 5000)); // 5秒経過
    expect(paused.status).toBe(STATUS.PAUSED);
  });

  test('pause 時に pausedRemaining に残り時間が保存される', () => {
    const state = start(createTimerState({ workMinutes: 25 }), fixedTime(T0));
    const elapsed = 5000;
    const paused = pause(state, fixedTime(T0 + elapsed));
    const expectedRemaining = 25 * 60 * 1000 - elapsed;
    expect(paused.pausedRemaining).toBe(expectedRemaining);
  });

  test('idle 状態で pause を呼んでも state が変わらない', () => {
    const state = createTimerState();
    const result = pause(state, fixedTime(T0));
    expect(result).toBe(state);
  });
});

// ---------------------------------------------------------------------------
// resume
// ---------------------------------------------------------------------------

describe('resume', () => {
  test('paused 状態から resume すると RUNNING に戻る', () => {
    const stateRunning = start(createTimerState(), fixedTime(T0));
    const statePaused  = pause(stateRunning, fixedTime(T0 + 3000));
    const stateResumed = resume(statePaused, fixedTime(T0 + 10000));
    expect(stateResumed.status).toBe(STATUS.RUNNING);
  });

  test('resume 後の endTime = now + pausedRemaining', () => {
    const stateRunning = start(createTimerState({ workMinutes: 25 }), fixedTime(T0));
    const statePaused  = pause(stateRunning, fixedTime(T0 + 5000));
    const resumeTime   = T0 + 20000;
    const stateResumed = resume(statePaused, fixedTime(resumeTime));
    expect(stateResumed.endTime).toBe(resumeTime + statePaused.pausedRemaining);
  });

  test('idle 状態で resume を呼んでも state が変わらない', () => {
    const state = createTimerState();
    const result = resume(state, fixedTime(T0));
    expect(result).toBe(state);
  });
});

// ---------------------------------------------------------------------------
// reset
// ---------------------------------------------------------------------------

describe('reset', () => {
  test('reset すると IDLE に戻る', () => {
    const state = start(createTimerState(), fixedTime(T0));
    expect(reset(state).status).toBe(STATUS.IDLE);
  });

  test('reset すると remainingMs がモードの初期値に戻る', () => {
    const state = start(createTimerState({ workMinutes: 25 }), fixedTime(T0));
    expect(reset(state).remainingMs).toBe(25 * 60 * 1000);
  });

  test('reset すると endTime が null になる', () => {
    const state = start(createTimerState(), fixedTime(T0));
    expect(reset(state).endTime).toBeNull();
  });

  test('paused 状態からもリセットできる', () => {
    const state = pause(start(createTimerState(), fixedTime(T0)), fixedTime(T0 + 1000));
    const r = reset(state);
    expect(r.status).toBe(STATUS.IDLE);
    expect(r.pausedRemaining).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// getRemainingMs / getRemainingSeconds
// ---------------------------------------------------------------------------

describe('getRemainingMs', () => {
  test('idle 状態では remainingMs をそのまま返す', () => {
    const state = createTimerState({ workMinutes: 25 });
    expect(getRemainingMs(state, fixedTime(T0))).toBe(25 * 60 * 1000);
  });

  test('running 状態では endTime - now を返す', () => {
    const state = start(createTimerState({ workMinutes: 25 }), fixedTime(T0));
    expect(getRemainingMs(state, fixedTime(T0 + 3000))).toBe(25 * 60 * 1000 - 3000);
  });

  test('paused 状態では pausedRemaining を返す', () => {
    const state = pause(start(createTimerState(), fixedTime(T0)), fixedTime(T0 + 4000));
    expect(getRemainingMs(state, fixedTime(T0 + 99999))).toBe(state.pausedRemaining);
  });

  test('endTime を過ぎても 0 以上を保証する', () => {
    const state = start(createTimerState({ workMinutes: 25 }), fixedTime(T0));
    const overTime = T0 + 26 * 60 * 1000; // 26分後（1分超過）
    expect(getRemainingMs(state, fixedTime(overTime))).toBe(0);
  });
});

describe('getRemainingSeconds', () => {
  test('ミリ秒を切り上げて秒に変換する', () => {
    const state = start(createTimerState({ workMinutes: 25 }), fixedTime(T0));
    // 1ms 経過 → 残り 24分59秒999ms → 切り上げで 1500秒
    expect(getRemainingSeconds(state, fixedTime(T0 + 1))).toBe(25 * 60);
  });
});

// ---------------------------------------------------------------------------
// isComplete
// ---------------------------------------------------------------------------

describe('isComplete', () => {
  test('running 中で時刻が endTime 前なら false', () => {
    const state = start(createTimerState({ workMinutes: 25 }), fixedTime(T0));
    expect(isComplete(state, fixedTime(T0 + 1000))).toBe(false);
  });

  test('running 中で残り時間が 0 なら true', () => {
    const state = start(createTimerState({ workMinutes: 25 }), fixedTime(T0));
    const atEnd = fixedTime(T0 + 25 * 60 * 1000);
    expect(isComplete(state, atEnd)).toBe(true);
  });

  test('idle 状態では false', () => {
    expect(isComplete(createTimerState(), fixedTime(T0))).toBe(false);
  });

  test('paused 状態では false', () => {
    const state = pause(start(createTimerState(), fixedTime(T0)), fixedTime(T0 + 1000));
    expect(isComplete(state, fixedTime(T0 + 99999))).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// completeSession
// ---------------------------------------------------------------------------

describe('completeSession', () => {
  test('指定した nextMode で新しい state を返す', () => {
    const state = start(createTimerState(), fixedTime(T0));
    const next = completeSession(state, MODE.SHORT_BREAK);
    expect(next.mode).toBe(MODE.SHORT_BREAK);
    expect(next.status).toBe(STATUS.IDLE);
  });

  test('nextMode が long_break のときも動作する', () => {
    const state = start(createTimerState(), fixedTime(T0));
    const next = completeSession(state, MODE.LONG_BREAK);
    expect(next.mode).toBe(MODE.LONG_BREAK);
  });

  test('next state の remainingMs は新しいモードの totalMs になる', () => {
    const state = start(createTimerState(), fixedTime(T0));
    const next = completeSession(state, MODE.SHORT_BREAK);
    expect(next.remainingMs).toBe(next.settings.shortBreakMinutes * 60 * 1000);
  });
});
