import { ArtworksModel } from "./artwork.model";

export interface VotingModel {
    items: VoteSongModel[],
    closed: boolean,
    created_at: number,
    closing_at: number,
    ending_at: number
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