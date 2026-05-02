import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Comedy Tour Manager",
    short_name: "GigBook",
    description: "Production management for touring comedians",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#f8f5f0",
    theme_color: "#C8553D",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
