import { opus as Opus, FFmpeg } from "prism-media";
import { Readable } from "stream";
import { log, LogLevel } from "./logger";

/** Available stream audio filters. */
export enum AudioFilter {
    /** Transforms audio into nightcore. */
    Nightcore,
    /** Distorts the audio. */
    Earrape,
    /** Plays audio from different directions. */
    Audio8D,
    /** Adds single delay chorus effect to the audio. */
    Chorus,
    /** Adds double delay chorus effect to the audio. */
    Chorus2d,
    /** Adds triple delay chorus effect to the audio. */
    Chorus3d,
}

/** Available radio stations. */
export enum RadioStation {
    PowerHitRadio,
    M1,
}

export interface TranscodeOptions {
    filters?: AudioFilter[];
    startAtSeconds?: number;
    endAtSeconds?: number;
    volume?: number;
}

const AUDIO_FILTER_IMPLEMENTATIONS: Record<AudioFilter, string> = {
    [AudioFilter.Nightcore]: "atempo=1.06,asetrate=48000*1.25",
    [AudioFilter.Earrape]: "channelsplit,sidechaingate=level_in=64",
    [AudioFilter.Audio8D]: "apulsator=hz=0.09",
    [AudioFilter.Chorus]: "chorus=0.7:0.9:55:0.4:0.25:2",
    [AudioFilter.Chorus2d]: "chorus=0.6:0.9:50|60:0.4|0.32:0.25|0.4:2|1.3",
    [AudioFilter.Chorus3d]: "chorus=0.5:0.9:50|60|40:0.4|0.32|0.3:0.25|0.4|0.3:2|2.3|1.3",
};

const DEFAULT_FFMPEG_ARGS = [
    "-analyzeduration", "0",
    "-loglevel", "0",
    "-f", "s16le",
    "-ar", "48000",
    "-ac", "2",
];

export function transcodeToOpus(stream: Readable, options: TranscodeOptions): Readable {
    const transcoderArgs = [...DEFAULT_FFMPEG_ARGS];

    if (options.filters && options.filters.length > 0) {
        const filterString = options.filters.map(x => AUDIO_FILTER_IMPLEMENTATIONS[x]).join(",");
        log(`Adding filter string to FFMPEG args: ${filterString}`, LogLevel.Info);
        transcoderArgs.push("-af", filterString);
    }

    if (options.startAtSeconds && options.startAtSeconds > 0) {
        const timeString = convertSecondsToTimeString(options.startAtSeconds);
        log(`Seeking to ${timeString} (${options.startAtSeconds} seconds).`, LogLevel.Info);
        transcoderArgs.push("-ss", timeString);
    }
    
    if (options.endAtSeconds && options.endAtSeconds > 0) {
        const timeString = convertSecondsToTimeString(options.endAtSeconds);
        log(`Seeking to ${timeString} (${options.startAtSeconds} seconds).`, LogLevel.Info);
        transcoderArgs.push("-to", timeString);
    }

    if (options.volume && options.volume > 0 && options.volume != 100) {
        const convertedVolume = (options.volume / 100).toPrecision(3);
        log(`Converting volume to ${convertedVolume}`, LogLevel.Info);
        transcoderArgs.push("-af", `volume=${convertedVolume}`);
    }

    const transcoder = new FFmpeg({ args: transcoderArgs });
    const outputFfmpeg = stream.pipe(transcoder);
    
    const opusEncoder = getOpusEncoder();
    const outputStream = outputFfmpeg.pipe(opusEncoder);

    const cleanTranscoderResources = () => {
        if (!transcoder.destroyed)
            transcoder.destroy();
        if (!opusEncoder.destroyed)
            opusEncoder.destroy();
        if (!stream.destroyed)
            stream.destroy();
    }

    outputStream.on("close", cleanTranscoderResources);
    outputStream.on("error", cleanTranscoderResources);

    return outputStream;
}

/**
 * Converts number of seconds to HH:MM:SS format.
 * @param seconds Number of seconds.
 * @returns Converted string.
 */
