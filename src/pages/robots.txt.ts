const FALLBACK_SITE = "http://localhost:4321";

export function GET() {
  const site = import.meta.env.SITE ?? FALLBACK_SITE;
  const sitemapUrl = new URL("/sitemap.xml", site).toString();

  const body = [
    "User-agent: *",
    "Allow: /",
    "",
    `Sitemap: ${sitemapUrl}`
  ].join("\n");

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8"
    }
  });
}
