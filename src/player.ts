import { StageChannel, VoiceChannel } from "discord.js";
import {
    AudioPlayer,
    AudioPlayerError,
    AudioPlayerState,
    AudioPlayerStatus,
    AudioResource,
    createAudioPlayer,
    createAudioResource,
    DiscordGatewayAdapterCreator,
    entersState,
    joinVoiceChannel,
    StreamType,
    VoiceConnection,
    VoiceConnectionStatus,
} from "@discordjs/voice";
import { Logger } from "./logger";
import { AudioFilter, RadioStation, Transcoder } from "./transcoder";
import { Readable } from "stream";
import { ExtendedDataScraper } from "./scraper";
import { LyricsScraper } from "./lyrics";
import { YoutubeSearcher } from "./search";
import { StreamDownloader } from "./downloader";
import { Seconds, Timer } from "./utils/timer";

/** Supported player audio types. */
export enum AudioType {
    Song,
    Radio,
}

/** Supported player audio types combined interface. */
export type AudioData = SongData | RadioData;

/**
 * Interface describing stored {@link Player} song data.
 */
export interface SongData {
    type: AudioType.Song;
    videoId: string;
    title: string;
    durationInSeconds: number;
    formattedDuration: string;
    thumbnailUrl: string;
    filters?: AudioFilter[];
}

/**
 * Interface describing stored {@link Player} radio station data.
 */
export interface RadioData {
    type: AudioType.Radio;
    title: string;
    radioStation: RadioStation;
    filters?: AudioFilter[];
}

/**
 * Interface describing {@link Player.play} method results.
 */
 export interface PlayResult {
    videoId: string;
    isPlayingNow: boolean;
    title: string;
    durationInSeconds: number;
    formattedDuration: string;
    thumbnailUrl: string;
}

/**
 * Class for playing audio and managing voice channel audio player connection.
 */
export class Player {
    private _isConnected = false;
    private _connectedChannel?: VoiceChannel | StageChannel;
    private _connection?: VoiceConnection;
    private _audioPlayer?: AudioPlayer;

    private _isPlaying = false;
    private _nowPlaying?: AudioData;
    private _queue: AudioData[] = [];

    private _timer = new Timer();

    private static _radioStationNames: { [station in RadioStation]: string } = {
        [RadioStation.PowerHitRadio]: "Power Hit Radio",
        [RadioStation.M1]: "M-1",
    };

    public constructor(private _transcoder: Transcoder) {}

    /**
     * Gets dictionary of radio station display names.
     */
    public static get radioStationNames(): { [station in RadioStation]: string } {
        return this._radioStationNames;
    }

    /** 
     * Whether player is connected to voice channel.
     */
    public get isConnected(): boolean {
        return this._isConnected;
    }

    /**
     * Gets currently playing song data.
     * Returns undefined if nothing is playing.
     */
    public get currentlyPlaying(): AudioData | undefined {
        if (!this._isPlaying) 
            return undefined;

        return this._nowPlaying;
    }

    /**
     * Gets current song queue.
     */
    public get queue(): AudioData[] {
        return this._queue;
    }

    public get currentTimer(): Seconds | undefined {
        if (!this._isPlaying)
            return undefined;
        
        return this._timer.getTime();
    }

    public getQueueEndTime(): Seconds | undefined {
        if (!this._isPlaying || !this._nowPlaying)
            return undefined;

        if (this._nowPlaying.type == AudioType.Radio)
            return undefined;

        const currentPlayingTime = this.currentTimer!;
        const currentPlayingTotalTime = this._nowPlaying.durationInSeconds;

        // Logger.logInfo(JSON.stringify(this._nowPlaying));

        const queueTotalTime = this._queue.reduce((previousValue, currentValue) => {
            const realCurrentValue = currentValue.type == AudioType.Song
                ? currentValue.durationInSeconds
                : Infinity;
            
            return previousValue + realCurrentValue;
        }, 0);

        return queueTotalTime + (currentPlayingTotalTime - currentPlayingTime);
    }

