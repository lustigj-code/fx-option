import { ReactNode } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { RestrictedView } from '../RestrictedView';

describe('RestrictedView', () => {
  const Protected = ({ children }: { children: ReactNode }) => <div>{children}</div>;

  it('renders children when authorized', () => {
    render(
      <RestrictedView status="authorized">
        <Protected>authorized content</Protected>
      </RestrictedView>,
    );

    expect(screen.getByText('authorized content')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /restricted/i })).toBeNull();
  });

  it('shows missing role message with request action', async () => {
    const user = userEvent.setup();
    const onRequest = jest.fn();

    render(
      <RestrictedView
        status="forbidden"
        reason="missing-role"
        onRequestAccess={onRequest}
        supportEmail="compliance@fxportal.local"
      >
        <Protected>should not render</Protected>
      </RestrictedView>,
    );

    expect(screen.getByRole('heading', { name: /restricted access/i })).toBeInTheDocument();
    expect(screen.getByText(/missing the required admin role/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /request access/i }));
    expect(onRequest).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('link', { name: /contact compliance/i })).toHaveAttribute(
      'href',
      'mailto:compliance@fxportal.local',
    );
  });

  it('directs user to MFA enrollment when required', async () => {
    const user = userEvent.setup();
    const onStartMfa = jest.fn();

    render(
      <RestrictedView status="forbidden" reason="mfa-required" onStartMfa={onStartMfa}>
        <Protected>should not render</Protected>
      </RestrictedView>,
    );

    expect(screen.getByText(/multi-factor authentication required/i)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /set up mfa/i }));
    expect(onStartMfa).toHaveBeenCalledTimes(1);
  });
});
