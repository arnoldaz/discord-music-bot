import { Readable } from "stream";
import { spawn } from "child_process";
import { log, LogLevel } from "./logger";
import { getBinaryPath } from "./localFiles";

/**
 * Gets readable audio stream for YouTube video based on the Id.
 * @param videoId YouTube video Id (unique string at the end of the YouTube URL).
 * @returns Readable stream.
 */
export function getStream(videoId: string): Readable {
    log(`Downloading stream from video ID: "${videoId}"`, LogLevel.Info);
    const stream = createYoutubeReadableStream(`https://www.youtube.com/watch?v=${videoId}`);
    log("Stream downloaded successfully", LogLevel.Info);

    stream.on("error", (error) => {
        log(`yt-dlp log: Downloaded stream error: ${error.message.trim()}`, LogLevel.Debug);
    });

    return stream;
}

/**
 * Creates YouTube video readable stream using yt-dlp CLI tool in a separate process.
 * @param videoUrl Full YouTube video URL.
 * @returns Readable stream.
 */
function createYoutubeReadableStream(videoUrl: string): Readable {
    const youtubeDlPath = getBinaryPath("yt-dlp.exe");
    const youtubeDlProcess = spawn(youtubeDlPath, [
        videoUrl,
        "--format", "bestaudio",
        "-o", "-", // Output to stdout
    ]);

    youtubeDlProcess.stderr.on("data", (data) => {
        log(`yt-dlp log: ${data.toString().trim()}`, LogLevel.Debug);
    });
  
    youtubeDlProcess.on("close", (code) => {
        log(`yt-dlp log: yt-dlp process exited with code ${code}`, LogLevel.Debug);
    });
  
    return youtubeDlProcess.stdout;
}
