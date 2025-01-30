import { opus as Opus, FFmpeg } from "prism-media";
import { Readable } from "stream";
import { log, LogLevel } from "./logger";
import { convertToTimeString } from "./timeFormat";

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

/** Options for transcoding readable stream to Opus stream. */
export interface TranscodeOptions {
    filters?: AudioFilter[];
    startAtSeconds?: number;
    endAtSeconds?: number;
    volume?: number;
}

/**
 * Transcodes readable stream to Opus through FFmpeg and applies additional arguments based on passed options.
 * @param stream Readable stream.
 * @param options Custom transcoding options for FFmpeg
 * @returns Converted readable stream.
 */
export function transcodeToOpus(stream: Readable, options: TranscodeOptions): Readable {
    const transcoderArgs = [...DEFAULT_FFMPEG_ARGS];
    log(`Transcoder options: ${JSON.stringify(options)}`, LogLevel.Debug);

    const filterArgs: string[] = [];
    if (options.filters !== undefined && options.filters.length > 0) {
        options.filters.forEach(x => filterArgs.push(AUDIO_FILTER_IMPLEMENTATIONS[x]));
        log(`Adding filters to FFmpeg args: ${options.filters}`, LogLevel.Info);
    }

    if (options.startAtSeconds !== undefined && options.startAtSeconds > 0) {
        const timeString = convertToTimeString(options.startAtSeconds, false);
        transcoderArgs.push("-ss", timeString);
        log(`Seeking to ${timeString} (${options.startAtSeconds} seconds).`, LogLevel.Info);
    }
    
    if (options.endAtSeconds !== undefined && options.endAtSeconds > 0) {
        const timeString = convertToTimeString(options.endAtSeconds, false);
        transcoderArgs.push("-to", timeString);
        log(`Ending at ${timeString} (${options.endAtSeconds} seconds).`, LogLevel.Info);
    }

    if (options.volume !== undefined && options.volume > 0 && options.volume != 100) {
        const convertedVolume = (options.volume / 100).toPrecision(3);
        filterArgs.push(`volume=${convertedVolume}`);
        log(`Converting volume to ${convertedVolume}`, LogLevel.Info);
    }

    if (filterArgs.length > 0)
        transcoderArgs.push("-af", filterArgs.join(","));

    log(`Full FFmpeg args: ${transcoderArgs}`, LogLevel.Info);

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
        if (!outputStream.destroyed)
            outputStream.destroy();
    }

    outputStream.on("close", cleanTranscoderResources);
    outputStream.on("error", cleanTranscoderResources);

    return outputStream;
}

/**
 * Gets Opus stream from URL or local file.
 * @param url URL or full local file path.
 * @returns Stream transcoded to Opus.
 */
export function getOpusStream(url: string): Readable {
    const transcoder = new FFmpeg({
        args: ["-i", url, ...DEFAULT_FFMPEG_ARGS, "-ss", "00:00:00"],
    });

    const opusEncoder = getOpusEncoder();
    const outputStream = transcoder.pipe(opusEncoder);

    const cleanTranscoderResources = () => {
        if (!transcoder.destroyed)
            transcoder.destroy();
        if (!opusEncoder.destroyed)
            opusEncoder.destroy();
        if (!outputStream.destroyed)
            outputStream.destroy();
    }

    outputStream.on("close", cleanTranscoderResources);
    outputStream.on("error", cleanTranscoderResources);

    return outputStream;
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
