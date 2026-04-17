/**
 * timer-engine.js
 *
 * タイマーのドメインロジック。DOM・localStorage に依存しない。
 * 時刻取得は timeProvider 経由で注入できるため、テストで固定時刻を使える。
 *
 * timeProvider: { now() => milliseconds }
 */

'use strict';

// ---------------------------------------------------------------------------
// 定数
// ---------------------------------------------------------------------------
const MODE = Object.freeze({
	WORK:        'work',
	SHORT_BREAK: 'short_break',
	LONG_BREAK:  'long_break',
});

const STATUS = Object.freeze({
	IDLE:    'idle',
	RUNNING: 'running',
	PAUSED:  'paused',
});

const DEFAULT_SETTINGS = Object.freeze({
	workMinutes:       25,
	shortBreakMinutes:  5,
	longBreakMinutes:  15,
	longBreakInterval:  4,
});

// ---------------------------------------------------------------------------
// ファクトリ
// ---------------------------------------------------------------------------

/**
 * 初期 TimerState を生成する。
 * @param {object} [settings]
 * @returns {TimerState}
 */
function createTimerState(settings = {}) {
	const s = Object.assign({}, DEFAULT_SETTINGS, settings);
	return {
		mode:            MODE.WORK,
		status:          STATUS.IDLE,
		remainingMs:     s.workMinutes * 60 * 1000,
		endTime:         null,   // running 中のみ有効
		pausedRemaining: null,   // paused 中のみ有効
		settings:        Object.assign({}, s),
	};
}

// ---------------------------------------------------------------------------
// ヘルパー
// ---------------------------------------------------------------------------

/** 現在モードの総ミリ秒を返す */
function totalMs(state) {
	const { workMinutes, shortBreakMinutes, longBreakMinutes } = state.settings;
	switch (state.mode) {
		case MODE.WORK:        return workMinutes       * 60 * 1000;
		case MODE.SHORT_BREAK: return shortBreakMinutes * 60 * 1000;
		case MODE.LONG_BREAK:  return longBreakMinutes  * 60 * 1000;
		default:               throw new Error(`Unknown mode: ${state.mode}`);
	}
}

/**
 * 残りミリ秒を返す。endTime 基準なのでタブ切り替えのずれを防ぐ。
 * @param {TimerState} state
 * @param {object} timeProvider
 * @returns {number} 残りミリ秒（0 以上）
 */
function getRemainingMs(state, timeProvider) {
	if (state.status === STATUS.RUNNING) {
		return Math.max(0, state.endTime - timeProvider.now());
	}
	if (state.status === STATUS.PAUSED) {
		return state.pausedRemaining;
	}
	return state.remainingMs;
}

/** 残り秒（切り上げ）を返す */
function getRemainingSeconds(state, timeProvider) {
	return Math.ceil(getRemainingMs(state, timeProvider) / 1000);
}

/** セッションが完了しているかを返す */
function isComplete(state, timeProvider) {
	return state.status === STATUS.RUNNING &&
		getRemainingMs(state, timeProvider) <= 0;
}

// ---------------------------------------------------------------------------
// 状態遷移（すべて新しい state オブジェクトを返す純粋関数）
// ---------------------------------------------------------------------------

/**
 * タイマーを開始する。idle / paused どちらからでも呼べる。
 */
function start(state, timeProvider) {
	const remaining =
		state.status === STATUS.PAUSED
			? state.pausedRemaining
			: totalMs(state);

	return Object.assign({}, state, {
		status:          STATUS.RUNNING,
		endTime:         timeProvider.now() + remaining,
		pausedRemaining: null,
		remainingMs:     remaining,
	});
}

/**
 * タイマーを一時停止する。running 中のみ有効。
 */
function pause(state, timeProvider) {
	if (state.status !== STATUS.RUNNING) return state;

	return Object.assign({}, state, {
		status:          STATUS.PAUSED,
		pausedRemaining: getRemainingMs(state, timeProvider),
		endTime:         null,
	});
}

/**
 * 一時停止したタイマーを再開する。paused 中のみ有効。
 */
function resume(state, timeProvider) {
	if (state.status !== STATUS.PAUSED) return state;
	return start(state, timeProvider);
}

/**
 * タイマーをリセットする。現在のモードの初期時間に戻す。
 */
function reset(state) {
	return Object.assign({}, state, {
		status:          STATUS.IDLE,
		remainingMs:     totalMs(state),
		endTime:         null,
		pausedRemaining: null,
	});
}

/**
 * セッション完了後に次のモードへ遷移した新しい state を返す。
 * mode の決定は SessionPolicy に委譲する（ここでは completedWorkCount を受け取る）。
 * @param {TimerState} state
 * @param {string} nextMode - SessionPolicy が決定したモード
 * @returns {TimerState}
 */
function completeSession(state, nextMode) {
	const next = Object.assign({}, state, { mode: nextMode });
	return reset(next);
}

// ---------------------------------------------------------------------------
// デフォルト TimeProvider（本番用）
// ---------------------------------------------------------------------------
const realTimeProvider = { now: () => Date.now() };

if (typeof window !== 'undefined') {
	window.TimerEngine = {
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
		realTimeProvider,
	};
	window.MODE = MODE;
	window.STATUS = STATUS;
}

// ---------------------------------------------------------------------------
// エクスポート（Node.js / Jest 環境）
// ---------------------------------------------------------------------------
if (typeof module !== 'undefined' && module.exports) {
	module.exports = {
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
		realTimeProvider,
	};
}
