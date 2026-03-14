import { test, expect } from "@playwright/test";
import * as fs from "fs";
import * as path from "path";

/**
 * Walkthrough script with timestamps for narration
 * Each action has a corresponding narration that will be spoken at that time
 */

interface TimelineEntry {
  timestamp: number; // in seconds
  action: string;
  narration: string;
  duration?: number; // how long to spend on this action
}

const timeline: TimelineEntry[] = [
  {
    timestamp: 0,
    action: "load_dashboard",
    narration:
      "Welcome to Logisphere, the intelligent freight management platform. Let me show you a tour of the dashboard.",
    duration: 4,
  },
  {
    timestamp: 4,
    action: "highlight_kpis",
    narration:
      "Here we can see key performance indicators for your freight operations. This shows total spend, pending liability, audit coverage, and recovered variance.",
    duration: 5,
  },
  {
    timestamp: 9,
    action: "scroll_to_charts",
    narration:
      "Below that, we have detailed analytics showing your spend trends over the last six months with our interactive chart visualization.",
    duration: 4,
  },
  {
    timestamp: 13,
    action: "click_alerts",
    narration:
      "The alert center displays real-time notifications about invoice exceptions, billing issues, and compliance alerts that need your attention.",
    duration: 4,
  },
  {
    timestamp: 17,
    action: "navigate_analytics",
    narration:
      "Let me navigate to the analytics section to show you more detailed insights into your freight operations.",
    duration: 3,
  },
  {
    timestamp: 20,
    action: "view_scorecards",
    narration:
      "In the scorecards section, you can see carrier performance metrics including on-time delivery rates, billing accuracy, and damage rates.",
    duration: 4,
  },
  {
    timestamp: 24,
    action: "check_compliance",
    narration:
      "The compliance page provides SLA breach tracking, document completeness monitoring, and regulatory checkpoint status.",
    duration: 4,
  },
  {
    timestamp: 28,
    action: "navigate_tracking",
    narration:
      "Real-time tracking shows all active shipments with live updates from our Supabase integration.",
    duration: 3,
  },
  {
    timestamp: 31,
    action: "settings_alerts",
    narration:
      "In settings, you can configure custom alert rules for cost overruns, service failures, payment delays, and carrier SLA breaches.",
    duration: 4,
  },
  {
    timestamp: 35,
    action: "demo_complete",
    narration:
      "That concludes our walkthrough of Logisphere. Thank you for watching, and we hope you enjoy using our platform!",
    duration: 4,
  },
];

