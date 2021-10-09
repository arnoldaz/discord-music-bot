import { StageChannel, VoiceChannel } from "discord.js";
import { 
    AudioPlayer,
    AudioPlayerStatus,
    createAudioPlayer,
    createAudioResource,
    entersState,
    joinVoiceChannel,
    VoiceConnection,
    VoiceConnectionStatus,
} from "@discordjs/voice";
import { Logger } from "./logger";
import { DownloadData, IDownloader } from "./types";

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
    private _nowPlaying!: DownloadData;
    private _queue: DownloadData[] = [];

    public constructor(private _downloader: IDownloader) { }

    public async connect(voiceChannel: VoiceChannel | StageChannel): Promise<void> {
        if (this._isConnected) {
            Logger.logError(`Player is already connected to voice channel "${voiceChannel.name}""`);
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
    }

    public async play(voiceChannel: VoiceChannel | StageChannel, query: string): Promise<PlayData> {
        if (!this._isConnected)
            await this.connect(voiceChannel);

        const downloadData = await this._downloader.download(query);
        const playNow = !this._isPlaying;

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

    public getCurrentlyPlaying(): DownloadData | null {
        if (!this._isPlaying)
            return null;

        return this._nowPlaying;
    }

    public getQueue(): DownloadData[] {
        return this._queue;
    }

    public shuffleQueue(): void {
        this._queue.sort(() => Math.random() - 0.5);
    }

    public clearQueue(): void {
        this._queue.forEach(x => x.data.destroy());
        this._queue = [];
    }

    public removeSong(index: number): boolean {
        if (this._queue.length < index)
            return false;

        this._queue[index - 1].data.destroy();
        this._queue.splice(index - 1, 1);
        return true;
    }

    private playNow(downloadData: DownloadData) {
        const resource = createAudioResource(downloadData.data);
        this._audioPlayer.play(resource);

        Logger.logInfo("Audio player is playing.");
        this._isPlaying = true;
        this._nowPlaying = downloadData;
    }

    private addToQueue(downloadData: DownloadData) {
        this._queue.push(downloadData);
    }

    private getNextSong(): DownloadData | null {
        if (this._queue.length == 0)
            return null;

        return this._queue.shift()!;
    }

    private async joinChannel(channel: VoiceChannel | StageChannel): Promise<void> {
        Logger.logInfo(`Joining voice channel: ${channel.name}`);

        const connection = joinVoiceChannel({
            guildId: channel.guild.id,
            channelId: channel.id,
            adapterCreator: channel.guild.voiceAdapterCreator
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