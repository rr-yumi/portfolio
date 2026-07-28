const FALLBACK_SITE = "http://localhost:4321";

export function GET() {
  const site = import.meta.env.SITE ?? FALLBACK_SITE;
  const base = new URL(site);
  const now = new Date().toISOString();
  const routes = ["/", "/works/"];

  const urls = routes
    .map((route) => {
      const loc = new URL(route, base).toString();
      return [
        "<url>",
        `<loc>${loc}</loc>`,
        `<lastmod>${now}</lastmod>`,
        "<changefreq>weekly</changefreq>",
        "<priority>1.0</priority>",
        "</url>"
      ].join("");
    })
    .join("");

  const body = `<?xml version="1.0" encoding="UTF-8"?>` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`;

  return new Response(body, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8"
    }
  });
}
