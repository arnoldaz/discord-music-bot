import { dirname } from "path";

const ROOT_REPO_DIRECTORY = dirname(require.main?.filename ?? "") + "\\..\\";
const BIN_PATH = ROOT_REPO_DIRECTORY + "bin\\";
const CUSTOM_SONG_PATHY = ROOT_REPO_DIRECTORY + "local\\";

export function getBinaryPath(fileName: string): string {
    return BIN_PATH + fileName;
}

export function getCustomSongPath(fileName: string): string {
    return CUSTOM_SONG_PATHY + fileName;
}
