import { ArtworksModel } from "./artwork.model";

export interface SongModel {
    artist: string,
    title: string,
    playlist: string,
    start_at: Date,
    end_at: Date,
    duration: number,
    artworks: ArtworksModel
}