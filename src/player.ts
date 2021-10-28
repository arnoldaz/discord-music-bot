import { StageChannel, VoiceChannel } from "discord.js";
import { 
    AudioPlayer,
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
import { Logger } from "./logger";
import { IDownloader, Song } from "./types";
import { AudioFilter, Transcoder } from "./transcoder";

export interface PlayData {
    playingNow: boolean;
    title: string;
    formattedDuration: string;
}

export class Player {
    private _isConnected: boolean = false;
    private _connection!: VoiceConnection;
    private _audioPlayer!: AudioPlayer;

    private _isPlaying: boolean = false;
    private _nowPlaying!: Song;
    private _queue: Song[] = [];

    public constructor(private _downloader: IDownloader, private _transcoder: Transcoder) { }

    public async connect(voiceChannel: VoiceChannel | StageChannel): Promise<void> {
        if (this._isConnected) {
            Logger.logError(`Player is already connected to voice channel "${voiceChannel.name}".`);
            return;
        }

        await this.joinChannel(voiceChannel);
        this.createAudioPlayer();
        this._connection.subscribe(this._audioPlayer);
        this._isConnected = true;
    }

    public disconnect(): void {
        if (!this._isConnected) {
            Logger.logError("Player is not connected.");
            return;
        }

        this._connection.destroy();
        this._isConnected = false;
    }

    public async play(voiceChannel: VoiceChannel | StageChannel, query: string, modifications: AudioFilter[] = []): Promise<PlayData> {
        if (!this._isConnected)
            await this.connect(voiceChannel);

        const downloadData = await this._downloader.download(query);
        downloadData.filters = modifications;
        const playNow = !this._isPlaying;

        Logger.logInfo(`Play now: ${playNow}`);

        if (playNow)
            this.playNow(downloadData);
        else 
            this.addToQueue(downloadData);

        return {
            playingNow: playNow,
            title: downloadData.title,
            formattedDuration: downloadData.formattedDuration,
        };
    }

    public skip(): void {
        this._audioPlayer.stop();
    }

    public pause(): void {
        this._audioPlayer.pause();
    }

    public resume(): void {
        this._audioPlayer.unpause();
    }

    public getCurrentlyPlaying(): Song | null {
        if (!this._isPlaying)
            return null;

        return this._nowPlaying;
    }

    public getQueue(): Song[] {
        return this._queue;
    }

    public shuffleQueue(): void {
        this._queue.sort(() => Math.random() - 0.5);
    }

    public clearQueue(): void {
        this._queue = [];
    }

    public removeSong(index: number): boolean {
        if (this._queue.length < index)
            return false;

        this._queue.splice(index - 1, 1);
        return true;
    }

    private async playNow(downloadData: Song): Promise<void> {
        const rawStream = await this._downloader.getStream(downloadData.id);
        const stream = downloadData.filters
            ? this._transcoder.applyFilters(rawStream, ...downloadData.filters)
            : rawStream;
        const resource = createAudioResource(stream, { inputType: StreamType.Opus });
        this._audioPlayer.play(resource);

        Logger.logInfo("Audio player is playing.");
        this._isPlaying = true;
        this._nowPlaying = downloadData;
    }

    private addToQueue(downloadData: Song): void {
        this._queue.push(downloadData);
    }

    private getNextSong(): Song | null {
        if (this._queue.length == 0)
            return null;

        return this._queue.shift()!;
    }

    private async joinChannel(channel: VoiceChannel | StageChannel): Promise<void> {
        Logger.logInfo(`Joining voice channel: ${channel.name}`);

        const connection = joinVoiceChannel({
            guildId: channel.guild.id,
            channelId: channel.id,
            adapterCreator: channel.guild.voiceAdapterCreator as DiscordGatewayAdapterCreator
        });

        try {
            this._connection = await entersState(connection, VoiceConnectionStatus.Ready, 20000);
        } catch (error) {
            Logger.logInfo(`Joining voice channel failed: ${error}`);
            connection.destroy();
        }
    }

    private createAudioPlayer(): void {
        this._audioPlayer = createAudioPlayer();

        this._audioPlayer.on(AudioPlayerStatus.Idle, () => {
            Logger.logInfo("Audio player is idle.");
            this._isPlaying = false;

            const nextSong = this.getNextSong();
            if (nextSong)
                this.playNow(nextSong);
        });
    }
}