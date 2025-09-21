import * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const submit = jest.fn();
const subscribe = jest.fn((listener: (state: { isSubmitting: boolean; errorMessage: string | null; formInstance: number }) => void) => {
  listener({ isSubmitting: false, errorMessage: null, formInstance: 1 });
  return () => {};
});
const getSnapshot = jest.fn(() => ({ isSubmitting: false, errorMessage: null, formInstance: 1 }));

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

describe('Admin LoginForm', () => {
  beforeEach(() => {
    submit.mockClear();
    subscribe.mockClear();
    getSnapshot.mockClear();
    loginCardProps.length = 0;
    jest.clearAllMocks();
  });

  it('renders a login card with administrator-specific messaging', () => {
    const { LoginForm } = require('@/components/LoginForm');

    renderToStaticMarkup(
      React.createElement(LoginForm, {
        callbackUrl: '/',
        supportEmail: 'security@fxportal.local',
      }),
    );

    expect(loginCardProps).toHaveLength(1);
    const props = loginCardProps[0];
    expect(props.title).toBe('FX Option Control Room');
    expect(props.supportEmail).toBe('security@fxportal.local');
    expect(props.onSubmit).toBe(submit);
  });
});
