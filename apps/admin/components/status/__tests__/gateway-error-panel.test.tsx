import { renderToStaticMarkup } from 'react-dom/server';

import { GatewayErrorPanel } from '../GatewayErrorPanel';
import { StatusCard, StatusBanner } from 'ui-kit/status';

describe('GatewayErrorPanel', () => {
  test('renders gateway outage context and contact details', () => {
    const html = renderToStaticMarkup(
      <GatewayErrorPanel
        message="Gateway timeout"
        lastChecked={new Date('2024-05-01T12:30:00Z')}
        supportContact="treasury@corp.test"
      >
        <p>shadow content</p>
      </GatewayErrorPanel>
    );

    expect(StatusCard).toHaveBeenCalledWith(
      expect.objectContaining({
        tone: 'critical',
        title: 'Gateway offline'
      }),
      {}
    );
    expect(StatusBanner).toHaveBeenCalledWith(
      expect.objectContaining({ tone: 'critical' }),
      {}
    );
    expect(html).toContain('Gateway timeout');
    expect(html).toContain('treasury@corp.test');
    expect(html).toContain('gateway-support-line');
  });

  test('wires retry action when handler supplied', () => {
    const onRetry = jest.fn();
    renderToStaticMarkup(
      <GatewayErrorPanel message="API 502" supportContact="ops@corp.test" onRetry={onRetry} />
    );

    expect(StatusCard).toHaveBeenCalledWith(
      expect.objectContaining({ actionLabel: 'Retry connection', onAction: onRetry }),
      {}
    );
  });
});
