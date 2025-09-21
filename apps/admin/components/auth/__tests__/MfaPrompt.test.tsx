import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { MfaPrompt } from '../MfaPrompt';

describe('MfaPrompt', () => {
  it('submits one-time code for verification', async () => {
    const user = userEvent.setup();
    const verify = jest.fn().mockResolvedValue(undefined);

    render(<MfaPrompt onSubmit={verify} />);

    await user.type(screen.getByLabelText(/verification code/i), '123456');
    await user.click(screen.getByRole('button', { name: /verify code/i }));

    expect(verify).toHaveBeenCalledWith('123456');
  });

  it('surfaces API errors and support link', () => {
    render(
      <MfaPrompt
        onSubmit={jest.fn()}
        error="Invalid or expired code"
        supportEmail="compliance@fxportal.local"
      />,
    );

    expect(screen.getByRole('alert')).toHaveTextContent('Invalid or expired code');
    expect(screen.getByRole('link', { name: /contact compliance/i })).toHaveAttribute(
      'href',
      'mailto:compliance@fxportal.local',
    );
  });

  it('disables interactions while pending verification', async () => {
    const user = userEvent.setup();

    render(<MfaPrompt onSubmit={jest.fn()} pending />);

    expect(screen.getByRole('button', { name: /verify code/i })).toBeDisabled();
    expect(screen.getByLabelText(/verification code/i)).toBeDisabled();

    // Secondary actions should still be available for accessibility
    await user.click(screen.getByRole('button', { name: /use recovery code/i }));
  });
});
