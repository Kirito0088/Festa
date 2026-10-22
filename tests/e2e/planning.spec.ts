import { expect, test, type Page } from "@playwright/test";

/**
 * The main planning workflows, as a visitor meets them: open the demo, move
 * between sections, add to the budget, tick off a task, plan the day, set
 * reminders, book a vendor and ask the concierge. Each run uses a fresh,
 * private demo session.
 */

const sections = (page: Page) => page.getByRole("navigation", { name: "Celebration sections" });

async function openSection(page: Page, name: string) {
  await sections(page).getByRole("link", { name, exact: true }).click();
  await expect(sections(page).getByRole("link", { name, exact: true })).toHaveAttribute(
    "aria-current",
    "page",
  );
}

test.describe.configure({ mode: "serial" });

test("a visitor plans a celebration from the demo", async ({ page }) => {
  // Open the demo.
  await page.goto("/");
  await page.getByRole("button", { name: "Explore the demo" }).first().click();
  await expect(page).toHaveURL(/\/events\/[^/]+$/, { timeout: 60_000 });
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Meera & Kabir's Engagement");
  await expect(page.getByText("days to go").filter({ visible: true }).first()).toBeVisible();

  // Every section opens from the nav.
  for (const name of ["Blueprint", "Budget", "Timeline", "Vendors", "Inspiration", "Concierge", "Overview"]) {
    await openSection(page, name);
  }

  // Budget: a new line shows up in the ledger, and bad amounts are refused.
  await openSection(page, "Budget");
  await page.getByRole("button", { name: "Add line" }).click();
  const budgetDialog = page.getByRole("dialog");
  await budgetDialog.getByLabel("Name").fill("Mehendi favours");
  await budgetDialog.getByRole("button", { name: "Add line" }).click();
  await expect(budgetDialog.getByText("Enter an amount.")).toBeVisible();
  await budgetDialog.getByLabel("Estimated").fill("5000");
  await budgetDialog.getByRole("button", { name: "Add line" }).click();
  await expect(budgetDialog).toBeHidden();
  await expect(page.getByRole("table", { name: "Budget ledger" }).getByText("Mehendi favours")).toBeVisible();

  // Timeline: completing a task moves it to Done.
  await openSection(page, "Timeline");
  const firstOpen = page.locator("[role=checkbox][aria-checked=false]").first();
  const label = (await firstOpen.getAttribute("aria-label")) ?? "";
  const title = label.replace(/^Complete /, "");
  await firstOpen.click();
  await page.getByRole("radiogroup", { name: "Status" }).getByText("Done", { exact: true }).click();
  await expect(page.getByRole("checkbox", { name: `Reopen ${title}` })).toBeVisible();

  // Reminders: one calendar file with every open task.
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Calendar reminders" }).click();
  expect((await download).suggestedFilename()).toMatch(/reminders\.ics$/);

  // On the day: the drafted run sheet, plus a moment of our own.
  await expect(page.getByRole("heading", { name: "On the day" })).toBeVisible();
  await expect(page.getByText("Guests arrive")).toBeVisible();
  await page.getByRole("button", { name: /^Add$/ }).click();
  const scheduleDialog = page.getByRole("dialog");
  await scheduleDialog.getByLabel("Time").fill("23:30");
  await scheduleDialog.getByLabel("What happens").fill("Fireworks");
  await scheduleDialog.getByRole("button", { name: "Add to the day" }).click();
  await expect(scheduleDialog).toBeHidden();
  await expect(page.locator("time[datetime='23:30']")).toBeVisible();

  // Vendors: booking one stamps it.
  await openSection(page, "Vendors");
  const booked = await page.getByText("Booked", { exact: true }).count();
  await page
    .getByRole("button", { name: /^Actions for / })
    .nth(2)
    .click();
  await page.getByRole("menuitem", { name: "Mark as booked" }).click();
  await expect(page.getByText("Booked", { exact: true })).toHaveCount(booked + 1);

  // Concierge: a suggestion gets an answer, from the AI or the offline assistant.
  await openSection(page, "Concierge");
  await page.getByRole("button", { name: "What should I book first, and by when?" }).click();
  await expect(page.getByText(/AI suggestion via Groq|Festa offline assistant/).first()).toBeVisible({
    timeout: 60_000,
  });
});

test("a missing celebration shows a clear way back", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Explore the demo" }).first().click();
  await expect(page).toHaveURL(/\/events\/[^/]+$/, { timeout: 60_000 });
  await page.goto("/events/not-a-real-id");
  await expect(page.getByText("We couldn't find that celebration")).toBeVisible();
  await expect(page.getByRole("link", { name: "Back to your celebrations" })).toBeVisible();
});

test("ending a demo started from sign-in comes back to a ready demo button", async ({ page }) => {
  await page.goto("/sign-in");
  await page.getByRole("button", { name: "Explore the demo" }).click();
  await expect(page).toHaveURL(/\/events\/[^/]+$/, { timeout: 60_000 });
  await page.getByRole("button", { name: "Account menu" }).click();
  await page.getByRole("menuitem", { name: "End demo" }).click();
  await expect(page).toHaveURL(/\/$/);
  // Next keeps the sign-in page's state while it's hidden; it must not come
  // back still "Preparing the demo…".
  await page.getByRole("link", { name: "Sign in", exact: true }).first().click();
  await expect(page).toHaveURL(/\/sign-in$/);
  await expect(page.getByRole("button", { name: "Explore the demo" })).toBeEnabled();
});
