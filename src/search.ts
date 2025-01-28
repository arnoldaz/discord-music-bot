import { Video, YouTube as YoutubeSearch } from "youtube-sr";
import { Category, ResponseError, Segment, SponsorBlock } from "sponsorblock-api";
import { log, LogLevel } from "./logger";
import { Seconds } from "./timer";

export interface SearchData {
    id: string;
    title: string;
    duration: Seconds;
    thumbnailUrl: string;
    blockedSegmentData: BlockedSegmentData;
}

export interface BlockedSegmentData {
    startSegmentEndTime?: Seconds;
    endSegmentStartTime?: Seconds;
}

/**
 * Searches YouTube with a query or direct URL to get relevant video data.
 * @param query Query string or URL.
 * @returns List of all search data if playlist, list with single video search data otherwise.
 */
export async function search(query: string): Promise<SearchData[]> {
    log(`Searching for query '${query}'`, LogLevel.Info);
    const allVideoData = await getAllVideoData(query);

    return await Promise.all(allVideoData.map(async videoData => {
        return {
            id: videoData.id ?? "",
            title: videoData.title ?? "",
            duration: videoData.duration / 1000,
            thumbnailUrl: videoData.thumbnail?.displayThumbnailURL() ?? "",
            blockedSegmentData: await getBlockedSegments(videoData.id, videoData.duration / 1000),
        };
    }));
}

/** Regex that matches direct playlist link. */
const playlistRegex = /^https?:\/\/(www.)?youtube.com\/playlist\?list=((PL|FL|UU|LL|RD|OL)[a-zA-Z0-9-_]*)$/;
/** Regex that matches video link in a playlist. */
const playlistVideoRegex = /^((?:https?:)?\/\/)?((?:www|m)\.)?((?:youtube\.com|youtu.be))(\/(?:[\w-]+\?v=|embed\/|v\/)?)([\w-]+)[?&]list=((PL|FL|UU|LL|RD|OL)[a-zA-Z0-9-_]*)(&index=[0-9])+$/;
/** Regex that matches video link. */
const videoRegex = /^((?:https?:)?\/\/)?((?:www|m)\.)?((?:youtube\.com|youtu.be))(\/(?:[\w-]+\?v=|embed\/|v\/)?)([\w-]+)(\S+)?$/;

/** List of all Sponsor Block categories to block. */
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
        log("Given query is detected to be a playlist", LogLevel.Info);
        try {
            return (await YoutubeSearch.getPlaylist(query, { limit: 100 })).videos;
        }
        catch (error: unknown) {
            // youtube-sr does not support all types of playlists and some URLs that pass regex might fail.
            // In this case do not return anything and allow to handle it further.
            log(`youtube-sr failed to download playlist using URL '${query}', continuing with other options...`, LogLevel.Error);
            log(`youtube-sr error: ${error}`, LogLevel.Error);
        }
    }

    if (isUrlVideo(query)) {
        log("Given query is detected to be a single video", LogLevel.Info);
        return [await YoutubeSearch.getVideo(query)];
    }

    log("Given query is detected to be a custom query", LogLevel.Info);
    return [await YoutubeSearch.searchOne(query)];
}

/**
 * Get start and end blocked segment timings from SponsorBlock API.
 * @param videoId YouTube video ID.
 * @param videoDurationInSeconds Video duration in seconds.
 * @returns Start and end blocked segment data.
 */
async function getBlockedSegments(videoId?: string, videoDurationInSeconds?: number): Promise<BlockedSegmentData> {
    if (!videoId || !videoDurationInSeconds) {
        log(`Impossible to get blocked segments for video: ${videoId} (${videoDurationInSeconds})`, LogLevel.Error);
        return {};
    }

    let segments: Segment[] = [];
    try {
        segments = await sponsorBlockInstance.getSegments(videoId, allCategories);
    }
    catch (error: unknown) {
        if (error instanceof ResponseError && error.status == 404)
            log(`No SponsorBlock segments found for video: ${videoId}`, LogLevel.Debug);
        else
            log(`SponsorBlock threw an error: ${error}`, LogLevel.Error);
    }

    const startSegment = segments.find(segment => segment.startTime < maxDeviation);
    const endSegment = segments.find(segment => segment.endTime > videoDurationInSeconds - maxDeviation);

    log(`SponsorBlock segments: start at "${JSON.stringify(startSegment)}", end at "${JSON.stringify(endSegment)}"`, LogLevel.Debug);

    return {
        startSegmentEndTime: startSegment?.endTime ?? 0,
        endSegmentStartTime: endSegment?.startTime ?? videoDurationInSeconds,
    };
}

