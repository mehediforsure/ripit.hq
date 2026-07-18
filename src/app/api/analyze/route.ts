import { NextResponse } from "next/server";
import { spawn } from "child_process";
import path from "path";



// Fallback to analyze a direct media link using ffprobe
function analyzeDirectLink(url: string): Promise<NextResponse> {
  return new Promise((resolve) => {
    try {
      console.log(`Analyzing direct stream link via ffprobe: ${url}`);
      const ffprobeStatic = require("ffprobe-static");
      let ffprobePath = ffprobeStatic.path || ffprobeStatic;
      if (ffprobePath.startsWith('\\ROOT') || ffprobePath.startsWith('/ROOT')) {
        ffprobePath = ffprobePath.replace(/^\\ROOT|^\/ROOT/, process.cwd());
      }
      const child = spawn(ffprobePath, [
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

      child.on("error", (err) => {
        console.error("ffprobe child process error:", err);
        resolve(NextResponse.json({
          success: false,
          error: `Analysis system error: ffprobe failed to execute (${err.message}).`
        }, { status: 500 }));
      });

      child.on("close", (code) => {
        if (code === 0) {
          try {
            const data = JSON.parse(stdout);
            
            // Find the audio stream
            const audioStream = data.streams?.find((s: any) => s.codec_type === "audio");
            
            if (!audioStream) {
              return resolve(NextResponse.json({
                success: false,
                error: "The provided URL does not seem to contain an audio stream."
              }, { status: 400 }));
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

            resolve(NextResponse.json({
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
            }));
          } catch (e: any) {
            resolve(NextResponse.json({
              success: false,
              error: `Failed to parse file metadata: ${e.message}`
            }, { status: 500 }));
          }
        } else {
          console.error("ffprobe error output:", stderr);
          resolve(NextResponse.json({
            success: false,
            error: "Unable to analyze link. Please verify the URL points directly to an active audio file or stream."
          }, { status: 400 }));
        }
      });
    } catch (err: any) {
      resolve(NextResponse.json({
        success: false,
        error: `Failed to execute analyzer: ${err.message}`
      }, { status: 500 }));
    }
  });
}

export async function POST(req: Request) {
  const { url } = await req.json();

  if (!url || typeof url !== "string") {
    return NextResponse.json({ success: false, error: "A valid URL is required." }, { status: 400 });
  }

  // Validate URL format
  try {
    new URL(url);
  } catch (e) {
    return NextResponse.json({ success: false, error: "Invalid URL format." }, { status: 400 });
  }

  return new Promise<NextResponse>((resolve) => {
    try {
      console.log(`Attempting analysis via yt-dlp: ${url}`);
      const isWin = process.platform === "win32";
      const ytDlpExecutable = isWin ? "yt-dlp.exe" : "yt-dlp";
      const ytDlpPath = path.join(process.cwd(), ytDlpExecutable);
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

      const child = spawn(ytDlpPath, [
        "--js-runtimes", "node",
        "-f", "bestaudio",
        "-j",
        "--no-warnings",
        url
      ], { env });

      let stdout = "";
      let stderr = "";

      child.stdout.on("data", (data) => {
        stdout += data.toString();
      });

      child.stderr.on("data", (data) => {
        stderr += data.toString();
      });

      child.on("error", (err) => {
        console.error("yt-dlp analysis spawn error:", err);
        analyzeDirectLink(url).then(resolve);
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

            resolve(NextResponse.json({
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
            }));
          } catch (e: any) {
            console.warn("yt-dlp JSON parse failed, falling back to direct ffprobe:", e.message);
            analyzeDirectLink(url).then(resolve);
          }
        } else {
          console.log("yt-dlp analyzer not compatible or failed, falling back to direct ffprobe.");
          analyzeDirectLink(url).then(resolve);
        }
      });
    } catch (err: any) {
      console.warn("Failed to initiate yt-dlp, falling back to direct ffprobe:", err.message);
      analyzeDirectLink(url).then(resolve);
    }
  });
}
