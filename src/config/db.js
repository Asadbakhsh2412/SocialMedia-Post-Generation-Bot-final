import mongoose from "mongoose";

export default () => {
  return mongoose
    .connect(process.env.MONGO_CONNECT_URL, {
      dbName: "MediaBot",
    })
    .then(() => {
      console.log("Connected to MongoDB");
    })
    .catch((error) => {
      console.log("Error connecting to MongoDB", error);
    });
};
