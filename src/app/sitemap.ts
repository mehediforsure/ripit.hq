import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: "https://ripithq.vercel.app", // Adjust this to the actual production URL
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
  ];
}
