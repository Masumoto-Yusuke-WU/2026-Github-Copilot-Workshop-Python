'use strict';

(function () {
	const timerDisplay = document.getElementById('timer-display');
	const modeLabel = document.getElementById('mode-label');
	const startButton = document.getElementById('btn-start');
	const resetButton = document.getElementById('btn-reset');
	const completedCount = document.getElementById('completed-count');
	const focusTime = document.getElementById('focus-time');
	const ringProgress = document.getElementById('ring-progress');
	const settingWork = document.getElementById('setting-work');
	const settingShortBreak = document.getElementById('setting-short-break');
	const settingLongBreak = document.getElementById('setting-long-break');
	const settingInterval = document.getElementById('setting-interval');
	const saveSettingsButton = document.getElementById('btn-save-settings');

	if (!timerDisplay || !startButton || !resetButton) {
		return;
	}

	const {
		MODE,
		STATUS,
		DEFAULT_SETTINGS,
		createTimerState,
		start,
		pause,
		resume,
		reset,
		completeSession,
		getRemainingSeconds,
		getRemainingMs,
		isComplete,
		totalMs,
		realTimeProvider,
	} = window.TimerEngine;

	const { nextMode } = window.SessionPolicy;
	const { todayKey, createProgress, ensureToday, recordWorkCompletion } = window.ProgressService;
	const { SettingsRepository, ProgressRepository } = window.Repositories;
	const {
		requestPermissionIfNeeded,
		playBeep,
		notifySessionCompleted,
	} = window.NotificationService;

	const settingsRepository = new SettingsRepository();
	const progressRepository = new ProgressRepository();

	let settings = settingsRepository.load(DEFAULT_SETTINGS);
	let state = createTimerState(settings);
	let progress = ensureToday(
		progressRepository.load(createProgress(todayKey(realTimeProvider))),
		todayKey(realTimeProvider),
	);
	let tickHandle = null;

	const RING_CIRCUMFERENCE = 2 * Math.PI * 80;

	function formatSeconds(totalSeconds) {
		const minutes = Math.floor(totalSeconds / 60);
		const seconds = totalSeconds % 60;
		return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
	}

	function getModeLabel(mode) {
		switch (mode) {
			case MODE.WORK:
				return '作業中';
			case MODE.SHORT_BREAK:
				return '短い休憩';
			case MODE.LONG_BREAK:
				return '長い休憩';
			default:
				return '作業中';
		}
	}

	function updateRing() {
		const remaining = getRemainingMs(state, realTimeProvider);
		const total = totalMs(state);
		const progress = total === 0 ? 0 : Math.max(0, Math.min(1, remaining / total));
		ringProgress.style.strokeDasharray = String(RING_CIRCUMFERENCE);
		ringProgress.style.strokeDashoffset = String(RING_CIRCUMFERENCE * (1 - progress));
	}

	function updateButtons() {
		if (state.status === STATUS.RUNNING) {
			startButton.textContent = '一時停止';
			return;
		}

		if (state.status === STATUS.PAUSED) {
			startButton.textContent = '再開';
			return;
		}

		startButton.textContent = '開始';
	}

	function render() {
		const ensuredProgress = ensureToday(progress, todayKey(realTimeProvider));
		if (ensuredProgress !== progress) {
			progress = progressRepository.save(ensuredProgress);
		} else {
			progress = ensuredProgress;
		}
		timerDisplay.textContent = formatSeconds(getRemainingSeconds(state, realTimeProvider));
		modeLabel.textContent = getModeLabel(state.mode);
		completedCount.textContent = String(progress.completedCount);
		focusTime.textContent = `${progress.focusedMinutes}分`;
		document.body.classList.remove('mode-work', 'mode-short-break', 'mode-long-break');
		document.body.classList.add(`mode-${state.mode.replace('_', '-')}`);
		updateButtons();
		updateRing();
	}

	function stopTicker() {
		if (tickHandle !== null) {
			window.clearInterval(tickHandle);
			tickHandle = null;
		}
	}

	function handleCompletion() {
		stopTicker();
		playBeep();
		notifySessionCompleted(state.mode);

		if (state.mode === MODE.WORK) {
			progress = recordWorkCompletion(
				progress,
				state.settings.workMinutes,
				todayKey(realTimeProvider),
			);
			progress = progressRepository.save(progress);
		}

		const next = nextMode(
			state.mode,
			progress.completedCount,
			state.settings.longBreakInterval,
		);

		state = completeSession(state, next);
		render();
	}

	function ensureTicker() {
		if (tickHandle !== null) {
			return;
		}

		tickHandle = window.setInterval(() => {
			if (isComplete(state, realTimeProvider)) {
				handleCompletion();
				return;
			}
			render();
		}, 250);
	}

	function onStartClick() {
		if (state.status === STATUS.RUNNING) {
			state = pause(state, realTimeProvider);
			stopTicker();
			render();
			return;
		}

		if (state.status === STATUS.PAUSED) {
			state = resume(state, realTimeProvider);
		} else {
			state = start(state, realTimeProvider);
		}

		ensureTicker();
		render();
	}

	function onResetClick() {
		state = reset(state);
		stopTicker();
		render();
	}

	function persistSettings(nextSettings) {
		settings = settingsRepository.save(nextSettings, DEFAULT_SETTINGS);
		state = createTimerState(settings);
		if (settingWork) settingWork.value = String(settings.workMinutes);
		if (settingShortBreak) settingShortBreak.value = String(settings.shortBreakMinutes);
		if (settingLongBreak) settingLongBreak.value = String(settings.longBreakMinutes);
		if (settingInterval) settingInterval.value = String(settings.longBreakInterval);
		stopTicker();
		render();
	}

	function readSettingsFromForm() {
		return {
			workMinutes: Number(settingWork.value),
			shortBreakMinutes: Number(settingShortBreak.value),
			longBreakMinutes: Number(settingLongBreak.value),
			longBreakInterval: Number(settingInterval.value),
		};
	}

	function onSaveSettingsClick() {
		persistSettings(readSettingsFromForm());
	}

	startButton.addEventListener('click', onStartClick);
	resetButton.addEventListener('click', onResetClick);
	if (saveSettingsButton) {
		saveSettingsButton.addEventListener('click', onSaveSettingsClick);
	}

	progress = progressRepository.save(progress);
	persistSettings(settings);
	requestPermissionIfNeeded();

	render();
}());
