export interface PlayBackInfo {
    Info: {
        CurrentTrack: {
            TRACK: Track
        },
        Playback: Playback,
        Options: Options,
        Features: Features,
        Streaming: Streaming,
        PrevTrack: {
            TRACK: Track
        },
        NextTrack: {
            TRACK: Track
        }
    }
}

export interface Options {
    repeat_list: string,
    shuffle: string
}

export interface Features {
    scheduler: string
}

export interface Streaming {
    listeners: string
}

export interface Playback {
    pos: string,
    len: string,
    state: string,
    playlistpos: string,
    streams: string,
    netstream: string
}

export interface Track {
    ARTIST: string,
    TITLE: string,
    CASTTITLE?: string,
    ALBUM: string,
    YEAR: string,
    GENRE: string,
    COMMENT: string,
    FILENAME: string,
    DURATION: string,
    PLAYCOUNT: string,
    LASTPLAYED: string,
    STARTTIME?: string,
    INTRO: string,
    OUTRO: string,
    LANGUAGE: string,
    F1: string,
    F2: string,
    F3: string,
    F4: string,
    F5: string,
    ITEMTITLE: string
}

export interface LastPlayed {
    LastPlayed: {
        TRACK: Track[]
    }
}

export interface Playlist {
    Playlist: {
        TRACK: Track[]
    }
}