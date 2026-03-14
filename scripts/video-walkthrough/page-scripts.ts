/**
 * Video Walkthrough Page Scripts
 * Defines narration, scroll points, and interactions for each page
 */

export interface PageScript {
  route: string;
  title: string;
  duration: number; // seconds of screen time
  narration: string;
  scrollPoints?: Array<{
    delay: number; // milliseconds to wait before scrolling
    direction: "up" | "down";
    amount: number; // pixels to scroll
  }>;
  clickActions?: Array<{
    delay: number;
    selector: string;
    description: string;
  }>;
  waitFor?: string; // CSS selector to wait for before capturing
}

export const pageScripts: PageScript[] = [
  // PUBLIC PAGES (4)
  {
    route: "/",
    title: "Home - Freight Intelligence Platform",
    duration: 10,
    narration:
      "Welcome to Logisphere, the intelligent freight management platform. Logisphere brings clarity to your supply chain with real-time tracking, AI-powered forecasting, and automated compliance monitoring. Designed for logistics teams that need to optimize costs, mitigate risks, and stay ahead of disruptions.",
    scrollPoints: [
      { delay: 2000, direction: "down", amount: 400 },
      { delay: 3000, direction: "down", amount: 400 },
      { delay: 2500, direction: "down", amount: 400 },
    ],
  },
  {
    route: "/features",
    title: "Features - Core Capabilities",
    duration: 12,
    narration:
      "Logisphere includes everything your team needs. Real-time shipment tracking with live carrier updates. Predictive spend analysis using machine learning to forecast costs before invoices arrive. Automated SLA monitoring that alerts you to service failures instantly. Intelligent bill auditing that catches errors and overcharges automatically. And a unified command center where your entire logistics operation comes together in one place.",
    scrollPoints: [
      { delay: 2000, direction: "down", amount: 500 },
      { delay: 3000, direction: "down", amount: 500 },
      { delay: 3000, direction: "down", amount: 500 },
    ],
  },
  {
    route: "/pricing",
    title: "Pricing - Simple, Transparent Plans",
    duration: 8,
    narration:
      "Logisphere offers flexible pricing that grows with your business. The Starter plan is perfect for small logistics teams just beginning their digital transformation. The Professional plan adds advanced analytics, API access, and team collaboration. And Enterprise gives you everything, including custom integrations, dedicated support, and advanced compliance features.",
    scrollPoints: [{ delay: 3000, direction: "down", amount: 300 }],
  },
  {
    route: "/about",
    title: "About - Our Mission",
    duration: 8,
    narration:
      "Logisphere was built by logistics experts who understood the pain of fragmented tools and incomplete data. Our mission is simple: give logistics teams the intelligence they need to make better decisions faster. Today, we serve companies shipping millions of shipments annually across hundreds of carriers and lanes.",
    scrollPoints: [{ delay: 2500, direction: "down", amount: 400 }],
  },

  // WORKSPACE PAGES (18)

  // Dashboard & Core
  {
    route: "/dashboard",
    title: "Dashboard - Command Center",
    duration: 14,
    narration:
      "The dashboard is your command center. At a glance, you see your key metrics: total active shipments, forecast spend for the month, SLA compliance rate, and any critical alerts. The dashboard auto-updates in real-time as shipments move through your network. Click any card to dive deeper into the details.",
    scrollPoints: [
      { delay: 3000, direction: "down", amount: 400 },
      { delay: 3000, direction: "down", amount: 400 },
    ],
  },

  // Analytics & Spend
  {
    route: "/analytics",
    title: "Analytics - Spend Intelligence",
    duration: 16,
    narration:
      "The analytics dashboard shows you exactly where your freight spend is going. Historical spend trends let you spot seasonal patterns and carrier rate changes. Spend by carrier shows you top vendors so you can negotiate strategically. Spend by lane identifies your highest-cost routes. And our AI-powered forecast predicts next month's spend, letting you budget with confidence.",
    scrollPoints: [
      { delay: 3000, direction: "down", amount: 500 },
      { delay: 3500, direction: "down", amount: 500 },
      { delay: 3000, direction: "down", amount: 500 },
    ],
  },

  {
    route: "/spend-analysis",
    title: "Spend Analysis - Predictive Modeling",
    duration: 14,
    narration:
      "The spend analysis module combines historical data with AI forecasting. View your spend trends over time, compare budgets to actual costs, and get AI-powered recommendations to reduce costs. The system learns from your data and improves predictions each month. Integrate with your ERP to automate budget tracking.",
    scrollPoints: [
      { delay: 2500, direction: "down", amount: 450 },
      { delay: 3000, direction: "down", amount: 450 },
    ],
  },

  // Shipments & Tracking
  {
    route: "/shipments",
    title: "Shipments - Comprehensive View",
    duration: 12,
    narration:
      "The shipments page shows all your active and historical shipments in one place. Filter by status, carrier, lane, or date range. See key details: origin, destination, weight, rate paid, and current location. Export data for reporting or analysis. Search across millions of shipments in seconds.",
    scrollPoints: [
      { delay: 2500, direction: "down", amount: 400 },
      { delay: 2800, direction: "down", amount: 400 },
    ],
  },

  {
    route: "/tracking",
    title: "Tracking - Real-Time Visibility",
    duration: 12,
    narration:
      "Real-time tracking shows you where every shipment is right now. Track updates flow in as carriers scan shipments. See estimated delivery times, current carrier, and any exceptions. Set up custom alerts for high-value shipments so you're notified immediately if anything goes wrong.",
    scrollPoints: [
      { delay: 3000, direction: "down", amount: 400 },
      { delay: 2500, direction: "down", amount: 400 },
    ],
  },

  // Carriers & Compliance
  {
    route: "/carriers",
    title: "Carriers - Performance Scorecards",
    duration: 14,
    narration:
      "Evaluate your carrier partners on performance metrics that matter: on-time delivery rate, quote accuracy, damage rates, and cost competitiveness. Each carrier gets a scorecard. Drill into their performance by lane, time period, or shipment type. Use these insights to negotiate contracts and make carrier selection decisions.",
    scrollPoints: [
      { delay: 3000, direction: "down", amount: 450 },
      { delay: 3500, direction: "down", amount: 450 },
    ],
  },

  {
    route: "/compliance",
    title: "Compliance - SLA Monitoring",
    duration: 12,
    narration:
      "Stay on top of service level agreements automatically. The compliance dashboard shows you SLA breach rates by carrier, lane, and contract. Flag exceptions instantly. Track document completeness to stay audit-ready. Get alerts when a carrier is at risk of breach so you can intervene early.",
    scrollPoints: [
      { delay: 2500, direction: "down", amount: 400 },
      { delay: 3000, direction: "down", amount: 400 },
    ],
  },

  // Invoices & Auditing
  {
    route: "/invoices",
    title: "Invoices - Bill Audit Center",
    duration: 13,
    narration:
      "Review all carrier invoices in one place. Our system automatically audits each invoice against your contracts and shipment data. Green check marks show clean invoices. Yellow warnings flag small discrepancies. Red flags indicate significant overcharges. One click to dispute or approve.",
    scrollPoints: [
      { delay: 2500, direction: "down", amount: 400 },
      { delay: 3000, direction: "down", amount: 400 },
    ],
  },

  {
    route: "/audit-logs",
    title: "Audit Logs - Compliance Records",
    duration: 10,
    narration:
      "Every action in Logisphere is logged for compliance and accountability. View who created or modified records, when, and what changed. Filter logs by user, entity type, or action. Export logs for your auditors. Perfect for maintaining compliance with industry regulations.",
    scrollPoints: [
      { delay: 2500, direction: "down", amount: 350 },
      { delay: 2500, direction: "down", amount: 350 },
    ],
  },

  // Operations & Management
  {
    route: "/facilities",
    title: "Facilities - Network Locations",
    duration: 10,
    narration:
      "Define your distribution centers, warehouses, and operating locations. Set up service levels and lane definitions from each facility. Store contact information and operating hours. Logisphere uses facility data to optimize routing and calculate delivery windows accurately.",
    scrollPoints: [{ delay: 2500, direction: "down", amount: 400 }],
  },

  {
    route: "/lanes",
    title: "Lanes - Route Management",
    duration: 11,
    narration:
      "Define the lanes you ship most frequently. Set standard rates, carriers, and transit times for each lane. Create service level agreements that specify requirements like delivery date and proof of delivery. Use lanes to automate rate shopping and exception management.",
    scrollPoints: [
      { delay: 2500, direction: "down", amount: 400 },
      { delay: 2500, direction: "down", amount: 350 },
    ],
  },

  {
    route: "/contracts",
    title: "Contracts - Terms & Negotiations",
    duration: 12,
    narration:
      "Store all your carrier contracts in one place. Logisphere tracks effective dates, rate schedules, volume commitments, and SLA requirements. Set up alerts for contract renewal dates. Track volume against commitments to ensure you're getting maximum value from negotiations.",
    scrollPoints: [
      { delay: 2500, direction: "down", amount: 400 },
      { delay: 2800, direction: "down", amount: 400 },
    ],
  },

  // Intelligence & Settings
  {
    route: "/intelligence",
    title: "Intelligence - AI Recommendations",
    duration: 12,
    narration:
      "Logisphere's AI engine analyzes your data continuously and surfaces actionable recommendations. Consolidate shipments to save money. Switch to a better-performing carrier. Adjust lane routing to balance cost and service. Each recommendation shows the potential savings and implementation effort.",
    scrollPoints: [
      { delay: 2500, direction: "down", amount: 400 },
      { delay: 3000, direction: "down", amount: 400 },
    ],
  },

  {
    route: "/settings/alerts",
    title: "Settings - Alert Rules",
    duration: 11,
    narration:
      "Set up alert rules for events that matter to your business. Alert on cost overruns, SLA breaches, exceptional shipment delays, or payment issues. Configure who gets notified, when, and how. Logisphere evaluates alert rules in real-time as data arrives.",
    scrollPoints: [
      { delay: 2500, direction: "down", amount: 400 },
      { delay: 2500, direction: "down", amount: 350 },
    ],
  },

  {
    route: "/settings/team",
    title: "Settings - Team Management",
    duration: 10,
    narration:
      "Manage your team's access to Logisphere. Add or remove team members. Assign role-based permissions: viewers see dashboards, managers can create alerts and audit records, and admins manage settings and integrations. Control who can modify critical settings like contracts and carriers.",
    scrollPoints: [{ delay: 2500, direction: "down", amount: 400 }],
  },

  {
    route: "/settings/integrations",
    title: "Settings - Integrations",
    duration: 10,
    narration:
      "Connect Logisphere to your existing systems. Integrate with your TMS for shipment data. Connect to your ERP for invoice matching. Set up webhooks to send alerts to Slack or Teams. API access lets you build custom integrations.",
    scrollPoints: [{ delay: 2500, direction: "down", amount: 400 }],
  },

  // Closing
  {
    route: "/",
    title: "Ready to Transform Your Logistics",
    duration: 8,
    narration:
      "Logisphere is the intelligence platform for modern logistics teams. Start with real-time tracking, add predictive analytics, automate compliance monitoring, and continuously optimize costs. Get started today with a free trial or contact our team for a personalized demo.",
    scrollPoints: [],
  },
];
