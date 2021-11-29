import "./models/ModelStory";
import "./mysqldb";

// import "./mongodb";
import dotenv from "dotenv";
import HTTPS from "https";
import fs from "fs";
import app from "./app";
import { logger } from "./logger";

dotenv.config();

const PORT = process.env.PORT || 7606;
const is_https = process.env.HTTPS;

const handleListening = () => {
  logger.info(`Listening on ${PORT}`);
  //console.log(`Listening on ${PORT}`);
};

if (is_https > 0) {
  const option = {
    ca: fs.readFileSync("./cert/ca-chain-bundle.pem"),
    key: fs.readFileSync("./cert/key.pem"),
    cert: fs.readFileSync("./cert/crt.pem"),
  };

  console.log("this is https!!! env");

  HTTPS.createServer(option, app).listen(PORT, handleListening);
} else {
  logger.info("this is http env");
  app.listen(PORT, handleListening);
}
