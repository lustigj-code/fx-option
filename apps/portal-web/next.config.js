/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config) => {
    config.resolve.alias['ui-kit'] = require('path').resolve(__dirname, '../../packages/ui-kit/dist');
    return config;
  }
};

module.exports = nextConfig;
