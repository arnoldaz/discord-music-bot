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


/** Regex that matches direct playlist link. */
const playlistRegex = /^https?:\/\/(www.)?youtube.com\/playlist\?list=((PL|FL|UU|LL|RD|OL)[a-zA-Z0-9-_]*)$/;
/** Regex that matches video link in a playlist. */
const playlistVideoRegex = /^((?:https?:)?\/\/)?((?:www|m)\.)?((?:youtube\.com|youtu.be))(\/(?:[\w-]+\?v=|embed\/|v\/)?)([\w-]+)[?&]list=((PL|FL|UU|LL|RD|OL)[a-zA-Z0-9-_]*)(&index=[0-9])+$/;
/** Regex that matches video link. */
const videoRegex = /^((?:https?:)?\/\/)?((?:www|m)\.)?((?:youtube\.com|youtu.be))(\/(?:[\w-]+\?v=|embed\/|v\/)?)([\w-]+)(\S+)?$/;

/** List of all Sponsor Block categories. */
const allCategories: Category[] = ["sponsor", "intro", "outro", "interaction", "selfpromo", "music_offtopic", "preview"];
/** Maximum deviation in seconds for Sponsor Block segments, since user submitted segments are not precise. */
const maxDeviation = 2;
/** Singleton Sponsor Block instance. */
const sponsorBlockInstance = new SponsorBlock(process.env.SPONSOR_BLOCK_USER_ID ?? "")

/**
 * Checks whether given URL is direct YouTube playlist link or YouTube video in a playlist.
 * @param url URL to check.
 * @returns True if URL is YouTube playlist, false otherwise.
 */
function isUrlPlaylist(url: string): boolean {
    return playlistRegex.test(url) || playlistVideoRegex.test(url);
}

/**
 * Checks whether given URL is normal YouTube video link.
 * @param url URL to check.
 * @returns True if URL is YouTube video link, false otherwise.
 */
function isUrlVideo(url: string): boolean {
    return videoRegex.test(url);
}

/**
 * Queries all video data from playlist, video or query to search for a video.
 * @param query Query string or URL.
 * @returns List of all videos if playlist, list with single video otherwise.
 */
async function getAllVideoData(query: string): Promise<Video[]> {
    if (isUrlPlaylist(query)) {
        try {
            return (await YoutubeSearch.getPlaylist(query, { limit: 50 })).videos;
        } 
        catch (error: unknown) {
            // youtube-sr does not support all types of playlists and some URLs that pass regex might fail.
            // In this case do not return anything and allow to handle it further.
            Logger.logError(`youtube-sr failed to download playlist using URL '${query}', continuing with other options...`);
            Logger.logError(`youtube-sr error: ${error}`);
        }
    }

    if (isUrlVideo(query))
        return [await YoutubeSearch.getVideo(query)];

    return [await YoutubeSearch.searchOne(query)];
}

/**
 * Get start and end blocked segment timings from SponsorBlock API.
 * @param videoId YouTube video ID.
 * @param videoDurationInSeconds Video duration in seconds.
 * @returns Start and end blocked segment data.
 */
async function getBlockedSegments(videoId: string, videoDurationInSeconds: number): Promise<BlockedSegmentData> {
    let segments: Segment[] = [];
    try {
        segments = await sponsorBlockInstance.getSegments(videoId, allCategories);
    }
    catch (error: unknown) {
        if (error instanceof ResponseError && error.status == 404)
            Logger.logInfo(`No SponsorBlock segments found for video: ${videoId}`);
        else
            Logger.logError(`SponsorBlock threw an error: ${error}`);
    }

    const startSegment = segments.find(segment => segment.startTime < maxDeviation);
    const endSegment = segments.find(segment => segment.endTime > videoDurationInSeconds - maxDeviation);

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
export async function search(query: string): Promise<SearchData[]> {
    const allVideoData = await getAllVideoData(query);

    return await Promise.all(allVideoData.map(async videoData => {
        return {
            id: videoData.id ?? "",
            title: videoData.title ?? "",
            durationInSeconds: videoData.duration / 1000,
            formattedDuration: videoData.durationFormatted,
            thumbnailUrl: videoData.thumbnail?.displayThumbnailURL() ?? "",
            blockedSegmentData: await getBlockedSegments(videoData.id!, videoData.duration / 1000),
        };
    }));
}
