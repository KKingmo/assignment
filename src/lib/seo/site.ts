export type SiteSeo = { origin: string; indexable: boolean };

export function resolveSiteSeo({ siteUrl, vercelEnv, nodeEnv }: {
  siteUrl?: string; vercelEnv?: string; nodeEnv?: string;
}): SiteSeo {
  const url = new URL(siteUrl || "http://localhost:3000");
  if (!["http:", "https:"].includes(url.protocol) || url.username || url.password) {
    throw new Error("NEXT_PUBLIC_SITE_URL에는 http 또는 https 사이트 주소를 설정해야 합니다.");
  }
  const local = ["localhost", "127.0.0.1", "[::1]", "0.0.0.0"].includes(url.hostname);
  return {
    origin: url.origin,
    indexable: nodeEnv === "production" && !local && vercelEnv !== "preview" && vercelEnv !== "development",
  };
}

export function getSiteSeo() {
  return resolveSiteSeo({
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL,
    vercelEnv: process.env.VERCEL_ENV,
    nodeEnv: process.env.NODE_ENV,
  });
}
