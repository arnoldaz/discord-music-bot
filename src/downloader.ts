import { Readable } from "stream";
import ytdl from "@distube/ytdl-core";
import { Logger } from "./logger";
import * as fs from "fs";
import { spawn } from 'child_process';

export class StreamDownloader {
    private static readonly _videoPrefix: string = "https://www.youtube.com/watch?v=";
    private static readonly _downloadOptions: ytdl.downloadOptions = {
        quality: "highestaudio",
        filter: "audioonly",
        dlChunkSize: 0,
        highWaterMark: 1 << 25,
    };

    public static createYoutubeReadableStream(videoUrl: string): Readable {
        if (!videoUrl) {
          throw new Error('A video URL must be provided.');
        }
      
        // Path to youtube-dl.exe
        const youtubeDlPath = "E:\\ytdl\\yt-dlp.exe"; // Replace with the actual path to youtube-dl.exe
      
        // Spawn youtube-dl.exe process
        const youtubeDlProcess = spawn(youtubeDlPath, [
          videoUrl,
          '--format', 'bestaudio', // Select the best available format
          '-o', '-',          // Output to stdout
        ]);

        youtubeDlProcess.stderr.on("data", (data) => {
            Logger.logDebug(`yt-dlp log: ${data}`);
        });
      
        youtubeDlProcess.on('close', (code) => {
          if (code !== 0) {
            console.error(`youtube-dl process exited with code ${code}`);
          }
        });
      
        // Return the stdout stream as a readable stream
        return youtubeDlProcess.stdout;
      }

    public static async getStream(videoId: string): Promise<Readable> {
        Logger.logInfo(`Downloading stream from video IDaaaa: "${videoId}"`);
        
        const agent = ytdl.createAgent(JSON.parse(fs.readFileSync("cookies.json").toString()));

        const stream = this.createYoutubeReadableStream(this._videoPrefix + videoId);

        // const stream = spawn("E:\\ytdl\\yt-dlp.exe -o - ", { encoding: 'utf-8' });  // the default is 'buffer'
        // Logger.logError('Output was:' + output);

        Logger.logInfo("ASASASAS1");
        Logger.logError("ASASASAS2");
        // const stream2 = await play.stream(this._videoPrefix + videoId);
        // Logger.logInfo(stream2.type);

        // const stream = stream2.stream;

        // const stream = ytdl(this._videoPrefix + videoId, {
        //     ...this._downloadOptions,
        //     agent: agent,
        // });
        
        stream.on('error', err => {
            console.log('YTDL Got an Stream Error:\n', String(err))
            // Retry to play the song by creating another stream
          })

        Logger.logInfo(`Stream downloaded successfully`);
        return stream;
    }
}
