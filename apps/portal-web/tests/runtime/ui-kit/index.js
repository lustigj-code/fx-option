const React = require('react');

exports.Badge = ({ children }) => React.createElement('span', { 'data-testid': 'badge' }, children);
exports.Button = ({ children }) =>
  React.createElement('button', { 'data-testid': 'button', type: 'button' }, children);
