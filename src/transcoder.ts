import { opus as Opus, FFmpeg } from "prism-media";
import { Readable } from "stream";
import { Logger } from "./logger";

export enum AudioFilter {
    Nightcore,
    Earrape,
    Audio8D,
}

export class Transcoder {
    private static _availableFilters: { [filter in AudioFilter]: string } = {
        [AudioFilter.Nightcore]: "atempo=1.06,asetrate=48000*1.25",
        [AudioFilter.Earrape]: "channelsplit,sidechaingate=level_in=64",
        [AudioFilter.Audio8D]: "apulsator=hz=0.09",
    };

    /* eslint-disable prettier/prettier */
    private static _defaultFFmpegArgs: string[] = [
        "-analyzeduration", "0",
        "-loglevel", "0",
        "-f", "s16le",
        "-ar", "48000",
        "-ac", "2",
    ];
    /* eslint-enable prettier/prettier */

    public applyFilters(stream: Readable, ...filters: AudioFilter[]): Readable {
        const filterString = filters.map(x => Transcoder._availableFilters[x]).join(",");
        Logger.logInfo(`filterString: ${filterString}`);

        const transcoder = new FFmpeg({
            args: filterString
                ? Transcoder._defaultFFmpegArgs.concat("-af", filterString)
                : Transcoder._defaultFFmpegArgs,
        });

        const outputFfmpeg = stream.pipe(transcoder);

        const opus = new Opus.Encoder({
            rate: 48000,
            channels: 2,
            frameSize: 960,
        });

        const outputStream = outputFfmpeg.pipe(opus);
        outputStream.on("close", () => {
            transcoder.destroy();
            opus.destroy();
        });

        return outputStream;
    }

    public getRadioStream(url: string): Readable {
        const transcoder = new FFmpeg({
            args: ["-i", url, ...Transcoder._defaultFFmpegArgs, "-ss", "00:00:00"],
        });

        const opus = new Opus.Encoder({
            rate: 48000,
            channels: 2,
            frameSize: 960,
        });

        const outputStream = transcoder.pipe(opus);
        outputStream.on("close", () => {
            transcoder.destroy();
            opus.destroy();
        });

        return outputStream;
    }
}
