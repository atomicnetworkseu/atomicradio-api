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
    is_live: string,
    streamer: string
}

export interface StreamsModel {
    highquality: string,
    middlequality: string,
    lowquality: string
}