'use strict';

function buildCompletionMessage(mode) {
	if (mode === 'work') return '作業セッションが完了しました。休憩しましょう。';
	if (mode === 'short_break' || mode === 'long_break') return '休憩が終了しました。次の作業を始めましょう。';
	return 'セッションが完了しました。';
}

function playBeep(audioContextFactory) {
	if (typeof window === 'undefined') return;
	const factory = audioContextFactory || (() => new (window.AudioContext || window.webkitAudioContext)());

	try {
		const audioContext = factory();
		const oscillator = audioContext.createOscillator();
		const gainNode = audioContext.createGain();

		oscillator.type = 'sine';
		oscillator.frequency.setValueAtTime(880, audioContext.currentTime);
		gainNode.gain.setValueAtTime(0.0001, audioContext.currentTime);
		gainNode.gain.exponentialRampToValueAtTime(0.1, audioContext.currentTime + 0.02);
		gainNode.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 0.3);

		oscillator.connect(gainNode);
		gainNode.connect(audioContext.destination);
		oscillator.start();
		oscillator.stop(audioContext.currentTime + 0.3);
	} catch (_) {
		// 音の再生に失敗しても、タイマー本体は継続する。
	}
}

function requestPermissionIfNeeded(NotificationApi) {
	const Api = NotificationApi || (typeof window !== 'undefined' ? window.Notification : undefined);
	if (!Api || typeof Api.requestPermission !== 'function') {
		return Promise.resolve('unsupported');
	}

	if (Api.permission === 'granted' || Api.permission === 'denied') {
		return Promise.resolve(Api.permission);
	}

	return Api.requestPermission();
}

function notifySessionCompleted(mode, NotificationApi) {
	const Api = NotificationApi || (typeof window !== 'undefined' ? window.Notification : undefined);
	if (!Api || Api.permission !== 'granted') {
		return;
	}

	const title = mode === 'work' ? '作業完了' : '休憩完了';
	const body = buildCompletionMessage(mode);
	new Api(title, { body });
}

if (typeof window !== 'undefined') {
	window.NotificationService = {
		buildCompletionMessage,
		playBeep,
		requestPermissionIfNeeded,
		notifySessionCompleted,
	};
}

if (typeof module !== 'undefined' && module.exports) {
	module.exports = {
		buildCompletionMessage,
		playBeep,
		requestPermissionIfNeeded,
		notifySessionCompleted,
	};
}