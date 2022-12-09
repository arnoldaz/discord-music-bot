import { Video, YouTube as YoutubeSearch } from "youtube-sr";
import { Logger } from "./logger";

export interface SearchData {
    id: string;
    title: string;
    durationInSeconds: number;
    formattedDuration: string;
    thumbnailUrl: string;
}

/** Wrapper for "YoutubeSearch" package to search YouTube for relevant video data. */
export class YoutubeSearcher {
    /** Regex that matches direct playlist link. */
    private static readonly playlistRegex = /^https?:\/\/(www.)?youtube.com\/playlist\?list=((PL|FL|UU|LL|RD|OL)[a-zA-Z0-9-_]*)$/;
    /** Regex that matches video link in a playlist. */
    private static readonly playlistVideoRegex = 
        /^((?:https?:)?\/\/)?((?:www|m)\.)?((?:youtube\.com|youtu.be))(\/(?:[\w-]+\?v=|embed\/|v\/)?)([\w-]+)[?&]list=((PL|FL|UU|LL|RD|OL)[a-zA-Z0-9-_]*)(&index=[0-9])+$/;
    /** Regex that matches video link. */
    private static readonly videoRegex = /^((?:https?:)?\/\/)?((?:www|m)\.)?((?:youtube\.com|youtu.be))(\/(?:[\w-]+\?v=|embed\/|v\/)?)([\w-]+)(\S+)?$/;

    /**
     * Checks whether given URL is direct YouTube playlist link or YouTube video in a playlist.
     * @param url URL to check.
     * @returns True if URL is YouTube playlist, false otherwise.
     */
    private static isUrlPlaylist(url: string): boolean {
        return this.playlistRegex.test(url) || this.playlistVideoRegex.test(url);
    }

    /**
     * Checks whether given URL is YouTube video link.
     * @param url URL to check.
     * @returns True if URL is YouTube video link, false otherwise.
     */
    private static isUrlVideo(url: string): boolean {
        return this.videoRegex.test(url);
    }

    /**
     * Queries all video data from playlist, video or query to search for a video.
     * @param query Query string or URL.
     * @returns List of all videos if playlist, list with single video otherwise.
     */
    private static async getAllVideoData(query: string): Promise<Video[]> {
        if (this.isUrlPlaylist(query)) {
            try {
                return (await YoutubeSearch.getPlaylist(query, { limit: 50 })).videos;
            } 
            catch (error: unknown) {
                // YoutubeSearch (youtube-sr) does not support all types of playlists and some URLs that pass regex might fail.
                // In this case do not return anything and allow to handle it further.
                Logger.logError(`YoutubeSearch failed to download playlist using URL: ${query}`);
            }
        }

        if (this.isUrlVideo(query))
            return [await YoutubeSearch.getVideo(query)];

        return [await YoutubeSearch.searchOne(query)];
    }

    /**
     * Searches YouTube with a query or direct URL to get relevant video data.
     * @param query Query string or URL.
     * @returns List of all search data if playlist, list with single video search data otherwise.
     */
    public static async search(query: string): Promise<SearchData[]> {
        const allVideoData = await this.getAllVideoData(query);

        return allVideoData.map(videoData => {
            return {
                id: videoData.id!,
                title: videoData.title!,
                durationInSeconds: videoData.duration / 1000,
                formattedDuration: videoData.durationFormatted,
                thumbnailUrl: videoData.thumbnail!.displayThumbnailURL(),
            };
        });
    }
}
