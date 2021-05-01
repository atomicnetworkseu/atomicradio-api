import { SongModel } from "./song.model";

export interface RatingModel {
    song: SongModel,
    up_votes: number,
    down_votes: number
}