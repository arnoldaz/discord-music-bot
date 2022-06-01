import { Readable } from "stream";
import ytdl from "ytdl-core";
import { Logger } from "./logger";

export class StreamDownloader {
    private static readonly _videoPrefix: string = "https://www.youtube.com/watch?v=";
    private static readonly _downloadOptions: ytdl.downloadOptions = {
        quality: "highestaudio",
        filter: "audioonly",
        dlChunkSize: 0,
        highWaterMark: 1 << 25,
    };

    public static async getStream(videoId: string): Promise<Readable> {
        Logger.logInfo(`Downloading stream from video ID: "${videoId}"`);

        return ytdl(this._videoPrefix + videoId, {
            ...this._downloadOptions,
            requestOptions: {
                headers: { cookie: process.env.YOUTUBE_COOKIE },
            },
        });
    }
}
