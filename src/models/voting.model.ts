import { ArtworksModel } from "./song.model";

export interface VotingModel {
    items: VoteSongModel[],
    created_at: number,
    ending_at: number
}

export interface VoteSongModel {
    id: number
    artist: string,
    title: string,
    playlist: string,
    votes: number,
    preview_url: string,
    artworks: ArtworksModel
}

export interface VoteModel {
    id: number,
    ip: string
}