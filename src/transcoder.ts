import { opus as Opus, FFmpeg } from "prism-media";
import { Readable } from "stream";
import { Logger } from "./logger";

/** Available stream audio filters. */
export enum AudioFilter {
    Nightcore,
    Earrape,
    Audio8D,
}

/** Available radio stations. */
export enum RadioStation {
    PowerHitRadio,
    M1,
}

/** Class for transcoding audio streams. */
export class Transcoder {
    
    /** Implementation of audio filters as FFmpeg transcoder parameters. */
    private static _availableAudioFilters: { [filter in AudioFilter]: string } = {
        [AudioFilter.Nightcore]: "atempo=1.06,asetrate=48000*1.25",
        [AudioFilter.Earrape]: "channelsplit,sidechaingate=level_in=64",
        [AudioFilter.Audio8D]: "apulsator=hz=0.09",
    };

    /** Available radio station urls. */
    private static _availableRadioStations: { [station in RadioStation]: string } = {
        [RadioStation.PowerHitRadio]: "https://powerhit.ls.lv/PHR_AAC",
        [RadioStation.M1]: "https://stream.m-1.fm/m1/aacp64",
    };

    /** Default args for FFmpeg transcoder. */
    private static _defaultFFmpegArgs: string[] = [
        "-analyzeduration", "0",
        "-loglevel", "0",
        "-f", "s16le",
        "-ar", "48000",
        "-ac", "2",
    ];

    /**
     * Transcodes stream to Opus and applies additional options.
     * @param stream Stream to be transcoded.
     * @param filters Audio filters to be applied to stream.
     * @param startAtSeconds Stream starting point defined in seconds. Defaults to 0 seconds.
     * @returns Transcoded stream.
     */
    public transcodeToOpus(stream: Readable, filters?: AudioFilter[], startAtSeconds?: number): Readable {
        const transcoderArgs = [...Transcoder._defaultFFmpegArgs];
        if (filters) {
            const filterString = filters.map(x => Transcoder._availableAudioFilters[x]).join(",");
            transcoderArgs.push("-af", filterString);
            Logger.logInfo(`Added filter string: ${filterString}`);
        }

        if (startAtSeconds) {
            const timeString = this.convertSecondsToTimeString(startAtSeconds);
            transcoderArgs.push("-ss", timeString);
            Logger.logInfo(`Seeking to ${timeString} (${startAtSeconds} seconds).`);
        }

        const transcoder = new FFmpeg({ args: transcoderArgs });
        const outputFfmpeg = stream.pipe(transcoder);

        const opusEncoder = this.getOpusEncoder();
        const outputStream = outputFfmpeg.pipe(opusEncoder);
        outputStream.on("close", () => {
            transcoder.destroy();
            opusEncoder.destroy();
        });

        return outputStream;
    }

    /**
     * Gets radio station stream and transcodes it to Opus.
     * @param radioStation Radio station.
     * @returns Radio station stream transcoded to Opus.
     */
    public getOpusRadioStream(radioStation: RadioStation): Readable {
        const radioUrl = Transcoder._availableRadioStations[radioStation];
        const transcoder = new FFmpeg({
            args: ["-i", radioUrl, ...Transcoder._defaultFFmpegArgs, "-ss", "00:00:00"],
        });

        const opusEncoder = this.getOpusEncoder();
        const outputStream = transcoder.pipe(opusEncoder);
        outputStream.on("close", () => {
            transcoder.destroy();
            opusEncoder.destroy();
        });

        return outputStream;
    }

    /**
     * Converts number of seconds to HH:MM:SS format.
     * @param seconds Number of seconds.
     * @returns Converted string.
     */
    private convertSecondsToTimeString(seconds: number): string {
        const date = new Date(0);
        date.setSeconds(seconds);
        return date.toISOString().substring(11, 19);
    }

    /**
     * Creates Opus encoder object with predefined options.
     * @returns New Opus encoder object.
     */
    private getOpusEncoder(): Opus.Encoder {
        return new Opus.Encoder({
            rate: 48000,
            channels: 2,
            frameSize: 960,
        });
    }
}
