const mongoose = require("mongoose");

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

module.exports = mongoose.model("Event", eventSchema);