test("walkthrough-dashboard", async ({ page }) => {
  const startTime = Date.now();
  let currentAction = 0;

  // Helper function to wait until a specific timestamp
  async function waitUntilTimestamp(seconds: number) {
    const elapsed = (Date.now() - startTime) / 1000;
    const waitTime = Math.max(0, seconds - elapsed);
    if (waitTime > 0) {
      await page.waitForTimeout(waitTime * 1000);
    }
  }

  // Helper function to log timeline events
  function logTimeline(action: string, narration: string) {
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`[${elapsed}s] ${action}: ${narration}`);
  }

  try {
    // Navigate to dashboard
    logTimeline("NAVIGATE", timeline[0].narration);
    await page.goto("/", { waitUntil: "networkidle" });
    await page.waitForSelector("body", { timeout: 10000 });
    currentAction = 1;

    // Wait and let the page stabilize
    await page.waitForTimeout(2000);

    // Scroll to see KPIs and cards
    logTimeline("SCROLL", timeline[1].narration);
    await page.evaluate(() => window.scrollBy(0, 300));
    await page.waitForTimeout(1000);
    currentAction = 2;

    // Scroll further to see charts
    logTimeline("VIEW_CHARTS", timeline[2].narration);
    await page.evaluate(() => window.scrollBy(0, 400));
    await page.waitForTimeout(1500);
    currentAction = 3;

    // Try to click on an alert if available
    logTimeline("ALERTS", timeline[3].narration);
    const alertCenter = await page.locator("text=Alert Center, Recent Timeline").first();
    if (await alertCenter.isVisible()) {
      await alertCenter.scrollIntoViewIfNeeded();
      await page.waitForTimeout(1000);
    }
    currentAction = 4;

    // Navigate to analytics
    logTimeline("NAVIGATE_ANALYTICS", timeline[4].narration);
    await page.goto("/analytics", { waitUntil: "networkidle" });
    await page.waitForTimeout(2000);
    currentAction = 5;

    // Scroll down to see the spend trend chart
    await page.evaluate(() => window.scrollBy(0, 300));
    await page.waitForTimeout(1000);

    // Navigate to scorecards
    logTimeline("SCORECARDS", timeline[5].narration);
    await page.goto("/scorecards", { waitUntil: "networkidle" });
    await page.waitForTimeout(2000);
    currentAction = 6;

    // Scroll to see carrier scorecards
    await page.evaluate(() => window.scrollBy(0, 300));
    await page.waitForTimeout(1000);

    // Navigate to compliance
    logTimeline("COMPLIANCE", timeline[6].narration);
    await page.goto("/compliance", { waitUntil: "networkidle" });
    await page.waitForTimeout(2000);
    currentAction = 7;

    // Scroll to see SLA table
    await page.evaluate(() => window.scrollBy(0, 400));
    await page.waitForTimeout(1000);

    // Navigate to tracking
    logTimeline("TRACKING", timeline[7].narration);
    await page.goto("/tracking", { waitUntil: "networkidle" });
    await page.waitForTimeout(2000);
    currentAction = 8;

    // Scroll to see the shipment board
    await page.evaluate(() => window.scrollBy(0, 300));
    await page.waitForTimeout(1000);

    // Navigate to alert settings
    logTimeline("SETTINGS_ALERTS", timeline[8].narration);
    await page.goto("/settings/alerts", { waitUntil: "networkidle" });
    await page.waitForTimeout(2000);
    currentAction = 9;

    // Scroll to see alert rules
    await page.evaluate(() => window.scrollBy(0, 400));
    await page.waitForTimeout(1000);

    // Final wait and conclusion
    logTimeline("COMPLETE", timeline[9].narration);
    await page.waitForTimeout(2000);

    // Save the timeline to a JSON file for narration generation
    const timelineFile = path.join(
      __dirname,
      "../recordings/timeline.json"
    );
    fs.mkdirSync(path.dirname(timelineFile), { recursive: true });
    fs.writeFileSync(timelineFile, JSON.stringify(timeline, null, 2));

    console.log("\n✅ Walkthrough completed successfully!");
    console.log(`Timeline saved to: ${timelineFile}`);
  } catch (error) {
    console.error(`❌ Error during walkthrough at action ${currentAction}:`, error);
    throw error;
  }
});

/**
 * Alternative: Simple dashboard tour without complex interactions
 * Useful for basic demos
 */
test("simple-dashboard-tour", async ({ page }) => {
  const startTime = Date.now();

  const narrations = [
    "Welcome to Logisphere. Navigating to the dashboard.",
    "Displaying key performance indicators and metrics.",
    "Showing analytics with spend trends and visualizations.",
    "Viewing carrier scorecards and performance data.",
    "Displaying compliance and SLA monitoring.",
    "Showing real-time shipment tracking.",
    "Alert rules configuration page.",
    "Tour complete. Thank you for watching Logisphere!",
  ];

  const pages = ["/", "/analytics", "/scorecards", "/compliance", "/tracking", "/settings/alerts"];

  try {
    for (let i = 0; i < pages.length; i++) {
      console.log(`[${((Date.now() - startTime) / 1000).toFixed(2)}s] ${narrations[i]}`);
      await page.goto(pages[i], { waitUntil: "networkidle" });
      await page.evaluate(() => window.scrollBy(0, 300));
      await page.waitForTimeout(3000);
    }

    console.log(`[${((Date.now() - startTime) / 1000).toFixed(2)}s] ${narrations[narrations.length - 1]}`);
    await page.waitForTimeout(2000);

    console.log("\n✅ Simple dashboard tour completed successfully!");
  } catch (error) {
    console.error("❌ Error during simple tour:", error);
    throw error;
  }
});
