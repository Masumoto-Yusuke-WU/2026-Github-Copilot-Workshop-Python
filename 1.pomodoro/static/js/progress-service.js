'use strict';

function formatDateKey(date) {
	const y = date.getFullYear();
	const m = String(date.getMonth() + 1).padStart(2, '0');
	const d = String(date.getDate()).padStart(2, '0');
	return `${y}-${m}-${d}`;
}

function todayKey(timeProvider) {
	const nowMs = timeProvider && typeof timeProvider.now === 'function'
		? timeProvider.now()
		: Date.now();
	return formatDateKey(new Date(nowMs));
}

function createProgress(dateKey) {
	return {
		dateKey,
		completedCount: 0,
		focusedMinutes: 0,
	};
}

function ensureToday(progress, currentDateKey) {
	if (!progress || progress.dateKey !== currentDateKey) {
		return createProgress(currentDateKey);
	}

	return {
		dateKey: currentDateKey,
		completedCount: Number(progress.completedCount) || 0,
		focusedMinutes: Number(progress.focusedMinutes) || 0,
	};
}

function recordWorkCompletion(progress, workMinutes, currentDateKey) {
	const base = ensureToday(progress, currentDateKey);
	return {
		dateKey: base.dateKey,
		completedCount: base.completedCount + 1,
		focusedMinutes: base.focusedMinutes + workMinutes,
	};
}

if (typeof window !== 'undefined') {
	window.ProgressService = {
		formatDateKey,
		todayKey,
		createProgress,
		ensureToday,
		recordWorkCompletion,
	};
}

if (typeof module !== 'undefined' && module.exports) {
	module.exports = {
		formatDateKey,
		todayKey,
		createProgress,
		ensureToday,
		recordWorkCompletion,
	};
}
