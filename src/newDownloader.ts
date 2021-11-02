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
    songMetadata: SongMetadata;
}

export class RealDownlaoder {
    private static _videoUrl = "https://www.youtube.com/watch?v=";

    public static async getVideoData(videoId: string): Promise<VideoData> {
        const result = await axios.get(this._videoUrl + videoId, { headers: { "accept-language": "en-GB" } });
        const data = result.data as string;

        const initialDataString = data.split("var ytInitialData = ")[1].split(";</script>")[0];
        const playerDataString = data.split("var ytInitialPlayerResponse = ")[1].split(";</script>")[0];

        const initialData = JSON.parse(initialDataString);
        const playerData = JSON.parse(playerDataString);

        const videoDetails = playerData.videoDetails;
        const metadata =
            initialData.contents.twoColumnWatchNextResults.results.results.contents[1].videoSecondaryInfoRenderer
                .metadataRowContainer.metadataRowContainerRenderer.rows;

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
            songMetadata: {
                /* eslint-disable @typescript-eslint/no-explicit-any */
                artist: metadata.find((item: any) => item.metadataRowRenderer?.title.simpleText == "Artist")
                    ?.metadataRowRenderer.contents[0].runs[0].text,
                song: metadata.find((item: any) => item.metadataRowRenderer?.title.simpleText == "Song")
                    ?.metadataRowRenderer.contents[0].runs[0].text,
                album: metadata.find((item: any) => item.metadataRowRenderer?.title.simpleText == "Album")
                    ?.metadataRowRenderer.contents[0].simpleText,
                writers: metadata.find((item: any) => item.metadataRowRenderer?.title.simpleText == "Writers")
                    ?.metadataRowRenderer.contents[0].simpleText,
                /* eslint-enable @typescript-eslint/no-explicit-any */
            },
        };
    }
}
