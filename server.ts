import express from "express";
import path from "path";
import { spawn } from "child_process";
import { createServer as createViteServer } from "vite";

// Helper to check if a URL is a YouTube link
function isYouTubeUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();
    return host === "youtube.com" || host.endsWith(".youtube.com") || host === "youtu.be" || host.endsWith(".youtu.be");
  } catch (e) {
    return false;
  }
}

// Helper to run FFmpeg transcode stream to Express response
function startFfmpegTranscode(
  streamUrl: string,
  format: string,
  bitrate: string,
  filename: string,
  title: string | undefined,
  artist: string | undefined,
  res: any,
  req: any
) {
  const extension = format === "flac" ? "flac" : "mp3";
  const baseName = filename ? String(filename) : "downloaded_audio";
  const safeFilename = `${baseName.replace(/[/\\?%*:|"<>\s]/g, "_")}.${extension}`;

  // Set headers for file attachment download
  res.setHeader("Content-Disposition", `attachment; filename*=UTF-8''${encodeURIComponent(safeFilename)}`);
  res.setHeader("Content-Type", format === "flac" ? "audio/flac" : "audio/mpeg");

  // Build FFmpeg command arguments
  const ffmpegArgs = [
    "-v", "error",
    "-i", streamUrl,
  ];

  // Embed custom metadata tags if specified by the user
  if (title) {
    ffmpegArgs.push("-metadata", `title=${title}`);
  }
  if (artist) {
    ffmpegArgs.push("-metadata", `artist=${artist}`);
  }

  // Map input metadata and specify format
  ffmpegArgs.push("-map_metadata", "0");
  ffmpegArgs.push("-f", format);

  // Format specific settings
  if (format === "mp3") {
    const selectedBitrate = typeof bitrate === "string" && ["320k", "256k", "192k", "128k"].includes(bitrate)
      ? bitrate
      : "320k";
    ffmpegArgs.push("-b:a", selectedBitrate);
  } else if (format === "flac") {
    // FLAC encoding - level 5 (default balance of speed/compression)
    ffmpegArgs.push("-compression_level", "5");
  }

  // Output to stdout pipe
  ffmpegArgs.push("pipe:1");

  console.log(`Starting FFmpeg conversion: ffmpeg ${ffmpegArgs.join(" ")}`);

  const ffmpegProcess = spawn("ffmpeg", ffmpegArgs);

  // Pipe FFmpeg output directly to the Express response stream
  ffmpegProcess.stdout.pipe(res);

  // Keep track of errors on stderr
  let stderrOutput = "";
  ffmpegProcess.stderr.on("data", (chunk) => {
    stderrOutput += chunk.toString();
  });

  ffmpegProcess.on("error", (err) => {
    console.error("FFmpeg process error:", err);
    if (!res.headersSent) {
      res.status(500).send("Error converting file.");
    }
  });

  // Handle process termination/close
  ffmpegProcess.on("close", (code) => {
    if (code !== 0) {
      console.error(`FFmpeg process finished with non-zero exit code ${code}`);
      console.error("FFmpeg stderr output:", stderrOutput);
    } else {
      console.log(`FFmpeg conversion for ${safeFilename} completed successfully.`);
    }
  });

  // If the user aborts/cancels the download in the browser, terminate the FFmpeg process immediately!
  req.on("close", () => {
    if (ffmpegProcess.exitCode === null) {
      console.log("Client closed connection. Terminating FFmpeg process...");
      ffmpegProcess.kill("SIGKILL");
    }
  });
}

