// 글로벌
const HOME = "/";

// 클라이언트 처리
const CLIENT = "/client"; // 클라이언트 route 처리

const COMMON = "/common"; // 공통 처리
const REP = `/rep`; // 네트워크 인사이트용

// 스토리
const STORY = "/story";
const STORY_DETAIL = "/:id"; // changable
const REGISTER_STORY = "/register-story"; // 스토리 등록
const MODIFY_STORY_WITH_IMAGE = "/:id/modify-story"; // 스토리 수정(이미지 처리 함께)
const MODIFY_STORY_ONLY_TEXT = "/:id/modify-story-text"; // 스토리 수정(이미지 처리 함께)
const UPDATE_STORY_MAIN_THUMBNAIL = `/:id/update-main-thumbnail`; // 스토리메인 썸네일 수정
const DELETE_STORY = "/delete-story"; // 스토리 삭제

// 스토리 - 에피소드
const EPISODE_UPDATE = "/:id/episode-update";
const EPISODE_DELETE = "/:id/episode-delete";
const EPISODE_SORTING = "/:id/episode-sorting";

const EPISODE_LIST_VER2 = "/:id/episode-list-new";
const EPISODE_INSERT_VER2 = "/:id/episode-insert-new";
const EPISODE_UPDATE_VER2 = "/:id/episode-update-new";

// 스크립트
const SCRIPT_SELECT = "/:id/contents/:episodeID";
const SCRIPT_SELECT_OBJECT = "/:id/contents/:episodeID/object";
const SCRIPT_UPDATE = "/:id/contents/:episodeID/update";
const SCRIPT_UPDATE_OBJECT = `/:id/contents/:episodeID/update-object`;

// 캐릭터 모델링 관련
const MODEL_DETAIL_INSERT = "/model-detail-insert";
const MODEL_INSERT_EXAMPLE = "/:id/model-insert-example";
const MODEL_REGISTER = "/:id/model-register";
const MODEL_MASTER_LIST = "/:id/model-list";
const MODEL_MASTER_UPDATE = "/:id/model-master-update";

const MODEL_ZIP_UPLOAD = "/:id/live2d-model-upload"; // ZIP 파일 업로드
const MODEL_SLAVE_LIST = "/:id/model-slave-list"; // 모델 상세 리스트
const MODEL_MOTION_UPDATE = "/:id/model-motion-update"; // 모델 모션 업데이트
const MODEL_MOTION_DELETE = "/:id/model-motion-delete"; // 모델 모션 삭제
const MODEL_MOTION_CLEAR = "/:id/model-motion-clear"; // 모델 모션 전체 클리어

// 스토리 - 배경
const BG_LIST = "/:id/bg-list"; // 배경 리소스 리스트 조회
const BG_INSERT = "/:id/bg-insert"; // 신규 배경 입력
const BG_UPDATE = "/:id/bg-update"; // 배경 수정
const BG_DELETE = "/:id/bg-delete"; // 배경 삭제
const BG_ZIP_UPLOAD = "/:id/bg-zip-upload"; // 배경 zip 파일 업로드

// 스토리 - 일러스트
const ILL_LIST = "/:id/ill-list"; // 일러스트 리소스 리스트 조회
const ILL_INSERT = "/:id/ill-insert"; // 신규 일러스트 입력
const ILL_UPDATE = "/:id/ill-update"; // 일러스트 수정
const ILL_DELETE = "/:id/ill-delete"; // 일러스트 삭제

// 스토리 - 라이브 일러스트
const LIVE_ILL_LIST = `/:id/live-illust-list`; // 라이브 일러스트 리스트
const LIVE_ILL_DETAIL_LIST = `/:id/live-illust-detail-list`; // 라이브 일러스트 디테일 리스트
const LIVE_ILL_REGISTER = `/:id/live-illust-register`; // 라이브 일러스트 신규 등록
const LIVE_ILL_UPLOAD = `/:id/live-illust-upload`; // 라이브 일러스트 업로드
const LIVE_ILL_DELETE = `/:id/live-illust-delete`; // 라이브 일러스트 삭제
const LIVE_ILL_UPDATE = `/:id/live-illust-update`; // 라이브 일러스트 수정(파일말고)

// 스토리 - 미니컷
const MINI_LIST = "/:id/mini-list"; // 미니컷 리소스 리스트 조회
const MINI_INSERT = "/:id/mini-insert"; // 신규 미니컷 입력
const MINI_UPDATE = "/:id/mini-update"; // 미니컷 수정
const MINI_DELETE = "/:id/mini-delete"; // 미니컷 삭제
const MINI_ZIP_UPLOAD = "/:id/mini-zip-upload"; // 배경 zip 파일 업로드

