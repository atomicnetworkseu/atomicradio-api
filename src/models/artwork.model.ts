import { Model, model, Schema, Document } from "mongoose";

const ArtworkSchema: Schema = new Schema({
    id: {
      type: String,
      required: true
    },
    path: {
      type: String,
      required: true
    },
    artworks: {
      100: {
        type: String
      },
      250: {
        type: String
      },
      500: {
        type: String
      },
      1000: {
        type: String
      }
    }
});
export interface Artwork extends Document {
    id: string,
    path: string,
    artworks: ArtworksModel
}
export interface ArtworksModel {
    100: string,
    250: string,
    500: string,
    1000: string
}
const ArtworkModel: Model<Artwork> = model("artworks", ArtworkSchema);
export default ArtworkModel;