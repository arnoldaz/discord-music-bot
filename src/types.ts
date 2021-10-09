import { Readable } from "stream";

export interface DownloadData {
    title: string;
    formattedDuration: string;
    data: Readable;
}

export interface IDownloader {
    download(query: string): Promise<DownloadData>;
}

