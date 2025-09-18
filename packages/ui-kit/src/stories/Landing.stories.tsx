import type { Meta, StoryObj } from '@storybook/react';

import { Badge } from '../components/Badge';
import { Card } from '../components/Card';
import { Hero } from '../components/Hero';
import { KPIBar } from '../components/KPIBar';
import { Navbar } from '../components/Navbar';
import { Stat } from '../components/Stat';
import { TestimonialStrip } from '../components/TestimonialStrip';

const meta: Meta = {
  title: 'Pages/Landing'
};

export default meta;

type Story = StoryObj;

export const Overview: Story = {
  render: () => (
    <div className="flex min-h-screen flex-col gap-10 bg-background p-8 text-text">
      <Navbar
        logo={<span>Emerald Exchange</span>}
        links={[
          { label: 'Platform', href: '#' },
          { label: 'Pricing', href: '#' },
          { label: 'Security', href: '#' },
          { label: 'Insights', href: '#' }
        ]}
        ctaLabel="Launch app"
      />
      <Hero
        headline="Grow FX operations with luminous precision."
        subheadline="Emerald unifies currency risk, liquidity, and compliance into one adaptive operating system so your teams can scale with certainty."
        badges={['Innovative Product of the Year', 'Best Financial App']}
        primaryCta={{ label: 'Request demo' }}
        secondaryCta={{ label: 'View pricing' }}
        media={
          <Card header="Live transaction" footer="Secured by quantum-grade encryption">
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted">Beneficiary</span>
                <span className="text-text">Aurora Ventures</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted">Amount</span>
                <span className="text-text">€4,800.00</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted">FX rate lock</span>
                <span className="text-accent">1.0821</span>
              </div>
            </div>
          </Card>
        }
      />
      <div className="grid gap-4 md:grid-cols-3">
        <Stat label="Users" value="248K" trend={{ direction: 'up', value: '12.4%' }} />
        <Stat label="Countries" value="38" />
        <Stat label="Daily settlements" value="$4.8M" />
      </div>
      <div className="grid gap-6 md:grid-cols-[2fr,1fr]">
        <TestimonialStrip
          heading="Trusted by global innovators"
          testimonials={[
            {
              quote: 'Emerald automates reconciliation so our treasury team can focus on strategy.',
              author: 'Lena Carter',
              role: 'CFO · Stratospace'
            },
            {
              quote: 'We ship global payouts 4x faster with Emerald’s compliance guardrails.',
              author: 'Darius Patel',
              role: 'Head of Ops · Flowly'
            },
            {
              quote: 'The predictive hedging signals are eerily accurate in volatile markets.',
              author: 'Mika Chen',
              role: 'VP of Finance · NovaTrade'
            }
          ]}
        />
        <div className="space-y-4 rounded-2xl border border-accent-muted/30 bg-card/70 p-6 shadow-soft">
          <h3 className="text-lg font-semibold">Liquidity Overview</h3>
          <Badge tone="muted" className="w-fit">
            Intraday spread control
          </Badge>
          <KPIBar label="Liquidity utilization" value={72} target={100} />
          <KPIBar label="Risk buffer" value={58} target={80} />
        </div>
      </div>
    </div>
  )
};
