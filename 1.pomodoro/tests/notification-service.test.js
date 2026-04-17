'use strict';

const {
  buildCompletionMessage,
  requestPermissionIfNeeded,
  notifySessionCompleted,
} = require('../static/js/notification-service');

describe('notification-service', () => {
  test('buildCompletionMessage: work の文言を返す', () => {
    expect(buildCompletionMessage('work')).toContain('作業セッションが完了');
  });

  test('buildCompletionMessage: break の文言を返す', () => {
    expect(buildCompletionMessage('short_break')).toContain('休憩が終了');
    expect(buildCompletionMessage('long_break')).toContain('休憩が終了');
  });

  test('requestPermissionIfNeeded: API が無い場合 unsupported', async () => {
    await expect(requestPermissionIfNeeded(undefined)).resolves.toBe('unsupported');
  });

  test('requestPermissionIfNeeded: permission が granted なら即返す', async () => {
    const Api = { permission: 'granted', requestPermission: jest.fn() };
    await expect(requestPermissionIfNeeded(Api)).resolves.toBe('granted');
    expect(Api.requestPermission).not.toHaveBeenCalled();
  });

  test('requestPermissionIfNeeded: default の場合は requestPermission を呼ぶ', async () => {
    const Api = {
      permission: 'default',
      requestPermission: jest.fn().mockResolvedValue('granted'),
    };
    await expect(requestPermissionIfNeeded(Api)).resolves.toBe('granted');
    expect(Api.requestPermission).toHaveBeenCalledTimes(1);
  });

  test('notifySessionCompleted: permission granted 時に通知を作る', () => {
    const Api = jest.fn();
    Api.permission = 'granted';

    notifySessionCompleted('work', Api);

    expect(Api).toHaveBeenCalledTimes(1);
    expect(Api.mock.calls[0][0]).toBe('作業完了');
  });

  test('notifySessionCompleted: permission denied 時は通知しない', () => {
    const Api = jest.fn();
    Api.permission = 'denied';

    notifySessionCompleted('work', Api);

    expect(Api).not.toHaveBeenCalled();
  });
});
