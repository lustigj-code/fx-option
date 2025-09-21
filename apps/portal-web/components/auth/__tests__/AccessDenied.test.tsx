import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { AccessDenied } from '../AccessDenied';

describe('AccessDenied', () => {
  it('renders default messaging', () => {
    render(<AccessDenied />);

    expect(screen.getByRole('heading', { name: /access denied/i })).toBeInTheDocument();
    expect(screen.getByText(/You do not have permission/i)).toBeInTheDocument();
  });

  it('invokes callback when action clicked', async () => {
    const user = userEvent.setup();
    const requestAccess = jest.fn();

    render(
      <AccessDenied
        actionLabel="Request elevated access"
        onRequestAccess={requestAccess}
        supportEmail="compliance@fxportal.local"
      />,
    );

    await user.click(screen.getByRole('button', { name: /request elevated access/i }));
    expect(requestAccess).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('link', { name: /contact compliance/i })).toHaveAttribute(
      'href',
      'mailto:compliance@fxportal.local',
    );
  });
});
