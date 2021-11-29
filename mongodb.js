import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

mongoose.connect(process.env.MONGO_URL, {
    useNewUrlParser:true,
    useUnifiedTopology: true
});

const monogodb = mongoose.connection;

const handleOpen = () => {
    console.log("Connected to Mongo DB");
};

const handleError = (err) => {
    console.log(`Error on DB connection ${err}`);
};

monogodb.once("open", handleOpen);
monogodb.on("error", handleError);

