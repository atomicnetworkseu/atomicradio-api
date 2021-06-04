import { Model, model, Schema, Document } from "mongoose";

const PreviewSchema: Schema = new Schema({
    id: {
      type: String,
      required: true
    },
    path: {
      type: String,
      required: true
    }
});
export interface Preview extends Document {
    id: string,
    path: string
}
const PreviewModel: Model<Preview> = model("previews", PreviewSchema);
export default PreviewModel;