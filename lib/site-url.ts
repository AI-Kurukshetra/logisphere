import { headers } from "next/headers";

export async function getSiteUrl(path = "") {
  const headerList = await headers();
  const origin = headerList.get("origin");

  if (origin) {
    return `${origin}${path}`;
  }

  const host =
    headerList.get("x-forwarded-host") ?? headerList.get("host") ?? "localhost:3000";
  const protocol =
    headerList.get("x-forwarded-proto") ?? (host.includes("localhost") ? "http" : "https");

  return `${protocol}://${host}${path}`;
}
