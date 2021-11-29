import express from "express";
import {
  getPlatformBubbleSprite,
  postInsertBubbleSprite,
  registerBubbleMaster,
  updateBubbleMaster,
  deleteBubbleMaster,
  postUpdateBubbleSprite,
  postDeleteBubbleSprite,
  getBubbleDetailSelect,
  postBubbleDetailScriptableUpdate,
  uploadBubbleZip,
} from "../controllers/bubbleController";
import { uploadBubbleImage } from "../middlewares";
import routes from "../routes";

const bubbleRouter = express.Router();

bubbleRouter.post(routes.bubbleMasterRegister, registerBubbleMaster);
bubbleRouter.post(routes.bubbleMasterUpdate(), updateBubbleMaster);
bubbleRouter.post(routes.bubbleMasterDelete(), deleteBubbleMaster);

bubbleRouter.get(routes.bubbleSpriteSelect, getPlatformBubbleSprite);

bubbleRouter.post(
  routes.bubbleSpriteUpdate,
  uploadBubbleImage,
  postUpdateBubbleSprite
);

bubbleRouter.post(
  routes.bubbleSpriteInsert,
  uploadBubbleImage,
  postInsertBubbleSprite
);

bubbleRouter.post(routes.bubbleSpriteDelete, postDeleteBubbleSprite);
bubbleRouter.post(routes.bubbleSpriteZip, uploadBubbleImage, uploadBubbleZip);

bubbleRouter.post(routes.bubbleDetailSelect(), getBubbleDetailSelect);
bubbleRouter.post(
  routes.bubbleDetailUpdate(),
  postBubbleDetailScriptableUpdate
);

export default bubbleRouter;