function convertSecondsToTimeString(seconds: number): string {
    const date = new Date(0);
    date.setSeconds(seconds);
    return date.toISOString().substring(11, 19);
}

/**
 * Creates Opus encoder object with predefined options.
 * @returns New Opus encoder object.
 */
function getOpusEncoder(): Opus.Encoder {
    return new Opus.Encoder({
        rate: 48000,
        channels: 2,
        frameSize: 960,
    });
}

/** Class for transcoding audio streams. */
export class Transcoder {

    /** Implementations of audio filters as FFmpeg transcoder parameters. */
    private static _availableAudioFilters: Record<AudioFilter, string> = {
        [AudioFilter.Nightcore]: "atempo=1.06,asetrate=48000*1.25",
        [AudioFilter.Earrape]: "channelsplit,sidechaingate=level_in=64",
        [AudioFilter.Audio8D]: "apulsator=hz=0.09",
        [AudioFilter.Chorus]: "chorus=0.7:0.9:55:0.4:0.25:2",
        [AudioFilter.Chorus2d]: "chorus=0.6:0.9:50|60:0.4|0.32:0.25|0.4:2|1.3",
        [AudioFilter.Chorus3d]: "chorus=0.5:0.9:50|60|40:0.4|0.32|0.3:0.25|0.4|0.3:2|2.3|1.3",
    };

    /** Available radio station urls. */
    private static _availableRadioStations: Record<RadioStation, string> = {
        [RadioStation.PowerHitRadio]: "https://powerhit.ls.lv/PHR_AAC",
        [RadioStation.M1]: "https://stream.m-1.fm/m1/aacp64",
    };

    /** Default args for FFmpeg transcoder. */
    private static _defaultFFmpegArgs = [
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
    public transcodeToOpus(stream: Readable, filters?: AudioFilter[], startAtSeconds?: number, volume?: number): Readable {
        const transcoderArgs = [...Transcoder._defaultFFmpegArgs];
        if (filters && filters.length > 0) {
            const filterString = filters.map(x => Transcoder._availableAudioFilters[x]).join(",");
            transcoderArgs.push("-af", filterString);
            log(`Added filter string: ${filterString}`, LogLevel.Info);
        }

        if (startAtSeconds && startAtSeconds > 0) {
            const timeString = this.convertSecondsToTimeString(startAtSeconds);
            transcoderArgs.push("-ss", timeString);
            log(`Seeking to ${timeString} (${startAtSeconds} seconds).`, LogLevel.Info);
            // transcoderArgs.push("-to", this.convertSecondsToTimeString(18)); // Doesn't work
        }

        if (volume && volume > 0 && volume != 100) {
            const convertedVolume = (volume / 100).toPrecision(3);
            transcoderArgs.push("-af", `volume=${convertedVolume}`);
            log(`Converting volume to ${convertedVolume}`, LogLevel.Info);
        }

        const transcoder = new FFmpeg({ args: transcoderArgs });
        const outputFfmpeg = stream.pipe(transcoder);
        
        const opusEncoder = this.getOpusEncoder();
        const outputStream = outputFfmpeg.pipe(opusEncoder);

        const cleanTranscoderResources = () => {
            if (!transcoder.destroyed)
                transcoder.destroy();
            if (!opusEncoder.destroyed)
                opusEncoder.destroy();
            if (!stream.destroyed)
                stream.destroy();
        }

        outputStream.on("close", cleanTranscoderResources);
        outputStream.on("error", cleanTranscoderResources);

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

    public getOpusVideoStream(url: string): Readable {
        const transcoder = new FFmpeg({
            args: ["-i", "D:\\Source\\discord-music-bot\\local\\pantheon-zama.mp4", ...Transcoder._defaultFFmpegArgs, "-ss", "00:00:00"],
        });

        const opusEncoder = this.getOpusEncoder();
        log(JSON.stringify(opusEncoder), LogLevel.Info);

        const outputStream = transcoder.pipe(opusEncoder);
        log(JSON.stringify(outputStream), LogLevel.Info);
        outputStream.on("close", () => {
            log("video close stream", LogLevel.Info);
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