// 스토리 - 라이브 오브제
//! 수정 경로 추가
const LIVE_OBJECT_LIST = `/:id/live-object-list`; // 라이브 오브젝트 리스트
const LIVE_OBJECT_DETAIL_LIST = `/:id/live-object-detail-list`; // 라이브 오브젝트 디테일 리스트
const LIVE_OBJECT_REGISTER = `/:id/live-object-register`; // 라이브 오브젝트 신규 등록
const LIVE_OBJECT_UPLOAD = `/:id/live-object-upload`; // 라이브 오브젝트 업로드
const LIVE_OBJECT_DELETE = `/:id/live-object-delete`; // 라이브 오브젝트 삭제
const LIVE_OBJECT_UPDATE = `/:id/live-object-update`; // 라이브 오브젝트 수정

//
const SOUND_LIST = `/:id/sound-list`; // 사운드 리스트 조회
const SOUND_INSERT = `/:id/sound-insert`; // 사운드 신규 입력
const SOUND_UPDATE = `/:id/sound-update`; // 업데이트
const SOUND_DELETE = `/:id/sound-delete`; // 사운드 삭제
const SOUND_ZIP = `/:id/sound-zip`; // 사운드 ZIP 업로드

// 스토리 - 이모티콘
const EMOTICON_MASTER_LIST = "/:id/emoticon-master-list";
const EMOTICON_MASTER_INSERT = "/:id/emoticon-master-insert";
const EMOTICON_MASTER_UPDATE = "/:id/emoticon-master-update";
const EMOTICON_MASTER_DELETE = "/:id/emoticon-master-delete";
const EMOTICON_SLAVE_LIST = "/:id/emoticon-slave-list";
const EMOTICON_SLAVE_INSERT = "/:id/emoticon-slave-insert";
const EMOTICON_SLAVE_UPDATE = "/:id/emoticon-slave-update";
const EMOTICON_SLAVE_DELETE = "/:id/emoticon-slave-delete";

// 의상
const DRESS_MASTER_LIST = `/:id/dress-master-list`;
const DRESS_MASTER_INSERT = `/:id/dress-master-insert`;
const DRESS_MASTER_UPDATE = `/:id/dress-master-update`;
const DRESS_MASTER_DELETE = `/:id/dress-master-delete`;

const DRESS_LIST = `/:id/dress-list`;
const DRESS_INSERT = `/:id/dress-insert`;
const DRESS_UPDATE = `/:id/dress-update`;
const DRESS_DELETE = `/:id/dress-delete`;
const DRESS_DEFAULT = `/:id/dress-default`;

// 미션!
const MISSION_PROJECT_LIST = `/:id/mission-project-list`;
const MISSION_PROJECT_UPDATE = `/:id/mission-project-update`;
const MISSION_PROJECT_INSERT = `/:id/mission-project-insert`;
const MISSION_PROJECT_DELETE = `/:id/mission-project-delete`;

const BUBBLE = "/bubble"; // 말풍선 처리
const BUBBLE_MASTER_REGISTER = `/register-bubble-set`; // 말풍선 세트 등록
const BUBBLE_MASTER_UPDATE = `/:id/master-update`;
const BUBBLE_MASTER_DELETE = `/:id/master-delete`;

const BUBBLE_DETAIL_SELECT = `/:id`;
const BUBBLE_DETAIL_UPDATE = `/:id/detail-update`;

const BUBBLE_SPRITE_SELECT = `/bubble-sprite-select`; // 말풍선 스프라이트 조회
const BUBBLE_SPRITE_INSERT = `/bubble-sprite-insert`;
const BUBBLE_SPRITE_UPDATE = `/bubble-sprite-update`;
const BUBBLE_SPRITE_DELETE = `/bubble-sprite-delete`;
const BUBBLE_SPRITE_ZIP = `/bubble-sprite-zip`;

const COM_DESIGN_SELECT = `/:id/com-design-select`; // 일반 디자인 파일 조회
const COM_DESIGN_INSERT = `/:id/com-design-insert`; // 일반 디자인 파일 입력
const COM_DESIGN_UPDATE = `/:id/com-design-update`; // 업데이트
const COM_DESIGN_DELETE = `/:id/com-design-delete`;
const COM_DESIGN_ZIP = `/:id/com-design-zip`;

const NAMETAG_SELECT = `/:id/nametag`; //! 네임태그 조회
const NAMETAG_UPDATE = `/:id/nametag-update`; //! 네임태그 편집

//! admin 관련
const ADMIN = "/admin";
const LOGIN = "/login";
const JOIN = "/join";
const TEMP_PROJECT_LIST = "/project-list";
const LOG = "/log";
const ADMIN_LIST = "/user-list";
const ADMIN_DETAIL = "/:id/user-detail";
const ADMIN_UPDATE = "/:id/user-update";

const PROJECT_AUTH_LIST = "/:id/project-auth-list";
const PROJECT_AUTH_ALL_UPDATE = "/:id/project-auth-update";
const PROJECT_AUTH_DELETE = "/:id/project-auth-delete";

const MAIN_LOADING_LIST = "/main-loading-list";
const MAIN_LOADING_INSERT = "/main-loading-insert";
const MAIN_LOADING_DETAIL = "/:id/main-loading-detail";
const MAIN_LOADING_UPDATE = "/:id/main-loading-update";
const MAIN_LOADING_DELETE = "/:id/main-loading-delete";

