import express from "express";

import {
  postDeleteEpisode,
  postInsertEpisodeVer2,
  postSelectProjectEpisodeList,
  postSelectScript,
  postSelectScriptWithObject,
  postUpdateEpisode,
  updateScriptByObject,
} from "../controllers/episodeController";
import {
  createProjectLoading,
  deleteProjectLoading,
  getProjectLoadingDetail,
  getProjectLoadingMaster,
  getStoryDetail,
  postModifyStoryWithImage,
  postRegisterStory,
  postUpdateEpisodeSorting,
  updateProjectLoadingDetail,
} from "../controllers/storyController";
import { uploadComDesign, uploadImage, uploadSound } from "../middlewares";
import routes from "../routes";
import {
  getProjectSoundResource,
  postDeleteProjectSoundResource,
  postInsertProjectSoundResource,
  postUpdateProjectSoundResource,
  uploadSoundZip,
} from "../controllers/soundController";
import {
  deleteMission,
  insertMission,
  selectAdminMissionList,
  updateMission,
} from "../controllers/missionController";
import {
  deleteGraphicDesign,
  insertGraphicDesign,
  selectGraphicDesign,
  updateGraphicDesign,
  uploadGraphicDesignZip,
} from "../controllers/designController";

import {
  postSelectNametag,
  postUpdateNametag,
} from "../controllers/nametagController";

const storyRouter = express.Router();

// 스토리 신규 입력
storyRouter.post(routes.registerStory, postRegisterStory);

// 스토리 수정
//! JE - 이미지 업로드 제거
storyRouter.post(routes.modifyStory(), postModifyStoryWithImage);

// 스토리 디테일
storyRouter.get(routes.storyDetail(), getStoryDetail); // 삭제대상
storyRouter.post(routes.storyDetail(), getStoryDetail);

// 스토리에 속한 에피소드 처리

storyRouter.post(routes.episodeSorting(), postUpdateEpisodeSorting);
storyRouter.post(routes.episodeListNew(), postSelectProjectEpisodeList);
// storyRouter.post(routes.episodeInsert(), uploadImage, postInsertEpisode);
storyRouter.post(routes.episodeUpdate(), uploadImage, postUpdateEpisode);

// 신규버전 2021.05.17
storyRouter.post(routes.episodeInsertNew(), uploadImage, postInsertEpisodeVer2);
// storyRouter.post(routes.episodeUpdateNew(), uploadImage, postUpdateEpisodeVer2);

storyRouter.post(routes.episodeDelete(), uploadImage, postDeleteEpisode);

// 스크립트 처리
storyRouter.post(routes.scriptSelect(), postSelectScript);
storyRouter.post(routes.scriptSelectObject(), postSelectScriptWithObject);
storyRouter.post(routes.scriptUpdateObject(), updateScriptByObject); // ! 오브젝트 형태 스크립트 업데이트

// 미션
storyRouter.post(routes.missionProjectList(), selectAdminMissionList);
storyRouter.post(routes.missionProjectInsert(), uploadImage, insertMission);
storyRouter.post(routes.missionProjectUpdate(), uploadImage, updateMission);
storyRouter.post(routes.missionProjectDelete(), deleteMission);
////////////////// 미션 끝

// 사운드 관리파트
storyRouter.post(routes.soundSelect(), getProjectSoundResource);
storyRouter.post(
  routes.soundInsert(),
  uploadSound,
  postInsertProjectSoundResource
);
storyRouter.post(
  routes.soundUpdate(),
  uploadSound,
  postUpdateProjectSoundResource
);
storyRouter.post(routes.soundDelete(), postDeleteProjectSoundResource);
storyRouter.post(routes.soundZip(), uploadSound, uploadSoundZip);
////////////////// 사운드 끝

// ? 공용 디자인 파일 처리
storyRouter.post(routes.comDesignSelect(), selectGraphicDesign);
storyRouter.post(
  routes.comDesignInsert(),
  uploadComDesign,
  insertGraphicDesign
);

storyRouter.post(routes.comDesignDelete(), deleteGraphicDesign);
storyRouter.post(
  routes.comDesignUpdate(),
  uploadComDesign,
  updateGraphicDesign
);

storyRouter.post(
  routes.comDesignZip(),
  uploadComDesign,
  uploadGraphicDesignZip
);

// ! 공용 디자인 파일 처리 끝!!

//! JE - 네임태그 추가
storyRouter.get(routes.nametagSelect(), postSelectNametag);
storyRouter.post(routes.nametagUpdate(), postUpdateNametag);

// * 작품별 로딩
storyRouter.post(routes.projectLoadingMaster, getProjectLoadingMaster);
storyRouter.post(routes.projectLoadingDetail, getProjectLoadingDetail);
storyRouter.post(routes.projectLoadingCreate, createProjectLoading);
storyRouter.post(routes.projectLoadingUpdate, updateProjectLoadingDetail);
storyRouter.post(routes.projectLoadingDelete, deleteProjectLoading);

export default storyRouter;
