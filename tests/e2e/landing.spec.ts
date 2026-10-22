import { expect, test } from "@playwright/test";

test("the landing page leads with the calls to action and tells the story", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Plan the celebration, not the spreadsheet.",
  );
  await expect(page.getByRole("link", { name: "Start planning" }).first()).toBeVisible();
  await expect(page.getByRole("button", { name: "Explore the demo" }).first()).toBeVisible();

  // The story's narration is readable as the visitor scrolls.
  await page.getByRole("link", { name: /See how Meera and Kabir planned theirs/ }).click();
  await expect(page.getByRole("heading", { name: "It usually starts like this." })).toBeVisible();

  // Nothing overflows sideways, on desktop or phone.
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});

test("reduced motion gets the story as still frames", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.locator("#story ol > li")).toHaveCount(6);
});

test("sign-in explains invalid input before contacting the server", async ({ page }) => {
  await page.goto("/sign-in");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page.getByRole("alert").first()).toBeVisible();
});
