# Discord music bot
Discord bot for playing YouTube songs.

## Requirements

- [Discord bot application](https://discordjs.guide/preparations/setting-up-a-bot-application.html#creating-your-bot)
- [Node.js](https://nodejs.org/en) - `22.13.1` or higher
- [FFmpeg](https://www.ffmpeg.org/)

## Setup the environment
All required environment variables must be set in `.env` file. Example `.env.example` file can be copied with all the required values and their explanations:
```cmd
copy .env.example .env
```

## Generate invite URL
To add the bot to the server, it must be invited. To do that follow these steps:
1. Navigate to your [Discord applications](https://discord.com/developers/applications) and select your bot
2. Go to `Settings` -> `OAuth2` tab
3. Scroll down to `OAuth2 URL Generator` and select `bot` scope
4. Select these permissions:
    * General Permissions:
        * View Channels
    * Text Permissions:
        * Send Messages
        * Use Slash Commands
    * Voice Permissions:
        * Connect
        * Speak
5. Select `Guild Install` integration type
6. Open the generated link
7. Select the server to add the bot to and finish the dialog

## Build and run
To build and run the application follow these steps:
1. Install dependencies: `npm install`
2. Build the application: `npm run build`
3. Register commands to your server: `npm run register`
    > Note: this only needs to be ran once for each Discord server
4. Download `yt-dlp.exe` for song downloading: `npm run download`
5. Run the bot: `npm run start`

## Additional info
* To remove the registered commands from the Discord server run `npm run unregister`
* Logs are displayed in console and stored in `%AppData%/DiscordMusicBot/music-bot-server.log`
* To add local songs, they must be stored in `local` folder and manually added to `playcustom` command data map
