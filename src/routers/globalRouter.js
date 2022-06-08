import express from "express";
import { clientHome } from "../controllers/clientController";
import { clientCallMiddleware } from "../middlewares";
import routes from "../routes";

const globalRouter = express.Router();

globalRouter.post(routes.clientApp, clientCallMiddleware, clientHome);
globalRouter.get(routes.rep, (req, res) => {
  res.status(200).send("OK");
});
// globalRouter.post(routes.modelDetailInsert, postInsertModelDetail);

// globalRouter.post(route)

export default globalRouter;
