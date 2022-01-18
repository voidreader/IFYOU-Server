import express from "express";
import { getBubbleMasterList } from "../controllers/bubbleController";
import { clientHome } from "../controllers/clientController";
import { getCommonInfo, home } from "../controllers/storyController";
import { clientCallMiddleware } from "../middlewares";
import routes from "../routes";

const globalRouter = express.Router();

globalRouter.post(routes.home, home);
globalRouter.post(routes.common, getCommonInfo);
globalRouter.post(routes.clientApp, clientCallMiddleware, clientHome);
globalRouter.get(routes.bubble, getBubbleMasterList);
globalRouter.get(routes.rep, (req, res) => {
  res.status(200).send("OK");
});
// globalRouter.post(routes.modelDetailInsert, postInsertModelDetail);

// globalRouter.post(route)

export default globalRouter;
