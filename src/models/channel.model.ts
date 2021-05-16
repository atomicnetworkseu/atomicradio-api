import { SongModel } from "./song.model";

export interface ChannelModel {
    name: string,
    description: DescriptionModel,
    listeners: number,
    live?: LiveModel,
    song: SongModel,
    schedule: SongModel[],
    history: SongModel[],
    stream_urls: StreamsModel
}

export interface DescriptionModel {
    de: string,
    en: string
}

export interface LiveModel {
    is_live: boolean,
    streamer: string,
    start_at: Date
}

export interface StreamsModel {
    highquality: string,
    middlequality: string,
    lowquality: string
}