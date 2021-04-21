import { ArtworksModel } from "./song.model";

export interface VotingModel {
    items: VoteSongModel[],
    completed?: boolean,
    created_at: number,
    ending_at: number
}

export interface VoteSongModel {
    id: number,
    unique_id: string,
    artist: string,
    title: string,
    playlist: string,
    votes: number,
    voted: boolean,
    preview_url: string,
    artworks: ArtworksModel
}

export interface VoteModel {
    id: number,
    ip: string
}