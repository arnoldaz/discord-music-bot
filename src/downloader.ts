import { Readable } from "stream";
import { spawn } from "child_process";
import { dirname } from "path";
import { log, LogLevel } from "./logger";

export function getStream(videoId: string): Readable {
  Logger.logInfo(`Downloading stream from video ID: "${videoId}"`);
  const stream = createYoutubeReadableStream(`https://www.youtube.com/watch?v=${videoId}`);
  Logger.logInfo("Stream downloaded successfully");

  stream.on("error", (error) => {
      Logger.logDebug(`yt-dlp log: Downloaded stream error: ${error.message.trim()}`);
  });
  
  return stream;
}

function createYoutubeReadableStream(videoUrl: string): Readable {
    const rootDirectory = dirname(require.main?.filename ?? "");
    const youtubeDlPath = rootDirectory + "\\..\\bin\\yt-dlp.exe";

    const youtubeDlProcess = spawn(youtubeDlPath, [
        videoUrl,
        "--format", "bestaudio",
        "-o", "-", // Output to stdout
      ]);

    youtubeDlProcess.stderr.on("data", (data) => {
        Logger.logDebug(`yt-dlp log: ${data.toString().trim()}`);
    });
  
    youtubeDlProcess.on("close", (code) => {
        Logger.logDebug(`yt-dlp log: yt-dlp process exited with code ${code}`);
    });
  
    return youtubeDlProcess.stdout;
}
