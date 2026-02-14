import { APP_NAME } from "../config/appMeta";
import {
  absoluteUrl,
  DEFAULT_OG_IMAGE_PATH,
  DEFAULT_SEO_KEYWORDS,
  SITE_ORIGIN,
  type RouteSeoConfig,
} from "../config/seo";

const PAGE_JSON_LD_ID = "sfl-webpage-jsonld";

function ensureMetaTag(attribute: "name" | "property", key: string): HTMLMetaElement {
  const selector = `meta[${attribute}="${key}"]`;
  const existingTag = document.head.querySelector<HTMLMetaElement>(selector);
  if (existingTag) return existingTag;

  const tag = document.createElement("meta");
  tag.setAttribute(attribute, key);
  document.head.append(tag);
  return tag;
}

function setMetaContent(
  attribute: "name" | "property",
  key: string,
  content: string,
): void {
  const tag = ensureMetaTag(attribute, key);
  tag.content = content;
}

function ensureCanonicalLink(): HTMLLinkElement {
  const existingLink = document.head.querySelector<HTMLLinkElement>(
    'link[rel="canonical"]',
  );
  if (existingLink) return existingLink;

  const link = document.createElement("link");
  link.rel = "canonical";
  document.head.append(link);
  return link;
}

function setJsonLd(id: string, data: Record<string, unknown>): void {
  const existingNode = document.getElementById(id);
  const existingScript =
    existingNode instanceof HTMLScriptElement ? existingNode : null;
  const script = existingScript ?? document.createElement("script");

  if (existingNode && !existingScript) {
    existingNode.remove();
  }

  script.id = id;
  script.type = "application/ld+json";
  script.text = JSON.stringify(data);

  if (!existingScript) {
    document.head.append(script);
  }
}

export function applySeo(seo: RouteSeoConfig): void {
  const canonicalUrl = absoluteUrl(seo.canonicalPath);
  const ogImageUrl = absoluteUrl(DEFAULT_OG_IMAGE_PATH);

  document.title = seo.title;

  setMetaContent("name", "description", seo.description);
  setMetaContent("name", "robots", seo.robots);
  setMetaContent("name", "keywords", DEFAULT_SEO_KEYWORDS);

  setMetaContent("property", "og:type", seo.ogType ?? "website");
  setMetaContent("property", "og:site_name", APP_NAME);
  setMetaContent("property", "og:title", seo.title);
  setMetaContent("property", "og:description", seo.description);
  setMetaContent("property", "og:url", canonicalUrl);
  setMetaContent("property", "og:image", ogImageUrl);
  setMetaContent("property", "og:image:alt", `${APP_NAME} piano sight-reading app preview`);

  setMetaContent("name", "twitter:card", "summary_large_image");
  setMetaContent("name", "twitter:title", seo.title);
  setMetaContent("name", "twitter:description", seo.description);
  setMetaContent("name", "twitter:image", ogImageUrl);

  const canonicalLink = ensureCanonicalLink();
  canonicalLink.href = canonicalUrl;

  setJsonLd(PAGE_JSON_LD_ID, {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: seo.title,
    description: seo.description,
    url: canonicalUrl,
    isPartOf: {
      "@type": "WebSite",
      name: APP_NAME,
      url: SITE_ORIGIN,
    },
  });
}
