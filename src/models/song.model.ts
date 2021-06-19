import { Model, model, Schema, Document } from "mongoose";

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

const SongIdSchema: Schema = new Schema({
    id: {
      type: String,
      required: true
    },
    path: {
      type: String,
      required: true
    }
});
export interface SongId extends Document {
    id: string,
    path: string
}
const SongIdModel: Model<SongId> = model("songids", SongIdSchema);
export default SongIdModel;