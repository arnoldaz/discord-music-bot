


/** Seconds type for easier readability. */
export type Seconds = number;


/**
 * Converts number of seconds to HH:MM:SS format.
 * @param seconds Number of seconds.
 * @returns Converted string.
 */
export function convertToTimeString(duration: Seconds, stripZeroes = false): string {
    if (duration == Infinity)
        return Infinity.toString();

    const hours = Math.floor(duration / 3600);
    const minutes = Math.floor((duration % 3600) / 60);
    const seconds = duration % 60;

    const hoursString = hours > 0 ? `${hours}:` : "";
    const minutesString = `${hours > 0 || minutes >= 10 ? minutes.toString().padStart(2, "0") : minutes}:`;
    const secondsString = seconds.toString().padStart(2, "0");

    const timeString = hoursString + minutesString + secondsString;

    if (!stripZeroes)
        return timeString;

    return timeString.replace(/^0+:/, "").replace(/^0+/, "");
}
