import { Readable } from "stream";
import { spawn } from "child_process";
import { dirname } from "path";
import { Logger } from "./logger";

function createYoutubeReadableStream(videoUrl: string): Readable {
    const rootDirectory = dirname(require.main?.filename ?? "");
    const youtubeDlPath = rootDirectory + "bin/yt-dlp.exe";

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

export function getStream(videoId: string): Readable {
    Logger.logInfo(`Downloading stream from video ID: "${videoId}"`);
    const stream = createYoutubeReadableStream(`https://www.youtube.com/watch?v=${videoId}`);

    stream.on("error", (error) => {
        Logger.logDebug(`yt-dlp log: Downloaded stream error: ${error.message.trim()}`);
    });
    
    Logger.logInfo("Stream downloaded successfully");

    return stream;
}

export class StreamDownloader {
    private static readonly _videoPrefix: string = "https://www.youtube.com/watch?v=";


    public static createYoutubeReadableStream(videoUrl: string): Readable {
        if (!videoUrl) {
          throw new Error("A video URL must be provided.");
        }
      
        


        // Path to youtube-dl.exe
        const youtubeDlPath = "F:\\source\\discord-music-bot\\bin\\yt-dlp.exe"; // Replace with the actual path to youtube-dl.exe
      
        // Spawn youtube-dl.exe process
        const youtubeDlProcess = spawn(youtubeDlPath, [
          videoUrl,
          "--format", "bestaudio",
          "--sponsorblock-remove", "all",
          "-o", "-",
        ]);

        youtubeDlProcess.stderr.on("data", (data) => {
            Logger.logDebug(`yt-dlp log: ${data.toString().trim()}`);
        });
      
        youtubeDlProcess.on("close", (code) => {
          if (code !== 0) {
            Logger.logDebug(`yt-dlp log: yt-dlp process exited with code ${code}`);
          }
        });
      
        // Return the stdout stream as a readable stream
        return youtubeDlProcess.stdout;
      }

    public static async getStream(videoId: string): Promise<Readable> {
        Logger.logInfo(`Downloading stream from video ID: "${videoId}"`);
        
        // const agent = ytdl.createAgent(JSON.parse(fs.readFileSync("cookies.json").toString()));

        const stream = this.createYoutubeReadableStream(this._videoPrefix + videoId);

        // const stream = spawn("E:\\ytdl\\yt-dlp.exe -o - ", { encoding: "utf-8" });  // the default is "buffer"
        // Logger.logError("Output was:" + output);

        Logger.logInfo("ASASASAS1");
        Logger.logError("ASASASAS2");
        // const stream2 = await play.stream(this._videoPrefix + videoId);
        // Logger.logInfo(stream2.type);

        // const stream = stream2.stream;

        // const stream = ytdl(this._videoPrefix + videoId, {
        //     ...this._downloadOptions,
        //     agent: agent,
        // });
        
        stream.on("error", err => {
            console.log("YTDL Got an Stream Error:\n", String(err))
            // Retry to play the song by creating another stream
          })

        Logger.logInfo(`Stream downloaded successfully`);
        return stream;
    }
}
