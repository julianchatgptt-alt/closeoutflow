import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Closeout",
    short_name: "Closeout",
    description: "Construction closeout software for organized project turnover.",
    start_url: "/",
    display: "standalone",
    background_color: "#f8fafc",
    theme_color: "#f8fafc",
    icons: [
      {
        src: "/icons/icon-any.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any"
      },
      {
        src: "/icons/icon-maskable.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable"
      }
    ]
  };
}
