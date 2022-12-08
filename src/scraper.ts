import axios from "axios";

export interface ThumbnailData {
    url: string;
    height: number;
    width: number;
}

export interface ChannelData {
    id: string;
    name: string;
}

export interface SongMetadata {
    artist: string;
    song: string;
    album: string;
    writers: string;
}

export interface VideoData {
    id: string;
    title: string;
    description: string;
    lengthSeconds: number;
    thumbnail: ThumbnailData;
    viewCount: number;
    channel: ChannelData;
    live: boolean;
    tags: string[];
    songMetadata?: SongMetadata;
}

export class ExtendedDataScraper {
    private static _videoUrlPrefix = "https://www.youtube.com/watch?v=";

    private static _initialDataPrefix = "var ytInitialData = ";
    private static _initialDataPostfix = ";</script>";
    private static _playerDataPrefix = "var ytInitialPlayerResponse = ";
    private static _playerDataPostfix = ";</script>";

    public static async getVideoData(videoId: string): Promise<VideoData> {
        const result = await axios.get<string>(this._videoUrlPrefix + videoId, { headers: { "accept-language": "en-GB" } });
        const data = result.data;

        const initialDataString = data
            .split(this._initialDataPrefix)[1]
            .split(this._initialDataPostfix)[0];
        const playerDataString = data
            .split(this._playerDataPrefix)[1]
            .split(this._playerDataPostfix)[0];

        const initialData = JSON.parse(initialDataString);
        const playerData = JSON.parse(playerDataString);

        const videoDetails = playerData.videoDetails;

        return {
            id: videoDetails.videoId,
            title: videoDetails.title,
            description: videoDetails.shortDescription,
            lengthSeconds: parseInt(videoDetails.lengthSeconds, 10),
            thumbnail: {
                url: videoDetails.thumbnail.thumbnails.at(-1).url,
                height: videoDetails.thumbnail.thumbnails.at(-1).height,
                width: videoDetails.thumbnail.thumbnails.at(-1).width,
            },
            viewCount: parseInt(videoDetails.viewCount, 10),
            channel: {
                name: videoDetails.author,
                id: videoDetails.channelId,
            },
            live: videoDetails.isLiveContent,
            tags: videoDetails.keywords,
            songMetadata: this.getSongMetadata(initialData),
        };
    }

    /**
     * Scrapes song metadata section if it exists.
     * @param initialData Parsed initial data object.
     * @returns Song metadata if it was found.
     */
    /* eslint-disable @typescript-eslint/no-explicit-any */
    private static getSongMetadata(initialData: any): SongMetadata {
        const metadata = initialData.engagementPanels[1].engagementPanelSectionListRenderer.content.structuredDescriptionContentRenderer
            .items[2]?.videoDescriptionMusicSectionRenderer.carouselLockups[0].carouselLockupRenderer.infoRows;

        const artist = metadata?.find((item: any) => item.infoRowRenderer?.title.simpleText.toLowerCase() == "artist");
        const song = metadata?.find((item: any) => item.infoRowRenderer?.title.simpleText.toLowerCase() == "song");
        const album = metadata?.find((item: any) => item.infoRowRenderer?.title.simpleText.toLowerCase() == "album");
        const writers = metadata?.find((item: any) => item.infoRowRenderer?.title.simpleText.toLowerCase() == "writers");

        const simpleTextParser = (x: any) => x?.infoRowRenderer.defaultMetadata.simpleText;
        const runsTextParser = (x: any) => x?.infoRowRenderer.defaultMetadata.runs[0].text;

        return {
            artist: simpleTextParser(artist) ?? runsTextParser(artist),
            song: simpleTextParser(song) ?? runsTextParser(song),
            album: simpleTextParser(album) ?? runsTextParser(album),
            writers: simpleTextParser(writers) ?? runsTextParser(writers),
        };
    }
    /* eslint-enable @typescript-eslint/no-explicit-any */
}
