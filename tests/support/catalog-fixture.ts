import { test as base, expect, type Page, type Route } from "@playwright/test";
import { allBookRows, bookRows } from "../fixtures/books";

export const catalogRoute = "**/rest/v1/books?*";

export async function fulfillBooks(route: Route, rows = bookRows, total = 18, offset = 0) {
  await route.fulfill({
    status: rows.length < total ? 206 : 200,
    contentType: "application/json",
    headers: { "access-control-expose-headers": "content-range", "content-range": rows.length ? `${offset}-${offset + rows.length - 1}/${total}` : `*/${total}` },
    body: JSON.stringify(rows),
  });
}

export async function fulfillCatalogRequest(route: Route) {
  const params = new URL(route.request().url()).searchParams;
  const ids = params.get("id")?.slice(4, -1).split(",");
  if (ids) return route.fulfill({ json: allBookRows.filter((row) => ids.includes(row.id)) });
  const kind = params.get("kind")?.slice(3);
  const title = params.get("title");
  const pattern = title ? new RegExp(title.slice("imatch.".length), "i") : undefined;
  const rows = allBookRows.filter((row) => (!kind || row.kind === kind) && (!pattern || pattern.test(row.title)));
  if (route.request().method() === "HEAD") return fulfillBooks(route, [], rows.length);
  const offset = Number(params.get("offset") ?? 0);
  const limit = Number(params.get("limit") ?? 12);
  if (offset > 0 && offset >= rows.length) {
    return route.fulfill({ status: 416, json: { code: "PGRST103", message: "Requested range not satisfiable" } });
  }
  return fulfillBooks(route, rows.slice(offset, offset + limit), rows.length, offset);
}

export async function mockBooks(page: Page) {
  await page.route(catalogRoute, fulfillCatalogRequest);
}

export const test = base.extend({
  page: async ({ page }, provide) => {
    await mockBooks(page);
    await provide(page);
  },
});

export { expect };