// Fallback to analyze a direct media link using ffprobe
function analyzeDirectLink(url: string, res: any) {
  try {
    console.log(`Analyzing direct stream link via ffprobe: ${url}`);
    const child = spawn("ffprobe", [
      "-v", "error",
      "-show_format",
      "-show_streams",
      "-of", "json",
      url
    ]);

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (data) => {
      stdout += data.toString();
    });

    child.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    child.on("close", (code) => {
      if (code === 0) {
        try {
          const data = JSON.parse(stdout);
          
          // Find the audio stream
          const audioStream = data.streams?.find((s: any) => s.codec_type === "audio");
          
          if (!audioStream) {
            return res.status(400).json({
              success: false,
              error: "The provided URL does not seem to contain an audio stream."
            });
          }

          const format = data.format || {};
          const tags = format.tags || {};

          // Extract file extension or name from URL
          let fileName = "audio";
          try {
            const urlObj = new URL(url);
            const pathname = urlObj.pathname;
            const lastSegment = pathname.substring(pathname.lastIndexOf("/") + 1);
            if (lastSegment && lastSegment.includes(".")) {
              fileName = lastSegment.substring(0, lastSegment.lastIndexOf("."));
            } else if (lastSegment) {
              fileName = lastSegment;
            }
          } catch (_) {}

          // Clean title and artist from metadata if available
          const title = tags.title || tags.TITLE || fileName || "Untitled Track";
          const artist = tags.artist || tags.ARTIST || "Unknown Artist";
          const album = tags.album || tags.ALBUM || "Unknown Album";
          const year = tags.date || tags.DATE || tags.year || "";

          return res.json({
            success: true,
            metadata: {
              url,
              codec: audioStream.codec_name,
              codecLong: audioStream.codec_long_name,
              duration: parseFloat(format.duration || audioStream.duration || "0"),
              size: parseInt(format.size || "0", 10),
              bitrate: parseInt(format.bit_rate || audioStream.bit_rate || "0", 10),
              channels: audioStream.channels || 2,
              sampleRate: parseInt(audioStream.sample_rate || "44100", 10),
              title,
              artist,
              album,
              year,
              suggestedFileName: fileName
            }
          });
        } catch (e: any) {
          return res.status(500).json({
            success: false,
            error: `Failed to parse file metadata: ${e.message}`
          });
        }
      } else {
        console.error("ffprobe error output:", stderr);
        return res.status(400).json({
          success: false,
          error: "Unable to analyze link. Please verify the URL points directly to an active audio file or stream."
        });
      }
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: `Failed to execute analyzer: ${err.message}`
    });
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware to parse JSON
  app.use(express.json());

  // API Route: Health Check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // API Route: Analyze Audio Link
  app.post("/api/analyze", async (req, res) => {
    const { url } = req.body;

    if (!url || typeof url !== "string") {
      return res.status(400).json({ success: false, error: "A valid URL is required." });
    }

    // Validate URL format
    try {
      new URL(url);
    } catch (e) {
      return res.status(400).json({ success: false, error: "Invalid URL format." });
    }

    // Try analyzing with yt-dlp first for general rich media extract (YouTube, SoundCloud, TikTok, Bandcamp, Vimeo, Twitter, etc.)
    try {
      console.log(`Attempting analysis via yt-dlp: ${url}`);
      const ytDlpPath = path.join(process.cwd(), "yt-dlp");
      const child = spawn(ytDlpPath, [
        "--js-runtimes", "node",
        "-f", "bestaudio",
        "-j",
        "--no-warnings",
        url
      ]);

      let stdout = "";
      let stderr = "";

      child.stdout.on("data", (data) => {
        stdout += data.toString();
      });

      child.stderr.on("data", (data) => {
        stderr += data.toString();
      });

      child.on("close", (code) => {
        if (code === 0 && stdout.trim()) {
          try {
            const metadata = JSON.parse(stdout);
            const duration = parseFloat(metadata.duration || "0");
            const title = metadata.title || "Extracted Audio";
            const artist = metadata.uploader || metadata.artist || "Web Creator";
            const codec = metadata.acodec || "opus";
            const bitrate = metadata.abr ? Math.round(metadata.abr * 1000) : 128000;
            const sampleRate = metadata.asr || 44100;
            const size = metadata.filesize || metadata.filesize_approx || 0;

            // Clean suggestions for file name
            let suggestedFileName = title
              ? title.replace(/[/\\?%*:|"<>\s]/g, "_")
              : "extracted_audio";

            return res.json({
              success: true,
              metadata: {
                url,
                previewUrl: metadata.url,
                codec,
                codecLong: `${metadata.extractor_key || "Web"} Audio stream (${codec})`,
                duration,
                size,
                bitrate,
                channels: 2,
                sampleRate,
                title,
                artist,
                album: metadata.album || metadata.extractor_key || "Web Stream",
                year: metadata.upload_date ? metadata.upload_date.substring(0, 4) : "",
                suggestedFileName
              }
            });
          } catch (e: any) {
            console.warn("yt-dlp JSON parse failed, falling back to direct ffprobe:", e.message);
            return analyzeDirectLink(url, res);
          }
        } else {
          console.log("yt-dlp analyzer not compatible or failed, falling back to direct ffprobe.");
          return analyzeDirectLink(url, res);
        }
      });
    } catch (err: any) {
      console.warn("Failed to initiate yt-dlp, falling back to direct ffprobe:", err.message);
      return analyzeDirectLink(url, res);
    }
  });

  // API Route: Convert and Download Audio
  app.get("/api/download", async (req, res) => {
    const { url, format, bitrate, filename, title, artist } = req.query;

    if (!url || typeof url !== "string") {
      return res.status(400).send("A valid audio URL is required.");
    }

    const targetFormat = typeof format === "string" ? format : "mp3";
    const selectedBitrate = typeof bitrate === "string" ? bitrate : "320k";
    const targetFilename = typeof filename === "string" ? filename : "audio_file";
    const customTitle = typeof title === "string" ? title : undefined;
    const customArtist = typeof artist === "string" ? artist : undefined;

    if (targetFormat !== "mp3" && targetFormat !== "flac") {
      return res.status(400).send("Invalid target format. Supported formats are: mp3, flac.");
    }

    // Try resolving stream URL via yt-dlp first
    try {
      console.log(`Resolving streaming source URL via yt-dlp: ${url}`);
      const ytDlpPath = path.join(process.cwd(), "yt-dlp");
      const ytDlpProcess = spawn(ytDlpPath, [
        "--js-runtimes", "node",
        "-f", "bestaudio",
        "-g",
        "--no-warnings",
        url
      ]);

      let resolvedUrl = "";
      let ytDlpError = "";

      ytDlpProcess.stdout.on("data", (data) => {
        resolvedUrl += data.toString();
      });

      ytDlpProcess.stderr.on("data", (data) => {
        ytDlpError += data.toString();
      });

      ytDlpProcess.on("close", (code) => {
        if (code !== 0 || !resolvedUrl.trim()) {
          console.log(`yt-dlp resolution failed or bypassed. Code: ${code}. Treating as direct stream URL.`);
          startFfmpegTranscode(url, targetFormat, selectedBitrate, targetFilename, customTitle, customArtist, res, req);
        } else {
          const finalDirectUrl = resolvedUrl.trim();
          console.log(`Resolved stream URL successfully: ${finalDirectUrl}`);
          startFfmpegTranscode(finalDirectUrl, targetFormat, selectedBitrate, targetFilename, customTitle, customArtist, res, req);
        }
      });
    } catch (err: any) {
      console.error("Failed to run yt-dlp on download, running direct stream fallback:", err);
      startFfmpegTranscode(url, targetFormat, selectedBitrate, targetFilename, customTitle, customArtist, res, req);
    }
  });

  // Vite development integration
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Production static files serving
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
});