const COM_LOCALLIZING_LIST = "/com-locallizing-list";
const COM_LOCALLIZING_UPDATE = "/com-locallizing-update";

const MAIL_RESERVATION_LIST = "/mail-reservation-list";
const MAIL_RESERVATION_DETAIL = "/:id/mail-reservation-detail";
const MAIL_RESERVATION_INSERT = "/mail-reservation-insert";
const MAIL_RESERVATION_UPDATE = "/:id/mail-reservation-update";
const MAIL_RESERVATION_DELETE = "/:id/mail-reservation-delete";
const MAIL_RESERVATION_CANCEL = "/:id/mail-reservation-cancel";
const MAIL_RESERVATION_RECEIVE = "/:id/mail-reservation-receive";

// 공지사항 및 이벤트
const COM_NOTICE_LIST = `/com-notice-list`;
const COM_NOTICE_DETAIL = `/com-notice-detail`;
const COM_NOTICE_MASTER_UPDATE = `/com-notice-master-update`;
const COM_NOTICE_DETAIL_UPDATE = `/com-notice-detail-update`;

// 상품
const PRODUCT_LIST = `/product-list`;
const PRODUCT_DETAIL_LIST = `/:id/product-detail-list`;
const PRODUCT_ALL_UPDATE = `/product-all-update`;
const PRODUCT_ALL_DELETE = `/:id/product-all-delete`;
const PRODUCT_DETAIL_DELETE = `/:id/product-detail-delete`;
const PRODUCT_PRIEOD_SEARCH = `/product-prieod-search`;

// * 플랫폼 공용 모델 처리
const COM_MODEL_LIST = `/com-model-list`;
const COM_MODEL_REGISTER = `/com-model-register`;
const COM_MODEL_DETAIL_LIST = `/com-model-detail-list`;
const COM_MODEL_UPLOAD = `/com-model-upload`;
const COM_MODEL_DELETE = `/com-model-delete`;
const COM_MODEL_UPDATE = `/com-model-update`;

//* 쿠폰
const COM_COUPON_LIST = `/com-coupon-list`;
const COM_COUPON_UPDATE = `/com-coupon-update`;
const COM_COUPON_DETAIL_LIST = `/:id/com-coupon-detail-list`;
const COM_COUPON_DELETE = `/:id/com-coupon-delete`;
const COM_COUPON_REWARD_DELETE = `/:id/com-coupon-reward-delete`;
const COM_COUPON_USED_LIST = `/:id/com-coupon-used-list`;
const COM_COUPON_KEYWORD_SEARCH = `/com-coupon-keyword-search`;
const COM_COUPON_EPISODE_SEARCH = `/com-coupon-episode-search`;
const COM_COUPON_EPISODE_DELETE = `/:id/com-coupon-episode-delete`;

//* 유저관리
const COM_USER_LIST = `/com-user-list`;
const COM_USER_DETAIL = `/:id/com-user-detail`;
const COM_USER_CURRENCY = `/:id/com-user-currency`;
const COM_USER_COUPON = `/:id/com-user-coupon`;
const COM_USER_MAIL = `/:id/com-user-mail`;
const COM_USER_MAIL_DELETE = `/:id/com-user-mail-delete`;
const COM_USER_GALLERY = `/:id/com-user-gallery`;
const COM_USER_MISSION = `/:id/com-user-mission`;
const COM_USER_CURRENCY_CONTROL = `/:id/com-user-currency-control`;

// * Admin 작품별 로딩화면
const PROJECT_LOADING_MASTER = `/:id/project-loading-master`;
const PROJECT_LOADING_DETAIL = `/:id/project-loading-detail`;
const PROJECT_LOADING_CREATE = `/:id/project-loading-create`;
const PROJECT_LOADING_UPDATE = `/:id/project-loading-update`;
const PROJECT_LOADING_DELETE = `/:id/project-loading-delete`;

//* 운영 - 유저 관리 Ver.2
const OP_USER_LIST = `/op-user-list`;
const OP_USER_TICKET = `/:id/op-user-ticket`; // 유저 티켓 재화 리스트
const OP_USER_DETAIL = `/:id/op-user-detail`;
const OP_USER_CURRENCY = `/:id/op-user-currency`;
const OP_USER_COUPON = `/:id/op-user-coupon`;
const OP_USER_MAIL = `/:id/op-user-mail`;
const OP_USER_MAIL_DELETE = `/:id/op-user-mail-delete`;
const OP_USER_GALLERY = `/:id/op-user-gallery`;
const OP_USER_MISSION = `/:id/op-user-mission`;
const OP_USER_CURRENCY_CONTROL = `/:id/op-user-currency-control`;  
const OP_USER_MISSION_DETAIL = `/:id/op-user-mission-detail`;
const OP_USRE_MISSION_DELETE = `/:id/op-user-mission-delete`;
const OP_USER_COLLECTION = `/:id/op-user-collection`;
const OP_USER_COLLECTION_DETAIL = `/:id/op-user-collection-detail`;