    /**
     * Creates audio player and connects to voice channel.
     * @param voiceChannel Voice channel to connect to.
     */
    public async connect(voiceChannel: VoiceChannel | StageChannel): Promise<void> {
        if (this._isConnected && this._connectedChannel?.id == voiceChannel.id) {
            Logger.logInfo(`Player is already connected to voice channel "${voiceChannel.name}".`);
            return;
        }

        if (!this._audioPlayer) {
            Logger.logInfo("Creating audio player.");
            this._audioPlayer = this.createAudioPlayer();
        }

        this._connection = await this.joinChannel(voiceChannel);
        this._connection.subscribe(this._audioPlayer);
        this._isConnected = true;
        this._connectedChannel = voiceChannel;
    }

    /**
     * Destroys audio player voice channel connection.
     */
    public disconnect(): void {
        if (!this._isConnected) {
            Logger.logInfo("Player is not connected.");
            return;
        }

        this._connection?.destroy();
        this._connection = undefined;
        this._isConnected = false;
        this._connectedChannel = undefined;
    }

    /**
     * Plays or queues song to audio player.
     * @param query Song search query or direct url.
     * @param filters List of filters to be applied to audio.
     * @param forcePlayNext Whether to force play song as the next in queue.
     * @returns A {@link PlayResult} object containing played or queued song information.
     */
    public async play(query: string, filters?: AudioFilter[], forcePlayNext?: boolean): Promise<PlayResult[]> {
        const searchData = await YoutubeSearcher.search(query);
        const playNow = !this._isPlaying;
        const playResults: PlayResult[] = [];
        let firstVideoIsPlaying = false;

        for (const singleVideoData of searchData) {
            const songData: SongData = {
                type: AudioType.Song,
                videoId: singleVideoData.id,
                title: singleVideoData.title,
                durationInSeconds: singleVideoData.durationInSeconds,
                formattedDuration: singleVideoData.formattedDuration,
                thumbnailUrl: singleVideoData.thumbnailUrl,
                filters,
            };

            if (playNow && !firstVideoIsPlaying) {
                firstVideoIsPlaying = true;
                await this.playNow(songData, singleVideoData.blockedSegmentData.startSegmentEndTime);
            }
            else {
                this.addToQueue(songData, forcePlayNext === true);
            }

            playResults.push({
                videoId: songData.videoId,
                isPlayingNow: playNow,
                title: songData.title,
                durationInSeconds: songData.durationInSeconds,
                formattedDuration: singleVideoData.formattedDuration,
                thumbnailUrl: songData.thumbnailUrl,
            });
        }

        return playResults;
    }

    /**
     * Force-plays song on audio player.
     * {@link Player.connect} must be called beforehand to initialize audio player and setup connection.
     * @param audioData Song data to be played.
     * @param startAtSeconds Start audio stream at specified starting point in seconds.
     */
    private async playNow(audioData: AudioData, startAtSeconds = 0): Promise<void> {
        const transcodedStream = audioData.type == AudioType.Radio
            ? this._transcoder.getOpusRadioStream(audioData.radioStation)
            : this._transcoder.transcodeToOpus(await StreamDownloader.getStream(audioData.videoId), audioData.filters, startAtSeconds);

        const resource = this.createOpusAudioResource(transcodedStream);
        this._audioPlayer!.play(resource);
        this._nowPlaying = audioData;
    }

    /**
     * Skips currently playing song.
     */
    public skip(): void {
        this._audioPlayer?.stop(true);
    }

    /**
     * Pauses currently playing song.
     */
    public pause(): void {
        this._audioPlayer?.pause();
    }

    /**
     * Resumes previously paused song.
     */
    public resume(): void {
        this._audioPlayer?.unpause();
    }

    /**
     * Seeks currently playing song to specified location.
     * @param seconds Seconds from song starting point to seek to.
     * @returns False if nothing is currently playing, true otherwise.
     */
    public async seek(seconds: number): Promise<boolean> {
        if (!this._isPlaying) {
            Logger.logError("Nothing is currently playing to seek.");
            return false;
        }

        // Ends current song
        this._isPlaying = false;
        this._timer.endTimer();
        
        // Restarts song from a new starting point.
        await this.playNow(this._nowPlaying!, seconds);
        return true;
    }

    /**
     * Shuffles current song queue.
     */
    public shuffleQueue(): void {
        this._queue.sort(() => Math.random() - 0.5);
    }

    /**
     * Clears current song queue.
     */
    public clearQueue(): void {
        while (this._queue.length > 0)
            this._queue.pop();
    }

