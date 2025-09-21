import * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const promptProps: Array<Record<string, any>> = [];

jest.mock('ui-kit', () => ({
  MfaPrompt: (props: Record<string, any>) => {
    promptProps.push(props);
    return null;
  },
}));

describe('MfaPrompt', () => {
  beforeEach(() => {
    promptProps.length = 0;
    jest.clearAllMocks();
  });

  it('forwards contact and email metadata to the UI kit prompt', () => {
    const { MfaPrompt } = require('@/components/auth/MfaPrompt');

    renderToStaticMarkup(
      React.createElement(MfaPrompt, {
        email: 'compliance@fxportal.local',
        supportEmail: 'security@fxportal.local',
      }),
    );

    expect(promptProps).toHaveLength(1);
    const props = promptProps[0];
    expect(props.email).toBe('compliance@fxportal.local');
    expect(props.supportEmail).toBe('security@fxportal.local');
    expect(props.isSubmitting).toBe(false);
    expect(props.errorMessage).toBeNull();
  });

  it('invokes the verifier when the UI kit prompt submits a code', async () => {
    const { MfaPrompt } = require('@/components/auth/MfaPrompt');
    const onVerify = jest.fn().mockResolvedValue(undefined);

    renderToStaticMarkup(
      React.createElement(MfaPrompt, {
        email: 'admin@fxportal.local',
        supportEmail: 'security@fxportal.local',
        onVerify,
      }),
    );

    expect(promptProps).toHaveLength(1);
    const props = promptProps[0];
    expect(typeof props.onSubmit).toBe('function');

    await props.onSubmit?.('123456');

    expect(onVerify).toHaveBeenCalledWith('123456');
  });
});
