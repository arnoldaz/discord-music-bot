import { StageChannel, VoiceChannel } from "discord.js";
import {
    AudioPlayer,
    AudioPlayerError,
    AudioPlayerState,
    AudioPlayerStatus,
    createAudioPlayer,
    createAudioResource,
    DiscordGatewayAdapterCreator,
    entersState,
    joinVoiceChannel,
    StreamType,
    VoiceConnection,
    VoiceConnectionStatus,
} from "@discordjs/voice";
import { log, LogLevel } from "./logger";
import { AudioFilter, transcodeToOpus, getOpusStream, TranscodeOptions } from "./transcoder";
import { Readable } from "stream";
import { search } from "./search";
import { getStream } from "./downloader";
import { Seconds, Timer } from "./timer";

/** Supported player audio types. */
export enum AudioType {
    Song,
    CustomAudio,
}

/** Supported player audio types combined interface. */
export type AudioData = SongData | CustomAudioData;

/**
 * Interface describing stored {@link Player} song data.
 */
export interface SongData {
    type: AudioType.Song;
    videoId: string;
    title: string;
    duration: Seconds;
    thumbnailUrl: string;
    transcodeOptions: TranscodeOptions;
}

/**
 * Interface describing stored {@link Player} radio station data.
 */
export interface CustomAudioData {
    type: AudioType.CustomAudio;
    url: string;
    title: string;
    duration: Seconds;
    transcodeOptions: TranscodeOptions;
}

/**
 * Interface describing {@link Player.play} method results.
 */
 export interface PlayQueryResult {
    videoId: string;
    isPlayingNow: boolean;
    title: string;
    duration: Seconds;
    thumbnailUrl: string;
}

/**
 * Class for playing audio and managing voice channel audio player connection.
 */
export class Player {
    private _isConnected = false;
    private _isPaused = false;
    private _connectedChannel?: VoiceChannel | StageChannel;
    private _connection?: VoiceConnection;
    private _audioPlayer?: AudioPlayer;

    private _isPlaying = false;
    private _nowPlaying?: AudioData;
    private _queue: AudioData[] = [];

    private _timer = new Timer();

    /** Gets whether the player is connected to voice channel. */
    public get isConnected(): boolean {
        return this._isConnected;
    }

    /** Gets whether the player is paused. */
    public get isPaused(): boolean {
        return this._isPaused;
    }

    /** Gets currently playing audio data. */
    public get currentlyPlaying(): AudioData | undefined {
        if (!this._isPlaying)
            return undefined;

        return this._nowPlaying;
    }

    /** Gets current song queue. */
    public get queue(): AudioData[] {
        return this._queue;
    }

    /** Gets timer for the currently playing song. */
    public get currentTimer(): Seconds | undefined {
        if (!this._isPlaying)
            return undefined;
        
        return this._timer.getTime();
    }

    /**
     * Creates audio player and connects to voice channel.
     * @param voiceChannel Voice channel to connect to.
     */
    public async connect(voiceChannel: VoiceChannel | StageChannel): Promise<void> {
        if (this._isConnected && this._connectedChannel?.id == voiceChannel.id) {
            log(`Player is already connected to voice channel '${voiceChannel.name}' and is trying to connect again`, LogLevel.Info);
            return;
        }

        if (!this._audioPlayer) {
            log("Creating audio player", LogLevel.Info);
            this._audioPlayer = this.createAudioPlayer();
            log("Created audio player", LogLevel.Info);
        }

        this._connection = await this.joinChannel(voiceChannel);
        this._connection.subscribe(this._audioPlayer);
        this._isConnected = true;
        this._connectedChannel = voiceChannel;
    }

    /** Destroys audio player voice channel connection. */
    public disconnect(): void {
        if (!this._isConnected) {
            log("Player is not connected while trying to disconnect", LogLevel.Info);
            return;
        }

        this._connection?.destroy();
        this._connection = undefined;
        this._isConnected = false;
        this._connectedChannel = undefined;
    }

    /**
     * Plays or queues song to audio player based on the YouTube search query.
     * @param query Song search query or direct YouTube url.
     * @param filters List of filters to be applied to audio.
     * @param forcePlayNext Whether to force play song as the next in queue.
     * @returns A {@link PlayResult} object containing played or queued song information.
     */
    public async playQuery(query: string, filters?: AudioFilter[], forcePlayNext?: boolean, volume?: number): Promise<PlayQueryResult[]> {
        const searchData = await search(query);
        const shouldPlayNow = !this._isPlaying;

        const playResults: PlayQueryResult[] = [];
        let firstVideoIsPlaying = false;

        for (const singleVideoData of searchData) {
            const songData: SongData = {
                type: AudioType.Song,
                videoId: singleVideoData.id,
                title: singleVideoData.title,
                duration: singleVideoData.duration,
                thumbnailUrl: singleVideoData.thumbnailUrl,
                transcodeOptions: {
                    filters,
                    startAtSeconds: singleVideoData.blockedSegmentData.startSegmentEndTime ?? -1,
                    endAtSeconds: singleVideoData.blockedSegmentData.endSegmentStartTime ?? -1,
                    volume,
                },
            };

            if (shouldPlayNow && !firstVideoIsPlaying) {
                firstVideoIsPlaying = true;
                await this.playNow(songData);
            }
            else {
                this.addToQueue(songData, forcePlayNext);
            }

            playResults.push({
                videoId: songData.videoId,
                isPlayingNow: shouldPlayNow,
                title: songData.title,
                duration: songData.duration,
                thumbnailUrl: songData.thumbnailUrl,
            });
        }

        return playResults;
    }

