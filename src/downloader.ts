import { YouTube as YoutubeSearch } from "youtube-sr";
import ytdl from "ytdl-core";
import { Logger } from "./logger";

export interface SearchData {
    id: string;
    title: string;
    durationInSeconds: number;
    formattedDuration: string;
    thumbnailUrl: string;
}

export class YoutubeSearcher {
    public static async search(query: string): Promise<SearchData> {
        const videoData = this.isUrl(query) 
            ? await YoutubeSearch.getVideo(query) 
            : await YoutubeSearch.searchOne(query);

        Logger.logInfo(`Found searched video data: id="${videoData.id}" title="${videoData.title}"`);

        return {
            id: videoData.id!,
            title: videoData.title!,
            durationInSeconds: videoData.duration,
            formattedDuration: videoData.durationFormatted,
            thumbnailUrl: videoData.thumbnail!.displayThumbnailURL(),
        };
    }

    private static isUrl(query: string): boolean {
        return ytdl.validateURL(query);
    }
}
