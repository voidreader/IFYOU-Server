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

const DRESS_LIST = `/:id/dress-list`;
const DRESS_INSERT = `/:id/dress-insert`;
const DRESS_UPDATE = `/:id/dress-update`;
const DRESS_DELETE = `/:id/dress-delete`;
const DRESS_DEFAULT = `/:id/dress-default`;

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

// * Admin 작품별 로딩화면
const PROJECT_LOADING_MASTER = `/:id/project-loading-master`;
const PROJECT_LOADING_DETAIL = `/:id/project-loading-detail`;
const PROJECT_LOADING_CREATE = `/:id/project-loading-create`;
const PROJECT_LOADING_UPDATE = `/:id/project-loading-update`;
const PROJECT_LOADING_DELETE = `/:id/project-loading-delete`;

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

  ////////// 여기까지 에피소드 처리 /////////////////

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

  ////////////////// 일반 디자인 종료 ///////////

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

  ////////////////// 프로젝트 로딩 시작 ///////////
  projectLoadingMaster: PROJECT_LOADING_MASTER,
  projectLoadingDetail: PROJECT_LOADING_DETAIL,
  projectLoadingCreate: PROJECT_LOADING_CREATE,
  projectLoadingUpdate: PROJECT_LOADING_UPDATE,
  projectLoadingDelete: PROJECT_LOADING_DELETE,

  ////////////////// 프로젝트 로딩 끝 ///////////
};

export default routes;
