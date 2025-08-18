/**
 * Feature flags for versioned derivations pipeline
 */

export const USE_LATEST_RULES_RUN = (process.env.USE_LATEST_RULES_RUN?.toLowerCase() ?? 'true') === 'true';

export const FLAGS = {
  USE_LATEST_RULES_RUN,
} as const;

// Version constants for rules runs
export const PARSER_VERSION = '1.0.0';
export const RULESET_VERSION = 'MSCC5-2024.1';