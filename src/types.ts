import { Readable } from "stream";
import { AudioFilter } from "./transcoder";

export interface Song {
    id: string;
    title: string;
    formattedDuration: string;
    filters?: AudioFilter[];
}

export interface IDownloader {
    download(query: string): Promise<Song>;
    getStream(videoId: string): Promise<Readable>;
}

