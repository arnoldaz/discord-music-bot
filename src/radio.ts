/** Available radio stations. */
export enum RadioStation {
    PowerHitRadio,
    M1,
}

/** Available radio station urls. */
const RADIO_STATION_URLS: Record<RadioStation, string> = {
    [RadioStation.PowerHitRadio]: "https://powerhit.ls.lv/PHR_AAC",
    [RadioStation.M1]: "https://stream.m-1.fm/m1/aacp64",
};

export function getRadioStationUrl(radioStation: RadioStation): string {
    return RADIO_STATION_URLS[radioStation];
}

const RADIO_STATION_NAMES: Record<RadioStation, string> = {
    [RadioStation.PowerHitRadio]: "Power Hit Radio",
    [RadioStation.M1]: "M-1",
};

export function getRadioStationName(radioStation: RadioStation): string {
    return RADIO_STATION_NAMES[radioStation];
}
