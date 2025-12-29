/**
 * Application Configuration
 * Centralized configuration management with environment variable support
 */

const config = {
  // Version
  version: '2.0.0',

  // Server
  port: parseInt(process.env.PORT, 10) || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',

  // Data Source
  spreadsheet: {
    id: process.env.SPREADSHEET_ID || '1axlwmzPA49rYkqXh7zHvAtSP-TKbM0ijGYBPRflLSWw',
    refreshInterval: parseInt(process.env.REFRESH_INTERVAL, 10) || 60 * 60 * 1000, // 1 hour
  },

  // Regulations to fetch
  regulations: [
    { name: 'J', sheet: 'SV Regulation J' },
    { name: 'I', sheet: 'SV Regulation I' },
    { name: 'H', sheet: 'SV Regulation H' },
    { name: 'G', sheet: 'SV Regulation G' },
    { name: 'F', sheet: 'SV Regulation F' },
    { name: 'E', sheet: 'SV Regulation E' },
    { name: 'D', sheet: 'SV Regulation D' },
    { name: 'C', sheet: 'SV Regulation C' },
  ],

  // Rate Limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW, 10) || 15 * 60 * 1000, // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX, 10) || 100, // requests per window
  },

  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
  },

  // Server URLs for OpenAPI spec
  serverUrl: process.env.SERVER_URL || 'https://vgc-team-gpt.onrender.com',
};

module.exports = config;
