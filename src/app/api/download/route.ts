import { NextResponse } from "next/server";
import { spawn } from "child_process";
import path from "path";

export const dynamic = 'force-dynamic';

function startFfmpegTranscode(
  streamUrl: string,
  format: string,
  bitrate: string,
  filename: string,
  title: string | undefined,
  artist: string | undefined,
  req: Request
) {
  const extension = format === "flac" ? "flac" : "mp3";
  const baseName = filename ? String(filename) : "downloaded_audio";
  const safeFilename = `${baseName.replace(/[\/\\?%*:|"<>\s]/g, "_")}.${extension}`;

  const ffmpegArgs = [
    "-v", "error",
    "-i", streamUrl,
  ];

  if (title) {
    ffmpegArgs.push("-metadata", `title=${title}`);
  }
  if (artist) {
    ffmpegArgs.push("-metadata", `artist=${artist}`);
  }

  ffmpegArgs.push("-map_metadata", "0");
  ffmpegArgs.push("-f", format);

  if (format === "mp3") {
    const selectedBitrate = typeof bitrate === "string" && ["320k", "256k", "192k", "128k"].includes(bitrate)
      ? bitrate
      : "320k";
    ffmpegArgs.push("-b:a", selectedBitrate);
  } else if (format === "flac") {
    ffmpegArgs.push("-compression_level", "5");
  }

  ffmpegArgs.push("pipe:1");

  console.log(`Starting FFmpeg conversion: ffmpeg ${ffmpegArgs.join(" ")}`);
  
  const ffmpegStatic = require("ffmpeg-static");
  let ffmpegPath = ffmpegStatic;
  if (ffmpegPath.startsWith('\\ROOT') || ffmpegPath.startsWith('/ROOT')) {
    ffmpegPath = ffmpegPath.replace(/^\\ROOT|^\/ROOT/, process.cwd());
  }
  const ffmpegProcess = spawn(ffmpegPath, ffmpegArgs);

  let stderrOutput = "";
  ffmpegProcess.stderr.on("data", (chunk) => {
    stderrOutput += chunk.toString();
  });

  ffmpegProcess.on("close", (code) => {
    if (code !== 0) {
      console.error(`FFmpeg process finished with non-zero exit code ${code}`);
      console.error("FFmpeg stderr output:", stderrOutput);
    } else {
      console.log(`FFmpeg conversion for ${safeFilename} completed successfully.`);
    }
  });

  req.signal.addEventListener("abort", () => {
    if (ffmpegProcess.exitCode === null) {
      console.log("Client aborted connection. Terminating FFmpeg process...");
      ffmpegProcess.kill("SIGKILL");
    }
  });

  const stream = new ReadableStream({
    start(controller) {
      ffmpegProcess.stdout.on("data", (chunk) => controller.enqueue(chunk));
      ffmpegProcess.stdout.on("close", () => controller.close());
      ffmpegProcess.stdout.on("error", (err) => controller.error(err));
    },
    cancel() {
      ffmpegProcess.kill("SIGKILL");
    }
  });

  const headers = new Headers();
  headers.set("Content-Disposition", `attachment; filename*=UTF-8''${encodeURIComponent(safeFilename)}`);
  headers.set("Content-Type", format === "flac" ? "audio/flac" : "audio/mpeg");

  return new NextResponse(stream, { headers });
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const url = searchParams.get("url");
  const format = searchParams.get("format") || "mp3";
  const bitrate = searchParams.get("bitrate") || "320k";
  const filename = searchParams.get("filename") || "audio_file";
  const title = searchParams.get("title") || undefined;
  const artist = searchParams.get("artist") || undefined;

  if (!url) {
    return new NextResponse("A valid audio URL is required.", { status: 400 });
  }

  if (format !== "mp3" && format !== "flac") {
    return new NextResponse("Invalid target format. Supported formats are: mp3, flac.", { status: 400 });
  }

  return new Promise<NextResponse>((resolve) => {
    try {
      console.log(`Resolving streaming source URL via yt-dlp: ${url}`);
      const ytDlpPath = path.join(process.cwd(), "yt-dlp");
      
      const ffmpegStatic = require("ffmpeg-static");
      const ffprobeStatic = require("ffprobe-static");
      
      let ffmpegPathStr = ffmpegStatic;
      if (ffmpegPathStr.startsWith('\\ROOT') || ffmpegPathStr.startsWith('/ROOT')) {
        ffmpegPathStr = ffmpegPathStr.replace(/^\\ROOT|^\/ROOT/, process.cwd());
      }
      
      let ffprobePathStr = ffprobeStatic.path || ffprobeStatic;
      if (ffprobePathStr.startsWith('\\ROOT') || ffprobePathStr.startsWith('/ROOT')) {
        ffprobePathStr = ffprobePathStr.replace(/^\\ROOT|^\/ROOT/, process.cwd());
      }
      
      const ffmpegDir = path.dirname(ffmpegPathStr);
      const ffprobeDir = path.dirname(ffprobePathStr);
      const env = { ...process.env, PATH: `${ffmpegDir}${path.delimiter}${ffprobeDir}${path.delimiter}${process.env.PATH}` };

      const ytDlpProcess = spawn("python", [
        ytDlpPath,
        "--js-runtimes", "node",
        "-f", "bestaudio",
        "-g",
        "--no-warnings",
        url
      ], { env });

      let resolvedUrl = "";
      let ytDlpError = "";

      ytDlpProcess.stdout.on("data", (data) => {
        resolvedUrl += data.toString();
      });

      ytDlpProcess.stderr.on("data", (data) => {
        ytDlpError += data.toString();
      });

      ytDlpProcess.on("error", (err) => {
        console.error("yt-dlp download spawn error:", err);
        resolve(startFfmpegTranscode(url, format, bitrate, filename, title, artist, req));
      });

      ytDlpProcess.on("close", (code) => {
        if (code !== 0 || !resolvedUrl.trim()) {
          console.log(`yt-dlp resolution failed or bypassed. Code: ${code}. Treating as direct stream URL.`);
          resolve(startFfmpegTranscode(url, format, bitrate, filename, title, artist, req));
        } else {
          const finalDirectUrl = resolvedUrl.trim();
          console.log(`Resolved stream URL successfully: ${finalDirectUrl}`);
          resolve(startFfmpegTranscode(finalDirectUrl, format, bitrate, filename, title, artist, req));
        }
      });
    } catch (err: any) {
      console.error("Failed to run yt-dlp on download, running direct stream fallback:", err);
      resolve(startFfmpegTranscode(url, format, bitrate, filename, title, artist, req));
    }
  });
}
