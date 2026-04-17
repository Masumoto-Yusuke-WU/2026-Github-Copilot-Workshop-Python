/**
 * session-policy.js
 *
 * セッション完了後の次モードを決定する純粋ロジック。
 * 遷移ルールをここだけに集約し、散在した if 文を防ぐ。
 */

'use strict';

// MODE は timer-engine.js と共有。Node 環境ではそちらから取得する。
// ブラウザ環境では timer-engine.js が先に読み込まれている前提。
const _MODE = (typeof require !== 'undefined')
	? require('./timer-engine').MODE
	: MODE; // eslint-disable-line no-undef

/**
 * 次のモードを返す。
 *
 * ルール:
 *   - work 完了時:
 *     - completedWorkCount が longBreakInterval の倍数 → long_break
 *     - それ以外 → short_break
 *   - short_break / long_break 完了時:
 *     - work へ戻る
 *
 * @param {string} currentMode   - 完了したモード
 * @param {number} completedWorkCount - 今回の完了後の集中回数
 * @param {number} longBreakInterval  - 何回ごとに長休憩か
 * @returns {string} 次のモード
 */
function nextMode(currentMode, completedWorkCount, longBreakInterval) {
	if (currentMode === _MODE.WORK) {
		return (completedWorkCount % longBreakInterval === 0)
			? _MODE.LONG_BREAK
			: _MODE.SHORT_BREAK;
	}
	return _MODE.WORK;
}

if (typeof window !== 'undefined') {
	window.SessionPolicy = { nextMode };
}

// ---------------------------------------------------------------------------
// エクスポート（Node.js / Jest 環境）
// ---------------------------------------------------------------------------
if (typeof module !== 'undefined' && module.exports) {
	module.exports = { nextMode };
}
