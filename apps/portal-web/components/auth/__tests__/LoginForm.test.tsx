import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { LoginForm } from '../LoginForm';

describe('LoginForm', () => {
  it('submits email, password, and remember flag', async () => {
    const user = userEvent.setup();
    const handleSubmit = jest.fn().mockResolvedValue(undefined);

    render(<LoginForm onSubmit={handleSubmit} />);

    await user.type(screen.getByLabelText(/email/i), 'demo@fxportal.local');
    await user.type(screen.getByLabelText(/password/i), 'super-secret');
    await user.click(screen.getByLabelText(/remember device/i));
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    expect(handleSubmit).toHaveBeenCalledWith({
      email: 'demo@fxportal.local',
      password: 'super-secret',
      rememberDevice: true,
    });
  });

  it('surfaces authentication errors inline', () => {
    render(<LoginForm onSubmit={jest.fn()} error="Invalid credentials" />);

    expect(screen.getByRole('alert')).toHaveTextContent('Invalid credentials');
  });

  it('disables submission while pending', () => {
    const { rerender } = render(<LoginForm onSubmit={jest.fn()} pending={false} />);

    const submitButton = screen.getByRole('button', { name: /sign in/i });
    expect(submitButton).toBeEnabled();

    rerender(<LoginForm onSubmit={jest.fn()} pending />);
    expect(screen.getByRole('button', { name: /sign in/i })).toBeDisabled();
  });
});
