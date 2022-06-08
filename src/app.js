import compression from "compression";
import express from "express";
import cors from "cors";
import morgan from "morgan";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import bodyParser from "body-parser";
import globalRouter from "./routers/globalRouter";
import { logger } from "./logger";

// import { localsMiddleware } from "./middlewares";
import routes from "./routes";

const app = express();

const corsOption = {
  origin: "*",
  credentials: true,
};

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors(corsOption));
app.set("view engine", "pug");

app.use(cookieParser());
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use(express.json({ limit: "50mb" }));
app.use(compression());
// app.use(morgan("dev"));

app.use(
  morgan("dev", {
    skip(req, res) {
      return req.url.includes("/rep");
    },
  })
);

app.use(routes.home, globalRouter);

logger.info(`Platform Node Starts`);

export default app;
