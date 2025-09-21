import { createLoginController, type LoginControllerState } from '../login-controller';

describe('createLoginController', () => {
  const messages = {
    generic: 'Unable to sign in. Please try again.',
    invalidCredentials: 'Invalid email or password.',
    locked: 'Account locked. Contact support.',
  };

  const collectStates = (controller: ReturnType<typeof createLoginController>) => {
    const snapshots: LoginControllerState[] = [];
    const unsubscribe = controller.subscribe((state) => {
      snapshots.push(state);
    });
    return { snapshots, unsubscribe };
  };

  it('submits credentials to the configured sign-in provider', async () => {
    const signIn = jest.fn().mockResolvedValue({ ok: true, url: '/app/positions' });
    const onSuccess = jest.fn();
    const controller = createLoginController({
      callbackUrl: '/app',
      signIn,
      onSuccess,
      messages,
    });
    const { snapshots } = collectStates(controller);

    await controller.submit({ email: 'demo@fxportal.local', password: 'secret' });

    expect(signIn).toHaveBeenCalledWith('credentials', {
      email: 'demo@fxportal.local',
      password: 'secret',
      redirect: false,
      callbackUrl: '/app',
    });
    expect(onSuccess).toHaveBeenCalledWith('/app/positions');
    expect(controller.getSnapshot()).toEqual({
      isSubmitting: false,
      errorMessage: null,
      formInstance: 1,
    });
    expect(snapshots.some((state) => state.isSubmitting)).toBe(true);
  });

  it('falls back to the callback URL when the provider omits a redirect', async () => {
    const signIn = jest.fn().mockResolvedValue({ ok: true, url: null });
    const onSuccess = jest.fn();
    const controller = createLoginController({
      callbackUrl: '/portal',
      signIn,
      onSuccess,
      messages,
    });

    await controller.submit({ email: 'demo@fxportal.local', password: 'secret' });

    expect(onSuccess).toHaveBeenCalledWith('/portal');
    expect(controller.getSnapshot().formInstance).toBe(1);
  });

  it('surfaces locked account errors returned by the identity provider', async () => {
    const signIn = jest.fn().mockResolvedValue({ ok: false, error: 'AccountLocked' });
    const controller = createLoginController({
      callbackUrl: '/app',
      signIn,
      messages,
    });

    await controller.submit({ email: 'demo@fxportal.local', password: 'secret' });

    expect(controller.getSnapshot()).toEqual({
      isSubmitting: false,
      errorMessage: messages.locked,
      formInstance: 0,
    });
  });

  it('surfaces credential failures when the provider rejects the attempt', async () => {
    const signIn = jest.fn().mockResolvedValue({ ok: false, error: 'CredentialsSignin' });
    const controller = createLoginController({
      callbackUrl: '/app',
      signIn,
      messages,
    });

    await controller.submit({ email: 'demo@fxportal.local', password: 'secret' });

    expect(controller.getSnapshot().errorMessage).toBe(messages.invalidCredentials);
  });

  it('reports a generic error when the provider returns no response', async () => {
    const signIn = jest.fn().mockResolvedValue(undefined);
    const controller = createLoginController({
      callbackUrl: '/app',
      signIn,
      messages,
    });

    await controller.submit({ email: 'demo@fxportal.local', password: 'secret' });

    expect(controller.getSnapshot().errorMessage).toBe(messages.generic);
  });

  it('invokes the error handler when the provider throws', async () => {
    const cause = new Error('identity service unavailable');
    const signIn = jest.fn().mockRejectedValue(cause);
    const onError = jest.fn();
    const controller = createLoginController({
      callbackUrl: '/app',
      signIn,
      onError,
      messages,
    });

    await controller.submit({ email: 'demo@fxportal.local', password: 'secret' });

    expect(onError).toHaveBeenCalledWith(cause);
    expect(controller.getSnapshot().errorMessage).toBe(messages.generic);
  });
});
