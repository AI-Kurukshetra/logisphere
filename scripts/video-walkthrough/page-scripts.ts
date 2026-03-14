/**
 * Video Walkthrough Scripts for Logisphere
 * Professional narration for each page/feature
 * Tone: Energetic, professional logistics platform walkthrough
 */

export interface PageScript {
  route: string;
  title: string;
  duration: number; // seconds
  narration: string;
  scrollPoints?: Array<{
    delay: number; // ms to wait before scrolling
    direction: "down" | "up";
    amount: number; // pixels to scroll
  }>;
  clickActions?: Array<{
    delay: number;
    selector: string;
    description: string;
  }>;
  waitFor?: string; // CSS selector to wait for before continuing
}

export const pageScripts: PageScript[] = [
  // ========== PUBLIC PAGES ==========
  {
    route: "/",
    title: "Home - Welcome to Logisphere",
    duration: 12,
    narration: `Welcome to Logisphere, your all-in-one logistics management platform.
    From real-time tracking to intelligent forecasting, Logisphere transforms how you manage freight, carriers, and costs.
    Built for modern supply chains, our platform brings visibility, control, and optimization to every shipment.
    Let's explore what makes Logisphere powerful.`,
    scrollPoints: [
      { delay: 2000, direction: "down", amount: 400 },
      { delay: 3000, direction: "down", amount: 400 },
      { delay: 3000, direction: "down", amount: 400 },
    ],
  },

  {
    route: "/features",
    title: "Features - Powerful Capabilities",
    duration: 15,
    narration: `Logisphere offers comprehensive features designed for logistics teams.
    Track shipments in real-time with live GPS updates. Manage carriers and rates across your network.
    Automate alerts for cost overruns and service failures.
    Generate intelligent forecasts powered by AI.
    Monitor compliance and SLA performance.
    All in one unified dashboard with role-based access for your entire team.`,
    scrollPoints: [
      { delay: 2000, direction: "down", amount: 500 },
      { delay: 3500, direction: "down", amount: 500 },
      { delay: 3000, direction: "down", amount: 500 },
    ],
  },

  {
    route: "/pricing",
    title: "Pricing - Flexible Plans",
    duration: 10,
    narration: `Logisphere offers flexible pricing designed to scale with your business.
    Whether you're a startup managing dozens of shipments or an enterprise handling thousands daily,
    we have a plan that fits your needs and budget.
    All plans include core features like tracking, carrier management, and real-time alerts.
    Premium tiers unlock advanced analytics, predictive forecasting, and dedicated support.`,
    scrollPoints: [
      { delay: 2000, direction: "down", amount: 350 },
      { delay: 3000, direction: "down", amount: 350 },
    ],
  },

  {
    route: "/about",
    title: "About - Our Mission",
    duration: 10,
    narration: `Logisphere is building the future of logistics management.
    Our mission is to simplify complex supply chains through intelligent automation and real-time visibility.
    Founded by experienced logistics technologists, we understand the challenges modern supply chains face.
    We're committed to delivering tools that make your operations more efficient, cost-effective, and resilient.`,
  },

  // ========== WORKSPACE PAGES ==========
  {
    route: "/dashboard",
    title: "Dashboard - Command Center",
    duration: 12,
    narration: `Welcome to your Logisphere dashboard. This is your command center for logistics operations.
    At a glance, you can see active shipments, key performance metrics, and pending alerts.
    The dashboard provides real-time visibility into your carrier performance, freight spend trends, and operational health.
    Customize your widgets to focus on the metrics that matter most to your business.`,
    scrollPoints: [
      { delay: 2000, direction: "down", amount: 400 },
      { delay: 3000, direction: "down", amount: 400 },
    ],
  },

  {
    route: "/analytics",
    title: "Analytics - Data Intelligence",
    duration: 14,
    narration: `Dive deep into your logistics data with Logisphere Analytics.
    Analyze freight spending patterns across time, carriers, and lanes.
    Track invoice metrics, payment performance, and audit coverage.
    View shipment exception rates and carrier performance trends.
    Export custom reports to share insights with stakeholders.
    Our analytics engine helps you identify inefficiencies and opportunities for cost reduction.`,
    scrollPoints: [
      { delay: 2000, direction: "down", amount: 450 },
      { delay: 3000, direction: "down", amount: 450 },
      { delay: 3000, direction: "down", amount: 450 },
    ],
  },

  {
    route: "/spend-analysis",
    title: "Spend Analysis - Predictive Forecasting",
    duration: 15,
    narration: `The Spend Analysis module gives you unprecedented visibility into your logistics costs.
    View historical spending trends with interactive charts.
    Get AI-powered 12-month forecasts powered by our Codex engine.
    Compare budget versus actual spending with detailed variance analysis.
    Receive optimization recommendations to reduce costs and improve efficiency.
    Make data-driven decisions about carrier partnerships and route optimization.`,
    scrollPoints: [
      { delay: 2000, direction: "down", amount: 400 },
      { delay: 3500, direction: "down", amount: 400 },
      { delay: 3000, direction: "down", amount: 400 },
      { delay: 3000, direction: "down", amount: 400 },
    ],
  },

  {
    route: "/tracking",
    title: "Tracking - Real-Time Visibility",
    duration: 13,
    narration: `Track every shipment in real-time. The Tracking module displays live GPS updates, delivery status, and milestone events.
    Monitor shipment progress from origin to destination.
    Set up automated alerts for delays or exceptions.
    Access complete shipment history and proof of delivery documents.
    Share tracking links with customers for end-to-end visibility.`,
    scrollPoints: [
      { delay: 2000, direction: "down", amount: 450 },
      { delay: 3500, direction: "down", amount: 450 },
    ],
  },

  {
    route: "/carriers",
    title: "Carriers - Network Management",
    duration: 12,
    narration: `Manage your entire carrier network from one place.
    View detailed carrier profiles including contact information and performance metrics.
    Track on-time delivery rates, service quality scores, and historical performance.
    Manage carrier contracts and rate agreements.
    Monitor SLA compliance and receive alerts for underperforming carriers.
    Make data-driven decisions about carrier allocation and partnerships.`,
    scrollPoints: [
      { delay: 2000, direction: "down", amount: 400 },
      { delay: 3500, direction: "down", amount: 400 },
    ],
  },

  {
    route: "/rates",
    title: "Rates - Pricing Management",
    duration: 11,
    narration: `Control your freight costs with the Rates module.
    Manage carrier rate cards across lanes, weight ranges, and service levels.
    Compare rates across carriers to identify best pricing.
    Set up rate agreements and manage discounts.
    Use rate shopping to optimize shipment costs in real-time.
    Track rate changes over time to monitor market trends.`,
    scrollPoints: [
      { delay: 2000, direction: "down", amount: 400 },
      { delay: 3500, direction: "down", amount: 400 },
    ],
  },

  {
    route: "/invoices",
    title: "Invoices - Billing Management",
    duration: 12,
    narration: `Streamline invoice processing with intelligent workflows.
    Capture carrier invoices and validate them against shipments and rates.
    Review invoice details, flag discrepancies, and approve payments.
    Track invoice status through approval workflows.
    Export invoices and generate billing reports.
    Reduce invoice processing time and catch billing errors before payment.`,
    scrollPoints: [
      { delay: 2000, direction: "down", amount: 400 },
      { delay: 3500, direction: "down", amount: 400 },
    ],
  },

  {
    route: "/payments",
    title: "Payments - Financial Control",
    duration: 11,
    narration: `Take control of your payment operations.
    View all pending and completed payments in one dashboard.
    Process bulk payments to carriers efficiently.
    Track payment status and reconciliation.
    Generate payment reports for accounting and auditing.
    Ensure timely payments while maintaining financial controls.`,
    scrollPoints: [
      { delay: 2000, direction: "down", amount: 400 },
      { delay: 3500, direction: "down", amount: 400 },
    ],
  },

  {
    route: "/exceptions",
    title: "Exceptions - Issue Management",
    duration: 13,
    narration: `Proactively manage operational issues with the Exceptions module.
    Track all shipment exceptions including delays, damaged goods, and missing documentation.
    Assign exceptions to team members for resolution.
    Monitor exception resolution time and track trends.
    Receive automated alerts for critical issues.
    Reduce shipment complications and improve customer satisfaction.`,
    scrollPoints: [
      { delay: 2000, direction: "down", amount: 400 },
      { delay: 3500, direction: "down", amount: 400 },
    ],
  },

  {
    route: "/compliance",
    title: "Compliance - Regulatory Monitoring",
    duration: 12,
    narration: `Stay compliant with regulations and contractual SLAs.
    Monitor SLA breach rates by carrier.
    Track document completeness for all deliveries.
    Review compliance metrics and trends.
    Generate audit reports for stakeholders.
    Ensure your operations meet all regulatory requirements and contract obligations.`,
    scrollPoints: [
      { delay: 2000, direction: "down", amount: 400 },
      { delay: 3500, direction: "down", amount: 400 },
    ],
  },

  {
    route: "/scorecards",
    title: "Scorecards - Performance Metrics",
    duration: 11,
    narration: `Monitor carrier and operational performance with interactive scorecards.
    View on-time delivery rates, cost per shipment, and quality metrics.
    Track performance trends over time with sparkline charts.
    Compare carriers side-by-side.
    Set performance targets and identify improvement opportunities.
    Use data-driven insights to optimize your carrier network.`,
    scrollPoints: [
      { delay: 2000, direction: "down", amount: 350 },
      { delay: 3500, direction: "down", amount: 350 },
    ],
  },

  {
    route: "/intelligence",
    title: "Intelligence - Advanced Planning",
    duration: 14,
    narration: `Leverage AI-powered intelligence for strategic planning.
    Create and manage budget plans for your fiscal year.
    Generate spend forecasts using historical data.
    Receive optimization recommendations to reduce costs.
    Compare budget versus actual spending with detailed variance analysis.
    Use predictive insights to make better sourcing and carrier decisions.`,
    scrollPoints: [
      { delay: 2000, direction: "down", amount: 450 },
      { delay: 3500, direction: "down", amount: 450 },
      { delay: 3000, direction: "down", amount: 450 },
    ],
  },

  {
    route: "/documents",
    title: "Documents - Digital Records",
    duration: 10,
    narration: `Manage all operational documents in a centralized repository.
    Store proof of delivery, bills of lading, and supporting documentation.
    Link documents to shipments for easy access.
    Search and filter documents by shipment, date, or document type.
    Ensure regulatory compliance with complete audit trails.`,
    scrollPoints: [
      { delay: 2000, direction: "down", amount: 350 },
      { delay: 3500, direction: "down", amount: 350 },
    ],
  },

  {
    route: "/settings/alerts",
    title: "Alert Rules - Automated Notifications",
    duration: 12,
    narration: `Set up intelligent alerts to stay informed about critical events.
    Create rules for cost overruns, service failures, and payment delays.
    Configure alert thresholds based on your business needs.
    Route alerts to the right team members via email.
    Test rules before deployment to ensure accuracy.
    Automate your exception management workflow.`,
    scrollPoints: [
      { delay: 2000, direction: "down", amount: 400 },
      { delay: 3500, direction: "down", amount: 400 },
    ],
  },

  {
    route: "/settings/organization",
    title: "Settings - Organization Management",
    duration: 10,
    narration: `Configure your organization settings.
    Manage facilities, regions, and business units.
    Set up your company profile and branding.
    Configure regional settings and preferences.
    Organize your operational structure for efficient management.`,
    scrollPoints: [
      { delay: 2000, direction: "down", amount: 350 },
      { delay: 3500, direction: "down", amount: 350 },
    ],
  },

  {
    route: "/settings/access",
    title: "Access Control - User Management",
    duration: 11,
    narration: `Control who has access to your Logisphere instance.
    Manage user accounts and assign roles.
    Configure role-based permissions for different team members.
    Administrator, supply chain manager, billing manager, or viewer.
    Ensure the right people have access to the right information.`,
    scrollPoints: [
      { delay: 2000, direction: "down", amount: 350 },
      { delay: 3500, direction: "down", amount: 350 },
    ],
  },

  // ========== OUTRO ==========
  {
    route: "/",
    title: "Outro - Start Your Journey",
    duration: 10,
    narration: `That's a comprehensive tour of Logisphere.
    From real-time tracking to predictive forecasting, we've covered the tools that empower modern logistics teams.
    Ready to transform your operations?
    Sign up today and get started with a free trial.
    Our team is here to support you every step of the way.
    Welcome to the future of logistics management.`,
  },
];

// Export scripts by category
export const publicPageScripts = pageScripts.filter(s =>
  ["/", "/features", "/pricing", "/about"].includes(s.route)
);

export const workspaceScripts = pageScripts.filter(s =>
  s.route.startsWith("/") && !["/", "/features", "/pricing", "/about"].includes(s.route)
);
