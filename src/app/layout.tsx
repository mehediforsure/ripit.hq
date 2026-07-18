import type { Metadata } from "next";
import "../index.css"; // Importing global Tailwind styles

export const metadata: Metadata = {
  title: "RipIt.HQ — Pristine High-Quality Audio Downloader & Transcoder",
  description: "An advanced high-fidelity audio downloader and transcoder. Analyze web audio URLs instantly and download them in pristine, lossless FLAC or high-bitrate MP3 format.",
  keywords: "audio downloader, FLAC transcoder, MP3 downloader, high quality audio, RipIt, RipIt.HQ, lossless audio, music transcoder, online audio converter, rip it, ripithq",
  authors: [{ name: "mehediforsure" }],
  openGraph: {
    title: "RipIt.HQ — Pristine High-Quality Audio Downloader & Transcoder",
    description: "An advanced high-fidelity audio downloader and transcoder. Analyze web audio URLs instantly and download them in pristine, lossless FLAC or high-bitrate MP3 format.",
    siteName: "RipIt.HQ",
    url: "https://github.com/mehediforsure",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "RipIt.HQ — Pristine High-Quality Audio Downloader & Transcoder",
    description: "An advanced high-fidelity audio downloader and transcoder. Analyze web audio URLs instantly and download them in pristine, lossless FLAC or high-bitrate MP3 format.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              "name": "RipIt.HQ",
              "url": "https://ripithq.vercel.app",
              "description": "An advanced high-fidelity audio downloader and transcoder.",
              "applicationCategory": "MultimediaApplication",
              "operatingSystem": "All",
              "offers": {
                "@type": "Offer",
                "price": "0"
              }
            })
          }}
        />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
