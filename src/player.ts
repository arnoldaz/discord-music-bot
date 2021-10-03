import { AudioPlayer, AudioPlayerStatus, AudioResource, createAudioPlayer, createAudioResource, entersState, joinVoiceChannel, PlayerSubscription, VoiceConnection, VoiceConnectionStatus } from "@discordjs/voice";
import { StageChannel, VoiceChannel } from "discord.js";
import { Logger } from "./logger";
import { DownloadData, IDownloader } from "./types";

export interface PlayData {
    playNow: boolean;
    title: string;
    formattedDuration: string;
}

export class Player {
    public connection: VoiceConnection | undefined;
    public audioPlayer: AudioPlayer | undefined;
    public queue: DownloadData[] = [];
    public isPlaying: boolean = false;

    public constructor(private _downloader: IDownloader) {

    }

    public getNextResource(): AudioResource<null> | undefined {
        if (this.queue.length == 0)
            return undefined;

        const nextSong = this.queue.shift()!;
        return createAudioResource(nextSong.data);
    }

    public async joinChannel(channel: VoiceChannel | StageChannel): Promise<void> {
        Logger.log(`Joining voice channel: ${channel.name}`);

        const connection = joinVoiceChannel({
            guildId: channel.guild.id,
            channelId: channel.id,
            adapterCreator: channel.guild.voiceAdapterCreator
        });

        try {
            this.connection = await entersState(connection, VoiceConnectionStatus.Ready, 20000);
        } catch (error) {
            Logger.log(`Joining voice channel failed: ${error}`);
            connection.destroy();
        }
    }  

    public subscribePlayer(player: AudioPlayer): PlayerSubscription {
        if (!this.connection)
            throw "Connection is not yet created";

        const subscription = this.connection.subscribe(player);

        if (!subscription)
            throw "Player subscription failed";

        return subscription;
    }

    public disconnect(): void {
        return this.connection?.destroy();
    }


    public createAudioPlayer(): void {
        this.audioPlayer = createAudioPlayer();

        this.audioPlayer.on(AudioPlayerStatus.Playing, () => {
            Logger.log("Audio player is playing.");
            this.isPlaying = true;
        });

        this.audioPlayer.on(AudioPlayerStatus.Idle, () => {
            Logger.log("Audio player is idle.");
            this.isPlaying = false;

            const nextResource = this.getNextResource();
            if (nextResource)
                this.audioPlayer!.play(nextResource);
        });
    }

    public async play(voiceChannel: VoiceChannel | StageChannel, query: string): Promise<PlayData> {
        if (!this.connection)
            await this.joinChannel(voiceChannel);

        if (!this.audioPlayer)
            this.createAudioPlayer();

        const downloadData = await this._downloader.download(query);

        if (this.isPlaying) {
            this.queue.push(downloadData);
            return {
                playNow: false,
                title: downloadData.title,
                formattedDuration: downloadData.formattedDuration,
            };
        }

        const resource = createAudioResource(downloadData.data);
        this.audioPlayer!.play(resource);
        this.connection?.subscribe(this.audioPlayer!);
        return {
            playNow: true,
            title: downloadData.title,
            formattedDuration: downloadData.formattedDuration,
        };
    }

}