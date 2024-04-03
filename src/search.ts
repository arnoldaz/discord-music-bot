import { Video, YouTube as YoutubeSearch } from "youtube-sr";
import { Category, ResponseError, Segment, SponsorBlock } from "sponsorblock-api";
import { Logger } from "./logger";

export interface SearchData {
    id: string;
    title: string;
    durationInSeconds: number;
    formattedDuration: string;
    thumbnailUrl: string;
    blockedSegmentData: BlockedSegmentData;
}

export interface BlockedSegmentData {
    startSegmentEndTime: number;
    endSegmentStartTime: number;
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

    /** List of all Sponsor Block categories. */
    private static readonly allCategories: Category[] = ["sponsor", "intro", "outro", "interaction", "selfpromo", "music_offtopic", "preview"];
    /** Maximum deviation in seconds for Sponsor Block segments, since user submitted segments are not precise. */
    private static readonly maxDeviation = 2;
    /** Singleton Sponsor Block instance. */
    private static sponsorBlockInstance: SponsorBlock;

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
     * Get start and end blocked segment timings from SponsorBlock API.
     * @param videoId YouTube video ID.
     * @param videoDurationInSeconds Video duration in seconds.
     * @returns Start and end blocked segment data.
     */
    private static async getBlockedSegments(videoId: string, videoDurationInSeconds: number): Promise<BlockedSegmentData> {
        if (!this.sponsorBlockInstance)
            this.sponsorBlockInstance = new SponsorBlock(process.env.SPONSOR_BLOCK_USER_ID ?? "");

        let segments: Segment[] = [];
        try {
            segments = await this.sponsorBlockInstance.getSegments(videoId, this.allCategories);
        }
        catch (error: unknown) {
            if (error instanceof ResponseError && error.status == 404)
                Logger.logInfo(`No SponsorBlock segments found for video: ${videoId}`);
            else
                Logger.logError(`SponsorBlock threw an error: ${error}`);
        }

        const startSegment = segments.find(segment => segment.startTime < this.maxDeviation);
        const endSegment = segments.find(segment => segment.endTime > videoDurationInSeconds - this.maxDeviation);

        Logger.logInfo(`SponsorBlock segments: start at "${JSON.stringify(startSegment)}", end at "${JSON.stringify(endSegment)}"`);

        return {
            startSegmentEndTime: startSegment?.endTime ?? 0,
            endSegmentStartTime: endSegment?.startTime ?? videoDurationInSeconds,
        };
    }

    /**
     * Searches YouTube with a query or direct URL to get relevant video data.
     * @param query Query string or URL.
     * @returns List of all search data if playlist, list with single video search data otherwise.
     */
    public static async search(query: string): Promise<SearchData[]> {
        const allVideoData = await this.getAllVideoData(query);

        return await Promise.all(allVideoData.map(async videoData => {
            return {
                id: videoData.id!,
                title: videoData.title!,
                durationInSeconds: videoData.duration / 1000,
                formattedDuration: videoData.durationFormatted,
                thumbnailUrl: videoData.thumbnail!.displayThumbnailURL(),
                blockedSegmentData: await this.getBlockedSegments(videoData.id!, videoData.duration / 1000),
            };
        }));
    }
}
