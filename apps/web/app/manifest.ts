import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "CloseoutFlow",
    short_name: "CloseoutFlow",
    description: "Construction closeout management",
    start_url: "/",
    display: "standalone",
    background_color: "#f8fafc",
    theme_color: "#1d4ed8"
  };
}
