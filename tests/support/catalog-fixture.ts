import { test as base, expect, type Page, type Route } from "@playwright/test";
import { bookRows } from "../fixtures/books";

export const catalogRoute = "**/rest/v1/books?*";

export async function fulfillBooks(route: Route, rows = bookRows, total = 18) {
  await route.fulfill({
    status: rows.length < total ? 206 : 200,
    contentType: "application/json",
    headers: { "access-control-expose-headers": "content-range", "content-range": rows.length ? `0-${rows.length - 1}/${total}` : `*/${total}` },
    body: JSON.stringify(rows),
  });
}

export async function mockBooks(page: Page) {
  await page.route(catalogRoute, (route) => fulfillBooks(route));
}

export const test = base.extend({
  page: async ({ page }, provide) => {
    await mockBooks(page);
    await provide(page);
  },
});

export { expect };
