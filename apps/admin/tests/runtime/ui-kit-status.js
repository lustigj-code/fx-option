const React = require('react');

const StatusCard = jest.fn(({ children, actionLabel, subtitle, onAction, tone, title, ...rest }) =>
  React.createElement(
    'section',
    { 'data-testid': 'status-card', 'data-tone': tone, 'data-title': title, ...rest },
    children
  )
);

const StatusBanner = jest.fn(({ children, tone, ...rest }) =>
  React.createElement('div', { 'data-testid': 'status-banner', 'data-tone': tone, ...rest }, children)
);

const StatusSkeleton = jest.fn(({ children, ...rest }) =>
  React.createElement('div', { 'data-testid': 'status-skeleton', ...rest }, children)
);

module.exports = { StatusCard, StatusBanner, StatusSkeleton };
