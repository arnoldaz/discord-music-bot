
import { Readable } from "stream";
import { YouTube } from "youtube-sr";
import ytdl from "ytdl-core";
import { Logger } from "./logger";
import { DownloadData, IDownloader } from "./types";

interface ISearchResults {
    id: string;
    title: string;
    formattedDuration: string;
}

export class YoutubeDownloader implements IDownloader {
    private readonly _videoPrefix: string = "https://www.youtube.com/watch?v=";
    private readonly _downloadOptions: ytdl.downloadOptions = {
        quality: "highestaudio",
        filter: "audioonly",
        dlChunkSize: 0,
    };

    public async download(query: string): Promise<DownloadData> {
        const videoData = await this.getVideoData(query);
        Logger.log(`Got video data: ${JSON.stringify(videoData)}`);

        return {
            title: videoData.title,
            formattedDuration: videoData.formattedDuration,
            data: await this.getStream(videoData.id),
        };
    }

    private async getVideoData(query: string): Promise<ISearchResults> {
        const videoData = this.isUrl(query)
            ? await YouTube.getVideo(query)
            : await YouTube.searchOne(query); 
        
        if (!videoData || !videoData.id || !videoData.title)
            throw `Incomplete video data: ${videoData}`;

        return {
            id: videoData.id,
            title: videoData.title,
            formattedDuration: videoData.durationFormatted,
        };
    }

    private isUrl(query: string): boolean {
        return ytdl.validateURL(query);
    }

    private async getStream(videoId: string): Promise<Readable> {
        Logger.log("Downloading stream...");
        return ytdl(`${this._videoPrefix}${videoId}`, this._downloadOptions);
    }
}