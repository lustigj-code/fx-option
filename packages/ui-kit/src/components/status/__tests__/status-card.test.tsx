import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';

import { StatusBanner, StatusCard, StatusSkeleton } from '../../../status';

describe('status primitives', () => {
  it('renders status card with loading skeleton', () => {
    const html = renderToStaticMarkup(
      <StatusCard title="Syncing" tone="info">
        <StatusSkeleton tone="info" />
      </StatusCard>
    );

    expect(html).toContain('Loading latest market data');
    expect(html).toContain('Syncing');
  });

  it('renders status banner content', () => {
    const html = renderToStaticMarkup(
      <StatusBanner tone="critical">Gateway unavailable — retrying</StatusBanner>
    );

    expect(html).toContain('Gateway unavailable — retrying');
  });
});
