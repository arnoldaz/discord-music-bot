import axios from "axios";

export class LyricsScraper {
    private static _searchUrl = "https://www.google.com/search?q=";
    private static _htmlEntitiesRegex = /&#(\d+);/gi;
    private static _htmlLocation = {
        start: '</div></div></div></div><div class="hwc"><div class="BNeawe tAd8D AP7Wnd"><div><div class="BNeawe tAd8D AP7Wnd">',
        end: '</div></div></div></div></div><div><span class="hwc"><div class="BNeawe uEec3 AP7Wnd">',
    };

    public static async getLyrics(title: string, artist?: string, song?: string): Promise<string | undefined> {
        const url =  this._searchUrl + encodeURIComponent(this.getSearchQuery(title, artist, song));

        const result = await axios.get(url, { responseType: "arraybuffer", headers: { "accept-language": "en-GB" } });
        const htmlText = result.data.toString("latin1") as string;

        const lyricsText = htmlText.split(this._htmlLocation.start)[1]?.split(this._htmlLocation.end)[0];
        if (!lyricsText) 
            return undefined;

        const decodedLyrics = lyricsText
            .split("\n")
            .map(line => line.replace(this._htmlEntitiesRegex, (_, x) => String.fromCharCode(parseInt(x, 10))))
            .join("\n");

        return decodedLyrics;
    }

    private static getSearchQuery(title: string, artist?: string, song?: string): string {
        const removeParentheses = (input: string) => input.replace(/ *[({[][^)]*[)}\]] */g, "").trim();

        if (artist && song)
            return `${artist} ${removeParentheses(song)} lyrics`;

        return `${removeParentheses(title)} lyrics`;
    }
}
