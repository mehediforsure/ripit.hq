module.exports = [
"[externals]/next/dist/compiled/next-server/app-route-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-route-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/@opentelemetry/api [external] (next/dist/compiled/@opentelemetry/api, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/@opentelemetry/api", () => require("next/dist/compiled/@opentelemetry/api"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-unit-async-storage.external.js [external] (next/dist/server/app-render/work-unit-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-unit-async-storage.external.js", () => require("next/dist/server/app-render/work-unit-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-async-storage.external.js [external] (next/dist/server/app-render/work-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-async-storage.external.js", () => require("next/dist/server/app-render/work-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/after-task-async-storage.external.js [external] (next/dist/server/app-render/after-task-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/after-task-async-storage.external.js", () => require("next/dist/server/app-render/after-task-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/child_process [external] (child_process, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("child_process", () => require("child_process"));

module.exports = mod;
}),
"[externals]/path [external] (path, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("path", () => require("path"));

module.exports = mod;
}),
"[externals]/os [external] (os, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("os", () => require("os"));

module.exports = mod;
}),
"[project]/src/app/api/download/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GET",
    ()=>GET,
    "dynamic",
    ()=>dynamic
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/server.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$child_process__$5b$external$5d$__$28$child_process$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/child_process [external] (child_process, cjs)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$path__$5b$external$5d$__$28$path$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/path [external] (path, cjs)");
;
;
;
const dynamic = 'force-dynamic';
function startFfmpegTranscode(streamUrl, format, bitrate, filename, title, artist, req) {
    const extension = format === "flac" ? "flac" : "mp3";
    const baseName = filename ? String(filename) : "downloaded_audio";
    const safeFilename = `${baseName.replace(/[\/\\?%*:|"<>\s]/g, "_")}.${extension}`;
    const ffmpegArgs = [
        "-v",
        "error",
        "-i",
        streamUrl
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
        const selectedBitrate = typeof bitrate === "string" && [
            "320k",
            "256k",
            "192k",
            "128k"
        ].includes(bitrate) ? bitrate : "320k";
        ffmpegArgs.push("-b:a", selectedBitrate);
    } else if (format === "flac") {
        ffmpegArgs.push("-compression_level", "5");
    }
    ffmpegArgs.push("pipe:1");
    console.log(`Starting FFmpeg conversion: ffmpeg ${ffmpegArgs.join(" ")}`);
    const ffmpegStatic = __turbopack_context__.r("[project]/node_modules/ffmpeg-static/index.js [app-route] (ecmascript)");
    let ffmpegPath = ffmpegStatic;
    if (ffmpegPath.startsWith('\\ROOT') || ffmpegPath.startsWith('/ROOT')) {
        ffmpegPath = ffmpegPath.replace(/^\\ROOT|^\/ROOT/, process.cwd());
    }
    const ffmpegProcess = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$child_process__$5b$external$5d$__$28$child_process$2c$__cjs$29$__["spawn"])(ffmpegPath, ffmpegArgs);
    let stderrOutput = "";
    ffmpegProcess.stderr.on("data", (chunk)=>{
        stderrOutput += chunk.toString();
    });
    ffmpegProcess.on("close", (code)=>{
        if (code !== 0) {
            console.error(`FFmpeg process finished with non-zero exit code ${code}`);
            console.error("FFmpeg stderr output:", stderrOutput);
        } else {
            console.log(`FFmpeg conversion for ${safeFilename} completed successfully.`);
        }
    });
    req.signal.addEventListener("abort", ()=>{
        if (ffmpegProcess.exitCode === null) {
            console.log("Client aborted connection. Terminating FFmpeg process...");
            ffmpegProcess.kill("SIGKILL");
        }
    });
    const stream = new ReadableStream({
        start (controller) {
            ffmpegProcess.stdout.on("data", (chunk)=>controller.enqueue(chunk));
            ffmpegProcess.stdout.on("close", ()=>controller.close());
            ffmpegProcess.stdout.on("error", (err)=>controller.error(err));
        },
        cancel () {
            ffmpegProcess.kill("SIGKILL");
        }
    });
    const headers = new Headers();
    headers.set("Content-Disposition", `attachment; filename*=UTF-8''${encodeURIComponent(safeFilename)}`);
    headers.set("Content-Type", format === "flac" ? "audio/flac" : "audio/mpeg");
    return new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"](stream, {
        headers
    });
}
async function GET(req) {
    const { searchParams } = new URL(req.url);
    const url = searchParams.get("url");
    const format = searchParams.get("format") || "mp3";
    const bitrate = searchParams.get("bitrate") || "320k";
    const filename = searchParams.get("filename") || "audio_file";
    const title = searchParams.get("title") || undefined;
    const artist = searchParams.get("artist") || undefined;
    if (!url) {
        return new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"]("A valid audio URL is required.", {
            status: 400
        });
    }
    if (format !== "mp3" && format !== "flac") {
        return new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"]("Invalid target format. Supported formats are: mp3, flac.", {
            status: 400
        });
    }
    return new Promise((resolve)=>{
        try {
            console.log(`Resolving streaming source URL via yt-dlp: ${url}`);
            const ytDlpPath = __TURBOPACK__imported__module__$5b$externals$5d2f$path__$5b$external$5d$__$28$path$2c$__cjs$29$__["default"].join(process.cwd(), "yt-dlp");
            const ffmpegStatic = __turbopack_context__.r("[project]/node_modules/ffmpeg-static/index.js [app-route] (ecmascript)");
            const ffprobeStatic = __turbopack_context__.r("[project]/node_modules/ffprobe-static/index.js [app-route] (ecmascript)");
            let ffmpegPathStr = ffmpegStatic;
            if (ffmpegPathStr.startsWith('\\ROOT') || ffmpegPathStr.startsWith('/ROOT')) {
                ffmpegPathStr = ffmpegPathStr.replace(/^\\ROOT|^\/ROOT/, process.cwd());
            }
            let ffprobePathStr = ffprobeStatic.path || ffprobeStatic;
            if (ffprobePathStr.startsWith('\\ROOT') || ffprobePathStr.startsWith('/ROOT')) {
                ffprobePathStr = ffprobePathStr.replace(/^\\ROOT|^\/ROOT/, process.cwd());
            }
            const ffmpegDir = __TURBOPACK__imported__module__$5b$externals$5d2f$path__$5b$external$5d$__$28$path$2c$__cjs$29$__["default"].dirname(ffmpegPathStr);
            const ffprobeDir = __TURBOPACK__imported__module__$5b$externals$5d2f$path__$5b$external$5d$__$28$path$2c$__cjs$29$__["default"].dirname(ffprobePathStr);
            const env = {
                ...process.env,
                PATH: `${ffmpegDir}${__TURBOPACK__imported__module__$5b$externals$5d2f$path__$5b$external$5d$__$28$path$2c$__cjs$29$__["default"].delimiter}${ffprobeDir}${__TURBOPACK__imported__module__$5b$externals$5d2f$path__$5b$external$5d$__$28$path$2c$__cjs$29$__["default"].delimiter}${process.env.PATH}`
            };
            const ytDlpProcess = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$child_process__$5b$external$5d$__$28$child_process$2c$__cjs$29$__["spawn"])("python", [
                ytDlpPath,
                "--js-runtimes",
                "node",
                "-f",
                "bestaudio",
                "-g",
                "--no-warnings",
                url
            ], {
                env
            });
            let resolvedUrl = "";
            let ytDlpError = "";
            ytDlpProcess.stdout.on("data", (data)=>{
                resolvedUrl += data.toString();
            });
            ytDlpProcess.stderr.on("data", (data)=>{
                ytDlpError += data.toString();
            });
            ytDlpProcess.on("error", (err)=>{
                console.error("yt-dlp download spawn error:", err);
                resolve(startFfmpegTranscode(url, format, bitrate, filename, title, artist, req));
            });
            ytDlpProcess.on("close", (code)=>{
                if (code !== 0 || !resolvedUrl.trim()) {
                    console.log(`yt-dlp resolution failed or bypassed. Code: ${code}. Treating as direct stream URL.`);
                    resolve(startFfmpegTranscode(url, format, bitrate, filename, title, artist, req));
                } else {
                    const finalDirectUrl = resolvedUrl.trim();
                    console.log(`Resolved stream URL successfully: ${finalDirectUrl}`);
                    resolve(startFfmpegTranscode(finalDirectUrl, format, bitrate, filename, title, artist, req));
                }
            });
        } catch (err) {
            console.error("Failed to run yt-dlp on download, running direct stream fallback:", err);
            resolve(startFfmpegTranscode(url, format, bitrate, filename, title, artist, req));
        }
    });
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__08jdw1i._.js.map