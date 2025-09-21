import * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const cardProps: Array<Record<string, any>> = [];

jest.mock('ui-kit', () => ({
  AccessDeniedCard: (props: Record<string, any>) => {
    cardProps.push(props);
    return null;
  },
}));

describe('RestrictedView', () => {
  beforeEach(() => {
    cardProps.length = 0;
    jest.clearAllMocks();
  });

  it('conveys required roles, current roles, and escalation path metadata', () => {
    const { RestrictedView } = require('@/components/auth/RestrictedView');

    renderToStaticMarkup(
      React.createElement(RestrictedView, {
        currentRoles: ['treasury_manager'],
        requiredRoles: ['compliance_officer', 'admin'],
        supportEmail: 'compliance@fxportal.local',
        onRequestEscalation: jest.fn(),
        auditTrailUrl: '/admin/audit/auth',
      }),
    );

    expect(cardProps).toHaveLength(1);
    const props = cardProps[0];
    expect(props.supportEmail).toBe('compliance@fxportal.local');
    expect(props.auditTrailUrl).toBe('/admin/audit/auth');
    expect(props.actionLabel).toBe('Request escalation');
    expect(props.onRequestAccess).toBeDefined();
  });

  it('provides MFA-specific guidance when verification is pending', () => {
    const { RestrictedView } = require('@/components/auth/RestrictedView');

    renderToStaticMarkup(
      React.createElement(RestrictedView, {
        currentRoles: ['compliance_officer'],
        requiredRoles: ['compliance_officer'],
        requiresMfa: true,
        supportEmail: 'security@fxportal.local',
      }),
    );

    expect(cardProps).toHaveLength(1);
    const props = cardProps[0];
    expect(props.supportLinkLabel).toBe('Contact support');
    expect(props.supportEmail).toBe('security@fxportal.local');
    expect(props.description).toContain('multi-factor authentication');
  });
});
