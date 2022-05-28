import { opus as Opus, FFmpeg } from "prism-media";
import { Readable } from "stream";
import { Logger } from "./logger";

export enum AudioFilter {
    Nightcore,
    Earrape,
    Audio8D,
}

export enum RadioStation {
    PowerHitRadio,
    M1,
}

export class Transcoder {
    private static _availableFilters: { [filter in AudioFilter]: string } = {
        [AudioFilter.Nightcore]: "atempo=1.06,asetrate=48000*1.25",
        [AudioFilter.Earrape]: "channelsplit,sidechaingate=level_in=64",
        [AudioFilter.Audio8D]: "apulsator=hz=0.09",
    };

    private static _defaultFFmpegArgs: string[] = [
        "-analyzeduration", "0",
        "-loglevel", "0",
        "-f", "s16le",
        "-ar", "48000",
        "-ac", "2",
    ];

    public cutOut(stream: Readable): Readable {
        // const transcoder = new FFmpeg({
        //     args: ["-ss", "00:01:25", "-i", "pipe:", ...Transcoder._defaultFFmpegArgs, "-to", "00:01:30"],
        // });
        const transcoder = new FFmpeg({
            args: [...Transcoder._defaultFFmpegArgs, "-ss", "02:01:25"],
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

    private convertSecondsToTimeString(seconds: number): string {
        const date = new Date(0);
        date.setSeconds(seconds);
        return date.toISOString().substring(11, 19);
    }

    public applyFilters(stream: Readable, filters: AudioFilter[] | undefined, startAtSeconds?: number): Readable {
        const filterString = filters?.map(x => Transcoder._availableFilters[x]).join(",");
        Logger.logInfo(`filterString: ${filterString}`);

        const transcoderArgs = [...Transcoder._defaultFFmpegArgs];
        if (filterString)
            transcoderArgs.push("-af", filterString);

        if (startAtSeconds) {
            const timeString = this.convertSecondsToTimeString(startAtSeconds);
            Logger.logInfo(`Seeking to ${timeString} seconds.`);
            transcoderArgs.push("-ss", timeString);
        }

        Logger.logInfo(transcoderArgs.join(" "));

        const transcoder = new FFmpeg({ args: transcoderArgs });

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
