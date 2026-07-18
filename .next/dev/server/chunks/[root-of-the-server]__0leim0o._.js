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
"[project]/src/app/api/analyze/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "POST",
    ()=>POST
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/server.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$child_process__$5b$external$5d$__$28$child_process$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/child_process [external] (child_process, cjs)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$path__$5b$external$5d$__$28$path$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/path [external] (path, cjs)");
;
;
;
// Fallback to analyze a direct media link using ffprobe
function analyzeDirectLink(url) {
    return new Promise((resolve)=>{
        try {
            console.log(`Analyzing direct stream link via ffprobe: ${url}`);
            const child = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$child_process__$5b$external$5d$__$28$child_process$2c$__cjs$29$__["spawn"])("ffprobe", [
                "-v",
                "error",
                "-show_format",
                "-show_streams",
                "-of",
                "json",
                url
            ]);
            let stdout = "";
            let stderr = "";
            child.stdout.on("data", (data)=>{
                stdout += data.toString();
            });
            child.stderr.on("data", (data)=>{
                stderr += data.toString();
            });
            child.on("error", (err)=>{
                console.error("ffprobe child process error:", err);
                resolve(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                    success: false,
                    error: `Analysis system error: ffprobe failed to execute (${err.message}).`
                }, {
                    status: 500
                }));
            });
            child.on("close", (code)=>{
                if (code === 0) {
                    try {
                        const data = JSON.parse(stdout);
                        // Find the audio stream
                        const audioStream = data.streams?.find((s)=>s.codec_type === "audio");
                        if (!audioStream) {
                            return resolve(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                                success: false,
                                error: "The provided URL does not seem to contain an audio stream."
                            }, {
                                status: 400
                            }));
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
                        resolve(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
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
                    } catch (e) {
                        resolve(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                            success: false,
                            error: `Failed to parse file metadata: ${e.message}`
                        }, {
                            status: 500
                        }));
                    }
                } else {
                    console.error("ffprobe error output:", stderr);
                    resolve(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                        success: false,
                        error: "Unable to analyze link. Please verify the URL points directly to an active audio file or stream."
                    }, {
                        status: 400
                    }));
                }
            });
        } catch (err) {
            resolve(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                success: false,
                error: `Failed to execute analyzer: ${err.message}`
            }, {
                status: 500
            }));
        }
    });
}
async function POST(req) {
    const { url } = await req.json();
    if (!url || typeof url !== "string") {
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            success: false,
            error: "A valid URL is required."
        }, {
            status: 400
        });
    }
    // Validate URL format
    try {
        new URL(url);
    } catch (e) {
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            success: false,
            error: "Invalid URL format."
        }, {
            status: 400
        });
    }
    return new Promise((resolve)=>{
        try {
            console.log(`Attempting analysis via yt-dlp: ${url}`);
            const ytDlpPath = __TURBOPACK__imported__module__$5b$externals$5d2f$path__$5b$external$5d$__$28$path$2c$__cjs$29$__["default"].join(process.cwd(), "yt-dlp");
            const child = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$child_process__$5b$external$5d$__$28$child_process$2c$__cjs$29$__["spawn"])(ytDlpPath, [
                "--js-runtimes",
                "node",
                "-f",
                "bestaudio",
                "-j",
                "--no-warnings",
                url
            ]);
            let stdout = "";
            let stderr = "";
            child.stdout.on("data", (data)=>{
                stdout += data.toString();
            });
            child.stderr.on("data", (data)=>{
                stderr += data.toString();
            });
            child.on("error", (err)=>{
                console.error("yt-dlp analysis spawn error:", err);
                analyzeDirectLink(url).then(resolve);
            });
            child.on("close", (code)=>{
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
                        let suggestedFileName = ("TURBOPACK compile-time truthy", 1) ? title.replace(/[/\\?%*:|"<>\s]/g, "_") : "TURBOPACK unreachable";
                        resolve(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
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
                    } catch (e) {
                        console.warn("yt-dlp JSON parse failed, falling back to direct ffprobe:", e.message);
                        analyzeDirectLink(url).then(resolve);
                    }
                } else {
                    console.log("yt-dlp analyzer not compatible or failed, falling back to direct ffprobe.");
                    analyzeDirectLink(url).then(resolve);
                }
            });
        } catch (err) {
            console.warn("Failed to initiate yt-dlp, falling back to direct ffprobe:", err.message);
            analyzeDirectLink(url).then(resolve);
        }
    });
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__0leim0o._.js.map