    /**
     * Removes song from the queue.
     * @param index Index of the song in the queue to be removed.
     * @returns Removed audio data if it was successfully removed, undefined otherwise.
     */
    public removeSong(index: number): AudioData | undefined {
        if (this._queue.length < index) 
            return undefined;

        return this._queue.splice(index - 1, 1)[0];
    }

    /**
     * Plays or queues radio station to audio player.
     * @param radioStation Radio station to play or queue.
     */
    public async playRadio(radioStation: RadioStation): Promise<void> {
        const playNow = !this._isPlaying;
        const radioData: RadioData = {
            type: AudioType.Radio,
            title: Player._radioStationNames[radioStation],
            radioStation,
        };

        if (playNow)
            await this.playNow(radioData);
        else
            this.addToQueue(radioData);
    }

    /**
     * Gets lyrics of currently playing song if they are available.
     * @returns Lyrics as a string if they are available, undefined otherwise.
     */
    public async getLyrics(): Promise<string | undefined> {
        if (!this._isPlaying || !this._nowPlaying || this._nowPlaying.type == AudioType.Radio)
            return undefined;

        const extendedData = await ExtendedDataScraper.getVideoData(this._nowPlaying.videoId);
        Logger.logInfo(`Extended data found for "${this._nowPlaying.title}": ${JSON.stringify(extendedData.songMetadata)}`);

        const lyrics = await LyricsScraper.getLyrics(
            this._nowPlaying.title,
            extendedData.songMetadata?.artist,
            extendedData.songMetadata?.song
        );
        Logger.logInfo(`Lyrics are ${lyrics ? `"${lyrics.substring(0, 30)}"` : "not found"}`);

        return lyrics;
    }

    /**
     * Adds audio to queue.
     * @param audioData Audio data to queue.
     * @param addToStart Whether to add audio to start or the end of the queue.
     */
    private addToQueue(audioData: AudioData, addToStart = false): void {
        if (addToStart)
            this._queue.unshift(audioData);
        else 
            this._queue.push(audioData);
    }

    /**
     * Gets next song in the queue
     * @returns 
     */
    private getNextSong(): AudioData | undefined {
        if (this._queue.length == 0)
            return undefined;

        return this._queue.shift();
    }

    /**
     * Creates voice connection to voice channel.
     * @param channel Voice channel to connect to.
     * @returns Created voice connection.
     */
    private async joinChannel(channel: VoiceChannel | StageChannel): Promise<VoiceConnection> {
        Logger.logInfo(`Joining voice channel: ${channel.name}`);

        let connection = joinVoiceChannel({
            guildId: channel.guild.id,
            channelId: channel.id,
            adapterCreator: channel.guild.voiceAdapterCreator as DiscordGatewayAdapterCreator,
        });

        try {
            connection = await entersState(connection, VoiceConnectionStatus.Ready, 20000);
        } catch (error) {
            Logger.logError(`Joining voice channel failed: ${error}`);
            connection.destroy();
        }

        return connection;
    }

    /**
     * Creates audio player with predefined state listeners.
     * @returns Created audio player.
     */
    private createAudioPlayer(): AudioPlayer {
        const audioPlayer = createAudioPlayer();

        audioPlayer.on(AudioPlayerStatus.Idle, async (oldState: AudioPlayerState) => {
            if (oldState.status == AudioPlayerStatus.Buffering) {
                Logger.logError("Buffering failed and audio player reset back to idle.");
            }

            Logger.logInfo("Audio player is idle.");
            this._isPlaying = false;
            this._timer.endTimer();
            this.skip();

            const nextSong = this.getNextSong();
            if (nextSong)
                await this.playNow(nextSong);
        });

        audioPlayer.on(AudioPlayerStatus.Playing, () => {
            Logger.logInfo("Audio player has started playing.");
            this._isPlaying = true;
            this._timer.startTimer();
        });

        audioPlayer.on("error", (error: AudioPlayerError) => {
            Logger.logError(`Error occured on audio player: "${error.message}" from resource "${JSON.stringify(error.resource.metadata)}"`);
        });
        
        return audioPlayer;
    }

    /**
     * Creates audio resource with Opus input type.
     * @param stream Readable Opus audio stream to create audio resource from.
     * @returns Created audio resource.
     */
    private createOpusAudioResource(stream: Readable): AudioResource<null> {
        return createAudioResource(stream, { inputType: StreamType.Opus });
    }
}
