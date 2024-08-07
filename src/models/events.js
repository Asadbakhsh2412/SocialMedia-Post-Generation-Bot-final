import mongoose from "mongoose";

const eventSchema = mongoose.Schema(
  {
    tgId: {
      type: String,
      required: true,
    },
    text: {
      type: String,
      required: true,
    },
  },
  { timeStamps: true }
);


 export default mongoose.model("Event", eventSchema);
 