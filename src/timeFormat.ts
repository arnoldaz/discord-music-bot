/** Seconds type for easier readability. */
export type Seconds = number;

/**
 * Converts number of seconds to HH:MM:SS format string.
 * @param seconds Number of seconds.
 * @param 
 * @returns Converted string.
 */
export function convertToTimeString(duration: Seconds, stripZeroes = true): string {
    if (duration == Infinity)
        return Infinity.toString();

    const hours = Math.floor(duration / 3600);
    const minutes = Math.floor((duration % 3600) / 60);
    const seconds = duration % 60;

    if (!stripZeroes) {
        const hoursString = hours.toString().padStart(2, "0");
        const minutesString = minutes.toString().padStart(2, "0");
        const secondsString = seconds.toString().padStart(2, "0");
        return `${hoursString}:${minutesString}:${secondsString}`;
    }

    const hoursString = hours > 0 ? `${hours}:` : "";
    const minutesString = `${hours > 0 || minutes >= 10 ? minutes.toString().padStart(2, "0") : minutes}:`;
    const secondsString = seconds.toString().padStart(2, "0");

    return hoursString + minutesString + secondsString;
}
