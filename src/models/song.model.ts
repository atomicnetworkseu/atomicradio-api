export interface SongModel {
    artist: string,
    title: string,
    playlist: string,
    start_at: number,
    end_at: number,
    duration: number,
    artworks: ArtworksModel
}

export interface ArtworksModel {
    100: string,
    250: string,
    500: string,
    1000: string
}