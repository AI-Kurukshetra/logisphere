import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    background_color: "#0f172a",
    description:
      "Logisphere field operations app for shipment updates, POD capture, and exception reporting.",
    display: "standalone",
    icons: [
      {
        sizes: "any",
        src: "/globe.svg",
        type: "image/svg+xml",
      },
      {
        sizes: "any",
        src: "/next.svg",
        type: "image/svg+xml",
      },
    ],
    name: "Logisphere Field Ops",
    short_name: "Logisphere",
    start_url: "/field-ops",
    theme_color: "#0f172a",
  };
}
