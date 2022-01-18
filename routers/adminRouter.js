import express from "express";
import {
  loginCheck,
  adminJoin,
  projectSelect,
  adminLog,
  adminList,
  adminDetail,
  adminUpdate,
  projectAuthList,
  projectAuthAllUpdate,
  projectAuthDelete,
  mainLoadingList,
  mainLoadingInsert,
  mainLoadingDetail,
  mainLoadingUpdate,
  mainLoadingDelete,
  comLocallizingList,
  comLocallizingUpdate,
  mailReservationList,
  mailReservationDetail,
  mailReservationInsert,
  mailReservationUpdate,
  mailReservationDelete,
  getAdminNoticeList,
  getAdminNoticeDetail,
  updateOrInsertNoticeMaster,
  updateOrInsertNoticeDetail,
  mailReservationCancel,
  mailReceiveList,
} from "../controllers/adminController";
import {
  deleteComModel,
  getComModelDetail,
  getComModelMaster,
  registerComModel,
  updateComModel,
  uploadComModelZipFile,
} from "../controllers/designController";
import {
  productAllList,
  productDetail,
  productInsertOrUpdate,
  productAllDelete,
  productDetailDelete,
  productPrieodSearch,
} from "../controllers/shopController";
import {
  userList,
  userDetail,
  userCurrencyList,
  userCouponList,
  userMailList,
  userMailCancel,
  getAdminUserMissionList,
  getAdminUserGalleryImageList,
  userCurrencyControl,
  requestGameUserList,
  requestGameUserTicketProperty,
  requestGameUserDetail,
  requestGameUserProperty,
  userMissionList,
  userMissionDetail,
  userMissonClear,
  userCollection,
  userCollectoinDetail,
} from "../controllers/memberController";

import { uploadComModelZip } from "../middlewares";
import routes from "../routes";

const adminRouter = express.Router();

adminRouter.post(routes.login, loginCheck);
adminRouter.post(routes.join, adminJoin);
adminRouter.post(routes.tempProjectList, projectSelect);
adminRouter.post(routes.log, adminLog);
adminRouter.get(routes.adminList, adminList); //! 관리자리스트
adminRouter.get(routes.adminDetail(), adminDetail); //! 관리자상세
adminRouter.post(routes.adminUpdate(), adminUpdate); //! 관리자수정

//! 작품권한
adminRouter.get(routes.projectAuthList(), projectAuthList); //! 리스트
adminRouter.post(routes.projectAuthAllUpdate(), projectAuthAllUpdate); //! 등록/수정
adminRouter.post(routes.projectAuthDelete(), projectAuthDelete); //! 삭제

//! 메인 로딩
adminRouter.post(routes.mainLoadingList, mainLoadingList); //! 리스트
adminRouter.post(routes.mainLoadingInsert, mainLoadingInsert); //! 등록
adminRouter.get(routes.mainLoadingDetail(), mainLoadingDetail); //! 상세
adminRouter.post(routes.mainLoadingUpdate(), mainLoadingUpdate); //! 수정
adminRouter.post(routes.mainLoadingDelete(), mainLoadingDelete); //! 삭제

//! 다국어 로컬 라이징
adminRouter.get(routes.comLocallizingList(), comLocallizingList); //! 리스트
adminRouter.post(routes.comLocallizingUpdate, comLocallizingUpdate); //! 수정

//! 예약메일
adminRouter.post(routes.mailReservationList(), mailReservationList); //! 리스트
adminRouter.post(routes.mailReservationInsert, mailReservationInsert); //! 등록
adminRouter.get(routes.mailReservationDetail, mailReservationDetail); //! 상세
adminRouter.post(routes.mailReservationUpdate(), mailReservationUpdate); //! 수정
adminRouter.post(routes.mailReservationDelete(), mailReservationDelete); //! 삭제
adminRouter.post(routes.mailReservationCancel(), mailReservationCancel); //! 취소
adminRouter.get(routes.mailReservationReceive(), mailReceiveList); //! 수신자목록

// ! 어드민 공지사항 및 이벤트
adminRouter.post(routes.comNoticeList, getAdminNoticeList); // 마스터 리스트 조회
adminRouter.post(routes.comNoticeDetail, getAdminNoticeDetail); // 언어별 정보 조회
adminRouter.post(routes.comNoticeMasterUpdate, updateOrInsertNoticeMaster); // 마스터 업데이트
adminRouter.post(routes.comNoticeDetailUpdate, updateOrInsertNoticeDetail); // 디테일 업데이트

//! 상품
adminRouter.get(routes.productList, productAllList); // 마스터 조회
adminRouter.post(routes.productDetailList, productDetail); // 상품 상세 조회
adminRouter.post(routes.productAllUpdate, productInsertOrUpdate); // 상품 등록/수정
adminRouter.post(routes.productAllDelete, productAllDelete); // 상품 전체 삭제
adminRouter.post(routes.productDetailDelete, productDetailDelete); // 상세 삭제(daliy 빼고)
adminRouter.post(routes.productPrieodSearch, productPrieodSearch); // 판매 중인 상품 기간 조회

// ! 공용 모델
adminRouter.post(routes.comModelList, getComModelMaster); // 마스터 조회
adminRouter.post(routes.comModelRegister, registerComModel); // 등록
adminRouter.post(routes.comModelDelete, deleteComModel); // 삭제
adminRouter.post(routes.comModelDetailList, getComModelDetail); // 상세정보 조회
adminRouter.post(
  routes.comModelUpload,
  uploadComModelZip,
  uploadComModelZipFile
); // zip 업로드
adminRouter.post(routes.comModelUpdate, updateComModel); // 수정

//! 유저관리
adminRouter.get(routes.comUserList, userList); //유저리스트
adminRouter.post(routes.comUserDetail, userDetail); //상세정보
adminRouter.get(routes.comUserCurrency, userCurrencyList); //재화기록
adminRouter.get(routes.comUserCoupon, userCouponList); //쿠폰기록(삭제할 예정)
adminRouter.get(routes.comUserMail, userMailList); //우편함(삭제할 예정)
adminRouter.post(routes.comUserMailDelete, userMailCancel); //우편취소
adminRouter.post(routes.comUserGallery, getAdminUserGalleryImageList); // 유저 갤러리 현황
adminRouter.post(routes.comUserMission, getAdminUserMissionList); // 유저 미션 현황
adminRouter.post(routes.comUserCurrencyControl, userCurrencyControl); // 재화 회수

adminRouter.post(routes.opUserList, requestGameUserList); //유저리스트
adminRouter.get(routes.opUserTicket, requestGameUserTicketProperty); // 유저 티켓 재화
adminRouter.get(routes.opUserDetail, requestGameUserDetail); // 유저 상세정보
adminRouter.post(routes.opUserCurrency, requestGameUserProperty); // 유저 모든 재화 기록
adminRouter.post(routes.opUserCurrencyControl, userCurrencyControl); // 재화 회수
adminRouter.post(routes.opUserCoupon, userCouponList); //쿠폰기록
adminRouter.post(routes.opUserMail, userMailList); //우편함
adminRouter.post(routes.opUserMailDelete, userMailCancel); //우편취소
adminRouter.get(routes.opUserMission, userMissionList); //미션 리스트
adminRouter.post(routes.opUserMissionDetail, userMissionDetail); //미션 상세
adminRouter.post(routes.opUserMissionDelete, userMissonClear); //미션 초기화
adminRouter.get(routes.opUserCollection, userCollection); // 수집 리스트
adminRouter.post(routes.opUserCollectionDetail, userCollectoinDetail); //수집 상세

export default adminRouter;
