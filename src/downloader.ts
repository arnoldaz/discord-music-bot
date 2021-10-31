import { Readable } from "stream";
import { YouTube } from "youtube-sr";
import ytdl from "ytdl-core";
import { Logger } from "./logger";
import { IDownloader, Song } from "./types";

export class YoutubeDownloader implements IDownloader {
    private readonly _videoPrefix: string = "https://www.youtube.com/watch?v=";
    private readonly _downloadOptions: ytdl.downloadOptions = {
        quality: "highestaudio",
        filter: "audioonly",
        dlChunkSize: 0,
        highWaterMark: 1 << 25,
    };

    public async download(query: string): Promise<Song> {
        const videoData = await this.getVideoData(query);
        Logger.logInfo(`Got video data: ${JSON.stringify(videoData)}`);

        return {
            title: videoData.title,
            formattedDuration: videoData.formattedDuration,
            id: videoData.id,
        };
    }

    public async getStream(videoId: string): Promise<Readable> {
        Logger.logInfo("Downloading stream...");

        return ytdl(`${this._videoPrefix}${videoId}`, {
            ...this._downloadOptions,
            requestOptions: {
                headers: {
                    cookie: process.env.YOUTUBE_COOKIE,
                },
            },
        });
    }

    private async getVideoData(query: string): Promise<Song> {
        const videoData = this.isUrl(query) ? await YouTube.getVideo(query) : await YouTube.searchOne(query);

        if (!videoData || !videoData.id || !videoData.title) throw `Incomplete video data: ${videoData}`;

        return {
            id: videoData.id,
            title: videoData.title,
            formattedDuration: videoData.durationFormatted,
        };
    }

    private isUrl(query: string): boolean {
        return ytdl.validateURL(query);
    }
}