//* 응모권 
const PRIZE_TICKET_LIST = `/prize-ticket-list`;
const PRIZE_TICKET_DETAIL = `/:id/prize-ticket-detail`;
const PRIZE_TICKET_UPDATE = `/prize-ticket-update`;
const PRIZE_TICKET_DELETE = `/prize-ticket-delete`;
const PRIZE_TICKET_ADDRESS = `/:id/prize-ticket-address`;
const PRIZE_TICKET_SORTING = `/prize-ticket-sorting`;

const routes = {
  home: HOME,
  clientApp: CLIENT,
  common: COMMON,
  rep: REP,
  story: STORY,
  bubble: BUBBLE,

  registerStory: REGISTER_STORY,
  admin: ADMIN,
  login: LOGIN,
  join: JOIN,
  log: LOG,
  tempProjectList: TEMP_PROJECT_LIST,
  adminList: ADMIN_LIST,
  adminDetail: (id) => {
    if (id) {
      return `/admin/${id}/user-detail`;
    } else {
      return ADMIN_DETAIL;
    }
  },
  adminUpdate: (id) => {
    if (id) {
      return `/admin/${id}/user-update`;
    } else {
      return ADMIN_UPDATE;
    }
  },
  storyDetail: (id) => {
    // /story/id/... 형태로
    if (id) {
      return `/story/${id}`;
    } else {
      return STORY_DETAIL;
    }
  },
  modifyStory: (id) => {
    if (id) {
      return `/story/${id}/modify-story`;
    } else {
      return MODIFY_STORY_WITH_IMAGE;
    }
  },
  modifyStoryOnlyText: (id) => {
    if (id) {
      return `/story/${id}/modify-story-text`;
    } else {
      return MODIFY_STORY_ONLY_TEXT;
    }
  },

  modifyStoryMainThumbnail: (id) => {
    if (id) {
      return `/story/${id}/update-main-thumbnail`;
    } else {
      return UPDATE_STORY_MAIN_THUMBNAIL;
    }
  },

  ////////// 캐릭터 모델 처리 ////////////////

  modelRegister: (id) => {
    if (id) {
      return `/story/${id}/model-register`;
    } else {
      return MODEL_REGISTER;
    }
  },

  live2dModelUpload: (id) => {
    if (id) {
      return `/story/${id}/live2d-model-upload`;
    } else {
      return MODEL_ZIP_UPLOAD;
    }
  },

  modelSlaveList: (id) => {
    if (id) {
      // /:id/
      return `/story/${id}/model-slave-list`;
    } else {
      return MODEL_SLAVE_LIST;
    }
  },

  modelMotionUpdate: (id) => {
    if (id) {
      return `/story/${id}/model-motion-update`;
    } else {
      return MODEL_MOTION_UPDATE;
    }
  },

  modelMotionDelete: (id) => {
    if (id) {
      return `/story/${id}/model-motion-delete`;
    } else {
      return MODEL_MOTION_DELETE;
    }
  },

  modelMotionClear: (id) => {
    if (id) {
      return `/story/${id}/model-motion-clear`;
    } else {
      return MODEL_MOTION_CLEAR;
    }
  },

  modelMasterList: (id) => {
    if (id) {
      return `/story/${id}/model-list`;
    } else {
      return MODEL_MASTER_LIST;
    }
  },

  modelMasterUpdate: (id) => {
    if (id) {
      return `/story/${id}/model-master-update`;
    } else {
      return MODEL_MASTER_UPDATE;
    }
  },

  ////////// 에피소드 처리 시작/////////////////

  episodeUpdate: (id) => {
    if (id) {
      return `/story/${id}/episode-update`;
    } else {
      return EPISODE_UPDATE;
    }
  },

  episodeListNew: (id) => {
    if (id) {
      return `/story/${id}/episode-list-new`;
    } else {
      return EPISODE_LIST_VER2;
    }
  },

  episodeInsertNew: (id) => {
    if (id) {
      return `/story/${id}/episode-insert-new`;
    } else {
      return EPISODE_INSERT_VER2;
    }
  },

  episodeUpdateNew: (id) => {
    if (id) {
      return `/story/${id}/episode-update-new`;
    } else {
      return EPISODE_UPDATE_VER2;
    }
  },

  episodeDelete: (id) => {
    if (id) {
      return `/story/${id}/episode-delete`;
    } else {
      return EPISODE_DELETE;
    }
  },

  episodeSorting: (id) => {
    if (id) {
      return `/story/${id}/episode-sorting`;
    } else {
      return EPISODE_SORTING;
    }
  },

  scriptSelect: (id, episodeID) => {
    if (id && episodeID) {
      return `/story/${id}/contents/${episodeID}`;
    } else {
      return SCRIPT_SELECT;
    }
  },

  scriptSelectObject: (id, episodeID) => {
    if (id && episodeID) {
      return `/story/${id}/contents/${episodeID}/object`;
    } else {
      return SCRIPT_SELECT_OBJECT;
    }
  },

  scriptUpdate: (id, episodeID) => {
    if (id && episodeID) {
      return `/story/${id}/contents/${episodeID}/update`;
    } else {
      return SCRIPT_UPDATE;
    }
  },

  scriptUpdateObject: (id, episodeID) => {
    if (id && episodeID) {
      return `/story/${id}/contents/${episodeID}/update-object`;
    } else {
      return SCRIPT_UPDATE_OBJECT;
    }
  },

  ////////// 여기까지 에피소드 처리 /////////////////

  bgList: (id) => {
    if (id) {
      return `/story/${id}/bg-list`;
    } else {
      return BG_LIST;
    }
  },
  bgInsert: (id) => {
    if (id) {
      return `/story/${id}/bg-insert`;
    } else {
      return BG_INSERT;
    }
  },
  bgZipUpload: (id) => {
    // BG_ZIP_UPLOAD
    if (id) {
      return `/story/${id}/bg-zip-upload`;
    } else {
      return BG_ZIP_UPLOAD;
    }
  },

  bgUpdate: (id) => {
    if (id) {
      return `/story/${id}/bg-update`;
    } else {
      return BG_UPDATE;
    }
  },
  bgDelete: (id) => {
    if (id) {
      return `/story/${id}/bg-delete`;
    } else {
      return BG_DELETE;
    }
  },
  ////////// 여기까지 배경 리소스 처리 /////////////////

  miniList: (id) => {
    if (id) {
      return `/story/${id}/mini-list`;
    } else {
      return MINI_LIST;
    }
  },
  miniInsert: (id) => {
    if (id) {
      return `/story/${id}/mini-insert`;
    } else {
      return MINI_INSERT;
    }
  },
  miniUpdate: (id) => {
    if (id) {
      return `/story/${id}/mini-update`;
    } else {
      return MINI_UPDATE;
    }
  },
  miniDelete: (id) => {
    if (id) {
      return `/story/${id}/mini-delete`;
    } else {
      return MINI_DELETE;
    }
  },
  miniZipUpload: (id) => {
    if (id) {
      return `/story/${id}/mini-zip-upload`;
    } else {
      return MINI_ZIP_UPLOAD;
    }
  },

  ////////// 여기까지 미니컷 리소스 처리 /////////////////

  illustList: (id) => {
    if (id) {
      return `/story/${id}/ill-list`;
    } else {
      return ILL_LIST;
    }
  },
  illustInsert: (id) => {
    if (id) {
      return `/story/${id}/ill-insert`;
    } else {
      return ILL_INSERT;
    }
  },
  illustUpdate: (id) => {
    if (id) {
      return `/story/${id}/ill-update`;
    } else {
      return ILL_UPDATE;
    }
  },
  illustDelete: (id) => {
    if (id) {
      return `/story/${id}/ill-delete`;
    } else {
      return ILL_DELETE;
    }
  },

  /////// 여기서부터 이모티콘 처리 ///////////////
  emoticonMasterList: (id) => {
    if (id) {
      return `/story/${id}/emoticon-master-list`;
    } else {
      return EMOTICON_MASTER_LIST;
    }
  },
  emoticonMasterInsert: (id) => {
    if (id) {
      return `/story/${id}/emoticon-master-insert`;
    } else {
      return EMOTICON_MASTER_INSERT;
    }
  },
  emoticonMasterUpdate: (id) => {
    if (id) {
      return `/story/${id}/emoticon-master-update`;
    } else {
      return EMOTICON_MASTER_UPDATE;
    }
  },
  emoticonMasterDelete: (id) => {
    if (id) {
      return `/story/${id}/emoticon-master-delete`;
    } else {
      return EMOTICON_MASTER_DELETE;
    }
  },

  emoticonSlaveList: (id) => {
    if (id) {
      return `/story/${id}/emoticon-slave-list`;
    } else {
      return EMOTICON_SLAVE_LIST;
    }
  },
  emoticonSlaveInsert: (id) => {
    if (id) {
      return `/story/${id}/emoticon-slave-insert`;
    } else {
      return EMOTICON_SLAVE_INSERT;
    }
  },
  emoticonSlaveUpdate: (id) => {
    if (id) {
      return `/story/${id}/emoticon-slave-update`;
    } else {
      return EMOTICON_SLAVE_UPDATE;
    }
  },
  emoticonSlaveDelete: (id) => {
    if (id) {
      return `/story/${id}/emoticon-slave-delete`;
    } else {
      return EMOTICON_SLAVE_DELETE;
    }
  },

  // 드레스. 의상 관련
  dressMasterList: (id) => {
    if (id) {
      return `/story/${id}/dress-master-list`;
    } else {
      return DRESS_MASTER_LIST;
    }
  },
  dressMasterInsert: (id) => {
    if (id) {
      return `/story/${id}/dress-master-insert`;
    } else {
      return DRESS_MASTER_INSERT;
    }
  },
  dressMasterUpdate: (id) => {
    if (id) {
      return `/story/${id}/dress-master-update`;
    } else {
      return DRESS_MASTER_UPDATE;
    }
  },
  dressMasterDelete: (id) => {
    if (id) {
      return `/story/${id}/dress-master-delete`;
    } else {
      return DRESS_MASTER_DELETE;
    }
  },

  dressInsert: (id) => {
    if (id) {
      return `/story/${id}/dress-insert`;
    } else {
      return DRESS_INSERT;
    }
  },
  dressList: (id) => {
    if (id) {
      return `/story/${id}/dress-list`;
    } else {
      return DRESS_LIST;
    }
  },
  dressUpdate: (id) => {
    if (id) {
      return `/story/${id}/dress-update`;
    } else {
      return DRESS_UPDATE;
    }
  },
  dressDelete: (id) => {
    if (id) {
      return `/story/${id}/dress-delete`;
    } else {
      return DRESS_DELETE;
    }
  },
  dressDefault: (id) => {
    if (id) {
      return `/story/${id}/dress-default`;
    } else {
      return DRESS_DEFAULT;
    }
  },
  // 드레스 의상 처리 끝 ////

  bubbleSpriteSelect: BUBBLE_SPRITE_SELECT,
  bubbleSpriteInsert: BUBBLE_SPRITE_INSERT,
  bubbleSpriteUpdate: BUBBLE_SPRITE_UPDATE,
  bubbleSpriteDelete: BUBBLE_SPRITE_DELETE,
  bubbleSpriteZip: BUBBLE_SPRITE_ZIP,

  bubbleMasterRegister: BUBBLE_MASTER_REGISTER,
  bubbleMasterUpdate: (id) => {
    if (!id) return BUBBLE_MASTER_UPDATE;

    return `/bubble/${id}/master-update`;
  },
  bubbleMasterDelete: (id) => {
    if (!id) return BUBBLE_MASTER_DELETE;

    return `/bubble/${id}/master-delete`;
  },
  bubbleDetailSelect: (id) => {
    if (!id) return BUBBLE_DETAIL_SELECT;

    return `/bubble/${id}`;
  },
  bubbleDetailUpdate: (id) => {
    if (!id) return BUBBLE_DETAIL_UPDATE;

    return `/bubble/${id}/detail-update`;
  },

  ////////////// 사운드 관리
  soundSelect: (id) => {
    if (!id) return SOUND_LIST;

    return `/story/${id}/sound-list`;
  },
  soundInsert: (id) => {
    if (!id) return SOUND_INSERT;

    return `/story/${id}/sound-insert`;
  },
  soundUpdate: (id) => {
    if (!id) return SOUND_UPDATE;

    return `/story/${id}/sound-update`;
  },
  soundDelete: (id) => {
    if (!id) return SOUND_DELETE;

    return `/story/${id}/sound-delete`;
  },
  soundZip: (id) => {
    if (!id) return SOUND_ZIP;

    return `/story/${id}/sound-zip`;
  },

  ////////////// 사운드 관리 끝

  /////////// 라이브 일러스트
  liveIllustList: (id) => {
    if (!id) return LIVE_ILL_LIST;

    return `/story/${id}/live-illust-list`;
  },
  liveIllustDetailList: (id) => {
    if (!id) return LIVE_ILL_DETAIL_LIST;

    return `/story/${id}/live-illust-detail-list`;
  },
  liveIllustRegister: (id) => {
    if (!id) return LIVE_ILL_REGISTER;

    return `/story/${id}/live-illust-register`;
  },
  liveIllustUpload: (id) => {
    if (!id) return LIVE_ILL_UPLOAD;

    return `/story/${id}/live-illust-upload`;
  },
  liveIllustDelete: (id) => {
    if (!id) return LIVE_ILL_DELETE;

    return `/story/${id}/live-illust-delete`;
  },

  liveIllustUpdate: (id) => {
    if (!id) return LIVE_ILL_UPDATE;

    return `/story/${id}/live-illust-update`;
  },

  /////////// 라이브 일러스트 끝

  /////////// 라이브 오브젝트
  //! 수정경로 추가
  liveObjectList: (id) => {
    if (!id) return LIVE_OBJECT_LIST;

    return `/story/${id}/live-Object-list`;
  },
  liveObjectDetailList: (id) => {
    if (!id) return LIVE_OBJECT_DETAIL_LIST;

    return `/story/${id}/live-Object-detail-list`;
  },
  liveObjectRegister: (id) => {
    if (!id) return LIVE_OBJECT_REGISTER;

    return `/story/${id}/live-Object-register`;
  },
  liveObjectUpload: (id) => {
    if (!id) return LIVE_OBJECT_UPLOAD;

    return `/story/${id}/live-Object-upload`;
  },
  liveObjectDelete: (id) => {
    if (!id) return LIVE_OBJECT_DELETE;

    return `/story/${id}/live-Object-delete`;
  },
  liveObjectUpdate: (id) => {
    if (!id) return LIVE_OBJECT_UPDATE;

    return `/story/${id}/live-Object-update`;
  },
  /////////// 라이브 오브젝트 끝

  //////////// 미션 처리 시작
  missionProjectList: (id) => {
    if (id) {
      return `/story/${id}/mission-project-list`;
    } else {
      return MISSION_PROJECT_LIST;
    }
  },

  missionProjectInsert: (id) => {
    if (id) {
      return `/story/${id}/mission-project-insert`;
    } else {
      return MISSION_PROJECT_INSERT;
    }
  },
  missionProjectUpdate: (id) => {
    if (id) {
      return `/story/${id}/mission-project-update`;
    } else {
      return MISSION_PROJECT_UPDATE;
    }
  },
  missionProjectDelete: (id) => {
    if (id) {
      return `/story/${id}/mission-project-delete`;
    } else {
      return MISSION_PROJECT_DELETE;
    }
  },
  ////////////////// 미션 처리 종료 ///////////

  ////////////////// 일반 디자인 시작 ///////////
  comDesignSelect: (id) => {
    if (id) {
      return `/story/${id}/com-design-select`;
    } else {
      return COM_DESIGN_SELECT;
    }
  },
  comDesignInsert: (id) => {
    if (id) {
      return `/story/${id}/com-design-insert`;
    } else {
      return COM_DESIGN_INSERT;
    }
  },
  comDesignUpdate: (id) => {
    if (id) {
      return `/story/${id}/com-design-update`;
    } else {
      return COM_DESIGN_UPDATE;
    }
  },
  comDesignDelete: (id) => {
    if (id) {
      return `/story/${id}/com-design-delete`;
    } else {
      return COM_DESIGN_DELETE;
    }
  },
  comDesignZip: (id) => {
    if (id) {
      return `/story/${id}/com-design-zip`;
    } else {
      return COM_DESIGN_ZIP;
    }
  },

  ////////////////// 일반 디자인 종료 ///////////

  ////////////////// 네임태그 시작 ///////////
  nametagSelect: (id) => {
    if (id) {
      return `/story/${id}/nametag`;
    } else {
      return NAMETAG_SELECT;
    }
  },
  nametagUpdate: (id) => {
    if (id) {
      return `/story/${id}/nametag-update`;
    } else {
      return NAMETAG_UPDATE;
    }
  },
  ////////////////// 네임태그 종료 ///////////

  ////////////////// 작품 권한 시작 ///////////
  projectAuthList: (id) => {
    if (id) {
      return `/admin/${id}/project-auth-list`;
    } else {
      return PROJECT_AUTH_LIST;
    }
  },
  projectAuthAllUpdate: (id) => {
    if (id) {
      return `/admin/${id}/project-auth-update`;
    } else {
      return PROJECT_AUTH_ALL_UPDATE;
    }
  },
  projectAuthDelete: (id) => {
    if (id) {
      return `/admin/${id}/project-auth-delete`;
    } else {
      return PROJECT_AUTH_DELETE;
    }
  },
  ////////////////// 작품 권한 종료 ///////////

  ////////////////// 메인 로딩 시작 ///////////
  mainLoadingList: MAIN_LOADING_LIST,
  mainLoadingInsert: MAIN_LOADING_INSERT,
  mainLoadingDetail: (id) => {
    if (id) {
      return `/admin/${id}/main-loading-detail`;
    } else {
      return MAIN_LOADING_DETAIL;
    }
  },
  mainLoadingUpdate: (id) => {
    if (id) {
      return `/admin/${id}/main-loading-update`;
    } else {
      return MAIN_LOADING_UPDATE;
    }
  },
  mainLoadingDelete: (id) => {
    if (id) {
      return `/admin/${id}/main-loading-delete`;
    } else {
      return MAIN_LOADING_DELETE;
    }
  },
  ////////////////// 메인 로딩 종료 ///////////

  ////////////////// 다국어 로컬라이징 시작 ///////////
  comLocallizingList: (id) => {
    if (id) {
      return `/${id}/com-locallizing-list`;
    } else {
      return COM_LOCALLIZING_LIST;
    }
  },
  comLocallizingUpdate: COM_LOCALLIZING_UPDATE,
  //////////////////  다국어 로컬라이징 끝 ///////////

  ////////////////// 이메일 시작 ///////////
  mailReservationList: (id) => {
    if (id) {
      return `/${id}/mail-reservation-list`;
    } else {
      return MAIL_RESERVATION_LIST;
    }
  },
  mailReservationDetail: MAIL_RESERVATION_DETAIL,
  mailReservationInsert: MAIL_RESERVATION_INSERT,
  mailReservationUpdate: (id) => {
    if (id) {
      return `/${id}/mail-reservation-update`;
    } else {
      return MAIL_RESERVATION_UPDATE;
    }
  },
  mailReservationDelete: (id) => {
    if (id) {
      return `/${id}/mail-reservation-delete`;
    } else {
      return MAIL_RESERVATION_DELETE;
    }
  },
  mailReservationCancel: (id) => {
    if (id) {
      return `/${id}/mail-reservation-cancel`;
    } else {
      return MAIL_RESERVATION_CANCEL;
    }
  },
  mailReservationReceive: (id) => {
    if (id) {
      return `/${id}/mail-reservation-receive`;
    } else {
      return MAIL_RESERVATION_RECEIVE;
    }
  },
  ////////////////// 이메일 끝 ///////////

  comNoticeList: COM_NOTICE_LIST,
  comNoticeDetail: COM_NOTICE_DETAIL,
  comNoticeMasterUpdate: COM_NOTICE_MASTER_UPDATE,
  comNoticeDetailUpdate: COM_NOTICE_DETAIL_UPDATE,

  ////////////////// 상품 시작 ///////////
  productList: PRODUCT_LIST,
  productDetailList: PRODUCT_DETAIL_LIST,
  productAllUpdate: PRODUCT_ALL_UPDATE,
  productAllDelete: PRODUCT_ALL_DELETE,
  productDetailDelete: PRODUCT_DETAIL_DELETE,
  productPrieodSearch: PRODUCT_PRIEOD_SEARCH,
  ////////////////// 상품 끝 ///////////

  ////////////////// 공용 모델 ///////////
  comModelList: COM_MODEL_LIST,
  comModelRegister: COM_MODEL_REGISTER,
  comModelDetailList: COM_MODEL_DETAIL_LIST,
  comModelUpload: COM_MODEL_UPLOAD,
  comModelDelete: COM_MODEL_DELETE,
  comModelUpdate: COM_MODEL_UPDATE,
  ////////////////// 공용 모델  ///////////

  ////////////////// 쿠폰 시작 ///////////
  comCouponList: COM_COUPON_LIST,
  comCouponUpdate: COM_COUPON_UPDATE,
  comCouponDetailList: COM_COUPON_DETAIL_LIST,
  comCouponDelete: COM_COUPON_DELETE,
  comCouponRewardDelete: COM_COUPON_REWARD_DELETE,
  comCouponUsedList: COM_COUPON_USED_LIST,
  comCouponKeywordSearch: COM_COUPON_KEYWORD_SEARCH,
  comCouponEpisodeSearch: COM_COUPON_EPISODE_SEARCH, 
  comCouponEpisodeDelete: COM_COUPON_EPISODE_DELETE, 
  ////////////////// 쿠폰 끝 ///////////

  ////////////////// 유저관리 시작 ///////////
  comUserList: COM_USER_LIST,
  comUserDetail: COM_USER_DETAIL,
  comUserCurrency: COM_USER_CURRENCY,
  comUserCoupon: COM_USER_COUPON,
  comUserMail: COM_USER_MAIL,
  comUserMailDelete: COM_USER_MAIL_DELETE,
  comUserGallery: COM_USER_GALLERY,
  comUserMission: COM_USER_MISSION,
  comUserCurrencyControl: COM_USER_CURRENCY_CONTROL,

  opUserList: OP_USER_LIST,
  opUserTicket: OP_USER_TICKET,
  opUserDetail: OP_USER_DETAIL,
  opUserCurrency: OP_USER_CURRENCY,
  opUserCoupon: OP_USER_COUPON,
  opUserMail: OP_USER_MAIL,
  opUserMailDelete: OP_USER_MAIL_DELETE,
  opUserGallery: OP_USER_GALLERY,
  opUserMission: OP_USER_MISSION,
  opUserCurrencyControl: OP_USER_CURRENCY_CONTROL,
  opUserMissionDetail: OP_USER_MISSION_DETAIL, 
  opUserMissionDelete: OP_USRE_MISSION_DELETE, 
  opUserCollection: OP_USER_COLLECTION, 
  opUserCollectionDetail: OP_USER_COLLECTION_DETAIL, 

  ////////////////// 유저관리 끝 ///////////

  ////////////////// 프로젝트 로딩 시작 ///////////
  projectLoadingMaster: PROJECT_LOADING_MASTER,
  projectLoadingDetail: PROJECT_LOADING_DETAIL,
  projectLoadingCreate: PROJECT_LOADING_CREATE,
  projectLoadingUpdate: PROJECT_LOADING_UPDATE,
  projectLoadingDelete: PROJECT_LOADING_DELETE,

  ////////////////// 프로젝트 로딩 끝 ///////////

  ////////////////// 응모권 시작 ///////////
  prizeTicketList: PRIZE_TICKET_LIST, 
  prizeTicketDetail: PRIZE_TICKET_DETAIL,
  prizeTicketUpdate: PRIZE_TICKET_UPDATE, 
  prizeTicketDelete: PRIZE_TICKET_DELETE, 
  prizeTicketAddress: PRIZE_TICKET_ADDRESS,
  prizeTicketSorting: PRIZE_TICKET_SORTING, 
  ////////////////// 응모권 끝 ///////////
};

export default routes;
