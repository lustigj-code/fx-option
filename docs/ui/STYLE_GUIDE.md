# Emerald UI Kit Style Guide

The Emerald UI kit distills the lush, high-trust atmosphere of the source inspiration into reusable design tokens and React primitives. Everything orbits around a deep aurora palette, soft glassmorphism, and confident typography.

## Core Theme Tokens

| Token | Value | Usage |
| --- | --- | --- |
| `background` | `#0b0f0c` | Default body background, anchoring the interface in deep night. |
| `card` | `#0f1511` | Glass panels, cards, and navigation shells. |
| `accent` | `#2df07d` | Primary interaction affordances and highlights. |
| `accent-muted` | `#1e3f2c` | Supporting surfaces, progress rails, table stripes. |
| `text` | `#e8f3ec` | Primary typography. |
| `muted` | `#9db8a6` | Secondary copy, captions, helper text. |
| `danger` | `#ff4d4d` | Destructive states and alerts. |
| `rounded-2xl` | `1.5rem` | Signature curvature applied across components. |
| `shadow-soft` | `0 20px 45px -25px rgba(45, 240, 125, 0.35)` | Ambient lift for cards and modals. |
| `shadow-glow` | `0 0 25px 0 rgba(45, 240, 125, 0.55)` | CTA halo, KPI progress glows. |
| `bg-radial-emerald` | Radial gradient | Hero and marketing backdrops. |
| `bg-noise-overlay` | Embedded SVG noise | Adds tactile film grain to large surfaces. |

## Layout Showcase

The hero composition leans on a radial emerald burst layered with a translucent noise mask to echo the cinematic lighting from the reference shot.

### Hero Headline

```
<Hero
  headline="Grow FX operations with luminous precision."
  subheadline="Emerald unifies currency risk, liquidity, and compliance into one adaptive operating system so your teams can scale with certainty."
  badges={["Innovative Product of the Year", "Best Financial App"]}
  primaryCta={{ label: "Request demo" }}
  secondaryCta={{ label: "View pricing" }}
/>
```

### Pill Badges

```
<div className="flex gap-3">
  <Badge>Innovative Product of the Year</Badge>
  <Badge tone="muted">Best Financial App</Badge>
</div>
```

### Stat Row

```
<div className="grid gap-4 md:grid-cols-3">
  <Stat label="Users" value="248K" trend={{ direction: 'up', value: '12.4%' }} />
  <Stat label="Countries" value="38" />
  <Stat label="Daily settlements" value="$4.8M" />
</div>
```

### Partner Logos Strip

```
<TestimonialStrip
  heading="Trusted by global innovators"
  testimonials={[
    { quote: 'Logo placeholder for Zenith Bank', author: 'Zenith' },
    { quote: 'Logo placeholder for Polaris', author: 'Polaris' },
    { quote: 'Logo placeholder for Equinox', author: 'Equinox' }
  ]}
/>
```

Swap the quote fields for SVG logo components in production.

### Glassy Transaction Card

```
<Card header="Transaction" footer="Processed securely via Emerald Engine">
  <div className="space-y-3 text-sm">
    <div className="flex items-center justify-between">
      <span className="text-muted">Amount</span>
      <span className="text-text">$12,480.00</span>
    </div>
    <div className="flex items-center justify-between">
      <span className="text-muted">Rate lock</span>
      <span className="text-accent">1.0821</span>
    </div>
    <div className="flex items-center justify-between">
      <span className="text-muted">Status</span>
      <span className="text-accent">Cleared</span>
    </div>
  </div>
</Card>
```

## Storybook & Visual Testing

Run Storybook locally for interactive exploration and snapshot updates:

```
pnpm install
pnpm --filter ui-kit storybook
```

For visual regression tests powered by Storybook’s test runner:

```
pnpm --filter ui-kit test
```

Snapshots ensure the rich emerald gradients, glass cards, and typography remain consistent as the system evolves.
