import { AccessDenied } from '@/components/auth/AccessDenied';

describe('AccessDenied', () => {
  it('passes support, audit, and resource metadata to the UI card', () => {
    const element = AccessDenied({
      resourceLabel: 'Admin Console',
      supportEmail: 'compliance@fxportal.local',
      auditTrailUrl: '/admin/audit/auth',
    });

    expect(element.props.resourceLabel).toBe('Admin Console');
    expect(element.props.supportEmail).toBe('compliance@fxportal.local');
    expect(element.props.auditTrailUrl).toBe('/admin/audit/auth');
    expect(element.props.description).toContain('You do not have permission');
  });

  it('provides a default support email when none is supplied', () => {
    const element = AccessDenied({});

    expect(element.props.supportEmail).toBe('compliance@fxportal.local');
  });

  it('surfaces access request callbacks to the rendered card', () => {
    const onRequestAccess = jest.fn();
    const element = AccessDenied({ onRequestAccess });

    expect(element.props.onRequestAccess).toBe(onRequestAccess);
  });
});
