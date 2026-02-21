/**
 * Tests for email.ts — admin email notification helper.
 */

import { createMockEnv } from './test-helpers';

const fetchMock = jest.fn() as jest.MockedFunction<typeof fetch>;
Object.defineProperty(globalThis, 'fetch', { value: fetchMock, writable: true });

import { sendAdminEmail } from '../api/_shared/email';

beforeEach(() => {
  fetchMock.mockReset();
});

describe('sendAdminEmail', () => {
  it('sends an email via Resend API', async () => {
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ id: 'email_123' }), { status: 200 }));

    const env = createMockEnv();
    await sendAdminEmail(env, 'Test Subject', 'Test body');

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe('https://api.resend.com/emails');
    expect(options?.method).toBe('POST');

    const headers = options?.headers as Record<string, string>;
    expect(headers['Authorization']).toBe('Bearer test_resend_key');
    expect(headers['Content-Type']).toBe('application/json');

    const body = JSON.parse(options?.body as string);
    expect(body.from).toBe('Darkly Suite <notifications@darklysuite.com>');
    expect(body.to).toBe('admin@example.com');
    expect(body.subject).toBe('Test Subject');
    expect(body.text).toBe('Test body');
  });

  it('does nothing when RESEND_API_KEY is not set', async () => {
    const env = createMockEnv({ RESEND_API_KEY: undefined });
    await sendAdminEmail(env, 'Subject', 'Body');

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('logs error but does not throw on Resend API failure', async () => {
    fetchMock.mockResolvedValueOnce(new Response('Unauthorized', { status: 401 }));
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    const env = createMockEnv();
    await expect(sendAdminEmail(env, 'Subject', 'Body')).resolves.not.toThrow();

    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('sendEmail failed (401)'));
    consoleSpy.mockRestore();
  });

  it('logs error but does not throw on network failure', async () => {
    fetchMock.mockRejectedValueOnce(new Error('Network error'));
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    const env = createMockEnv();
    await expect(sendAdminEmail(env, 'Subject', 'Body')).resolves.not.toThrow();

    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Network error'));
    consoleSpy.mockRestore();
  });
});
