import express from "express";

import {
  requestIllustList,
  postUpdateIllust,
  postInsertIllust,
  postDeleteIllust,
  postSelectLiveIllustMaster,
  postSelectLiveIllustDetail,
  postRegisterLiveIllust,
  postUploadLiveIllust,
  postDeleteLiveIllust,
  updateLiveIllustMaster,
} from "../controllers/illustController";

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
  postUploadLive2D,
  postRegisterModel,
  postModelSlaveList,
  postModelMotionUpdate,
  postModelMotionDelete,
  postModelMasterList,
  postModelMasterUpdate,
  clearModelMotion,
} from "../controllers/modelController";
import {
  getBG,
  getEmoticonMaster,
  postEmoticonSlave,
  getMinicut,
  postDeleteBG,
  postDeleteEmoticonMaster,
  postDeleteMinicut,
  postInsertBG,
  postInsertEmoticonMaster,
  postInsertEmoticonSlave,
  postInsertMinicut,
  postUpdateBG,
  postUpdateEmoticonMaster,
  postUpdateMinicut,
  postUpdateEmoticonSlave,
  postDeleteEmoticonSlave,
  postUploadBackgroundZip,
  postUploadImageZip,
  postUploadLiveObject,
  postDeleteLiveObject,
  postUpdateLiveObject,
  postRegisterLiveObject,
  postSelectLiveObjectDetail,
  postSelectLiveObjectMaster,
} from "../controllers/resourceController";
import {
  getDressMaster,
  postInsertDressMaster,
  postDressList,
  postInsertDressDetail,
  postUpdateDressMaster,
  postDeleteDressMaster,
  postUpdateDressDetail,
  postDeleteDressDetail,
  postUpdateDressDefault,
} from "../controllers/dressController";
import {
  createProjectLoading,
  deleteProjectLoading,
  getProjectLoadingDetail,
  getProjectLoadingMaster,
  getRegisterStory,
  getStoryDetail,
  postModifyStoryWithImage,
  postRegisterStory,
  postUpdateEpisodeSorting,
  updateProjectLoadingDetail,
} from "../controllers/storyController";
import {
  uploadBG,
  uploadComDesign,
  uploadImage,
  uploadLiveIllust,
  uploadLiveObject,
  uploadMinicut,
  uploadModelZip,
  uploadSound,
} from "../middlewares";
import routes from "../routes";
import {
  getProjectSoundResource,
  postDeleteProjectSoundResource,
  postInsertProjectSoundResource,
  postUpdateProjectSoundResource,
  postUploadZipSoundResource,
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

// 스토리 배경 리소스 처리
storyRouter.get(routes.bgList(), getBG); // 배경 리스트 조회
storyRouter.post(routes.bgInsert(), uploadBG, postInsertBG); // 배경 신규 입력
storyRouter.post(routes.bgUpdate(), uploadBG, postUpdateBG); // 배경 수정
storyRouter.post(routes.bgDelete(), postDeleteBG); // 배경 삭제
storyRouter.post(routes.bgZipUpload(), uploadBG, postUploadBackgroundZip); // 배경 zip파일 업로드

// 스토리 미니컷 리소스 처리
storyRouter.post(routes.miniList(), getMinicut); // 리스트 조회
storyRouter.post(routes.miniInsert(), uploadMinicut, postInsertMinicut); // 신규 입력
storyRouter.post(routes.miniUpdate(), uploadMinicut, postUpdateMinicut); // 수정
storyRouter.post(routes.miniDelete(), postDeleteMinicut); // 삭제
storyRouter.post(routes.miniZipUpload(), uploadMinicut, postUploadImageZip); // zip파일 업로드
/////////// 미니컷 리소스 처리 종료 //////////////////////////////

// 스토리 라이브 오브젝트 리소스 처리
storyRouter.post(routes.liveObjectList(), postSelectLiveObjectMaster);
storyRouter.post(routes.liveObjectDetailList(), postSelectLiveObjectDetail);
storyRouter.post(routes.liveObjectRegister(), postRegisterLiveObject); // 등록
storyRouter.post(
  routes.liveObjectUpload(),
  uploadLiveObject,
  postUploadLiveObject
); // 업로드
storyRouter.post(routes.liveObjectDelete(), postDeleteLiveObject); // 삭제
storyRouter.post(routes.liveObjectUpdate(), postUpdateLiveObject); //! 라이브 오브제 마스터 수정

// 스토리 일러스트 리소스 처리
storyRouter.post(routes.illustList(), requestIllustList);

storyRouter.post(routes.illustInsert(), uploadImage, postInsertIllust);
storyRouter.post(routes.illustUpdate(), uploadImage, postUpdateIllust);
storyRouter.post(routes.illustDelete(), postDeleteIllust);

// 스토리, 라이브 일러스트 처리
storyRouter.post(routes.liveIllustList(), postSelectLiveIllustMaster);
storyRouter.post(routes.liveIllustDetailList(), postSelectLiveIllustDetail);
storyRouter.post(routes.liveIllustRegister(), postRegisterLiveIllust); // 등록
storyRouter.post(
  routes.liveIllustUpload(),
  uploadLiveIllust,
  postUploadLiveIllust
); // 업로드
storyRouter.post(routes.liveIllustDelete(), postDeleteLiveIllust); // 삭제
storyRouter.post(routes.liveIllustUpdate(), updateLiveIllustMaster); // 라이브 일러스트 마스터 수정

// 이모티콘 마스터 처리 (마스터는 이미지가 없다)
storyRouter.get(routes.emoticonMasterList(), getEmoticonMaster);
storyRouter.post(routes.emoticonMasterInsert(), postInsertEmoticonMaster);
storyRouter.post(routes.emoticonMasterUpdate(), postUpdateEmoticonMaster);
storyRouter.post(routes.emoticonMasterDelete(), postDeleteEmoticonMaster);

// 이모티콘 슬레이브 처리
storyRouter.post(routes.emoticonSlaveList(), postEmoticonSlave);
storyRouter.post(
  routes.emoticonSlaveInsert(),
  uploadImage,
  postInsertEmoticonSlave
);
storyRouter.post(
  routes.emoticonSlaveUpdate(),
  uploadImage,
  postUpdateEmoticonSlave
);
storyRouter.post(routes.emoticonSlaveDelete(), postDeleteEmoticonSlave);

// 모델 입력 테스트
// storyRouter.post(routes.modelInsertExample(), uploadModelZip, postUploadLive2D);
storyRouter.post(routes.modelRegister(), postRegisterModel);
storyRouter.post(routes.modelMasterList(), postModelMasterList);

storyRouter.post(routes.live2dModelUpload(), uploadModelZip, postUploadLive2D);
storyRouter.post(routes.modelSlaveList(), postModelSlaveList);
storyRouter.post(routes.modelMotionUpdate(), postModelMotionUpdate);
storyRouter.post(routes.modelMotionDelete(), postModelMotionDelete);
storyRouter.post(routes.modelMasterUpdate(), postModelMasterUpdate);
storyRouter.post(routes.modelMotionClear(), clearModelMotion);

// 의상, 드레스
storyRouter.get(routes.dressMasterList(), getDressMaster); // 드레스 마스터 조회
storyRouter.post(routes.dressMasterInsert(), postInsertDressMaster);
storyRouter.post(routes.dressMasterUpdate(), postUpdateDressMaster);
storyRouter.post(routes.dressMasterDelete(), postDeleteDressMaster);

storyRouter.post(routes.dressList(), postDressList);
storyRouter.post(routes.dressInsert(), postInsertDressDetail);
storyRouter.post(routes.dressUpdate(), postUpdateDressDetail);
storyRouter.post(routes.dressDelete(), postDeleteDressDetail);
storyRouter.post(routes.dressDefault(), postUpdateDressDefault);

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
