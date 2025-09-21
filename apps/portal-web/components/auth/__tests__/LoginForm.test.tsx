import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const submit = jest.fn();
const subscribe = jest.fn((listener: (state: { isSubmitting: boolean; errorMessage: string | null; formInstance: number }) => void) => {
  listener({ isSubmitting: false, errorMessage: null, formInstance: 2 });
  return () => {};
});
const getSnapshot = jest.fn(() => ({ isSubmitting: false, errorMessage: null, formInstance: 2 }));

const controller = { submit, subscribe, getSnapshot } as const;

const loginCardProps: Array<Record<string, any>> = [];

jest.mock('@shared/auth', () => ({
  ...jest.requireActual('@shared/auth'),
  createLoginController: jest.fn(() => controller),
}));

jest.mock('ui-kit', () => ({
  LoginCard: (props: Record<string, any>) => {
    loginCardProps.push(props);
    return null;
  },
}));

describe('LoginForm', () => {
  beforeEach(() => {
    submit.mockClear();
    subscribe.mockClear();
    getSnapshot.mockClear();
    loginCardProps.length = 0;
    jest.clearAllMocks();
  });

  it('renders a login card with subscription state from the controller', () => {
    const { LoginForm } = require('@/components/auth/LoginForm');

    renderToStaticMarkup(
      React.createElement(LoginForm, {
        callbackUrl: '/app',
        supportEmail: 'ops@fxportal.local',
      }),
    );

    expect(loginCardProps).toHaveLength(1);
    const props = loginCardProps[0];
    expect(props.supportEmail).toBe('ops@fxportal.local');
    expect(props.isSubmitting).toBe(false);
    expect(props.errorMessage).toBeNull();
    expect(props.onSubmit).toBe(submit);
  });

  it('creates the controller with the provided callback URL', () => {
    const { createLoginController } = require('@shared/auth');
    const { LoginForm } = require('@/components/auth/LoginForm');

    renderToStaticMarkup(React.createElement(LoginForm, { callbackUrl: '/portal' }));

    expect(createLoginController).toHaveBeenCalledWith(
      expect.objectContaining({
        callbackUrl: '/portal',
      }),
    );
  });
});
