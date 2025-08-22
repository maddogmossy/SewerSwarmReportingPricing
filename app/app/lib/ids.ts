// Central registry for stable IDs across the app.
// Use these in UI (data-uiid), actions, and tests to keep everything consistent.

export const IDS = {
  pages: {
    home: "page_home",
    reports: "page_reports",
    dashboard: "page_dashboard",
    pricing: "page_pricing",
  },
  cards: {
    health: "card_health",
    reportsList: "card_reports_list",
    dashboardSummary: "card_dashboard_summary",
  },
  actions: {
    navDashboard: "action_nav_dashboard",
    refreshHealth: "action_refresh_health",
    viewReports: "action_view_reports",
  },
} as const;

// Example types (optional, helps with autocomplete & safety)
export type PageId = typeof IDS.pages[keyof typeof IDS.pages];
export type CardId = typeof IDS.cards[keyof typeof IDS.cards];
export type ActionId = typeof IDS.actions[keyof typeof IDS.actions];