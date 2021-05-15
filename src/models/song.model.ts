export interface SongModel {
    artist: string,
    title: string,
    playlist: string,
    start_at: Date,
    end_at: Date,
    duration: number,
    artworks: ArtworksModel
}

export interface ArtworksModel {
    100: string,
    250: string,
    500: string,
    1000: string
}