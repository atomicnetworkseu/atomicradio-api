import { ArtworksModel } from "./song.model";

export interface VotingModel {
    items: VoteSongModel[],
    active: boolean,
    created: number,
    closing: number,
    next: number
}

export interface VoteSongModel {
    id: number,
    unique_id: string,
    artist: string,
    title: string,
    type: string,
    filePath?: string,
    votes: number,
    voted: boolean,
    preview_url: string,
    artworks: ArtworksModel
}

export interface VoteModel {
    id: number,
    ip: string
}