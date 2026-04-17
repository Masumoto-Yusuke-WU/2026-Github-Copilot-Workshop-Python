'use strict';

const SETTINGS_KEY = 'pomodoro.settings.v1';
const PROGRESS_KEY = 'pomodoro.progress.v1';

function getDefaultStorage() {
	if (typeof window !== 'undefined' && window.localStorage) {
		return window.localStorage;
	}

	return {
		_map: {},
		getItem(key) { return Object.prototype.hasOwnProperty.call(this._map, key) ? this._map[key] : null; },
		setItem(key, value) { this._map[key] = String(value); },
		removeItem(key) { delete this._map[key]; },
	};
}

function toPositiveInt(value, fallback) {
	const n = Number(value);
	if (!Number.isFinite(n)) return fallback;
	const intValue = Math.floor(n);
	if (intValue <= 0) return fallback;
	return intValue;
}

function sanitizeSettings(input, defaultSettings) {
	const base = defaultSettings || {};
	return {
		workMinutes: toPositiveInt(input.workMinutes, base.workMinutes),
		shortBreakMinutes: toPositiveInt(input.shortBreakMinutes, base.shortBreakMinutes),
		longBreakMinutes: toPositiveInt(input.longBreakMinutes, base.longBreakMinutes),
		longBreakInterval: toPositiveInt(input.longBreakInterval, base.longBreakInterval),
	};
}

class SettingsRepository {
	constructor(storage, key) {
		this.storage = storage || getDefaultStorage();
		this.key = key || SETTINGS_KEY;
	}

	load(defaultSettings) {
		const raw = this.storage.getItem(this.key);
		if (!raw) {
			return Object.assign({}, defaultSettings);
		}

		try {
			const parsed = JSON.parse(raw);
			return sanitizeSettings(parsed, defaultSettings);
		} catch (_) {
			return Object.assign({}, defaultSettings);
		}
	}

	save(settings, defaultSettings) {
		const sanitized = sanitizeSettings(settings, defaultSettings || settings);
		this.storage.setItem(this.key, JSON.stringify(sanitized));
		return sanitized;
	}
}

class ProgressRepository {
	constructor(storage, key) {
		this.storage = storage || getDefaultStorage();
		this.key = key || PROGRESS_KEY;
	}

	load(defaultProgress) {
		const raw = this.storage.getItem(this.key);
		if (!raw) {
			return Object.assign({}, defaultProgress);
		}

		try {
			const parsed = JSON.parse(raw);
			return {
				dateKey: parsed.dateKey || defaultProgress.dateKey,
				completedCount: Number(parsed.completedCount) || 0,
				focusedMinutes: Number(parsed.focusedMinutes) || 0,
			};
		} catch (_) {
			return Object.assign({}, defaultProgress);
		}
	}

	save(progress) {
		const normalized = {
			dateKey: progress.dateKey,
			completedCount: Number(progress.completedCount) || 0,
			focusedMinutes: Number(progress.focusedMinutes) || 0,
		};

		this.storage.setItem(this.key, JSON.stringify(normalized));
		return normalized;
	}
}

if (typeof window !== 'undefined') {
	window.Repositories = {
		SettingsRepository,
		ProgressRepository,
		SETTINGS_KEY,
		PROGRESS_KEY,
	};
}

if (typeof module !== 'undefined' && module.exports) {
	module.exports = {
		SettingsRepository,
		ProgressRepository,
		SETTINGS_KEY,
		PROGRESS_KEY,
		sanitizeSettings,
	};
}
