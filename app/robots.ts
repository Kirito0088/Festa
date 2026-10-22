import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

/** Public pages may be indexed; signed-in celebrations are private. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/events"] },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
