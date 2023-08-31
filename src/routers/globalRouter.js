import express from "express";
import {
  clientHome,
  patchClient,
  putClient,
} from "../controllers/clientController";
import routes from "../routes";

const globalRouter = express.Router();

globalRouter.post(routes.clientApp, clientHome);
globalRouter.patch(routes.clientApp, patchClient);
globalRouter.put(routes.clientApp, putClient);
globalRouter.get(routes.rep, (req, res) => {
  res.status(200).send("OK");
});

export default globalRouter;
