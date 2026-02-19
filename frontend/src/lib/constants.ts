/**
 * Shared constants for the Realtime Analytics platform.
 */

// Interval in milliseconds for frontend data polling
// Interval in milliseconds for frontend data polling
export const POLLING_INTERVAL = {
  FAST: 2000,   // Real-time feeds (Ledger)
  MEDIUM: 5000, // Dashboard / Analytics
  SLOW: 30000   // Low priority / Background
};

// Default categories for analytics
export const ANALYTICS_CATEGORIES = [
  "Shopping",
  "Food & Drink",
  "Entertainment",
  "Transfer",
  "Electronics",
  "Travel"
];
