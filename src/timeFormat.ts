


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

    const dateISOString = new Date(duration * 1000).toISOString(); // "1970-01-01T00:00:00.000Z"
    const timeString = dateISOString.substring(11, 19); // "00:00:00"

    if (!stripZeroes)
        return timeString;

    // TODO: implement properly
    return timeString;

    let cutoffIndex = 0;
    for (const char of timeString) {
        if (char != "0" && char != ":")
            break;

        cutoffIndex++;
    }

    return timeString.substring(cutoffIndex);
}
