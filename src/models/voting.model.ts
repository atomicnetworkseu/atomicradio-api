import { ArtworksModel } from "./artwork.model";

export interface VotingModel {
    items: VoteSongModel[],
    closed: boolean,
    created_at: Date,
    closing_at: Date,
    ending_at: Date
}

export interface VoteSongModel {
    id: number,
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