    public async playCustom(url: string, title: string, duration: number, forcePlayNext?: boolean, volume?: number): Promise<boolean> {
        const customAudioData: CustomAudioData = { type: AudioType.CustomAudio, url, title, duration, transcodeOptions: { volume } };
        const playNow = !this._isPlaying;

        if (playNow)
            await this.playNow(customAudioData);
        else
            this.addToQueue(customAudioData, forcePlayNext);

        return playNow;
    }

    /** Skips currently playing song. */
    public skip(): void {
        this._isPaused = false;
        this._audioPlayer?.stop(true);
    }

    /** Pauses currently playing song. */
    public pause(): void {
        if (this._isPaused)
            return;

        this._isPaused = true;
        this._audioPlayer?.pause();
        this._timer.pause();
    }
    
    /** Resumes previously paused song. */
    public resume(): void {
        if (!this._isPaused)
            return;
        
        this._isPaused = false;
        this._audioPlayer?.unpause();
        this._timer.resume();
    }

    /**
     * Seeks currently playing song to specified location.
     * @param seconds Seconds from song starting point to seek to.
     * @returns False if nothing is currently playing, true otherwise.
     */
    public async seek(seconds: number): Promise<boolean> {
        if (!this._isPlaying || !this._nowPlaying) {
            log("Nothing is currently playing to seek", LogLevel.Error);
            return false;
        }

        // Ends current song
        this._isPlaying = false;
        this._timer.end();

        // Restarts song from a new starting point.
        this._nowPlaying.transcodeOptions.startAtSeconds = seconds;
        await this.playNow(this._nowPlaying);
        this._timer.set(seconds);

        return true;
    }

    /** Shuffles current song queue. */
    public shuffleQueue(): void {
        this._queue.sort(() => Math.random() - 0.5);
    }

    /** Clears current song queue. */
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

    public getCurrentlyPlayingEndTime(): Seconds | undefined {
        if (!this._isPlaying || !this._nowPlaying)
            return undefined;

        const currentPlayingTime = this.currentTimer ?? 0;
        const currentPlayingTotalTime = this._nowPlaying.duration;

        return currentPlayingTotalTime - currentPlayingTime;
    }

    public getQueueEndTime(): Seconds | undefined {
        if (!this._isPlaying || !this._nowPlaying)
            return undefined;

        const currentPlayingTime = this.currentTimer ?? 0;
        const currentPlayingTotalTime = this._nowPlaying.duration;

        const queueTotalTime = this._queue.reduce((totalTime, queueSong) => totalTime + queueSong.duration, 0);

        return queueTotalTime + (currentPlayingTotalTime - currentPlayingTime);
    }

    /**
     * Force-plays song on audio player.
     * {@link Player.connect} must be called beforehand to initialize audio player and setup connection.
     * @param audioData Song data to be played.
     * @param startAtSeconds Start audio stream at specified starting point in seconds.
     */
    private async playNow(audioData: AudioData): Promise<void> {
        let stream: Readable;
        switch (audioData.type) {
            case AudioType.Song:
                stream = transcodeToOpus(getStream(audioData.videoId), audioData.transcodeOptions);
                break
            case AudioType.CustomAudio:
                stream = getOpusStream(audioData.url);
                break
            default:
                log("Trying to play unknown audio type", LogLevel.Error);
                return;
        }

        if (!this._audioPlayer) {
            log("Trying to play song when audio player is not yet created", LogLevel.Error);
            return;
        }

        const resource = createAudioResource(stream, { inputType: StreamType.Opus })
        this._audioPlayer.play(resource);
        this._nowPlaying = audioData;
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
     * @returns TODO
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
        log(`Joining voice channel: ${channel.name}`, LogLevel.Info);

        let connection = joinVoiceChannel({
            guildId: channel.guild.id,
            channelId: channel.id,
            adapterCreator: channel.guild.voiceAdapterCreator as DiscordGatewayAdapterCreator,
        });

        try {
            connection = await entersState(connection, VoiceConnectionStatus.Ready, 20000);
        } catch (error) {
            log(`Joining voice channel failed: ${error}`, LogLevel.Error);
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
            if (oldState.status == AudioPlayerStatus.Buffering)
                log("Buffering failed and audio player reset back to idle", LogLevel.Error);

            log("Audio player is idle", LogLevel.Info);
            this._isPlaying = false;
            this._timer.end();
            this.skip();

            const nextSong = this.getNextSong();
            if (nextSong)
                await this.playNow(nextSong);
        });

        audioPlayer.on(AudioPlayerStatus.Playing, () => {
            this._isPlaying = true;
            this._timer.start();
            log("Audio player has started playing", LogLevel.Info);
        });

        audioPlayer.on("error", (error: AudioPlayerError) => {
            log(`Error occured on audio player: "${error.message}" from resource "${JSON.stringify(error.resource.metadata)}"`, LogLevel.Error);
        });
        
        audioPlayer.on(AudioPlayerStatus.AutoPaused, () => {
            log("Audio player is auto paused", LogLevel.Debug);
        });

        audioPlayer.on(AudioPlayerStatus.Buffering, () => {
            log("Audio player is buffering", LogLevel.Debug);
        });

        audioPlayer.on(AudioPlayerStatus.Paused, () => {
            log("Audio player has been paused", LogLevel.Info);
        });
        
        return audioPlayer;
    }
}
