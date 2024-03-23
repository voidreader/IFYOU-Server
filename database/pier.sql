-- MySQL dump 10.13  Distrib 8.0.32, for Linux (x86_64)
--
-- Host: localhost    Database: pier
-- ------------------------------------------------------
-- Server version	8.0.33

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Current Database: `pier`
--

CREATE DATABASE /*!32312 IF NOT EXISTS*/ `pier` /*!40100 DEFAULT CHARACTER SET utf8mb3 */ /*!80016 DEFAULT ENCRYPTION='N' */;

USE `pier`;

--
-- Table structure for table `admin_account`
--

DROP TABLE IF EXISTS `admin_account`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `admin_account` (
  `user_id` varchar(30) NOT NULL,
  `user_name` varchar(30) NOT NULL,
  `email` varchar(50) NOT NULL,
  `organization` varchar(40) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT '조직',
  `create_date` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '생성일',
  PRIMARY KEY (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='어드민 계정';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `admin_auth`
--

DROP TABLE IF EXISTS `admin_auth`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `admin_auth` (
  `user_id` varchar(30) NOT NULL,
  `master_auth` tinyint DEFAULT '0' COMMENT '마스터권한',
  `project_auth` tinyint DEFAULT '0' COMMENT '작품권한',
  `platform_auth` varchar(6) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT '' COMMENT '플랫폼권한',
  `management_auth` varchar(6) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT '' COMMENT '운영권한',
  `create_date` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '생성일',
  `modify_date` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '수정일',
  PRIMARY KEY (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='권한 마스터';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `admin_deploy_history`
--

DROP TABLE IF EXISTS `admin_deploy_history`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `admin_deploy_history` (
  `history_no` int NOT NULL AUTO_INCREMENT,
  `user_id` varchar(30) NOT NULL,
  `project_id` int NOT NULL,
  `reason` varchar(60) NOT NULL,
  `server` varchar(5) DEFAULT NULL,
  `kind` varchar(60) DEFAULT NULL COMMENT '구분',
  `deploy_date` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`history_no`),
  KEY `admin_deploy_history_project_id_IDX` (`project_id`) USING BTREE,
  KEY `admin_deploy_history_user_id_IDX` (`user_id`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=930 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='어드민 배포 히스토리';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `admin_history`
--

DROP TABLE IF EXISTS `admin_history`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `admin_history` (
  `history_no` int NOT NULL AUTO_INCREMENT,
  `user_id` varchar(30) DEFAULT NULL,
  `kind` varchar(1) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `content` text,
  `create_date` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`history_no`)
) ENGINE=InnoDB AUTO_INCREMENT=20925 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `admin_live_pair_script_history`
--

DROP TABLE IF EXISTS `admin_live_pair_script_history`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `admin_live_pair_script_history` (
  `script_no` bigint NOT NULL COMMENT '스크립트 번호',
  `project_id` int DEFAULT NULL COMMENT '작품id',
  `episode_id` int DEFAULT NULL COMMENT '에피소드id',
  `lang` varchar(2) DEFAULT NULL COMMENT '언어',
  `origin_template` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT '원 템블릿',
  `origin_script_data` varchar(240) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT '원 스크립트 데이터',
  `update_template` varchar(20) DEFAULT NULL COMMENT '새 템플릿',
  `update_script_data` varchar(240) DEFAULT NULL COMMENT '새 스크립트 데이터',
  `create_date` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '생성일',
  PRIMARY KEY (`script_no`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='라이브 페어 일괄 업데이트 히스토리';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `admin_project_auth`
--

DROP TABLE IF EXISTS `admin_project_auth`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `admin_project_auth` (
  `user_id` varchar(30) DEFAULT NULL,
  `project_id` int DEFAULT NULL,
  `auth_kind` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT '권한종류',
  KEY `admin_project_auth_user_id_IDX` (`user_id`) USING BTREE,
  KEY `admin_project_auth_project_id_IDX` (`project_id`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='작품 권한';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `com_ability`
--

DROP TABLE IF EXISTS `com_ability`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `com_ability` (
  `ability_id` int NOT NULL AUTO_INCREMENT,
  `project_id` int NOT NULL,
  `speaker` varchar(30) NOT NULL COMMENT '대상 캐릭터',
  `ability_name` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL DEFAULT '' COMMENT '스크립트에서 사용되는 능력 이름',
  `min_value` int NOT NULL DEFAULT '0' COMMENT '능력치 초기값',
  `max_value` int NOT NULL DEFAULT '100' COMMENT '능력치 최대값',
  `is_main` tinyint NOT NULL DEFAULT '1' COMMENT '메인 능력 여부 (오토메는 하나만 사용)',
  `icon_design_id` int DEFAULT '-1' COMMENT '아이콘 디자인',
  `standing_id` int DEFAULT '-1' COMMENT '스탠딩 id',
  `emoticon_image_id` int DEFAULT '-1' COMMENT '이모티콘 이미지',
  `local_id` int NOT NULL DEFAULT '-1' COMMENT '로컬라이징 ID (이름)',
  `profile_height` float NOT NULL DEFAULT '0' COMMENT '프로필 키',
  `profile_age` int NOT NULL DEFAULT '0' COMMENT '프로필 나이',
  `profile_birth_date` date DEFAULT NULL COMMENT '프로필 생일',
  `profile_favorite_id` int NOT NULL DEFAULT '-1' COMMENT '프로필 좋아하는것 로컬ID',
  `profile_hate_id` int NOT NULL DEFAULT '-1' COMMENT '프로필 싫어하는것 로컬ID',
  `profile_line_id` int NOT NULL DEFAULT '-1' COMMENT '프로필 한줄 대사',
  `profile_introduce_id` int NOT NULL DEFAULT '-1' COMMENT '프로필 한줄 소개글',
  `updated` tinyint DEFAULT '0',
  `last_updated` datetime DEFAULT CURRENT_TIMESTAMP,
  `last_deployed` datetime DEFAULT NULL,
  PRIMARY KEY (`ability_id`),
  UNIQUE KEY `com_ability_project_id_IDX` (`project_id`,`speaker`,`ability_name`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=178 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `com_achievement`
--

DROP TABLE IF EXISTS `com_achievement`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `com_achievement` (
  `achievement_id` int NOT NULL AUTO_INCREMENT COMMENT '유일번호',
  `achievement_icon_id` int DEFAULT '-1' COMMENT '등급 아이콘',
  `achievement_kind` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT '업적종류(초심자 : beginner, 이프유 : ifyou)',
  `achievement_type` varchar(6) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT '업적타입(레벨 : level, 단일 : single, repeat: 반복)',
  `clear_condition` varchar(60) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT '클리어 조건',
  `max_level` int DEFAULT NULL COMMENT '최대 레벨',
  `achievement_point` int DEFAULT NULL COMMENT '달성 수치',
  `gain_point` int DEFAULT NULL COMMENT '획득 포인트',
  `is_use` tinyint DEFAULT '1' COMMENT '활성화 여부(0 : 비활성화, 1 : 활성화)',
  PRIMARY KEY (`achievement_id`),
  KEY `com_achievement_achievement_kind_IDX` (`achievement_kind`,`achievement_type`,`is_use`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=25 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='업적 관리';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `com_achievement_lang`
--

DROP TABLE IF EXISTS `com_achievement_lang`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `com_achievement_lang` (
  `achievement_id` int DEFAULT NULL COMMENT '업적id',
  `lang` varchar(2) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT '언어',
  `name` varchar(60) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT '업적명',
  `surmmary` varchar(300) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT '설명',
  UNIQUE KEY `com_achievement_lang_achievement_id_IDX` (`achievement_id`,`lang`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='업적 언어별 리스트';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `com_achievement_level`
--

DROP TABLE IF EXISTS `com_achievement_level`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `com_achievement_level` (
  `achievement_id` int DEFAULT NULL COMMENT '업적id',
  `achievement_level` int DEFAULT NULL COMMENT '레벨',
  `achievement_point` int DEFAULT NULL COMMENT '달성 수치',
  `gain_point` int DEFAULT NULL COMMENT '포인트 수치',
  KEY `com_achievement_level_achievement_id_IDX` (`achievement_id`,`achievement_level`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='업적 레벨 리스트';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `com_ad`
--

DROP TABLE IF EXISTS `com_ad`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `com_ad` (
  `loading_is_active` int DEFAULT '0' COMMENT '에피소드 로딩 광고 활성화',
  `loading_interstitial` int DEFAULT NULL COMMENT '로딩 전면 광고',
  `loading_rewarded` int DEFAULT NULL COMMENT '로딩 동영상 광고',
  `banner_is_active` int DEFAULT '0' COMMENT '인게임 배너 광고 활성화',
  `play_is_active` int DEFAULT '0' COMMENT '인게임 플레이 광고 활성화',
  `play_line` int DEFAULT NULL COMMENT '라인수',
  `play_percent` int DEFAULT NULL COMMENT '확률',
  `play_interstitial` int DEFAULT NULL COMMENT '플레이 전면 광고',
  `play_rewarded` int DEFAULT NULL COMMENT '플레이 동영상 광고',
  `selection_is_active` int DEFAULT '0' COMMENT '인게임 선택지 광고 활성화',
  `selection_interstitial` int DEFAULT NULL COMMENT '선택지 전면 광고',
  `selection_rewarded` int DEFAULT NULL COMMENT '선택지 동영상 광고',
  `reward_is_active` int DEFAULT '0' COMMENT '보상 2배 선택 광고 활성화',
  `reward_interstitial` int DEFAULT NULL COMMENT '보상 전면 광고',
  `reward_rewarded` int DEFAULT NULL COMMENT '보상 동영상 광고'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `com_ad_reward`
--

DROP TABLE IF EXISTS `com_ad_reward`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `com_ad_reward` (
  `ad_no` int NOT NULL AUTO_INCREMENT COMMENT '일련번호',
  `name` int DEFAULT '-1' COMMENT '타이틀 다국어 id',
  `content` int DEFAULT '-1' COMMENT '내용 다국어 id',
  `min_time` int DEFAULT NULL COMMENT '시간(분)',
  `is_public` tinyint DEFAULT '0' COMMENT '활성화',
  `dev_name` varchar(60) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT '내부용 이름',
  `first_count` int DEFAULT NULL COMMENT '첫번째 달성 횟수',
  `first_currency` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT '첫번째 보상',
  `first_quantity` int DEFAULT NULL COMMENT '첫번째 보상 수',
  `second_count` int DEFAULT NULL COMMENT '두번째 달성 횟수',
  `second_currency` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT '두번째 보상',
  `second_quantity` int DEFAULT NULL COMMENT '두번째 보상 수',
  `third_count` int DEFAULT NULL COMMENT '세번째 달성 횟수',
  `third_currency` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT '세번째 보상',
  `third_quantity` int DEFAULT NULL COMMENT '세번째 보상 수',
  PRIMARY KEY (`ad_no`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='광고 보상 관리';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `com_attendance`
--

DROP TABLE IF EXISTS `com_attendance`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `com_attendance` (
  `attendance_id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(60) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT '내부용 이름',
  `kind` int DEFAULT NULL COMMENT '타입',
  `reset_period` int DEFAULT '0' COMMENT '리셋 기간',
  `from_date` datetime DEFAULT NULL COMMENT '시작일',
  `to_date` datetime DEFAULT NULL COMMENT '끝일',
  `is_public` int DEFAULT '0' COMMENT '공개',
  `is_loop` int DEFAULT '0' COMMENT '반복여부',
  `create_date` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '생성일',
  `update_date` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '수정일',
  PRIMARY KEY (`attendance_id`),
  KEY `com_attendance_from_date_IDX` (`from_date`,`to_date`,`is_public`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=22 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='출석 보상 관리';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `com_attendance_daily`
--

DROP TABLE IF EXISTS `com_attendance_daily`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `com_attendance_daily` (
  `attendance_id` int DEFAULT NULL,
  `day_seq` int DEFAULT NULL COMMENT '일',
  `currency` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT '재화',
  `quantity` int DEFAULT NULL COMMENT '개수',
  KEY `com_attendance_daily_attendance_id_IDX` (`attendance_id`,`day_seq`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='출석 보상 상세';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `com_attendance_season`
--

DROP TABLE IF EXISTS `com_attendance_season`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `com_attendance_season` (
  `season_no` int NOT NULL DEFAULT '0' COMMENT '유일번호',
  `start_date` datetime DEFAULT NULL COMMENT '시작일',
  `end_date` datetime DEFAULT NULL COMMENT '끝일',
  `next_start_date` datetime DEFAULT NULL COMMENT '다음 시작일',
  `next_end_date` datetime DEFAULT NULL COMMENT '다음 끝일'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='연속 출석 주기 관리';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `com_bubble_group`
--

DROP TABLE IF EXISTS `com_bubble_group`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `com_bubble_group` (
  `set_id` int NOT NULL,
  `variation` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT '배리에이션',
  `template` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '템플릿',
  `size` int NOT NULL COMMENT '말풍선 크기1-4',
  `pos` int NOT NULL COMMENT '말풍선 위치1-9',
  `bubble_sprite_id` int NOT NULL DEFAULT '-1' COMMENT '말풍선 본체 스프라이트',
  `outline_sprite_id` int NOT NULL DEFAULT '-1' COMMENT '말풍선 외곽선 스프라이트',
  `pos_x` float NOT NULL DEFAULT '0' COMMENT '말풍선 화면 위치 x좌표',
  `pos_y` float NOT NULL DEFAULT '0' COMMENT '말풍선 화면 위치 y좌표',
  `textarea_left` float NOT NULL DEFAULT '0' COMMENT '텍스트 여백',
  `textarea_right` float NOT NULL DEFAULT '0',
  `textarea_top` float NOT NULL DEFAULT '0',
  `textarea_bottom` float NOT NULL DEFAULT '0',
  `custom_size_x` float NOT NULL DEFAULT '0' COMMENT 'slice일때 사용하는 크기',
  `custom_size_y` float NOT NULL DEFAULT '0',
  `scale_x` float NOT NULL DEFAULT '1',
  `scale_y` float NOT NULL DEFAULT '1',
  `tail_sprite_id` int NOT NULL DEFAULT '-1' COMMENT '말꼬리 스프라이트',
  `tail_outline_sprite_id` int NOT NULL DEFAULT '-1',
  `tail_scale_x` float NOT NULL DEFAULT '1',
  `tail_scale_y` float NOT NULL DEFAULT '1',
  `tail_pos_x` float NOT NULL DEFAULT '0',
  `tail_pos_y` float NOT NULL DEFAULT '0',
  `reverse_tail_sprite_id` int NOT NULL DEFAULT '-1' COMMENT '반전 말꼬리 스프라이트',
  `reverse_tail_outline_sprite_id` int NOT NULL DEFAULT '-1',
  `reverse_tail_scale_x` float NOT NULL DEFAULT '1',
  `reverse_tail_scale_y` float NOT NULL DEFAULT '1',
  `reverse_tail_pos_x` float NOT NULL DEFAULT '0',
  `reverse_tail_pos_y` float NOT NULL DEFAULT '0',
  `font_color` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL DEFAULT '000000ff' COMMENT '폰트 색상',
  `fill_color` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL DEFAULT 'ffffffff' COMMENT '본체 색상',
  `outline_color` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL DEFAULT '000000ff' COMMENT '외곽선 색상',
  `emoticon_pos_x` float NOT NULL DEFAULT '0' COMMENT '이모티콘의 위치 x 좌표 localposition',
  `emoticon_pos_y` float NOT NULL DEFAULT '0',
  `emoticon_scale_x` float NOT NULL DEFAULT '1',
  `emoticon_scale_y` float NOT NULL DEFAULT '1',
  `emoticon_width` int NOT NULL DEFAULT '100' COMMENT '이모티콘 너비',
  `emoticon_height` int NOT NULL DEFAULT '100' COMMENT '이모티콘 높이',
  `tag_sprite_id` int NOT NULL DEFAULT '-1' COMMENT '네임태그 스프라이트 ID',
  `tag_pos_x` float NOT NULL DEFAULT '0' COMMENT '네임태그 위치 x좌표',
  `tag_pos_y` float NOT NULL DEFAULT '0' COMMENT '네임태그 위치 y좌표',
  `serial_no` int NOT NULL AUTO_INCREMENT COMMENT '식별자',
  PRIMARY KEY (`serial_no`),
  UNIQUE KEY `com_bubble_group_un` (`set_id`,`variation`,`template`,`size`,`pos`)
) ENGINE=InnoDB AUTO_INCREMENT=31367 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='말풍선 세트 구성 (그룹)';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `com_bubble_master`
--

DROP TABLE IF EXISTS `com_bubble_master`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `com_bubble_master` (
  `set_id` int NOT NULL AUTO_INCREMENT,
  `set_name` varchar(100) NOT NULL,
  `remark` varchar(500) DEFAULT NULL,
  `sortkey` int NOT NULL DEFAULT '0',
  `bubble_ver` int NOT NULL DEFAULT '1',
  `normal_font_size` int DEFAULT '28' COMMENT '일반 폰트 사이즈',
  `big_font_size` int DEFAULT '36' COMMENT '큰 폰트 사이즈',
  `line_space` int DEFAULT '-30' COMMENT '라인 간격',
  `tag_color_affect` tinyint DEFAULT '0' COMMENT '네임태그가 아웃라인에 영향을 준다',
  `tag_align_type` varchar(20) NOT NULL DEFAULT 'center' COMMENT '네임태그 텍스트 정렬 방식',
  `tag_textarea_left` float NOT NULL DEFAULT '0' COMMENT '네임태그 텍스트영역',
  `tag_textarea_right` float NOT NULL DEFAULT '20' COMMENT '네임태그 텍스트영역',
  `tag_textarea_top` float NOT NULL DEFAULT '-2' COMMENT '네임태그 텍스트영역',
  `tag_textarea_bottom` float NOT NULL DEFAULT '-2' COMMENT '네임태그 텍스트영역',
  `bubble_type` varchar(20) DEFAULT 'body' COMMENT '말풍선 타입 body , half',
  `tag_follow_nametag_color` tinyint DEFAULT '0' COMMENT '네임태그 칼라를 따라가는 태그',
  PRIMARY KEY (`set_id`),
  UNIQUE KEY `com_bubble_master_un` (`set_name`)
) ENGINE=InnoDB AUTO_INCREMENT=54 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='말풍선 세트 마스터';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `com_bubble_sprite`
--

DROP TABLE IF EXISTS `com_bubble_sprite`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `com_bubble_sprite` (
  `bubble_sprite_id` int NOT NULL AUTO_INCREMENT,
  `template` varchar(30) DEFAULT NULL,
  `image_name` varchar(30) NOT NULL,
  `image_url` varchar(160) NOT NULL,
  `image_key` varchar(120) NOT NULL,
  `sortkey` int NOT NULL DEFAULT '0',
  `is_slice` tinyint NOT NULL DEFAULT '0',
  `border_left` float NOT NULL DEFAULT '0',
  `border_right` float NOT NULL DEFAULT '0',
  `border_top` float NOT NULL DEFAULT '0',
  `border_bottom` float NOT NULL DEFAULT '0',
  `bucket` varchar(30) DEFAULT NULL,
  PRIMARY KEY (`bubble_sprite_id`),
  UNIQUE KEY `com_bubble_sprite_un` (`image_name`)
) ENGINE=InnoDB AUTO_INCREMENT=348 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='공통. 말풍선 스프라이트';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `com_build_hash`
--

DROP TABLE IF EXISTS `com_build_hash`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `com_build_hash` (
  `hash_no` int NOT NULL AUTO_INCREMENT COMMENT 'PK',
  `identifier` varchar(60) NOT NULL COMMENT '번들ID',
  `hash_path` varchar(160) NOT NULL COMMENT 'path',
  `hash_code` varchar(160) NOT NULL COMMENT 'code',
  `build_ver` int DEFAULT '0',
  `client_version` varchar(20) DEFAULT NULL COMMENT '클라이언트 버전',
  `package_id` varchar(20) DEFAULT NULL COMMENT '연결 패키지 ID',
  PRIMARY KEY (`hash_no`),
  KEY `com_build_hash_identifier_IDX` (`identifier`,`hash_path`) USING BTREE,
  KEY `com_build_hash_package_id_IDX2` (`package_id`,`client_version`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='빌드 검증용 해시';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `com_coin_exchange_product`
--

DROP TABLE IF EXISTS `com_coin_exchange_product`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `com_coin_exchange_product` (
  `exchange_product_id` int NOT NULL AUTO_INCREMENT COMMENT '환전 ID',
  `star_quantity` int DEFAULT NULL COMMENT '기본 환전',
  `coin_quantity` int DEFAULT NULL COMMENT '코인 환전',
  `bonus_quantity` int DEFAULT NULL COMMENT '보너스 환전',
  `daily_purchase_cnt` int DEFAULT '-1' COMMENT '일일 구매 횟수',
  `is_service` int DEFAULT '0' COMMENT '판매중 여부',
  `create_date` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '생성일',
  PRIMARY KEY (`exchange_product_id`),
  KEY `com_coin_exchange_product_is_service_IDX` (`is_service`,`exchange_product_id`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='코인 환전 테이블';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `com_coin_product`
--

DROP TABLE IF EXISTS `com_coin_product`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `com_coin_product` (
  `coin_product_id` int NOT NULL AUTO_INCREMENT,
  `currency` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT '화폐',
  `price` int DEFAULT NULL COMMENT '판매가격',
  `sale_price` int DEFAULT NULL COMMENT '할인 가격',
  `sale_kind` float DEFAULT NULL COMMENT '할인율',
  `start_date` datetime DEFAULT NULL COMMENT '시작일',
  `end_date` datetime DEFAULT NULL COMMENT '끝일',
  `is_public` int DEFAULT '0' COMMENT '공개여부',
  `is_common` int DEFAULT '0' COMMENT '공용여부',
  `thumbnail_id` int DEFAULT '-1' COMMENT '썸네일',
  `detail_page_id` int DEFAULT '-1' COMMENT '상세 페이지',
  `create_date` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '생성일',
  `product_type` varchar(20) DEFAULT 'free',
  `connected_bg` int DEFAULT '-1',
  PRIMARY KEY (`coin_product_id`),
  KEY `com_coin_product_price_IDX` (`price`) USING BTREE,
  KEY `com_coin_product_start_date_IDX` (`start_date`,`end_date`,`is_public`) USING BTREE,
  KEY `com_coin_product_currency_IDX` (`currency`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=1380 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='코인 상점 마스터';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `com_coin_product_detail`
--

DROP TABLE IF EXISTS `com_coin_product_detail`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `com_coin_product_detail` (
  `coin_product_id` int DEFAULT NULL COMMENT '코인마스터ID',
  `lang` varchar(2) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT '언어',
  `name` varchar(60) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT '상품명',
  UNIQUE KEY `com_coin_product_detail_coin_product_id_IDX` (`coin_product_id`,`lang`) USING BTREE,
  KEY `com_coin_proudct_detail_lang_IDX` (`lang`) USING BTREE,
  KEY `com_coin_product_detail_coin_product_id_IDX_2` (`coin_product_id`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='코인 상품 언어리스트';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `com_coin_product_set`
--

DROP TABLE IF EXISTS `com_coin_product_set`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `com_coin_product_set` (
  `coin_product_id` int DEFAULT NULL COMMENT '코인마스터id',
  `currency` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT '재화',
  KEY `com_coin_product_set_coin_product_id_IDX` (`coin_product_id`) USING BTREE,
  KEY `com_coin_product_set_currency_IDX` (`currency`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='코인 상점 세트 상품';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `com_comming`
--

DROP TABLE IF EXISTS `com_comming`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `com_comming` (
  `comming_id` int NOT NULL AUTO_INCREMENT,
  `image_url` varchar(160) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT 'url',
  `image_key` varchar(120) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT 'key',
  `bucket` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT '버킷',
  `from_date` datetime DEFAULT NULL COMMENT '시작일',
  `to_date` datetime DEFAULT NULL COMMENT '끝일',
  `is_public` int DEFAULT '0' COMMENT '공개여부',
  `create_date` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '생성일',
  `update_date` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '수정일',
  PRIMARY KEY (`comming_id`),
  KEY `com_comming_from_date_IDX` (`from_date`,`to_date`,`is_public`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='커밍순 관리';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `com_comming_lang`
--

DROP TABLE IF EXISTS `com_comming_lang`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `com_comming_lang` (
  `comming_id` int DEFAULT NULL,
  `lang` varchar(2) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT '언어',
  `title` varchar(60) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT '제목',
  UNIQUE KEY `com_comming_lang_comming_id_IDX` (`comming_id`,`lang`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='커밍순 관리 언어별';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `com_coupon_episode`
--

DROP TABLE IF EXISTS `com_coupon_episode`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `com_coupon_episode` (
  `coupon_id` int DEFAULT NULL COMMENT '쿠폰 ID',
  `episode_id` int DEFAULT NULL COMMENT '해금되는 스페셜 에피소드 ID',
  UNIQUE KEY `com_coupon_episode_un` (`coupon_id`,`episode_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='쿠폰으로 해금되는 스페셜 에피소드';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `com_coupon_master`
--

DROP TABLE IF EXISTS `com_coupon_master`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `com_coupon_master` (
  `coupon_id` int NOT NULL AUTO_INCREMENT COMMENT '쿠폰 ID 식별자',
  `coupon_name` varchar(60) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '쿠폰 이름',
  `coupon_type` varchar(20) NOT NULL COMMENT '쿠폰 종류',
  `keyword` varchar(20) DEFAULT NULL COMMENT '키워드(키워드 타입일때만 사용)',
  `start_date` datetime NOT NULL COMMENT '쿠폰 시작일시',
  `end_date` datetime NOT NULL COMMENT '쿠폰 종료일시',
  `use_limit` int NOT NULL DEFAULT '1' COMMENT '유저당 사용 가능 횟수',
  `issue_count` int NOT NULL COMMENT '발급 수량(키워드는 사용 가능 횟수)',
  `issue_date` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '발급 일자',
  `remain_keyword_count` int DEFAULT NULL COMMENT '잔여 키워드 사용 가능 횟수',
  `admin_id` varchar(30) DEFAULT NULL COMMENT '최종 수정자',
  `project_id` int NOT NULL DEFAULT '-1',
  `unlock_dlc_id` int NOT NULL DEFAULT '-1',
  PRIMARY KEY (`coupon_id`),
  KEY `com_coupon_master_start_date_IDX` (`start_date`,`end_date`,`coupon_type`,`keyword`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=131 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='쿠폰 마스터';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `com_coupon_reward`
--

DROP TABLE IF EXISTS `com_coupon_reward`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `com_coupon_reward` (
  `coupon_id` int NOT NULL COMMENT '쿠폰ID',
  `currency` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '재화',
  `quantity` int DEFAULT NULL COMMENT '개수',
  PRIMARY KEY (`coupon_id`,`currency`),
  KEY `com_coupon_reward_coupon_id_IDX` (`coupon_id`) USING BTREE,
  KEY `com_coupon_reward_currency_IDX` (`currency`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='쿠폰의 재화 정보';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `com_coupon_serial`
--

DROP TABLE IF EXISTS `com_coupon_serial`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `com_coupon_serial` (
  `coupon_id` int NOT NULL COMMENT '엄마 쿠폰 ID',
  `serial` varchar(20) NOT NULL COMMENT '시리얼 코드',
  UNIQUE KEY `com_coupon_serial_un` (`coupon_id`,`serial`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='쿠폰 시리얼';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `com_culture`
--

DROP TABLE IF EXISTS `com_culture`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `com_culture` (
  `culture_id` varchar(20) NOT NULL COMMENT '문화권 ID',
  `culture_name` varchar(30) DEFAULT NULL COMMENT '문화명',
  `country_code` varchar(10) DEFAULT NULL COMMENT '2자리 국가코드',
  `lang` varchar(10) DEFAULT NULL COMMENT '언어코드',
  UNIQUE KEY `com_culture_culture_id_IDX` (`culture_id`,`country_code`,`lang`) USING BTREE,
  UNIQUE KEY `com_culture_lang_IDX` (`lang`) USING BTREE,
  UNIQUE KEY `com_culture_country_code_IDX` (`country_code`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='문화권 설정';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `com_currency`
--

DROP TABLE IF EXISTS `com_currency`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `com_currency` (
  `currency` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '재화코드',
  `origin_name` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '재화이름',
  `connected_project` int NOT NULL DEFAULT '-1' COMMENT '연결 프로젝트',
  `is_unique` tinyint NOT NULL DEFAULT '0' COMMENT '1개만 가질 수 있음',
  `consumable` tinyint NOT NULL DEFAULT '1' COMMENT '소비성 화폐',
  `mission_reward` tinyint NOT NULL DEFAULT '0' COMMENT '미션 리워드 가능',
  `currency_type` varchar(30) DEFAULT NULL COMMENT '재화 타입',
  `local_code` int NOT NULL DEFAULT '-1' COMMENT '언어코드',
  `sortkey` int NOT NULL DEFAULT '9999',
  `is_use` tinyint NOT NULL DEFAULT '1' COMMENT '현재 사용 여부',
  `is_coin` int DEFAULT '0' COMMENT '코인 상점 사용 여부',
  `icon_image_id` int NOT NULL DEFAULT '-1' COMMENT '아이콘 이미지',
  `resource_image_id` int NOT NULL DEFAULT '-1' COMMENT '리소스 이미지',
  `is_ability` tinyint NOT NULL DEFAULT '0',
  `model_id` int NOT NULL DEFAULT '-1' COMMENT '연결덴 모델 ID',
  `dev_name` varchar(60) DEFAULT NULL COMMENT '내부용 이름',
  `create_date` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '생성일',
  `update_date` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '수정일',
  `updated` tinyint DEFAULT '0',
  `last_updated` datetime DEFAULT CURRENT_TIMESTAMP,
  `last_deployed` datetime DEFAULT NULL,
  PRIMARY KEY (`currency`),
  KEY `com_currency_connected_project_IDX` (`connected_project`,`currency_type`) USING BTREE,
  KEY `com_currency_currency_type_IDX` (`currency_type`,`icon_image_id`) USING BTREE,
  KEY `com_currency_is_use_IDX` (`is_use`,`local_code`,`icon_image_id`,`resource_image_id`) USING BTREE,
  KEY `com_currency_update_date_IDX` (`update_date`) USING BTREE,
  KEY `com_currency_origin_name_IDX` (`origin_name`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='재화 기준정보 테이블';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `com_currency_ability`
--

DROP TABLE IF EXISTS `com_currency_ability`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `com_currency_ability` (
  `currency` varchar(20) NOT NULL COMMENT '연결된 재화코드',
  `ability_id` int NOT NULL COMMENT '능력 아이디',
  `add_value` int NOT NULL DEFAULT '0' COMMENT '추가되는 능력 수치',
  UNIQUE KEY `com_currency_ability_currency_IDX` (`currency`,`ability_id`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `com_currency_bubble`
--

DROP TABLE IF EXISTS `com_currency_bubble`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `com_currency_bubble` (
  `currency` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT '재화 id',
  `lang` varchar(2) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT '언어',
  `bubble` varchar(1000) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT '대사',
  UNIQUE KEY `com_currency_bubble_currency_IDX` (`currency`,`lang`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='언어별 대사';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `com_daily_mission`
--

DROP TABLE IF EXISTS `com_daily_mission`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `com_daily_mission` (
  `mission_no` int NOT NULL AUTO_INCREMENT COMMENT '미션 번호',
  `content_id` int DEFAULT '-1' COMMENT '내용 설명',
  `limit_count` int DEFAULT '0' COMMENT '제한 횟수',
  `is_active` int DEFAULT '0' COMMENT '활성화',
  `currency` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT '재화',
  `quantity` int DEFAULT NULL COMMENT '개수',
  `dev_name` varchar(60) DEFAULT NULL COMMENT '내부용 이름',
  PRIMARY KEY (`mission_no`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='일일 미션 관리';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `com_deploy_tables`
--

DROP TABLE IF EXISTS `com_deploy_tables`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `com_deploy_tables` (
  `deploy_type` varchar(20) DEFAULT NULL COMMENT '배포 타입',
  `table_name` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT '테이블 이름',
  UNIQUE KEY `com_deploy_tables_un` (`deploy_type`,`table_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='배포 대상 테이블';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `com_ending_hint`
--

DROP TABLE IF EXISTS `com_ending_hint`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `com_ending_hint` (
  `ending_no` bigint NOT NULL AUTO_INCREMENT COMMENT '유일번호',
  `project_id` int DEFAULT NULL COMMENT '작품id',
  `ending_id` int DEFAULT NULL COMMENT '엔딩id',
  `title` varchar(60) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT '제목',
  `unlock_scenes` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci COMMENT '상황id',
  `ability_condition` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT '능력치 조건',
  `currency` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT '재화',
  `price` int DEFAULT NULL COMMENT '가격',
  `memo` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci COMMENT '메모',
  PRIMARY KEY (`ending_no`),
  KEY `com_ending_hint_project_id_IDX` (`project_id`,`ending_id`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=1366 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='엔딩 힌트';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `com_freepass`
--

DROP TABLE IF EXISTS `com_freepass`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `com_freepass` (
  `freepass_no` int NOT NULL AUTO_INCREMENT,
  `project_id` varchar(100) DEFAULT NULL COMMENT '프로젝트 ID',
  `freepass_name` varchar(30) DEFAULT NULL COMMENT '프리패스 이름',
  `appear_point` int DEFAULT NULL COMMENT '등장 시점 (에피소드 구매 개수 / -1)',
  `discount` float DEFAULT NULL COMMENT '할인율',
  `timedeal_min` int DEFAULT NULL COMMENT '타임딜 시간(분) 무제한은 -1',
  `start_date` datetime DEFAULT NULL COMMENT '시작시간',
  `end_date` datetime DEFAULT NULL COMMENT '종료시간',
  UNIQUE KEY `com_freepass_un` (`freepass_no`),
  KEY `com_freepass_project_id_IDX` (`project_id`,`start_date`,`end_date`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='프리패스';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `com_grade`
--

DROP TABLE IF EXISTS `com_grade`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `com_grade` (
  `grade_id` int NOT NULL AUTO_INCREMENT COMMENT '등급id',
  `grade` int DEFAULT NULL COMMENT '등급',
  `keep_point` int DEFAULT NULL COMMENT '유지 포인트',
  `upgrade_point` int DEFAULT NULL COMMENT '승급 포인트',
  `store_sale` int DEFAULT NULL COMMENT '추가 재화(%)',
  `store_limit` int DEFAULT '0' COMMENT '추가 재화 제한',
  `waiting_sale` int DEFAULT NULL COMMENT '기다무 할인율',
  `preview` tinyint(1) DEFAULT NULL COMMENT '연재분 미리보기',
  `create_date` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '생성일',
  `update_date` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '수정일',
  PRIMARY KEY (`grade_id`),
  KEY `com_grade_grade_IDX` (`grade`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=40 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='등급제';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `com_grade_lang`
--

DROP TABLE IF EXISTS `com_grade_lang`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `com_grade_lang` (
  `grade_id` int DEFAULT NULL COMMENT '등급id',
  `lang` varchar(2) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT '언어',
  `name` varchar(60) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT '이름',
  `grade_icon_id` int DEFAULT '-1' COMMENT '아이콘 이미지',
  UNIQUE KEY `com_grade_lang_grade_id_IDX` (`grade_id`,`lang`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='등급제 아이콘 이미지';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `com_grade_season`
--

DROP TABLE IF EXISTS `com_grade_season`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `com_grade_season` (
  `days` int DEFAULT NULL COMMENT '기간',
  `start_date` datetime DEFAULT NULL COMMENT '현 시즌 시작일',
  `end_date` datetime DEFAULT NULL COMMENT '현 시즌 끝일',
  `next_start_date` datetime DEFAULT NULL COMMENT '다음 시즌 시작일',
  `next_end_date` datetime DEFAULT NULL COMMENT '다음 시즌 끝일',
  `season_no` int NOT NULL DEFAULT '0',
  PRIMARY KEY (`season_no`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='등급 시즌제 관리';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `com_hashtag`
--

DROP TABLE IF EXISTS `com_hashtag`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `com_hashtag` (
  `hashtag_no` int NOT NULL AUTO_INCREMENT COMMENT '일렬번호',
  `tag_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '태그명',
  `lang_code` int NOT NULL DEFAULT '-1' COMMENT '다국어 아이디',
  PRIMARY KEY (`hashtag_no`),
  UNIQUE KEY `com_hashtag_un` (`tag_name`)
) ENGINE=InnoDB AUTO_INCREMENT=33 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='해쉬태그 마스터';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `com_ifyou_pass`
--

DROP TABLE IF EXISTS `com_ifyou_pass`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `com_ifyou_pass` (
  `ifyou_pass_id` int NOT NULL AUTO_INCREMENT COMMENT '일렬번호',
  `selection_sale` int DEFAULT NULL COMMENT '유료 선택지 할인율',
  `star_directly_count` int DEFAULT NULL COMMENT '즉시 지급',
  `star_daily_count` int DEFAULT NULL COMMENT '매일 지급',
  `dev_name` varchar(30) DEFAULT NULL COMMENT '내부용 이름',
  PRIMARY KEY (`ifyou_pass_id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='이프유 패스 관리';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `com_intro`
--

DROP TABLE IF EXISTS `com_intro`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `com_intro` (
  `intro_no` int NOT NULL AUTO_INCREMENT COMMENT '유일번호',
  `color_rgb` varchar(8) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT '색상',
  `connected_project_id` int DEFAULT '-1' COMMENT '연결 작품',
  `character_msg` int DEFAULT '-1' COMMENT '캐릭터 문구',
  `public_msg` int DEFAULT '-1' COMMENT '홍보 문구',
  `image_id` int DEFAULT '-1' COMMENT '이미지',
  PRIMARY KEY (`intro_no`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='인트로 관리';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `com_level_management`
--

DROP TABLE IF EXISTS `com_level_management`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `com_level_management` (
  `next_level` int NOT NULL AUTO_INCREMENT COMMENT '다음 레벨',
  `experience` int DEFAULT NULL COMMENT '획들할 경험치',
  `currency` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT '보상 재화',
  `quantity` int DEFAULT NULL COMMENT '개수',
  `create_date` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '생성일',
  `update_date` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '수정일',
  PRIMARY KEY (`next_level`)
) ENGINE=InnoDB AUTO_INCREMENT=103 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='레벨별 관리';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `com_localize`
--

DROP TABLE IF EXISTS `com_localize`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `com_localize` (
  `id` int NOT NULL COMMENT '텍스트ID',
  `KO` varchar(300) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT 'Korean',
  `EN` varchar(300) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT 'English',
  `JA` varchar(300) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT 'Japan',
  `ZH` varchar(300) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT '-' COMMENT '중국-번체',
  `SC` varchar(300) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT '-' COMMENT '중국-간체',
  `AR` varchar(300) DEFAULT '-' COMMENT '아랍어',
  `MS` varchar(300) DEFAULT '-' COMMENT '말레이어',
  `ES` varchar(300) DEFAULT '-' COMMENT '스페인어',
  `RU` varchar(300) DEFAULT '-',
  UNIQUE KEY `com_localize_un` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='로컬라이징 텍스트 테이블 (이프유 플랫폼)';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `com_localize_back`
--

DROP TABLE IF EXISTS `com_localize_back`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `com_localize_back` (
  `id` int NOT NULL COMMENT '텍스트ID',
  `KO` varchar(300) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT 'Korean',
  `EN` varchar(300) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT 'English',
  `JA` varchar(300) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT 'Japan',
  `ZH` varchar(300) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT '-' COMMENT '중국-번체',
  `SC` varchar(300) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT '-' COMMENT '중국-간체',
  `AR` varchar(300) DEFAULT '-' COMMENT '아랍어',
  `MS` varchar(300) DEFAULT '-' COMMENT '말레이어',
  `ES` varchar(300) DEFAULT '-' COMMENT '스페인어',
  `RU` varchar(300) DEFAULT '-',
  UNIQUE KEY `com_localize_un_back` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='로컬라이징 텍스트 테이블';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `com_main_category`
--

DROP TABLE IF EXISTS `com_main_category`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `com_main_category` (
  `category_id` int NOT NULL AUTO_INCREMENT COMMENT '일렬번호',
  `name` int DEFAULT '-1' COMMENT '타이틀 다국어 id',
  `project_kind` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT '작품 선정',
  `array_kind` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT '배열',
  `project_cnt` int DEFAULT '0' COMMENT '작품수',
  `genre` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT '장르',
  `rank_kind` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT '순위 방식',
  `is_public` tinyint DEFAULT '0' COMMENT '공개여부',
  `is_favorite` tinyint DEFAULT '0' COMMENT '관심작품 수 표출',
  `is_view` tinyint DEFAULT '0' COMMENT '조회수 표출',
  `sortkey` int DEFAULT '0' COMMENT '정렬키',
  PRIMARY KEY (`category_id`),
  KEY `com_main_category_sortkey_IDX` (`sortkey`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=25 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='메인 카테고리';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `com_main_category_project`
--

DROP TABLE IF EXISTS `com_main_category_project`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `com_main_category_project` (
  `category_id` int DEFAULT NULL COMMENT '카테고리id',
  `project_id` int DEFAULT NULL COMMENT '작품id',
  `sortkey` int DEFAULT NULL COMMENT '정렬키',
  UNIQUE KEY `com_main_category_project_category_id_IDX` (`category_id`,`project_id`) USING BTREE,
  KEY `com_main_category_project_sortkey_IDX` (`sortkey`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='작품 리스트(수동 설정인 경우)';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `com_model`
--

DROP TABLE IF EXISTS `com_model`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `com_model` (
  `model_id` int NOT NULL AUTO_INCREMENT,
  `model_name` varchar(20) NOT NULL COMMENT '식별용 이름',
  `offset_x` float NOT NULL DEFAULT '0' COMMENT '위치 오프셋',
  `offset_y` float NOT NULL DEFAULT '0',
  `game_scale` float NOT NULL DEFAULT '1' COMMENT '게임내에서 사용하는 scale',
  `model_ver` int NOT NULL DEFAULT '1' COMMENT '모델 버전',
  `model_type` varchar(20) NOT NULL COMMENT '모델 타입(배너, 상세페이지 등등)',
  UNIQUE KEY `com_model_un` (`model_id`),
  KEY `com_model_model_type_IDX` (`model_type`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='공통 애니메이션 모델 테이블';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `com_model_detail`
--

DROP TABLE IF EXISTS `com_model_detail`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `com_model_detail` (
  `model_id` int NOT NULL,
  `file_url` varchar(160) NOT NULL,
  `file_key` varchar(160) NOT NULL,
  `file_name` varchar(120) NOT NULL,
  `motion_name` varchar(20) DEFAULT NULL COMMENT '모션 이름'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='플랫폼 공용 모델 상세';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `com_notice`
--

DROP TABLE IF EXISTS `com_notice`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `com_notice` (
  `notice_no` int NOT NULL AUTO_INCREMENT COMMENT 'primary_key',
  `notice_type` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '타입(이벤트, 공지사항)',
  `notice_name` varchar(60) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '공지 이름',
  `sortkey` int NOT NULL DEFAULT '0' COMMENT '정렬키',
  `is_public` tinyint NOT NULL DEFAULT '0' COMMENT '공개여부 true,false',
  `start_date` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '시작일자',
  `end_date` datetime NOT NULL COMMENT '종료일자',
  `os` varchar(10) NOT NULL DEFAULT 'all' COMMENT '노출 OS',
  `exception_country` varchar(30) DEFAULT NULL COMMENT '제외 국가',
  `exception_culture` varchar(100) DEFAULT NULL COMMENT '제외 문화권',
  `connected_project` int DEFAULT '-1',
  `last_updated` datetime DEFAULT CURRENT_TIMESTAMP,
  `deployed` tinyint DEFAULT '0',
  PRIMARY KEY (`notice_no`),
  KEY `com_notice_start_date_IDX` (`start_date`,`end_date`,`is_public`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=155 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='이벤트 및 공지사항 테이블';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `com_notice_detail`
--

DROP TABLE IF EXISTS `com_notice_detail`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `com_notice_detail` (
  `notice_no` int NOT NULL COMMENT '공지사항 식별자',
  `lang` varchar(20) NOT NULL COMMENT '언어',
  `title` varchar(60) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT '타이틀',
  `contents` varchar(1200) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT '상세내용',
  `design_id` int NOT NULL DEFAULT '-1' COMMENT '배너 ID',
  `url_link` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT 'URL Link',
  `detail_design_id` int NOT NULL DEFAULT '-1' COMMENT '상세 내용 이미지',
  UNIQUE KEY `com_notice_detail_un` (`notice_no`,`lang`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='공지사항 언어별 상세정보';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `com_notice_package`
--

DROP TABLE IF EXISTS `com_notice_package`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `com_notice_package` (
  `notice_no` int DEFAULT NULL COMMENT '공지사항 ID',
  `project_id` int DEFAULT '-1' COMMENT '프로젝트 ID',
  UNIQUE KEY `com_notice_package_notice_no_IDX` (`notice_no`,`project_id`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COMMENT='공지사항을 보여줄 패키지 프로젝트';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `com_package`
--

DROP TABLE IF EXISTS `com_package`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `com_package` (
  `package` varchar(60) NOT NULL,
  `version` int DEFAULT '1' COMMENT '라이브 버전',
  `package_type` varchar(30) DEFAULT NULL COMMENT '패키지 타입',
  `test_url` varchar(120) DEFAULT NULL,
  `live_url` varchar(120) DEFAULT NULL,
  `limit_version` int NOT NULL DEFAULT '0',
  PRIMARY KEY (`package`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='패키지 정보 관리';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `com_package_client`
--

DROP TABLE IF EXISTS `com_package_client`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `com_package_client` (
  `package_id` varchar(20) NOT NULL COMMENT '패키지 ID',
  `os_type` varchar(20) NOT NULL COMMENT 'android / ios',
  `client_version` varchar(20) NOT NULL COMMENT '클라이언트 버전',
  `client_status` varchar(20) NOT NULL COMMENT '클라이언트 상태',
  `custom_url` varchar(160) DEFAULT NULL COMMENT '커스텀 URL',
  `app_store` varchar(30) NOT NULL COMMENT '타겟 앱스토어',
  `memo` varchar(120) DEFAULT NULL COMMENT '메모',
  `client_no` int NOT NULL AUTO_INCREMENT COMMENT 'PK 식별자',
  PRIMARY KEY (`client_no`),
  UNIQUE KEY `NewTable_package_id_IDX` (`package_id`,`os_type`,`app_store`,`client_version`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=29 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='패키지 클라이언트 정보';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `com_package_localize`
--

DROP TABLE IF EXISTS `com_package_localize`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `com_package_localize` (
  `text_id` int NOT NULL COMMENT '텍스트ID',
  `category` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL DEFAULT '-' COMMENT '분류',
  `KO` varchar(300) DEFAULT '-' COMMENT 'Korean',
  `EN` varchar(300) DEFAULT '-' COMMENT 'English',
  `JA` varchar(300) DEFAULT '-' COMMENT 'Japan',
  `ZH` varchar(300) DEFAULT '-' COMMENT '중국-번체',
  `SC` varchar(300) DEFAULT '-' COMMENT '중국-간체',
  `AR` varchar(300) DEFAULT '-' COMMENT '아랍어',
  `MS` varchar(300) DEFAULT '-' COMMENT '말레이어',
  `ES` varchar(300) DEFAULT '-' COMMENT '스페인어',
  `RU` varchar(300) DEFAULT '-' COMMENT '러시아',
  `ID` varchar(300) DEFAULT '-' COMMENT '인도네시아',
  `memo` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT '메모',
  `updated` tinyint NOT NULL DEFAULT '0',
  `last_updated` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `com_localize_un` (`text_id`),
  KEY `com_package_localize_category_IDX` (`category`,`text_id`) USING BTREE,
  KEY `com_package_localize_updated_IDX` (`updated` DESC,`text_id`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='로컬라이징 텍스트 테이블';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `com_package_master`
--

DROP TABLE IF EXISTS `com_package_master`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `com_package_master` (
  `package_id` varchar(20) NOT NULL COMMENT '자동생성되는 패키지 식별자',
  `package_name` varchar(40) NOT NULL COMMENT '패키지 이름',
  `package_summary` varchar(120) DEFAULT NULL COMMENT '패키지 설명',
  `bundle_id` varchar(60) DEFAULT NULL COMMENT '앱 번들 ID',
  `install_url` varchar(160) DEFAULT NULL COMMENT '설치 URL(원링크)',
  `test_server_url` varchar(160) DEFAULT NULL COMMENT '테스트 서버 URL',
  `review_server_url` varchar(160) DEFAULT NULL COMMENT '심사 서버 URL',
  `live_server_url` varchar(160) DEFAULT NULL COMMENT '라이브 서버 URL',
  `project_id` int NOT NULL DEFAULT '-1' COMMENT '연결 프로젝트ID',
  `require_hash_check` tinyint NOT NULL DEFAULT '0',
  `create_date` datetime DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `com_package_master_package_id_IDX` (`package_id`) USING BTREE,
  KEY `com_package_master_project_id_IDX` (`project_id`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='패키지 시스템 마스터';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `com_premium_detail`
--

DROP TABLE IF EXISTS `com_premium_detail`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `com_premium_detail` (
  `detail_no` int NOT NULL AUTO_INCREMENT COMMENT '일렬번호',
  `premium_id` int DEFAULT NULL COMMENT '마스터id',
  `chapter_number` int DEFAULT NULL COMMENT '에피소드 순번',
  `free_currency` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT '무료 재화',
  `free_quantity` int DEFAULT NULL COMMENT '무료 개수',
  `premium_currency` varchar(20) DEFAULT NULL COMMENT '프리미엄 재화',
  `premium_quantity` int DEFAULT NULL COMMENT '프리미엄 개수',
  PRIMARY KEY (`detail_no`),
  KEY `com_premium_detail_premium_id_IDX` (`premium_id`) USING BTREE,
  KEY `com_premium_detail_chapter_number_IDX` (`chapter_number`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=860 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='프리미엄 패스 관리(상세)';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `com_premium_master`
--

DROP TABLE IF EXISTS `com_premium_master`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `com_premium_master` (
  `premium_id` int NOT NULL AUTO_INCREMENT COMMENT '일렬번호',
  `project_id` int DEFAULT NULL COMMENT '작품id',
  `product_id` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT '금액 설정',
  `product_price` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT '가격',
  `sale_id` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT '할인 설정',
  `sale_price` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT '할인 가격',
  `step` int DEFAULT NULL COMMENT '단계 설정',
  PRIMARY KEY (`premium_id`),
  UNIQUE KEY `com_premium_master_project_id_IDX` (`project_id`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=26 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='프리미엄 패스 관리(마스터)';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `com_premium_timedeal`
--

DROP TABLE IF EXISTS `com_premium_timedeal`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `com_premium_timedeal` (
  `timedeal_id` int NOT NULL AUTO_INCREMENT COMMENT '유일번호',
  `conditions` int DEFAULT '0' COMMENT '조건(0:에피소드 진행률, 1 : 히든엔딩)',
  `discount` int DEFAULT NULL COMMENT '추가 할인율',
  `deadline` int DEFAULT NULL COMMENT '타임딜 유효시간(분)',
  `episode_progress` int DEFAULT '0' COMMENT '에피소드 진행률',
  `create_date` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '생성일',
  `update_date` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '수정일',
  PRIMARY KEY (`timedeal_id`)
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='프리미엄 패스 타임 딜';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `com_prize_ticket`
--

DROP TABLE IF EXISTS `com_prize_ticket`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `com_prize_ticket` (
  `prize_id` int NOT NULL AUTO_INCREMENT,
  `prize_name` varchar(30) NOT NULL,
  `quantity` int NOT NULL DEFAULT '0' COMMENT '상품 수량',
  `project_id` int NOT NULL DEFAULT '-1' COMMENT '연결 프로젝트',
  `apply_condition` varchar(20) NOT NULL DEFAULT 'none' COMMENT '응모 조건',
  `condition_figure` int NOT NULL DEFAULT '0',
  `require_coin` int NOT NULL DEFAULT '1' COMMENT '응모에 필요한 코인 수량',
  `odds` float NOT NULL DEFAULT '0' COMMENT '확률. 백만분율',
  `image_id` int NOT NULL DEFAULT '-1' COMMENT '상품 이미지 ID',
  `start_date` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '시작일자',
  `end_date` datetime NOT NULL DEFAULT '9999-12-31 00:00:00' COMMENT '종료일자',
  `sortkey` int NOT NULL DEFAULT '100' COMMENT '정렬순서',
  UNIQUE KEY `com_prize_ticket_un` (`prize_id`),
  KEY `com_prize_ticket_project_id_IDX` (`project_id`,`start_date`,`end_date`) USING BTREE,
  KEY `com_prize_ticket_start_date_IDX` (`start_date`,`end_date`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=126 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='응모권 교환소 기준정보';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `com_product_detail`
--

DROP TABLE IF EXISTS `com_product_detail`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `com_product_detail` (
  `master_id` int DEFAULT NULL COMMENT 'master 연결 id',
  `currency` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT '상품 화폐 종류',
  `is_main` int DEFAULT '0' COMMENT '메인/보너스 구분',
  `quantity` int DEFAULT NULL COMMENT '상품 개수',
  `first_purchase` tinyint DEFAULT '0' COMMENT '첫 구매 보너스 여부',
  `product_detail_no` int NOT NULL AUTO_INCREMENT COMMENT 'detail primary key',
  PRIMARY KEY (`product_detail_no`),
  KEY `com_produt_detail_master_id_IDX` (`master_id`) USING BTREE,
  KEY `com_produt_detail_currency_IDX` (`currency`) USING BTREE,
  KEY `com_produt_detail_is_main_IDX` (`is_main`) USING BTREE,
  KEY `com_product_detail_first_purchase_IDX` (`first_purchase`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=84 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='상품 정보 detail';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `com_product_lang`
--

DROP TABLE IF EXISTS `com_product_lang`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `com_product_lang` (
  `master_id` int DEFAULT NULL,
  `lang` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT '언어',
  `title` varchar(60) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT '언어별 상품 이름',
  `banner_id` int DEFAULT '-1' COMMENT '상품 배너 이미지',
  `detail_image_id` int DEFAULT '-1' COMMENT '상품 상세 설명 이미지',
  KEY `com_product_lang_master_id_IDX` (`master_id`) USING BTREE,
  KEY `com_product_lang_lang_IDX` (`lang`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='언어별 상품 이미지';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `com_product_master`
--

DROP TABLE IF EXISTS `com_product_master`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `com_product_master` (
  `product_master_id` int NOT NULL AUTO_INCREMENT,
  `product_id` varchar(20) DEFAULT NULL COMMENT '인앱상품ID',
  `name` varchar(60) DEFAULT NULL COMMENT '상품명',
  `product_type` varchar(20) DEFAULT NULL COMMENT '상품종류',
  `from_date` datetime DEFAULT NULL,
  `to_date` datetime DEFAULT NULL,
  `max_count` int DEFAULT NULL COMMENT '최대 구매 개수',
  `bonus_name` varchar(60) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT '보너스 문구',
  `is_public` int DEFAULT '0' COMMENT '공개여부',
  `create_date` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '등록일',
  `exception_country` varchar(30) DEFAULT NULL COMMENT '제외 국가',
  `exception_culture` varchar(100) DEFAULT NULL COMMENT '제외 문화',
  `project_id` int NOT NULL DEFAULT '-1',
  `admin_id` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT '최종 수정자',
  `deployed` tinyint DEFAULT '0' COMMENT '라이브 배포 여부',
  `last_updated` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '마지막 수정일시',
  PRIMARY KEY (`product_master_id`),
  KEY `com_product_master_product_id_IDX` (`product_id`,`from_date`,`to_date`) USING BTREE,
  KEY `com_product_master_from_date_IDX` (`from_date`,`to_date`,`is_public`) USING BTREE,
  KEY `com_product_master_package_IDX` (`project_id`,`is_public`,`from_date`,`to_date`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=193 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='상품 정보 master';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `com_profile_lines`
--

DROP TABLE IF EXISTS `com_profile_lines`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `com_profile_lines` (
  `ability_id` int DEFAULT NULL,
  `line_id` int DEFAULT NULL,
  `motion_id` int DEFAULT NULL,
  `condition_type` tinyint DEFAULT NULL COMMENT '0:조건없음, 1:능력치, 2:날짜',
  `line_condition` varchar(80) DEFAULT NULL COMMENT '조건 텍스트',
  `sound_name` varchar(30) DEFAULT NULL,
  UNIQUE KEY `com_profile_lines_un` (`ability_id`,`line_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='프로필 캐릭터 대사';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `com_prohibited_words`
--

DROP TABLE IF EXISTS `com_prohibited_words`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `com_prohibited_words` (
  `prohibited_words` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT '금칙어',
  UNIQUE KEY `com_prohibited_words_prohibited_words_IDX` (`prohibited_words`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='금칙어 모음';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `com_promotion`
--

DROP TABLE IF EXISTS `com_promotion`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `com_promotion` (
  `promotion_no` int NOT NULL AUTO_INCREMENT,
  `title` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT '이미지명',
  `is_public` int DEFAULT '0' COMMENT '공개여부',
  `start_date` datetime DEFAULT NULL COMMENT '시작일',
  `end_date` datetime DEFAULT NULL COMMENT '끝일',
  `promotion_type` varchar(7) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT '타입',
  `location` varchar(5) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT '경로',
  `sortkey` int DEFAULT '999' COMMENT '정렬',
  `create_date` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '생성일',
  `os` varchar(10) NOT NULL DEFAULT 'all',
  `exception_country` varchar(30) DEFAULT NULL COMMENT '제외 국가',
  `exception_culture` varchar(100) DEFAULT NULL COMMENT '제외 문화권',
  PRIMARY KEY (`promotion_no`),
  KEY `com_promotion_start_date_IDX` (`start_date`,`end_date`,`is_public`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=128 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='프로모션 마스터';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `com_promotion_detail`
--

DROP TABLE IF EXISTS `com_promotion_detail`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `com_promotion_detail` (
  `promotion_no` int NOT NULL,
  `lang` varchar(2) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '언어',
  `design_id` int DEFAULT '-1' COMMENT '연결 리소스',
  KEY `com_promotion_detail_promotion_no_IDX` (`promotion_no`) USING BTREE,
  KEY `com_promotion_detail_lang_IDX` (`lang`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='프로모션 디테일';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `com_server`
--

DROP TABLE IF EXISTS `com_server`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `com_server` (
  `server_no` int NOT NULL AUTO_INCREMENT,
  `name` varchar(30) DEFAULT NULL,
  `local_ver` int DEFAULT '1' COMMENT '버전',
  `coin_url` varchar(120) DEFAULT NULL COMMENT '응모권 시스템 URL',
  `coin_url_use` tinyint NOT NULL DEFAULT '0' COMMENT '응모권 시스템 사용여부',
  `allow_missing_resource` tinyint NOT NULL DEFAULT '1' COMMENT '없는 리소스 허용 여부',
  `max_ad_charge` int NOT NULL DEFAULT '5' COMMENT '무료충전소 이용제한횟수',
  `coinshop_url` varchar(120) DEFAULT NULL COMMENT '코인샵 URL',
  `first_reset_price` int NOT NULL DEFAULT '100' COMMENT '초기 리셋 비용(코인)',
  `reset_increment_rate` int NOT NULL DEFAULT '20' COMMENT '리셋 비용 증가비율',
  `privacy_url` varchar(120) DEFAULT NULL COMMENT '개인정보 보호정책',
  `terms_url` varchar(120) DEFAULT NULL COMMENT '이용약관',
  `contents_url` varchar(120) DEFAULT NULL COMMENT '리소스 저장소 URL',
  `open_price_per` int NOT NULL DEFAULT '20' COMMENT '에피소드 해금 10분당 코인가격',
  `reduce_waiting_time_ad` int DEFAULT '10' COMMENT '광고 보면 줄어드는 에피소드 오픈 대기시간',
  `project_notify` tinyint NOT NULL DEFAULT '0' COMMENT '작품 알림 설정 사용여부',
  `remove_ad_price` int NOT NULL DEFAULT '100' COMMENT '작품 광고 제거 비용',
  `copyright_url` varchar(120) DEFAULT NULL COMMENT '저작권URL',
  `survey_url` varchar(120) DEFAULT NULL COMMENT '설문조사 URL',
  PRIMARY KEY (`server_no`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='플랫폼 서비스 서버 정보';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `com_sound_management`
--

DROP TABLE IF EXISTS `com_sound_management`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `com_sound_management` (
  `main_bgm_project_id` int DEFAULT '-1' COMMENT '메인 BGM 작품 id',
  `main_bgm_sound_id` int DEFAULT '-1' COMMENT '메인 BGM 배경 음악',
  `positive_sound_id` int DEFAULT '-1' COMMENT '긍정 sfx',
  `negative_sound_id` int DEFAULT '-1' COMMENT '부정 sfx',
  `claim_sound_id` int DEFAULT '-1' COMMENT '재화(보상) 획득 sfx',
  `exp_up_sound_id` int DEFAULT '-1' COMMENT '경험치 상승(승급) sfx',
  `grade_up_sound_id` int DEFAULT '-1' COMMENT '등급업 sfx'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='사운드 관리';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `com_survey`
--

DROP TABLE IF EXISTS `com_survey`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `com_survey` (
  `survey_id` int NOT NULL AUTO_INCREMENT COMMENT '일렬번호',
  `title` int DEFAULT '-1' COMMENT '항목명 다국어 id',
  `start_date` datetime DEFAULT NULL COMMENT '시작일',
  `end_date` datetime DEFAULT NULL COMMENT '끝일',
  `currency` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT '보상 재화',
  `quantity` int DEFAULT NULL COMMENT '보상 개수',
  `is_public` tinyint DEFAULT '0' COMMENT '공개여부',
  `exception_country` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT '국가 제한',
  PRIMARY KEY (`survey_id`),
  KEY `com_survey_start_date_IDX` (`start_date`,`end_date`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=21 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='설문조사 관리';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `com_survey_answer`
--

DROP TABLE IF EXISTS `com_survey_answer`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `com_survey_answer` (
  `answer_id` int NOT NULL AUTO_INCREMENT COMMENT '일렬번호',
  `question_id` int DEFAULT NULL COMMENT '질문 id',
  `answer` int DEFAULT '-1' COMMENT '답변 다국어 id',
  `sortkey` int DEFAULT '9999' COMMENT '정렬키',
  PRIMARY KEY (`answer_id`),
  KEY `com_survey_answer_question_id_IDX` (`question_id`) USING BTREE,
  KEY `com_survey_answer_sortkey_IDX` (`sortkey`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=307 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='설문조사-답변';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `com_survey_localize`
--

DROP TABLE IF EXISTS `com_survey_localize`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `com_survey_localize` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '일렬번호',
  `KO` varchar(300) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT '-' COMMENT '한국어',
  `EN` varchar(300) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT '-' COMMENT '영어',
  `JA` varchar(300) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT '-' COMMENT '일본어',
  `ZH` varchar(300) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT '-' COMMENT '중국-번체',
  `SC` varchar(300) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT '-' COMMENT '중국-간체',
  `AR` varchar(300) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT '-' COMMENT '아랍어',
  `MS` varchar(300) DEFAULT '-' COMMENT '말레이어',
  `ES` varchar(300) DEFAULT '-' COMMENT '스페인어',
  `RU` varchar(300) DEFAULT '-',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=54 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='설문조사-다국어';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `com_survey_question`
--

DROP TABLE IF EXISTS `com_survey_question`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `com_survey_question` (
  `question_id` int NOT NULL AUTO_INCREMENT COMMENT '일렬번호',
  `question` int DEFAULT '-1' COMMENT '질문 다국어 id',
  `answer_kind` int DEFAULT '0' COMMENT '질문방식',
  `select_check` int DEFAULT NULL COMMENT '다중 선택',
  `survey_id` int DEFAULT NULL COMMENT '마스터 id',
  `sortkey` int DEFAULT '999' COMMENT '정렬키',
  PRIMARY KEY (`question_id`),
  KEY `com_survey_question_servey_id_IDX` (`survey_id`) USING BTREE,
  KEY `com_survey_question_sortkey_IDX` (`sortkey`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=52 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='설문조사-질문';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `com_translate_retry`
--

DROP TABLE IF EXISTS `com_translate_retry`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `com_translate_retry` (
  `project_id` int NOT NULL,
  `retry_text` varchar(200) NOT NULL,
  UNIQUE KEY `com_translate_retry_project_id_IDX` (`project_id`,`retry_text`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='번역 재시도 문장';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `deploy_table_def`
--

DROP TABLE IF EXISTS `deploy_table_def`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `deploy_table_def` (
  `table_name` varchar(30) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL,
  `column_name` varchar(30) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL,
  `is_key` tinyint NOT NULL DEFAULT '0',
  UNIQUE KEY `deploy_table_def_table_name_IDX` (`table_name`,`column_name`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COMMENT='테이블 배포 기준정보';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `dlc_detail`
--

DROP TABLE IF EXISTS `dlc_detail`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `dlc_detail` (
  `dlc_id` int NOT NULL,
  `lang` varchar(20) NOT NULL COMMENT '언어코드',
  `dlc_title` varchar(30) NOT NULL,
  `dlc_summary` varchar(500) NOT NULL,
  `banner_id` int NOT NULL DEFAULT '-1' COMMENT '배너 ID',
  UNIQUE KEY `dlc_detail_dlc_id_IDX` (`dlc_id`,`lang`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `dlc_master`
--

DROP TABLE IF EXISTS `dlc_master`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `dlc_master` (
  `dlc_id` int NOT NULL AUTO_INCREMENT,
  `dlc_name` varchar(60) NOT NULL COMMENT '관리형 이름',
  `dlc_type` varchar(30) NOT NULL,
  `price` int NOT NULL DEFAULT '0',
  `sale_price` int NOT NULL DEFAULT '0',
  `cast1` varchar(30) NOT NULL COMMENT 'DLC 메인 캐릭터',
  `cast2` varchar(30) DEFAULT NULL,
  `cast3` varchar(30) DEFAULT NULL,
  `cast4` varchar(30) DEFAULT NULL,
  `project_id` int NOT NULL COMMENT '연결 프로젝트 ID',
  `is_public` tinyint DEFAULT '1',
  `exception_culture` varchar(100) DEFAULT '-' COMMENT '예외 문화권',
  `updated` tinyint DEFAULT '0',
  `last_updated` datetime DEFAULT CURRENT_TIMESTAMP,
  `last_deployed` datetime DEFAULT NULL,
  PRIMARY KEY (`dlc_id`),
  KEY `dlc_master_project_id_IDX` (`project_id`,`dlc_id`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='DLC 관리 마스터 테이블';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `list_bg`
--

DROP TABLE IF EXISTS `list_bg`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `list_bg` (
  `bg_id` int NOT NULL AUTO_INCREMENT,
  `project_id` int NOT NULL COMMENT '소속 프로젝트 ID',
  `image_name` varchar(30) NOT NULL COMMENT '배경 이름',
  `image_url` varchar(160) NOT NULL COMMENT '배경 이미지 URL',
  `image_key` varchar(120) NOT NULL,
  `bucket` varchar(30) DEFAULT NULL,
  `game_scale` float NOT NULL DEFAULT '1' COMMENT '게임 스케일',
  `sortkey` int DEFAULT '0',
  `live_pair_id` int DEFAULT '-1' COMMENT '라이브 페어 아이디',
  `is_valid` tinyint DEFAULT '1',
  `updated` tinyint DEFAULT '0',
  `last_updated` datetime DEFAULT CURRENT_TIMESTAMP,
  `last_deployed` datetime DEFAULT NULL,
  PRIMARY KEY (`bg_id`),
  UNIQUE KEY `project_id_UNIQUE` (`project_id`,`image_name`),
  KEY `list_bg_project_id_IDX` (`project_id`,`image_name`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=2443 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='배경 등록정보';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `list_challenge`
--

DROP TABLE IF EXISTS `list_challenge`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `list_challenge` (
  `challenge_no` int NOT NULL AUTO_INCREMENT,
  `project_id` int NOT NULL COMMENT '소속 프로젝트 ID',
  `challenge_name` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '도전과제 이름',
  `challenge_hint` varchar(100) DEFAULT NULL COMMENT '도전과제 힌트',
  `image_url` varchar(160) DEFAULT NULL COMMENT '아이콘 URL',
  `image_key` varchar(120) DEFAULT NULL COMMENT '아이콘 Key',
  `is_hidden` tinyint NOT NULL DEFAULT '0' COMMENT '숨겨진 도전과제 여부',
  PRIMARY KEY (`challenge_no`),
  UNIQUE KEY `list_challenge_un` (`project_id`,`challenge_name`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='도전과제 리스트';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `list_challenge_detail`
--

DROP TABLE IF EXISTS `list_challenge_detail`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `list_challenge_detail` (
  `challenge_no` int NOT NULL,
  `lang` varchar(10) NOT NULL,
  `challenge_name` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `challenge_hint` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  UNIQUE KEY `list_challenge_detail_un` (`challenge_no`,`lang`,`challenge_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='도전과제 상세정보(언어별)';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `list_credit`
--

DROP TABLE IF EXISTS `list_credit`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `list_credit` (
  `credit_no` int NOT NULL AUTO_INCREMENT,
  `project_id` int DEFAULT NULL COMMENT '프로젝트 ID',
  `tier` tinyint DEFAULT NULL COMMENT '티어',
  `nickname` varchar(60) DEFAULT NULL COMMENT '유저 이름',
  `sortkey` int NOT NULL DEFAULT '-1',
  UNIQUE KEY `list_credit_un` (`credit_no`),
  KEY `list_credit_project_id_IDX` (`project_id`,`tier`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=341 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='펀딩 후원자 리스트';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `list_default_property`
--

DROP TABLE IF EXISTS `list_default_property`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `list_default_property` (
  `project_id` varchar(100) DEFAULT NULL,
  `currency` varchar(100) DEFAULT NULL,
  `currency_type` varchar(30) DEFAULT NULL COMMENT '재화타입',
  `sorting_order` int NOT NULL DEFAULT '0',
  UNIQUE KEY `list_default_property_project_id_IDX2` (`project_id`,`currency_type`) USING BTREE,
  KEY `list_default_property_project_id_IDX` (`project_id`,`sorting_order`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='작품별 기본 제공 property';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `list_design`
--

DROP TABLE IF EXISTS `list_design`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `list_design` (
  `design_id` int NOT NULL AUTO_INCREMENT,
  `project_id` int NOT NULL DEFAULT '0' COMMENT '연결 프로젝트',
  `design_type` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT 'standard 코드',
  `image_name` varchar(60) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `image_url` varchar(160) NOT NULL COMMENT 'URL',
  `image_key` varchar(120) NOT NULL,
  `bucket` varchar(30) NOT NULL,
  `updated` tinyint DEFAULT '0',
  `last_updated` datetime DEFAULT CURRENT_TIMESTAMP,
  `last_deployed` datetime DEFAULT NULL,
  PRIMARY KEY (`design_id`),
  KEY `list_design_project_id_IDX` (`project_id`,`design_type`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=6077 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='작품의 직접적인 리소스외, 썸네일과 배너 등';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `list_dress`
--

DROP TABLE IF EXISTS `list_dress`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `list_dress` (
  `dress_id` int NOT NULL AUTO_INCREMENT,
  `dress_name` varchar(30) NOT NULL,
  `model_id` int NOT NULL,
  `is_default` int NOT NULL DEFAULT '0',
  `dressmodel_id` int NOT NULL,
  `sortkey` int NOT NULL DEFAULT '0',
  PRIMARY KEY (`dress_id`),
  KEY `list_dress_project_id_IDX` (`dressmodel_id`,`dress_id`) USING BTREE,
  KEY `list_dress_model_id_IDX` (`model_id`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=440 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='의상과 연결된 모델 ID';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `list_dress_model`
--

DROP TABLE IF EXISTS `list_dress_model`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `list_dress_model` (
  `dressmodel_id` int NOT NULL AUTO_INCREMENT,
  `dressmodel_name` varchar(30) NOT NULL,
  `project_id` int NOT NULL,
  `sortkey` int NOT NULL DEFAULT '0',
  PRIMARY KEY (`dressmodel_id`),
  UNIQUE KEY `list_dress_model_un` (`project_id`,`dressmodel_name`)
) ENGINE=InnoDB AUTO_INCREMENT=190 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='모델 의상 연결 마스터';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `list_emoticon_master`
--

DROP TABLE IF EXISTS `list_emoticon_master`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `list_emoticon_master` (
  `emoticon_master_id` int NOT NULL AUTO_INCREMENT,
  `emoticon_owner` varchar(20) NOT NULL,
  `project_id` int NOT NULL,
  `sort_key` int DEFAULT '0',
  PRIMARY KEY (`emoticon_master_id`),
  UNIQUE KEY `idx_unique` (`emoticon_owner`,`project_id`)
) ENGINE=InnoDB AUTO_INCREMENT=521 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='이모티콘 마스터 테이블';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `list_emoticon_slave`
--

DROP TABLE IF EXISTS `list_emoticon_slave`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `list_emoticon_slave` (
  `emoticon_slave_id` int NOT NULL AUTO_INCREMENT,
  `project_id` int NOT NULL,
  `image_name` varchar(20) NOT NULL,
  `image_url` varchar(160) DEFAULT NULL,
  `image_key` varchar(120) DEFAULT NULL,
  `sortkey` int DEFAULT '0',
  `emoticon_master_id` int NOT NULL COMMENT '마스터 ID',
  PRIMARY KEY (`emoticon_slave_id`),
  UNIQUE KEY `indx_unique` (`project_id`,`image_name`),
  KEY `list_emoticon_slave_emoticon_master_id_IDX` (`emoticon_master_id`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=2055 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `list_episode`
--

DROP TABLE IF EXISTS `list_episode`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `list_episode` (
  `episode_id` int NOT NULL AUTO_INCREMENT,
  `project_id` int NOT NULL,
  `episode_type` varchar(20) NOT NULL COMMENT '에피소드 종류 : 챕터, 사이드, 엔딩',
  `title` varchar(60) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '제목',
  `episode_status` int DEFAULT '0' COMMENT '에피소드 상태 : 제작 - 리뷰 - 출시.. 등등',
  `currency` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL DEFAULT 'gem' COMMENT '프리미엄 플레이 구매 재화',
  `price` int DEFAULT '3' COMMENT '가격(프리미엄 플레이)',
  `sale_price` int DEFAULT '3' COMMENT '할인 가격(프리미엄 플레이)',
  `one_currency` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL DEFAULT 'gem' COMMENT '1회 플레이 구매 재화',
  `one_price` int NOT NULL DEFAULT '1' COMMENT '1회 플레이 가격',
  `ending_type` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT 'final' COMMENT '엔딩 방식',
  `unlock_style` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL DEFAULT 'none' COMMENT '해금 방식',
  `unlock_episodes` varchar(120) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT '해금 에피소드',
  `unlock_coupon` varchar(20) DEFAULT NULL COMMENT '해금 쿠폰그룹',
  `unlock_scenes` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT '해금 사건ID',
  `depend_episode` int NOT NULL DEFAULT '-1' COMMENT '엄마 에피소드. 리스트 순서를 위해 사용',
  `square_image_id` int NOT NULL DEFAULT '1' COMMENT '사각 이미지 ID',
  `popup_image_id` int NOT NULL DEFAULT '2' COMMENT '팝업 이미지 ID',
  `summary` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT '에피소드 요약',
  `chapter_number` int NOT NULL DEFAULT '-1' COMMENT '정규 챕터 번호',
  `first_reward_currency` varchar(20) NOT NULL DEFAULT 'coin' COMMENT '최초 플레이 보상',
  `first_reward_quantity` int NOT NULL DEFAULT '20' COMMENT '최초 플레이 보상 개수',
  `first_reward_exp` int DEFAULT '0' COMMENT '최초 클리어 경험치',
  `sortkey` int DEFAULT '999',
  `publish_date` datetime DEFAULT NULL COMMENT '공개일시',
  `next_open_min` int NOT NULL DEFAULT '0' COMMENT '다음 오픈까지 남은 분',
  `open_decrease_rate` int NOT NULL DEFAULT '0' COMMENT '다음 오픈 시간 감소율',
  `speaker` varchar(30) DEFAULT NULL,
  `dlc_id` int NOT NULL DEFAULT '-1',
  `updated` tinyint DEFAULT '0',
  `last_updated` datetime DEFAULT CURRENT_TIMESTAMP,
  `last_deployed` datetime DEFAULT NULL,
  PRIMARY KEY (`episode_id`),
  UNIQUE KEY `list_episode_un` (`project_id`,`episode_type`,`title`),
  KEY `idx_project` (`project_id`),
  KEY `list_episode_depend_episode_IDX` (`depend_episode`) USING BTREE,
  KEY `list_episode_project_id_IDX` (`project_id`,`unlock_style`) USING BTREE,
  KEY `list_episode_episode_type_IDX` (`episode_type`,`ending_type`) USING BTREE,
  KEY `list_episode_project_dlc_IDX` (`project_id`,`dlc_id`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=1878 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='에피소드 테이블';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `list_episode_detail`
--

DROP TABLE IF EXISTS `list_episode_detail`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `list_episode_detail` (
  `episode_id` int DEFAULT NULL,
  `lang` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT 'iso 언어 코드',
  `title` varchar(60) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT '타이틀',
  `summary` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT '요약',
  UNIQUE KEY `list_episode_detail_un` (`episode_id`,`lang`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='에피소드 상세 (언어별)';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `list_illust`
--

DROP TABLE IF EXISTS `list_illust`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `list_illust` (
  `illust_id` int NOT NULL AUTO_INCREMENT,
  `project_id` int NOT NULL,
  `image_name` varchar(60) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `image_url` varchar(160) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `image_key` varchar(120) NOT NULL,
  `bucket` varchar(30) DEFAULT NULL,
  `sortkey` int DEFAULT '0',
  `is_valid` tinyint DEFAULT '1',
  `thumbnail_id` int NOT NULL DEFAULT '-1' COMMENT '썸네일id',
  `is_public` tinyint NOT NULL DEFAULT '1' COMMENT '갤러리 공개여부',
  `appear_episode` int NOT NULL DEFAULT '-1' COMMENT '첫번째 등장 에피소드ID',
  `live_pair_id` int NOT NULL DEFAULT '-1' COMMENT '연결되는 라이브개체 ID',
  `speaker` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT '',
  `updated` tinyint DEFAULT '0',
  `last_updated` datetime DEFAULT CURRENT_TIMESTAMP,
  `last_deployed` datetime DEFAULT NULL,
  PRIMARY KEY (`illust_id`),
  UNIQUE KEY `NAME_UNIQUE` (`project_id`,`image_name`),
  KEY `list_illust_project_id_IDX` (`project_id`,`image_name`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=425 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='일러스트 이미지 등록정보';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `list_illust_lang`
--

DROP TABLE IF EXISTS `list_illust_lang`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `list_illust_lang` (
  `illust_id` int NOT NULL COMMENT '일러스트 id',
  `illust_type` varchar(20) NOT NULL COMMENT '일러스트 타입',
  `lang` varchar(10) NOT NULL COMMENT 'ISO 언어코드',
  `public_name` varchar(60) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT '공개 이름',
  `summary` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT '일러스트 설명',
  UNIQUE KEY `list_illust_lang_un` (`illust_id`,`illust_type`,`lang`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='일러스트 언어별 텍스트';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `list_live_bg`
--

DROP TABLE IF EXISTS `list_live_bg`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `list_live_bg` (
  `live_bg_id` int NOT NULL AUTO_INCREMENT,
  `project_id` int DEFAULT NULL COMMENT '작품 아이디',
  `live_bg_name` varchar(60) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT '라이브 배경명',
  `offset_x` float DEFAULT '0' COMMENT 'x좌표',
  `offset_y` float DEFAULT '0' COMMENT 'y좌표',
  `game_scale` float DEFAULT '15' COMMENT '스케일',
  `bg_ver` int DEFAULT '1' COMMENT '버전',
  PRIMARY KEY (`live_bg_id`),
  KEY `list_live_bg_project_id_IDX` (`project_id`,`bg_ver`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=46 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='라이브 배경 마스터';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `list_live_bg_detail`
--

DROP TABLE IF EXISTS `list_live_bg_detail`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `list_live_bg_detail` (
  `live_bg_id` int NOT NULL COMMENT '라이브 배경 아이디',
  `file_url` varchar(160) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '파일 url',
  `file_key` varchar(160) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '파일 key',
  `file_name` varchar(120) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '파일명',
  `motion_name` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT '모션 이름',
  PRIMARY KEY (`live_bg_id`,`file_url`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='라이브 배경 디테일';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `list_live_illust`
--

DROP TABLE IF EXISTS `list_live_illust`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `list_live_illust` (
  `live_illust_id` int NOT NULL AUTO_INCREMENT,
  `project_id` int NOT NULL COMMENT '프로젝트 ID',
  `live_illust_name` varchar(60) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '이름',
  `offset_x` float NOT NULL DEFAULT '0' COMMENT '위치 offset',
  `offset_y` float NOT NULL DEFAULT '0',
  `game_scale` float NOT NULL DEFAULT '15' COMMENT '게임내 scale 크기',
  `illust_ver` int NOT NULL DEFAULT '1' COMMENT '모델 버전',
  `thumbnail_id` int NOT NULL DEFAULT '-1',
  `scale_offset` float NOT NULL DEFAULT '0' COMMENT 'UI 에서 열람할때 스케일 조정값',
  `is_public` tinyint NOT NULL DEFAULT '1' COMMENT '갤러리 공개여부',
  `appear_episode` int NOT NULL DEFAULT '-1' COMMENT '첫 등장 에피소드',
  `speaker` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT '',
  `updated` tinyint DEFAULT '0',
  `last_updated` datetime DEFAULT CURRENT_TIMESTAMP,
  `last_deployed` datetime DEFAULT NULL,
  PRIMARY KEY (`live_illust_id`),
  UNIQUE KEY `list_live_illust_un` (`project_id`,`live_illust_name`)
) ENGINE=InnoDB AUTO_INCREMENT=287 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='라이브 일러스트 마스터 테이블';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `list_live_illust_detail`
--

DROP TABLE IF EXISTS `list_live_illust_detail`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `list_live_illust_detail` (
  `live_illust_id` int NOT NULL COMMENT '엄마 ID',
  `file_url` varchar(160) NOT NULL,
  `file_key` varchar(160) NOT NULL,
  `file_name` varchar(120) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '순수 파일명',
  `motion_name` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT '모션의 경우 모션 이름',
  UNIQUE KEY `list_live_illust_detail_un` (`live_illust_id`,`file_url`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='라이브 일러스트 파일과 모션 목록';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `list_live_object`
--

DROP TABLE IF EXISTS `list_live_object`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `list_live_object` (
  `live_object_id` int NOT NULL AUTO_INCREMENT,
  `project_id` int NOT NULL COMMENT '프로젝트 ID',
  `live_object_name` varchar(60) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '이름',
  `offset_x` float NOT NULL DEFAULT '0',
  `offset_y` float NOT NULL DEFAULT '0',
  `game_scale` float NOT NULL DEFAULT '15',
  `object_ver` int NOT NULL DEFAULT '1',
  `is_public` tinyint DEFAULT '0' COMMENT '공개여부(0:허용X, 1:허용)',
  `thumbnail_id` int NOT NULL DEFAULT '-1' COMMENT '썸네일',
  `appear_episode` int NOT NULL DEFAULT '-1' COMMENT '첫 등장 에피소드. 갤러리 공개와 연계',
  `speaker` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT '',
  `updated` tinyint DEFAULT '0',
  `last_updated` datetime DEFAULT CURRENT_TIMESTAMP,
  `last_deployed` datetime DEFAULT NULL,
  PRIMARY KEY (`live_object_id`),
  UNIQUE KEY `list_live_object_un` (`project_id`,`live_object_name`),
  KEY `list_live_object_is_public_IDX` (`is_public`,`appear_episode`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=220 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='라이브 오브젝트 마스터 테이블';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `list_live_object_detail`
--

DROP TABLE IF EXISTS `list_live_object_detail`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `list_live_object_detail` (
  `live_object_id` int NOT NULL COMMENT '엄마 ID',
  `file_url` varchar(160) NOT NULL,
  `file_key` varchar(160) NOT NULL,
  `file_name` varchar(120) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '순수 파일명',
  `motion_name` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT '모션의 경우 모션 이름',
  UNIQUE KEY `list_live_object_detail_un` (`live_object_id`,`file_url`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='라이브 일러스트 파일과 모션 목록';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `list_loading`
--

DROP TABLE IF EXISTS `list_loading`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `list_loading` (
  `loading_id` int NOT NULL AUTO_INCREMENT,
  `project_id` int NOT NULL,
  `image_id` int NOT NULL DEFAULT '-1' COMMENT 'design 업로드 id',
  `loading_name` varchar(20) DEFAULT NULL COMMENT '식별용 이름',
  `updated` tinyint DEFAULT '0',
  `last_updated` datetime DEFAULT CURRENT_TIMESTAMP,
  `last_deployed` datetime DEFAULT NULL,
  UNIQUE KEY `list_loading_un` (`loading_id`),
  KEY `list_loading_project_id_IDX` (`project_id`,`image_id`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=259 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='프로젝트 로딩 테이블';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `list_loading_appear`
--

DROP TABLE IF EXISTS `list_loading_appear`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `list_loading_appear` (
  `loading_id` int NOT NULL COMMENT '로딩 ID',
  `episode_id` int NOT NULL COMMENT '등장 에피소드',
  `is_use` tinyint NOT NULL DEFAULT '1' COMMENT '사용 여부',
  PRIMARY KEY (`loading_id`,`episode_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='로딩 등장 에피소드 설정';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `list_loading_detail`
--

DROP TABLE IF EXISTS `list_loading_detail`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `list_loading_detail` (
  `detail_no` int NOT NULL AUTO_INCREMENT COMMENT '일렬번호',
  `loading_id` int NOT NULL COMMENT '로딩 아이디',
  `lang` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '언어',
  `loading_text` varchar(160) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT 'TMI',
  UNIQUE KEY `list_loading_detail_un` (`detail_no`),
  KEY `list_loading_detail_loading_id_IDX` (`loading_id`,`lang`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=7926 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='로딩 TMI';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `list_main_loading`
--

DROP TABLE IF EXISTS `list_main_loading`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `list_main_loading` (
  `main_loading_id` int NOT NULL AUTO_INCREMENT,
  `image_id` int DEFAULT '-1',
  `lang` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL DEFAULT '',
  `title` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT '',
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `is_public` tinyint DEFAULT '0',
  PRIMARY KEY (`main_loading_id`),
  KEY `list_main_loading_start_date_IDX` (`start_date`,`end_date`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=129 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `list_main_loading_lang`
--

DROP TABLE IF EXISTS `list_main_loading_lang`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `list_main_loading_lang` (
  `main_loading_id` int DEFAULT NULL COMMENT '아이디',
  `lang` varchar(2) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT '언어',
  `image_id` int DEFAULT NULL COMMENT '디자인id',
  `title` varchar(60) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT '제목',
  UNIQUE KEY `list_main_loading_lang_main_loading_id_IDX` (`main_loading_id`,`lang`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='로딩 화면 언어별 리스트';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `list_minicut`
--

DROP TABLE IF EXISTS `list_minicut`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `list_minicut` (
  `minicut_id` int NOT NULL AUTO_INCREMENT,
  `project_id` int NOT NULL,
  `image_name` varchar(60) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `image_url` varchar(160) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `image_key` varchar(120) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `bucket` varchar(30) DEFAULT NULL COMMENT 'S3 버킷',
  `sortkey` int DEFAULT '0',
  `is_valid` tinyint DEFAULT '1',
  `offset_x` float DEFAULT '0' COMMENT '게임 위치 오프셋',
  `offset_y` float DEFAULT '0' COMMENT '게임 위치 오프셋',
  `game_scale` float DEFAULT '1' COMMENT '유니티 scale',
  `is_public` tinyint DEFAULT '0' COMMENT '공개여부(0:허용X, 1:허용)',
  `is_resized` tinyint NOT NULL DEFAULT '0' COMMENT '게임에 맞게 최적화 크기로 변경되었는지 여부',
  `thumbnail_id` int NOT NULL DEFAULT '-1' COMMENT '미니컷 썸네일',
  `appear_episode` int NOT NULL DEFAULT '-1' COMMENT '첫 등장 에피소드. 갤러리 공개와 연계',
  `live_pair_id` int NOT NULL DEFAULT '-1' COMMENT '라이브 페어 오브젝트 ID',
  `speaker` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT '',
  `updated` tinyint DEFAULT '0',
  `last_updated` datetime DEFAULT CURRENT_TIMESTAMP,
  `last_deployed` datetime DEFAULT NULL,
  PRIMARY KEY (`minicut_id`),
  UNIQUE KEY `MINICUT_UNIQUE` (`project_id`,`image_name`),
  KEY `list_minicut_project_id_IDX` (`project_id`,`image_name`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=2103 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='미니컷 이미지 등록정보';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `list_minicut_lang`
--

DROP TABLE IF EXISTS `list_minicut_lang`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `list_minicut_lang` (
  `minicut_id` int NOT NULL COMMENT '미니컷 id',
  `minicut_type` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '미니컷 타입',
  `lang` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT 'ISO 언어코드',
  `public_name` varchar(60) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT '공개이름',
  `summary` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT '미니컷 설명',
  UNIQUE KEY `list_minicut_lang_un` (`minicut_id`,`minicut_type`,`lang`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `list_mission`
--

DROP TABLE IF EXISTS `list_mission`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `list_mission` (
  `mission_id` int NOT NULL AUTO_INCREMENT,
  `mission_name` varchar(60) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT '미션 기본이름',
  `mission_hint` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT '미션 기본힌트',
  `mission_type` varchar(20) DEFAULT NULL COMMENT '미션 타입',
  `is_hidden` tinyint NOT NULL DEFAULT '0' COMMENT '숨겨진 미션 여부',
  `project_id` int NOT NULL DEFAULT '0' COMMENT '연결 프로젝트',
  `mission_condition` varchar(20) DEFAULT NULL COMMENT '미션 획득조건(플랫폼)',
  `mission_figure` int NOT NULL DEFAULT '0' COMMENT '획득에 필요한 수치',
  `id_condition` varchar(2000) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT 'ID 조건(상황,에피소드)',
  `reward_exp` int NOT NULL DEFAULT '0' COMMENT '보상 경험치',
  `reward_currency` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL DEFAULT 'none' COMMENT '보상 재화',
  `reward_quantity` int NOT NULL DEFAULT '0' COMMENT '보상 재화 수량',
  `image_url` varchar(160) DEFAULT NULL,
  `image_key` varchar(120) DEFAULT NULL,
  `detail_hint` int DEFAULT '0' COMMENT '디테일 힌트 여부',
  `start_date` datetime NOT NULL DEFAULT '2021-01-01 00:00:00' COMMENT '미션 시작일',
  `end_date` datetime DEFAULT '9999-12-31 00:00:00' COMMENT '미션 종료일',
  PRIMARY KEY (`mission_id`),
  UNIQUE KEY `list_mission_un` (`project_id`,`mission_name`),
  KEY `list_mission_project_id_IDX` (`project_id`,`mission_type`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=448 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='미션 테이블';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `list_mission_lang`
--

DROP TABLE IF EXISTS `list_mission_lang`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `list_mission_lang` (
  `mission_id` int NOT NULL,
  `lang` varchar(10) NOT NULL COMMENT '언어코드',
  `mission_name` varchar(60) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `mission_hint` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  UNIQUE KEY `list_mission_lang_un` (`mission_id`,`lang`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='미션 로컬라이징 테이블';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `list_model_master`
--

DROP TABLE IF EXISTS `list_model_master`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `list_model_master` (
  `model_id` int NOT NULL AUTO_INCREMENT,
  `project_id` int NOT NULL,
  `model_name` varchar(30) NOT NULL COMMENT '캐릭터 이름',
  `model_type` varchar(20) DEFAULT 'live2d',
  `is_valid` int DEFAULT '1',
  `offset_x` float NOT NULL DEFAULT '0' COMMENT 'X축 위치정보',
  `offset_y` float NOT NULL DEFAULT '0' COMMENT 'Y축 위치정보',
  `game_scale` float NOT NULL DEFAULT '15' COMMENT '게임 상의 모델 크기',
  `sortkey` int DEFAULT '0',
  `model_ver` int NOT NULL DEFAULT '1',
  `direction` varchar(10) NOT NULL DEFAULT 'center',
  `tall_grade` int NOT NULL DEFAULT '0',
  PRIMARY KEY (`model_id`),
  UNIQUE KEY `idx_unique_name` (`model_name`,`project_id`) /*!80000 INVISIBLE */,
  KEY `idx_project_id` (`project_id`)
) ENGINE=InnoDB AUTO_INCREMENT=616 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='캐릭터 모델 마스터 테이블';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `list_model_motion`
--

DROP TABLE IF EXISTS `list_model_motion`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `list_model_motion` (
  `motion_id` int NOT NULL AUTO_INCREMENT,
  `model_id` int NOT NULL COMMENT '원본 모델 ID',
  `motion_name` varchar(30) NOT NULL COMMENT '모션 이름',
  `file_key` varchar(160) NOT NULL COMMENT '파일 키',
  PRIMARY KEY (`motion_id`),
  UNIQUE KEY `unique_name` (`model_id`,`motion_name`) /*!80000 INVISIBLE */,
  UNIQUE KEY `unique_key` (`model_id`,`file_key`)
) ENGINE=InnoDB AUTO_INCREMENT=7347 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='모델 모션 리스트';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `list_model_slave`
--

DROP TABLE IF EXISTS `list_model_slave`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `list_model_slave` (
  `model_slave_id` int NOT NULL AUTO_INCREMENT COMMENT '유일 키',
  `model_id` int NOT NULL,
  `file_url` varchar(160) DEFAULT NULL,
  `file_key` varchar(160) DEFAULT NULL,
  `is_motion` int DEFAULT '0' COMMENT '캐릭터 메인 파일 여부',
  `file_name` varchar(120) DEFAULT NULL COMMENT '순수 파일명',
  `sortkey` int NOT NULL DEFAULT '10',
  PRIMARY KEY (`model_slave_id`),
  KEY `idx_model_id` (`model_id`)
) ENGINE=InnoDB AUTO_INCREMENT=25237 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='캐릭터 모델 상세';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `list_nametag`
--

DROP TABLE IF EXISTS `list_nametag`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `list_nametag` (
  `project_id` int NOT NULL,
  `speaker` varchar(20) NOT NULL COMMENT '화자',
  `main_color` varchar(10) NOT NULL DEFAULT 'FFFFFFFF' COMMENT '메인컬러',
  `sub_color` varchar(10) NOT NULL DEFAULT 'FFFFFFFF' COMMENT '서브컬러',
  `voice_banner_id` int NOT NULL DEFAULT '-1',
  `KO` varchar(20) DEFAULT NULL COMMENT '한글이름',
  `EN` varchar(20) DEFAULT NULL COMMENT '영문이름',
  `JA` varchar(20) DEFAULT NULL COMMENT '일본이름',
  `ZH` varchar(20) DEFAULT NULL COMMENT '중국번체이름',
  `SC` varchar(20) DEFAULT NULL COMMENT '중국어간체이름',
  `AR` varchar(20) DEFAULT NULL COMMENT '아랍어이름',
  `sortkey` int DEFAULT '0' COMMENT '정렬키',
  `MS` varchar(20) DEFAULT NULL COMMENT '말레이어',
  `ES` varchar(20) DEFAULT NULL COMMENT '스페인어',
  `RU` varchar(20) DEFAULT NULL,
  `updated` tinyint DEFAULT '0',
  `last_updated` datetime DEFAULT CURRENT_TIMESTAMP,
  `last_deployed` datetime DEFAULT NULL,
  UNIQUE KEY `list_nametag_un` (`project_id`,`speaker`),
  KEY `list_nametag_sortkey_IDX` (`sortkey`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='작품별 이름표 설정';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `list_previous_s3`
--

DROP TABLE IF EXISTS `list_previous_s3`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `list_previous_s3` (
  `project_id` int NOT NULL COMMENT '연결 프로젝트 ID',
  `object_key` varchar(120) NOT NULL COMMENT 'S3 키',
  `bucket` varchar(30) NOT NULL COMMENT '버킷',
  PRIMARY KEY (`project_id`,`object_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='과거 S3 오브젝트';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `list_product_daily`
--

DROP TABLE IF EXISTS `list_product_daily`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `list_product_daily` (
  `master_id` int DEFAULT NULL,
  `day_seq` tinyint NOT NULL COMMENT '일수',
  `currency` varchar(20) NOT NULL,
  `quantity` int NOT NULL,
  KEY `list_product_daliy_master_id_IDX` (`master_id`) USING BTREE,
  KEY `list_product_daliy_day_seq_IDX` (`day_seq`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='기간제 상품';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `list_product_detail`
--

DROP TABLE IF EXISTS `list_product_detail`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `list_product_detail` (
  `master_id` int DEFAULT NULL COMMENT 'master 연결 id',
  `currency` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT '상품 화폐 종류',
  `is_main` int DEFAULT '0' COMMENT '메인/보너스 구분',
  `quantity` int DEFAULT NULL COMMENT '상품 개수',
  `first_purchase` tinyint DEFAULT '0' COMMENT '첫 구매 보너스 여부',
  KEY `list_produt_detail_master_id_IDX` (`master_id`) USING BTREE,
  KEY `list_produt_detail_currency_IDX` (`currency`) USING BTREE,
  KEY `list_produt_detail_is_main_IDX` (`is_main`) USING BTREE,
  KEY `list_product_detail_first_purchase_IDX` (`first_purchase`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='상품 정보 detail';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `list_product_lang`
--

DROP TABLE IF EXISTS `list_product_lang`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `list_product_lang` (
  `master_id` int DEFAULT NULL,
  `lang` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT '언어',
  `title` varchar(60) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT '언어별 상품 이름',
  `banner_id` int DEFAULT '-1' COMMENT '상품 배너 이미지',
  `detail_image_id` int DEFAULT '-1' COMMENT '상품 상세 설명 이미지',
  KEY `list_product_lang_master_id_IDX` (`master_id`) USING BTREE,
  KEY `list_product_lang_lang_IDX` (`lang`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='언어별 상품 이미지';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `list_product_master`
--

DROP TABLE IF EXISTS `list_product_master`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `list_product_master` (
  `product_master_id` int NOT NULL AUTO_INCREMENT,
  `product_id` varchar(20) DEFAULT NULL COMMENT '인앱상품ID',
  `name` varchar(60) DEFAULT NULL COMMENT '상품명',
  `product_type` varchar(20) DEFAULT NULL COMMENT '상품종류',
  `from_date` datetime DEFAULT NULL,
  `to_date` datetime DEFAULT NULL,
  `max_count` int DEFAULT NULL COMMENT '최대 구매 개수',
  `bonus_name` varchar(60) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT '보너스 문구',
  `is_public` int DEFAULT '0' COMMENT '공개여부',
  `admin_id` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT '최종 수정자',
  `create_date` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '등록일',
  `exception_country` varchar(30) DEFAULT NULL COMMENT '제외 국가',
  `package` varchar(30) NOT NULL DEFAULT 'ifyou',
  PRIMARY KEY (`product_master_id`),
  KEY `list_product_master_product_id_IDX` (`product_id`,`from_date`,`to_date`) USING BTREE,
  KEY `list_product_master_from_date_IDX` (`from_date`,`to_date`,`is_public`) USING BTREE,
  KEY `list_product_master_package_IDX` (`package`,`is_public`,`from_date`,`to_date`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=181 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='상품 정보 master';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `list_project_detail`
--

DROP TABLE IF EXISTS `list_project_detail`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `list_project_detail` (
  `project_id` int NOT NULL,
  `lang` varchar(10) NOT NULL COMMENT 'ISO 언어코드',
  `title` varchar(60) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `summary` varchar(800) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `writer` varchar(100) DEFAULT NULL,
  `main_banner_id` int NOT NULL DEFAULT '-1' COMMENT '메인배너 이미지 ID',
  `main_thumbnail_id` int NOT NULL DEFAULT '-1' COMMENT '메인썸네일 이미지 ID',
  `original` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT '원작',
  `ifyou_banner_id` int NOT NULL DEFAULT '-1' COMMENT '이프유 전용 컬럼',
  `ifyou_thumbnail_id` int NOT NULL DEFAULT '-1' COMMENT '이프유 전용 컬럼',
  `circle_image_id` int NOT NULL DEFAULT '-1' COMMENT '원형 이미지',
  `episode_finish_id` int DEFAULT '-1' COMMENT '에피소드 종료 이미지',
  `premium_pass_id` int DEFAULT '-1' COMMENT '프리미엄 패스',
  `coin_banner_id` int DEFAULT '-1' COMMENT '코인 배너 이미지',
  `category_thumbnail_id` int DEFAULT '-1' COMMENT '카테고리 썸네일 이미지',
  `fastplay_banner_id` int DEFAULT '-1' COMMENT '빠른플레이 (이어하기) 배너 이미지',
  `introduce_image_id` int NOT NULL DEFAULT '-1' COMMENT '소개 페이지 이미지 ID',
  `translator` varchar(30) DEFAULT NULL,
  UNIQUE KEY `list_project_detail_un` (`project_id`,`lang`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='프로젝트(작품) 상세정보 - 언어별';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `list_project_genre`
--

DROP TABLE IF EXISTS `list_project_genre`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `list_project_genre` (
  `project_id` varchar(100) NOT NULL COMMENT '프로젝트 ID',
  `genre_code` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '장르 코드',
  `sortkey` int NOT NULL DEFAULT '0' COMMENT '정렬 순서',
  UNIQUE KEY `list_project_genre_un` (`project_id`,`genre_code`),
  KEY `list_project_genre_genre_code_IDX` (`genre_code`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='프로젝트 장르 설정';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `list_project_hashtag`
--

DROP TABLE IF EXISTS `list_project_hashtag`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `list_project_hashtag` (
  `project_id` int NOT NULL COMMENT '프로젝트 ID',
  `hashtag_no` int NOT NULL COMMENT '해시태그 NO',
  PRIMARY KEY (`project_id`,`hashtag_no`),
  KEY `list_project_hashtag_project_id_IDX` (`project_id`) USING BTREE,
  KEY `list_project_hashtag_hashtag_no_IDX` (`hashtag_no`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='프로젝트 해시태그';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `list_project_master`
--

DROP TABLE IF EXISTS `list_project_master`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `list_project_master` (
  `project_id` int NOT NULL AUTO_INCREMENT COMMENT '프로젝트 ID',
  `project_type` int DEFAULT '0' COMMENT '프로젝트 타입',
  `title` varchar(60) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '디폴트 프로젝트 제목',
  `default_lang` varchar(8) DEFAULT 'KO' COMMENT '기본 언어',
  `summary` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT '스토리 요약',
  `writer` varchar(100) DEFAULT NULL COMMENT '작가, 퍼블리셔 등',
  `sortkey` int NOT NULL DEFAULT '0' COMMENT '정렬 순서',
  `bubble_set_id` int NOT NULL DEFAULT '1' COMMENT '말풍선 세트',
  `favor_use` smallint NOT NULL DEFAULT '1' COMMENT '호감도 사용여부',
  `challenge_use` smallint NOT NULL DEFAULT '1' COMMENT '도전과제 사용여부',
  `is_complete` tinyint NOT NULL DEFAULT '0' COMMENT '완결 여부',
  `is_credit` tinyint NOT NULL DEFAULT '0' COMMENT '크레딧 리스트 사용 여부',
  `is_public` tinyint NOT NULL DEFAULT '0' COMMENT '앱에서 공개여부',
  `banner_model_id` int NOT NULL DEFAULT '-1' COMMENT '메인배너 모델 ID(로컬라이징 하지 않음)',
  `service_country` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT '서비스 국가(사용하지 않음)',
  `service_package` varchar(120) DEFAULT NULL COMMENT '서비스 패키지',
  `is_lock` tinyint DEFAULT '0' COMMENT '잠금여부, 목록엔 보이지만, 진입 못하게 막음',
  `genre` varchar(40) DEFAULT NULL COMMENT '장르',
  `color_rgb` varchar(20) NOT NULL DEFAULT 'FFFFFF' COMMENT '메인 컬러',
  `is_deploy` int DEFAULT '0' COMMENT '배포여부',
  `serial_day` varchar(13) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT '연재 요일',
  `essential_tag` int DEFAULT '0' COMMENT '필수 태그',
  `exception_lang` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT '서비스 제외 언어(사용하지 않음)',
  `exception_country` varchar(60) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT '서비스 제외 국가(사용하지 않음)',
  `main_sound_id` int DEFAULT '-1' COMMENT '메인 bgm',
  `ifyou_thumbnail_id` int NOT NULL DEFAULT '-1' COMMENT '작품 레디 이미지 ID',
  `episode_finish_id` int NOT NULL DEFAULT '-1' COMMENT '에피소드 종료 이미지 ID',
  `premium_pass_id` int NOT NULL DEFAULT '-1' COMMENT '프리미엄패스 이미지 ID',
  `coin_banner_id` int NOT NULL DEFAULT '-1' COMMENT '코인샵 배너 이미지 ID',
  `premium_badge_id` int NOT NULL DEFAULT '-1' COMMENT '프리미엄 패스 뱃지 이미지 ID',
  `premium_price` int DEFAULT '0' COMMENT '프리미엄 패스 스타 가격',
  `exception_culture` varchar(100) DEFAULT NULL COMMENT '제외 문화권',
  `currency_text_id` int DEFAULT '-1' COMMENT '메인 재화 텍스트 ID (오토메)',
  `title_live_illust` int DEFAULT '-1' COMMENT '타이틀 라이브 일러스트ID (오토메)',
  PRIMARY KEY (`project_id`),
  KEY `list_project_is_public_IDX` (`is_public`,`sortkey`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=161 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='프로젝트 기본 정보 마스터';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `list_project_mission`
--

DROP TABLE IF EXISTS `list_project_mission`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `list_project_mission` (
  `project_id` int DEFAULT NULL COMMENT '작품id',
  `currency` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT '재화',
  `quantity` int DEFAULT NULL COMMENT '개수',
  `sortkey` int DEFAULT '0' COMMENT '순서',
  KEY `list_project_mission_project_id_IDX` (`project_id`,`sortkey`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='전체 미션 보상';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `list_project_sorting_order`
--

DROP TABLE IF EXISTS `list_project_sorting_order`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `list_project_sorting_order` (
  `project_id` int DEFAULT NULL COMMENT '작품id',
  `view_cnt` int DEFAULT '0' COMMENT '조회순',
  UNIQUE KEY `list_project_sorting_order_project_id_IDX` (`project_id`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='작품 정렬 순서(필터 기능)';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `list_reservation`
--

DROP TABLE IF EXISTS `list_reservation`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `list_reservation` (
  `reservation_no` int NOT NULL AUTO_INCREMENT,
  `send_to` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci COMMENT '받을 사람',
  `content` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci COMMENT '내용',
  `mail_type` varchar(20) DEFAULT NULL COMMENT '메일 타입',
  `currency` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT '화폐 종류',
  `quantity` int DEFAULT NULL COMMENT '개수',
  `send_date` datetime DEFAULT NULL COMMENT '발송 예정 일시',
  `expire_date` datetime DEFAULT NULL,
  `is_complete` int DEFAULT '0' COMMENT '발송 완료 여부',
  `admin_id` varchar(30) DEFAULT NULL COMMENT '최종 수정자',
  `os` varchar(10) DEFAULT 'all' COMMENT 'os 운영 기기',
  PRIMARY KEY (`reservation_no`),
  KEY `list_reservation_send_date_IDX` (`send_date`,`is_complete`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=146 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `list_resource_s3`
--

DROP TABLE IF EXISTS `list_resource_s3`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `list_resource_s3` (
  `rs3_no` int NOT NULL AUTO_INCREMENT,
  `project_id` int DEFAULT NULL,
  `s3_key` varchar(120) DEFAULT NULL,
  PRIMARY KEY (`rs3_no`),
  KEY `list_resource_s3_project_id_IDX` (`project_id`,`s3_key`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=311 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='리소스의 s3 정보 수집';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `list_s3`
--

DROP TABLE IF EXISTS `list_s3`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `list_s3` (
  `s3_no` int NOT NULL AUTO_INCREMENT,
  `s3_key` varchar(120) DEFAULT NULL,
  `s3_class` varchar(30) DEFAULT NULL,
  PRIMARY KEY (`s3_no`),
  KEY `list_s3_s3_key_IDX` (`s3_key`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=2001 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='S3 오브젝트 정리용 테이블';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `list_script`
--

DROP TABLE IF EXISTS `list_script`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `list_script` (
  `script_no` bigint NOT NULL AUTO_INCREMENT,
  `episode_id` int NOT NULL COMMENT '소속된 에피소드 ID ',
  `scene_id` varchar(10) DEFAULT NULL COMMENT '씬, 상황 ID\\n',
  `template` varchar(20) DEFAULT NULL,
  `speaker` varchar(20) DEFAULT NULL,
  `script_data` varchar(240) DEFAULT NULL,
  `target_scene_id` varchar(40) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT '이동할 상황 ID',
  `requisite` varchar(300) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT '필요조건',
  `character_expression` varchar(30) DEFAULT NULL COMMENT '캐릭터 표현',
  `emoticon_expression` varchar(20) DEFAULT NULL COMMENT '이모티콘 표현',
  `in_effect` varchar(20) DEFAULT NULL,
  `out_effect` varchar(20) DEFAULT NULL,
  `bubble_size` int DEFAULT NULL COMMENT '말풍선 크기',
  `bubble_pos` int DEFAULT NULL COMMENT '말풍선 위치 1~9',
  `bubble_hold` int DEFAULT NULL COMMENT '말풍선 유지 ',
  `bubble_reverse` int DEFAULT NULL COMMENT '말꼬리 반전',
  `emoticon_size` int DEFAULT NULL COMMENT '이모티콘 사이즈',
  `voice` varchar(40) DEFAULT NULL,
  `autoplay_row` int DEFAULT NULL COMMENT '자동진행',
  `dev_comment` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT '개발 코멘트',
  `project_id` int NOT NULL COMMENT '프로젝트 ID',
  `sortkey` int DEFAULT '0',
  `sound_effect` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT '효과음',
  `lang` varchar(10) NOT NULL DEFAULT 'KO' COMMENT '언어',
  `control` varchar(100) DEFAULT NULL COMMENT '행 제어 변수',
  `selection_group` int DEFAULT '0' COMMENT '그룹번호',
  `selection_no` int DEFAULT '0' COMMENT '그룹 내 번호',
  PRIMARY KEY (`script_no`),
  KEY `idx_sort` (`sortkey`,`script_no`),
  KEY `list_script_episode_id_IDX` (`episode_id`,`lang`) USING BTREE,
  KEY `list_script_project_id_IDX` (`project_id`,`episode_id`,`lang`) USING BTREE,
  KEY `list_script_scene_id_IDX` (`project_id`,`scene_id`) USING BTREE,
  KEY `list_script_episode_id_IDX2` (`episode_id`,`scene_id`,`lang`) USING BTREE,
  KEY `list_script_episode_id_IDX3` (`episode_id`,`lang`,`selection_group`) USING BTREE,
  KEY `idx_script_ep_template` (`episode_id`,`template`,`lang`),
  KEY `idx_script_choice_price` (`project_id`,`template`,`control`,`lang`),
  KEY `list_script_project_id_IDX4` (`project_id`,`lang`,`voice`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=16609051 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='스크립트 테이블';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `list_script_recover`
--

DROP TABLE IF EXISTS `list_script_recover`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `list_script_recover` (
  `script_no` bigint NOT NULL,
  `episode_id` int NOT NULL COMMENT '소속된 에피소드 ID ',
  `scene_id` varchar(10) DEFAULT NULL COMMENT '씬, 상황 ID\\n',
  `template` varchar(20) DEFAULT NULL,
  `speaker` varchar(20) DEFAULT NULL,
  `script_data` varchar(240) DEFAULT NULL,
  `target_scene_id` varchar(40) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT '이동할 상황 ID',
  `requisite` varchar(300) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT '필요조건',
  `character_expression` varchar(30) DEFAULT NULL COMMENT '캐릭터 표현',
  `emoticon_expression` varchar(20) DEFAULT NULL COMMENT '이모티콘 표현',
  `in_effect` varchar(20) DEFAULT NULL,
  `out_effect` varchar(20) DEFAULT NULL,
  `bubble_size` int DEFAULT NULL COMMENT '말풍선 크기',
  `bubble_pos` int DEFAULT NULL COMMENT '말풍선 위치 1~9',
  `bubble_hold` int DEFAULT NULL COMMENT '말풍선 유지 ',
  `bubble_reverse` int DEFAULT NULL COMMENT '말꼬리 반전',
  `emoticon_size` int DEFAULT NULL COMMENT '이모티콘 사이즈',
  `voice` varchar(40) DEFAULT NULL,
  `autoplay_row` int DEFAULT NULL COMMENT '자동진행',
  `dev_comment` varchar(120) DEFAULT NULL COMMENT '개발 코멘트',
  `project_id` int NOT NULL COMMENT '프로젝트 ID',
  `sortkey` int DEFAULT '0',
  `sound_effect` varchar(20) DEFAULT NULL,
  `lang` varchar(10) DEFAULT NULL,
  `control` varchar(100) DEFAULT NULL COMMENT '행 제어 변수',
  PRIMARY KEY (`script_no`),
  KEY `idx_project` (`project_id`,`episode_id`),
  KEY `idx_episode` (`episode_id`),
  KEY `idx_sort` (`sortkey`,`script_no`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='스크립트 테이블 복구용';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `list_selection`
--

DROP TABLE IF EXISTS `list_selection`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `list_selection` (
  `selection_group` int DEFAULT NULL COMMENT '선택지 한 그룹에 대한 식별자',
  `project_id` int DEFAULT NULL COMMENT '작품ID',
  `episode_id` int DEFAULT NULL COMMENT '에피소드ID',
  `selection_no` int DEFAULT NULL COMMENT '첫 저장시에 발생하는 하나의 선택지 그룹에서의 식별자',
  `selection_order` int DEFAULT NULL COMMENT '단순 순서',
  `KO` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT '한국어',
  `EN` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT '영어',
  `JA` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT '일본어',
  `ZH` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT '중국어번체',
  `SC` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT '중국어간체',
  `AR` varchar(200) DEFAULT NULL COMMENT '아랍어',
  `MS` varchar(200) DEFAULT NULL COMMENT '말레이어',
  `ES` varchar(200) DEFAULT NULL COMMENT '스페인어',
  `RU` varchar(200) DEFAULT NULL,
  UNIQUE KEY `list_selection_unique_IDX` (`project_id`,`episode_id`,`selection_group`,`selection_no`,`selection_order`) USING BTREE,
  KEY `list_selection_selection_id_IDX` (`selection_group`) USING BTREE,
  KEY `list_selection_project_id_IDX` (`project_id`) USING BTREE,
  KEY `list_selection_episode_id_IDX` (`episode_id`) USING BTREE,
  KEY `list_selection_selection_no_IDX` (`selection_no`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='선택지 리스트';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `list_sound`
--

DROP TABLE IF EXISTS `list_sound`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `list_sound` (
  `sound_id` int NOT NULL AUTO_INCREMENT,
  `sound_name` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `sound_url` varchar(160) DEFAULT NULL,
  `sound_key` varchar(120) DEFAULT NULL,
  `bucket` varchar(30) DEFAULT NULL COMMENT 'S3 버킷',
  `game_volume` float DEFAULT '1' COMMENT '게임내 볼륨(0~1)',
  `project_id` int NOT NULL,
  `sound_type` varchar(10) NOT NULL COMMENT 'bgm,se,voice',
  `speaker` varchar(20) DEFAULT NULL COMMENT '음성의 화자',
  `is_public` tinyint NOT NULL DEFAULT '0' COMMENT '음성 공개여부',
  `public_name` varchar(30) DEFAULT NULL COMMENT '공개용 이름',
  PRIMARY KEY (`sound_id`),
  UNIQUE KEY `list_sound_un` (`project_id`,`sound_type`,`sound_name`),
  KEY `list_sound_project_id_IDX` (`project_id`,`sound_type`,`is_public`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=11342 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='프로젝트별 사운드 관리 테이블\r\n(voice/se/bgm)';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `list_sound_lang`
--

DROP TABLE IF EXISTS `list_sound_lang`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `list_sound_lang` (
  `sound_id` int DEFAULT NULL COMMENT '사운드id',
  `lang` varchar(2) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT '언어',
  `public_name` varchar(60) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT '공식 이름',
  UNIQUE KEY `list_sound_lang_un` (`sound_id`,`lang`),
  KEY `list_sound_lang_sound_id_IDX` (`sound_id`,`lang`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='사운드 언어별 리스트';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `list_standard`
--

DROP TABLE IF EXISTS `list_standard`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `list_standard` (
  `standard_id` int NOT NULL AUTO_INCREMENT,
  `standard_class` varchar(20) NOT NULL COMMENT '기준정보 분류',
  `code` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '코드',
  `code_name` varchar(30) NOT NULL COMMENT '코드 명',
  `comment` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT '코멘트',
  `text_id` int DEFAULT NULL COMMENT 'com_localize 아이디',
  `extra` varchar(30) DEFAULT NULL COMMENT '추가정보',
  `sortkey` int NOT NULL DEFAULT '0',
  PRIMARY KEY (`standard_id`),
  KEY `list_standard_standard_class_IDX` (`standard_class`,`code`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=425 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='기준정보 테이블';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `script_validtaion`
--

DROP TABLE IF EXISTS `script_validtaion`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `script_validtaion` (
  `episode_id` int NOT NULL,
  `script_no` bigint NOT NULL,
  `rownum` int NOT NULL,
  `validation` varchar(200) NOT NULL,
  `lang` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT 'KO',
  KEY `script_validtaion_episode_id_IDX` (`episode_id`,`script_no`) USING BTREE,
  KEY `script_validtaion_script_no_IDX` (`script_no`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='스크립트 유효성';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `stat_coin`
--

DROP TABLE IF EXISTS `stat_coin`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `stat_coin` (
  `stat_no` int NOT NULL AUTO_INCREMENT,
  `uid` varchar(10) DEFAULT NULL,
  `coin_product_id` int DEFAULT NULL COMMENT '코인상품id',
  `search_date` datetime DEFAULT NULL COMMENT '조회날짜',
  `create_date` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`stat_no`),
  KEY `stat_coin_search_date_IDX` (`search_date`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=3014 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='코인샵';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `stat_coin_product_sale`
--

DROP TABLE IF EXISTS `stat_coin_product_sale`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `stat_coin_product_sale` (
  `stat_no` int NOT NULL AUTO_INCREMENT COMMENT '유일번호',
  `coin_product_id` int DEFAULT NULL COMMENT '코인상품id',
  `currency` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT '재화id',
  `project_id` int DEFAULT NULL COMMENT '작품id',
  `price` int DEFAULT NULL COMMENT '판매가격',
  `sale_count` int DEFAULT NULL COMMENT '판매건수',
  `coin_total` int DEFAULT NULL COMMENT '코인총합',
  `search_date` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '일자',
  PRIMARY KEY (`stat_no`),
  KEY `stat_coin_product_sale_coin_product_id_IDX` (`coin_product_id`,`search_date`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='코인 상품 판매';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `stat_country`
--

DROP TABLE IF EXISTS `stat_country`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `stat_country` (
  `country_code` varchar(10) NOT NULL,
  `country_name` varchar(30) NOT NULL,
  PRIMARY KEY (`country_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `stat_daily_action`
--

DROP TABLE IF EXISTS `stat_daily_action`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `stat_daily_action` (
  `stat_date` varchar(10) NOT NULL COMMENT '기준일자',
  `dau` int NOT NULL DEFAULT '0' COMMENT '유니크 접속유저',
  `pu` int NOT NULL DEFAULT '0' COMMENT '유니트 결제유저',
  `nru` int NOT NULL DEFAULT '0' COMMENT '유니크 신규유저',
  `ad_waiting_remove` int NOT NULL DEFAULT '0' COMMENT '광고보고 대기시간 10분 차감',
  `coin_waiting_remove` int NOT NULL DEFAULT '0' COMMENT '코인으로 대기시간 모두 제거',
  `remove_ad` int NOT NULL DEFAULT '0' COMMENT '게임 플레이 중 코인으로 광고 제거',
  `episode_clear` int NOT NULL DEFAULT '0' COMMENT '에피소드 첫 클리어보상_기본',
  `episode_clear_ad` int NOT NULL DEFAULT '0' COMMENT '에피소드 첫 클리어보상_광고보고 5배',
  UNIQUE KEY `stat_daily_action_stat_date_IDX` (`stat_date`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='일자별 Raw + 특정 Action';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `stat_date`
--

DROP TABLE IF EXISTS `stat_date`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `stat_date` (
  `stat_date` date DEFAULT NULL,
  UNIQUE KEY `stat_date_stat_date_IDX` (`stat_date`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `stat_episode_action`
--

DROP TABLE IF EXISTS `stat_episode_action`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `stat_episode_action` (
  `stat_no` int NOT NULL AUTO_INCREMENT,
  `project_id` int DEFAULT NULL COMMENT '작품id',
  `episode_id` int DEFAULT NULL COMMENT '에피소드id',
  `clear_count` int DEFAULT NULL COMMENT '클리어 건수',
  `reset_count` int DEFAULT NULL COMMENT '리셋 건수',
  `clear_total` int DEFAULT NULL COMMENT '클리어 건수 누적',
  `premium_change_point_count` int DEFAULT NULL COMMENT '프리미엄 패스 전환 건수',
  `search_date` datetime DEFAULT NULL COMMENT '조회날짜',
  `create_date` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '생성일',
  PRIMARY KEY (`stat_no`),
  UNIQUE KEY `stat_episode_action_project_id_IDX` (`project_id`,`episode_id`,`search_date`) USING BTREE,
  KEY `stat_episode_action_search_date_IDX` (`search_date`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=1946 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='에피소드별 로그 타입';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `stat_episode_play`
--

DROP TABLE IF EXISTS `stat_episode_play`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `stat_episode_play` (
  `stat_no` int NOT NULL AUTO_INCREMENT,
  `project_id` int DEFAULT NULL COMMENT '작품id',
  `episode_id` int DEFAULT NULL COMMENT '에피소드id',
  `free_count` int DEFAULT NULL COMMENT '무료 플레이 건수',
  `star_count` int DEFAULT NULL COMMENT '스타 플레이 건수',
  `premium_count` int DEFAULT NULL COMMENT '프리미엄 플레이 건수',
  `search_date` datetime DEFAULT NULL COMMENT '조회날짜',
  `create_date` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '생성일',
  PRIMARY KEY (`stat_no`),
  UNIQUE KEY `stat_episode_play_project_id_IDX` (`project_id`,`episode_id`,`search_date`) USING BTREE,
  KEY `stat_episode_play_search_date_IDX` (`search_date`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=1399 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='에피소드별 플레이';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `stat_ifyou`
--

DROP TABLE IF EXISTS `stat_ifyou`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `stat_ifyou` (
  `stat_no` int NOT NULL AUTO_INCREMENT,
  `dau` int DEFAULT NULL COMMENT '일 사용자',
  `nru` int DEFAULT NULL COMMENT '신규 앱 설치자',
  `pu` int DEFAULT NULL COMMENT '유료 상품 결제 건수',
  `search_date` datetime DEFAULT NULL COMMENT '조회날짜',
  `create_date` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '생성일',
  PRIMARY KEY (`stat_no`),
  UNIQUE KEY `stat_ifyou_search_date_IDX` (`search_date`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=97 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='ifyou';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `stat_inapp`
--

DROP TABLE IF EXISTS `stat_inapp`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `stat_inapp` (
  `stat_no` int NOT NULL AUTO_INCREMENT,
  `uid` varchar(10) DEFAULT NULL,
  `product_id` varchar(20) DEFAULT NULL COMMENT '상품id',
  `search_date` datetime DEFAULT NULL COMMENT '조회날짜',
  `create_date` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '생성일',
  PRIMARY KEY (`stat_no`),
  KEY `stat_inapp_search_date_IDX` (`search_date`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=158 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='인앱 결제';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `stat_project`
--

DROP TABLE IF EXISTS `stat_project`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `stat_project` (
  `stat_no` int NOT NULL AUTO_INCREMENT,
  `project_id` int DEFAULT NULL COMMENT '작품id',
  `project_enter_count` int DEFAULT NULL COMMENT '작품 진입 건수',
  `project_like_count` int DEFAULT NULL COMMENT '작품 좋아요 건수',
  `ad_view_count` int DEFAULT NULL COMMENT '광고 시청 건수',
  `search_date` datetime DEFAULT NULL COMMENT '조회날짜',
  `create_date` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '생성일',
  PRIMARY KEY (`stat_no`),
  UNIQUE KEY `stat_project_project_id_IDX` (`project_id`,`search_date`) USING BTREE,
  KEY `stat_project_search_date_IDX` (`search_date`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=641 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='작품별';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `stat_project_nru`
--

DROP TABLE IF EXISTS `stat_project_nru`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `stat_project_nru` (
  `stat_date` date DEFAULT NULL,
  `project_id` int DEFAULT NULL,
  `nru` int DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `stat_project_sale`
--

DROP TABLE IF EXISTS `stat_project_sale`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `stat_project_sale` (
  `stat_no` int NOT NULL AUTO_INCREMENT COMMENT '유일번호',
  `project_id` int DEFAULT NULL COMMENT '작품id',
  `star_play` int DEFAULT NULL COMMENT '스타 플레이',
  `premium_play` int DEFAULT NULL COMMENT '프리미엄 플레이',
  `reset` int DEFAULT NULL COMMENT '리셋',
  `free_star_use` int DEFAULT NULL COMMENT '무료 스타 사용',
  `charge_star_use` int DEFAULT NULL COMMENT '유료 스타 사용',
  `free_coin_use` int DEFAULT NULL COMMENT '무료 코인 사용',
  `charge_coin_use` int DEFAULT NULL COMMENT '유료 코인 사용',
  `search_date` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '일자',
  PRIMARY KEY (`stat_no`),
  KEY `stat_project_sale_project_id_IDX` (`project_id`,`search_date`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='작품 판매';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `stat_property`
--

DROP TABLE IF EXISTS `stat_property`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `stat_property` (
  `stat_no` int NOT NULL AUTO_INCREMENT,
  `uid` varchar(10) DEFAULT NULL,
  `project_id` int DEFAULT NULL COMMENT '작품id',
  `currency` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT '재화',
  `quantity` int DEFAULT NULL COMMENT '개수',
  `property_type` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT '사용/획득',
  `property_path` varchar(60) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT '사용/획득 경로',
  `paid` int DEFAULT NULL COMMENT '유/무료',
  `search_date` datetime DEFAULT NULL COMMENT '조회날짜',
  `create_date` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '생성일',
  PRIMARY KEY (`stat_no`),
  KEY `stat_property_search_date_IDX` (`search_date`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=20310 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='재화 사용';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `stat_tutorial`
--

DROP TABLE IF EXISTS `stat_tutorial`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `stat_tutorial` (
  `stat_no` int NOT NULL AUTO_INCREMENT,
  `cancel_count` int DEFAULT NULL COMMENT '튜토리얼 거절 건수',
  `excute_count` int DEFAULT NULL COMMENT '튜토리얼 실행 건수',
  `done_count` int DEFAULT NULL COMMENT '튜토리얼 완료 건수',
  `reward_count` int DEFAULT NULL COMMENT '튜토리얼 보상 획득 건수',
  `search_date` datetime DEFAULT NULL COMMENT '조회날짜',
  `create_date` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '생성일',
  PRIMARY KEY (`stat_no`),
  UNIQUE KEY `stat_tutorial_search_date_IDX` (`search_date`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=96 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='튜토리얼';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `table_account`
--

DROP TABLE IF EXISTS `table_account`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `table_account` (
  `userkey` bigint NOT NULL AUTO_INCREMENT,
  `deviceid` varchar(128) NOT NULL,
  `nickname` varchar(30) DEFAULT NULL COMMENT '닉네임',
  `createtime` datetime DEFAULT CURRENT_TIMESTAMP,
  `lastlogintime` datetime DEFAULT CURRENT_TIMESTAMP,
  `admin` tinyint DEFAULT '0' COMMENT '관리자 여부',
  `gamebaseid` varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT '게임베이스ID',
  `pincode` varchar(4) DEFAULT NULL COMMENT '핀코드',
  `tutorial_step` int NOT NULL DEFAULT '0' COMMENT '튜토리얼 단계',
  `country` varchar(2) DEFAULT NULL COMMENT '유저국가',
  `valid` varchar(1) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT '회원정보 상태',
  `withdrawtime` datetime DEFAULT NULL COMMENT '탈퇴날짜',
  `uid` varchar(20) DEFAULT NULL COMMENT '핀코드 및 userkey 조합',
  `ad_charge` int NOT NULL DEFAULT '0' COMMENT '무료충전소 광고 이용횟수',
  `first_coin_receive` tinyint NOT NULL DEFAULT '0' COMMENT '첫 응모권 수신 여부(플랍)',
  `current_level` int DEFAULT '1' COMMENT '현재 레벨',
  `current_experience` int DEFAULT '0' COMMENT '현재 경험치',
  `account_link` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL DEFAULT '-' COMMENT '계정연동 여부',
  `grade` int DEFAULT '1' COMMENT '현재 시즌의 등급',
  `grade_state` int DEFAULT '0' COMMENT '현재 시즌 정산정보',
  `intro_done` tinyint NOT NULL DEFAULT '0',
  `grade_experience` int DEFAULT '0' COMMENT '현재 누적 업적 경험치',
  `next_grade` int DEFAULT '1' COMMENT '다음 시즌 예상 등급',
  `os` varchar(10) DEFAULT NULL COMMENT '유저 접속 플랫폼',
  `allpass_expiration` datetime DEFAULT NULL COMMENT '올패스 만료시간',
  `current_lang` varchar(10) NOT NULL DEFAULT 'EN' COMMENT '유저의 앱에서의 언어',
  `last_rate_date` datetime NOT NULL DEFAULT '2022-01-01 00:00:00' COMMENT '이전 평점 팝업 오픈 일시',
  `rate_result` tinyint NOT NULL DEFAULT '0' COMMENT '지난 평점 결과',
  `ifyou_pass_day` tinyint DEFAULT '0' COMMENT '이프유 패스 일수',
  `package` varchar(30) DEFAULT NULL COMMENT '계정 생성된 패키지',
  `energy` int NOT NULL DEFAULT '2000' COMMENT '에너지타입 게임에서 사용되는 에너지',
  `current_culture` varchar(20) DEFAULT NULL COMMENT '문화권',
  `invalid_build` tinyint DEFAULT '0',
  `alter_name` varchar(30) DEFAULT NULL,
  `client_ver` varchar(10) DEFAULT NULL COMMENT '마지막 클라이언트 버전',
  PRIMARY KEY (`userkey`),
  UNIQUE KEY `table_account_gamebaseid_IDX` (`gamebaseid`,`package`) USING BTREE,
  UNIQUE KEY `table_account_uid_IDX` (`uid`) USING BTREE,
  KEY `indx_deviceid` (`deviceid`),
  KEY `table_account_package_IDX` (`package`,`userkey`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=2822 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='계정 테이블';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `table_stashed_s3`
--

DROP TABLE IF EXISTS `table_stashed_s3`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `table_stashed_s3` (
  `stash_no` int NOT NULL AUTO_INCREMENT,
  `project_id` int DEFAULT NULL,
  `object_key` varchar(120) DEFAULT NULL,
  `bucket` varchar(30) DEFAULT NULL,
  UNIQUE KEY `table_stashed_s3_un` (`stash_no`),
  KEY `table_stashed_s3_project_id_IDX` (`project_id`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=7411 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `target_delete_s3`
--

DROP TABLE IF EXISTS `target_delete_s3`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `target_delete_s3` (
  `target_no` bigint NOT NULL AUTO_INCREMENT,
  `object_key` varchar(120) DEFAULT NULL,
  `bucket` varchar(30) DEFAULT NULL,
  PRIMARY KEY (`target_no`)
) ENGINE=InnoDB AUTO_INCREMENT=5897 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='삭제 대상 S3 Object';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `target_depoly_table`
--

DROP TABLE IF EXISTS `target_depoly_table`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `target_depoly_table` (
  `depoly_no` int NOT NULL AUTO_INCREMENT COMMENT '일련번호',
  `kind` varchar(60) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT '구분',
  `table_name` varchar(60) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT '테이블명',
  `list_type` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT '디자인/사운드타입',
  PRIMARY KEY (`depoly_no`),
  KEY `target_depoly_table_kind_IDX` (`kind`,`table_name`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=80 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='배포 테이블';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tmp_t`
--

DROP TABLE IF EXISTS `tmp_t`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tmp_t` (
  `num` int DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `user_achievement`
--

DROP TABLE IF EXISTS `user_achievement`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_achievement` (
  `achievement_no` int NOT NULL AUTO_INCREMENT COMMENT '유일번호',
  `userkey` bigint DEFAULT NULL COMMENT '유저키',
  `achievement_id` int DEFAULT NULL COMMENT '업적id',
  `gain_point` int DEFAULT '0' COMMENT '얻은 포인트',
  `achievement_level` int DEFAULT '0' COMMENT '레벨',
  `achievement_date` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '업적 시작일',
  `clear_date` datetime DEFAULT NULL COMMENT '클리어일',
  `current_result` int DEFAULT '0' COMMENT '현재 결과값',
  `is_clear` int DEFAULT '0' COMMENT '클리어여부',
  PRIMARY KEY (`achievement_no`),
  KEY `user_achievement_userkey_IDX` (`userkey`,`achievement_id`,`achievement_date`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=4522 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='유저 업적';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `user_ad_reward`
--

DROP TABLE IF EXISTS `user_ad_reward`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_ad_reward` (
  `userkey` bigint NOT NULL,
  `gem` int NOT NULL DEFAULT '0',
  `local_receive_date` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `project_id` int NOT NULL,
  KEY `user_ad_reward_userkey_IDX` (`userkey`,`local_receive_date`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='유저 광고 리워드';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `user_ad_reward_history`
--

DROP TABLE IF EXISTS `user_ad_reward_history`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_ad_reward_history` (
  `history_no` int NOT NULL AUTO_INCREMENT COMMENT '일렬번호',
  `userkey` bigint DEFAULT NULL COMMENT '유저키',
  `ad_no` int DEFAULT NULL COMMENT '광고 번호',
  `step` int DEFAULT NULL COMMENT '단계',
  `current_result` int DEFAULT NULL COMMENT '현재 값',
  `clear_date` datetime DEFAULT NULL COMMENT '클리어 날짜',
  `action_date` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '생성일',
  PRIMARY KEY (`history_no`),
  KEY `user_ad_reward_history_userkey_IDX` (`userkey`,`ad_no`,`action_date`) USING BTREE,
  KEY `user_ad_reward_history_step_IDX` (`step`) USING BTREE,
  KEY `user_ad_reward_history_clear_date_IDX` (`clear_date`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=137 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='광고 보고 재화얻기 히스토리';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `user_all_clear`
--

DROP TABLE IF EXISTS `user_all_clear`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_all_clear` (
  `clear_no` int NOT NULL AUTO_INCREMENT,
  `userkey` bigint DEFAULT NULL COMMENT '유저키',
  `project_id` int DEFAULT NULL COMMENT '작품id',
  `action_date` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '생성일',
  PRIMARY KEY (`clear_no`),
  KEY `user_all_clear_userkey_IDX` (`userkey`,`project_id`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='작품별 올 클리어';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `user_attendance`
--

DROP TABLE IF EXISTS `user_attendance`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_attendance` (
  `userkey` bigint DEFAULT NULL COMMENT '유저키',
  `attendance_id` int DEFAULT NULL COMMENT '출석 id',
  `loop_cnt` int DEFAULT NULL COMMENT '횟수',
  `day_seq` int DEFAULT NULL COMMENT '데이',
  `currency` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT '재화',
  `quantity` int DEFAULT NULL COMMENT '개수',
  `action_date` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '생성일',
  UNIQUE KEY `user_attendance_userkey_IDX` (`userkey`,`attendance_id`,`loop_cnt`,`day_seq`) USING BTREE,
  KEY `user_attendance_action_date_IDX` (`action_date`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='출석 체크';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `user_challenge`
--

DROP TABLE IF EXISTS `user_challenge`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_challenge` (
  `challenge_hist_no` bigint NOT NULL AUTO_INCREMENT,
  `userkey` bigint NOT NULL,
  `project_id` int NOT NULL,
  `challenge_no` int NOT NULL,
  `open_date` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`challenge_hist_no`),
  UNIQUE KEY `user_challenge_un` (`userkey`,`project_id`,`challenge_no`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `user_coin_exchange`
--

DROP TABLE IF EXISTS `user_coin_exchange`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_coin_exchange` (
  `exchange_no` int NOT NULL AUTO_INCREMENT COMMENT '환전ID',
  `userkey` bigint DEFAULT NULL COMMENT '유저키',
  `star_quantity` int DEFAULT NULL COMMENT '기본 환전',
  `coin_quantity` int DEFAULT NULL COMMENT '코인 환전',
  `bonus_quantity` int DEFAULT NULL COMMENT '보너스 지급',
  `exchange_product_id` int DEFAULT NULL COMMENT '코인 환전 상품 id',
  `exchange_date` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '환전일',
  PRIMARY KEY (`exchange_no`),
  KEY `user_coin_exchange_userkey_IDX` (`userkey`,`exchange_product_id`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=512 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='코인 환전 내역';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `user_coin_purchase`
--

DROP TABLE IF EXISTS `user_coin_purchase`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_coin_purchase` (
  `coin_purchase_no` int NOT NULL AUTO_INCREMENT COMMENT '구매번호',
  `userkey` int DEFAULT NULL COMMENT '유저키',
  `coin_product_id` int DEFAULT NULL COMMENT '상품ID',
  `sell_price` int DEFAULT '0' COMMENT '판매금액',
  `pay_price` int DEFAULT NULL COMMENT '결제금액',
  `currency` text COMMENT '구매한 코인 재화 리스트',
  `coin_purchase_date` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '구매일',
  PRIMARY KEY (`coin_purchase_no`),
  KEY `user_coin_purchase_userkey_IDX` (`userkey`,`coin_purchase_date`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=4467 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='코인 상품 구매 내역';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `user_coin_search`
--

DROP TABLE IF EXISTS `user_coin_search`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_coin_search` (
  `userkey` bigint DEFAULT NULL COMMENT '유저키',
  `search_word` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT '검색어',
  `action_date` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '생성일',
  KEY `user_coin_search_userkey_IDX` (`userkey`,`action_date`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='코인상품 검색어';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `user_continuous_attendance`
--

DROP TABLE IF EXISTS `user_continuous_attendance`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_continuous_attendance` (
  `attendance_no` int NOT NULL AUTO_INCREMENT COMMENT '유일번호',
  `attendance_id` int DEFAULT NULL COMMENT '출석id',
  `userkey` bigint DEFAULT NULL COMMENT '유저키',
  `day_seq` int DEFAULT '3' COMMENT '보상일자',
  `current_result` int DEFAULT '1' COMMENT '현재 출석일',
  `attendance_date` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '출석일자',
  `is_attendance` tinyint DEFAULT '1' COMMENT '연속출석여부 ',
  `reward_date` datetime DEFAULT NULL COMMENT '보상날짜',
  `start_date` datetime DEFAULT NULL COMMENT '시작일',
  `end_date` datetime DEFAULT NULL COMMENT '끝일',
  PRIMARY KEY (`attendance_no`),
  UNIQUE KEY `user_continuous_attendance_attendance_id_IDX` (`attendance_id`,`userkey`,`day_seq`,`start_date`,`end_date`) USING BTREE,
  KEY `user_continuous_attendance_attendance_date_IDX` (`attendance_date`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=157 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='연속 출석 체크';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `user_coupon`
--

DROP TABLE IF EXISTS `user_coupon`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_coupon` (
  `userkey` bigint DEFAULT NULL COMMENT '유저키',
  `coupon_id` int DEFAULT NULL COMMENT '쿠폰ID',
  `coupon_code` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT '쿠폰코드',
  `use_date` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '사용일시',
  KEY `user_coupon_coupon_id_IDX` (`coupon_id`) USING BTREE,
  KEY `user_coupon_userkey_IDX` (`userkey`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='쿠폰 사용 히스토리';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `user_daily_energy`
--

DROP TABLE IF EXISTS `user_daily_energy`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_daily_energy` (
  `userkey` bigint NOT NULL,
  `receive_date` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `user_daily_energy_userkey_IDX` (`userkey`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='유저 일일 에너지 (단일앱 사용)';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `user_daily_mission`
--

DROP TABLE IF EXISTS `user_daily_mission`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_daily_mission` (
  `mission_id` int NOT NULL AUTO_INCREMENT COMMENT '일렬번호',
  `mission_no` int DEFAULT NULL COMMENT '미선번호',
  `userkey` bigint DEFAULT NULL COMMENT '유저키',
  `current_result` int DEFAULT '1' COMMENT '현재값',
  `reward_date` datetime DEFAULT NULL COMMENT '보상 획득 날짜',
  `create_date` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '생성일',
  PRIMARY KEY (`mission_id`),
  KEY `user_daily_mission_mission_no_IDX` (`mission_no`,`userkey`,`create_date`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=1089 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='일일 미션';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `user_daily_mission_record`
--

DROP TABLE IF EXISTS `user_daily_mission_record`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_daily_mission_record` (
  `userkey` bigint NOT NULL,
  `mission_no` int NOT NULL COMMENT '미션 기준정보 key',
  `current_result` int NOT NULL DEFAULT '0' COMMENT '현재 수치',
  `received` tinyint NOT NULL DEFAULT '0',
  PRIMARY KEY (`userkey`,`mission_no`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='유저들의 일일 미션기록 (스케쥴러를 통해서 하루에 한번 초기화 되도록 처리해야한다)';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `user_dlc`
--

DROP TABLE IF EXISTS `user_dlc`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_dlc` (
  `userkey` bigint NOT NULL,
  `project_id` int NOT NULL,
  `dlc_id` int NOT NULL,
  `episode_id` int NOT NULL,
  `scene_id` varchar(10) DEFAULT NULL,
  `script_no` bigint DEFAULT '0',
  `is_final` tinyint NOT NULL DEFAULT '0',
  `update_date` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `user_dlc_userkey_IDX` (`userkey`,`project_id`,`dlc_id`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='유저 DLC 기록';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `user_ending`
--

DROP TABLE IF EXISTS `user_ending`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_ending` (
  `userkey` bigint NOT NULL,
  `episode_id` int NOT NULL,
  `open_date` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `project_id` int DEFAULT NULL,
  UNIQUE KEY `user_ending_un` (`userkey`,`episode_id`),
  KEY `user_ending_episode_id_IDX` (`episode_id`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='유저가 수집한 엔딩';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `user_episode_ad_reward`
--

DROP TABLE IF EXISTS `user_episode_ad_reward`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_episode_ad_reward` (
  `userkey` bigint NOT NULL,
  `project_id` int NOT NULL,
  `episode_id` int NOT NULL,
  `receive_date` datetime DEFAULT CURRENT_TIMESTAMP,
  `quantity` int DEFAULT '0',
  UNIQUE KEY `user_episode_ad_reward_userkey_IDX` (`userkey`,`project_id`,`episode_id`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COMMENT='오토메 에피소드 광고 리워드 기록';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `user_episode_hist`
--

DROP TABLE IF EXISTS `user_episode_hist`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_episode_hist` (
  `userkey` bigint NOT NULL,
  `project_id` int NOT NULL,
  `episode_id` int NOT NULL,
  `first_play` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '첫 플레이 시작시간',
  PRIMARY KEY (`userkey`,`project_id`,`episode_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='유저 에피소드 히스토리 (초기화 되지 않음)';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `user_episode_next`
--

DROP TABLE IF EXISTS `user_episode_next`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_episode_next` (
  `userkey` bigint NOT NULL,
  `project_id` int NOT NULL,
  `episode_id` int NOT NULL,
  `is_ending` tinyint NOT NULL DEFAULT '0' COMMENT '엔딩 여부',
  KEY `user_episode_next_userkey_IDX` (`userkey`,`project_id`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='작품별 다음 에피소드 정보 지정';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `user_episode_progress`
--

DROP TABLE IF EXISTS `user_episode_progress`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_episode_progress` (
  `userkey` bigint NOT NULL,
  `project_id` int NOT NULL,
  `episode_id` int NOT NULL,
  `open_date` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '오픈 일자',
  `is_clear` int NOT NULL DEFAULT '0' COMMENT '완료되었는지 체크',
  `clear_date` datetime DEFAULT NULL COMMENT '클리어 일자',
  PRIMARY KEY (`userkey`,`project_id`,`episode_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='유저 에피소드 플레이 진척도 (재플레이시 초기화)';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `user_episode_purchase`
--

DROP TABLE IF EXISTS `user_episode_purchase`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_episode_purchase` (
  `purchase_no` bigint NOT NULL AUTO_INCREMENT,
  `userkey` bigint NOT NULL,
  `project_id` int NOT NULL COMMENT '스토리 프로젝트 ID',
  `episode_id` int NOT NULL COMMENT '에피소드 ID',
  `currency` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '사용한 화폐 종류',
  `currency_count` int NOT NULL COMMENT '사용한 화폐 개수',
  `purchase_date` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '구매 날짜',
  `expire_date` datetime DEFAULT NULL COMMENT '만료일자',
  `purchase_type` varchar(20) DEFAULT NULL COMMENT '구매형태 Rent/OneTime/Permanent',
  `permanent` tinyint NOT NULL DEFAULT '0' COMMENT '영구 구매',
  `onetime_playable` varchar(100) DEFAULT NULL COMMENT '1회권 플레이 가능여부',
  PRIMARY KEY (`purchase_no`),
  KEY `indx_user` (`userkey`,`project_id`),
  KEY `user_episode_purchase_userkey_IDX` (`userkey`,`episode_id`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=8602 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='유저 에피소드 구매기록';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `user_favor`
--

DROP TABLE IF EXISTS `user_favor`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_favor` (
  `favor_hist_no` bigint NOT NULL AUTO_INCREMENT,
  `userkey` bigint NOT NULL,
  `project_id` int NOT NULL,
  `favor_name` varchar(20) NOT NULL,
  `score` int NOT NULL,
  `update_date` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`favor_hist_no`),
  UNIQUE KEY `user_favor_un` (`userkey`,`project_id`,`favor_name`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `user_feedback`
--

DROP TABLE IF EXISTS `user_feedback`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_feedback` (
  `userkey` bigint NOT NULL,
  `feedback` varchar(2000) NOT NULL,
  `email` varchar(40) NOT NULL,
  `create_date` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `feedback_no` int NOT NULL AUTO_INCREMENT,
  PRIMARY KEY (`feedback_no`),
  KEY `user_feedback_userkey_IDX` (`userkey`,`create_date`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb3 COMMENT='유저 피드백';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `user_grade_benefit`
--

DROP TABLE IF EXISTS `user_grade_benefit`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_grade_benefit` (
  `benefit_no` bigint NOT NULL AUTO_INCREMENT,
  `userkey` bigint NOT NULL,
  `grade` int NOT NULL,
  `purchase_date` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `bonus_star` int NOT NULL DEFAULT '0',
  PRIMARY KEY (`benefit_no`),
  KEY `user_grade_benefit_userkey_IDX` (`userkey`,`grade`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='등급별 혜택 정보';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `user_grade_hist`
--

DROP TABLE IF EXISTS `user_grade_hist`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_grade_hist` (
  `history_no` int NOT NULL AUTO_INCREMENT COMMENT '히스토리id',
  `userkey` bigint DEFAULT NULL COMMENT '유저키',
  `grade` int DEFAULT NULL COMMENT '원 시즌 등급',
  `next_grade` int DEFAULT '0' COMMENT '다음 시즌 등급',
  `grade_experience` int DEFAULT '0' COMMENT '원 시즌 경험치',
  `next_grade_experience` int DEFAULT '0' COMMENT '다음 시즌 경험치',
  `grade_state` int DEFAULT '0' COMMENT '등급 정산 상태',
  `start_date` datetime DEFAULT NULL COMMENT '시즌 시작일',
  `end_date` datetime DEFAULT NULL COMMENT '시즌 끝일',
  PRIMARY KEY (`history_no`),
  UNIQUE KEY `user_grade_hist_userkey_IDX` (`userkey`,`start_date`,`end_date`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=15677 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='유저 등급 히스토리';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `user_illust`
--

DROP TABLE IF EXISTS `user_illust`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_illust` (
  `illust_hist_no` bigint NOT NULL AUTO_INCREMENT,
  `userkey` bigint NOT NULL,
  `project_id` int NOT NULL,
  `illust_id` int NOT NULL,
  `illust_type` varchar(10) NOT NULL DEFAULT 'illust',
  `open_date` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `share_bonus` tinyint NOT NULL DEFAULT '0',
  `gallery_open` int NOT NULL DEFAULT '0' COMMENT '갤러리에서 열어봤나요',
  PRIMARY KEY (`illust_hist_no`),
  UNIQUE KEY `user_illust_un` (`userkey`,`project_id`,`illust_type`,`illust_id`)
) ENGINE=InnoDB AUTO_INCREMENT=4683 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='유저 일러스트 수집 기록';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `user_inquiry`
--

DROP TABLE IF EXISTS `user_inquiry`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_inquiry` (
  `inquiry_no` bigint NOT NULL AUTO_INCREMENT,
  `client` varchar(120) DEFAULT NULL,
  `company` varchar(120) DEFAULT NULL,
  `tel` varchar(120) DEFAULT NULL,
  `email` varchar(120) DEFAULT NULL,
  `contents` varchar(2000) DEFAULT NULL,
  `kind` varchar(5) DEFAULT 'ifyou' COMMENT '구분',
  `state` int DEFAULT '0' COMMENT '확인',
  `memo` text COMMENT '메모',
  `create_date` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '생성일',
  PRIMARY KEY (`inquiry_no`),
  KEY `user_inquiry_create_date_IDX` (`create_date`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=24 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='문의';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `user_level_history`
--

DROP TABLE IF EXISTS `user_level_history`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_level_history` (
  `history_no` int NOT NULL AUTO_INCREMENT COMMENT '히스토리 번호',
  `userkey` bigint DEFAULT NULL COMMENT '유저키',
  `current_level` int DEFAULT NULL COMMENT '현 레벨',
  `experience` int DEFAULT NULL COMMENT '경험치',
  `route` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT '경험치 획득한 조건',
  `clear_id` int DEFAULT NULL COMMENT '해당된 에피소드id or 미션id',
  `project_id` int DEFAULT NULL COMMENT '작품id',
  `currency` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT '' COMMENT '재화(목표 레벨에 도달하면 재화가 찍힘)',
  `is_event` int DEFAULT '0' COMMENT '이벤트여부',
  `update_date` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '생성일',
  PRIMARY KEY (`history_no`),
  KEY `user_level_history_userkey_IDX` (`userkey`,`update_date`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=1774 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='유저별 누적 경험치';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `user_mail`
--

DROP TABLE IF EXISTS `user_mail`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_mail` (
  `mail_no` bigint NOT NULL AUTO_INCREMENT COMMENT 'id',
  `userkey` bigint NOT NULL,
  `mail_type` varchar(30) NOT NULL COMMENT '메일타입',
  `currency` varchar(20) DEFAULT NULL COMMENT '재화',
  `quantity` int DEFAULT NULL COMMENT '재화 수량',
  `send_date` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '발송 일시',
  `expire_date` datetime DEFAULT NULL COMMENT '만료 일시',
  `receive_date` datetime DEFAULT NULL COMMENT '수신 일시',
  `is_receive` tinyint NOT NULL DEFAULT '0' COMMENT '수신 여부',
  `connected_project` int NOT NULL DEFAULT '-1' COMMENT '연결 프로젝트',
  `contents` int DEFAULT NULL COMMENT '관련내용 로컬언어ID',
  `reservation_no` int DEFAULT '0',
  `purchase_no` int DEFAULT '0' COMMENT '상품구매',
  `coin_purchase_no` int DEFAULT '0' COMMENT '코인 상점 구매',
  `paid` tinyint NOT NULL DEFAULT '0' COMMENT '유료재화 여부',
  PRIMARY KEY (`mail_no`),
  KEY `user_mail_mail_type_IDX` (`mail_type`,`send_date`,`expire_date`) USING BTREE,
  KEY `user_mail_reservation_no_IDX` (`reservation_no`,`is_receive`) USING BTREE,
  KEY `user_mail_purchase_no_IDX` (`purchase_no`,`is_receive`) USING BTREE,
  KEY `user_mail_coin_purchase_no_IDX` (`coin_purchase_no`,`is_receive`) USING BTREE,
  KEY `user_mail_userkey_IDX` (`userkey`,`connected_project`,`is_receive`,`expire_date`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=246 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='유저 메일함';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `user_minicut`
--

DROP TABLE IF EXISTS `user_minicut`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_minicut` (
  `userkey` bigint NOT NULL,
  `minicut_id` int NOT NULL COMMENT 'live_object_id, minicut_id',
  `minicut_type` varchar(20) NOT NULL COMMENT '''image'', ''live2d''',
  `project_id` int NOT NULL,
  `open_date` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `share_bonus` tinyint NOT NULL DEFAULT '0',
  `gallery_open` int NOT NULL DEFAULT '0' COMMENT '갤러리에서 열어봤나요',
  PRIMARY KEY (`userkey`,`minicut_id`,`minicut_type`),
  KEY `user_minicut_userkey_IDX` (`userkey`,`project_id`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='유저 미니컷 수집 정보';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `user_mission`
--

DROP TABLE IF EXISTS `user_mission`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_mission` (
  `userkey` bigint NOT NULL,
  `mission_id` int NOT NULL COMMENT '미션 ID',
  `open_date` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '해금일시',
  `unlock_state` tinyint NOT NULL DEFAULT '0' COMMENT '미션해금 상태 : 0(해금), 1(보상수령)',
  `receive_date` datetime DEFAULT NULL COMMENT '보상 수량 일시',
  `project_id` int DEFAULT NULL,
  UNIQUE KEY `user_mission_un` (`mission_id`,`userkey`),
  KEY `user_mission_userkey_IDX` (`userkey`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='유저 달성 미션 테이블';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `user_mission_all_clear`
--

DROP TABLE IF EXISTS `user_mission_all_clear`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_mission_all_clear` (
  `mission_no` int NOT NULL AUTO_INCREMENT COMMENT '유일번호',
  `userkey` bigint DEFAULT NULL COMMENT '유저키',
  `project_id` int DEFAULT NULL COMMENT '작품id',
  `action_date` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '생성일',
  PRIMARY KEY (`mission_no`),
  UNIQUE KEY `user_mission_all_clear_userkey_IDX` (`userkey`,`project_id`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=28 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='미션 올 클리어';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `user_oneday_pass`
--

DROP TABLE IF EXISTS `user_oneday_pass`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_oneday_pass` (
  `userkey` bigint DEFAULT NULL COMMENT '유저키',
  `project_id` int DEFAULT NULL COMMENT '작품id',
  `purchase_no` int DEFAULT NULL COMMENT '구매id',
  `purchase_date` datetime DEFAULT NULL COMMENT '구매일',
  UNIQUE KEY `user_oneday_pass_userkey_IDX` (`userkey`,`project_id`) USING BTREE,
  KEY `user_oneday_pass_purchase_no_IDX` (`purchase_no`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='원데이 패스';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `user_package_mission`
--

DROP TABLE IF EXISTS `user_package_mission`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_package_mission` (
  `mission_no` bigint NOT NULL AUTO_INCREMENT,
  `userkey` bigint NOT NULL,
  `twitter_mission` tinyint NOT NULL DEFAULT '0' COMMENT '트위터 미션',
  `review_mission` tinyint NOT NULL DEFAULT '0' COMMENT '게임 리뷰 미션',
  `update_date` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`mission_no`),
  UNIQUE KEY `user_package_mission_userkey_IDX` (`userkey`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=58 DEFAULT CHARSET=utf8mb3 COMMENT='패키지 시스템 미션';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `user_pass_timedeal`
--

DROP TABLE IF EXISTS `user_pass_timedeal`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_pass_timedeal` (
  `userkey` bigint NOT NULL,
  `project_id` int NOT NULL,
  `timedeal_id` int NOT NULL,
  `end_date` datetime NOT NULL,
  `discount` int NOT NULL,
  PRIMARY KEY (`userkey`,`project_id`,`timedeal_id`),
  KEY `user_pass_timedeal_end_date_IDX` (`end_date`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='유저 프리미엄 패스 타임딜';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `user_premium_pass`
--

DROP TABLE IF EXISTS `user_premium_pass`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_premium_pass` (
  `userkey` bigint DEFAULT NULL COMMENT '유저키',
  `project_id` int DEFAULT NULL COMMENT '작품id',
  `purchase_no` int DEFAULT NULL COMMENT '구매아이디',
  `purchase_date` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '구매일',
  `star_price` int DEFAULT '0',
  UNIQUE KEY `user_premium_pass_userkey_IDX` (`userkey`,`project_id`) USING BTREE,
  KEY `user_premium_pass_purchase_no_IDX` (`purchase_no`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='프리미엄 패스 구매 내역';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `user_premium_reward`
--

DROP TABLE IF EXISTS `user_premium_reward`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_premium_reward` (
  `reward_no` int NOT NULL AUTO_INCREMENT COMMENT '일련번호',
  `userkey` bigint DEFAULT NULL COMMENT '유저키',
  `project_id` int DEFAULT NULL COMMENT '작품id',
  `premium_id` int DEFAULT NULL COMMENT '프리미엄id',
  `chapter_number` int DEFAULT NULL COMMENT '에피 순번',
  `free_reward_date` datetime DEFAULT NULL COMMENT '무료 보상일',
  `premium_reward_date` datetime DEFAULT NULL COMMENT '프리미엄 보상일',
  PRIMARY KEY (`reward_no`),
  UNIQUE KEY `user_premium_reward_userkey_IDX` (`userkey`,`project_id`,`premium_id`,`chapter_number`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=41 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='프리미이머 챌린지 보상 내역';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `user_prize_address`
--

DROP TABLE IF EXISTS `user_prize_address`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_prize_address` (
  `address_no` bigint NOT NULL AUTO_INCREMENT,
  `userkey` bigint NOT NULL,
  `address_name` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '배송지명',
  `receiver` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '수신자',
  `phone1` varchar(10) NOT NULL,
  `phone2` varchar(10) NOT NULL,
  `phone3` varchar(10) NOT NULL,
  `zipcode` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '우편번호',
  `address1` varchar(80) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `address2` varchar(80) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `email` varchar(50) DEFAULT NULL,
  UNIQUE KEY `user_prize_address_un` (`address_no`),
  KEY `user_prize_address_userkey_IDX` (`userkey`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=96 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='유저 응모권 배송지';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `user_prize_history`
--

DROP TABLE IF EXISTS `user_prize_history`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_prize_history` (
  `history_no` bigint NOT NULL AUTO_INCREMENT,
  `userkey` bigint NOT NULL,
  `prize_id` int NOT NULL,
  `action_date` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '응모일시',
  `use_coin` int NOT NULL COMMENT '사용 코인 개수',
  `is_win` tinyint NOT NULL COMMENT '당첨 여부',
  `address_no` bigint NOT NULL DEFAULT '-1' COMMENT '배송지 정보',
  UNIQUE KEY `user_prize_history_un` (`history_no`),
  KEY `user_prize_history_userkey_IDX` (`userkey`,`is_win`) USING BTREE,
  KEY `user_prize_history_prize_id_IDX` (`prize_id`,`is_win`,`action_date`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=4108 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='유저 응모 내역';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `user_profile_currency`
--

DROP TABLE IF EXISTS `user_profile_currency`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_profile_currency` (
  `userkey` bigint DEFAULT NULL COMMENT '유저키',
  `currency` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT '재화',
  `sorting_order` int DEFAULT NULL COMMENT '화면상의 정렬 순서',
  `pos_x` float DEFAULT '0' COMMENT '위치 x좌표',
  `pos_y` float DEFAULT '0' COMMENT '위치 y좌표',
  `width` float DEFAULT '300' COMMENT '길이',
  `height` float DEFAULT '300' COMMENT '높이',
  `angle` float DEFAULT '0' COMMENT '회전값',
  KEY `user_profile_currency_userkey_IDX` (`userkey`,`currency`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='프로필에 저장된 재화 정보';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `user_profile_text`
--

DROP TABLE IF EXISTS `user_profile_text`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_profile_text` (
  `text_id` int NOT NULL AUTO_INCREMENT,
  `userkey` bigint DEFAULT NULL COMMENT '유저키',
  `input_text` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci COMMENT '내용',
  `font_size` int DEFAULT NULL COMMENT '폰트 사이즈',
  `color_rgb` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT '색상 rgb 코드',
  `sorting_order` int DEFAULT NULL COMMENT '화면 상의 정렬 순서',
  `pos_x` float DEFAULT '0' COMMENT '위치 x좌표',
  `pos_y` float DEFAULT '0' COMMENT '위치 y좌표',
  `angle` float DEFAULT '0' COMMENT '회전값',
  PRIMARY KEY (`text_id`),
  KEY `user_profile_text_userkey_IDX` (`userkey`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=180 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='프로필에 저장된 텍스트 정보';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `user_progress_reset_history`
--

DROP TABLE IF EXISTS `user_progress_reset_history`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_progress_reset_history` (
  `history_no` int NOT NULL AUTO_INCREMENT COMMENT '유일번호',
  `userkey` bigint DEFAULT NULL COMMENT '유저키',
  `project_id` int DEFAULT NULL COMMENT '작품id',
  `episode_id` int DEFAULT NULL COMMENT '에피소드id',
  `scene_id` int DEFAULT NULL COMMENT '씬id',
  `current_selection_group` int DEFAULT NULL COMMENT '현재 위치',
  `reset_selection_group` int DEFAULT NULL COMMENT '리셋 위치',
  `quantity` int DEFAULT NULL COMMENT '개수',
  `create_date` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '생성일',
  PRIMARY KEY (`history_no`),
  KEY `user_progress_reset_history_userkey_IDX` (`userkey`,`project_id`,`episode_id`,`scene_id`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='프로그레스 히스토리';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `user_project_challenge`
--

DROP TABLE IF EXISTS `user_project_challenge`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_project_challenge` (
  `userkey` bigint NOT NULL,
  `project_id` int NOT NULL,
  `challenge_no` int NOT NULL,
  `clear_date` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '달성일자',
  PRIMARY KEY (`userkey`,`project_id`,`challenge_no`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='유저의 프로젝트별 도전과제 달성 기록';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `user_project_current`
--

DROP TABLE IF EXISTS `user_project_current`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_project_current` (
  `userkey` bigint NOT NULL,
  `project_id` int NOT NULL COMMENT '작품ID',
  `is_special` tinyint NOT NULL DEFAULT '0' COMMENT '스페셜 에피소드 여부',
  `episode_id` int NOT NULL COMMENT '에피소드 ID',
  `scene_id` varchar(10) DEFAULT NULL COMMENT '사건 ID',
  `script_no` bigint DEFAULT NULL COMMENT '스크립트 위치',
  `is_final` tinyint NOT NULL DEFAULT '0' COMMENT '막다른 길에 도달함',
  `update_date` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '최종 변경 시간',
  `next_open_time` datetime DEFAULT NULL COMMENT '에피소드 오픈 시간',
  UNIQUE KEY `user_project_current_un` (`userkey`,`project_id`,`is_special`),
  KEY `user_project_current_userkey_IDX2` (`userkey`,`episode_id`) USING BTREE,
  KEY `user_project_current_userkey_IDX` (`userkey`,`update_date`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='유저 작품별 현재 위치!';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `user_project_dress`
--

DROP TABLE IF EXISTS `user_project_dress`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_project_dress` (
  `dress_no` bigint NOT NULL AUTO_INCREMENT,
  `userkey` bigint NOT NULL,
  `project_id` int NOT NULL,
  `speaker` varchar(20) NOT NULL,
  `default_dress_id` int DEFAULT NULL,
  `current_currency` varchar(20) DEFAULT NULL,
  `is_main` tinyint DEFAULT '0',
  PRIMARY KEY (`dress_no`),
  UNIQUE KEY `user_project_dress_userkey_IDX2` (`userkey`,`project_id`,`speaker`) USING BTREE,
  KEY `user_project_dress_userkey_IDX` (`userkey`,`project_id`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=4120 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='유저 프로젝트별 의상 저장 정보';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `user_project_like`
--

DROP TABLE IF EXISTS `user_project_like`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_project_like` (
  `userkey` bigint DEFAULT NULL COMMENT '유저키',
  `project_id` int DEFAULT NULL COMMENT '작품id',
  `create_date` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '생성일',
  KEY `user_project_like_userkey_IDX` (`userkey`,`project_id`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='좋아하는 작품 리스트';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `user_project_notification`
--

DROP TABLE IF EXISTS `user_project_notification`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_project_notification` (
  `userkey` bigint NOT NULL,
  `project_id` int NOT NULL,
  `is_notify` tinyint NOT NULL DEFAULT '0' COMMENT '알림설정 여부',
  `last_modified` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '마지막 수정일시',
  UNIQUE KEY `user_project_notification_un` (`userkey`,`project_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='유저 작품 알람설정';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `user_project_notification_hist`
--

DROP TABLE IF EXISTS `user_project_notification_hist`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_project_notification_hist` (
  `userkey` bigint NOT NULL,
  `project_id` int NOT NULL,
  `episode_id` int NOT NULL,
  `send_date` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `user_project_notification_hist_userkey_IDX` (`userkey`,`project_id`,`episode_id`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `user_project_progress_order`
--

DROP TABLE IF EXISTS `user_project_progress_order`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_project_progress_order` (
  `userkey` bigint DEFAULT NULL COMMENT '유저키',
  `project_id` int DEFAULT NULL COMMENT '작품id',
  `episode_id` int DEFAULT NULL COMMENT '에피소드id',
  `scene_id` varchar(10) DEFAULT NULL COMMENT '씬id',
  `selection_group` int DEFAULT NULL COMMENT '선택지 그룹',
  `route` int DEFAULT NULL COMMENT '경로 순서',
  `create_date` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '생성일',
  KEY `user_project_progress_order_userkey_IDX` (`userkey`,`project_id`,`episode_id`,`route`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='작품 진행 순서';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `user_property`
--

DROP TABLE IF EXISTS `user_property`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_property` (
  `property_no` bigint NOT NULL AUTO_INCREMENT COMMENT '식별자',
  `userkey` bigint NOT NULL COMMENT '유저 ID',
  `currency` varchar(20) NOT NULL COMMENT '재화',
  `quantity` int NOT NULL DEFAULT '1' COMMENT '수량',
  `current_quantity` int DEFAULT NULL COMMENT '현재 수량',
  `path_code` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL DEFAULT 'unknown' COMMENT '습득 경로(standard)',
  `expire_date` datetime NOT NULL DEFAULT '9999-12-31 00:00:00' COMMENT '만료일',
  `paid` tinyint NOT NULL DEFAULT '0' COMMENT '유료 재화 여부',
  `input_date` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`property_no`),
  KEY `user_property_userkey_IDX` (`userkey`,`currency`,`expire_date`) USING BTREE,
  KEY `user_property_userkey_IDX2` (`userkey`,`path_code`,`expire_date`) USING BTREE,
  KEY `user_property_userkey_IDX3` (`userkey`,`currency`,`current_quantity`,`expire_date`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=29428 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='유저 재산 테이블';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `user_purchase`
--

DROP TABLE IF EXISTS `user_purchase`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_purchase` (
  `purchase_no` int NOT NULL AUTO_INCREMENT,
  `userkey` bigint NOT NULL,
  `product_id` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '구매상품ID',
  `receipt` varchar(2000) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT '영수증',
  `state` int DEFAULT '0' COMMENT '상태',
  `price` float DEFAULT '0' COMMENT '구매 가격',
  `product_currency` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT 'KRW' COMMENT '통화',
  `payment_seq` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT '게임베이스 식별자1',
  `purchase_token` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT '게임베이스 식별자2',
  `purchase_date` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '구매날짜',
  `product_master_id` int NOT NULL DEFAULT '-1' COMMENT '상품정보의 master_id',
  PRIMARY KEY (`purchase_no`),
  KEY `user_purchase_userkey_IDX` (`userkey`) USING BTREE,
  KEY `user_purchase_userkey_IDX2` (`userkey`,`product_master_id`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=8295 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='유저 구매 내역';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `user_reset`
--

DROP TABLE IF EXISTS `user_reset`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_reset` (
  `userkey` bigint NOT NULL,
  `project_id` int NOT NULL,
  `reset_count` int NOT NULL DEFAULT '0' COMMENT '리셋 카운트',
  UNIQUE KEY `user_reset_un` (`userkey`,`project_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='유저 작품별 리셋 횟수';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `user_scene_hist`
--

DROP TABLE IF EXISTS `user_scene_hist`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_scene_hist` (
  `userkey` bigint NOT NULL,
  `project_id` int NOT NULL COMMENT '프로젝트 ID',
  `episode_id` int DEFAULT NULL COMMENT '에피소드 ID',
  `scene_id` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '사건 ID',
  `open_date` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '최초오픈시간',
  UNIQUE KEY `user_scene_hist_un` (`userkey`,`project_id`,`scene_id`),
  KEY `user_scene_hist_userkey_IDX` (`userkey`,`scene_id`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='유저 사건ID 누적 기록';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `user_scene_progress`
--

DROP TABLE IF EXISTS `user_scene_progress`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_scene_progress` (
  `userkey` bigint NOT NULL,
  `project_id` int NOT NULL,
  `episode_id` int NOT NULL,
  `scene_id` varchar(10) NOT NULL COMMENT '사건 ID',
  `clear_date` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`userkey`,`project_id`,`episode_id`,`scene_id`),
  KEY `user_scene_progress_userkey_IDX` (`userkey`,`scene_id`) USING BTREE,
  KEY `user_scene_progress_userkey_IDX2` (`userkey`,`episode_id`,`scene_id`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='유저 사건ID 진행도';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `user_selection_current`
--

DROP TABLE IF EXISTS `user_selection_current`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_selection_current` (
  `userkey` int NOT NULL COMMENT '유저키',
  `project_id` int NOT NULL COMMENT '작품ID',
  `play_count` int NOT NULL COMMENT 'N회차 플레이',
  `episode_id` int NOT NULL COMMENT '에피소드ID',
  `selection_group` int NOT NULL COMMENT '선택지그룹번호',
  `selection_no` int DEFAULT NULL COMMENT '선택지번호',
  `target_scene_id` int DEFAULT NULL COMMENT '타켓ID',
  `action_date` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '생성일',
  UNIQUE KEY `user_selection_current_userkey_IDX` (`userkey`,`project_id`,`play_count`,`episode_id`,`selection_group`) USING BTREE,
  KEY `user_selection_current_userkey_IDX2` (`userkey`,`project_id`,`play_count`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='현재 선택지 로그';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `user_selection_ending`
--

DROP TABLE IF EXISTS `user_selection_ending`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_selection_ending` (
  `userkey` int DEFAULT NULL COMMENT '유저키',
  `project_id` int DEFAULT NULL COMMENT '작품ID',
  `play_count` int DEFAULT NULL COMMENT 'N회차 플레이',
  `ending_id` int DEFAULT NULL COMMENT '엔딩ID',
  `episode_id` int DEFAULT NULL COMMENT '에피소드ID',
  `selection_group` int DEFAULT NULL COMMENT '선택지그룹번호',
  `selection_no` int DEFAULT NULL COMMENT '선택지번호',
  `origin_action_date` datetime DEFAULT NULL COMMENT 'current 테이블 생성일',
  `update_date` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '생성일',
  UNIQUE KEY `user_selection_ending_un` (`userkey`,`project_id`,`play_count`,`ending_id`,`episode_id`,`selection_group`),
  KEY `user_selection_ending_userkey_IDX` (`userkey`,`project_id`,`play_count`,`ending_id`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='첫화~엔딩까지의 선택지 히스토리';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `user_selection_hint_purchase`
--

DROP TABLE IF EXISTS `user_selection_hint_purchase`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_selection_hint_purchase` (
  `purchase_no` int NOT NULL AUTO_INCREMENT COMMENT '유일번호',
  `userkey` bigint DEFAULT NULL COMMENT '유저키',
  `project_id` int DEFAULT '-1' COMMENT '프로젝트id',
  `episode_id` int DEFAULT NULL COMMENT '에피소드id',
  `scene_id` varchar(10) DEFAULT NULL COMMENT '씬id',
  `selection_group` int DEFAULT NULL COMMENT '선택지 그룹',
  `selection_no` int DEFAULT NULL COMMENT '선택지 번호',
  `price` int DEFAULT NULL COMMENT '가격',
  `purchase_date` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '구매일',
  PRIMARY KEY (`purchase_no`),
  UNIQUE KEY `user_selection_hint_purchase_userkey_IDX` (`userkey`,`project_id`,`episode_id`,`scene_id`,`selection_group`,`selection_no`) USING BTREE,
  KEY `user_selection_hint_purchase_purchase_date_IDX` (`purchase_date`)
) ENGINE=InnoDB AUTO_INCREMENT=170 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='선택지 힌트 사용 내역';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `user_selection_progress`
--

DROP TABLE IF EXISTS `user_selection_progress`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_selection_progress` (
  `userkey` bigint NOT NULL,
  `project_id` int NOT NULL,
  `episode_id` int NOT NULL,
  `target_scene_id` varchar(10) NOT NULL COMMENT '선택으로 이동된 사건ID',
  `selection_data` varchar(240) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT '선택지 텍스트 (식별용)',
  `update_date` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY `user_selection_progress_userkey_IDX` (`userkey`,`project_id`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='유저 선택지 Progress 저장';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `user_selection_purchase`
--

DROP TABLE IF EXISTS `user_selection_purchase`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_selection_purchase` (
  `userkey` bigint NOT NULL,
  `project_id` int NOT NULL,
  `episode_id` int NOT NULL,
  `selection_group` int NOT NULL,
  `selection_no` int NOT NULL,
  `price` int NOT NULL COMMENT '구매 가격',
  `purchase_date` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `user_selection_purchase_userkey_IDX` (`userkey`,`project_id`,`episode_id`,`selection_group`,`selection_no`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='선택지 구매 로그';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `user_side`
--

DROP TABLE IF EXISTS `user_side`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_side` (
  `userkey` bigint NOT NULL,
  `episode_id` int NOT NULL COMMENT '사이드 에피소드 ID',
  `open_date` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `project_id` int DEFAULT NULL,
  UNIQUE KEY `user_side_un` (`userkey`,`episode_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='유저가 해금한 사이드 에피소드 리스트';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `user_story_ability`
--

DROP TABLE IF EXISTS `user_story_ability`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_story_ability` (
  `userkey` bigint NOT NULL,
  `project_id` int NOT NULL,
  `episode_id` int NOT NULL COMMENT '능력 획득 에피소드',
  `scene_id` int NOT NULL COMMENT '능력 획득 SCENE',
  `ability_id` int NOT NULL COMMENT '능력 ID',
  `add_value` int NOT NULL DEFAULT '0',
  `get_date` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY `user_story_ability_userkey_IDX` (`userkey`,`project_id`,`episode_id`) USING BTREE,
  KEY `user_story_ability_userkey_IDX2` (`userkey`,`ability_id`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='유저 작품별 능력 (작품에서 획득)';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `user_story_profile`
--

DROP TABLE IF EXISTS `user_story_profile`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_story_profile` (
  `userkey` bigint DEFAULT NULL COMMENT '유저키',
  `project_id` int NOT NULL,
  `currency` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT '재화',
  `sorting_order` int DEFAULT NULL COMMENT '화면상의 정렬 순서',
  `pos_x` float DEFAULT '0' COMMENT '위치 x좌표',
  `pos_y` float DEFAULT '0' COMMENT '위치 y좌표',
  `width` float DEFAULT '300' COMMENT '길이',
  `height` float DEFAULT '300' COMMENT '높이',
  `angle` float DEFAULT '0' COMMENT '회전값',
  KEY `user_story_profile_userkey_IDX` (`userkey`,`project_id`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='유저 작품별 프로필';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `user_survey`
--

DROP TABLE IF EXISTS `user_survey`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_survey` (
  `history_no` int NOT NULL AUTO_INCREMENT COMMENT '일렬번호',
  `userkey` bigint DEFAULT NULL COMMENT '유저키',
  `survey_id` int DEFAULT NULL COMMENT '설문조사 아이디',
  `question_id` int DEFAULT NULL COMMENT '질문 아이디',
  `answer` varchar(1000) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT '답변 아이디',
  `sortkey` int DEFAULT NULL COMMENT '정렬키',
  `survey_date` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '생성일',
  PRIMARY KEY (`history_no`),
  UNIQUE KEY `user_survey_userkey_IDX` (`userkey`,`survey_id`,`question_id`) USING BTREE,
  KEY `user_survey_sortkey_IDX` (`sortkey`) USING BTREE,
  KEY `user_survey_survey_date_IDX` (`survey_date`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=32 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='설문조사 기록';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `user_timedeal_limit`
--

DROP TABLE IF EXISTS `user_timedeal_limit`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_timedeal_limit` (
  `timedeal_no` bigint NOT NULL AUTO_INCREMENT,
  `userkey` bigint NOT NULL,
  `timedeal_type` varchar(20) NOT NULL COMMENT '타임딜 유형',
  `target_id` int NOT NULL COMMENT '타임딜 상품 ID',
  `end_date` datetime NOT NULL COMMENT '종료 시간',
  `is_end` tinyint NOT NULL DEFAULT '0' COMMENT '종료 여부',
  PRIMARY KEY (`timedeal_no`),
  KEY `user_timedeal_limit_userkey_IDX` (`userkey`,`timedeal_type`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=482 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='유저별 타임딜 시간 제한 처리';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `user_timer_reward`
--

DROP TABLE IF EXISTS `user_timer_reward`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_timer_reward` (
  `userkey` bigint NOT NULL,
  `gem` int NOT NULL DEFAULT '0',
  `local_receive_date` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `reward_count` tinyint NOT NULL DEFAULT '0',
  `project_id` int NOT NULL,
  KEY `user_timer_reward_userkey_IDX` (`userkey`,`local_receive_date`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `user_tutorial`
--

DROP TABLE IF EXISTS `user_tutorial`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_tutorial` (
  `userkey` bigint NOT NULL,
  `first_project_id` int DEFAULT NULL,
  `first_episode_id` int DEFAULT NULL,
  `tutorial_step` int NOT NULL DEFAULT '0' COMMENT '튜토리얼 스텝',
  `tutorial_selection` tinyint NOT NULL DEFAULT '0',
  `how_to_play` tinyint NOT NULL DEFAULT '0' COMMENT 'how to play open 여부 ',
  KEY `user_tutorial_userkey_IDX` (`userkey`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='유저 튜토리얼 테이블 - how to play, 선택지 관련 처리';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `user_tutorial_ver2`
--

DROP TABLE IF EXISTS `user_tutorial_ver2`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_tutorial_ver2` (
  `userkey` bigint DEFAULT NULL COMMENT '유저키',
  `step` int DEFAULT NULL COMMENT '단계',
  `open_date` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '오픈일',
  `is_clear` int DEFAULT '0' COMMENT '클리어여부',
  `clear_date` datetime DEFAULT NULL COMMENT '클리어일',
  KEY `user_tutorial_ver2_userkey_IDX` (`userkey`,`step`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='튜토리얼 리뉴얼 버전';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `user_voice`
--

DROP TABLE IF EXISTS `user_voice`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_voice` (
  `userkey` bigint NOT NULL,
  `sound_id` int NOT NULL,
  `open_date` datetime DEFAULT CURRENT_TIMESTAMP,
  `is_replay` tinyint NOT NULL DEFAULT '0',
  UNIQUE KEY `user_voice_un` (`userkey`,`sound_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='유저가 수집한 보이스 기록';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping routines for database 'pier'
--
/*!50003 DROP FUNCTION IF EXISTS `fn_check_achievement_exists` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`remote`@`%` FUNCTION `fn_check_achievement_exists`(
_userkey bigint, 
_achievement_id int
) RETURNS int
BEGIN
	
	
	
	DECLARE v_check INT DEFAULT 0;

	SELECT ifnull(count(*), 0) 
	INTO v_check
	FROM user_achievement
	WHERE userkey = _userkey 
    AND achievement_id = _achievement_id; 	
	
    RETURN v_check;

END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP FUNCTION IF EXISTS `fn_check_all_project_play` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`remote`@`%` FUNCTION `fn_check_all_project_play`(
_userkey bigint
) RETURNS int
BEGIN
	
	
	
	DECLARE v_check INT DEFAULT 0;
	DECLARE v_total int DEFAULT 0; 
	DECLARE v_count int DEFAULT 0; 
	DECLARE v_country varchar(2) DEFAULT '';
	DECLARE v_lang varchar(2) DEFAULT '';


   	
	SELECT ifnull(country, ''), ifnull(current_lang, '')
	INTO v_country, v_lang
	FROM table_account ta 
	WHERE userkey = _userkey; 

	
	SELECT ifnull(count(*), 0) 
	INTO v_total
	FROM list_project_master
	WHERE project_id > 0 
    AND is_public > 0
   	AND (locate(v_lang, exception_lang) IS NULL OR locate(v_lang, exception_lang) < 1)
  	AND (locate(v_country, exception_country) IS NULL OR locate(v_country, exception_country) < 1);
   
	
	SELECT ifnull(count(DISTINCT project_id), 0)
	INTO v_count
	FROM user_episode_hist ueh  
	WHERE userkey = _userkey;
   
	
	IF v_total = v_count THEN 
		SET v_check = 1; 
	END IF; 
	
    RETURN v_check;

END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP FUNCTION IF EXISTS `fn_check_attendance_exists` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`remote`@`%` FUNCTION `fn_check_attendance_exists`(
_userkey bigint, 
_attendance_id int, 
_day_seq int,
_attendance_max int 
) RETURNS int
BEGIN
	
	
	DECLARE v_check INT DEFAULT 0;

	SELECT ifnull(count(*), 0) 
	INTO v_check 
	FROM user_attendance 
	WHERE userkey = _userkey
	AND attendance_id = _attendance_id
	AND loop_cnt  = _attendance_max
	AND day_seq = _day_seq; 	
	
    RETURN v_check;

END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP FUNCTION IF EXISTS `fn_check_attendance_past_check` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`remote`@`%` FUNCTION `fn_check_attendance_past_check`(
_userkey bigint, 
_attendance_id int,
_dayseq int
) RETURNS tinyint
BEGIN
	
	DECLARE v_past TINYINT DEFAULT 0;
	DECLARE v_exists TINYINT DEFAULT 0;
	DECLARE v_loop int DEFAULT 0;


SELECT fn_get_attendance_max(_userkey, _attendance_id)
  INTO v_loop
  FROM DUAL;


SELECT EXISTS (SELECT z.userkey FROM user_attendance z WHERE z.userkey = _userkey AND z.attendance_id = _attendance_id AND z.loop_cnt = v_loop AND z.day_seq = _dayseq)
  INTO v_exists
  FROM DUAL;
 
IF v_exists < 1 THEN 
	RETURN 0;  
END IF;





SELECT CASE WHEN a.action_date <  date_format(now(), '%Y-%m-%d') THEN 1
       		ELSE 0 END is_past
  INTO v_past
  FROM user_attendance a
 WHERE a.userkey = _userkey
   AND a.attendance_id = _attendance_id
   AND a.day_seq = _dayseq 
   AND a.loop_cnt = v_loop;
  
  
  RETURN v_past;
	
	
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP FUNCTION IF EXISTS `fn_check_background_exists` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`remote`@`%` FUNCTION `fn_check_background_exists`(
p_project_id int,
p_background varchar(30)
) RETURNS int
BEGIN
	DECLARE v_check int DEFAULT -1;

	SELECT EXISTS (SELECT bg_id FROM list_bg lb WHERE lb.project_id = p_project_id AND lb.image_name = p_background)
	  INTO v_check
	  FROM DUAL;
	 
	 RETURN v_check;
	
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP FUNCTION IF EXISTS `fn_check_challenge_lang_exists` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`remote`@`%` FUNCTION `fn_check_challenge_lang_exists`(
_challenge_no INT,
_lang VARCHAR(10)
) RETURNS int
BEGIN
	
	DECLARE v_exists NUMERIC DEFAULT 0;
	SELECT EXISTS (SELECT z.challenge_no FROM list_challenge_detail z WHERE z.challenge_no = _challenge_no AND z.lang= _lang)
	  INTO v_exists
	  FROM DUAL;
	 
	RETURN v_exists;		
	
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP FUNCTION IF EXISTS `fn_check_daily_mission_done` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`remote`@`%` FUNCTION `fn_check_daily_mission_done`(
_userkey bigint, 
_mission_no int
) RETURNS int
BEGIN
	
	
	
	DECLARE v_check INT DEFAULT 0;

SELECT CASE WHEN ifnull(current_result, 0) >= cdm.limit_count THEN 1 ELSE 0 END state
  INTO v_check
  FROM com_daily_mission cdm 
  	LEFT OUTER JOIN user_daily_mission_record udmr 
  	ON userkey = _userkey AND cdm.mission_no = udmr.mission_no
 WHERE cdm.mission_no = _mission_no;
	
    RETURN v_check;

END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP FUNCTION IF EXISTS `fn_check_date_exists` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`remote`@`%` FUNCTION `fn_check_date_exists`(
_product_id varchar(20), 
_product_master_id int, 
_product_date datetime 
) RETURNS int
BEGIN
	DECLARE v_check int DEFAULT 0;

    
	SELECT EXISTS (SELECT z.* FROM com_product_master z WHERE z.product_id = _product_id AND z.product_master_id <> _product_master_id AND _product_date BETWEEN z.from_date AND z.to_date)
	  INTO v_check
	  FROM DUAL;
	 
	RETURN v_check;
	
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP FUNCTION IF EXISTS `fn_check_episode_exists` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`remote`@`%` FUNCTION `fn_check_episode_exists`(
p_project_id int,
p_episode_id int,
p_target_scene_id varchar(40)
) RETURNS int
BEGIN
	
	
	DECLARE v_exists INT DEFAULT 0;

    
	IF regexp_like(p_target_scene_id, '^[0-9]') = 1 THEN
	
		SELECT EXISTS (SELECT ls.scene_id FROM list_script ls WHERE ls.project_id = p_project_id AND ls.episode_id = p_episode_id AND ls.scene_id = p_target_scene_id)
  		INTO v_exists
 		FROM DUAL;
 	
 	
 	ELSEIF regexp_like(p_target_scene_id, '^#[0-9]') = 1 THEN 
 	
		SELECT EXISTS (SELECT le.episode_id FROM list_episode le WHERE le.project_id = p_project_id AND le.episode_id = SUBSTRING_INDEX(p_target_scene_id, '#', -1))
  		INTO v_exists
 		FROM DUAL; 		
 	
 	
 	ELSEIF regexp_like(p_target_scene_id, '^@[0-9]') = 1 THEN 
 	
		SELECT EXISTS (SELECT le.episode_id FROM list_episode le WHERE le.project_id = p_project_id AND le.episode_id = SUBSTRING_INDEX(p_target_scene_id, '@', -1))
  		INTO v_exists
 		FROM DUAL;  	
 	
 	
 	ELSE 
		SET v_exists = -1;  	
	END IF; 

	RETURN v_exists;


END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP FUNCTION IF EXISTS `fn_check_episode_in_history` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`remote`@`%` FUNCTION `fn_check_episode_in_history`(
_userkey BIGINT,
_episode_id INT
) RETURNS tinyint
BEGIN
	

DECLARE v_exists TINYINT DEFAULT 0;

SELECT EXISTS (SELECT hist.episode_id FROM user_episode_hist hist WHERE hist.userkey = _userkey AND hist.episode_id = _episode_id)
  INTO v_exists
  FROM DUAL;
 
 
RETURN v_exists;
 
	
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP FUNCTION IF EXISTS `fn_check_episode_in_progress` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`remote`@`%` FUNCTION `fn_check_episode_in_progress`(
_userkey BIGINT,
_episode_id INT
) RETURNS int
BEGIN
	
	
DECLARE v_exists INT DEFAULT 0;

SELECT EXISTS (SELECT uep.episode_id FROM user_episode_progress uep WHERE uep.userkey = _userkey AND uep.episode_id = _episode_id)
  INTO v_exists
  FROM DUAL;
 
 
RETURN v_exists;
 
 
	
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP FUNCTION IF EXISTS `fn_check_episode_is_ending` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`remote`@`%` FUNCTION `fn_check_episode_is_ending`(
_episode_id INT
) RETURNS tinyint
BEGIN
	
	DECLARE v_ending TINYINT DEFAULT 0;

	SELECT CASE WHEN le.episode_type ='ending' THEN 1
				ELSE 0 END 
			INTO v_ending
	  FROM list_episode le
	 WHERE le.episode_id = _episode_id;
	

	RETURN v_ending;
	
	
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP FUNCTION IF EXISTS `fn_check_episode_lang_exists` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`remote`@`%` FUNCTION `fn_check_episode_lang_exists`(
_episode_id INT,
_lang VARCHAR(10)
) RETURNS int
BEGIN
	
	DECLARE v_exists NUMERIC DEFAULT 0;
	SELECT EXISTS (SELECT z.episode_id FROM list_episode_detail z WHERE z.episode_id = _episode_id AND z.lang= _lang)
	  INTO v_exists
	  FROM DUAL;
	 
	RETURN v_exists;	
	
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP FUNCTION IF EXISTS `fn_check_exists_project_play_record` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`remote`@`%` FUNCTION `fn_check_exists_project_play_record`(
_userkey BIGINT,
_project_id BIGINT
) RETURNS int
BEGIN
	
DECLARE	v_check int DEFAULT 0 ;



SELECT EXISTS (SELECT ueh.userkey FROM user_project_current ueh WHERE ueh.userkey = _userkey AND ueh.project_id = _project_id AND ueh.is_special = 0)
  INTO v_check
  FROM DUAL;	
 

RETURN v_check;
	
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP FUNCTION IF EXISTS `fn_check_first_purchase` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`remote`@`%` FUNCTION `fn_check_first_purchase`(
_userkey int,
_product_id varchar(20), 
_purchase_no int, 
_from_date datetime, 
_to_date datetime 
) RETURNS int
BEGIN
	DECLARE v_check int DEFAULT 0;

    
	SELECT EXISTS (SELECT * FROM user_purchase 
	WHERE userkey = _userkey 
	AND product_id = _product_id 
	AND purchase_no <> _purchase_no 
	AND state <> 3 
	AND purchase_date BETWEEN _from_date AND _to_date)
	INTO v_check
	FROM DUAL;
	 
	RETURN v_check;
	
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP FUNCTION IF EXISTS `fn_check_first_purchase_master_id` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`remote`@`%` FUNCTION `fn_check_first_purchase_master_id`(
_userkey int,
_product_master_id int
) RETURNS tinyint
BEGIN
	DECLARE v_check tinyint DEFAULT 0;

	
    
	
	SELECT EXISTS (SELECT up.purchase_no FROM user_purchase up 
					WHERE up.userkey = _userkey 
					  AND up.product_master_id = _product_master_id
				  	  AND state = 2) 
	  INTO v_check
	  FROM DUAL;
	 
	RETURN v_check;	
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP FUNCTION IF EXISTS `fn_check_gallery_real_open` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`remote`@`%` FUNCTION `fn_check_gallery_real_open`(
_userkey BIGINT,
_gallery_type VARCHAR(20),
_image_type VARCHAR(20),
_image_id INT
) RETURNS tinyint
BEGIN

	
	DECLARE v_real_open TINYINT DEFAULT 0;
	
	
	IF _gallery_type = 'illust' THEN
	
		SELECT IFNULL(a.gallery_open , 0)
		  INTO v_real_open
		  FROM user_illust a
		 WHERE a.userkey = _userkey
		   AND a.illust_type = _image_type 
		   AND a.illust_id = _image_id;
	
	ELSE
	
		SELECT IFNULL(a.gallery_open, 0)
		  INTO v_real_open
		  FROM user_minicut a
		 WHERE a.userkey = _userkey
		   AND a.minicut_type = _image_type 
		   AND a.minicut_id = _image_id;	
	
	
	END IF;


	RETURN v_real_open ;	
	
	
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP FUNCTION IF EXISTS `fn_check_gallery_share_bonus` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`remote`@`%` FUNCTION `fn_check_gallery_share_bonus`(
_userkey BIGINT,
_gallery_type VARCHAR(20),
_image_type VARCHAR(20),
_image_id INT
) RETURNS tinyint
BEGIN
	
	DECLARE v_share_bonus TINYINT DEFAULT 0;
	
	
	IF _gallery_type = 'illust' THEN
	
		SELECT IFNULL(a.share_bonus, 0)
		  INTO v_share_bonus
		  FROM user_illust a
		 WHERE a.userkey = _userkey
		   AND a.illust_type = _image_type 
		   AND a.illust_id = _image_id;
	
	ELSE
	
		SELECT IFNULL(a.share_bonus, 0)
		  INTO v_share_bonus
		  FROM user_minicut a
		 WHERE a.userkey = _userkey
		   AND a.minicut_type = _image_type 
		   AND a.minicut_id = _image_id;	
	
	
	END IF;


	RETURN v_share_bonus ;
	
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP FUNCTION IF EXISTS `fn_check_grade_exists` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`remote`@`%` FUNCTION `fn_check_grade_exists`(
_userkey bigint, 
_start_date datetime, 
_end_date datetime
) RETURNS int
BEGIN
	
	
	
	
	DECLARE v_check INT DEFAULT 0;

	SELECT ifnull(count(*), 0) 
	INTO v_check 
	FROM user_grade_hist 
	WHERE userkey = _userkey
	AND start_date = _start_date 
    AND end_date = _end_date; 	
	
    RETURN v_check;

END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP FUNCTION IF EXISTS `fn_check_grade_history_total` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`remote`@`%` FUNCTION `fn_check_grade_history_total`(
_start_date datetime, 
_end_date datetime
) RETURNS int
BEGIN
	
	
	
	DECLARE v_userkey_total INT DEFAULT 0;
	DECLARE v_grade_total INT DEFAULT 0;  
	DECLARE v_done INT DEFAULT 0; 

	
	SELECT ifnull(count(*), 0)
	INTO v_userkey_total 
	FROM table_account 
	WHERE createtime < _end_date;

	
	SELECT ifnull(count(*), 0) 
	INTO v_grade_total 
	FROM user_grade_hist 
	WHERE start_date = _start_date 
	AND end_date = _end_date;

	
	IF v_userkey_total > 0 AND v_grade_total > 0 AND v_userkey_total = v_grade_total THEN 
		SET v_done = 1; 
	END IF; 
	
    RETURN v_done;

END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP FUNCTION IF EXISTS `fn_check_illust_exists` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`remote`@`%` FUNCTION `fn_check_illust_exists`(
p_project_id int,
p_illust varchar(30) 
) RETURNS int
BEGIN
	DECLARE v_check int DEFAULT -1;
	
	SELECT EXISTS (SELECT illust_id FROM list_illust li WHERE li.project_id = p_project_id AND li.image_name = p_illust)
	  INTO v_check
	  FROM DUAL;
	 
	
	IF v_check <= 0 THEN
	
	
	SELECT EXISTS (SELECT live_illust_id FROM list_live_illust li WHERE li.project_id = p_project_id AND li.live_illust_name = p_illust)
	  INTO v_check
	  FROM DUAL;
	
	RETURN v_check;
	
	ELSE
	
	RETURN v_check;
	
	END IF;
	 
	 
	
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP FUNCTION IF EXISTS `fn_check_image_exists` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`remote`@`%` FUNCTION `fn_check_image_exists`(
p_project_id int,
p_image varchar(30)
) RETURNS int
BEGIN
	DECLARE v_check int DEFAULT -1;

	SELECT EXISTS (SELECT minicut_id FROM list_minicut lm WHERE lm.project_id = p_project_id AND lm.image_name = p_image)
	  INTO v_check
	  FROM DUAL;
	 
	 RETURN v_check;
	
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP FUNCTION IF EXISTS `fn_check_live_object_exists` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`remote`@`%` FUNCTION `fn_check_live_object_exists`(
p_project_id int,
p_live_object_name varchar(30) 
) RETURNS int
BEGIN
	DECLARE v_check int DEFAULT -1;

    
	SELECT EXISTS (SELECT live_object_id FROM list_live_object llo WHERE llo.project_id = p_project_id AND llo.live_object_name = p_live_object_name)
	  INTO v_check
	  FROM DUAL;
	 
	RETURN v_check;
	
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP FUNCTION IF EXISTS `fn_check_live_pair_exists` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`remote`@`%` FUNCTION `fn_check_live_pair_exists`(
_live_id int, 
_kind varchar(7)
) RETURNS int
BEGIN
	DECLARE v_check int DEFAULT 0;

    
	IF _kind = 'illust' THEN 
	
	  SELECT EXISTS (SELECT z.* FROM list_illust z WHERE illust_id > 0 AND live_pair_id = _live_id)
	  INTO v_check
	  FROM DUAL;	
	 
	ELSE  
	
	  SELECT EXISTS (SELECT z.* FROM list_minicut z WHERE minicut_id > 0 AND live_pair_id = _live_id)
	  INTO v_check
	  FROM DUAL;	
	 
	END IF; 

	 
	RETURN v_check;
	
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP FUNCTION IF EXISTS `fn_check_mission_all_clear` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`remote`@`%` FUNCTION `fn_check_mission_all_clear`(
_userkey bigint, 
_project_id int,
_lang varchar(2)
) RETURNS int
BEGIN
	
	
	DECLARE v_check INT DEFAULT 0;
	DECLARE v_mission_id int; 
	DECLARE v_mission_type varchar(20) DEFAULT '';
	DECLARE v_id_condition varchar(2000) DEFAULT ''; 

	DECLARE value int DEFAULT 0; 
	DECLARE mission_count int DEFAULT 0; 
	DECLARE unlock_count int DEFAULT 0; 
	DECLARE done INT DEFAULT FALSE;
 	
	DECLARE c1 CURSOR FOR
	SELECT mission_id, mission_type, id_condition 
	FROM list_mission lm 
	WHERE project_id = _project_id;

   	DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;

   	OPEN c1;

      looping : LOOP	
	      
	  	FETCH c1 INTO v_mission_id, v_mission_type, v_id_condition;
   
        IF done THEN 
        	LEAVE looping;
        END IF;
       
       	IF v_mission_type = 'episode' THEN  
       		
       		
       		SELECT ifnull(count(*), 0)
       		INTO value
       		FROM list_episode le 
       		WHERE project_id = _project_id
       		AND find_in_set(episode_id, v_id_condition);
       	
       		SET mission_count = mission_count + value; 
       	
       		
       		SELECT ifnull(count(*), 0) 
       		INTO value
       		FROM user_episode_hist ueh 
       		WHERE userkey = _userkey 
       		AND project_id = _project_id 
       		AND find_in_set(episode_id, v_id_condition);
       	
       		SET unlock_count = unlock_count + value;
       	
       	ELSEIF v_mission_type = 'event' THEN  
       	
       		
       		SELECT ifnull(count(DISTINCT scene_id), 0) 
       		INTO value 
       		FROM list_script ls 
       		WHERE project_id = _project_id 
       		AND lang = _lang 
       		AND episode_id IN (SELECT episode_id FROM list_episode le WHERE project_id = _project_id)
       	    AND find_in_set(scene_id, v_id_condition)
       	    AND scene_id IS NOT NULL 
       	    AND scene_id <> '';
       	   
       	   	SET mission_count = mission_count + value; 
       	   
       	    
       	   	SELECT ifnull(count(*), 0) 
       	   	INTO value 
       	   	FROM user_scene_hist ush 
       	   	WHERE userkey = _userkey 
       	   	AND project_id = _project_id 
       	   	AND find_in_set(scene_id, v_id_condition); 
       	   
       	    SET unlock_count = unlock_count + value; 
       	
       	ELSE 
       	
       		SET mission_count = mission_count + 1; 
       	
       		
       		SELECT ifnull(count(*), 0) 
       		INTO value 
       		FROM user_mission um
       		WHERE um.mission_id = v_mission_id 
       		AND um.userkey = _userkey
       		AND um.unlock_state >= 0;  
       		
       		SET unlock_count = unlock_count + value; 
       	
       	END IF;
        
      END LOOP;
      
	CLOSE c1;

	
	IF mission_count = unlock_count THEN 
		SET v_check = 1;
	END IF;


    RETURN v_check;

END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP FUNCTION IF EXISTS `fn_check_mission_all_clear_simple` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`remote`@`%` FUNCTION `fn_check_mission_all_clear_simple`(
_userkey bigint, 
_project_id int
) RETURNS int
BEGIN
	
DECLARE v_chk INT DEFAULT 0;
DECLARE v_project_mission_count int DEFAULT 0;
DECLARE v_user_mission_count int DEFAULT 0;



SELECT count(*)
  INTO v_project_mission_count
  FROM list_mission lm
 WHERE lm.project_id  = _project_id;


SELECT count(*)
  INTO v_user_mission_count
  FROM list_mission lm
     , user_mission um 
 WHERE lm.project_id = _project_id
   AND um.userkey = _userkey
   AND um.mission_id = lm.mission_id;

	

 IF v_project_mission_count = v_user_mission_count THEN
 SET v_chk = 1;
 END IF;


RETURN v_chk;
 
  
  
  
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP FUNCTION IF EXISTS `fn_check_mission_lang_exists` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`remote`@`%` FUNCTION `fn_check_mission_lang_exists`(
_mission_id INT,
_lang VARCHAR(10)
) RETURNS int
BEGIN
	DECLARE v_exists NUMERIC DEFAULT 0;
	SELECT EXISTS (SELECT z.mission_id FROM list_mission_lang z WHERE z.mission_id = _mission_id AND z.lang= _lang)
	  INTO v_exists
	  FROM DUAL;
	 
	RETURN v_exists;		
		
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP FUNCTION IF EXISTS `fn_check_prohibited_words_exists` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`remote`@`%` FUNCTION `fn_check_prohibited_words_exists`(
_nickname varchar(30) 
) RETURNS int
BEGIN
	
	
	DECLARE v_check int DEFAULT 0;
	
	
	SELECT EXISTS ( SELECT locate(prohibited_words, _nickname) FROM com_prohibited_words cpw WHERE locate(prohibited_words, _nickname) > 0 )
	INTO v_check
	FROM DUAL;
	 
	RETURN v_check;
	 
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP FUNCTION IF EXISTS `fn_check_project_lang_exists` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`remote`@`%` FUNCTION `fn_check_project_lang_exists`(
_project_id INT,
_lang VARCHAR(10)
) RETURNS int
BEGIN
	
	DECLARE v_exists NUMERIC DEFAULT 0;
	SELECT EXISTS (SELECT z.project_id FROM list_project_detail z WHERE z.project_id = _project_id AND z.lang= _lang)
	  INTO v_exists
	  FROM DUAL;
	 
	RETURN v_exists;
	
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP FUNCTION IF EXISTS `fn_check_scene_in_history` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`remote`@`%` FUNCTION `fn_check_scene_in_history`(
_userkey BIGINT,
_scene_id VARCHAR(10)
) RETURNS tinyint
BEGIN
	
	

DECLARE v_exists TINYINT DEFAULT 0;

SELECT EXISTS (SELECT hist.scene_id FROM user_scene_hist hist WHERE hist.userkey = _userkey AND hist.scene_id = _scene_id)
  INTO v_exists
  FROM DUAL;
 
 
RETURN v_exists;
 
	
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP FUNCTION IF EXISTS `fn_check_selection_exists` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`remote`@`%` FUNCTION `fn_check_selection_exists`(
s_episode_id int,
s_lang varchar(2)
) RETURNS int
BEGIN
	
	
	DECLARE v_exists INT DEFAULT 0;

	SELECT EXISTS (SELECT ls.* FROM list_script ls WHERE ls.episode_id = s_episode_id AND lang = s_lang AND selection_group <> 0)
  	INTO v_exists
 	FROM DUAL;

	RETURN v_exists;


END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP FUNCTION IF EXISTS `fn_check_sound_exists` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`remote`@`%` FUNCTION `fn_check_sound_exists`(
p_project_id int,
p_sound_name varchar(30), 
p_sound_type varchar(10) 
) RETURNS int
BEGIN
	DECLARE v_check int DEFAULT -1;

    
	SELECT EXISTS (SELECT sound_id FROM list_sound ls WHERE ls.project_id = p_project_id AND ls.sound_name = p_sound_name AND ls.sound_type = p_sound_type)
	  INTO v_check
	  FROM DUAL;
	 
	RETURN v_check;
	
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP FUNCTION IF EXISTS `fn_check_special_episode_open` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`remote`@`%` FUNCTION `fn_check_special_episode_open`(
_userkey BIGINT,
_episode_id INT
) RETURNS tinyint
BEGIN
	
	DECLARE v_exist TINYINT DEFAULT 0;
	
	SELECT EXISTS (SELECT le.episode_id FROM list_episode le WHERE le.episode_id = _episode_id AND le.unlock_style = 'none')
	  INTO v_exist
	  FROM DUAL;
	 
 	
	IF v_exist > 0 THEN
		RETURN v_exist;
	END IF;

	SELECT EXISTS (SELECT z.episode_id FROM user_side z WHERE z.userkey = _userkey AND z.episode_id  = _episode_id)
	  INTO v_exist
	  FROM DUAL;
	 
	RETURN v_exist;
	  
	
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP FUNCTION IF EXISTS `fn_check_standard_code_exists` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`remote`@`%` FUNCTION `fn_check_standard_code_exists`(
s_standard_class varchar(20), 
s_code varchar(20) 
) RETURNS int
BEGIN
	
	DECLARE v_check int DEFAULT -1;
	
	
	SELECT EXISTS (SELECT ls.standard_id FROM list_standard ls WHERE ls.standard_class = s_standard_class AND ls.code = s_code)
	INTO v_check
	FROM DUAL;
	 
	RETURN v_check;
		
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP FUNCTION IF EXISTS `fn_check_survey_exists` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`remote`@`%` FUNCTION `fn_check_survey_exists`(
_userkey bigint, 
_survey_id int
) RETURNS int
BEGIN
	
	
	DECLARE v_check INT DEFAULT 0;

	SELECT ifnull(count(*), 0) 
	INTO v_check
	FROM user_survey us 
	WHERE userkey = _userkey 
    AND survey_id = _survey_id; 	
	
    RETURN v_check;

END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP FUNCTION IF EXISTS `fn_check_user_ending` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`remote`@`%` FUNCTION `fn_check_user_ending`(
_userkey BIGINT,
_episode_id INT
) RETURNS tinyint
BEGIN
	

DECLARE v_exists TINYINT DEFAULT 0;

SELECT EXISTS (SELECT hist.episode_id FROM user_ending hist WHERE hist.userkey = _userkey AND hist.episode_id = _episode_id)
  INTO v_exists
  FROM DUAL;
 
 
RETURN v_exists;	
	
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP FUNCTION IF EXISTS `fn_check_user_illust_exists` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`remote`@`%` FUNCTION `fn_check_user_illust_exists`(
_userkey BIGINT,
_illust_type VARCHAR(10),
_illust_id INT
) RETURNS tinyint
BEGIN
	DECLARE v_exists TINYINT DEFAULT 0;

SELECT EXISTS (SELECT z.illust_hist_no 
                 FROM user_illust z 
                WHERE z.userkey = _userkey
                  AND z.illust_type = _illust_type
                  AND z.illust_id = _illust_id)
       INTO v_exists
  FROM DUAL;
 
 
 RETURN v_exists;

	
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP FUNCTION IF EXISTS `fn_check_user_minicut_exists` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`remote`@`%` FUNCTION `fn_check_user_minicut_exists`(
_userkey BIGINT,
_minicut_type VARCHAR(20),
_minicut_id INT
) RETURNS int
BEGIN
	
DECLARE v_exists TINYINT DEFAULT 0;

SELECT EXISTS (SELECT z.minicut_id 
                 FROM user_minicut z 
                WHERE z.userkey = _userkey
                  AND z.minicut_type = CASE WHEN _minicut_type = 'minicut' THEN 'image' ELSE _minicut_type END
                  AND z.minicut_id = _minicut_id)
       INTO v_exists
  FROM DUAL;
 
 
RETURN v_exists;
	
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP FUNCTION IF EXISTS `fn_check_user_minicut_exists_new` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`remote`@`%` FUNCTION `fn_check_user_minicut_exists_new`(
_userkey BIGINT,
_minicut_type VARCHAR(20),
_minicut_id INT
) RETURNS int
BEGIN
	
DECLARE v_exists TINYINT DEFAULT 0;

SELECT EXISTS (SELECT z.minicut_id 
                 FROM user_minicut z 
                WHERE z.userkey = _userkey
                  AND z.minicut_type = _minicut_type
                  AND z.minicut_id = _minicut_id)
       INTO v_exists
  FROM DUAL;
 
 
RETURN v_exists;
	
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP FUNCTION IF EXISTS `fn_check_voice_unlock` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`remote`@`%` FUNCTION `fn_check_voice_unlock`(
_userkey BIGINT,
_project_id INT,
_sound_id INT
) RETURNS tinyint
BEGIN
	
	DECLARE v_result TINYINT DEFAULT 0;
		
	SELECT EXISTS (SELECT a.userkey FROM user_voice a WHERE a.userkey = _userkey AND a.sound_id= _sound_id) is_exists
	INTO v_result
	FROM DUAL;


	RETURN v_result;
	
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP FUNCTION IF EXISTS `fn_get_ability_cnt` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`remote`@`%` FUNCTION `fn_get_ability_cnt`(
_project_id int,
_userkey bigint,
_speaker varchar(30)
) RETURNS int
BEGIN

	
	
	DECLARE v_value int DEFAULT 0;
	DECLARE v_story_cnt int DEFAULT 0; 
	DECLARE v_currency_cnt int DEFAULT 0; 

	
	SELECT ifnull(sum(add_value), 0)
	INTO v_story_cnt
	FROM user_story_ability usa 
	WHERE userkey = _userkey 
    AND ability_id IN (SELECT ability_id FROM com_ability ca WHERE ca.speaker = _speaker AND project_id = _project_id); 
   
    
    SELECT ifnull(sum(add_value), 0)
    INTO v_currency_cnt
    FROM user_property a, com_currency_ability b
    WHERE a.currency = b.currency 
    AND userkey = _userkey
    AND b.ability_id IN (SELECT ability_id FROM com_ability WHERE speaker = _speaker AND project_id = _project_id);
   
    SET v_value = v_story_cnt + v_currency_cnt;


	RETURN v_value;

END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP FUNCTION IF EXISTS `fn_get_ability_max_value` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`remote`@`%` FUNCTION `fn_get_ability_max_value`(
_project_id int, 
_speaker varchar(30)
) RETURNS int
BEGIN

	
	DECLARE v_value int DEFAULT 0;

    SELECT ifnull(sum(max_value), 0)
    INTO v_value
    FROM com_ability ca 
    WHERE project_id = _project_id 
    AND speaker = _speaker;
   

	RETURN v_value;

END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP FUNCTION IF EXISTS `fn_get_achievement_info` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`remote`@`%` FUNCTION `fn_get_achievement_info`(
_achievement_id INT,
_lang varchar(2),
_col VARCHAR(8)
) RETURNS varchar(300) CHARSET utf8mb4
BEGIN
	
	
	DECLARE v_return VARCHAR(300) DEFAULT '';

	IF _achievement_id < 1 THEN
		RETURN v_return;
	END IF;
	
	IF _col = 'name' THEN 
	
		SELECT cal.name 
		INTO v_return
		FROM com_achievement_lang cal 
		WHERE cal.achievement_id = _achievement_id
	    AND cal.lang = _lang;
	
	ELSE
	
		SELECT cal.surmmary 
		INTO v_return
		FROM com_achievement_lang cal 
		WHERE cal.achievement_id = _achievement_id
	    AND cal.lang = _lang;
	
	END IF;
	
	
	RETURN v_return;
	
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP FUNCTION IF EXISTS `fn_get_achievement_level_info` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`remote`@`%` FUNCTION `fn_get_achievement_level_info`(
_id INT,
_currentLevel INT,
_col VARCHAR(20)
) RETURNS int
BEGIN
	
	DECLARE v_info INT DEFAULT 0;
	
	IF _col = 'gain_point' THEN

	SELECT l.gain_point 
	  INTO v_info
	  FROM com_achievement_level l
	 WHERE l.achievement_id = _id
	   AND l.achievement_level = _currentLevel;
	
	ELSE
	  
	SELECT l.achievement_point  
	  INTO v_info
	  FROM com_achievement_level l
	 WHERE l.achievement_id = _id
	   AND l.achievement_level = _currentLevel;	  
	  
	END IF;
	  
	  
	 RETURN v_info;
	
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP FUNCTION IF EXISTS `fn_get_achievement_text` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`remote`@`%` FUNCTION `fn_get_achievement_text`(
_id INT,
_lang VARCHAR(20),
_col VARCHAR(20)
) RETURNS varchar(300) CHARSET utf8mb4
BEGIN
	
	DECLARE v_text VARCHAR(300) DEFAULT NULL;
	
	IF _col = 'name' THEN
	SELECT z.name 
	  INTO v_text
	  FROM com_achievement_lang z
	 WHERE z.achievement_id = _id
	   AND z.lang = _lang;
	 
	ELSE 
	
	SELECT z.surmmary 
	  INTO v_text
	  FROM com_achievement_lang z
	 WHERE z.achievement_id = _id
	   AND z.lang = _lang;
	  
	END IF;
	  
	  
	 RETURN v_text;
	
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP FUNCTION IF EXISTS `fn_get_attendance_cnt` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`remote`@`%` FUNCTION `fn_get_attendance_cnt`(
_userkey bigint, 
_attendance_id int,
_attendance_max int 
) RETURNS int
BEGIN
	
	
	DECLARE v_cnt INT DEFAULT 0;


	SELECT ifnull(count(*), 0) 
	INTO v_cnt 
	FROM user_attendance 
	WHERE userkey = _userkey
	AND attendance_id = _attendance_id
	AND loop_cnt  = _attendance_max; 	
	
    RETURN v_cnt;

END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP FUNCTION IF EXISTS `fn_get_attendance_max` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`remote`@`%` FUNCTION `fn_get_attendance_max`(
_userkey bigint, 
_attendance_id int
) RETURNS int
BEGIN
	
	DECLARE v_max INT DEFAULT 0;
	DECLARE v_exists INT DEFAULT 0; 

	
	SELECT ifnull(max(loop_cnt), 1)
	INTO v_max
    FROM user_attendance
    WHERE userkey = _userkey 
    AND attendance_id = _attendance_id;
   
    SELECT EXISTS (
	   	SELECT * FROM user_attendance a, com_attendance b
	   	WHERE a.attendance_id = b.attendance_id 
	    AND userkey = _userkey 
	    AND a.attendance_id = _attendance_id
	    AND loop_cnt = v_max
	    AND a.day_seq = kind
	    AND is_loop > 0
	    AND date_format(now(), '%Y-%m-%d') > a.action_date 
   )
   INTO v_exists
   FROM DUAL;
   
 
   IF v_exists > 0 THEN 
   	 SET v_max = v_max + 1;
   END IF;
    
   
   RETURN v_max;

END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP FUNCTION IF EXISTS `fn_get_bg_info` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`remote`@`%` FUNCTION `fn_get_bg_info`(
_bg_id INT,
_col VARCHAR(20)
) RETURNS varchar(160) CHARSET utf8mb4
BEGIN
	
	
	DECLARE v_return VARCHAR(160) DEFAULT '';

	IF _bg_id < 0 THEN
		RETURN v_return;
	END IF;
	
	IF _col = 'url' THEN 
	
	SELECT lb.image_url 
	  INTO v_return
	  FROM list_bg lb 
	 WHERE lb.bg_id = _bg_id;
	
	ELSEIF _col = 'key' THEN
	
	SELECT lb.image_key
	  INTO v_return
	  FROM list_bg lb
	 WHERE lb.bg_id = _bg_id;
	
	ELSEIF _col = 'name' THEN 
	
	SELECT lb.image_name 
	  INTO v_return 
	  FROM list_bg lb 
	 WHERE lb.bg_id = _bg_id; 
	
	END IF;
	
	
	RETURN v_return;
	
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP FUNCTION IF EXISTS `fn_get_bubble_info` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`remote`@`%` FUNCTION `fn_get_bubble_info`(
_currency varchar(20),
_lang varchar(2)
) RETURNS varchar(1000) CHARSET utf8mb4
BEGIN

	DECLARE v_bubble varchar(1000) DEFAULT '';

	SELECT a.bubble
      INTO v_bubble 
      FROM com_currency_bubble a
	 WHERE a.currency = _currency
       AND a.lang = _lang;


	RETURN v_bubble;

END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP FUNCTION IF EXISTS `fn_get_bubble_sprite_info` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`remote`@`%` FUNCTION `fn_get_bubble_sprite_info`(
_column_name varchar(20),
_sprite_id int
) RETURNS varchar(160) CHARSET utf8mb4
BEGIN
	
	DECLARE v_return VARCHAR(160) DEFAULT NULL;

	IF _column_name = 'url' THEN
	
	SELECT cbs.image_url 
	  INTO v_return
	  FROM com_bubble_sprite cbs
	 WHERE cbs.bubble_sprite_id = _sprite_id;
	
	ELSEIF _column_name = 'key' THEN

	SELECT cbs.image_key 
	  INTO v_return
	  FROM com_bubble_sprite cbs
	 WHERE cbs.bubble_sprite_id = _sprite_id;

    ELSEIF _column_name = 'name' THEN

	SELECT cbs.image_name 
	  INTO v_return
	  FROM com_bubble_sprite cbs
	 WHERE cbs.bubble_sprite_id = _sprite_id;
	
	END IF;


	RETURN v_return;
	
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP FUNCTION IF EXISTS `fn_get_bubble_sprite_name` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`remote`@`%` FUNCTION `fn_get_bubble_sprite_name`(
_bubble_sprite_id int
) RETURNS varchar(30) CHARSET utf8mb4
BEGIN

	DECLARE v_name varchar(30) DEFAULT '';
	
	SELECT image_name 
	  INTO v_name
	  FROM com_bubble_sprite cbs 
	 WHERE cbs.bubble_sprite_id = _bubble_sprite_id;
	  
	
	RETURN v_name;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP FUNCTION IF EXISTS `fn_get_challenge_title_lang` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`remote`@`%` FUNCTION `fn_get_challenge_title_lang`(
_challenge_no INT,
_lang VARCHAR(10),
_col VARCHAR(10) 
) RETURNS varchar(100) CHARSET utf8mb4
BEGIN
	

DECLARE v_name VARCHAR(30) DEFAULT NULL;
DECLARE v_hint VARCHAR(100) DEFAULT NULL;
 
DECLARE v_return VARCHAR(100) DEFAULT NULL;
DECLARE v_exists NUMERIC DEFAULT 0;

SELECT fn_check_challenge_lang_exists(_challenge_no, _lang)
  INTO v_exists 
  FROM DUAL;


IF v_exists > 0 THEN 

	SELECT detail.challenge_name
	     , detail.challenge_hint
	  INTO v_name, v_hint 
	  FROM list_challenge a 
	     , list_challenge_detail detail 
	 WHERE a.challenge_no = _challenge_no
	   AND a.challenge_no = detail.challenge_no
	   AND detail.lang = _lang;

ELSE 

	SELECT a.challenge_name, a.challenge_hint
	  INTO v_name, v_hint
	  FROM list_challenge a
	 WHERE a.challenge_no = _challenge_no;

END IF;

IF _col = 'name' THEN
	SET v_return = v_name;
ELSE
	SET v_return = v_hint;
END IF;
	
RETURN v_return;  	
	
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP FUNCTION IF EXISTS `fn_get_coin_product_name` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`remote`@`%` FUNCTION `fn_get_coin_product_name`(
_coin_product_id INT,
_lang VARCHAR(10)
) RETURNS varchar(60) CHARSET utf8mb4
BEGIN
	
	DECLARE v_name VARCHAR(60) DEFAULT NULL;
	DECLARE v_exists TINYINT DEFAULT 0;
	
	
	SELECT EXISTS (SELECT z.* FROM com_coin_product_detail z WHERE coin_product_id = _coin_product_id AND lang = _lang)
	INTO v_exists
	FROM DUAL;
	 
	IF v_exists > 0 THEN 
	
		SELECT name 
		INTO v_name
		FROM com_coin_product_detail ccpd 
		WHERE coin_product_id  = _coin_product_id
		AND lang = _lang; 
	
	ELSE 
	
		SELECT name 
		INTO v_name
		FROM com_coin_product_detail ccpd 
		WHERE coin_product_id  = _coin_product_id
		AND lang = 'KO'; 
	
	END IF;
	
		
	RETURN v_name;  
  
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP FUNCTION IF EXISTS `fn_get_coin_product_price` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`remote`@`%` FUNCTION `fn_get_coin_product_price`(
_currency varchar(20),
_price_type varchar(5)
) RETURNS int
BEGIN
	
	DECLARE v_price int DEFAULT 0;
	
	IF _price_type = 'sale' THEN  
	
		SELECT a.sale_price 
		INTO v_price
		FROM com_coin_product a
		WHERE a.currency = _currency
	    AND is_public > 0 
	    AND now() <= end_date;
	
	ELSE                          
	
		SELECT a.price
		INTO v_price
		FROM com_coin_product a
		WHERE a.currency = _currency
	    AND is_public > 0 
	    AND now() <= end_date;
	
	END IF; 
	   
	RETURN v_price;
	
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP FUNCTION IF EXISTS `fn_get_collection_count` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`remote`@`%` FUNCTION `fn_get_collection_count`(
_project_id int, 
_userkey int, 
_illust_type varchar(10)
) RETURNS int
BEGIN
	
	DECLARE v_count int DEFAULT 0;

	IF _illust_type = 'illust' THEN           
		SELECT count(*)
		INTO v_count 
		FROM user_illust ui 
		WHERE userkey = _userkey 
		AND project_id = _project_id
		AND illust_type = 'illust';	
	ELSEIF _illust_type = 'liveilust' THEN    
		SELECT count(*)
		INTO v_count 
		FROM user_illust ui 
		WHERE userkey = _userkey 
		AND project_id = _project_id
		AND illust_type = 'live2d';		
	ELSEIF _illust_type = 'minicut' THEN    
		SELECT count(*)
		INTO v_count 
		FROM user_minicut um 
		WHERE userkey = _userkey 
		AND project_id = _project_id
		AND minicut_type = 'image';		
	ELSE                                     
		SELECT count(*)
		INTO v_count 
		FROM user_minicut um 
		WHERE userkey = _userkey 
		AND project_id = _project_id
		AND minicut_type = 'live2d';		
	END IF; 

	RETURN v_count;
	
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP FUNCTION IF EXISTS `fn_get_continuous_attendance` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`remote`@`%` FUNCTION `fn_get_continuous_attendance`(
_userkey BIGINT,
_start_date datetime, 
_end_date datetime, 
_day_seq int,
_col VARCHAR(20)
) RETURNS int
BEGIN
	
	
	DECLARE v_return int;


	IF _col = 'day' THEN 
	
	 SET v_return = 0; 
	
	 SELECT ifnull(uca.current_result, 0) 
	 INTO v_return
	 FROM user_continuous_attendance uca 
	 WHERE attendance_no = fn_get_max_attendance_id(_userkey, 'user');
	
	ELSEIF _col = 'check' THEN 
	
	 SET v_return = 1; 
	
	 SELECT ifnull(is_attendance, 1) 
	 INTO v_return
	 FROM user_continuous_attendance uca 
	 WHERE attendance_no = fn_get_max_attendance_id(_userkey, 'user');
	
	ELSEIF _col = 'reward' THEN 
	 
	 SET v_return = 0;
	
	 SELECT CASE WHEN reward_date IS NOT NULL THEN 1 ELSE 0 END reward_check
	 INTO v_return
	 FROM user_continuous_attendance uca 
	 WHERE userkey = _userkey 
	 AND now() BETWEEN start_date AND end_date
	 AND day_seq = _day_seq;
	 
	END IF;
	
	
	RETURN v_return;
	
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP FUNCTION IF EXISTS `fn_get_continuous_attendance_date` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`remote`@`%` FUNCTION `fn_get_continuous_attendance_date`(
_userkey BIGINT
) RETURNS datetime
BEGIN
	
	
	
	DECLARE v_return datetime DEFAULT NULL;

	SELECT attendance_date 
	INTO v_return
	FROM user_continuous_attendance uca 
	WHERE attendance_no = fn_get_max_attendance_id(_userkey, 'user');
	

	RETURN v_return;
	
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP FUNCTION IF EXISTS `fn_get_count_scene_in_history` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`remote`@`%` FUNCTION `fn_get_count_scene_in_history`(
_userkey BIGINT,
_episode_id INT,
_lang VARCHAR(10),
_col VARCHAR(10)
) RETURNS int
BEGIN

DECLARE v_cnt INT DEFAULT 0;

IF _col = 'total' THEN 

SELECT COUNT(DISTINCT ls.scene_id)
  INTO v_cnt
  FROM list_script ls 
 WHERE ls.episode_id = _episode_id
   AND ls.scene_id IS NOT NULL 
   AND ls.scene_id <> ''
   AND ls.lang = _lang;


ELSEIF _col = 'played' THEN


SELECT count(DISTINCT hist.scene_id)
  INTO v_cnt
  FROM user_scene_hist hist
     , list_script ls 
 WHERE hist.userkey = _userkey
   AND ls.project_id = hist.project_id 
   AND ls.episode_id = _episode_id
   AND hist.scene_id = ls.scene_id;
  
END IF;


RETURN v_cnt;

END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP FUNCTION IF EXISTS `fn_get_coupon_detail_info` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`remote`@`%` FUNCTION `fn_get_coupon_detail_info`(
_coupon_id INT
) RETURNS varchar(160) CHARSET utf8mb4
BEGIN
	
	
	DECLARE v_return VARCHAR(160) DEFAULT '';
	DECLARE done INT DEFAULT FALSE;

	
	DECLARE v_currency varchar(20) DEFAULT '';
	DECLARE v_currency_name varchar(30) DEFAULT ''; 
	DECLARE v_quantity int DEFAULT 0; 

	
	DECLARE cursor1 CURSOR FOR 
	SELECT currency, quantity
	FROM com_coupon_reward
	WHERE coupon_id = _coupon_id;
	
	DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;
	
	OPEN cursor1;

	looping : LOOP
			
		FETCH cursor1 INTO v_currency, v_quantity; 
		
		IF done THEN 
			LEAVE looping;
		END IF;
		
		SET v_currency_name = fn_get_currency_info(v_currency, 'name'); 
		
		SET v_return = concat(v_return, v_currency_name, '(', v_quantity, '), ');

	END LOOP;

	CLOSE cursor1;

	SET v_return = mid(v_return, 1, char_length(v_return)-2); 

	RETURN v_return;
	
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP FUNCTION IF EXISTS `fn_get_currency_bubble_text` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`remote`@`%` FUNCTION `fn_get_currency_bubble_text`(
_currency VARCHAR(20),
_lang VARCHAR(20)
) RETURNS varchar(1000) CHARSET utf8mb4
BEGIN
	
	
	
	DECLARE v_text VARCHAR(1000) DEFAULT NULL;
	
	SELECT a.bubble 
	  INTO v_text
	  FROM com_currency_bubble a
	 WHERE a.currency = _currency 
	   AND a.lang = _lang;
	
	RETURN ifnull(v_text, '');
	
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP FUNCTION IF EXISTS `fn_get_currency_info` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`remote`@`%` FUNCTION `fn_get_currency_info`(
_currency varchar(20),
_col VARCHAR(20)
) RETURNS varchar(30) CHARSET utf8mb4
BEGIN
	
	
	DECLARE v_return VARCHAR(30) DEFAULT NULL;

	IF _currency IS NULL THEN
		RETURN v_return;
	END IF;
	
	IF _col = 'name' THEN 
	
	 SELECT cc.origin_name
	  INTO v_return
 	  FROM com_currency cc 
 	 WHERE cc.currency = _currency;

	ELSEIF _col = 'textid' THEN 
	
	 SELECT cc.local_code
	  INTO v_return
 	  FROM com_currency cc 
 	 WHERE cc.currency = _currency; 	
	
 	ELSEIF _col = 'type' THEN 
	 
 	 SELECT cc.currency_type
	  INTO v_return
 	  FROM com_currency cc 
 	 WHERE cc.currency = _currency; 
 	
 	ELSEIF _col = 'unique' THEN 
 	
 	 SELECT cc.is_unique 
	  INTO v_return
 	  FROM com_currency cc 
 	 WHERE cc.currency = _currency;  	
 	
	END IF;
	
	RETURN v_return;
	
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP FUNCTION IF EXISTS `fn_get_currency_model_name` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`remote`@`%` FUNCTION `fn_get_currency_model_name`(
_currency_type varchar(30),
_project_id INT,
_model_id INT
) RETURNS varchar(30) CHARSET utf8mb4
BEGIN
	
	DECLARE v_name VARCHAR(30) DEFAULT '';
	
	
	IF _currency_type <> 'wallpaper' AND _currency_type <> 'standing' THEN 
		RETURN v_name;
	END IF;

	
	IF _model_id < 0 THEN 
		RETURN v_name; 
	END IF;

	
	IF _currency_type = 'standing' THEN 
	
	
	SELECT a.model_name 
	  INTO v_name
	  FROM list_model_master a
	 WHERE a.project_id = _project_id  
	   AND a.model_id = _model_id;
	  
	ELSEIF _currency_type = 'wallpaper' THEN 
	
	SELECT a.live_bg_name 
	  INTO v_name
	  FROM list_live_bg a
	 WHERE a.project_id = _project_id 
	   AND a.live_bg_id = _model_id ;  	
	  
	END IF;


	RETURN ifnull(v_name, '');

	
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP FUNCTION IF EXISTS `fn_get_currency_origin_name` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`remote`@`%` FUNCTION `fn_get_currency_origin_name`(
_currency_type varchar(30),
_project_id INT,
_resource_id INT
) RETURNS varchar(30) CHARSET utf8mb4
BEGIN
	
	DECLARE v_name VARCHAR(30) DEFAULT '';
	
	
	IF _currency_type <> 'wallpaper' THEN 
		RETURN v_name;
	END IF;
	

	SELECT lb.image_name 
	  INTO v_name
 	  FROM list_bg lb 
 	 WHERE lb.project_id = _project_id
 	   AND lb.bg_id = _resource_id;
 	  
 	RETURN v_name;
	
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP FUNCTION IF EXISTS `fn_get_currency_set` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`remote`@`%` FUNCTION `fn_get_currency_set`(
_coin_product_id INT
) RETURNS text CHARSET utf8mb4
BEGIN
	
	DECLARE v_text text DEFAULT '';

	SELECT group_concat(currency) 
	INTO v_text
	FROM com_coin_product_set a 
	WHERE a.coin_product_id = _coin_product_id;
	 
	RETURN v_text;
	
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP FUNCTION IF EXISTS `fn_get_current_pass_price` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`remote`@`%` FUNCTION `fn_get_current_pass_price`(
_userkey BIGINT,
_project_id INT
) RETURNS float
BEGIN
	
DECLARE v_origin_price INT DEFAULT 0;
DECLARE v_total_use_coin INT DEFAULT 0;
DECLARE v_total_use_gem INT DEFAULT 0;
DECLARE v_percent INT DEFAULT 0;
DECLARE v_discount float DEFAULT 0;

SELECT fn_get_origin_pass_price(_project_id) 
  INTO v_origin_price 
  FROM DUAL;
 
SELECT ifnull(sum(a.quantity), 0) total_use_coin
  INTO v_total_use_coin
  FROM gamelog.log_property a 
 WHERE a.userkey = _userkey
   AND a.log_type = 'use'
   AND a.project_id = _project_id
   AND a.currency = 'coin'
   AND a.log_code IN ('open_force', 'reset_purchase', 'remove_current_ad');
  

SELECT ifnull(sum(a.quantity), 0) total_use_gem
  INTO v_total_use_gem 
  FROM gamelog.log_property a 
 WHERE a.userkey = _userkey
   AND a.log_type = 'use'
   AND a.project_id = _project_id
   AND a.currency = 'gem'
   AND a.log_code = 'selection_purchase';

 

  SET v_percent = v_total_use_gem / v_origin_price * 100;

IF v_percent <= 15 THEN SET v_discount = 0.1;
ELSEIF v_percent > 15 AND v_percent <= 25 THEN SET v_discount = 0.2;
ELSEIF v_percent > 25 AND v_percent <= 35 THEN SET v_discount = 0.3;
ELSEIF v_percent > 35 AND v_percent <= 45 THEN SET v_discount = 0.4;
ELSEIF v_percent > 45 AND v_percent <= 55 THEN SET v_discount = 0.5;
ELSE SET v_discount = 0.6;
END IF;

 	
RETURN round(v_discount, 1);

	
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP FUNCTION IF EXISTS `fn_get_custom_user_dress` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`remote`@`%` FUNCTION `fn_get_custom_user_dress`(
_speaker VARCHAR(20),
_dress VARCHAR(30),
_project_id INT,
_userkey BIGINT
) RETURNS varchar(30) CHARSET utf8mb4
BEGIN
	
DECLARE v_default TINYINT DEFAULT 0;
DECLARE v_user_dress VARCHAR(30) DEFAULT NULL;


SELECT EXISTS (
SELECT a.dressmodel_name
     , ld.dress_name 
     , ld.model_id 
  FROM list_dress_model a
     , list_dress ld 
 WHERE a.project_id = _project_id
   AND a.dressmodel_name  = _speaker
   AND ld.dress_name = _dress
   AND ld.dressmodel_id = a.dressmodel_id
   AND ld.is_default = 1)
 INTO v_default
 FROM dual
;


IF v_default = 0 THEN
RETURN _dress;
END IF;



SELECT ld.dress_name 
  INTO v_user_dress
  FROM user_project_dress a
     , com_currency cc 
     , list_dress ld
 WHERE a.project_id = _project_id 
   AND a.userkey = _userkey
   AND cc.currency = a.current_currency 
   AND a.speaker  = _speaker
   AND ld.model_id  = cc.model_id ;


IF v_user_dress IS NOT NULL AND v_user_dress <> _dress THEN
RETURN  v_user_dress;
END IF;

RETURN _dress;
	
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP FUNCTION IF EXISTS `fn_get_design_info` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`remote`@`%` FUNCTION `fn_get_design_info`(
_design_id INT,
_col VARCHAR(20)
) RETURNS varchar(160) CHARSET utf8mb4
BEGIN
	
	
	DECLARE v_return VARCHAR(160) DEFAULT '';

	IF _design_id < 0 THEN
		RETURN v_return;
	END IF;
	
	IF _col = 'url' THEN 
	
	SELECT ld.image_url 
	  INTO v_return
	  FROM list_design ld
	 WHERE ld.design_id = _design_id;
	
	ELSEIF _col = 'key' THEN
	
	SELECT ld.image_key
	  INTO v_return
	  FROM list_design ld
	 WHERE ld.design_id = _design_id;
	
	ELSEIF _col = 'name' THEN 
	
	SELECT ld.image_name 
	  INTO v_return 
	  FROM list_design ld  
	 WHERE ld.design_id = _design_id; 
	
	END IF;
	
	
	RETURN v_return;
	
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP FUNCTION IF EXISTS `fn_get_discount_pass_price` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`remote`@`%` FUNCTION `fn_get_discount_pass_price`(
_userkey BIGINT,
_project_id INT
) RETURNS int
BEGIN
	
DECLARE v_origin_price INT DEFAULT 0;
DECLARE v_total_use_gem INT DEFAULT 0;
DECLARE v_percent INT DEFAULT 0;
DECLARE v_discount float DEFAULT 0;
DECLARE v_discount_price INT DEFAULT 0;

SELECT fn_get_origin_pass_price(_project_id) 
  INTO v_origin_price 
  FROM DUAL;	


SELECT ifnull(sum(a.quantity), 0) total_use_gem
  INTO v_total_use_gem 
  FROM gamelog.log_property a 
 WHERE a.userkey = _userkey
   AND a.log_type = 'use'
   AND a.project_id = _project_id
   AND a.currency = 'gem'
   AND a.log_code = 'selection_purchase';
  

IF v_origin_price > 1000 THEN
	SET v_origin_price = 1000;
END IF;
  
IF v_total_use_gem = 0 OR v_origin_price = 0 THEN
	SET v_percent = 0;
ELSE 
	SET v_percent = v_total_use_gem / v_origin_price * 100;
END IF;



IF v_percent <= 15 THEN SET v_discount = 0.2;
ELSEIF v_percent > 15 AND v_percent <= 25 THEN SET v_discount = 0.25;
ELSEIF v_percent > 25 AND v_percent <= 35 THEN SET v_discount = 0.3;
ELSEIF v_percent > 35 AND v_percent <= 50 THEN SET v_discount = 0.4;
ELSE SET v_discount = 0.5;
END IF;

	
SET v_discount_price = v_origin_price - CAST(v_origin_price * v_discount AS UNSIGNED);

RETURN ifnull(v_discount_price, 0);
	
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP FUNCTION IF EXISTS `fn_get_dlc_name` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`remote`@`%` FUNCTION `fn_get_dlc_name`(
_dlc_id int,
_lang varchar(10)
) RETURNS varchar(80) CHARSET utf8mb4
BEGIN

	DECLARE v_title varchar(80) DEFAULT '';

	IF _dlc_id < 0 THEN
		RETURN '';
	END IF;
	
	SELECT a.dlc_title 
	INTO v_title
	FROM dlc_detail a 
	WHERE a.dlc_id = _dlc_id
	AND a.lang = _lang;
	   
	RETURN v_title;	
	
	
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP FUNCTION IF EXISTS `fn_get_emoticon_info` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`remote`@`%` FUNCTION `fn_get_emoticon_info`(
_emoticon_image_id INT,
_col VARCHAR(20)
) RETURNS varchar(160) CHARSET utf8mb4
BEGIN
	
	
	DECLARE v_return VARCHAR(160) DEFAULT '';

	IF _emoticon_image_id < 0 THEN
		RETURN v_return;
	END IF;
	
	IF _col = 'url' THEN 
	
	SELECT image_url 
	  INTO v_return
	  FROM list_emoticon_slave 
	 WHERE emoticon_slave_id = _emoticon_image_id;
	
	ELSEIF _col = 'key' THEN
	
	SELECT image_key
	  INTO v_return
	  FROM list_emoticon_slave
	 WHERE emoticon_slave_id = _emoticon_image_id;
	
	END IF;
	
	
	RETURN v_return;
	
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP FUNCTION IF EXISTS `fn_get_ending_type` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`remote`@`%` FUNCTION `fn_get_ending_type`(
_ending_id INT
) RETURNS varchar(20) CHARSET utf8mb4
BEGIN
	
	DECLARE v_type VARCHAR(20) DEFAULT '';

	SELECT a.ending_type 
	  INTO v_type
	  FROM list_episode a 
	 WHERE a.episode_id = _ending_id;
	 
	
	RETURN v_type;
	
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP FUNCTION IF EXISTS `fn_get_ending_type_lang` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`remote`@`%` FUNCTION `fn_get_ending_type_lang`(
_ending_id INT,
_lang varchar(2)
) RETURNS varchar(300) CHARSET utf8mb4
BEGIN
	
	DECLARE v_type VARCHAR(20) DEFAULT '';
	DECLARE v_text_id int DEFAULT 0;
	DECLARE v_value varchar(300) DEFAULT '';

	
	SELECT a.ending_type 
	  INTO v_type
	  FROM list_episode a 
	 WHERE a.episode_id = _ending_id;
	
	
	SELECT text_id 
	INTO v_text_id
	FROM list_standard ls 
	WHERE standard_class = 'ending_type'
	AND code = v_type; 
	
	
	IF _lang = 'KO' THEN
		SELECT KO
		INTO v_value 
		FROM com_localize cl 
		WHERE id = v_text_id; 
	ELSEIF _lang = 'EN' THEN 
		SELECT EN
		INTO v_value 
		FROM com_localize cl 
		WHERE id = v_text_id; 	
	ELSEIF _lang = 'JA' THEN 
		SELECT JA
		INTO v_value 
		FROM com_localize cl 
		WHERE id = v_text_id; 	
	ELSEIF _lang = 'ZH' THEN 
		SELECT ZH
		INTO v_value 
		FROM com_localize cl 
		WHERE id = v_text_id; 	
	ELSEIF _lang = 'SC' THEN 
		SELECT SC
		INTO v_value 
		FROM com_localize cl 
		WHERE id = v_text_id; 	
	END IF;
	 
	
	RETURN v_value;
	
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP FUNCTION IF EXISTS `fn_get_episode_background_count` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`remote`@`%` FUNCTION `fn_get_episode_background_count`(
_episode_id INT
) RETURNS int
BEGIN
	
DECLARE v_cnt NUMERIC DEFAULT 0;
	
SELECT count(DISTINCT lb.bg_id) background_count
INTO v_cnt
FROM list_script ls
, list_bg lb 
WHERE ls.episode_id = _episode_id
AND lb.project_id = ls.project_id 
AND ls.template IN ('background', 'move_in')
AND substring_index(ls.script_data, ':', 1) = lb.image_name;


RETURN v_cnt;
	
	
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP FUNCTION IF EXISTS `fn_get_episode_cnt` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`remote`@`%` FUNCTION `fn_get_episode_cnt`(
_episode_id int,
_start_date datetime,
_end_date datetime,
_col VARCHAR(20)
) RETURNS int
BEGIN
	
	DECLARE v_return int DEFAULT 0;

	IF _col = 'free_count' THEN 
	
	 SELECT ifnull(count(*), 0) 
	 INTO v_return
	 FROM user_episode_purchase
	 WHERE episode_id = _episode_id
	 AND ( currency = 'none' OR ( currency = 'gem' AND currency_count = 0 ) ) 
	 AND purchase_date BETWEEN _start_date AND _end_date;

	ELSEIF _col = 'star_count' THEN 
	
	 SELECT ifnull(count(*), 0) 
	 INTO v_return
	 FROM user_episode_purchase
	 WHERE episode_id = _episode_id
	 AND currency = 'gem' AND currency_count <> 0
	 AND purchase_date BETWEEN _start_date AND _end_date;

 	ELSEIF _col = 'premium_count' THEN  
	 
 	 SELECT ifnull(count(*), 0) 
	 INTO v_return
	 FROM user_episode_purchase
	 WHERE episode_id = _episode_id
	 AND currency NOT IN ('none', 'gem')
	 AND purchase_date BETWEEN _start_date AND _end_date;
	
	ELSEIF _col = 'episode_clear' THEN  
	
	 SELECT ifnull(count(*), 0) 
	 INTO v_return
	 FROM gamelog.log_action
	 WHERE action_type = 'episode_clear' 
	 AND JSON_EXTRACT(log_data, '$.episodeID') = CAST(_episode_id AS CHAR(10))
	 AND action_date BETWEEN _start_date AND _end_date;
	
	ELSEIF _col = 'reset_progress' THEN  
     
	 SELECT ifnull(count(*), 0) 
	 INTO v_return
	 FROM gamelog.log_action
	 WHERE action_type = 'reset_progress' 
	 AND JSON_EXTRACT(log_data, '$.episodeID') = CAST(_episode_id AS CHAR(10))
	 AND action_date BETWEEN _start_date AND _end_date; 	
	
	ELSEIF _col = 'freepass' THEN 

     SELECT ifnull(count(*), 0) 
	 INTO v_return
	 FROM gamelog.log_action
	 WHERE action_type = 'freepass' 
	 AND JSON_EXTRACT(log_data, '$.episode_id') = _episode_id
	 AND action_date BETWEEN _start_date AND _end_date; 	
	
	END IF;
	
	RETURN v_return;
	
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP FUNCTION IF EXISTS `fn_get_episode_emoticon_count` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`remote`@`%` FUNCTION `fn_get_episode_emoticon_count`(
_episode_id INT
) RETURNS int
BEGIN
	
DECLARE v_cnt int DEFAULT 0;
	
SELECT count(DISTINCT les.emoticon_slave_id)
 INTO v_cnt
FROM list_script ls
, list_emoticon_master lem 
, list_emoticon_slave les 
WHERE ls.episode_id = _episode_id
AND (ls.emoticon_expression IS NOT NULL AND ls.emoticon_expression <> '')
AND (ls.speaker IS NOT NULL AND ls.speaker <> '')
AND ls.template IN (SELECT z.code FROM list_standard z WHERE z.standard_class = 'talking_template')
AND ls.project_id = lem.project_id 
AND lem.emoticon_owner = ls.speaker
AND les.emoticon_master_id = lem.emoticon_master_id 
AND les.image_name = ls.emoticon_expression;

RETURN v_cnt;
	
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP FUNCTION IF EXISTS `fn_get_episode_illust_count` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`remote`@`%` FUNCTION `fn_get_episode_illust_count`(
_episode_id INT
) RETURNS int
BEGIN
	
DECLARE v_cnt NUMERIC DEFAULT 0;
	
SELECT count(DISTINCT lo.illust_id)
 INTO v_cnt
FROM list_script ls
   , list_illust lo
WHERE ls.episode_id = _episode_id
AND lo.project_id = ls.project_id 
AND ls.template = 'illust'
AND lo.image_name = ls.script_data;

RETURN v_cnt;	
	
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP FUNCTION IF EXISTS `fn_get_episode_image_count` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`remote`@`%` FUNCTION `fn_get_episode_image_count`(
_episode_id INT
) RETURNS int
BEGIN
	

DECLARE v_cnt NUMERIC DEFAULT 0;
	
SELECT count(DISTINCT lm.minicut_id) image_count
INTO v_cnt
FROM list_script ls
, list_minicut lm 
WHERE ls.episode_id = _episode_id
AND lm.project_id = ls.project_id 
AND ls.template IN ('image', 'message_image')
AND ls.script_data = lm.image_name;


RETURN v_cnt;
	
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP FUNCTION IF EXISTS `fn_get_episode_live_illust_count` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`remote`@`%` FUNCTION `fn_get_episode_live_illust_count`(
_episode_id INT
) RETURNS int
BEGIN
	
DECLARE v_cnt NUMERIC DEFAULT 0;
	
SELECT count(DISTINCT lo.live_illust_id)
 INTO v_cnt
FROM list_script ls
   , list_live_illust lo
WHERE ls.episode_id = _episode_id
AND lo.project_id = ls.project_id 
AND ls.template = 'illust'
AND lo.live_illust_name = ls.script_data;

RETURN v_cnt;	
	
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP FUNCTION IF EXISTS `fn_get_episode_live_object_count` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`remote`@`%` FUNCTION `fn_get_episode_live_object_count`(
_episode_id INT
) RETURNS int
BEGIN
	

DECLARE v_cnt NUMERIC DEFAULT 0;
	
SELECT count(DISTINCT lo.live_object_id)
  INTO v_cnt
FROM list_script ls
   , list_live_object lo
WHERE ls.episode_id = _episode_id
AND lo.project_id = ls.project_id 
AND ls.template = 'live_object'
AND lo.live_object_name = ls.script_data;

RETURN v_cnt;	
	
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP FUNCTION IF EXISTS `fn_get_episode_model_count` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`remote`@`%` FUNCTION `fn_get_episode_model_count`(
_episode_id INT
) RETURNS int
BEGIN

DECLARE v_cnt INT DEFAULT 0;
	
SELECT count(*) 
  INTO v_cnt
  FROM (
	
SELECT DISTINCT speaker, script_data dress_name
  FROM list_script ls
     , list_dress_model ldm 
     , list_dress ld 
 WHERE ls.episode_id = _episode_id
   AND ls.template ='dress'
   AND ldm.dressmodel_name = ls.speaker 
   AND ld.dressmodel_id = ldm.dressmodel_id   
   AND ld.dress_name = ls.script_data 
UNION
SELECT DISTINCT substring_index(ls.speaker, ':', 1) speaker, ld.dress_name 
  FROM list_script ls
     , list_dress_model ldm 
     , list_dress ld 
 WHERE ls.episode_id = _episode_id
   AND ls.template IN (SELECT z.code FROM list_standard z WHERE z.standard_class ='talking_template')
   AND (ls.speaker IS NOT NULL AND ls.speaker <> '')
   AND (ls.character_expression IS NOT NULL AND ls.character_expression <> '')
   AND ldm.dressmodel_name = substring_index(ls.speaker, ':', 1)
   AND ld.dressmodel_id = ldm.dressmodel_id
   AND ld.is_default = 1   
) z
;
	
RETURN v_cnt;
	
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP FUNCTION IF EXISTS `fn_get_episode_progress_value` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`remote`@`%` FUNCTION `fn_get_episode_progress_value`(
_userkey BIGINT,
_project_id INT
) RETURNS float
BEGIN
	
DECLARE v_max_chapter INT DEFAULT 0;
DECLARE v_current_chapter INT DEFAULT 0;
DECLARE v_current_episode_type VARCHAR(20);


SELECT max(le.chapter_number) 
  INTO v_max_chapter
  FROM list_episode le 
 WHERE le.project_id = _project_id 
   AND le.episode_type = 'chapter';
  
  
  
  
  


SELECT le.chapter_number
     , le.episode_type 
  INTO v_current_chapter, v_current_episode_type
  FROM user_project_current a
     , list_project_master lpm
     , list_episode le 
 WHERE a.userkey = _userkey
   AND lpm.project_id = a.project_id
   AND a.project_id = _project_id
   AND a.is_special = 0
   AND le.episode_id = a.episode_id;   
  

 IF v_current_episode_type = 'chapter' THEN
	RETURN v_current_chapter /  v_max_chapter;
 ELSEIF v_current_episode_type IS NULL THEN
 	RETURN 0;
 ELSE 
 	RETURN 1;
 
 END IF;

END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP FUNCTION IF EXISTS `fn_get_episode_resource_count` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`remote`@`%` FUNCTION `fn_get_episode_resource_count`(
_episode_id INT,
_col VARCHAR(20)
) RETURNS int
BEGIN
	
DECLARE v_count INT DEFAULT 0;

IF _col = 'background' THEN

SELECT count(DISTINCT lb.bg_id)
  INTO v_count
FROM list_script ls
, list_bg lb 
WHERE ls.episode_id = _episode_id
AND lb.project_id = ls.project_id 
AND ls.template IN ('background', 'move_in')
AND substring_index(ls.script_data, ':', 1) = lb.image_name;

ELSEIF _col = 'image' THEN

SELECT count(DISTINCT lm.minicut_id) 
  INTO v_count
FROM list_script ls
, list_minicut lm 
WHERE ls.episode_id = _episode_id
AND lm.project_id = ls.project_id 
AND ls.template IN ('image', 'message_image')
AND ls.script_data = lm.image_name;

ELSEIF _col = 'illust' THEN

SELECT count(DISTINCT li.illust_id)
  INTO v_count
FROM list_script ls
, list_illust li 
WHERE ls.episode_id = _episode_id
AND li.project_id = ls.project_id 
AND ls.template = 'illust'
AND ls.script_data = li.image_name;

ELSEIF _col = 'emoticon' THEN

SELECT count(DISTINCT les.emoticon_slave_id)
  INTO v_count
FROM list_script ls
, list_emoticon_master lem 
, list_emoticon_slave les 
WHERE ls.episode_id = _episode_id
AND (ls.emoticon_expression IS NOT NULL AND ls.emoticon_expression <> '')
AND (ls.speaker IS NOT NULL AND ls.speaker <> '')
AND ls.template IN (SELECT z.code FROM list_standard z WHERE z.standard_class = 'talking_template')
AND ls.project_id = lem.project_id 
AND lem.emoticon_owner = ls.speaker
AND les.emoticon_master_id = lem.emoticon_master_id 
AND les.image_name = ls.emoticon_expression;

END IF;
	

RETURN v_count;
	
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP FUNCTION IF EXISTS `fn_get_episode_summary_lang` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`remote`@`%` FUNCTION `fn_get_episode_summary_lang`(
_episode_id INT,
_lang VARCHAR(10)
) RETURNS varchar(500) CHARSET utf8mb4
BEGIN
	
	
	DECLARE v_summary VARCHAR(500) DEFAULT '';

	SELECT led.summary 
	  INTO v_summary
	  FROM list_episode_detail led 
	 WHERE led.episode_id = _episode_id
	   AND led.lang = upper(_lang);
	  
	  
	RETURN v_summary;
	
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP FUNCTION IF EXISTS `fn_get_episode_template_count` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`remote`@`%` FUNCTION `fn_get_episode_template_count`(
_episode_id INT,
_template VARCHAR(20),
_lang VARCHAR(10)
) RETURNS int
BEGIN
	
DECLARE v_cnt INT DEFAULT 0;

SELECT count(*)
  INTO v_cnt
  FROM list_script ls
 WHERE ls.episode_id = _episode_id
   AND ls.lang = _lang
   AND ls.template = _template ;
	
  
 RETURN v_cnt;
  
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP FUNCTION IF EXISTS `fn_get_episode_title_lang` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`remote`@`%` FUNCTION `fn_get_episode_title_lang`(
_episode_id INT,
_lang VARCHAR(10)
) RETURNS varchar(60) CHARSET utf8mb4
BEGIN
	
DECLARE v_title VARCHAR(60) DEFAULT '';
DECLARE v_exists NUMERIC DEFAULT 0;

SELECT fn_check_episode_lang_exists(_episode_id, _lang)
  INTO v_exists 
  FROM DUAL;
 
IF v_exists > 0 THEN 

	SELECT detail.title
	  INTO v_title
	  FROM list_episode a
	     , list_episode_detail detail 
	 WHERE a.episode_id = _episode_id
	   AND a.episode_id = detail.episode_id
	   AND detail.lang = _lang;

ELSE 

	SELECT a.title
	  INTO v_title
	  FROM list_episode a
	 WHERE a.episode_id = _episode_id;

END IF;

	
RETURN v_title;  
  
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP FUNCTION IF EXISTS `fn_get_episode_type` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`remote`@`%` FUNCTION `fn_get_episode_type`(_episode_id INT) RETURNS varchar(20) CHARSET utf8mb4
BEGIN
	
	DECLARE v_type VARCHAR(20) DEFAULT NULL;

	SELECT a.episode_type
	  INTO v_type
	  FROM list_episode a 
	 WHERE a.episode_id = _episode_id;
	 
	
	RETURN v_type;
	
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP FUNCTION IF EXISTS `fn_get_fail_prize_count` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`remote`@`%` FUNCTION `fn_get_fail_prize_count`(
_prize_id INT,
_start_date DATETIME,
_end_date DATETIME
) RETURNS int
BEGIN

	DECLARE v_cnt INT DEFAULT 0;
	
	SELECT count(*)
	INTO v_cnt
	FROM user_prize_history a
	WHERE a.prize_id = _prize_id
	AND a.is_win = 0
	AND a.action_date BETWEEN _start_date AND _end_date;
  
 RETURN v_cnt;

END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP FUNCTION IF EXISTS `fn_get_grade_info` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`remote`@`%` FUNCTION `fn_get_grade_info`(
_grade int,
_grade_experience int
) RETURNS int
BEGIN

	DECLARE v_garde int DEFAULT 1;

    SELECT max(grade) 
    INTO v_garde
    FROM com_grade cg
	WHERE grade > _grade
	AND _grade_experience >= upgrade_point; 	

	RETURN v_garde;

END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP FUNCTION IF EXISTS `fn_get_grade_name_info` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`remote`@`%` FUNCTION `fn_get_grade_name_info`(
_grade int,
_lang varchar(2)
) RETURNS varchar(60) CHARSET utf8mb4
BEGIN

	DECLARE v_name varchar(60) DEFAULT '';

	SELECT b.name 
    INTO v_name 
    FROM com_grade a, com_grade_lang b
    WHERE a.grade_id = b.grade_id 
    AND a.grade = _grade
    AND lang = _lang;

	RETURN v_name;

END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP FUNCTION IF EXISTS `fn_get_hashtag_name` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`remote`@`%` FUNCTION `fn_get_hashtag_name`(
_hashtag_no int
) RETURNS varchar(100) CHARSET utf8mb4
BEGIN

	DECLARE v_name varchar(100) DEFAULT '';

	SELECT a.tag_name
      INTO v_name 
      FROM com_hashtag a
	 WHERE a.hashtag_no = _hashtag_no;


RETURN v_name;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP FUNCTION IF EXISTS `fn_get_hashtag_no` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`remote`@`%` FUNCTION `fn_get_hashtag_no`(
_project_id INT
) RETURNS varchar(120) CHARSET utf8mb4
BEGIN
	
	DECLARE v_hashtag VARCHAR(120) DEFAULT '';
		
	SELECT group_concat(hashtag_no)
	INTO v_hashtag
	FROM list_project_hashtag lph 
	WHERE project_id = _project_id;	
	 
	 
	RETURN v_hashtag; 
 
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP FUNCTION IF EXISTS `fn_get_illust_localized_text` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`remote`@`%` FUNCTION `fn_get_illust_localized_text`(
_illust_id INT,
_illust_type VARCHAR(20),
_lang VARCHAR(10),
_col VARCHAR(10)
) RETURNS varchar(500) CHARSET utf8mb4
BEGIN
	
	DECLARE v_public_name VARCHAR(60) DEFAULT '';
	DECLARE v_summary VARCHAR(500) DEFAULT '';

	SELECT a.public_name 
	     , a.summary 
	  INTO v_public_name, v_summary
	  FROM list_illust_lang a
	 WHERE a.illust_id = _illust_id
	   AND a.illust_type = _illust_type
	   AND a.lang = _lang;
	  
	

	IF _col = 'name' THEN
		RETURN v_public_name;

	ELSEIF _col = 'summary' THEN
		RETURN v_summary;
	
	ELSE 
		RETURN NULL;
	
	END IF;
	 

	
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP FUNCTION IF EXISTS `fn_get_live_pair_id` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`remote`@`%` FUNCTION `fn_get_live_pair_id`(
_project_id INT,
_template VARCHAR(20),
_image_name VARCHAR(40)
) RETURNS int
BEGIN
	
	DECLARE v_pair_id INT DEFAULT -1;
	
	IF _template = 'illust' THEN
		
		SELECT a.live_pair_id
		  INTO v_pair_id
		  FROM list_illust a
		 WHERE a.project_id = _project_id
		   AND a.image_name = _image_name;
		  
	ELSEIF _template = 'image' THEN
	
		SELECT a.live_pair_id
		  INTO v_pair_id
		  FROM list_minicut a
		 WHERE a.project_id = _project_id
		   AND a.image_name = _image_name;	
	
	
	END IF;

	RETURN v_pair_id;
	
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP FUNCTION IF EXISTS `fn_get_localize_text` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`remote`@`%` FUNCTION `fn_get_localize_text`(
text_id INT,
lang VARCHAR(10)
) RETURNS varchar(200) CHARSET utf8mb4
BEGIN
	
	DECLARE v_text VARCHAR(200) DEFAULT NULL;

	IF lang = 'KO' THEN
		SELECT cl.KO 
		  INTO v_text
		  FROM com_localize cl
		WHERE cl.id = text_id;
	
	ELSEIF lang = 'EN' THEN
		SELECT cl.EN 
		  INTO v_text
		  FROM com_localize cl
		WHERE cl.id = text_id;

	ELSEIF lang = 'JA' THEN
		SELECT cl.JA
		  INTO v_text
		  FROM com_localize cl
		WHERE cl.id = text_id;	

	ELSEIF lang = 'ZH' THEN
		SELECT cl.ZH 
		  INTO v_text
		  FROM com_localize cl
		WHERE cl.id = text_id;	
	
	ELSEIF lang = 'SC' THEN
		SELECT cl.SC 
		  INTO v_text
		  FROM com_localize cl
		WHERE cl.id = text_id;		
	ELSEIF lang = 'AR' THEN
		SELECT cl.AR 
		  INTO v_text
		  FROM com_localize cl
		WHERE cl.id = text_id;			
	ELSEIF lang = 'MS' THEN
		SELECT cl.MS
		  INTO v_text
		  FROM com_localize cl
		WHERE cl.id = text_id;
	ELSEIF lang = 'ES' THEN
		SELECT cl.ES
		  INTO v_text
		  FROM com_localize cl
		WHERE cl.id = text_id;
	ELSEIF lang = 'RU' THEN
		SELECT cl.RU
		  INTO v_text
		  FROM com_localize cl
		WHERE cl.id = text_id;
	
	ELSE 

		SELECT cl.KO 
		  INTO v_text
		  FROM com_localize cl
		WHERE cl.id = text_id;
	
	
	END IF;


RETURN v_text;
	
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP FUNCTION IF EXISTS `fn_get_mail_cnt` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`remote`@`%` FUNCTION `fn_get_mail_cnt`(
_reservation_no int, 
_get_check varchar(1)
) RETURNS int
BEGIN
	
	
	DECLARE v_cnt INT DEFAULT 0;

	IF _get_check = 'Y' THEN 
	
		SELECT count(*) 
		INTO v_cnt 
		FROM user_mail 
		WHERE reservation_no = _reservation_no
		AND is_receive = 1; 
	
	ELSE                     
	
		SELECT count(*) 
		INTO v_cnt 
		FROM user_mail 
		WHERE reservation_no = _reservation_no
		and is_receive = 0; 	
	
	END IF; 


    RETURN v_cnt;

END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP FUNCTION IF EXISTS `fn_get_main_category` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`remote`@`%` FUNCTION `fn_get_main_category`(
_category_id int,
_lang varchar(2), 
_country varchar(2),
_is_deploy int,
_build varchar(120)
) RETURNS varchar(1000) CHARSET utf8mb4
BEGIN
	
	

	DECLARE v_project_kind varchar(30); 
	DECLARE v_project_list varchar(1000) DEFAULT '';
	DECLARE v_project_cnt int DEFAULT 0;
	DECLARE v_genre varchar(30); 
	DECLARE v_rank_kind varchar(30); 
	DECLARE v_is_favorite TINYINT DEFAULT 0; 
	DECLARE v_is_view TINYINT DEFAULT 0;
	

	SELECT project_kind, project_cnt, genre, rank_kind, is_favorite, is_view
	INTO v_project_kind, v_project_cnt, v_genre, v_rank_kind, v_is_favorite, v_is_view
	FROM com_main_category cmc 
	WHERE category_id = _category_id;

	
	IF v_project_kind = 'manual' THEN        
	       
		SELECT group_concat(lpm.project_id ORDER BY cmcp.sortkey)
		INTO v_project_list
		FROM list_project_master lpm, com_main_category_project cmcp  
		WHERE lpm.project_id = cmcp.project_id
		AND cmcp.category_id = _category_id
		AND lpm.project_id > 0
		AND is_public > 0
		AND lpm.service_package LIKE CONCAT('%', _build, '%')
		AND (locate(_lang, exception_lang) IS NULL OR locate(_lang, exception_lang) < 1)
  		AND (locate(_country, exception_country) IS NULL OR locate(_country, exception_country) < 1)
  		AND lpm.is_deploy > (CASE WHEN _is_deploy > 0 THEN 0 ELSE -1 END);
	
	
	ELSEIF v_project_kind = 'view' THEN      
	
  		SELECT group_concat(project_id ORDER BY hit_count DESC) 
  		INTO v_project_list
  		FROM (
	  	    SELECT lpm.project_id, sps.hit_count 
			FROM list_project_master lpm, gamelog.stat_project_sum sps 
			WHERE lpm.project_id = sps.project_id 
			AND lpm.project_id > 0
			AND is_public > 0 
			AND lpm.service_package LIKE CONCAT('%', _build, '%')
			AND (locate(_lang, exception_lang) IS NULL OR locate(_lang, exception_lang) < 1)
	  		AND (locate(_country, exception_country) IS NULL OR locate(_country, exception_country) < 1)
	  		AND lpm.is_deploy > (CASE WHEN _is_deploy > 0 THEN 0 ELSE -1 END)
	  		ORDER BY hit_count DESC
	  		LIMIT 3
	  	) T;
	
	ELSE                                     
	
		
		IF v_rank_kind = 'random' THEN       
		
			SELECT group_concat(project_id) 
			INTO v_project_list
			FROM (
				SELECT DISTINCT lpm.project_id 
				FROM list_project_master lpm, list_project_genre lpg 
				WHERE lpm.project_id = lpg.project_id 
				AND lpm.project_id > 0			
				AND is_public > 0 
				AND (locate(_lang, exception_lang) IS NULL OR locate(_lang, exception_lang) < 1)
	  			AND (locate(_country, exception_country) IS NULL OR locate(_country, exception_country) < 1)
	  			AND lpm.is_deploy > (CASE WHEN _is_deploy > 0 THEN 0 ELSE -1 END)
	  			AND lpg.genre_code = v_genre
	  			ORDER BY rand()
	  			LIMIT v_project_cnt
	  		) T;
	
		ELSEIF v_rank_kind = 'view' THEN     
		
		
			SELECT group_concat(project_id ORDER BY hit_count DESC)
			INTO v_project_list
			FROM ( 
				SELECT DISTINCT lpm.project_id, sps.hit_count 
				FROM list_project_master lpm, gamelog.stat_project_sum sps, list_project_genre lpg 
				WHERE lpm.project_id = sps.project_id
				AND lpm.project_id = lpg.project_id 
				AND lpm.project_id > 0			
				AND is_public > 0 
				AND lpm.service_package LIKE CONCAT('%', _build, '%')
				AND (locate(_lang, exception_lang) IS NULL OR locate(_lang, exception_lang) < 1)
	  			AND (locate(_country, exception_country) IS NULL OR locate(_country, exception_country) < 1)
	  			AND lpm.is_deploy > (CASE WHEN _is_deploy > 0 THEN 0 ELSE -1 END)
	  			AND lpg.genre_code = v_genre
	  			ORDER BY sps.hit_count DESC
	  			LIMIT v_project_cnt
  			) T;
			
		
		ELSE                                 
		
		
		  	SELECT group_concat(project_id ORDER BY like_count DESC) 
		  	INTO v_project_list
  			FROM (
	  			SELECT DISTINCT lpm.project_id, sps.like_count 
				FROM list_project_master lpm, gamelog.stat_project_sum sps, list_project_genre lpg 
				WHERE lpm.project_id = sps.project_id
				AND lpm.project_id = lpg.project_id 
				AND lpm.project_id > 0			
				AND is_public > 0 
				AND lpm.service_package LIKE CONCAT('%', _build, '%')
				AND (locate(_lang, exception_lang) IS NULL OR locate(_lang, exception_lang) < 1)
	  			AND (locate(_country, exception_country) IS NULL OR locate(_country, exception_country) < 1)
	  			AND lpm.is_deploy > (CASE WHEN _is_deploy > 0 THEN 0 ELSE -1 END)
	  			AND lpg.genre_code = v_genre
	  			ORDER BY sps.like_count DESC
	  			LIMIT v_project_cnt
	  		) T;	
		
		END IF; 
		
	END IF; 


	RETURN ifnull(v_project_list, '');

END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP FUNCTION IF EXISTS `fn_get_main_category_culture` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`remote`@`%` FUNCTION `fn_get_main_category_culture`(
_category_id int,
_lang varchar(2), 
_culture varchar(10),
_is_deploy int
) RETURNS varchar(300) CHARSET utf8mb4
BEGIN
	
	

	DECLARE v_project_kind varchar(30); 
	DECLARE v_project_list varchar(1000) DEFAULT '';
	DECLARE v_project_cnt int DEFAULT 0;
	DECLARE v_genre varchar(30); 
	DECLARE v_rank_kind varchar(30); 
	DECLARE v_is_favorite TINYINT DEFAULT 0; 
	DECLARE v_is_view TINYINT DEFAULT 0;
	

	SELECT project_kind, project_cnt, genre, rank_kind, is_favorite, is_view
	INTO v_project_kind, v_project_cnt, v_genre, v_rank_kind, v_is_favorite, v_is_view
	FROM com_main_category cmc 
	WHERE category_id = _category_id;

	
	IF v_project_kind = 'manual' THEN        
	       
		SELECT group_concat(lpm.project_id ORDER BY cmcp.sortkey)
		INTO v_project_list
		FROM list_project_master lpm, com_main_category_project cmcp  
		WHERE lpm.project_id = cmcp.project_id
		AND cmcp.category_id = _category_id
		AND lpm.project_id > 0
		AND is_public > 0
		AND lpm.project_type = 0
  		AND (locate(_culture, exception_culture) IS NULL OR locate(_culture, exception_culture) < 1)
  		AND lpm.is_deploy > (CASE WHEN _is_deploy > 0 THEN 0 ELSE -1 END);
	
	
	ELSEIF v_project_kind = 'view' THEN      
	
  		SELECT group_concat(project_id ORDER BY hit_count DESC) 
  		INTO v_project_list
  		FROM (
	  	    SELECT lpm.project_id, sps.hit_count 
			FROM list_project_master lpm, gamelog.stat_project_sum sps 
			WHERE lpm.project_id = sps.project_id 
			AND lpm.project_id > 0
			AND is_public > 0 
			AND lpm.project_type = 0
	  		AND (locate(_culture, exception_culture) IS NULL OR locate(_culture, exception_culture) < 1)
	  		AND lpm.is_deploy > (CASE WHEN _is_deploy > 0 THEN 0 ELSE -1 END)
	  		ORDER BY hit_count DESC
	  		LIMIT 3
	  	) T;
	
	ELSE                                     
	
		
		IF v_rank_kind = 'random' THEN       
		
			SELECT group_concat(project_id) 
			INTO v_project_list
			FROM (
				SELECT DISTINCT lpm.project_id 
				FROM list_project_master lpm, list_project_genre lpg 
				WHERE lpm.project_id = lpg.project_id 
				AND lpm.project_id > 0			
				AND is_public > 0 
				AND lpm.project_type = 0
				AND (locate(_culture, exception_culture) IS NULL OR locate(_culture, exception_culture) < 1)
	  			AND lpm.is_deploy > (CASE WHEN _is_deploy > 0 THEN 0 ELSE -1 END)
	  			AND lpg.genre_code = v_genre
	  			ORDER BY rand()
	  			LIMIT v_project_cnt
	  		) T;
	
		ELSEIF v_rank_kind = 'view' THEN     
		
		
			SELECT group_concat(project_id ORDER BY hit_count DESC)
			INTO v_project_list
			FROM ( 
				SELECT DISTINCT lpm.project_id, sps.hit_count 
				FROM list_project_master lpm, gamelog.stat_project_sum sps, list_project_genre lpg 
				WHERE lpm.project_id = sps.project_id
				AND lpm.project_id = lpg.project_id 
				AND lpm.project_id > 0			
				AND is_public > 0 
				AND lpm.project_type = 0
				AND (locate(_culture, exception_culture) IS NULL OR locate(_culture, exception_culture) < 1)
	  			AND lpm.is_deploy > (CASE WHEN _is_deploy > 0 THEN 0 ELSE -1 END)
	  			AND lpg.genre_code = v_genre
	  			ORDER BY sps.hit_count DESC
	  			LIMIT v_project_cnt
  			) T;
			
		
		ELSE                                 
		
		
		  	SELECT group_concat(project_id ORDER BY like_count DESC) 
		  	INTO v_project_list
  			FROM (
	  			SELECT DISTINCT lpm.project_id, sps.like_count 
				FROM list_project_master lpm, gamelog.stat_project_sum sps, list_project_genre lpg 
				WHERE lpm.project_id = sps.project_id
				AND lpm.project_id = lpg.project_id 
				AND lpm.project_id > 0			
				AND is_public > 0 
				AND lpm.project_type = 0
				AND (locate(_culture, exception_culture) IS NULL OR locate(_culture, exception_culture) < 1)
	  			AND lpm.is_deploy > (CASE WHEN _is_deploy > 0 THEN 0 ELSE -1 END)
	  			AND lpg.genre_code = v_genre
	  			ORDER BY sps.like_count DESC
	  			LIMIT v_project_cnt
	  		) T;	
		
		END IF; 
		
	END IF; 


	RETURN ifnull(v_project_list, '');
	
	
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP FUNCTION IF EXISTS `fn_get_main_episode_count` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`remote`@`%` FUNCTION `fn_get_main_episode_count`(
_project_id INT
) RETURNS int
BEGIN
	
	DECLARE v_cnt INT DEFAULT 0;

    SELECT count(*)
      INTO v_cnt
      FROM list_episode le 
     WHERE project_id = _project_id
       AND episode_type = 'chapter';
      
     RETURN v_cnt;
	
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP FUNCTION IF EXISTS `fn_get_max_ad_reward_value` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`remote`@`%` FUNCTION `fn_get_max_ad_reward_value`(
_userkey BIGINT,
_number int,
_col varchar(10)
) RETURNS int
BEGIN
	
	
	DECLARE v_max_value int DEFAULT 0;

	IF _col = 'id' THEN 
		
		IF _number = 2 THEN 
			SELECT ifnull(max(history_no), 0)
			INTO v_max_value
		    FROM user_ad_reward_history uarh 
		   	WHERE uarh.userkey = _userkey
		    AND uarh.ad_no = _number;	
		ELSE 
			SELECT ifnull(max(history_no), 0)
			INTO v_max_value
		    FROM user_ad_reward_history uarh 
		   	WHERE uarh.userkey = _userkey
		    AND uarh.ad_no = _number
		    AND DATE_FORMAT(now(), '%Y-%m-%d') = DATE_FORMAT(action_date, '%Y-%m-%d');		
		END IF;
	ELSEIF _col = 'clear' THEN 
		
		SELECT
		CASE WHEN clear_date IS NULL THEN 0 
		ELSE 1 END 
		INTO v_max_value
		FROM user_ad_reward_history uarh 
		WHERE userkey = _userkey
		AND ad_no = 1
		AND DATE_FORMAT(now(), '%Y-%m-%d') = DATE_FORMAT(action_date, '%Y-%m-%d')
		AND step = _number;		
	ELSEIF _col = 'total' THEN 
		
		SELECT 
		CASE WHEN _number = 2 THEN second_count 
			 WHEN _number = 3 THEN third_count 
		ELSE first_count END 
		INTO v_max_value
		FROM com_ad_reward car 
		WHERE ad_no = 1;	
	END IF; 
	

    RETURN v_max_value;

END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP FUNCTION IF EXISTS `fn_get_max_attendance_id` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`remote`@`%` FUNCTION `fn_get_max_attendance_id`(
_kind BIGINT,
_col varchar(20)
) RETURNS int
BEGIN
	DECLARE v_max int DEFAULT 0;
	
	IF _col = 'com' THEN 
		SELECT ifnull(max(attendance_id), 0) 
		INTO v_max
	    FROM com_attendance ca 
	    WHERE attendance_id > 0 
	    AND is_public > 0 
	    AND kind = _kind
	    AND now() BETWEEN from_date AND to_date;
    ELSE 
    	SELECT ifnull(max(attendance_no), 0)
    	INTO v_max
    	FROM user_continuous_attendance uca 
    	WHERE userkey = _kind
    	AND now() BETWEEN start_date AND end_date;
    END IF;
	
   RETURN v_max;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP FUNCTION IF EXISTS `fn_get_max_chapter_number` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`remote`@`%` FUNCTION `fn_get_max_chapter_number`(
__project_id INT
) RETURNS int
BEGIN
	DECLARE v_max int DEFAULT 0;
	
	SELECT max(chapter_number) 
	  INTO v_max
      FROM list_episode le WHERE le.project_id = __project_id;
     
    RETURN v_max;
	
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP FUNCTION IF EXISTS `fn_get_max_project_current_time` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`remote`@`%` FUNCTION `fn_get_max_project_current_time`(
_userkey bigint
) RETURNS varchar(20) CHARSET utf8mb4
BEGIN
	
	
	DECLARE v_max_time varchar(20) DEFAULT '';
	
	SELECT update_date 
	INTO v_max_time
    FROM user_project_current upc 
   	WHERE userkey = _userkey
    AND is_special = 0
   	ORDER BY update_date DESC 
   	LIMIT 1;
     
    RETURN v_max_time;
	
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP FUNCTION IF EXISTS `fn_get_mindiff_user_activity` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`remote`@`%` FUNCTION `fn_get_mindiff_user_activity`(
_userkey bigint
) RETURNS int
BEGIN
	
DECLARE v_last_date DATETIME;
DECLARE v_mindiff int;

SELECT ifnull(max(action_date), '2022-01-01')
  INTO v_last_date
  FROM gamelog.log_action la 
 WHERE la.userkey = _userkey;


SELECT timestampdiff(MINUTE, v_last_date, now())
  INTO v_mindiff
  FROM DUAL;
 
 
RETURN v_mindiff;

	
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP FUNCTION IF EXISTS `fn_get_minicut_localized_text` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`remote`@`%` FUNCTION `fn_get_minicut_localized_text`(
_minicut_id INT,
_minicut_type VARCHAR(20),
_lang VARCHAR(10),
_col VARCHAR(10)
) RETURNS varchar(500) CHARSET utf8mb4
BEGIN
	
	DECLARE v_public_name VARCHAR(60) DEFAULT '';
	DECLARE v_summary VARCHAR(500) DEFAULT '';

	SELECT a.public_name 
	     , a.summary 
	  INTO v_public_name, v_summary
	  FROM list_minicut_lang a
	 WHERE a.minicut_id = _minicut_id
	   AND a.minicut_type = _minicut_type
	   AND a.lang = _lang;
	  
	

	IF _col = 'name' THEN
		RETURN v_public_name;

	ELSEIF _col = 'summary' THEN
		RETURN v_summary;
	
	ELSE 
		RETURN NULL;
	
	END IF;
	 

	
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP FUNCTION IF EXISTS `fn_get_mission_count` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`remote`@`%` FUNCTION `fn_get_mission_count`(
_project_id int, 
_userkey int, 
_is_receive varchar(1)
) RETURNS int
BEGIN
	
	DECLARE v_count int DEFAULT 0;

	IF _is_receive = 'Y' THEN 
		SELECT count(*)
		INTO v_count
		FROM user_mission 
		WHERE userkey = _userkey 
		AND mission_id in(SELECT mission_id FROM list_mission lm WHERE project_id = _project_id)
		AND unlock_state = 1; 
	ELSE 
		SELECT count(*)
		INTO v_count
		FROM user_mission 
		WHERE userkey = _userkey 
		AND mission_id in(SELECT mission_id FROM list_mission lm WHERE project_id = _project_id);	
	END IF; 

	RETURN v_count;
	
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP FUNCTION IF EXISTS `fn_get_mission_hint` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`remote`@`%` FUNCTION `fn_get_mission_hint`(
_mission_id INT,
_lang VARCHAR(10)
) RETURNS varchar(500) CHARSET utf8mb4
BEGIN
	
	
	DECLARE v_mission_hint VARCHAR(500) DEFAULT '';

	
	SELECT a.mission_hint
	  INTO v_mission_hint
	  FROM list_mission_lang a
	 WHERE a.mission_id = _mission_id
	   AND a.lang = _lang;
	  
	 IF v_mission_hint IS NULL THEN
	 
	 	
		 SELECT a.mission_hint
		  INTO v_mission_hint
		  FROM list_mission_lang a
		 WHERE a.mission_id = _mission_id
		   AND a.lang = 'KO';
		  
	 END IF;
	 
	 RETURN v_mission_hint;	
	
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP FUNCTION IF EXISTS `fn_get_mission_lang` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`remote`@`%` FUNCTION `fn_get_mission_lang`(
_mission_id INT,
_lang VARCHAR(10),
_col VARCHAR(10) 
) RETURNS varchar(500) CHARSET utf8mb4
BEGIN
	

DECLARE v_name VARCHAR(60) DEFAULT '';
DECLARE v_hint VARCHAR(500) DEFAULT '';
 
DECLARE v_return VARCHAR(500) DEFAULT '';
DECLARE v_exists NUMERIC DEFAULT 0;

SELECT fn_check_mission_lang_exists(_mission_id, _lang)
  INTO v_exists 
  FROM DUAL;


IF v_exists > 0 THEN 

	SELECT detail.mission_name
	     , detail.mission_hint
	  INTO v_name, v_hint 
	  FROM list_mission a 
	     , list_mission_lang detail 
	 WHERE a.mission_id = _mission_id
	   AND a.mission_id = detail.mission_id
	   AND detail.lang = _lang;

ELSE 

	SELECT a.mission_name, a.mission_hint
	  INTO v_name, v_hint
	  FROM list_mission a
	 WHERE a.mission_id = _mission_id;

END IF;

IF _col = 'name' THEN
	SET v_return = v_name;
ELSE
	SET v_return = v_hint;
END IF;
	
RETURN v_return;  	
	

END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP FUNCTION IF EXISTS `fn_get_mission_name` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`remote`@`%` FUNCTION `fn_get_mission_name`(
_mission_id INT,
_lang VARCHAR(10)
) RETURNS varchar(60) CHARSET utf8mb4
BEGIN
	
	DECLARE v_mission_name VARCHAR(60) DEFAULT '';

	
	SELECT a.mission_name
	  INTO v_mission_name
	  FROM list_mission_lang a
	 WHERE a.mission_id = _mission_id
	   AND a.lang = _lang;
	  
	 IF v_mission_name IS NULL THEN
	 
	 	
		 SELECT a.mission_name
		  INTO v_mission_name
		  FROM list_mission_lang a
		 WHERE a.mission_id = _mission_id
		   AND a.lang = 'KO';
		  
	 END IF;
	 
	 RETURN v_mission_name;
	
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP FUNCTION IF EXISTS `fn_get_model_speaker` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`remote`@`%` FUNCTION `fn_get_model_speaker`(
_model_id INT
) RETURNS varchar(20) CHARSET utf8mb4
BEGIN
	
	DECLARE v_dressmodel_id INT;
	DECLARE v_speaker VARCHAR(20);
	
	SELECT ld.dressmodel_id  
	  INTO v_dressmodel_id
      FROM list_dress ld WHERE model_id = _model_id;
     
     
    SELECT ldm.dressmodel_name
      INTO v_speaker
      FROM list_dress_model ldm 
     WHERE ldm.dressmodel_id = v_dressmodel_id;
	
    RETURN v_speaker;
	
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP FUNCTION IF EXISTS `fn_get_motion_file_key` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`remote`@`%` FUNCTION `fn_get_motion_file_key`(
_model_id INT,
_file_name VARCHAR(120)
) RETURNS varchar(160) CHARSET utf8mb4
begin
	
	declare v_file_key varchar(160);
	
	select lms.file_key
	  into v_file_key
	 from list_model_slave lms
	 where lms.model_id  = _model_id
	   and lms.file_name  = _file_name;

RETURN v_file_key;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP FUNCTION IF EXISTS `fn_get_motion_name` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`remote`@`%` FUNCTION `fn_get_motion_name`(
_model_id int,
_file_key varchar(160)
) RETURNS varchar(30) CHARSET utf8mb4
BEGIN
	DECLARE v_motion varchar(30) DEFAULT null;
	
	SELECT a.motion_name
	  INTO v_motion
	  FROM list_model_motion a 
	 WHERE a.model_id = _model_id
	   AND a.file_key = _file_key;
	   
	RETURN v_motion;
	
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP FUNCTION IF EXISTS `fn_get_motion_name_by_id` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`remote`@`%` FUNCTION `fn_get_motion_name_by_id`(
_motion_id INT
) RETURNS varchar(30) CHARSET utf8mb4
BEGIN

	DECLARE v_motion varchar(30) DEFAULT null;
	
	SELECT motion.motion_name 
	INTO v_motion
  FROM list_model_motion motion
     , list_model_slave slave
     , list_model_master master
WHERE motion.motion_id = _motion_id
  AND slave.model_id = motion.model_id 
  AND slave.file_key = motion.file_key 
  AND master.model_id = slave .model_id 
;

RETURN v_motion;
	
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP FUNCTION IF EXISTS `fn_get_next_day_seq` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`remote`@`%` FUNCTION `fn_get_next_day_seq`(
_attendance_id int,
_day_seq int
) RETURNS int
BEGIN
	
	
	DECLARE v_return int DEFAULT 0;
	DECLARE v_kind int DEFAULT 0; 


	SELECT ifnull(day_seq, 0)
	INTO v_return
	FROM com_attendance_daily cad 
	WHERE attendance_id = _attendance_id
	AND day_seq > _day_seq
	LIMIT 1;

	
	SELECT kind 
	INTO v_kind 
	FROM com_attendance ca 
	WHERE attendance_id = _attendance_id;


	IF v_kind <> -1 AND v_return = 0 THEN 
		SET v_return = 1;
	END IF;

	
	RETURN v_return;
	
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP FUNCTION IF EXISTS `fn_get_notice_name` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`remote`@`%` FUNCTION `fn_get_notice_name`(
_notice_no int,
_lang varchar(2)
) RETURNS varchar(60) CHARSET utf8mb4
BEGIN
	
	DECLARE v_title varchar(60) DEFAULT '';

	IF _notice_no < 0 THEN
		RETURN '';
	END IF;
	
	SELECT a.title
	INTO v_title
	FROM com_notice_detail a
	WHERE a.notice_no = _notice_no
	AND a.lang = _lang;
	   
	RETURN v_title;
	
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP FUNCTION IF EXISTS `fn_get_not_play_project` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`remote`@`%` FUNCTION `fn_get_not_play_project`(
_userkey bigint
) RETURNS varchar(1000) CHARSET utf8mb4
BEGIN
	
	
	DECLARE v_project_list varchar(1000) DEFAULT '';
	DECLARE v_last_played_project int DEFAULT -1; 
	DECLARE v_country varchar(2) DEFAULT '';
	DECLARE v_lang varchar(2) DEFAULT '';

	
	SELECT project_id 
	INTO v_last_played_project
	FROM user_project_current upc 
	WHERE userkey = _userkey
	AND update_date = fn_get_max_project_current_time(_userkey); 

	
	SELECT ifnull(country, ''), ifnull(current_lang, '')
	INTO v_country, v_lang
	FROM table_account ta 
	WHERE userkey = _userkey; 


	SELECT ifnull(group_concat(project_id), '')
	INTO v_project_list
	FROM list_project_master
	WHERE project_id NOT IN (SELECT DISTINCT project_id FROM user_episode_hist WHERE userkey = _userkey)
	AND project_id <> v_last_played_project
	AND (locate(v_lang, exception_lang) IS NULL OR locate(v_lang, exception_lang) < 1)
  	AND (locate(v_country, exception_country) IS NULL OR locate(v_country, exception_country) < 1)
	AND is_public > 0;
	
	
    RETURN v_project_list;
	
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP FUNCTION IF EXISTS `fn_get_not_play_project_ver2` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`remote`@`%` FUNCTION `fn_get_not_play_project_ver2`(
_userkey bigint
) RETURNS varchar(1000) CHARSET utf8mb4
BEGIN
	
	
	DECLARE v_project_list varchar(1000) DEFAULT '';
	DECLARE v_last_played_project int DEFAULT -1; 
	DECLARE v_country varchar(2) DEFAULT '';

	
	SELECT project_id 
	INTO v_last_played_project
	FROM user_project_current upc 
	WHERE userkey = _userkey
	AND update_date = fn_get_max_project_current_time(_userkey); 

	
	SELECT ifnull(country, '')
	INTO v_country
	FROM table_account ta 
	WHERE userkey = _userkey; 


	SELECT ifnull(group_concat(project_id), '')
	INTO v_project_list
	FROM list_project_master
	WHERE project_id NOT IN (SELECT DISTINCT project_id FROM user_episode_hist WHERE userkey = _userkey)
	AND project_id <> v_last_played_project
	AND (exception_country IS NULL OR exception_country = '') 
	AND is_public > 0;
	
	
    RETURN v_project_list;
	
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP FUNCTION IF EXISTS `fn_get_origin_pass_price` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`remote`@`%` FUNCTION `fn_get_origin_pass_price`(
_project_id INT
) RETURNS int
BEGIN

	
	
	DECLARE v_choice_price INT DEFAULT 0;
	DECLARE v_episode_price INT DEFAULT 0;
	DECLARE v_total_price INT DEFAULT 0;
	DECLARE v_chapter_price INT DEFAULT 0; 
	

SELECT lpm.premium_price 
  INTO v_total_price
  FROM list_project_master lpm 
 WHERE lpm.project_id = _project_id;


IF v_total_price > 0 THEN
	RETURN v_total_price;
END IF;

	

SELECT ifnull(sum(replace(a.control, '스타=', '')), 0) total_price
  INTO v_choice_price 
  FROM list_script a
     , list_episode le
 WHERE le.project_id = _project_id
   AND a.project_id = le.project_id 
   AND a.episode_id = le.episode_id 
   AND le.episode_type = 'chapter'
   AND a.template = 'selection'
   AND a.lang = 'KO'
   AND a.control <> ''
   AND a.control IS NOT NULL
   AND a.control LIKE '스타=%'
;


SELECT SUM(CASE WHEN a.ending_type = 'hidden' THEN 4
            WHEN a.ending_type = 'final' THEN 8
            ELSE 0 END) total_price 
  INTO v_episode_price 
  FROM list_episode a
 WHERE a.project_id = _project_id 
   AND a.episode_type = 'ending';
  
  
 SELECT sum(4)
   INTO v_chapter_price
   FROM list_episode le 
  WHERE le.project_id = _project_id
    AND le.episode_type  = 'chapter';  
  
  
SET v_total_price = v_choice_price + v_episode_price + v_chapter_price;


IF v_total_price < 500 THEN
 SET v_total_price = v_total_price + 40; 
END IF;

  
IF v_total_price > 1000 THEN
	RETURN 1000;
END IF;

RETURN v_total_price;
	
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP FUNCTION IF EXISTS `fn_get_origin_pass_price_no_return` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`remote`@`%` FUNCTION `fn_get_origin_pass_price_no_return`(
_project_id INT
) RETURNS int
BEGIN

	
	
	DECLARE v_choice_price INT DEFAULT 0;
	DECLARE v_episode_price INT DEFAULT 0;
	DECLARE v_total_price INT DEFAULT 0;
	DECLARE v_chapter_price INT DEFAULT 0; 
	

	

SELECT ifnull(sum(replace(a.control, '스타=', '')), 0) total_price
  INTO v_choice_price 
  FROM list_script a
     , list_episode le
 WHERE le.project_id = _project_id
   AND a.project_id = le.project_id 
   AND a.episode_id = le.episode_id 
   AND le.episode_type = 'chapter'
   AND a.template = 'selection'
   AND a.lang = 'KO'
   AND a.control <> ''
   AND a.control IS NOT NULL
   AND a.control LIKE '스타=%'
;


SELECT SUM(CASE WHEN a.ending_type = 'hidden' THEN 4
            WHEN a.ending_type = 'final' THEN 8
            ELSE 0 END) total_price 
  INTO v_episode_price 
  FROM list_episode a
 WHERE a.project_id = _project_id 
   AND a.episode_type = 'ending';
  
  
 SELECT sum(4)
   INTO v_chapter_price
   FROM list_episode le 
  WHERE le.project_id = _project_id
    AND le.episode_type  = 'chapter';  
  
  
SET v_total_price = v_choice_price + v_episode_price + v_chapter_price;


IF v_total_price < 500 THEN
 SET v_total_price = v_total_price + 80; 
END IF;

  
IF v_total_price > 1000 THEN
	RETURN 1000;
END IF;

RETURN v_total_price;
	
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP FUNCTION IF EXISTS `fn_get_product_detail_info` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`remote`@`%` FUNCTION `fn_get_product_detail_info`(
_product_master_id INT
) RETURNS varchar(160) CHARSET utf8mb4
BEGIN
	
	
	DECLARE v_return VARCHAR(160) DEFAULT '';
	DECLARE done INT DEFAULT FALSE;

	
	DECLARE v_currency varchar(20) DEFAULT '';
	DECLARE v_currency_name varchar(30) DEFAULT ''; 
	DECLARE v_quantity int DEFAULT 0; 
	DECLARE v_is_main int DEFAULT 0; 
	DECLARE v_first_purchase TINYINT DEFAULT 0;	
	
	
	DECLARE cursor1 CURSOR FOR 
	SELECT currency, is_main, quantity, first_purchase 
	FROM com_product_detail 
	WHERE master_id = _product_master_id;
	
	DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;
	
	OPEN cursor1;

	looping : LOOP
			
		FETCH cursor1 INTO v_currency, v_is_main, v_quantity, v_first_purchase; 
		
		IF done THEN 
			LEAVE looping;
		END IF;
		
		SET v_currency_name = fn_get_currency_info(v_currency, 'name'); 
		
		
		IF v_is_main = 1 THEN 
			SET v_return = '메인 ';
		END IF; 
		
		
		IF v_first_purchase = 1 THEN 
			SET v_return = '첫구매 ';
		END IF; 
	
		SET v_return = concat(v_return, v_currency_name, '(', v_quantity, '), ');

	END LOOP;

	CLOSE cursor1;

	SET v_return = mid(v_return, 1, char_length(v_return)-2); 

	RETURN v_return;
	
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP FUNCTION IF EXISTS `fn_get_product_master_id` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`remote`@`%` FUNCTION `fn_get_product_master_id`(
_product_id VARCHAR(20),
_purchase_date DATETIME
) RETURNS int
BEGIN
	
	DECLARE v_master_id int DEFAULT 0;
	
	
	SELECT ifnull((SELECT a.product_master_id 
				     FROM com_product_master a
				    WHERE a.product_id = _product_id
					  AND _purchase_date BETWEEN a.from_date AND a.to_date
				    LIMIT 1), 0)
	  INTO v_master_id
	  FROM DUAL;
	 
	 
	 RETURN v_master_id;
	
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP FUNCTION IF EXISTS `fn_get_project_clear_count` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`remote`@`%` FUNCTION `fn_get_project_clear_count`(
_project_id int
) RETURNS int
BEGIN

	
	DECLARE v_total INT DEFAULT 0;
	
	SELECT count(*)
	INTO v_total
	FROM list_episode b
	WHERE project_id = _project_id
	AND episode_type IN ('side', 'ending');

	  
	
	RETURN v_total;
			
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP FUNCTION IF EXISTS `fn_get_project_cnt` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`remote`@`%` FUNCTION `fn_get_project_cnt`(
_project_id int,
_start_date datetime,
_end_date datetime,
_col VARCHAR(20)
) RETURNS int
BEGIN
	
	DECLARE v_return int DEFAULT 0;

	IF _col = 'project_enter' THEN 
	
	 SELECT ifnull(count(*), 0) 
	 INTO v_return
	 FROM gamelog.log_action la 
	 WHERE action_type = 'project_enter' 
	 AND JSON_EXTRACT(log_data, '$.project_id') = CAST(_project_id AS CHAR(10))
	 AND action_date BETWEEN _start_date AND _end_date;

	ELSEIF _col = 'project_like' THEN 
	
	 SELECT ifnull(count(*), 0) 
	 INTO v_return
     FROM user_project_like
     WHERE project_id = _project_id
     AND create_date BETWEEN _start_date AND _end_date;

 	ELSEIF _col = 'ad_view' THEN  
	 
 	 SELECT ifnull(count(*), 0) 
	 INTO v_return
     FROM gamelog.log_ad
     WHERE project_id = _project_id 
     AND action_date BETWEEN _start_date AND _end_date;
 	
	END IF;
	
	RETURN v_return;
	
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP FUNCTION IF EXISTS `fn_get_project_freepass` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`remote`@`%` FUNCTION `fn_get_project_freepass`(
_project_id INT
) RETURNS varchar(20) CHARSET utf8mb4
BEGIN
	
DECLARE v_code VARCHAR(20) DEFAULT ''; 
	
SELECT cc.currency 
  INTO v_code
  FROM com_currency cc
  WHERE cc.currency_type  = 'nonconsumable'
   AND cc.connected_project = _project_id;
 
RETURN v_code;
  
 
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP FUNCTION IF EXISTS `fn_get_project_gallery_count` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`remote`@`%` FUNCTION `fn_get_project_gallery_count`(
_project_id INT
) RETURNS int
BEGIN
	
DECLARE v_total INT DEFAULT 0;
DECLARE v_cnt INT DEFAULT 0;
	
	

SELECT count(*) cnt
 INTO v_cnt
 FROM list_sound ls
     , list_episode le
     , list_script script      
WHERE ls.sound_type = 'voice'
  AND ls.project_id = _project_id
  AND ls.is_public = 1
   AND le.project_id = ls.project_id 
   AND script.project_id = le.project_id 
   AND le.episode_id = script.episode_id 
   AND le.title  NOT LIKE '%테스트%'
   AND (script.voice <> '' AND script.voice IS NOT NULL)
   AND script.voice = ls.sound_name;  
 
SET v_total = v_total + v_cnt;
 

SELECT count(*) cnt
  INTO v_cnt
  FROM list_live_object llo 
 WHERE llo.project_id = _project_id
   AND llo.is_public = 1
   AND llo.appear_episode > 0;
  
SET v_total = v_total + v_cnt;


SELECT count(*) cnt
  INTO v_cnt
  FROM list_minicut lm  
 WHERE lm.project_id = _project_id
   AND lm.is_public = 1
   AND lm.appear_episode > 0;
  
SET v_total = v_total + v_cnt;
  

 SELECT count(*) cnt
   INTO v_cnt
   FROM list_illust li
  WHERE li.project_id = _project_id
    AND li.is_public = 1
    AND li.appear_episode > 0;
 
SET v_total = v_total + v_cnt;
  
 SELECT count(*) cnt
   INTO v_cnt
   FROM list_live_illust li
  WHERE li.project_id = _project_id
    AND li.is_public = 1
    AND li.appear_episode > 0;
 
 
SET v_total = v_total + v_cnt;


RETURN v_total;
	
	
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP FUNCTION IF EXISTS `fn_get_project_genre` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`remote`@`%` FUNCTION `fn_get_project_genre`(
_project_id int
) RETURNS varchar(40) CHARSET utf8mb4
BEGIN
	
	
	DECLARE v_genre varchar(40) DEFAULT ''; 

	SELECT lpg.genre_code 
	INTO v_genre
	FROM list_project_genre lpg 
	WHERE project_id = _project_id; 

    RETURN v_genre;
	
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP FUNCTION IF EXISTS `fn_get_project_hashtags` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`remote`@`%` FUNCTION `fn_get_project_hashtags`(
_project_id INT,
_lang VARCHAR(10)
) RETURNS varchar(120) CHARSET utf8mb4
BEGIN
	
DECLARE v_tag VARCHAR(120) DEFAULT '';
	
SELECT group_concat(fn_get_localize_text(ch.lang_code, _lang)) hashtag
 INTO v_tag
 FROM list_project_hashtag lph 
    , com_hashtag ch 
WHERE lph.project_id = _project_id
  AND ch.hashtag_no = lph.hashtag_no ;	
 
 
RETURN v_tag; 
 
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP FUNCTION IF EXISTS `fn_get_project_name` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`remote`@`%` FUNCTION `fn_get_project_name`(
_project_id int
) RETURNS varchar(60) CHARSET utf8mb4
BEGIN
	DECLARE v_title varchar(60) DEFAULT '';

	IF _project_id < 0 THEN
		RETURN '전체';
	END IF;
	
	SELECT a.title
	  INTO v_title
	  FROM list_project_master a
	 WHERE a.project_id = _project_id;
	   
	RETURN v_title;
	
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP FUNCTION IF EXISTS `fn_get_project_name_new` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`remote`@`%` FUNCTION `fn_get_project_name_new`(
_project_id int,
_lang varchar(2)
) RETURNS varchar(60) CHARSET utf8mb4
BEGIN
	
	DECLARE v_title varchar(60) DEFAULT '';

	IF _project_id < 0 THEN
		RETURN '';
	END IF;
	
	SELECT a.title
	INTO v_title
	FROM list_project_detail a
	WHERE a.project_id = _project_id
	AND a.lang = _lang;
	   
	RETURN v_title;
	
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP FUNCTION IF EXISTS `fn_get_project_onetime` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`remote`@`%` FUNCTION `fn_get_project_onetime`(
_project_id INT
) RETURNS varchar(20) CHARSET utf8mb4
BEGIN
	
DECLARE v_code VARCHAR(20) DEFAULT '';
	
SELECT cc.currency 
  INTO v_code
  FROM com_currency cc
  WHERE cc.currency_type  = 'consumable'
   AND cc.connected_project = _project_id;
 
RETURN v_code;	
	
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP FUNCTION IF EXISTS `fn_get_project_ticket` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`remote`@`%` FUNCTION `fn_get_project_ticket`(
_project_id INT
) RETURNS varchar(20) CHARSET utf8mb4
BEGIN

DECLARE v_code VARCHAR(20) DEFAULT 'xxx';
	
SELECT cc.currency 
  INTO v_code
  FROM com_currency cc
  WHERE cc.currency_type  = 'ticket'
   AND cc.connected_project = _project_id;
 
RETURN v_code;
  
 
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP FUNCTION IF EXISTS `fn_get_recommend_project_case` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`remote`@`%` FUNCTION `fn_get_recommend_project_case`(
_genre varchar(40), 
_hashtag_list varchar(1000),
_not_play_project_list varchar(1000)
) RETURNS int
BEGIN
	
	
	DECLARE v_check int DEFAULT 0;
	DECLARE v_case_value int DEFAULT 0; 

	
	SELECT ifnull(count(DISTINCT lpm.project_id), 0)
	INTO v_check
	FROM list_project_master lpm, list_project_genre lpg, list_project_hashtag lph  
	WHERE lpm.project_id = lpg.project_id  
	AND lpm.project_id = lph.project_id 
	AND lpm.project_id > 0 
	AND lph.hashtag_no > 0
	AND lpg.genre_code = _genre
	AND find_in_set(lpm.project_id, _not_play_project_list)
	AND find_in_set(lph.hashtag_no, _hashtag_list);
	
	IF v_check > 2 THEN 
		SET v_case_value = 1;
	END IF;

	
	IF v_check < 3 THEN 
	
		SELECT ifnull(count(DISTINCT project_id), 0)
		INTO v_check
		FROM list_project_genre lpg 
		WHERE lpg.project_id > 0
		AND lpg.genre_code = _genre
	    AND find_in_set(lpg.project_id, _not_play_project_list);
	
		IF v_check > 2 THEN 
			SET v_case_value = 2;
		END IF;		
	
	END IF;

	
	IF v_check < 3 THEN 
	
		SELECT ifnull(count(DISTINCT project_id), 0)
		INTO v_check
		FROM list_project_hashtag lpm 
		WHERE project_id > 0 
		AND hashtag_no  > 0
		AND find_in_set(hashtag_no, _hashtag_list)
	    AND find_in_set(project_id, _not_play_project_list);
		
		IF v_check > 2 THEN 
			SET v_case_value = 3;
		END IF;	
	
	END IF;

	RETURN v_case_value;
	
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP FUNCTION IF EXISTS `fn_get_script_data` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`remote`@`%` FUNCTION `fn_get_script_data`(
_episode_id INT,
_selection_group INT,
_selection_no INT,
_lang varchar(2)
) RETURNS varchar(240) CHARSET utf8mb4
BEGIN
	
	
	DECLARE v_script_no bigint;
	DECLARE v_script_data varchar(240) DEFAULT '';

	
	SELECT script_no 
	INTO v_script_no
	FROM list_script 
	WHERE episode_id = _episode_id
	AND selection_group = _selection_group
	AND selection_no  = _selection_no
	AND lang = _lang;
	
	
	SELECT max(script_no)
	INTO v_script_no
	FROM list_script
	WHERE episode_id = _episode_id
	AND script_no < v_script_no
	AND lang = _lang
	AND template IN (SELECT code FROM list_standard ls WHERE standard_class = 'selection_before');

	SELECT script_data 
	INTO v_script_data
	FROM list_script ls
	WHERE script_no = v_script_no;
	
	 
	RETURN v_script_data;	
	
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP FUNCTION IF EXISTS `fn_get_sound_info` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`remote`@`%` FUNCTION `fn_get_sound_info`(
_sound_id INT,
_col VARCHAR(20)
) RETURNS varchar(160) CHARSET utf8mb4
BEGIN
	
	
	DECLARE v_return VARCHAR(160) DEFAULT '';

	IF _sound_id < 0 THEN
		RETURN v_return;
	END IF;
	
	IF _col = 'url' THEN 

		SELECT ls.sound_url 
		INTO v_return 
		FROM list_sound ls 
		WHERE sound_id = _sound_id
		AND sound_type = 'se';
	
	ELSEIF _col = 'key' THEN
	
		SELECT ls.sound_key 
		INTO v_return 
		FROM list_sound ls 
		WHERE sound_id = _sound_id
		AND sound_type = 'se';
	
	ELSEIF _col = 'name' THEN 
	
		SELECT ls.sound_name  
		INTO v_return 
		FROM list_sound ls 
		WHERE sound_id = _sound_id
		AND sound_type = 'se';
	
	END IF;
	
	
	RETURN v_return;
	
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP FUNCTION IF EXISTS `fn_get_speaker` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`remote`@`%` FUNCTION `fn_get_speaker`(
_project_id int,
_currency varchar(20), 
_lang varchar(2),
_col VARCHAR(20)
) RETURNS varchar(20) CHARSET utf8mb4
BEGIN

	DECLARE v_name varchar(20) DEFAULT NULL;

	IF _col = 'code' THEN 
		SELECT DISTINCT speaker 
		INTO v_name
		FROM com_ability a, com_currency_ability b
		WHERE a.ability_id = b.ability_id 
		AND b.currency = _currency
		AND a.project_id = _project_id;
	ELSE 
		IF _lang = 'KO' THEN 
		
			SELECT DISTINCT KO 
			INTO v_name 
			FROM com_ability a, com_currency_ability b, list_nametag c 
			WHERE a.ability_id = b.ability_id 
			AND a.speaker = c.speaker AND a.project_id = c.project_id 
			AND b.currency = _currency 
			AND a.project_id = _project_id; 
		
		ELSEIF _lang = 'EN' THEN 
		
			SELECT DISTINCT EN 
			INTO v_name 
			FROM com_ability a, com_currency_ability b, list_nametag c 
			WHERE a.ability_id = b.ability_id 
			AND a.speaker = c.speaker AND a.project_id = c.project_id
			AND b.currency = _currency 
			AND a.project_id = _project_id; 
		
		ELSEIF _lang = 'JA' THEN 
		
			SELECT DISTINCT JA 
			INTO v_name 
			FROM com_ability a, com_currency_ability b, list_nametag c 
			WHERE a.ability_id = b.ability_id 
			AND a.speaker = c.speaker AND a.project_id = c.project_id
			AND b.currency = _currency 
			AND a.project_id = _project_id;
		
		ELSEIF _lang = 'ZH' THEN 
		
			SELECT DISTINCT ZH 
			INTO v_name 
			FROM com_ability a, com_currency_ability b, list_nametag c 
			WHERE a.ability_id = b.ability_id 
			AND a.speaker = c.speaker AND a.project_id = c.project_id
			AND b.currency = _currency 
			AND a.project_id = _project_id; 	
		
		ELSEIF _lang = 'SC' THEN 
		
			SELECT DISTINCT SC 
			INTO v_name 
			FROM com_ability a, com_currency_ability b, list_nametag c 
			WHERE a.ability_id = b.ability_id 
			AND a.speaker = c.speaker AND a.project_id = c.project_id
			AND b.currency = _currency 
			AND a.project_id = _project_id; 
		ELSEIF _lang = 'AR' THEN 
		
			SELECT DISTINCT AR
			INTO v_name 
			FROM com_ability a, com_currency_ability b, list_nametag c 
			WHERE a.ability_id = b.ability_id 
			AND a.speaker = c.speaker AND a.project_id = c.project_id
			AND b.currency = _currency 
			AND a.project_id = _project_id; 		
		END IF;
	
	END IF; 
	
	RETURN v_name;

END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP FUNCTION IF EXISTS `fn_get_standard_code` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`remote`@`%` FUNCTION `fn_get_standard_code`(
	_class varchar(20),
    _code_name varchar(30)
) RETURNS varchar(20) CHARSET utf8mb4
BEGIN

	DECLARE v_code varchar(20);

	SELECT a.code
    INTO v_code 
    FROM list_standard a
	WHERE a.standard_class = _class
    AND a.standard_id > 0
	AND a.code_name = REPLACE(_code_name, ' ', '');


RETURN v_code;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP FUNCTION IF EXISTS `fn_get_standard_comment` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`remote`@`%` FUNCTION `fn_get_standard_comment`(
	_class varchar(20),
    _code varchar(20), 
    _project_id int 
) RETURNS varchar(150) CHARSET utf8mb4
BEGIN

	DECLARE v_comment varchar(150);
	DECLARE v_project_name varchar(30) DEFAULT ''; 

	SELECT a.comment
      INTO v_comment 
      FROM list_standard a
	 WHERE a.standard_class = _class
       AND a.code = _code;
      
    IF _code = 'Permanent' OR _code = 'Onetime' OR _code = 'freepass' THEN 
    	
    	SELECT title 
    	INTO v_project_name
    	FROM list_project_master
    	WHERE project_id = _project_id;
    
    	IF CHAR_LENGTH(v_project_name) > 0 THEN 
    		SET v_comment = concat(v_project_name, ' ', v_comment);
    	END IF; 
    END IF; 


RETURN v_comment;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP FUNCTION IF EXISTS `fn_get_standard_name` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`remote`@`%` FUNCTION `fn_get_standard_name`(
	_class varchar(20),
    _code varchar(20)
) RETURNS varchar(30) CHARSET utf8mb4
BEGIN

	DECLARE v_name varchar(30);

	SELECT a.code_name
      INTO v_name 
      FROM list_standard a
	 WHERE a.standard_class = _class
       AND a.code = _code;


RETURN v_name;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP FUNCTION IF EXISTS `fn_get_standard_text_id` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`remote`@`%` FUNCTION `fn_get_standard_text_id`(
_class varchar(20),
_code varchar(30)
) RETURNS int
BEGIN
	DECLARE v_id int;

	SELECT a.text_id
      INTO v_id 
      FROM list_standard a
	 WHERE a.standard_class = _class
       AND a.code = _code;


RETURN v_id;	
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP FUNCTION IF EXISTS `fn_get_story_ability` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`remote`@`%` FUNCTION `fn_get_story_ability`(
_project_id int,
_ability_id int,
_userkey bigint
) RETURNS int
BEGIN

	DECLARE v_value int DEFAULT 0;

	SELECT ifnull(sum(add_value), 0)
	INTO v_value
	FROM user_story_ability usa 
	WHERE userkey = _userkey 
	AND project_id = _project_id
	AND ability_id = _ability_id; 


RETURN v_value;

END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP FUNCTION IF EXISTS `fn_get_survey_localize_text` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`remote`@`%` FUNCTION `fn_get_survey_localize_text`(
text_id INT,
lang VARCHAR(10)
) RETURNS varchar(200) CHARSET utf8mb4
BEGIN
	
	DECLARE v_text VARCHAR(200) DEFAULT NULL;

	IF lang = 'KO' THEN
		SELECT csl.KO 
		  INTO v_text
		  FROM com_survey_localize csl
		WHERE csl.id = text_id;
	
	ELSEIF lang = 'EN' THEN
		SELECT csl.EN 
		  INTO v_text
		  FROM com_survey_localize csl
		WHERE csl.id = text_id;

	ELSEIF lang = 'JA' THEN
		SELECT csl.JA
		  INTO v_text
		  FROM com_survey_localize csl
		WHERE csl.id = text_id;	

	ELSEIF lang = 'ZH' THEN
		SELECT csl.ZH 
		  INTO v_text
		  FROM com_survey_localize csl
		WHERE csl.id = text_id;	
	
	ELSEIF lang = 'SC' THEN
		SELECT csl.SC 
		  INTO v_text
		  FROM com_survey_localize csl
		WHERE csl.id = text_id;		
	ELSEIF lang = 'AR' THEN
		SELECT csl.AR 
		  INTO v_text
		  FROM com_survey_localize csl
		WHERE csl.id = text_id;			
	
	ELSE 

		SELECT csl.EN 
		  INTO v_text
		  FROM com_survey_localize csl
		WHERE csl.id = text_id;
	
	
	END IF;


RETURN v_text;
	
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP FUNCTION IF EXISTS `fn_get_unlock_list` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`remote`@`%` FUNCTION `fn_get_unlock_list`(
_userkey bigint, 
_project_id int, 
_episode_id int, 
_lang varchar(2),
_unlock_style varchar(30)
) RETURNS varchar(500) CHARSET utf8mb4
BEGIN
	
	

	DECLARE v_value varchar(500) DEFAULT '';
	DECLARE v_unlocks varchar(200) DEFAULT '';

	IF _unlock_style = 'episode' THEN 
	
		
		SELECT unlock_episodes 
		INTO v_unlocks
		FROM list_episode le 
		WHERE le.episode_id = _episode_id;
	
		SELECT ifnull(group_concat(le.episode_id), '') 
		INTO v_value 
		FROM list_episode le 
		WHERE find_in_set(episode_id, v_unlocks) 
		ORDER BY sortkey, episode_id; 
	
	ELSE  

		
		SELECT unlock_scenes
		INTO v_unlocks
		FROM list_episode le 
		WHERE le.episode_id = _episode_id;

		SELECT ifnull(group_concat(episode_id, ':', played, ':', total), '') 
		INTO v_value 
		FROM (
			SELECT
			b.episode_id
			, (SELECT ifnull(count(*), 0) FROM user_scene_hist ush WHERE userkey = _userkey AND project_id = a.project_id AND episode_id = a.episode_id AND find_in_set(scene_id, v_unlocks)) played
			, ifnull(count(*), 0) total
			FROM list_episode a, list_script b 
			WHERE a.episode_id = b.episode_id
			AND a.project_id = _project_id
			AND find_in_set(b.scene_id, v_unlocks) 
			AND b.lang = _lang
			GROUP BY a.episode_id 
			ORDER BY a.sortkey, a.episode_id
		) T;	
	

	END IF;


	RETURN v_value;

END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP FUNCTION IF EXISTS `fn_get_unlock_mission` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`remote`@`%` FUNCTION `fn_get_unlock_mission`(
_userkey bigint, 
_lang varchar(2),
_project_id int,
_mission_id int, 
_mission_type varchar(20)
) RETURNS varchar(500) CHARSET utf8mb4
BEGIN
	
	

	DECLARE v_value varchar(500) DEFAULT '';
	DECLARE v_unlocks varchar(2000) DEFAULT '';

	IF _mission_type = 'episode' THEN 
	
		
		SELECT lm.id_condition  
		INTO v_unlocks
		FROM list_mission lm 
		WHERE lm.mission_id = _mission_id;
	
		SELECT ifnull(group_concat(le.episode_id), '') 
		INTO v_value 
		FROM list_episode le 
		WHERE find_in_set(episode_id, v_unlocks) 
		ORDER BY sortkey, episode_id; 
	
	ELSE  

		
		SELECT lm.id_condition  
		INTO v_unlocks
		FROM list_mission lm 
		WHERE lm.mission_id = _mission_id;

		SELECT ifnull(group_concat(episode_id, ':', played, ':', total), '') 
		INTO v_value 
		FROM (
			SELECT
			b.episode_id
			, (SELECT ifnull(count(*), 0) FROM user_scene_hist ush WHERE userkey = _userkey AND project_id = a.project_id AND episode_id = a.episode_id AND find_in_set(scene_id, v_unlocks)) played
			, ifnull(count(*), 0) total
			FROM list_episode a, list_script b 
			WHERE a.episode_id = b.episode_id
			AND a.project_id = _project_id
			AND find_in_set(b.scene_id, v_unlocks) 
			AND b.lang = _lang
			GROUP BY a.episode_id 
			ORDER BY a.sortkey, a.episode_id
		) T;	
	

	END IF;


	RETURN v_value;

END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP FUNCTION IF EXISTS `fn_get_userkey_info` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`remote`@`%` FUNCTION `fn_get_userkey_info`(
_userkey bigint 
) RETURNS varchar(20) CHARSET utf8mb4
BEGIN
	
	
	DECLARE v_return varchar(20) DEFAULT '';
	DECLARE v_pincode varchar(4) DEFAULT '';
	
	SELECT pincode 
	INTO v_pincode
	FROM table_account 
	WHERE userkey = _userkey; 
	
	IF v_pincode <> '' THEN 
		SET v_return = CONCAT('#', v_pincode, '-', _userkey);  	
	END IF; 

	RETURN v_return;
	
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP FUNCTION IF EXISTS `fn_get_user_achievement_current_info` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`remote`@`%` FUNCTION `fn_get_user_achievement_current_info`(
_userkey BIGINT,
_id INT,
_col VARCHAR(20)
) RETURNS int
BEGIN
	
	
DECLARE v_info INT DEFAULT 0;

IF _col = 'current' THEN   
SELECT ua.current_result
   INTO v_info
   FROM user_achievement ua 
  WHERE ua.userkey = _userkey
    AND ua.achievement_id = _id
    AND ua.achievement_level = (SELECT max(z.achievement_level) FROM user_achievement z WHERE z.userkey = ua.userkey AND z.achievement_id = ua.achievement_id);
   
ELSE                      
SELECT ua.is_clear 
   INTO v_info
   FROM user_achievement ua 
  WHERE ua.userkey = _userkey
    AND ua.achievement_id = _id
    AND ua.achievement_level = (SELECT max(z.achievement_level) FROM user_achievement z WHERE z.userkey = ua.userkey AND z.achievement_id = ua.achievement_id);   
   
END IF;
	
	
  RETURN ifnull(v_info, 0);
   
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP FUNCTION IF EXISTS `fn_get_user_achievement_max_level` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`remote`@`%` FUNCTION `fn_get_user_achievement_max_level`(
_userkey BIGINT,
_id INT
) RETURNS int
BEGIN
	
	
	
	DECLARE v_level int DEFAULT 0;
	
	SELECT max(ua.achievement_level)
	  INTO v_level
	  FROM user_achievement ua
	 WHERE ua.userkey = _userkey
	   AND ua.achievement_id = _id;
	  
RETURN  ifnull(v_level, 1);
	
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP FUNCTION IF EXISTS `fn_get_user_achievement_max_no` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`remote`@`%` FUNCTION `fn_get_user_achievement_max_no`(
_userkey BIGINT,
_id INT
) RETURNS bigint
BEGIN
	
	

	DECLARE v_number BIGINT DEFAULT 0;
	
	SELECT max(ua.achievement_no)
	  INTO v_number
	  FROM user_achievement ua
	 WHERE ua.userkey = _userkey
	   AND ua.achievement_id = _id;
	  
RETURN  ifnull(v_number, 0);

END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP FUNCTION IF EXISTS `fn_get_user_clear_count` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`remote`@`%` FUNCTION `fn_get_user_clear_count`(
_userkey bigint,
_project_id int
) RETURNS int
BEGIN

	
		
	DECLARE v_total INT DEFAULT 0;
	
	SELECT count(*)
	INTO v_total
	FROM user_ending a, list_episode b
	WHERE a.episode_id = b.episode_id 
	AND a.userkey = _userkey
	AND b.project_id = _project_id
	AND episode_type IN ('side', 'ending');

	  
	
	RETURN v_total;
			
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP FUNCTION IF EXISTS `fn_get_user_coin_exchange` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`remote`@`%` FUNCTION `fn_get_user_coin_exchange`(
_userkey BIGINT,
_exchange_product_id int 
) RETURNS int
BEGIN
	
	
	DECLARE v_total INT DEFAULT 0;

	SELECT IFNULL(count(*), 0) cnt
	INTO v_total
	FROM user_coin_exchange a
	WHERE a.exchange_no > 0
	AND a.userkey = _userkey
	AND a.exchange_product_id  = _exchange_product_id
	AND date(exchange_date) = date(now()); 
   
    RETURN v_total;

END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP FUNCTION IF EXISTS `fn_get_user_gallery_count` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`remote`@`%` FUNCTION `fn_get_user_gallery_count`(
_userkey bigint,
_project_id int
) RETURNS int
BEGIN


	
DECLARE v_total INT DEFAULT 0;
DECLARE v_cnt INT DEFAULT 0;



SELECT count(*) cnt
  INTO v_cnt
  FROM user_voice uv
     , list_sound ls
     , list_episode le
     , list_script script     
 WHERE uv.userkey = _userkey
   AND ls.sound_id = uv.sound_id 
   AND ls.project_id = _project_id
   AND ls.sound_type = 'voice'
   AND ls.is_public = 1
   AND le.project_id = ls.project_id 
   AND script.project_id = le.project_id 
   AND le.episode_id = script.episode_id 
   AND le.title  NOT LIKE '%테스트%'
   AND (script.voice <> '' AND script.voice IS NOT NULL)
   AND script.voice = ls.sound_name;
  
SET v_total = v_total + v_cnt;    


SELECT count(a.illust_id) cnt
  INTO v_cnt
  FROM user_illust a
     , list_illust li 
 WHERE a.userkey = _userkey
   AND a.illust_type = 'illust'
   AND li.project_id = _project_id
   AND li.illust_id = a.illust_id
   AND li.is_public = 1
   AND li.appear_episode > 0;
  
SET v_total = v_total + v_cnt;  


SELECT count(a.illust_id) cnt
  INTO v_cnt
  FROM user_illust a
     , list_live_illust li 
 WHERE a.userkey = _userkey
   AND a.illust_type = 'live2d'
   AND li.project_id = _project_id
   AND li.live_illust_id = a.illust_id
   AND li.is_public = 1
   AND li.appear_episode > 0;
  
 SET v_total = v_total + v_cnt;


SELECT count(*) cnt
  INTO v_cnt
  FROM user_minicut um
     , list_minicut lm 
 WHERE um.userkey = _userkey
   AND um.minicut_type = 'image'
   AND lm.project_id = _project_id
   AND lm.minicut_id = um.minicut_id
   AND lm.is_public = 1
   AND lm.appear_episode > 0;
  
SET v_total = v_total + v_cnt;  


SELECT count(*) cnt
 INTO v_cnt
  FROM user_minicut um
     , list_live_object lm 
 WHERE um.userkey = _userkey
   AND um.minicut_type = 'live2d'
   AND lm.project_id = _project_id
   AND lm.live_object_id = um.minicut_id
   AND lm.is_public = 1
   AND lm.appear_episode > 0; 
  
SET v_total = v_total + v_cnt;  



RETURN v_total;

	
	
	
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP FUNCTION IF EXISTS `fn_get_user_group_property` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`remote`@`%` FUNCTION `fn_get_user_group_property`(
_userkey BIGINT, 
_currency VARCHAR(20) 
) RETURNS int
BEGIN
	
	
	DECLARE v_total INT DEFAULT 0;

	SELECT IFNULL(SUM(a.current_quantity), 0) current_quantity
	  INTO v_total
	  FROM user_property a
	 WHERE a.userkey = _userkey
	   AND a.currency LIKE CONCAT('%', _currency, '%') 
	   AND NOW() < expire_date;
   
     RETURN v_total;	
	
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP FUNCTION IF EXISTS `fn_get_user_item_property` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`remote`@`%` FUNCTION `fn_get_user_item_property`(
_userkey BIGINT
) RETURNS int
BEGIN
	
	
	
	DECLARE v_total INT DEFAULT 0;

	SELECT IFNULL(SUM(a.current_quantity), 0) current_quantity
	  INTO v_total
	  FROM user_property a
	 WHERE a.userkey = _userkey
	   AND a.currency IN (SELECT currency FROM com_currency cc WHERE is_coin = 1)
	   AND NOW() < expire_date;
   
     RETURN v_total;	
	
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP FUNCTION IF EXISTS `fn_get_user_project_notification` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`remote`@`%` FUNCTION `fn_get_user_project_notification`(
_userkey BIGINT,
_project_id INT
) RETURNS int
BEGIN

DECLARE v_notify TINYINT DEFAULT 0;












	
SELECT upn.is_notify 
  INTO v_notify
  FROM user_project_notification upn 
 WHERE upn.userkey = _userkey
   AND upn.project_id = _project_id;	
  

 RETURN ifnull(v_notify, 0);
	
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP FUNCTION IF EXISTS `fn_get_user_project_reset_count` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`remote`@`%` FUNCTION `fn_get_user_project_reset_count`(
_userkey BIGINT,
_project_id INT
) RETURNS int
BEGIN
	
	DECLARE v_count NUMERIC DEFAULT 0;
	DECLARE v_exists TINYINT DEFAULT 0;

	SELECT EXISTS (SELECT z.reset_count FROM user_reset z WHERE z.userkey= _userkey AND z.project_id = _project_id)
	  INTO v_exists 
	  FROM DUAL;
	 
	IF v_exists < 1 THEN 
	
	INSERT INTO user_reset (userkey, project_id) VALUES (_userkey, _project_id);
	RETURN 0;
	
	END IF;


	SELECT a.reset_count
	  INTO v_count
	  FROM user_reset a
	 WHERE a.userkey = _userkey
	   AND a.project_id = _project_id;
	  
	RETURN v_count;
	
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP FUNCTION IF EXISTS `fn_get_user_property` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`remote`@`%` FUNCTION `fn_get_user_property`(
_userkey BIGINT, 
_currency VARCHAR(20) 
) RETURNS int
BEGIN
	
	
	DECLARE v_total INT DEFAULT 0;

	SELECT IFNULL(SUM(a.current_quantity), 0) current_quantity
	  INTO v_total
	  FROM user_property a
	 WHERE a.userkey = _userkey
	   AND a.currency = _currency
	   AND NOW() < expire_date;
   
     RETURN v_total;

END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP FUNCTION IF EXISTS `fn_get_user_property_cnt` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`remote`@`%` FUNCTION `fn_get_user_property_cnt`(
_project_id int,
_start_date datetime,
_end_date datetime,
_currency varchar(20),
_paid int,
_col VARCHAR(20)
) RETURNS int
BEGIN
	
	DECLARE v_return int DEFAULT 0;

	IF _col = 'star_play' THEN 
	
	 SELECT ifnull(sum(quantity), 0) 
	 INTO v_return
	 FROM gamelog.log_property
	 WHERE project_id = _project_id
	 AND currency = _currency
	 AND log_code = 'Permanent'
	 AND userkey NOT IN ( SELECT userkey FROM table_account WHERE createtime < '2022-02-02 00:00:00' )
	 AND action_date BETWEEN _start_date AND _end_date;

	ELSEIF _col = 'preminum_play' THEN 
	
	 SELECT ifnull(sum(quantity), 0) 
	 INTO v_return
	 FROM gamelog.log_property
	 WHERE project_id = _project_id
	 AND currency = _currency
	 AND log_code = 'freepass'
	 AND userkey NOT IN ( SELECT userkey FROM table_account WHERE createtime < '2022-02-02 00:00:00' )
	 AND action_date BETWEEN _start_date AND _end_date;
	
	ELSEIF _col = 'reset' THEN 
	
	 SELECT ifnull(sum(quantity), 0)
	 INTO v_return
	 FROM gamelog.log_property
	 WHERE project_id = _project_id
	 AND log_code ='reset_purchase'
	 AND userkey NOT IN ( SELECT userkey FROM table_account WHERE createtime < '2022-02-02 00:00:00' )
	 AND action_date BETWEEN _start_date AND _end_date;	

 	ELSEIF _col = 'star_use' OR _col = 'coin_use' THEN  
	 
 	 SELECT ifnull(sum(quantity), 0)
	 INTO v_return
	 FROM gamelog.log_property
	 WHERE project_id = _project_id
	 AND currency = _currency
	 AND paid = _paid
	 AND log_type = 'use'
	 AND userkey NOT IN ( SELECT userkey FROM table_account WHERE createtime < '2022-02-02 00:00:00' )
	 AND action_date BETWEEN _start_date AND _end_date;

	END IF;
	
	RETURN v_return;
	
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP FUNCTION IF EXISTS `fn_get_user_star_benefit_count` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`remote`@`%` FUNCTION `fn_get_user_star_benefit_count`(
_userkey BIGINT,
_grade INT
) RETURNS int
BEGIN
	
	
	
	DECLARE v_cnt INT DEFAULT 0;
	DECLARE v_start_date DATETIME;
	DECLARE v_end_date DATETIME;

	SELECT cgs.start_date, cgs.end_date 
	  INTO v_start_date, v_end_date
	  FROM com_grade_season cgs WHERE cgs.season_no = 0
	  LIMIT 1;

	
	SELECT count(*)
	  INTO v_cnt
	  FROM user_grade_benefit a
	 WHERE a.userkey = _userkey
	   AND a.grade = _grade
	   AND a.purchase_date BETWEEN v_start_date AND v_end_date;
	  
	RETURN v_cnt;
	
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP FUNCTION IF EXISTS `fn_get_user_unread_mail_count` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`remote`@`%` FUNCTION `fn_get_user_unread_mail_count`(
_userkey BIGINT
) RETURNS int
BEGIN
	
	DECLARE v_cnt int DEFAULT 0;

SELECT count(*)
  INTO v_cnt
  FROM user_mail a
 WHERE a.userkey = _userkey
   AND a.is_receive = 0
   AND a.expire_date > now();	
  

  RETURN v_cnt;
	
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP FUNCTION IF EXISTS `fn_get_win_prize_count` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`remote`@`%` FUNCTION `fn_get_win_prize_count`(
_prize_id INT,
_start_date DATETIME,
_end_date DATETIME
) RETURNS int
BEGIN

	DECLARE v_cnt INT DEFAULT 0;
	
SELECT count(*)
  INTO v_cnt
  FROM user_prize_history a
 WHERE a.prize_id = _prize_id
   AND a.is_win = 1
   AND a.action_date BETWEEN _start_date AND _end_date;
  
 RETURN v_cnt;

END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP FUNCTION IF EXISTS `fn_valid_drop_mission` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`remote`@`%` FUNCTION `fn_valid_drop_mission`(
_project_id INT,
_mission_name VARCHAR(30)
) RETURNS int
BEGIN

DECLARE v_cnt INT DEFAULT 0;
	
SELECT count(*)
  INTO v_cnt
  FROM list_script ls
     , list_episode le 
 WHERE ls.project_id = _project_id
   AND ls.template = 'mission'
   AND ls.script_data = _mission_name
   AND le.episode_id = ls.episode_id
   AND le.project_id = ls.project_id;
	
 RETURN v_cnt;




END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_change_account_gamebase` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`remote`@`%` PROCEDURE `sp_change_account_gamebase`(
IN _userkey BIGINT, 
IN _pre_gamebase_id VARCHAR(128) 
)
sp: BEGIN
	
	DECLARE _pre_userkey BIGINT DEFAULT 0;
	DECLARE _replace_userkey BIGINT DEFAULT 0;


	
	
	SELECT userkey
	  INTO _pre_userkey
	  FROM table_account 
	 WHERE gamebaseid = _pre_gamebase_id;
	
	
	IF _pre_userkey = 0 THEN
		SELECT 0 is_done
		  FROM DUAL;
		 
		LEAVE sp;
	END IF;

    SET _replace_userkey = _pre_userkey * -1;


	
	UPDATE table_account
	   SET userkey = _replace_userkey 
	 WHERE userkey = _pre_userkey;
	
	
	
	UPDATE table_account 
	   SET userkey = _pre_userkey
	 WHERE userkey = _userkey; 
	
	
	UPDATE table_account   
	   SET userkey = _userkey
     WHERE userkey = _replace_userkey;
    
    
   
   SELECT ta.*, 1 is_done
    FROM table_account ta 
   WHERE ta.userkey = _pre_userkey;
     
	
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_clean_user_project_record` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`remote`@`%` PROCEDURE `sp_clean_user_project_record`(
IN _userkey BIGINT,
IN _project_id INT
)
BEGIN
	
DELETE FROM user_project_current WHERE userkey = _userkey AND project_id = _project_id;
DELETE FROM user_episode_hist WHERE userkey = _userkey AND project_id = _project_id;
DELETE FROM user_episode_progress WHERE userkey = _userkey AND project_id = _project_id;
DELETE FROM user_episode_purchase WHERE userkey = _userkey AND project_id = _project_id;
DELETE FROM user_illust WHERE userkey = _userkey AND project_id = _project_id;
DELETE FROM user_minicut WHERE userkey = _userkey AND project_id = _project_id;
DELETE FROM user_mission WHERE userkey = _userkey AND mission_id IN (SELECT z.mission_id FROM list_mission z WHERE z.project_id = _project_id);	
DELETE FROM user_scene_hist WHERE userkey = _userkey AND project_id = _project_id;
DELETE FROM user_scene_progress WHERE userkey = _userkey AND project_id = _project_id;
DELETE FROM user_side z WHERE userkey = _userkey AND z.episode_id IN (SELECT a.episode_id FROM list_episode a WHERE a.project_id= _project_id) ;

END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_collect_stat_date` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`remote`@`%` PROCEDURE `sp_collect_stat_date`()
BEGIN
	DECLARE v_num INT DEFAULT 0;
	
	WHILE v_num < 730 DO
	
		INSERT INTO stat_date(stat_date) VALUES (date(date_add('2022-02-02', INTERVAL v_num day)));
	
		SET v_num = v_num +1;
	
	END WHILE;

	SELECT * FROM stat_date;	
	
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_get_platform_count` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`remote`@`%` PROCEDURE `sp_get_platform_count`(
OUT comAdCount INT, 
OUT comPromotionCount INT, 
OUT comPromotionDetailCount INT, 

OUT comBubbleMasterCount INT, 
OUT comBubbleGroupCount INT, 
OUT comBubbleSpriteCount INT, 

OUT comCoinExchangeCount INT,
OUT comCoinProductCount INT, 
OUT comCoinProductDetailCount INT, 
OUT comCoinProductSetCount INT, 

OUT comCouponMasterCount INT, 
OUT comCouponRewardCount INT, 
OUT comCouponSerialCount INT, 
OUT comCouponEpisodeCount INT, 

OUT comCurrencyCount INT, 
OUT comFreepassCount INT, 
OUT comLevelCount INT, 
OUT comHashtagCount INT, 
OUT comServerCount INT, 
OUT comPrizeTicketCount INT,
OUT comProhibitedCount INT, 
OUT comLocalizeCount INT, 

OUT comModelCount INT, 
OUT comModelDetailCount INT, 

OUT comNoticeCount INT, 
OUT comNoticeDetailCount INT, 
OUT mainLoadingCount INT, 

OUT productMasterCount INT, 
OUT productDetailCount INT, 
OUT productDailyCount INT, 
OUT productLangCount INT, 

OUT designCount INT, 
OUT standardCount INT

)
BEGIN
	
	SELECT count(*) INTO comAdCount FROM com_ad ca;
	SELECT count(*) INTO comPromotionCount FROM com_promotion cp ;
	SELECT count(*) INTO comPromotionDetailCount FROM com_promotion_detail cpd ;
	
	SELECT count(*) INTO comBubbleMasterCount FROM com_bubble_master cbm;
    SELECT count(*) INTO comBubbleGroupCount FROM com_bubble_group cbg ;
	SELECT count(*) INTO comBubbleSpriteCount FROM com_bubble_sprite cbs ;

	SELECT count(*) INTO comCoinExchangeCount FROM com_coin_exchange_product ccep ;
	SELECT count(*) INTO comCoinProductCount FROM com_coin_product ccp ;
	SELECT count(*) INTO comCoinProductDetailCount FROM com_coin_product_detail ccpd ;
	SELECT count(*) INTO comCoinProductSetCount FROM com_coin_product_set ccps ;

	SELECT count(*) INTO comCouponMasterCount FROM com_coupon_master ccm;
	SELECT count(*) INTO comCouponRewardCount FROM com_coupon_reward ccr ;
	SELECT count(*) INTO comCouponSerialCount FROM com_coupon_serial ccs ;
	SELECT count(*) INTO comCouponEpisodeCount FROM com_coupon_episode cce ;
	
	SELECT count(*) INTO comCurrencyCount FROM com_currency cc ;
	SELECT count(*) INTO comFreepassCount FROM com_freepass cf ;
	SELECT count(*) INTO comLevelCount FROM com_level_management clm ;
	SELECT count(*) INTO comHashtagCount FROM com_hashtag ch ;
	SELECT count(*) INTO comServerCount FROM com_server cs ;
	SELECT count(*) INTO comPrizeTicketCount FROM com_prize_ticket cpt ;
	SELECT count(*) INTO comProhibitedCount FROM com_prohibited_words cpw ;
	SELECT count(*) INTO comLocalizeCount FROM com_localize cl ;
	
	SELECT count(*) INTO comModelCount FROM com_model cm ;
	SELECT count(*) INTO comModelDetailCount FROM com_model_detail cmd ;
	
	SELECT count(*) INTO comNoticeCount FROM com_notice cn ;
	SELECT count(*) INTO comNoticeDetailCount FROM com_notice_detail cnd ;
	SELECT count(*) INTO mainLoadingCount FROM list_main_loading lml ;
	
	SELECT count(*) INTO productMasterCount FROM list_product_master lpm ;
	SELECT count(*) INTO productDetailCount FROM list_product_detail lpd ;
	SELECT count(*) INTO productDailyCount FROM list_product_daily lpd ;
	SELECT count(*) INTO productLangCount FROM list_product_lang lpl ;
	
	SELECT count(*) INTO designCount FROM list_design WHERE project_id = -1;
	SELECT count(*) INTO standardCount FROM list_standard ls ;
	
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_get_project_count` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`remote`@`%` PROCEDURE `sp_get_project_count`(
IN _project_id INT, 

OUT projectName varchar(40), 

OUT projectMasterCount INT, 
OUT projectDetailCount INT, 
OUT projectHashtagCount INT, 
OUT projectGenreCount INT, 

OUT bgcount INT, 
OUT designCount INT, 

OUT dressModelCount INT, 
OUT dressCount INT, 

OUT emoticonMasterCount INT, 
OUT emoticonSlaveCount INT, 

OUT illustCount INT, 
OUT illustLangCount INT, 

OUT liveIllustCount INT, 
OUT liveIllustDetailCount INT, 
OUT liveIllustLangCount INT, 

OUT minicutCount INT, 
OUT minicutLangCount INT, 

OUT liveObjectCount INT, 
OUT liveObjectDetailCount INT, 
OUT liveObjectLangCount INT, 

OUT modelMasterCount INT, 
OUT modelSlaveCount INT, 
OUT modelMotionCount INT, 

OUT loadingCount INT, 
OUT loadingAppearCount INT, 
OUT loadingDetailCount INT, 

OUT soundCount INT, 
OUT creditCount INT, 
OUT nametagCount INT, 

OUT missionCount INT, 
OUT missionLangCount INT, 

OUT episodeCount INT, 
OUT episodeDetailCount INT, 
OUT scriptCount INT,
OUT selectionCount INT 
)
BEGIN
	
	
	SELECT title INTO projectName FROM list_project_master WHERE project_id = _project_id;
	
	SELECT count(*) INTO projectMasterCount FROM list_project_master WHERE project_id = _project_id;
    SELECT count(*) INTO projectDetailCount FROM list_project_detail WHERE project_id = _project_id;
	SELECT count(*) INTO projectHashtagCount FROM list_project_hashtag WHERE project_id = _project_id;
	SELECT count(*) INTO projectGenreCount FROM list_project_genre WHERE project_id = _project_id;
	
	SELECT count(*) INTO bgcount FROM list_bg WHERE project_id = _project_id;
	SELECT count(*) INTO designCount FROM list_design WHERE project_id = _project_id;
	
	SELECT count(*) INTO dressModelCount FROM list_dress_model WHERE project_id = _project_id;
	SELECT count(*) INTO dressCount FROM list_dress WHERE dressmodel_id IN (SELECT dressmodel_id FROM list_dress_model WHERE project_id = _project_id);
	
	SELECT count(*) INTO emoticonMasterCount FROM list_emoticon_master WHERE project_id = _project_id;
	SELECT count(*) INTO emoticonSlaveCount FROM list_emoticon_slave WHERE project_id = _project_id;
	
	SELECT count(*) INTO illustCount FROM list_illust WHERE project_id = _project_id;
	SELECT count(*) INTO illustLangCount FROM list_illust_lang WHERE illust_id IN (SELECT illust_id FROM list_illust WHERE project_id = _project_id) AND illust_type= 'illust';
	
	SELECT count(*) INTO liveIllustCount FROM list_live_illust WHERE project_id = _project_id;
	SELECT count(*) INTO liveIllustDetailCount FROM list_live_illust_detail WHERE live_illust_id IN (SELECT live_illust_id FROM list_live_illust WHERE project_id = _project_id);
	SELECT count(*) INTO liveIllustLangCount FROM list_illust_lang WHERE illust_id IN (SELECT live_illust_id FROM list_live_illust WHERE project_id = _project_id) AND illust_type= 'live2d';
	
	SELECT count(*) INTO minicutCount FROM list_minicut WHERE project_id = _project_id;
	SELECT count(*) INTO minicutLangCount FROM list_minicut_lang WHERE minicut_id IN (SELECT minicut_id FROM list_minicut WHERE project_id = _project_id) AND minicut_type = 'minicut';
	
	SELECT count(*) INTO liveObjectCount FROM list_live_object WHERE project_id = _project_id;
	SELECT count(*) INTO liveObjectDetailCount FROM list_live_object_detail WHERE live_object_id IN (SELECT live_object_id FROM list_live_object WHERE project_id = _project_id);
	SELECT count(*) INTO liveObjectLangCount FROM list_minicut_lang WHERE minicut_id IN (SELECT live_object_id FROM list_live_object WHERE project_id = _project_id) AND minicut_type = 'live2d';
	
	SELECT count(*) INTO modelMasterCount FROM list_model_master WHERE project_id = _project_id;
	SELECT count(*) INTO modelSlaveCount FROM list_model_slave WHERE model_id IN (SELECT model_id FROM list_model_master WHERE project_id = _project_id);
	SELECT count(*) INTO modelMotionCount FROM list_model_motion WHERE model_id IN (SELECT model_id FROM list_model_master WHERE project_id = _project_id);
	
	SELECT count(*) INTO loadingCount FROM list_loading WHERE project_id = _project_id;
	SELECT count(*) INTO loadingAppearCount FROM list_loading_appear WHERE loading_id IN (SELECT loading_id FROM list_loading WHERE project_id = _project_id);
	SELECT count(*) INTO loadingDetailCount FROM list_loading_detail WHERE loading_id IN (SELECT loading_id FROM list_loading WHERE project_id = _project_id);
	
	SELECT count(*) INTO soundCount FROM list_sound WHERE project_id = _project_id;
	SELECT count(*) INTO creditCount FROM list_credit WHERE project_id = _project_id;
	SELECT count(*) INTO nametagCount FROM list_nametag WHERE project_id = _project_id;
	
	SELECT count(*) INTO missionCount FROM list_mission WHERE project_id = _project_id;
	SELECT count(*) INTO missionLangCount FROM list_mission_lang WHERE mission_id IN (SELECT mission_id FROM list_mission WHERE project_id = _project_id);
	
	SELECT count(*) INTO episodeCount FROM list_episode WHERE project_id = _project_id;
	SELECT count(*) INTO episodeDetailCount FROM list_episode_detail WHERE episode_id IN (SELECT episode_id FROM list_episode WHERE project_id = _project_id);
	SELECT count(*) INTO scriptCount FROM list_script WHERE episode_id IN (SELECT episode_id FROM list_episode WHERE project_id = _project_id);
	SELECT count(*) INTO selectionCount FROM list_selection WHERE project_id = _project_id;

END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_init_user_dlc_current` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`remote`@`%` PROCEDURE `sp_init_user_dlc_current`(
IN _userkey BIGINT,
IN _project_id INT,
IN _dlc_id INT
)
BEGIN
	
	
	DECLARE v_episode_id int DEFAULT 0;

	
	DELETE FROM user_dlc WHERE userkey = _userkey AND project_id = _project_id AND dlc_id = _dlc_id;


	SELECT le.episode_id 
	  INTO v_episode_id
	  FROM list_episode le
	 WHERE le.project_id = _project_id
	   AND le.dlc_id = _dlc_id
	   AND le.episode_type = 'chapter'
	   AND le.chapter_number = 1
	 LIMIT 1;
	
	
	IF v_episode_id > 0 THEN
		CALL sp_update_user_dlc_current (_userkey, _project_id, _dlc_id, v_episode_id, NULL, 0, 0);
	END IF;
	
	
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_init_user_project_current` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`remote`@`%` PROCEDURE `sp_init_user_project_current`(
IN _userkey BIGINT,
IN _project_id INT
)
BEGIN
	
	
	DECLARE v_episode_id int DEFAULT 0;

	
	DELETE FROM user_project_current WHERE userkey = _userkey AND project_id = _project_id;


	SELECT le.episode_id 
	  INTO v_episode_id
	  FROM list_episode le
	 WHERE le.project_id = _project_id
	   AND le.episode_type = 'chapter'
	   AND le.dlc_id < 0
	 ORDER BY sortkey
	 LIMIT 1;
	
	
	IF v_episode_id > 0 THEN
		CALL sp_update_user_project_current (_userkey, _project_id, v_episode_id, NULL, 0, 0);
	END IF;

	
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_insert_coupon_episode` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`remote`@`%` PROCEDURE `sp_insert_coupon_episode`(
IN _coupon_id INT,
IN _episode_id int 
)
BEGIN
		
	

	DECLARE v_check TINYINT DEFAULT 0;
	
	
	SELECT EXISTS (SELECT * FROM com_coupon_episode WHERE coupon_id = _coupon_id AND episode_id = _episode_id)
	INTO v_check
	FROM DUAL;
	 
	 
	IF v_check < 1 THEN
		INSERT INTO com_coupon_episode (coupon_id, episode_id) VALUES(_coupon_id, _episode_id);
	END IF;
	
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_insert_dress` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`remote`@`%` PROCEDURE `sp_insert_dress`(
IN _dress_name VARCHAR(30),
IN _model_id INT,
IN _dressmodel_id INT
)
BEGIN
	
	DECLARE v_exists int DEFAULT 0;
	DECLARE v_default int DEFAULT 0;
	
	
	SELECT EXISTS (SELECT z.dress_id FROM list_dress z WHERE z.dressmodel_id = _dressmodel_id)
	  INTO v_exists 
	  FROM DUAL;

	 
	
	IF v_exists = 0 THEN
		SET v_default = 1;
	END IF;
	
	
	INSERT INTO list_dress (dress_name, model_id, is_default, dressmodel_id, sortkey) 
	VALUES (_dress_name, _model_id, v_default, _dressmodel_id, 0);
	
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_insert_mission` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`remote`@`%` PROCEDURE `sp_insert_mission`(
IN _mission_name VARCHAR(60),
IN _mission_hint VARCHAR(500),
IN _mission_type VARCHAR(20),
IN _is_hidden TINYINT,
IN _project_id INT,
IN _mission_condition VARCHAR(20),
IN _mission_figure INT,
IN _id_condition VARCHAR(2000),
IN _reward_exp INT,
IN _reward_currency VARCHAR(20),
IN _reward_quantity INT,
IN _image_url VARCHAR(160),
IN _image_key VARCHAR(120) 
)
BEGIN

DECLARE v_current_id INT DEFAULT 0;


INSERT INTO list_mission (mission_name, mission_hint, mission_type, is_hidden, project_id, mission_condition, mission_figure, id_condition, reward_exp, reward_currency, reward_quantity, image_url, image_key)
VALUES(_mission_name, _mission_hint, _mission_type, _is_hidden, _project_id, _mission_condition, _mission_figure, _id_condition, _reward_exp, _reward_currency, _reward_quantity, _image_url, _image_key);


SELECT mission_id
  INTO v_current_id
  FROM list_mission lm 
 WHERE lm.project_id = _project_id
   AND lm.mission_type = _mission_type
   AND lm.mission_name = _mission_name;


IF v_current_id > 0 THEN
	
	
	
	CALL sp_update_mission_lang (v_current_id, 'KO', _mission_name, _mission_hint);


END IF;
	
	
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_insert_mission_all_clear` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`remote`@`%` PROCEDURE `sp_insert_mission_all_clear`(
_userkey bigint, 
_project_id int,
_lang varchar(2)
)
BEGIN
	
	DECLARE v_mission_id int DEFAULT 0; 
	DECLARE v_mission_type varchar(20) DEFAULT '';
	DECLARE v_id_condition varchar(2000) DEFAULT ''; 

	DECLARE done INT DEFAULT FALSE;

	DECLARE c1 CURSOR FOR
	SELECT mission_id, mission_type, id_condition 
	FROM list_mission lm 
	WHERE project_id = _project_id;

   	DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;

   	OPEN c1;

      looping : LOOP	
	      
	  	FETCH c1 INTO v_mission_id, v_mission_type, v_id_condition;
   
        IF done THEN 
        	LEAVE looping;
        END IF;
       
       	IF v_mission_type = 'episode' THEN  
       	
       		
       		INSERT INTO user_episode_hist(userkey, project_id, episode_id) 
       		SELECT _userkey userkey, project_id, episode_id
       		FROM list_episode le
       		WHERE find_in_set(episode_id, v_id_condition)
			AND episode_id NOT IN (SELECT episode_id FROM user_episode_hist ueh WHERE ueh.userkey = _userkey AND episode_id = le.episode_id);
		
       	ELSEIF v_mission_type = 'event' THEN  
       	 
       	   	
       	   	INSERT INTO user_scene_hist(userkey, project_id, episode_id, scene_id)
       	   	SELECT _userkey userkey, project_id, episode_id, scene_id 
       	   	FROM list_script ls
       	   	WHERE project_id = _project_id
       	   	AND lang = _lang
       	   	AND episode_id IN (SELECT episode_id FROM list_episode le WHERE project_id = _project_id)
       	   	AND find_in_set(scene_id, v_id_condition)
       	    AND scene_id NOT IN (SELECT scene_id FROM user_scene_hist WHERE userkey = _userkey AND project_id = ls.project_id AND episode_id = ls.episode_id AND scene_id = ls.scene_id);
       	   
       	END IF;
       
      END LOOP;
      
	CLOSE c1;

	
    INSERT INTO user_mission (userkey, mission_id)
    SELECT _userkey userkey, mission_id 
    FROM list_mission lm
    WHERE project_id = _project_id 
    AND mission_id NOT IN (SELECT mission_id FROM user_mission WHERE userkey = _userkey AND mission_id = lm.mission_id);

END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_insert_user_continuous_attendance` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`remote`@`%` PROCEDURE `sp_insert_user_continuous_attendance`(
_attendance_id int, 
_start_date datetime, 
_end_date datetime
)
BEGIN
	
	DECLARE done TINYINT DEFAULT FALSE; 
	DECLARE v_userkey BIGINT; 
	DECLARE v_action_date datetime; 

	
	
	DECLARE c1 CURSOR FOR
	SELECT ua.userkey, ua.action_date  
	FROM user_attendance ua 
	WHERE action_date BETWEEN '2022-05-26 00:00:00' AND '2022-05-26 13:00:00'
	ORDER BY ua.userkey;
	

	DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;	
	
	OPEN c1;

		
		looping : LOOP
			FETCH c1 INTO v_userkey, v_action_date;
		
			IF done THEN 
				LEAVE looping;
			END IF;
		
			
			INSERT INTO user_continuous_attendance (attendance_id, userkey, attendance_date, start_date, end_date) 
			VALUES(_attendance_id, v_userkey, v_action_date, _start_date, _end_date);
		
		
		END LOOP;

	CLOSE c1;

END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_insert_user_ending` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`remote`@`%` PROCEDURE `sp_insert_user_ending`(
IN _userkey BIGINT,
IN _episode_id INT
)
proc:BEGIN
	
DECLARE v_exists TINYINT DEFAULT 0;



SELECT EXISTS (SELECT z.episode_id FROM list_episode z WHERE z.episode_id = _episode_id AND z.episode_type = 'ending')
 INTO v_exists
 FROM DUAL;


IF v_exists < 1 THEN
LEAVE proc;
END IF;


SELECT EXISTS (SELECT z.episode_id FROM user_ending z WHERE z.userkey= _userkey AND z.episode_id = _episode_id)
 INTO v_exists
 FROM DUAL;

IF v_exists > 0 THEN
LEAVE proc;
END IF;



INSERT INTO user_ending (userkey, episode_id) VALUES (_userkey, _episode_id);


	
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_insert_user_ending_new` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`remote`@`%` PROCEDURE `sp_insert_user_ending_new`(
IN _userkey BIGINT,
IN _episode_id INT,
IN _project_id INT, 
IN _play_count INT
)
proc:BEGIN
	
DECLARE v_exists TINYINT DEFAULT 0;



SELECT EXISTS (SELECT z.episode_id FROM list_episode z WHERE z.episode_id = _episode_id AND z.episode_type = 'ending')
 INTO v_exists
 FROM DUAL;


IF v_exists < 1 THEN
LEAVE proc;
END IF;


SELECT EXISTS (SELECT z.episode_id FROM user_selection_ending z WHERE userkey = _userkey AND project_id = _project_id AND play_count = _play_count)
INTO v_exists
FROM DUAL;


IF v_exists < 1 THEN 
	INSERT INTO user_selection_ending(
		userkey 
		, project_id 
		, ending_id 
		, play_count 
		, episode_id 
		, selection_group 
		, selection_no 
		, origin_action_date 
	) SELECT userkey
	, project_id 
	, _episode_id ending_id 
	, play_count 
	, episode_id 
	, selection_group 
	, selection_no 
	, action_date
	FROM user_selection_current
	WHERE userkey = _userkey 
	AND project_id = _project_id; 
END IF; 


SELECT EXISTS (SELECT z.episode_id FROM user_ending z WHERE z.userkey= _userkey AND z.episode_id = _episode_id)
 INTO v_exists
 FROM DUAL;

IF v_exists > 0 THEN
LEAVE proc;
END IF;



INSERT INTO user_ending (userkey, episode_id) VALUES (_userkey, _episode_id);

END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_insert_user_episode_hist` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`remote`@`%` PROCEDURE `sp_insert_user_episode_hist`(
IN _userkey BIGINT,
IN _project_id INT,
IN _episode_id INT
)
BEGIN
	
DECLARE v_exists INT DEFAULT 0;


SELECT EXISTS (SELECT hist.episode_id FROM user_episode_hist hist WHERE hist.userkey = _userkey AND hist.project_id = _project_id AND hist.episode_id = _episode_id)
 INTO v_exists
 FROM DUAL;


IF v_exists < 1 THEN
INSERT INTO user_episode_hist (userkey, project_id, episode_id) VALUES (_userkey, _project_id, _episode_id);
END IF;

SELECT a.episode_id, a.first_play 
  FROM user_episode_hist a
 WHERE a.userkey = _userkey
   AND a.project_id = _project_id
 ORDER BY a.episode_id ;


	
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_insert_user_episode_progress` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`remote`@`%` PROCEDURE `sp_insert_user_episode_progress`(
IN _userkey BIGINT,
IN _project_id INT,
IN _episode_id INT
)
BEGIN

	

	
DECLARE v_exists INT DEFAULT 0;



SELECT EXISTS (SELECT hist.episode_id FROM user_episode_progress hist WHERE hist.userkey = _userkey AND hist.project_id = _project_id AND hist.episode_id = _episode_id)
 INTO v_exists
 FROM DUAL;


IF v_exists < 1 THEN
INSERT INTO user_episode_progress (userkey, project_id, episode_id) VALUES (_userkey, _project_id, _episode_id);
END IF;

SELECT a.episode_id, a.is_clear
  FROM user_episode_progress a
 WHERE a.userkey = _userkey
   AND a.project_id = _project_id
 ORDER BY a.open_date desc ;	
	
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_insert_user_mission` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`remote`@`%` PROCEDURE `sp_insert_user_mission`(
IN _userkey BIGINT,
IN _mission_id INT
)
BEGIN
	
DECLARE v_exists TINYINT DEFAULT 0;

SELECT EXISTS (SELECT z.mission_id FROM user_mission z WHERE z.userkey = _userkey AND z.mission_id = _mission_id)
 INTO v_exists 
 FROM DUAL;

IF v_exists = 0 THEN

INSERT INTO user_mission (userkey, mission_id) VALUES (_userkey, _mission_id);

END IF;


	
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_insert_user_project_dress_progress` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`remote`@`%` PROCEDURE `sp_insert_user_project_dress_progress`(
IN _userkey BIGINT, 
IN _project_id INT, 
IN _speaker VARCHAR(20), 
IN _dress_id int 
)
BEGIN
	
	DECLARE v_check INT DEFAULT 0;
	
	
	SELECT EXISTS (SELECT z.userkey FROM user_project_dress z WHERE z.userkey = _userkey AND z.project_id = _project_id AND z.speaker = _speaker)
	  INTO v_check
	  FROM DUAL;
	
	 
	 
	IF v_check > 0 THEN
	
		UPDATE user_project_dress 
		   SET default_dress_id = _dress_id
    	 WHERE userkey = _userkey
    	   AND project_id  = _project_id
    	   AND speaker = _speaker;
    	  
    ELSE 
    	
    	INSERT INTO user_project_dress (userkey, project_id, speaker, default_dress_id) VALUES (_userkey, _project_id, _speaker, _dress_id);
    	  
	END IF;

	
    
	
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_insert_user_property` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`remote`@`%` PROCEDURE `sp_insert_user_property`(
IN _userkey BIGINT,
IN _currency VARCHAR(20),
IN _quantity INT,
IN _path_code VARCHAR(30))
sp:BEGIN
	
	
	DECLARE v_result INT DEFAULT 0; 
	DECLARE v_currency VARCHAR(20) DEFAULT NULL;
	DECLARE v_currency_type VARCHAR(30) DEFAULT NULL; 
	DECLARE v_unique TINYINT DEFAULT 0;
	DECLARE v_expire_date DATETIME;
	DECLARE v_project_id INT DEFAULT -1;
	DECLARE v_total_property INT DEFAULT 0;
	
	
	SELECT a.currency, a.is_unique, a.currency_type, a.connected_project
	  INTO v_currency, v_unique, v_currency_type, v_project_id
	  FROM com_currency a
	 WHERE a.currency = _currency;
	 
	IF v_currency IS NULL THEN
		SET v_result = 0; 
		
		SELECT v_result AS done
		  FROM DUAL;
		 
		LEAVE sp;
 	END IF;

 	
 	IF v_unique > 0 THEN
 	
 		
 		SELECT EXISTS (SELECT a.property_no 
 		                 FROM user_property a 
 		                WHERE a.userkey = _userkey 
 		                  AND a.currency = _currency
 		                  AND a.quantity > 0
 		                  AND a.expire_date >= now())
 		  INTO v_result
 		  FROM DUAL;
 		 
 		IF v_result > 0 THEN 
 			SET v_result = 2; 
 			SELECT v_result AS done
 			  FROM DUAL;
 			 LEAVE sp;
 		
 		END IF;
 		 
 	END IF; 
 	
 	
 	
 	
 	IF v_currency_type = 'ticket' THEN
 		SET v_expire_date = DATE_ADD(now(), INTERVAL 1 DAY);
 	ELSEIF instr(_currency, 'OneTime') > 0 THEN
 	 	SET v_expire_date = DATE_ADD(now(), INTERVAL 2 DAY);
 	ELSE 
 		SET v_expire_date = '9999-12-31';
 	END IF;
 
 	INSERT INTO user_property (userkey, currency, quantity, current_quantity, path_code, expire_date)
 	VALUES (_userkey, _currency, _quantity, _quantity, _path_code, v_expire_date);
 
 
 	
 	SELECT fn_get_user_property(_userkey, _currency)
 	  INTO v_total_property
      FROM DUAL;
 
 	
	INSERT INTO gamelog.log_property (userkey, log_type, currency, quantity, log_code, project_id, property_result) VALUES(_userkey, 'get', _currency, _quantity, _path_code, v_project_id, v_total_property);

	
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_insert_user_property_paid` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`remote`@`%` PROCEDURE `sp_insert_user_property_paid`(
IN _userkey BIGINT,
IN _currency VARCHAR(20),
IN _quantity INT,
IN _path_code VARCHAR(30),
IN _paid TINYINT 
)
sp:BEGIN
	
	
	DECLARE v_result INT DEFAULT 0; 
	DECLARE v_currency VARCHAR(20) DEFAULT NULL;
	DECLARE v_currency_type VARCHAR(30) DEFAULT NULL; 
	DECLARE v_unique TINYINT DEFAULT 0;
	DECLARE v_expire_date DATETIME;
	DECLARE v_project_id INT DEFAULT -1;
	DECLARE v_total_property INT DEFAULT 0;
	
	
	SELECT a.currency, a.is_unique, a.currency_type, a.connected_project
	  INTO v_currency, v_unique, v_currency_type, v_project_id
	  FROM com_currency a
	 WHERE a.currency = _currency;
	 
	IF v_currency IS NULL THEN
		SET v_result = 0; 
		
		SELECT v_result AS done
		  FROM DUAL;
		 
		LEAVE sp;
 	END IF;

 	
 	IF v_unique > 0 THEN
 	
 		
 		SELECT EXISTS (SELECT a.property_no 
 		                 FROM user_property a 
 		                WHERE a.userkey = _userkey 
 		                  AND a.currency = _currency
 		                  AND a.quantity > 0
 		                  AND a.expire_date >= now())
 		  INTO v_result
 		  FROM DUAL;
 		 
 		IF v_result > 0 THEN 
 			SET v_result = 2; 
 			SELECT v_result AS done
 			  FROM DUAL;
 			 LEAVE sp;
 		
 		END IF;
 		 
 	END IF; 
 	
 	
 	
 	
 	IF v_currency_type = 'ticket' THEN
 		SET v_expire_date = DATE_ADD(now(), INTERVAL 1 DAY);
 	ELSEIF instr(_currency, 'OneTime') > 0 THEN
 	 	SET v_expire_date = DATE_ADD(now(), INTERVAL 2 DAY);
 	ELSE 
 		SET v_expire_date = '9999-12-31';
 	END IF;
 
 	INSERT INTO user_property (userkey, currency, quantity, current_quantity, path_code, expire_date, paid)
 	VALUES (_userkey, _currency, _quantity, _quantity, _path_code, v_expire_date, _paid);
 
 
 	
 	SELECT fn_get_user_property(_userkey, _currency)
 	  INTO v_total_property
      FROM DUAL;
 
 	
	INSERT INTO gamelog.log_property (userkey, log_type, currency, quantity, log_code, project_id, property_result, paid) VALUES(_userkey, 'get', _currency, _quantity, _path_code, v_project_id, v_total_property, _paid);

	
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_insert_user_side` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`remote`@`%` PROCEDURE `sp_insert_user_side`(
IN _userkey BIGINT,
IN _episode_id INT
)
BEGIN
	
DECLARE v_exists TINYINT DEFAULT 0;

SELECT EXISTS (SELECT z.episode_id FROM user_side z WHERE z.userkey = _userkey AND z.episode_id = _episode_id)
 INTO v_exists 
 FROM DUAL;

IF v_exists = 0 THEN

INSERT INTO user_side (userkey, episode_id) VALUES (_userkey, _episode_id);

END IF;


	
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_make_bubble_set` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`remote`@`%` PROCEDURE `sp_make_bubble_set`(
IN _set_id INT
)
BEGIN
	
	
	
	
DECLARE done TINYINT DEFAULT FALSE; 
DECLARE v_code VARCHAR(20) DEFAULT NULL;
DECLARE i_index INT DEFAULT 0;
DECLARE j_index INT DEFAULT 0;

DECLARE c1 CURSOR FOR
SELECT ls.code 
  FROM list_standard ls 
 WHERE ls.standard_class = 'bubble_variation'
 ORDER BY ls.sortkey ;

DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE; 

OPEN c1;


looping : LOOP

FETCH c1 INTO v_code;

IF done THEN
	LEAVE looping;
END IF;




SET i_index = 1;


WHILE (i_index <= 4) DO

	SET j_index = 1;
	WHILE (j_index <= 9) DO
	
		INSERT INTO com_bubble_group (set_id, variation, template, SIZE, pos) VALUES (_set_id, v_code, 'talk', i_index, j_index);
		INSERT INTO com_bubble_group (set_id, variation, template, SIZE, pos) VALUES (_set_id, v_code, 'feeling', i_index, j_index);
		INSERT INTO com_bubble_group (set_id, variation, template, SIZE, pos) VALUES (_set_id, v_code, 'whisper', i_index, j_index);
		INSERT INTO com_bubble_group (set_id, variation, template, SIZE, pos) VALUES (_set_id, v_code, 'yell', i_index, j_index);
		INSERT INTO com_bubble_group (set_id, variation, template, SIZE, pos) VALUES (_set_id, v_code, 'monologue', i_index, j_index);
		INSERT INTO com_bubble_group (set_id, variation, template, SIZE, pos) VALUES (_set_id, v_code, 'speech', i_index, j_index);
	
		SET j_index = j_index + 1;
	
	END WHILE;

	SET i_index = i_index + 1;

END WHILE;


END LOOP; 

CLOSE c1;


END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_purchase_episode_type2` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`remote`@`%` PROCEDURE `sp_purchase_episode_type2`(
IN _userkey BIGINT,
IN _project_id INT,
IN _episode_id INT,
IN _currency VARCHAR(20),
IN _quantity INT,
IN _purchaseType VARCHAR(20)
)
proc:BEGIN
	

	
	DECLARE v_permanent TINYINT DEFAULT 0;
	DECLARE v_expire_date DATETIME;
	DECLARE v_exists TINYINT DEFAULT 0;
	DECLARE v_one_playable TINYINT DEFAULT 0; 

	
	IF _purchaseType = 'Rent' THEN 
		SET v_expire_date = DATE_ADD(now(), INTERVAL 2 DAY ); 
		SET v_permanent = 0;
	
	ELSEIF _purchaseType = 'OneTime' THEN 
		SET v_expire_date = '9999-12-31';
		SET v_permanent = 0;
		SET v_one_playable = 1;
	
	ELSEIF _purchaseType = 'Permanent' THEN 
		SET v_expire_date = '9999-12-31';
		SET v_permanent = 1;
	
	ELSEIF _purchaseType = 'AD' THEN 
		SET v_expire_date = '9999-12-31';
		SET v_permanent = 0;
	
	ELSE 
		SIGNAL SQLSTATE '45000'; 
		LEAVE proc;
	
	END IF;



	
	SELECT EXISTS (SELECT uep.userkey 
	                 FROM user_episode_purchase uep 
	                WHERE uep.userkey = _userkey 
	                  AND uep.episode_id = _episode_id)
	       INTO v_exists
	       FROM DUAL;
	      
	IF v_exists > 0 THEN
		
		
		UPDATE user_episode_purchase 
		   SET currency = _currency
		     , currency_count = _quantity
		     , permanent = v_permanent
		     , expire_date = v_expire_date
		     , purchase_type = _purchaseType
		     , onetime_playable = v_one_playable
		  WHERE userkey = _userkey
		    AND episode_id = _episode_id;
	
	ELSE 
	
		
		INSERT INTO user_episode_purchase(userkey, project_id, episode_id, currency, currency_count, expire_date, permanent, purchase_type, onetime_playable)
		VALUES (_userkey, _project_id, _episode_id, _currency, _quantity, v_expire_date, v_permanent, _purchaseType, v_one_playable);
	
	END IF;
	                  
	
	
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_purchase_regular_episodes` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`remote`@`%` PROCEDURE `sp_purchase_regular_episodes`(
IN _userkey BIGINT,
IN _project_id int,
IN _pass_currency VARCHAR(20)
)
BEGIN
	
	DECLARE done TINYINT DEFAULT FALSE; 
	DECLARE v_episode_id INT;
	
	DECLARE c1 CURSOR FOR
	SELECT a.episode_id
	  FROM list_episode a
	 WHERE a.project_id = _project_id 
	   AND a.episode_type = 'chapter'
	 ORDER BY a.chapter_number;
	
	DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;

	OPEN c1;
		looping : LOOP

		FETCH c1 INTO v_episode_id;
		
		IF done THEN 
			LEAVE looping;
		END IF;
	
		
		CALL sp_purchase_episode_type2(_userkey, _project_id, v_episode_id, _pass_currency, 1, 'Permanent');
		
		END LOOP;
	CLOSE c1;
	
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_reset_playing_episode` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`remote`@`%` PROCEDURE `sp_reset_playing_episode`(
IN _userkey BIGINT,
IN _project_id INT,
IN _episode_id INT
)
BEGIN
	
	
	
	
	
	DELETE FROM user_scene_progress uep WHERE uep.userkey = _userkey AND uep.episode_id = _episode_id;
	DELETE FROM user_selection_progress WHERE userkey = _userkey AND episode_id = _episode_id; 
	DELETE FROM user_selection_current WHERE userkey = _userkey AND episode_id = _episode_id;  
	
	
	CALL sp_update_user_project_current (_userkey, _project_id, _episode_id, NULL, 0, 0);
	
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_reset_user_episode_progress` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`remote`@`%` PROCEDURE `sp_reset_user_episode_progress`(
IN _userkey BIGINT,
IN _project_id INT,
IN _episode_id INT,
IN _dlc_id INT
)
BEGIN
	DECLARE done TINYINT DEFAULT FALSE; 
	DECLARE v_match TINYINT DEFAULT 0; 
	DECLARE v_episode_id INT DEFAULT 0;
	DECLARE v_check INT DEFAULT 0; 
	DECLARE v_count INT; 
	
	
	
	
	DECLARE c1 CURSOR FOR
	SELECT le.episode_id 
	  FROM list_episode le 
	 WHERE le.project_id = _project_id
	   AND le.episode_type = 'chapter' 
	   AND le.dlc_id  = _dlc_id
	 ORDER BY le.sortkey, le.episode_id; 
	 
	 
	DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;
	 
	OPEN c1;

		
		looping : LOOP
			FETCH c1 INTO v_episode_id;
		
			IF done THEN 
				LEAVE looping;
			END IF;
		
			IF v_episode_id = _episode_id THEN 
				SET v_match = 1; 
			END IF;
		
			
			
			
		
		IF v_match > 0 THEN
		
			
		
			IF v_episode_id <> _episode_id THEN
				
				DELETE FROM user_episode_progress uep WHERE uep.userkey = _userkey AND uep.episode_id = v_episode_id;
			END IF;
		
			
			DELETE FROM user_scene_progress a WHERE a.userkey = _userkey AND a.episode_id = v_episode_id;
		
			
			DELETE FROM user_selection_progress WHERE userkey = _userkey AND episode_id = v_episode_id; 
			DELETE FROM user_selection_current WHERE userkey = _userkey AND episode_id = v_episode_id;  
				
			
			DELETE FROM user_episode_progress WHERE userkey = _userkey AND episode_id IN (
				SELECT ending.episode_id 
				  FROM list_episode le 
				     , list_episode ending 
				 WHERE le.project_id = _project_id
				   AND le.project_id = ending.project_id 
				   AND le.episode_id = ending.depend_episode
				   AND le.dlc_id = _dlc_id
				   AND ending.episode_type = 'ending'
				   AND ending.depend_episode = v_episode_id
			);
		
			
			DELETE FROM user_scene_progress WHERE userkey = _userkey AND episode_id IN (
				SELECT ending.episode_id 
				  FROM list_episode le 
				     , list_episode ending 
				 WHERE le.project_id = _project_id
				   AND le.project_id = ending.project_id 
				   AND le.episode_id = ending.depend_episode
				   AND le.dlc_id  = _dlc_id
				   AND ending.episode_type = 'ending'
				   AND ending.depend_episode = v_episode_id
			);
		
			
			DELETE FROM user_selection_progress WHERE userkey = _userkey AND episode_id IN (
				SELECT ending.episode_id 
				  FROM list_episode le 
				     , list_episode ending 
				 WHERE le.project_id = _project_id
				   AND le.project_id = ending.project_id 
				   AND le.episode_id = ending.depend_episode
				   AND le.dlc_id  = _dlc_id
				   AND ending.episode_type = 'ending'
				   AND ending.depend_episode = v_episode_id
			);	
		
		    
			DELETE FROM user_selection_current WHERE userkey = _userkey AND episode_id IN (
				SELECT ending.episode_id 
				  FROM list_episode le 
				     , list_episode ending 
				 WHERE le.project_id = _project_id
				   AND le.project_id = ending.project_id 
				   AND le.episode_id = ending.depend_episode
				   AND le.dlc_id  = _dlc_id
				   AND ending.episode_type = 'ending'
				   AND ending.depend_episode = v_episode_id
			);	
		
			
		END IF; 
			
		
		END LOOP;
	
	CLOSE c1;

	
	
	SELECT EXISTS ( 
		SELECT * 
		FROM user_selection_current a, user_selection_ending b 
		WHERE a.userkey = b.userkey 
		AND a.project_id = b.project_id 
		AND a.play_count = b.play_count 
		AND a.userkey = _userkey 
		AND a.project_id = _project_id 
	) 
	INTO v_check
	FROM DUAL;
		
	
	IF v_check > 0 THEN 
				
		SELECT max(play_count)
		INTO v_count 
		FROM user_selection_ending use2 
		WHERE userkey = _userkey 
		AND project_id = _project_id; 
			
		UPDATE user_selection_current 
		SET play_count = v_count+1
		WHERE userkey = _userkey 
		AND project_id = _project_id; 
			
	END IF;	

	
	IF _dlc_id < 0 THEN

		 UPDATE user_project_current 
		   SET next_open_time = now()
		  WHERE userkey = _userkey 
		    AND project_id = _project_id
		    AND is_special = 0;	
	
		
		
		CALL sp_update_user_project_current (_userkey, _project_id, _episode_id, NULL, 0, 0);
	END IF;
	

	
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_reset_user_project_progress` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`remote`@`%` PROCEDURE `sp_reset_user_project_progress`(
IN _userkey BIGINT,
IN _project_id INT,
IN _episode_id INT,
IN _scene_id varchar(10), 
IN _script_no BIGINT, 
IN _origin_script_no BIGINT, 
IN _current_selection_group INT, 
IN _reset_selection_group INT,  
IN _quantity INT 
)
BEGIN
	
	DECLARE done TINYINT DEFAULT FALSE; 
	DECLARE v_match TINYINT DEFAULT 0; 
	DECLARE v_scene_id varchar(10) DEFAULT NULL;
	DECLARE v_script_no BIGINT DEFAULT 0; 

	
	
	DECLARE c1 CURSOR FOR
	SELECT ls.scene_id
	  FROM list_script ls  
	 WHERE ls.project_id = _project_id
	   AND ls.episode_id = _episode_id
	   AND ls.scene_id > 0
	   AND ls.script_no <= _origin_script_no
	 ORDER BY ls.script_no; 
	 
	 
	DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;
	 
	OPEN c1;

		
		looping : LOOP
			FETCH c1 INTO v_scene_id;
		
			IF done THEN 
				LEAVE looping;
			END IF;
		
			IF v_scene_id = _scene_id THEN 
				SET v_match = 1; 
			END IF;
		
		
		IF v_match > 0 THEN
		
			
			IF _scene_id <> v_scene_id THEN 
				DELETE FROM user_scene_progress a WHERE a.userkey = _userkey AND a.project_id = _project_id AND a.episode_id = _episode_id AND a.scene_id = v_scene_id;
			END IF; 
		
			
			DELETE FROM user_selection_progress WHERE userkey = _userkey AND project_id = _project_id AND episode_id = _episode_id AND target_scene_id = v_scene_id; 
			DELETE FROM user_selection_current WHERE userkey = _userkey AND project_id = _project_id AND episode_id = _episode_id AND target_scene_id = v_scene_id;  
			
			
			DELETE FROM user_story_ability WHERE userkey = _userkey AND project_id = _project_id AND episode_id = _episode_id AND scene_id = v_scene_id;
				
			
		END IF; 
			
		
		END LOOP;
	
	CLOSE c1;

	
	UPDATE user_project_current 
	SET scene_id = _scene_id
	, script_no = _script_no
	, update_date = now() 
	WHERE userkey = _userkey 
	AND project_id = _project_id 
	AND is_special = 0;


	
	INSERT INTO user_progress_reset_history(userkey, project_id, episode_id, scene_id, current_selection_group, reset_selection_group, quantity) 
	VALUES (_userkey, _project_id, _episode_id, _scene_id, _current_selection_group, _reset_selection_group, _quantity);
	
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_save_user_project_current` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`remote`@`%` PROCEDURE `sp_save_user_project_current`(
IN _userkey BIGINT,
IN _project_id INT,
IN _episode_id INT,
IN _scene_id VARCHAR(10),
IN _script_no BIGINT,
IN _is_final TINYINT 
)
BEGIN

	
	DECLARE v_episode_id INT DEFAULT 0;
	DECLARE v_history_check TINYINT DEFAULT 0;
	DECLARE v_check TINYINT DEFAULT 0;
	DECLARE v_special TINYINT DEFAULT 0; 
	
	DECLARE v_publish_date DATETIME; 
	DECLARE v_is_serial TINYINT DEFAULT 0; 
	
	
	
 	DECLARE v_next_open_min int DEFAULT 0;
	DECLARE v_open_decrease_rate int DEFAULT 0;
	
	
	DECLARE v_decrease_rate float DEFAULT 0;
	DECLARE v_open_min int DEFAULT 0;


	
	
	SELECT CASE WHEN a.episode_type = 'side' THEN 1
		 		ELSE 0 END
		 , a.next_open_min 
		 , a.open_decrease_rate
		 , ifnull(a.publish_date, '2020-01-01')
		 , CASE WHEN ifnull(a.publish_date, '2020-01-01') > now() THEN 1 ELSE 0 END is_serial
		   INTO v_special, v_next_open_min, v_open_decrease_rate, v_publish_date, v_is_serial
	  FROM list_episode a
	 WHERE a.episode_id = _episode_id;
	
	
	IF v_next_open_min = 0 THEN 
		SET v_open_min = 0;
	
	ELSE 
		
		
		IF v_open_decrease_rate = 0 THEN 
			SET v_open_min = v_next_open_min;
		
		ELSE 
			
			SET	v_decrease_rate = v_open_decrease_rate / 100;
			SET v_decrease_rate  = 1 - v_decrease_rate;
  			SET v_open_min = v_next_open_min * v_decrease_rate;				
		END IF;
	END IF;


	
	SELECT EXISTS (SELECT z.episode_id FROM user_episode_hist z WHERE z.userkey = _userkey AND z.episode_id= _episode_id)
	       INTO v_history_check 
	       FROM DUAL;
	
	
	IF v_history_check  > 0 THEN 
		SET v_open_min = 0;
	END IF;

	IF v_special > 0 THEN 
		SET v_open_min = 0;
	END IF;

	
	SELECT EXISTS (SELECT z.project_id FROM user_project_current z WHERE z.userkey = _userkey AND z.project_id = _project_id AND z.is_special = v_special)
	  INTO v_check
	  FROM DUAL;
	 

	
 	IF v_check < 1 THEN  
	
		
		IF v_history_check = 0 AND v_is_serial > 0 AND v_publish_date > now() THEN
		
			INSERT INTO user_project_current (userkey, project_id, is_special, episode_id, scene_id, script_no, is_final, update_date, next_open_time)
			VALUES (_userkey, _project_id, v_special,  _episode_id, _scene_id, _script_no, _is_final, now(), v_publish_date); 
	
		ELSE 
		
			
			INSERT INTO user_project_current (userkey, project_id, is_special, episode_id, scene_id, script_no, is_final, update_date, next_open_time)
			VALUES (_userkey, _project_id, v_special,  _episode_id, _scene_id, _script_no, _is_final, now(), date_add(now(), INTERVAL v_open_min minute));
		
		END IF;
	
	

	
	ELSE 
	
			SELECT a.episode_id 
			  INTO v_episode_id
			  FROM user_project_current a
			 WHERE a.userkey = _userkey   
			   AND a.project_id = _project_id 
			   AND a.is_special = v_special;
		
			
			
			IF v_history_check = 0 AND v_is_serial > 0 AND v_publish_date > now() THEN
			
			
				UPDATE user_project_current 
				   SET episode_id = _episode_id
				     , is_special = v_special
				     , scene_id = CASE WHEN _is_final > 0 THEN scene_id ELSE _scene_id END 
				     , script_no = CASE WHEN _is_final > 0 THEN script_no ELSE _script_no END
				     , is_final = _is_final
				     , update_date = now()
				     , next_open_time = v_publish_date
				WHERE userkey = _userkey
				  AND project_id = _project_id
				  AND is_special = v_special;
		
			ELSE 
			
				
				
				UPDATE user_project_current 
				   SET episode_id = _episode_id
				     , is_special = v_special
				     , scene_id = CASE WHEN _is_final > 0 THEN scene_id ELSE _scene_id END 
				     , script_no = CASE WHEN _is_final > 0 THEN script_no ELSE _script_no END
				     , is_final = _is_final
				     , update_date = now()
				     , next_open_time = CASE WHEN v_open_min > 0 AND v_episode_id <> _episode_id THEN date_add(now(), INTERVAL v_open_min minute)
				     						 ELSE next_open_time END
				WHERE userkey = _userkey
				  AND project_id = _project_id
				  AND is_special = v_special;
			
			END IF;			  

	END IF; 
	
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_select_episode_list` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`remote`@`%` PROCEDURE `sp_select_episode_list`(
IN _project_id int
)
BEGIN

select a.project_id
     , a.episode_id
     , fn_get_standard_name('episode_type', a.episode_type) episode_type
     , a.title
     , a.title_image_url
     , a.title_image_key
     , fn_get_standard_name('episode_status', a.episode_status) episode_status
     , a.price
     , a.sortkey
     , a.episode_unlockby
     , fn_get_standard_name('ending_type', a.ending_type) ending_type
  from list_episode a
 WHERE a.is_valid = 1
   AND a.project_id = _project_id
  order by CASE WHEN episode_unlockby < 0 THEN episode_id
	    		  ELSE episode_unlockby END, episode_type;

END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_select_recommend_project` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`remote`@`%` PROCEDURE `sp_select_recommend_project`(
IN _last_played_project int,
IN _project_list varchar(1000) 
)
BEGIN
	
	DECLARE v_genre varchar(40) DEFAULT '';
	DECLARE v_hashtag_list varchar(1000) DEFAULT '';
	DECLARE v_case_value int DEFAULT 0;
	DECLARE v_project_list varchar(1000) DEFAULT ''; 

	
	SELECT ifnull(lpg.genre_code, '') 
	INTO v_genre
	FROM list_project_genre lpg
	WHERE project_id = _last_played_project;

	
	SELECT group_concat(DISTINCT hashtag_no)
	INTO v_hashtag_list
	FROM list_project_hashtag lph 
	WHERE project_id = _last_played_project;
	
	
	SELECT fn_get_recommend_project_case(v_genre, v_hashtag_list, _project_list)
	INTO v_case_value
	FROM DUAL; 


	IF v_case_value = 1 THEN                              
	
		SELECT group_concat(DISTINCT lpm.project_id)
		INTO v_project_list
		FROM list_project_master lpm, list_project_genre lpg, list_project_hashtag lph  
		WHERE lpm.project_id = lpg.project_id  
		AND lpm.project_id = lph.project_id 
		AND lpm.project_id > 0 
		AND lph.hashtag_no > 0
		AND lpg.genre_code = v_genre
		AND find_in_set(lpm.project_id, _project_list)
		AND find_in_set(lph.hashtag_no, v_hashtag_list);
		
	ELSEIF v_case_value = 2 THEN                          
	
		SELECT group_concat(DISTINCT lpg.project_id) 
		INTO v_project_list
		FROM list_project_genre lpg 
		WHERE lpg.project_id > 0
		AND find_in_set(project_id, _project_list) 
		AND lpg.genre_code = v_genre;	
	
	ELSEIF v_case_value = 3 THEN                          
	
		SELECT group_concat(DISTINCT project_id) 
		INTO v_project_list
		FROM list_project_hashtag lph 
		WHERE lph.hashtag_no > 0 
		AND project_id > 0
		AND find_in_set(project_id, _project_list) 
		AND find_in_set(lph.hashtag_no, v_hashtag_list);
	
	END IF;
	
	
	SELECT ifnull(v_project_list, '') AS project_list
	FROM DUAL; 

END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_select_script_validation` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`remote`@`%` PROCEDURE `sp_select_script_validation`(
IN p_episode_id INT,
IN p_project_id INT
)
BEGIN
	
	DECLARE done INT DEFAULT FALSE;
	DECLARE v_rownum int DEFAULT 0;
	DECLARE v_exists INT DEFAULT -1;

	DECLARE v_script_no BIGINT;
	DECLARE v_template varchar(20);
	DECLARE v_speaker VARCHAR(20);
	DECLARE v_script_data VARCHAR(240);
	DECLARE v_character_expression VARCHAR(30);
	DECLARE v_emoticon_expression VARCHAR(20);

	
	DECLARE v_target_scene_id varchar(40);
	DECLARE v_voice varchar(40);
	DECLARE v_sound_effect varchar(20);
	
	
	
	DECLARE c1 CURSOR FOR 	
	SELECT ls.script_no
	     , ls.template 
	     , ls.speaker 
	     , ls.script_data 
	     , ls.character_expression
	     , ls.emoticon_expression 
	     , ls.target_scene_id
	     , ls.voice 
	     , ls.sound_effect 
	  FROM list_script ls
	 WHERE ls.episode_id = p_episode_id 
	 ORDER BY ls.script_no ;
	
	DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;


	DELETE FROM script_validtaion WHERE episode_id = p_episode_id; 

	
OPEN c1;

looping : LOOP

	FETCH c1 INTO v_script_no, v_template, v_speaker, v_script_data, v_character_expression, v_emoticon_expression, v_target_scene_id, v_voice, v_sound_effect;
	
	SET v_rownum = v_rownum + 1;
	
	IF done THEN 
		LEAVE looping;
	END IF;

	
	IF v_template = 'background' THEN
	
		
		SET v_exists = fn_check_background_exists(p_project_id, v_script_data);
	
		
		IF v_exists <= 0 THEN 
		
			INSERT INTO script_validtaion (episode_id, script_no, rownum, validation) VALUES (p_episode_id, v_script_no, v_rownum, CONCAT('배경 리소스 없음 : [', v_script_data, ']'));
		
		END IF;
	
	ELSEIF v_template = 'image' THEN
	
		
		SET v_exists = fn_check_image_exists(p_project_id, v_script_data);
	
		
		IF v_exists <= 0 THEN 
		
			INSERT INTO script_validtaion (episode_id, script_no, rownum, validation) VALUES (p_episode_id, v_script_no, v_rownum, CONCAT('이미지 리소스 없음 : [', v_script_data, ']'));
		
		END IF;	

	ELSEIF v_template = 'illust' THEN
	
		
		SET v_exists = fn_check_illust_exists(p_project_id, v_script_data);
	
		
		IF v_exists <= 0 THEN 
		
			INSERT INTO script_validtaion (episode_id, script_no, rownum, validation) VALUES (p_episode_id, v_script_no, v_rownum, CONCAT('일러스트 리소스 없음 : [', v_script_data, ']'));
		
		END IF;		
	
	ELSEIF v_template = 'live_object' THEN 
	
		
		SET v_exists = fn_check_live_object_exists(p_project_id, v_script_data);
	
		
		IF v_exists <= 0 THEN 
			INSERT INTO script_validtaion (episode_id, script_no, rownum, validation) VALUES (p_episode_id, v_script_no, v_rownum, CONCAT('라이브 오브제 리소스 없음 : [', v_script_data, ']'));
		END IF;
	
	ELSEIF v_template = 'bgm' THEN 
	
		
		SET v_exists = fn_check_sound_exists(p_project_id, v_script_data, 'bgm');
	
		
		IF v_exists <= 0 THEN 
			INSERT INTO script_validtaion (episode_id, script_no, rownum, validation) VALUES (p_episode_id, v_script_no, v_rownum, CONCAT('배경음 리소스 없음 : [', v_script_data, ']'));
		END IF;
	
	ELSEIF v_template = 'live_object_remove' OR v_template = 'bgm_remove' THEN 
	
		
		SET v_exists = ifnull(LENGTH(v_script_data), 0); 
		
		
		IF v_exists > 0 THEN 
			INSERT INTO script_validtaion (episode_id, script_no, rownum, validation) VALUES (p_episode_id, v_script_no, v_rownum, CONCAT('데이터 입력할 필요 없음 : [', v_script_data, ']'));
		END IF; 
	
	END IF;

	
	IF ifnull(LENGTH(v_speaker),0) > 0 THEN
		
		
		SET v_exists =  regexp_like(v_speaker, '^*:[^L|R]', 'c');
	
		IF v_exists > 0 THEN 
			INSERT INTO script_validtaion (episode_id, script_no, rownum, validation) VALUES (p_episode_id, v_script_no, v_rownum, CONCAT(':뒤에 L/R만 가능(소문자도 불가능) : [', v_speaker, ']'));	
		END IF; 
	
	END IF;

	
	IF ifnull(LENGTH(v_target_scene_id),0) > 0 THEN 
		
		
		SET v_exists = fn_check_episode_exists(p_project_id, p_episode_id, v_target_scene_id);
	
		IF v_exists = 0 THEN 
			INSERT INTO script_validtaion (episode_id, script_no, rownum, validation) VALUES (p_episode_id, v_script_no, v_rownum, CONCAT('해당 ID 없음 : [', v_target_scene_id, ']'));
		ELSEIF v_exists < 0 THEN 
			INSERT INTO script_validtaion (episode_id, script_no, rownum, validation) VALUES (p_episode_id, v_script_no, v_rownum, CONCAT('숫자/#숫자만 가능 : [', v_target_scene_id, ']'));
		END IF; 

	END IF; 

	
	IF ifnull(LENGTH(v_voice), 0) > 0 THEN 
	
		
		SET v_exists = fn_check_sound_exists(p_project_id, v_voice, 'voice');
	
	
		
		IF v_exists <= 0 THEN 
			INSERT INTO script_validtaion (episode_id, script_no, rownum, validation) VALUES (p_episode_id, v_script_no, v_rownum, CONCAT('음성 리소스 없음 : [', v_voice, ']'));
		END IF;
		
	END IF;


	
	IF ifnull(LENGTH(v_sound_effect), 0) > 0 THEN 
	
		
		SET v_exists = fn_check_sound_exists(p_project_id, v_sound_effect, 'se');
	
	
		
		IF v_exists <= 0 THEN 
			INSERT INTO script_validtaion (episode_id, script_no, rownum, validation) VALUES (p_episode_id, v_script_no, v_rownum, CONCAT('효과음 리소스 없음 : [', v_sound_effect, ']'));
		END IF;
		
	END IF;
	


END LOOP;


CLOSE c1;


	

	
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_select_script_validation_new` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`remote`@`%` PROCEDURE `sp_select_script_validation_new`(
IN p_episode_id INT,
IN p_project_id INT,
IN p_lang varchar(10)
)
BEGIN
	
	DECLARE done INT DEFAULT FALSE;
	DECLARE v_rownum int DEFAULT 0;
	DECLARE v_exists INT DEFAULT -1;

	DECLARE v_script_no BIGINT;
	DECLARE v_template varchar(20);
	DECLARE v_speaker VARCHAR(20);
	DECLARE v_script_data VARCHAR(240);
	DECLARE v_character_expression VARCHAR(30);
	DECLARE v_emoticon_expression VARCHAR(20);

	
	DECLARE v_target_scene_id varchar(40);
	DECLARE v_voice varchar(40);
	DECLARE v_sound_effect varchar(20);


	
	DECLARE c1 CURSOR FOR 	
	SELECT ls.script_no
	     , ls.template 
	     , ls.speaker 
	     , ls.script_data 
	     , ls.character_expression
	     , ls.emoticon_expression 
	     , ls.target_scene_id
	     , ls.voice 
	     , ls.sound_effect 
	 FROM list_script ls
	 WHERE ls.episode_id = p_episode_id 
	 AND ls.lang = p_lang
	 ORDER BY ls.script_no ;
	
	DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;


	DELETE FROM script_validtaion WHERE episode_id = p_episode_id AND lang = p_lang; 

	
OPEN c1;

looping : LOOP

	FETCH c1 INTO v_script_no, v_template, v_speaker, v_script_data, v_character_expression, v_emoticon_expression, v_target_scene_id, v_voice, v_sound_effect;
	
	SET v_rownum = v_rownum + 1;
	
	IF done THEN 
		LEAVE looping;
	END IF;


	
	IF v_template = 'background' THEN
	
		
		SET v_exists = fn_check_background_exists(p_project_id, v_script_data);
	
		
		IF v_exists <= 0 THEN 
		
			INSERT INTO script_validtaion (episode_id, script_no, rownum, validation, lang) VALUES (p_episode_id, v_script_no, v_rownum, CONCAT('배경 리소스 없음 : [', v_script_data, ']'), p_lang);
		
		END IF;
	
	ELSEIF v_template = 'image' THEN
	
		
		SET v_exists = fn_check_image_exists(p_project_id, v_script_data);
	
		
		IF v_exists <= 0 THEN 
		
			INSERT INTO script_validtaion (episode_id, script_no, rownum, validation, lang) VALUES (p_episode_id, v_script_no, v_rownum, CONCAT('이미지 리소스 없음 : [', v_script_data, ']'), p_lang);
		
		END IF;	

	ELSEIF v_template = 'illust' THEN
	
		
		SET v_exists = fn_check_illust_exists(p_project_id, v_script_data);
	
		
		IF v_exists <= 0 THEN 
		
			INSERT INTO script_validtaion (episode_id, script_no, rownum, validation, lang) VALUES (p_episode_id, v_script_no, v_rownum, CONCAT('일러스트 리소스 없음 : [', v_script_data, ']'), p_lang);
		
		END IF;		
	
	ELSEIF v_template = 'live_object' THEN 
	
		
		SET v_exists = fn_check_live_object_exists(p_project_id, v_script_data);
	
		
		IF v_exists <= 0 THEN 
			INSERT INTO script_validtaion (episode_id, script_no, rownum, validation, lang) VALUES (p_episode_id, v_script_no, v_rownum, CONCAT('라이브 오브제 리소스 없음 : [', v_script_data, ']'), p_lang);
		END IF;
	
	ELSEIF v_template = 'bgm' THEN 
	
		
		SET v_exists = fn_check_sound_exists(p_project_id, v_script_data, 'bgm');
	
		
		IF v_exists <= 0 THEN 
			INSERT INTO script_validtaion (episode_id, script_no, rownum, validation, lang) VALUES (p_episode_id, v_script_no, v_rownum, CONCAT('배경음 리소스 없음 : [', v_script_data, ']'), p_lang);
		END IF;
	
	ELSEIF v_template = 'live_object_remove' OR v_template = 'bgm_remove' THEN 
	
		
		SET v_exists = ifnull(LENGTH(v_script_data), 0); 
		
		
		IF v_exists > 0 THEN 
			INSERT INTO script_validtaion (episode_id, script_no, rownum, validation, lang) VALUES (p_episode_id, v_script_no, v_rownum, CONCAT('데이터 입력할 필요 없음 : [', v_script_data, ']'), p_lang);
		END IF; 
	
	END IF ; 

	
	IF ifnull(LENGTH(v_speaker),0) > 0 THEN
		
		
		SET v_exists =  regexp_like(v_speaker, '^*:[^L|R]', 'c');
	
		IF v_exists > 0 THEN 
			INSERT INTO script_validtaion (episode_id, script_no, rownum, validation, lang) VALUES (p_episode_id, v_script_no, v_rownum, CONCAT(':뒤에 L/R만 가능(소문자도 불가능) : [', v_speaker, ']'), p_lang);	
		END IF; 
	
	END IF;

	
	IF ifnull(LENGTH(v_target_scene_id),0) > 0 THEN 
		
		
		SET v_exists = fn_check_episode_exists(p_project_id, p_episode_id, v_target_scene_id);
	
		IF v_exists = 0 THEN 
			INSERT INTO script_validtaion (episode_id, script_no, rownum, validation, lang) VALUES (p_episode_id, v_script_no, v_rownum, CONCAT('해당 ID 없음 : [', v_target_scene_id, ']'), p_lang);
		ELSEIF v_exists < 0 THEN 
			INSERT INTO script_validtaion (episode_id, script_no, rownum, validation, lang) VALUES (p_episode_id, v_script_no, v_rownum, CONCAT('숫자/#숫자/@숫자만 가능 : [', v_target_scene_id, ']'), p_lang);
		END IF; 

	END IF; 

	
	IF ifnull(LENGTH(v_voice), 0) > 0 THEN 
	
		
		SET v_exists = fn_check_sound_exists(p_project_id, v_voice, 'voice');
	
	
		
		IF v_exists <= 0 THEN 
			INSERT INTO script_validtaion (episode_id, script_no, rownum, validation, lang) VALUES (p_episode_id, v_script_no, v_rownum, CONCAT('음성 리소스 없음 : [', v_voice, ']'), p_lang);
		END IF;
		
	END IF;


	
	IF ifnull(LENGTH(v_sound_effect), 0) > 0 THEN 
	
		
		SET v_exists = fn_check_sound_exists(p_project_id, v_sound_effect, 'se');
	
	
		
		IF v_exists <= 0 THEN 
			INSERT INTO script_validtaion (episode_id, script_no, rownum, validation, lang) VALUES (p_episode_id, v_script_no, v_rownum, CONCAT('효과음 리소스 없음 : [', v_sound_effect, ']'), p_lang);
		END IF;
		
	END IF;
	


END LOOP;


CLOSE c1;


	

	
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_send_coin` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`remote`@`115.93.124.202` PROCEDURE `sp_send_coin`(
)
BEGIN

	

	DECLARE done TINYINT DEFAULT FALSE; 

	DECLARE v_userkey BIGINT; 
	declare v_quantity int;


	DECLARE c1 CURSOR FOR

	select userkey, sum(quantity) total from user_mail where mail_type ='inapp'
	and currency = 'gem'
	and purchase_no in (select purchase_no from user_purchase where purchase_date >= '2022-04-13 00:00:00' and purchase_date <= '2022-04-27 23:59:59'
	and product_id <> 'pre_reward_pack') 
	group by userkey
	order by userkey;

	DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;	

	OPEN c1;



	
		looping : LOOP

			FETCH c1 INTO v_userkey, v_quantity;

		

			IF done THEN 

				LEAVE looping;

			END IF;

		

			INSERT INTO user_mail(userkey, mail_type, currency, quantity, expire_date, connected_project) 
		    VALUES(v_userkey, 'event', 'coin', v_quantity, DATE_ADD(NOW(), INTERVAL 1 YEAR), -1);



		

		END LOOP;



	CLOSE c1;



END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_send_first_purchase_reward` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`remote`@`%` PROCEDURE `sp_send_first_purchase_reward`()
BEGIN
	
	DECLARE done TINYINT DEFAULT FALSE; 
	DECLARE v_userkey BIGINT; 	
	
	DECLARE c1 CURSOR FOR
	SELECT DISTINCT userkey 
  	FROM user_purchase up WHERE state > 0;
	 
	 
	DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;


OPEN c1;

	looping : LOOP
	
		FETCH c1 INTO v_userkey;
		
		IF done THEN 
			LEAVE looping;
		END IF;
		
		INSERT INTO user_mail(userkey, mail_type, currency, quantity, expire_date, connected_project) 
      	VALUES(v_userkey, 'first_inapp', 'coin', 10, DATE_ADD(NOW(), INTERVAL 1 YEAR), -1);
      
      	INSERT INTO user_mail(userkey, mail_type, currency, quantity, expire_date, connected_project) 
      	VALUES(v_userkey, 'first_inapp', 'countessOneTime', 2, DATE_ADD(NOW(), INTERVAL 1 YEAR), 57);
      
      	INSERT INTO user_mail(userkey, mail_type, currency, quantity, expire_date, connected_project) 
      	VALUES(v_userkey, 'first_inapp', 'honeybloodOneTime', 2, DATE_ADD(NOW(), INTERVAL 1 YEAR), 60);
	
	END LOOP;

CLOSE c1;

	
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_send_gem_to_all` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`remote`@`%` PROCEDURE `sp_send_gem_to_all`(
_currency VARCHAR(20),
_gemcount INT
)
BEGIN
	
	DECLARE done TINYINT DEFAULT FALSE; 
	DECLARE v_userkey BIGINT; 

	
	
	DECLARE c1 CURSOR FOR
	SELECT ta.userkey 
	  FROM table_account ta 
	 WHERE ta.userkey > 0
	 ORDER BY ta.userkey;
	 
	 
	DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;	
	
	OPEN c1;

		
		looping : LOOP
			FETCH c1 INTO v_userkey;
		
			IF done THEN 
				LEAVE looping;
			END IF;
		
			CALL sp_insert_user_property(v_userkey, _currency, _gemcount, 'dev');

		
		END LOOP;

	CLOSE c1;

END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_send_star_play_refund` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`remote`@`%` PROCEDURE `sp_send_star_play_refund`()
BEGIN
	
	DECLARE done INT DEFAULT FALSE;
	DECLARE v_userkey bigint DEFAULT 0; 
	DECLARE v_total_star INt DEFAULT 0; 
	
	
	DECLARE c1 CURSOR FOR
	SELECT lp.userkey   
     , sum(quantity) total_star
	  FROM gamelog.log_property lp 
	 WHERE lp.log_type = 'use'
	   AND lp.action_date BETWEEN '2022-02-02' AND '2022-03-25'
	   AND lp.currency = 'gem'
	   AND lp.log_code = 'Permanent'
	   AND lp.quantity  > 0
	  GROUP BY userkey
	  ORDER BY userkey;

	DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;

	OPEN c1;

		looping : LOOP
			
			FETCH c1 INTO v_userkey, v_total_star;
	
			IF done THEN 
				LEAVE looping;
			END IF;		
		
			
			INSERT INTO user_mail (userkey, mail_type, currency, quantity, expire_date, connected_project)
			VALUES (v_userkey, 'refund', 'gem', v_total_star, DATE_ADD(NOW(), INTERVAL 1 YEAR), -1);

		
		END LOOP;

	CLOSE c1;

END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_send_to_all` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`remote`@`%` PROCEDURE `sp_send_to_all`(
_currency VARCHAR(20),
_quantity INT,
_type varchar(30)
)
BEGIN
	
	DECLARE done TINYINT DEFAULT FALSE; 
	DECLARE v_userkey BIGINT; 

	
	
	DECLARE c1 CURSOR FOR
	SELECT ta.userkey 
	  FROM table_account ta 
	 WHERE ta.userkey > 0
	 ORDER BY ta.userkey;
	 
	 
	DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;	
	
	OPEN c1;

		
		looping : LOOP
			FETCH c1 INTO v_userkey;
		
			IF done THEN 
				LEAVE looping;
			END IF;
		
			
			INSERT INTO user_mail (userkey, mail_type, currency, quantity, expire_date, connected_project)
			VALUES (v_userkey, _type, _currency, _quantity, DATE_ADD(NOW(), INTERVAL 7 DAY), -1);
		
		
		END LOOP;

	CLOSE c1;

END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_send_user_mail` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`remote`@`%` PROCEDURE `sp_send_user_mail`(
IN _userkey BIGINT,
IN _mail_type VARCHAR(20),
IN _currency VARCHAR(20),
IN _quantity INT,
IN _connected_project INT,
IN _expire INT
)
BEGIN
	
	
	INSERT INTO user_mail (userkey, mail_type, currency, quantity, expire_date, connected_project)
	VALUES (_userkey, _mail_type, _currency, _quantity, DATE_ADD(NOW(), INTERVAL _expire DAY), _connected_project);


	
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_send_user_short_mail` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`remote`@`%` PROCEDURE `sp_send_user_short_mail`(
IN _userkey BIGINT,
IN _mail_type VARCHAR(20),
IN _currency VARCHAR(20),
IN _quantity INT,
IN _connected_project INT,
IN _expire INT
)
BEGIN
	
	-- 시간으로 EXPIRE. 
	INSERT INTO user_mail (userkey, mail_type, currency, quantity, expire_date, connected_project)
	VALUES (_userkey, _mail_type, _currency, _quantity, DATE_ADD(NOW(), INTERVAL _expire HOUR), _connected_project);


	
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_set_beginner_achievement` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`remote`@`%` PROCEDURE `sp_set_beginner_achievement`(
_achievement_id int
)
BEGIN
   
   DECLARE done INT DEFAULT FALSE;
   DECLARE v_userkey bigint DEFAULT 0; 
   DECLARE v_value int DEFAULT 0;
   DECLARE v_check int DEFAULT 0;
   DECLARE v_action_date datetime DEFAULT '2022-04-13 13:00:00';
  
   
   DECLARE c1 CURSOR FOR
   SELECT userkey
   FROM table_account ta 
   WHERE createtime <= '2022-04-20 13:59:59';

   DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;

   OPEN c1;

      looping : LOOP
         
         FETCH c1 INTO v_userkey;
   
         IF done THEN 
            LEAVE looping;
         END IF;      
      
      
         IF _achievement_id = 1 THEN  
            
            SELECT 
            CASE WHEN account_link = 'link' THEN 1 ELSE 0 END account_link_check
            INTO v_value
            FROM table_account ta 
            WHERE userkey = v_userkey;
                  
         ELSEIF _achievement_id = 2 THEN 
         	
         	SELECT ifnull(count(*), 0) 
         	INTO v_value 
         	FROM user_attendance ua 
         	WHERE userkey = v_userkey 
         	AND action_date <= v_action_date;
         	
         ELSEIF _achievement_id = 3 THEN 
         
         	SELECT ifnull(count(*), 0)
         	INTO v_value 
         	FROM user_coin_purchase ucp 
         	WHERE userkey = v_userkey 
         	AND coin_purchase_date <= v_action_date;
         
         ELSEIF _achievement_id = 4 THEN 
         
         	SELECT ifnull(count(*), 0)
         	INTO v_value 
         	FROM user_illust ui 
         	WHERE userkey = v_userkey 
         	AND illust_type ='live2d'
         	AND open_date <= v_action_date;
         
         ELSEIF _achievement_id = 5 THEN 
         	
         	SELECT ifnull(count(*), 0) 
         	INTO v_value 
         	FROM user_selection_purchase usp 
         	WHERE userkey = v_userkey
         	AND purchase_date <= v_action_date;
         
         ELSEIF _achievement_id = 6 THEN  
         
         	SELECT ifnull(count(*), 0)
         	INTO v_value 
         	FROM gamelog.log_action la 
         	WHERE userkey = v_userkey
         	AND action_type = 'waitingOpenCoin'
         	AND CAST(JSON_EXTRACT(la.log_data, '$.price') AS UNSIGNED integer) <> 0
         	AND action_date <= v_action_date;
         
         END IF;
        
         IF v_value > 0 THEN
       		
         	
	        SELECT fn_check_achievement_exists(v_userkey, _achievement_id)
	        INTO v_check
	        FROM DUAL;     
        	
	       
	       	IF v_check < 1 THEN 
	       	
	       		INSERT INTO user_achievement (userkey, achievement_id, current_result) VALUES(v_userkey, _achievement_id, v_value);
	       	
	       	ELSE 
	       	
	       		UPDATE user_achievement 
	       		SET current_result = current_result + v_value
	       		WHERE userkey = v_userkey 
	       		AND achievement_id = _achievement_id; 
	       	
	       	END IF; 

         END IF; 

      
      END LOOP;

   CLOSE c1;

END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_update_admin_info` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`remote`@`%` PROCEDURE `sp_update_admin_info`(
IN _user_id varchar(30),
IN _user_name varchar(30),
IN _email varchar(50), 
IN _organization varchar(40)
)
BEGIN
	
	
	DECLARE v_exists TINYINT DEFAULT 0;
	SELECT EXISTS (SELECT * FROM admin_account aa WHERE user_id = _user_id AND email = _email)
	       INTO v_exists
	       FROM DUAL;
	
	      
	IF v_exists > 0 THEN 	
	
		
		UPDATE admin_account 
		   SET user_name = _user_name
		     , organization = _organization
		 WHERE user_id = _user_id;
		   
	ELSE 	
		
		INSERT INTO admin_account (user_id, user_name, email, organization)
		VALUES(_user_id, _user_name, _email, _organization);

	END IF;



	
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_update_ar_selection` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`remote`@`%` PROCEDURE `sp_update_ar_selection`(
IN _project_id INT 
)
BEGIN
	
	DECLARE v_script_data varchar(240); 
	DECLARE v_episode_id int; 
	DECLARE v_selection_group int;
	DECLARE v_selection_no int; 
	
	DECLARE cursor_finished INTEGER DEFAULT 0;

	DECLARE prop_cur CURSOR FOR
	SELECT script_data 
	, ls2.episode_id 
	, ls2.selection_group 
	, ls2.selection_no
	FROM list_script ls, list_selection ls2
	WHERE ls.project_id = ls2.project_id 
	AND ls.episode_id = ls2.episode_id 
	AND ls.selection_group = ls2.selection_group
	AND ls.selection_no = ls2.selection_no 
	AND ls.episode_id IN (SELECT episode_id FROM list_episode le WHERE le.project_id= _project_id)
	AND ls.lang = 'AR'
	AND ls.template = 'selection'
	AND (AR IS NULL OR AR = '');
	       
	DECLARE CONTINUE HANDLER FOR NOT FOUND SET cursor_finished = 1;
	

	
	OPEN prop_cur;
	
		
		LOOPING:LOOP
			FETCH prop_cur INTO v_script_data, v_episode_id, v_selection_group, v_selection_no;
		
			IF cursor_finished = 1 THEN
				LEAVE LOOPING;
			END IF;
		
			
			UPDATE list_selection 
			SET AR = v_script_data
			WHERE project_id = _project_id 
			AND episode_id = v_episode_id
			AND selection_group = v_selection_group
			AND selection_no = v_selection_no;
		
		END LOOP LOOPING;
	
	CLOSE prop_cur;
	
	
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_update_attendance_daily` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`remote`@`%` PROCEDURE `sp_update_attendance_daily`(
IN _attendance_id INT,
IN _day_seq INT,
IN _currency varchar(20),
IN _quantity int
)
BEGIN

	DECLARE v_check TINYINT DEFAULT 0;
	
	
	SELECT EXISTS (SELECT * FROM com_attendance_daily cad WHERE attendance_id = _attendance_id AND day_seq = _day_seq )
	INTO v_check
	FROM DUAL;
	  
	IF v_check < 1 THEN
		INSERT INTO com_attendance_daily (attendance_id, day_seq, currency, quantity) VALUES(_attendance_id, _day_seq, _currency, _quantity);
	ELSE 
		UPDATE com_attendance_daily
		SET currency= _currency
		, quantity = _quantity
		WHERE attendance_id = _attendance_id AND day_seq = _day_seq;
	END IF;

	
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_update_bg` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`remote`@`%` PROCEDURE `sp_update_bg`(
IN _project_id INT,
IN _image_name varchar(30),
IN _image_url varchar(160),
IN _image_key VARCHAR(120),
IN _bucket VARCHAR(30)
)
BEGIN
	
	DECLARE v_exists NUMERIC DEFAULT 0;
	DECLARE v_key VARCHAR(120) DEFAULT NULL;
	DECLARE v_bucket VARCHAR(30) DEFAULT NULL;

	SELECT EXISTS (SELECT bg_id FROM list_bg WHERE project_id = _project_id AND image_name = _image_name)
	  INTO v_exists
	  FROM DUAL;
	 
	IF v_exists > 0 THEN 
		
		
		SELECT image_key, bucket 
		  INTO v_key, v_bucket
		  FROM list_bg 
		 WHERE project_id = _project_id
		   AND image_name = _image_name;

		  IF v_bucket IS NOT NULL THEN
				
				INSERT INTO table_stashed_s3 (project_id, object_key, bucket) VALUES (_project_id, v_key, v_bucket);
	 	  END IF;
		
		
		UPDATE list_bg
		  SET image_url = _image_url
		    , image_key = _image_key
		    , bucket = _bucket
		    , game_scale = 2 
		 WHERE project_id  = _project_id 
		   AND image_name  = _image_name;
		  
		 
		  
 	ELSE 
 	
 		INSERT INTO list_bg(project_id, image_name, image_url, image_key, bucket) VALUES (_project_id, _image_name, _image_url, _image_key, _bucket);
		
	
	END IF;



	
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_update_bubble_zip` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`remote`@`%` PROCEDURE `sp_update_bubble_zip`(
IN _template varchar(30),
IN _image_name varchar(30),
IN _image_url varchar(160),
IN _image_key VARCHAR(120),
IN _bucket VARCHAR(30)
)
BEGIN

	
	
	DECLARE v_exists NUMERIC DEFAULT 0;
	DECLARE v_key VARCHAR(120) DEFAULT NULL;
	DECLARE v_bucket VARCHAR(30) DEFAULT NULL;

	SELECT EXISTS (SELECT bubble_sprite_id FROM com_bubble_sprite cbs WHERE image_name = _image_name AND template = _template)
	  INTO v_exists
	  FROM DUAL;
	 
	IF v_exists > 0 THEN 
	
		
		SELECT cbs.image_key , cbs.bucket 
		  INTO v_key, v_bucket
		  FROM com_bubble_sprite cbs 
		 WHERE cbs.template = _template
		   AND cbs.image_name = _image_name;
		  
		IF v_bucket IS NOT NULL THEN
			INSERT INTO table_stashed_s3 (project_id, object_key, bucket) VALUES (-1, v_key, v_bucket);
		END IF;
		  
		
		UPDATE com_bubble_sprite
		  SET image_url = _image_url
		    , image_key = _image_key
		    , bucket = _bucket
		 WHERE image_name  = _image_name 
		   AND template  = _template;
		   
		  
 	ELSE 
 	
 		INSERT INTO com_bubble_sprite (image_name, image_url, image_key, bucket, template) VALUES (_image_name, _image_url, _image_key, _bucket, _template);
		
	
	END IF;
	
		
	
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_update_challenge_detail` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`remote`@`%` PROCEDURE `sp_update_challenge_detail`(
IN _project_id INT,
IN _lang VARCHAR(10),
IN _title VARCHAR(30),
IN _hint VARCHAR(100)
)
BEGIN
	
	DECLARE v_challenge_no INT DEFAULT 0;
	DECLARE v_exists NUMERIC DEFAULT 0;
	
	
	
	SELECT a.challenge_no 
	  INTO v_challenge_no
	  FROM list_challenge a
	 WHERE a.project_id = _project_id 
	   AND a.challenge_name = _title;
	
	
	SELECT fn_check_challenge_lang_exists(v_challenge_no, _lang) 
	  INTO v_exists
	  FROM DUAL;
	 
	IF v_exists > 0 THEN 
		UPDATE list_challenge_detail 
		   SET challenge_name = _title
		     , challenge_hint = _hint
		 WHERE challenge_no = v_challenge_no
		   AND lang = _lang;
	
	ELSE 
		INSERT INTO list_challenge_detail(challenge_no, lang, challenge_name, challenge_hint)
		VALUES (v_challenge_no, _lang, _title, _hint);

	END IF;
	

END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_update_challenge_zip` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`remote`@`%` PROCEDURE `sp_update_challenge_zip`(
IN _project_id INT,
IN _image_name varchar(30),
IN _image_url varchar(160),
IN _image_key VARCHAR(120)
)
begin
		
	
	DECLARE v_exists NUMERIC DEFAULT 0;

	SELECT EXISTS (SELECT minicut_id FROM list_minicut lm WHERE project_id = _project_id AND image_name = _image_name)
	  INTO v_exists
	  FROM DUAL;
	 
	IF v_exists > 0 THEN 
	
		UPDATE list_minicut
		  SET image_url = _image_url
		    , image_key = _image_key
		 WHERE project_id  = _project_id 
		   AND image_name  = _image_name;
		  
 	ELSE 
 	
 		INSERT INTO list_minicut(project_id, image_name, image_url, image_key) VALUES (_project_id, _image_name, _image_url, _image_key);
		
	
	END IF;

END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_update_coin_exchange` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`remote`@`%` PROCEDURE `sp_update_coin_exchange`(
IN _exchange_product_id INT,
IN _star_quantity INT,
IN _coin_quantity INT, 
IN _bonus_quantity INT, 
IN _daily_purchase_cnt INT,
IN _is_service INT
)
BEGIN
		
	

	IF _exchange_product_id = 0 THEN 
	
		INSERT INTO com_coin_exchange_product (star_quantity, coin_quantity, bonus_quantity, daily_purchase_cnt, is_service) 
		VALUES(_star_quantity, _coin_quantity, _bonus_quantity, _daily_purchase_cnt, _is_service );

	ELSE
	
		UPDATE com_coin_exchange_product
		SET star_quantity= _star_quantity
		, coin_quantity = _coin_quantity
		, bonus_quantity= _bonus_quantity
		, daily_purchase_cnt= _daily_purchase_cnt
		, is_service= _is_service
		WHERE exchange_product_id = _exchange_product_id;
	
	
	END IF;
	
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_update_coin_product_lang` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`remote`@`%` PROCEDURE `sp_update_coin_product_lang`(
IN _coin_product_id INT,
IN _lang varchar(2),
IN _name varchar(60)
)
BEGIN

	DECLARE v_check TINYINT DEFAULT 0;
	
	
	SELECT EXISTS (SELECT * FROM com_coin_product_detail ccpd WHERE coin_product_id = _coin_product_id AND lang = _lang)
	  INTO v_check
	  FROM DUAL;
	 
	 
	IF v_check < 1 THEN
		INSERT INTO com_coin_product_detail (coin_product_id, lang, name) VALUES(_coin_product_id, _lang, _name);
	ELSE 
		UPDATE com_coin_product_detail
		SET name = _name
		WHERE coin_product_id = _coin_product_id AND lang = _lang;
	END IF;

	
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_update_coin_product_local_text` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`remote`@`%` PROCEDURE `sp_update_coin_product_local_text`()
BEGIN

DECLARE v_product_id INT DEFAULT 0;
DECLARE v_ko VARCHAR(120);
DECLARE v_en VARCHAR(120);
DECLARE v_ja VARCHAR(120);
DECLARE v_check int DEFAULT 0;	
	
DECLARE cursor_finished INTEGER DEFAULT 0;
DECLARE product_cur CURSOR FOR	
SELECT ccp.coin_product_id 
     , fn_get_localize_text(cc.local_code, 'KO') ko
     , fn_get_localize_text(cc.local_code, 'EN') en
     , fn_get_localize_text(cc.local_code, 'JA') ja
  FROM com_currency cc
     , list_project_master a
     , com_coin_product ccp 
 WHERE cc.currency_type IN ('wallpaper', 'standing', 'sticker', 'bubble')
   AND cc.is_use > 0
   AND a.project_id = cc.connected_project 
   AND a.is_deploy  > 0
   AND ccp.currency = cc.currency 
ORDER BY cc.connected_project, cc.dev_name;	

DECLARE CONTINUE HANDLER FOR NOT FOUND SET cursor_finished = 1;


OPEN product_cur;

	LOOPING:LOOP
	
		FETCH product_cur INTO v_product_id, v_ko, v_en, v_ja;
	
		IF cursor_finished = 1 THEN
			LEAVE LOOPING;
		END IF;	
		
		
		SELECT EXISTS (SELECT z.* FROM com_coin_product_detail z WHERE z.coin_product_id= v_product_id AND z.lang = 'KO')
		INTO v_check 
		FROM DUAL;
	
		IF v_check > 0 THEN 
		
			UPDATE com_coin_product_detail
			   SET name = v_ko 
			 WHERE lang = 'KO'
  			   AND coin_product_id = v_product_id ;
		
		ELSE 
			INSERT INTO com_coin_product_detail (coin_product_id, lang, name) VALUES (v_product_id, 'KO', v_ko);
		END IF;
		
		
		SELECT EXISTS (SELECT z.* FROM com_coin_product_detail z WHERE z.coin_product_id= v_product_id AND z.lang = 'EN')
		INTO v_check 
		FROM DUAL;
	
		IF v_check > 0 THEN 
		
			UPDATE com_coin_product_detail
			   SET name = v_en 
			 WHERE lang = 'EN'
			   AND coin_product_id = v_product_id ;
		
		ELSE 
			INSERT INTO com_coin_product_detail (coin_product_id, lang, name) VALUES (v_product_id, 'EN', v_en);
		END IF;
	

		
		SELECT EXISTS (SELECT z.* FROM com_coin_product_detail z WHERE z.coin_product_id= v_product_id AND z.lang = 'JA')
		INTO v_check 
		FROM DUAL;
	
		IF v_check > 0 THEN 
		
			UPDATE com_coin_product_detail
			   SET name = v_ja 
			 WHERE lang = 'JA'
			   AND coin_product_id = v_product_id;
		
		ELSE 
			INSERT INTO com_coin_product_detail (coin_product_id, lang, name) VALUES (v_product_id, 'JA', v_ja);
		END IF;	
	
	END LOOP LOOPING;



CLOSE product_cur;

	
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_update_coin_product_set` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`remote`@`%` PROCEDURE `sp_update_coin_product_set`(
IN _coin_product_id INT,
IN _currency varchar(20)
)
BEGIN

	DECLARE v_check TINYINT DEFAULT 0;
	
	
	SELECT EXISTS (SELECT * FROM com_coin_product_set ccps WHERE coin_product_id = _coin_product_id AND currency = _currency)
	  INTO v_check
	  FROM DUAL;
	 
	 
	IF v_check < 1 THEN
		INSERT INTO com_coin_product_set (coin_product_id, currency) VALUES(_coin_product_id, _currency);
	END IF;

	
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_update_comming_lang` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`remote`@`%` PROCEDURE `sp_update_comming_lang`(
IN _comming_id INT,
IN _lang varchar(2),
IN _title varchar(60)
)
BEGIN

	DECLARE v_check TINYINT DEFAULT 0;
	
	
	SELECT EXISTS (SELECT * FROM com_comming_lang ccl WHERE comming_id = _comming_id AND lang = _lang )
	INTO v_check
	FROM DUAL;
	  
	IF v_check < 1 THEN
		INSERT INTO com_comming_lang (comming_id, lang, title) VALUES(_comming_id, _lang, _title);
	ELSE 
		UPDATE com_comming_lang
		SET title= _title
		WHERE comming_id = _comming_id AND lang = _lang;
	END IF;

	
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_update_com_localize` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`remote`@`%` PROCEDURE `sp_update_com_localize`(
IN _id INT,
IN _ko VARCHAR(300), 
IN _en VARCHAR(300),
IN _ja VARCHAR(300),
IN _zh VARCHAR(300), 
IN _sc VARCHAR(300),
IN _ar VARCHAR(300),
IN _ms VARCHAR(300),
IN _es VARCHAR(300),
IN _ru VARCHAR(300)
)
BEGIN
	
	DECLARE v_exists TINYINT DEFAULT 0;
	SELECT EXISTS (SELECT * FROM com_localize a WHERE a.id = _id)
	       INTO v_exists
	       FROM DUAL;
	            
	IF v_exists > 0 THEN 	
	
		
		UPDATE com_localize 
		   SET KO = _ko
		     , EN = _en
		     , JA = _ja
		     , ZH = _zh
		     , SC = _sc
		     , AR = _ar
		     , MS = _ms
		     , ES = _es
		     , RU = _ru
		 WHERE id = _id;
		   
	ELSE 	
		
		INSERT INTO com_localize(id, KO, EN, JA, ZH, SC, AR, MS, ES, RU)
		VALUES(_id, _ko, _en, _ja, _zh, _sc, _ar, _ms, _es, _ru);

	END IF;

	
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_update_com_survey_localize` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`remote`@`%` PROCEDURE `sp_update_com_survey_localize`(
IN _id INT,
IN _ko VARCHAR(300), 
IN _en VARCHAR(300),
IN _ja VARCHAR(300),
IN _zh VARCHAR(300), 
IN _sc VARCHAR(300),
IN _ar VARCHAR(300),
IN _ms VARCHAR(300),
IN _es VARCHAR(300),
IN _ru VARCHAR(300)
)
BEGIN
	
	DECLARE v_exists TINYINT DEFAULT 0;
	SELECT EXISTS (SELECT * FROM com_survey_localize a WHERE a.id = _id)
	       INTO v_exists
	       FROM DUAL;
	            
	IF v_exists > 0 THEN 	
	
		
		UPDATE com_survey_localize 
		   SET KO = _ko
		     , EN = _en
		     , JA = _ja
		     , ZH = _zh
		     , SC = _sc
		     , AR = _ar
		     , MS = _ms
		     , ES = _es
		     , RU = _ru
		 WHERE id = _id;
		   
	ELSE 	
		
		INSERT INTO com_survey_localize(id, KO, EN, JA, ZH, SC, AR, MS, ES, RU)
		VALUES(_id, _ko, _en, _ja, _zh, _sc, _ar, _ms, _es, _ru);

	END IF;

	
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_update_coupon_master` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`remote`@`%` PROCEDURE `sp_update_coupon_master`(
IN _coupon_id INT,
IN _coupon_name varchar(60),
IN _coupon_type varchar(20), 
IN _keyword varchar(20), 
IN _start_date datetime,
IN _end_date datetime,
IN _use_limit INT,
IN _issue_count int, 
IN _project_id int,
IN _unlock_dlc_id int,
IN _admin_id varchar(30)
)
BEGIN
		
	

	IF _coupon_id = 0 THEN 
	
		INSERT INTO com_coupon_master (coupon_id, coupon_name,  coupon_type, keyword, start_date, end_date, use_limit, issue_count, remain_keyword_count, admin_id, project_id, unlock_dlc_id) 
		VALUES(_coupon_id, _coupon_name, _coupon_type, _keyword, _start_date, _end_date, _use_limit, _issue_count, _issue_count, _admin_id, _project_id, _unlock_dlc_id);

	ELSE
		UPDATE com_coupon_master
		SET coupon_name=_coupon_name
		, coupon_type = _coupon_type
		, keyword=_keyword
		, start_date=_start_date
		, end_date=_end_date
		, use_limit=_use_limit
		, issue_count =_issue_count
		, admin_id=_admin_id
		, project_id = _project_id
		, unlock_dlc_id = _unlock_dlc_id
		WHERE coupon_id=_coupon_id;
	
	
	END IF;
	
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_update_coupon_reward` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`remote`@`%` PROCEDURE `sp_update_coupon_reward`(
IN _coupon_id INT,
IN _currency varchar(20),
IN _quantity int 
)
BEGIN
		
	

	DECLARE v_check TINYINT DEFAULT 0;
	
	
	SELECT EXISTS (SELECT * FROM com_coupon_reward WHERE coupon_id = _coupon_id AND currency = _currency)
	  INTO v_check
	  FROM DUAL;
	 
	 
	IF v_check < 1 THEN
		INSERT INTO com_coupon_reward (coupon_id, currency, quantity) VALUES(_coupon_id, _currency, _quantity);
	ELSE 
		UPDATE com_coupon_reward
		SET quantity= _quantity
		WHERE coupon_id = _coupon_id AND currency = _currency;
	END IF;
	
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_update_design_zip` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`remote`@`%` PROCEDURE `sp_update_design_zip`(
IN _project_id INT,
IN _design_type VARCHAR(30),
IN _image_name varchar(30),
IN _image_url varchar(160),
IN _image_key VARCHAR(120),
IN _bucket VARCHAR(30)
)
BEGIN
	
	
	
	DECLARE v_exists NUMERIC DEFAULT 0;
	DECLARE v_key VARCHAR(120) DEFAULT NULL;
	DECLARE v_bucket VARCHAR(30) DEFAULT NULL;

	SELECT EXISTS (SELECT ld.design_id FROM list_design ld WHERE project_id = _project_id AND image_name = _image_name AND design_type = _design_type)
	  INTO v_exists
	  FROM DUAL;
	 
	IF v_exists > 0 THEN 
	
		
		SELECT image_key, bucket 
		  INTO v_key, v_bucket
		  FROM list_design
		 WHERE project_id = _project_id
		   AND image_name = _image_name
  		   AND design_type = _design_type;
		  
		IF v_bucket IS NOT NULL THEN
			
			INSERT INTO table_stashed_s3 (project_id, object_key, bucket) VALUES (_project_id, v_key, v_bucket);	
		END IF;
	
		
		UPDATE list_design
		  SET image_url = _image_url
		    , image_key = _image_key
		    , bucket = _bucket
		 WHERE project_id  = _project_id 
		   AND image_name  = _image_name
		   AND design_type = _design_type;
		  
 	ELSE 
 	
 		INSERT INTO list_design(project_id, design_type, image_name, image_url, image_key, bucket) VALUES (_project_id, _design_type, _image_name, _image_url, _image_key, _bucket);
		
	
	END IF;


	
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_update_episode_detail` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`remote`@`%` PROCEDURE `sp_update_episode_detail`(
IN _episode_id int,
IN _lang varchar(10),
IN _title varchar(60),
IN _summary VARCHAR(500)
)
BEGIN
		
	DECLARE v_exists NUMERIC DEFAULT 0;
	SELECT fn_check_episode_lang_exists(_episode_id, _lang) 
	  INTO v_exists
      FROM DUAL;
     
    IF v_exists > 0 THEN 
	UPDATE list_episode_detail 
        SET title = _title
          , summary = _summary
      WHERE episode_id = _episode_id
        AND lang = _lang;
       
	ELSE 
		INSERT INTO list_episode_detail (episode_id, lang, title, summary)
		VALUES (_episode_id, _lang, _title, _summary);
       
    END IF; 
   
   
   IF _lang = 'KO' THEN
   	UPDATE list_episode 
   	   SET title = _title
   	     , summary = _summary
   	 WHERE episode_id = _episode_id;
   
   END IF;
   
	
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_update_illust_localized_text` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`remote`@`%` PROCEDURE `sp_update_illust_localized_text`(
IN _illust_id INT,
IN _illust_type VARCHAR(20), 
IN _public_name VARCHAR(60),
IN _summary VARCHAR(500),
IN _lang VARCHAR(10)
)
BEGIN
	
	DECLARE v_exists TINYINT DEFAULT 0;
	SELECT EXISTS (SELECT * 
	                 FROM list_illust_lang a 
	                WHERE a.illust_id = _illust_id
	                  AND a.illust_type = _illust_type
	                  AND a.lang = _lang)
	       INTO v_exists
	       FROM DUAL;
	      
	      
	IF v_exists > 0 THEN
	
	
		UPDATE list_illust_lang 
		   SET public_name = _public_name
		     , summary  = _summary
		 WHERE illust_id = _illust_id
		   AND illust_type = _illust_type
		   AND lang = _lang;
		   
	
	ELSE
	
		INSERT INTO list_illust_lang (illust_id, illust_type, lang, public_name, summary)
		VALUES(_illust_id, _illust_type, _lang, _public_name, _summary);

	
	END IF;



	
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_update_image_zip` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`remote`@`%` PROCEDURE `sp_update_image_zip`(
IN _project_id INT,
IN _image_name varchar(60),
IN _image_url varchar(160),
IN _image_key VARCHAR(120),
IN _bucket VARCHAR(30),
IN _minicut_id INT,
IN _minicut_type VARCHAR(20),
IN _lang VARCHAR(10)
)
BEGIN
	
	
	
	DECLARE v_exists NUMERIC DEFAULT 0;
	DECLARE v_key VARCHAR(120) DEFAULT NULL;
	DECLARE v_bucket VARCHAR(30) DEFAULT NULL;

	SELECT EXISTS (SELECT minicut_id FROM list_minicut lm WHERE project_id = _project_id AND image_name = _image_name)
	  INTO v_exists
	  FROM DUAL;
	 
	IF v_exists > 0 THEN 
	
		
		SELECT image_key, bucket 
		  INTO v_key, v_bucket
		  FROM list_minicut
		 WHERE project_id = _project_id
		   AND image_name = _image_name;
		  
		IF v_bucket IS NOT NULL THEN
			
			INSERT INTO table_stashed_s3 (project_id, object_key, bucket) VALUES (_project_id, v_key, v_bucket);	
		END IF;
	
		
		UPDATE list_minicut
		  SET image_url = _image_url
		    , image_key = _image_key
		    , bucket = _bucket
		 WHERE project_id  = _project_id 
		   AND image_name  = _image_name;
		  
		
		SET _minicut_id = (SELECT minicut_id FROM list_minicut WHERE project_id = _project_id AND image_name = _image_name);
		  
 	ELSE 
 	
 		INSERT INTO list_minicut(project_id, image_name, image_url, image_key, bucket) VALUES (_project_id, _image_name, _image_url, _image_key, _bucket);
		
		
		SET _minicut_id = (SELECT MAX(minicut_id) FROM list_minicut);		
	
	END IF;

	SET v_exists = 0; 

	
	SELECT EXISTS (SELECT minicut_id FROM list_minicut_lang WHERE minicut_id = _minicut_id AND minicut_type = _minicut_type AND lang = _lang)
	INTO v_exists
	FROM DUAL;

	IF v_exists > 0 THEN 
		
		
	    UPDATE list_minicut_lang SET public_name = _image_name
		 WHERE minicut_id = _minicut_id AND  minicut_type = _minicut_type AND lang  = _lang;
		 
	ELSE 
	
		
		INSERT INTO list_minicut_lang (minicut_id, minicut_type, lang, public_name, summary)
		VALUES(_minicut_id, _minicut_type, _lang, _image_name, null);

	END IF;
	
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_update_level` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`remote`@`%` PROCEDURE `sp_update_level`(
IN _next_level int,
IN _experience int,
IN _currency varchar(20),
IN _quantity int
)
BEGIN

	DECLARE v_check TINYINT DEFAULT 0;
	
	
	SELECT EXISTS (SELECT * FROM com_level_management clm WHERE next_level = _next_level)
	INTO v_check
	FROM DUAL;
	 
	 
	IF v_check < 1 THEN
		INSERT INTO com_level_management (next_level, experience, currency, quantity) VALUES(_next_level, _experience, _currency, _quantity);
	ELSE 
		UPDATE com_level_management
		SET experience= _experience
		, currency = _currency
		, quantity = _quantity
		, update_date  = now()
		WHERE next_level = _next_level;
	END IF;

	
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_update_live_script` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`remote`@`%` PROCEDURE `sp_update_live_script`(
IN _episode_id INT,
IN _lang VARCHAR(10)
)
BEGIN

	
	DELETE FROM fed.list_script WHERE episode_id = _episode_id AND lang = _lang;

	
	INSERT INTO fed.list_script
	SELECT ls.*
      FROM list_script ls
     WHERE ls.episode_id = _episode_id
       AND ls.lang = _lang;
      

END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_update_live_script_all` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`remote`@`%` PROCEDURE `sp_update_live_script_all`(
IN _project_id INT,
IN _lang VARCHAR(10)
)
BEGIN
	
	DECLARE done TINYINT DEFAULT FALSE; 
	DECLARE v_episode_id INT;
	
	DECLARE c1 CURSOR FOR
	SELECT a.episode_id
	  FROM list_episode a
	 WHERE a.project_id = _project_id
	 ORDER BY a.episode_id ;
	
	DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;	

	OPEN c1;
		looping : LOOP
			FETCH C1 INTO v_episode_id;
		
			IF done THEN
				LEAVE looping;
			END IF;
		
			CALL sp_update_live_script (v_episode_id, _lang);
			
		END LOOP;
		


	CLOSE c1;
	
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_update_loading_text` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`remote`@`%` PROCEDURE `sp_update_loading_text`(
IN _loading_id INT,
IN _lang VARCHAR(10),
IN _loading_text VARCHAR(160),
IN _detail_no INT
)
BEGIN
	
	 
	IF _detail_no > 0 THEN
	
		UPDATE list_loading_detail 
		   SET loading_text  = TRIM(_loading_text)
		  WHERE detail_no = _detail_no;

	ELSE
	
		INSERT INTO list_loading_detail (loading_id, lang, loading_text) VALUES (_loading_id, _lang, _loading_text);
	
	END IF;
	
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_update_main_loading_lang` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`remote`@`%` PROCEDURE `sp_update_main_loading_lang`(
IN _main_loading_id INT,
IN _image_id int, 
IN _lang varchar(2),
IN _title varchar(60)
)
BEGIN

	DECLARE v_check TINYINT DEFAULT 0;
	
	
	SELECT EXISTS (SELECT * FROM list_main_loading_lang lmll WHERE main_loading_id = _main_loading_id AND lang = _lang)
	  INTO v_check
	  FROM DUAL;
	 
	 
	IF v_check < 1 THEN
		INSERT INTO list_main_loading_lang (main_loading_id, image_id, lang, title) VALUES( _main_loading_id, _image_id, _lang, _title );
	ELSE 
		UPDATE list_main_loading_lang
		SET image_id = _image_id
		, title = _title
		WHERE main_loading_id = _main_loading_id AND lang = _lang;
	END IF;

	
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_update_minicut_localized_text` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`remote`@`%` PROCEDURE `sp_update_minicut_localized_text`(
IN _minicut_id INT,
IN _minicut_type VARCHAR(20), 
IN _public_name VARCHAR(60),
IN _summary VARCHAR(500),
IN _lang VARCHAR(10)
)
BEGIN
	
	DECLARE v_exists TINYINT DEFAULT 0;
	SELECT EXISTS (SELECT * 
	                 FROM list_minicut_lang a 
	                WHERE a.minicut_id = _minicut_id
	                  AND a.minicut_type = _minicut_type
	                  AND a.lang = _lang)
	       INTO v_exists
	       FROM DUAL;
	      
	      
	IF v_exists > 0 THEN 	
	
		
		UPDATE list_minicut_lang 
		   SET public_name = _public_name
		     , summary  = _summary
		 WHERE minicut_id = _minicut_id
		   AND minicut_type = _minicut_type
		   AND lang = _lang;
		   
	ELSE 	
		
		INSERT INTO list_minicut_lang (minicut_id, minicut_type, lang, public_name, summary)
		VALUES(_minicut_id, _minicut_type, _lang, _public_name, _summary);

	
	END IF;



	
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_update_mission` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`remote`@`%` PROCEDURE `sp_update_mission`(
IN _mission_id INT,
IN _mission_name VARCHAR(60),
IN _mission_hint VARCHAR(500),
IN _mission_type VARCHAR(20),
IN _is_hidden TINYINT,
IN _mission_condition VARCHAR(20),
IN _mission_figure INT,
IN _id_condition VARCHAR(160),
IN _reward_exp INT,
IN _reward_currency VARCHAR(20),
IN _reward_quantity INT,
IN _image_url VARCHAR(160),
IN _image_key VARCHAR(120),
IN _lang VARCHAR(10) 
)
BEGIN


UPDATE list_mission
SET mission_name = CASE WHEN _lang = 'KO' THEN _mission_name ELSE mission_name END, 
	mission_hint = CASE WHEN _lang = 'KO' THEN _mission_hint ELSE mission_hint END,
	mission_type = _mission_type, 
	is_hidden = _is_hidden, 
	mission_condition= _mission_condition, 
	mission_figure= ifnull(_mission_figure, 0), 
	id_condition= _id_condition, 
	reward_exp= _reward_exp, 
	reward_currency= _reward_currency, 
	reward_quantity= _reward_quantity, 
	image_url= ifnull(_image_url, image_url), 
	image_key= ifnull(_image_key, image_key)
WHERE mission_id= _mission_id;



CALL sp_update_mission_lang(_mission_id, _lang, _mission_name, _mission_hint);

	
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_update_mission_lang` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`remote`@`%` PROCEDURE `sp_update_mission_lang`(
IN _mission_id INT,
IN _lang VARCHAR(10),
IN _name VARCHAR(60),
IN _hint VARCHAR(500)
)
BEGIN
	
DECLARE v_mission_id INT DEFAULT 0;
DECLARE v_exists NUMERIC DEFAULT 0;


SELECT fn_check_mission_lang_exists (_mission_id, _lang)
  INTO v_exists
  FROM DUAL;
 

 IF v_exists > 0 THEN
 
 	
 	UPDATE list_mission_lang 
 	   SET mission_name = _name
 	     , mission_hint = _hint
 	 WHERE mission_id = _mission_id
 	   AND lang = _lang;
 
 
 ELSE 
 
 	
 	INSERT INTO list_mission_lang (mission_id, lang, mission_name, mission_hint)
 	VALUES (_mission_id, _lang, _name, _hint);
 
 END IF;


	
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_update_mission_new` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`remote`@`%` PROCEDURE `sp_update_mission_new`(
IN _mission_name VARCHAR(60),
IN _mission_hint VARCHAR(500),
IN _mission_type VARCHAR(20),
IN _is_hidden TINYINT,
IN _project_id INT,
IN _mission_condition VARCHAR(20),
IN _mission_figure INT,
IN _id_condition VARCHAR(2000),
IN _detail_hint INT,
IN _reward_exp INT, 
IN _reward_currency VARCHAR(20),
IN _reward_quantity INT,
IN _image_url VARCHAR(160),
IN _image_key VARCHAR(120),
IN _mission_id INT 
)
BEGIN

	DECLARE v_current_id INT DEFAULT 0;
	

	IF _mission_id < 1 THEN  

		
		INSERT INTO list_mission (mission_name, mission_hint, mission_type, is_hidden, project_id, mission_condition, mission_figure, id_condition, detail_hint, reward_exp, reward_currency, reward_quantity, image_url, image_key)
		VALUES(_mission_name, _mission_hint, _mission_type, _is_hidden, _project_id, _mission_condition, _mission_figure, _id_condition, _detail_hint, _reward_exp, _reward_currency, _reward_quantity, _image_url, _image_key);
		
		
		SELECT mission_id
		  INTO v_current_id
		  FROM list_mission lm 
		 WHERE lm.project_id = _project_id
		   AND lm.mission_type = _mission_type
		   AND lm.mission_name = _mission_name;
		
		IF v_current_id > 0 THEN
			
			
			
			CALL sp_update_mission_lang (v_current_id, 'KO', _mission_name, _mission_hint);
		
		END IF;	
	

	ELSE  
	
		UPDATE list_mission
		SET mission_type = _mission_type, 
			is_hidden = _is_hidden, 
			mission_condition= _mission_condition, 
			mission_figure= ifnull(_mission_figure, 0), 
			id_condition= _id_condition, 
			detail_hint= _detail_hint, 
			reward_exp= _reward_exp,
			reward_currency= _reward_currency, 
			reward_quantity= _reward_quantity, 
			image_url= ifnull(_image_url, image_url), 
			image_key= ifnull(_image_key, image_key)
		WHERE mission_id= _mission_id;
	
	
	END IF; 
	

END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_update_model_motion` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`remote`@`%` PROCEDURE `sp_update_model_motion`(
IN _model_id INT,
IN _model_key VARCHAR(120),
IN _motion_name VARCHAR(20)
)
BEGIN

DECLARE v_motion_id NUMERIC DEFAULT 0;


	SELECT a.motion_id
      INTO v_motion_id
	  FROM list_model_motion a WHERE a.model_id = _model_id AND file_key = _model_key;
    
    IF v_motion_id > 0 THEN  
    
		UPDATE list_model_motion 
           SET motion_name = _motion_name
		 WHERE motion_id = v_motion_id;
	
    ELSE 
        DELETE FROM list_model_motion WHERE model_id = _model_id AND file_key = fn_get_motion_file_key(_model_id, _model_key);
		INSERT INTO list_model_motion (model_id, motion_name, file_key) VALUES (_model_id, _motion_name, fn_get_motion_file_key(_model_id, _model_key));
    
    END IF;


END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_update_notice_detail` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`remote`@`%` PROCEDURE `sp_update_notice_detail`(
IN _notice_no INT,
IN _lang VARCHAR(20),
IN _title VARCHAR(60),
IN _contents VARCHAR(2000),
IN _design_id INT,
IN _url_link VARCHAR(200)

)
BEGIN

DECLARE v_check TINYINT DEFAULT 0;


SELECT EXISTS (SELECT z.notice_no FROM com_notice_detail z WHERE z.notice_no = _notice_no AND z.lang = _lang)
  INTO v_check
  FROM DUAL;
 
 
IF v_check < 1 THEN

	INSERT INTO com_notice_detail (notice_no, lang, title, contents, design_id, url_link) VALUES(_notice_no, _lang, _title, _contents, _design_id, _url_link);
ELSE 

	UPDATE com_notice_detail
	SET title=_title, contents=_contents, design_id=_design_id, url_link=_url_link
	WHERE notice_no=_notice_no AND lang=_lang;


END IF;


	
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_update_notice_detail_new` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`remote`@`%` PROCEDURE `sp_update_notice_detail_new`(
IN _notice_no INT,
IN _lang VARCHAR(20),
IN _title VARCHAR(60),
IN _contents VARCHAR(2000),
IN _design_id INT,
IN _url_link VARCHAR(200),
IN _detail_design_id INT 
)
BEGIN

DECLARE v_check TINYINT DEFAULT 0;


SELECT EXISTS (SELECT z.notice_no FROM com_notice_detail z WHERE z.notice_no = _notice_no AND z.lang = _lang)
  INTO v_check
  FROM DUAL;
 
 
IF v_check < 1 THEN

	INSERT INTO com_notice_detail (notice_no, lang, title, contents, design_id, url_link, detail_design_id) VALUES(_notice_no, _lang, _title, _contents, _design_id, _url_link, _detail_design_id);
ELSE 

	UPDATE com_notice_detail
	SET title=_title, contents=_contents, design_id=_design_id, url_link=_url_link, detail_design_id = _detail_design_id
	WHERE notice_no=_notice_no AND lang=_lang;


END IF;


	
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_update_notice_master` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`remote`@`%` PROCEDURE `sp_update_notice_master`(
IN _notice_no INT,
IN _notice_type VARCHAR(20),
IN _notice_name VARCHAR(30),
IN _sortkey INT,
IN _is_public TINYINT,
IN _start_date datetime,
IN _end_date datetime,
IN _os VARCHAR(10)
)
BEGIN
	
	
	
	IF _notice_no < 0 THEN 
	
		INSERT INTO com_notice (notice_type, notice_name, sortkey, is_public, start_date, end_date, os) 
		VALUES(_notice_type, _notice_name, _sortkey, _is_public, IFNULL(_start_date, NOW()), _end_date, _os);

	
	ELSE
		UPDATE com_notice
		SET notice_type=_notice_type, notice_name=_notice_name, sortkey=_sortkey, is_public=_is_public, start_date=_start_date, end_date=_end_date, os=_os
		WHERE notice_no=_notice_no;
	
	
	END IF;
	
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_update_product_daily` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`remote`@`%` PROCEDURE `sp_update_product_daily`(
IN _master_id INT,
IN _day_seq int,
IN _currency varchar(20),
IN _quantity int
)
BEGIN

	DECLARE v_check TINYINT DEFAULT 0;
	
	
	SELECT EXISTS (SELECT * FROM list_product_daily WHERE master_id = _master_id AND day_seq = _day_seq)
	  INTO v_check
	  FROM DUAL;
	 
	 
	IF v_check < 1 THEN
		INSERT INTO list_product_daily (master_id, day_seq, currency, quantity) VALUES(_master_id, _day_seq, _currency, _quantity);
	ELSE 
		UPDATE list_product_daily
		SET currency= _currency
		, quantity = _quantity
		WHERE master_id = _master_id AND day_seq = _day_seq;
	END IF;

	
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_update_product_detail` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`remote`@`%` PROCEDURE `sp_update_product_detail`(
IN _master_id INT,
IN _currency VARCHAR(20),
IN _is_main int,
IN _quantity int,
IN _first_purchase TINYINT 
)
BEGIN

	DECLARE v_check TINYINT DEFAULT 0;
	
	
	SELECT EXISTS (SELECT * FROM com_product_detail WHERE master_id = _master_id AND currency = _currency AND is_main = _is_main AND first_purchase = _first_purchase)
	  INTO v_check
	  FROM DUAL;
	 
	 
	IF v_check < 1 THEN
		INSERT INTO com_product_detail (master_id, currency, is_main, quantity, first_purchase) VALUES(_master_id, _currency, _is_main, _quantity, _first_purchase);
	ELSE 
		UPDATE com_product_detail
		SET quantity= _quantity
		WHERE master_id = _master_id AND currency = _currency AND is_main = _is_main AND first_purchase = _first_purchase;
	END IF;

	
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_update_product_lang` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`remote`@`%` PROCEDURE `sp_update_product_lang`(
IN _master_id INT,
IN _lang varchar(20),
IN _title varchar(60),
IN _banner_id int, 
IN _detail_image_id int 
)
BEGIN

	DECLARE v_check TINYINT DEFAULT 0;
	
	
	SELECT EXISTS (SELECT * FROM com_product_lang WHERE master_id = _master_id AND lang = _lang)
	  INTO v_check
	  FROM DUAL;
	 
	 
	IF v_check < 1 THEN
		INSERT INTO com_product_lang (master_id, lang, title, banner_id, detail_image_id) VALUES(_master_id, _lang, _title, _banner_id, _detail_image_id);
	ELSE 
		UPDATE com_product_lang
		SET title= _title
		, banner_id = _banner_id
		, detail_image_id = _detail_image_id
		WHERE master_id = _master_id AND lang = _lang;
	END IF;

	
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_update_product_master` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`remote`@`%` PROCEDURE `sp_update_product_master`(
IN _product_master_id INT,
IN _product_id varchar(20),
IN _name varchar(60),
IN _product_type varchar(20), 
IN _from_date datetime,
IN _to_date datetime,
IN _max_count INT,
IN _bonus_name varchar(60),
IN _is_public int, 
IN _admin_id varchar(30),
IN _exception_country varchar(30),
IN _project_id INT
)
BEGIN
		
	

	IF _product_master_id = 0 THEN 
	
		INSERT INTO com_product_master (product_id, name, product_type, from_date, to_date, max_count, bonus_name, is_public, admin_id, exception_country, project_id) 
		VALUES(_product_id, _name, _product_type, _from_date, _to_date, _max_count, _bonus_name, _is_public, _admin_id, _exception_country, _project_id);

	ELSE
		UPDATE com_product_master
		SET product_id=_product_id
		, name = _name
		, product_type = _product_type
		, from_date=_from_date
		, to_date=_to_date
		, max_count=_max_count
		, bonus_name=_bonus_name
		, is_public =_is_public
		, admin_id=_admin_id
		, exception_country  = _exception_country
		, project_id = _project_id
		WHERE product_master_id=_product_master_id;
	
	
	END IF;
	
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_update_product_master_new` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`remote`@`%` PROCEDURE `sp_update_product_master_new`(
IN _product_master_id INT,
IN _product_id varchar(20),
IN _name varchar(60),
IN _product_type varchar(20), 
IN _from_date datetime,
IN _to_date datetime,
IN _max_count INT,
IN _bonus_name varchar(60),
IN _is_public int, 
IN _admin_id varchar(30),
IN _exception_country varchar(30)
)
BEGIN
		
	

	IF _product_master_id = 0 THEN 
	
		INSERT INTO list_product_master (product_id, name, product_type, from_date, to_date, max_count, bonus_name, is_public, admin_id, exception_country) 
		VALUES(_product_id, _name, _product_type, _from_date, _to_date, _max_count, _bonus_name, _is_public, _admin_id, _exception_country);

	ELSE
		UPDATE list_product_master
		SET product_id=_product_id
		, name = _name
		, product_type = _product_type
		, from_date=_from_date
		, to_date=_to_date
		, max_count=_max_count
		, bonus_name=_bonus_name
		, is_public =_is_public
		, admin_id=_admin_id
		, exception_country  = _exception_country
		WHERE product_master_id=_product_master_id;
	
	
	END IF;
	
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_update_project_auth` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`remote`@`%` PROCEDURE `sp_update_project_auth`(
IN _user_id varchar(30),
IN _project_id int,
IN _auth_kind varchar(10)
)
BEGIN

	DECLARE v_check TINYINT DEFAULT 0;
	
	
	SELECT EXISTS (SELECT * FROM admin_project_auth apa WHERE user_id = _user_id AND project_id = _project_id)
	  INTO v_check
	  FROM DUAL;
	 
	 
	IF v_check < 1 THEN
		INSERT INTO admin_project_auth (user_id, project_id, auth_kind) VALUES(_user_id, _project_id, _auth_kind);
	ELSE 
		UPDATE admin_project_auth
		SET auth_kind= _auth_kind
		WHERE user_id = _user_id AND project_id = _project_id;
	END IF;

	
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_update_project_detail` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`remote`@`%` PROCEDURE `sp_update_project_detail`(
IN _project_id int,
IN _lang varchar(10),
IN _title varchar(60),
IN _summary varchar(800),
IN _writer varchar(100),
IN _main_banner_id int,
IN _main_thumbnail_id int
)
BEGIN
	
	DECLARE v_exists NUMERIC DEFAULT 0;
	SELECT fn_check_project_lang_exists(_project_id, _lang) 
	  INTO v_exists
      FROM DUAL;
     
    IF v_exists > 0 THEN 
	  UPDATE list_project_detail 
        SET title = _title
          , summary = _summary
          , writer = _writer
          , main_banner_id = _main_banner_id
          , main_thumbnail_id  = _main_thumbnail_id
      WHERE project_id = _project_id
        AND lang = _lang;
       
	ELSE 
		INSERT INTO list_project_detail (project_id, lang, title, summary, writer, main_banner_id, main_thumbnail_id)
		VALUES (_project_id, _lang, _title, _summary, _writer, _main_banner_id, _main_thumbnail_id);
       
    END IF; 
	
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_update_project_sorting_order` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`remote`@`%` PROCEDURE `sp_update_project_sorting_order`(
IN _project_id INT,
IN _cnt INT
)
BEGIN

	DECLARE v_check TINYINT DEFAULT 0;
	
	
	SELECT EXISTS (SELECT * FROM list_project_sorting_order WHERE project_id = _project_id)
	INTO v_check
	FROM DUAL;
	 
	 
	IF v_check < 1 THEN
		INSERT INTO list_project_sorting_order (project_id, view_cnt) VALUES(_project_id, _cnt);
	ELSE 
	
		UPDATE list_project_sorting_order
		SET view_cnt= _cnt
		WHERE project_id = _project_id;
	
	END IF;

	
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_update_promotion_detail` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`remote`@`%` PROCEDURE `sp_update_promotion_detail`(
IN _promotion_no INT,
IN _lang VARCHAR(2),
IN _design_id INT 
)
BEGIN

	DECLARE v_check TINYINT DEFAULT 0;
	
	
	SELECT EXISTS (SELECT z.promotion_no FROM com_promotion_detail z WHERE z.promotion_no = _promotion_no AND z.lang = _lang)
	  INTO v_check
	  FROM DUAL;
	 
	 
	IF v_check < 1 THEN
		INSERT INTO com_promotion_detail (promotion_no, lang, design_id) VALUES(_promotion_no, _lang, _design_id);
	ELSE 
	
		UPDATE com_promotion_detail
		SET design_id=_design_id
		WHERE promotion_no=_promotion_no AND lang=_lang;
	
	
	END IF;


	
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_update_script_selection` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`remote`@`%` PROCEDURE `sp_update_script_selection`(
IN _script_no int, 
IN _project_id INT,
IN _episode_id int,
IN _selection_group int,
IN _selection_no int, 
IN _script_data varchar(240), 
IN _lang varchar(2)
)
BEGIN

	DECLARE v_check TINYINT DEFAULT 0;


	
	SELECT EXISTS (SELECT * FROM list_selection ls WHERE project_id = _project_id AND episode_id = _episode_id AND selection_group = _selection_group AND selection_no = _selection_no)
	INTO v_check
	FROM DUAL;
	
	IF v_check < 1 THEN
		INSERT INTO list_selection (
		selection_group
		, project_id
		, episode_id
		, selection_no
		, selection_order
		, KO)
		VALUES(
		_selection_group
		, _project_id
		, _episode_id
		, _selection_no
	    , _selection_no
	    , _script_data);
	   
	ELSE 
	
		IF _lang = 'EN' THEN 
		
			UPDATE list_selection
			SET EN = _script_data
			WHERE project_id = _project_id 
			AND episode_id = _episode_id 
			AND selection_group = _selection_group 
			AND selection_no = _selection_no;		
		
		ELSEIF _lang = 'JA' THEN 
		
			UPDATE list_selection
			SET JA = _script_data
			WHERE project_id = _project_id 
			AND episode_id = _episode_id 
			AND selection_group = _selection_group 
			AND selection_no = _selection_no;
		
		ELSEIF _lang = 'ZH' THEN 
		
			UPDATE list_selection
			SET ZH = _script_data
			WHERE project_id = _project_id 
			AND episode_id = _episode_id 
			AND selection_group = _selection_group 
			AND selection_no = _selection_no;	
		
		ELSEIF _lang = 'SC' THEN
		
			UPDATE list_selection
			SET SC = _script_data
			WHERE project_id = _project_id 
			AND episode_id = _episode_id 
			AND selection_group = _selection_group 
			AND selection_no = _selection_no;
		
		ELSEIF _lang = 'AR' THEN
		
			UPDATE list_selection
			SET AR = _script_data
			WHERE project_id = _project_id 
			AND episode_id = _episode_id 
			AND selection_group = _selection_group 
			AND selection_no = _selection_no;		
		
		END IF; 

	
	END IF;

	UPDATE list_script
	SET selection_group = _selection_group
	, selection_no = _selection_no
	WHERE script_no = _script_no
	AND lang = _lang; 
	
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_update_sound_lang` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`remote`@`%` PROCEDURE `sp_update_sound_lang`(
IN _sound_id INT,
IN _lang VARCHAR(2),
IN _public_name VARCHAR(60)
)
BEGIN
	

	DECLARE v_check tinyint DEFAULT 0;
	
	SELECT EXISTS (SELECT * FROM list_sound_lang lsl WHERE sound_id = _sound_id AND lang = _lang)
	INTO v_check
	FROM DUAL;
	 
	
	IF v_check > 0 THEN
	 
	 	
	 	UPDATE list_sound_lang 
	 	SET public_name = _public_name
	 	WHERE sound_id = _sound_id
	 	AND lang = _lang;
	 
	ELSE 
	 
	 	
	 	INSERT INTO list_sound_lang (sound_id, lang, public_name)
	 	VALUES (_sound_id, _lang, _public_name);
	 
	END IF;
		
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_update_sound_zip` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`remote`@`%` PROCEDURE `sp_update_sound_zip`(
IN _project_id INT,
IN _sound_type varchar(10),
IN _sound_name varchar(30),
IN _sound_url varchar(160),
IN _sound_key VARCHAR(120),
IN _bucket VARCHAR(30),
IN _speaker VARCHAR(20)
)
BEGIN
	
	
	
	DECLARE v_exists NUMERIC DEFAULT 0;
	DECLARE v_key VARCHAR(120) DEFAULT NULL;
	DECLARE v_bucket VARCHAR(30) DEFAULT NULL;

	SELECT EXISTS (SELECT sound_id FROM list_sound ls WHERE project_id = _project_id AND sound_name = _sound_name AND sound_type = _sound_type)
	  INTO v_exists
	  FROM DUAL;
	 
	IF v_exists > 0 THEN 
	
		
		SELECT ls.sound_key , ls.bucket 
		  INTO v_key, v_bucket
		  FROM list_sound ls
		 WHERE ls.project_id = _project_id
		   AND ls.sound_type = _sound_type
		   AND ls.sound_name = _sound_name;
		  
		IF v_bucket IS NOT NULL THEN
			INSERT INTO table_stashed_s3 (project_id, object_key, bucket) VALUES (_project_id, v_key, v_bucket);
		END IF;
		  
		
		UPDATE list_sound
		  SET sound_url = _sound_url
		    , sound_key = _sound_key
		    , bucket = _bucket
		    , speaker = _speaker
		 WHERE project_id  = _project_id 
		   AND sound_name  = _sound_name
		   AND sound_type = _sound_type;
		  
 	ELSE 
 	
 		INSERT INTO list_sound (project_id, sound_name, sound_url, sound_key, sound_type, speaker, bucket) VALUES (_project_id, _sound_name, _sound_url, _sound_key, _sound_type, _speaker, _bucket);
		
	
	END IF;
	
	
	
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_update_user_achievement` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`remote`@`%` PROCEDURE `sp_update_user_achievement`(
IN _userkey BIGINT,
IN _achievement_id INT,
IN _quantity INT 
)
proc:BEGIN
	
	
	
	DECLARE v_exists NUMERIC DEFAULT 0;
	DECLARE v_level int DEFAULT 1;
	
	
	SELECT EXISTS (SELECT * FROM user_achievement ua WHERE userkey = _userkey AND achievement_id = _achievement_id)
	INTO v_exists
	FROM DUAL;

	IF v_exists < 1 THEN 
	
		INSERT INTO user_achievement (userkey, achievement_id, achievement_level, current_result) VALUES (_userkey, _achievement_id, v_level, _quantity);
	
	ELSE
	
		
		SELECT ifnull(max(achievement_level), 1)  
		INTO v_level
		FROM user_achievement ua 
		WHERE userkey = _userkey
		AND achievement_id = _achievement_id;
		
		UPDATE user_achievement 
		SET current_result = current_result + _quantity
		WHERE userkey = _userkey
		AND achievement_id  = _achievement_id
	    AND achievement_level = v_level; 
	
	END IF;
	
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_update_user_daily_mission` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`remote`@`%` PROCEDURE `sp_update_user_daily_mission`(
IN _userkey BIGINT,
IN _mission_no INT,
IN _quantity INT
)
proc:BEGIN
   
INSERT INTO user_daily_mission_record (userkey, mission_no, current_result) VALUES (_userkey, _mission_no, _quantity) ON DUPLICATE KEY UPDATE  current_result = current_result + _quantity;
  	
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_update_user_dlc_current` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`remote`@`%` PROCEDURE `sp_update_user_dlc_current`(
IN _userkey BIGINT,
IN _project_id INT,
IN _dlc_id INT,
IN _episode_id INT,
IN _scene_id VARCHAR(10),
IN _script_no BIGINT,
IN _is_final TINYINT 
)
BEGIN
	
	INSERT INTO user_dlc (userkey, project_id, dlc_id, episode_id, scene_id, script_no, is_final, update_date)
	VALUES (_userkey, _project_id, _dlc_id, _episode_id, _scene_id, _script_no, _is_final, now()) 
	ON DUPLICATE KEY UPDATE episode_id = _episode_id, scene_id = _scene_id, script_no = _script_no, is_final = _is_final
	, update_date = now();


SELECT a.project_id
    , a.dlc_id 
    , a.episode_id 
    , ifnull(a.scene_id, '') scene_id
    , ifnull(a.script_no, '') script_no 
    , fn_check_episode_is_ending(a.episode_id) is_ending
    , a.is_final
    , le.chapter_number 
    FROM user_dlc a
       , list_episode le 
    WHERE a.userkey = _userkey
    AND a.project_id = _project_id
    AND a.dlc_id = _dlc_id
    AND le.project_id = a.project_id 
    AND le.episode_id = a.episode_id;
	
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_update_user_ending` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`remote`@`%` PROCEDURE `sp_update_user_ending`(
IN _userkey BIGINT,
IN _project_id INT,
IN _episode_id INT
)
proc:BEGIN
	
DECLARE v_exists TINYINT DEFAULT 0;
DECLARE v_play_count INT DEFAULT 0; 
	


SELECT EXISTS (SELECT z.episode_id FROM list_episode z WHERE z.episode_id = _episode_id AND z.episode_type = 'ending')
 INTO v_exists
 FROM DUAL;


IF v_exists < 1 THEN
LEAVE proc;
END IF;


SELECT play_count 
 INTO v_play_count
 FROM user_selection_current
WHERE userkey = _userkey AND project_id = _project_id
LIMIT 1;



SELECT EXISTS (SELECT z.episode_id FROM user_selection_ending z WHERE userkey = _userkey AND project_id = _project_id AND play_count = v_play_count)
INTO v_exists
FROM DUAL;


IF v_exists < 1 THEN 
	INSERT INTO user_selection_ending(
		userkey 
		, project_id 
		, ending_id 
		, play_count 
		, episode_id 
		, selection_group 
		, selection_no 
		, origin_action_date 
	) SELECT userkey
	, project_id 
	, _episode_id ending_id 
	, play_count 
	, episode_id 
	, selection_group 
	, selection_no 
	, action_date
	FROM user_selection_current
	WHERE userkey = _userkey 
	AND project_id = _project_id; 
END IF; 


SELECT EXISTS (SELECT z.episode_id FROM user_ending z WHERE z.userkey= _userkey AND z.episode_id = _episode_id)
 INTO v_exists
 FROM DUAL;

IF v_exists > 0 THEN
LEAVE proc;
END IF;



INSERT INTO user_ending (userkey, episode_id) VALUES (_userkey, _episode_id);


END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_update_user_episode_done` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`remote`@`%` PROCEDURE `sp_update_user_episode_done`(
IN _userkey BIGINT,
IN _project_id INT,
IN _episode_id INT
)
BEGIN
	
	

DECLARE v_exists INT DEFAULT 0;


SELECT EXISTS (SELECT uep.episode_id FROM user_episode_progress uep WHERE uep.userkey = _userkey AND uep.project_id = _project_id AND uep.episode_id = _episode_id AND uep.is_clear = 0)
 INTO v_exists
 FROM DUAL;


IF v_exists > 0 THEN


UPDATE user_episode_progress 
   SET is_clear = 1
     , clear_date = now()
 WHERE userkey = _userkey
   AND episode_id = _episode_id;

END IF;

SELECT a.episode_id, a.is_clear
  FROM user_episode_progress a
 WHERE a.userkey = _userkey
   AND a.project_id = _project_id
 ORDER BY a.open_date desc ;	


END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_update_user_episode_hist` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`remote`@`%` PROCEDURE `sp_update_user_episode_hist`(
IN _userkey BIGINT,
IN _project_id INT,
IN _episode_id INT
)
BEGIN
	



	
DECLARE v_exists INT DEFAULT 0;


SELECT EXISTS (SELECT hist.episode_id 
                 FROM user_episode_hist hist 
                WHERE hist.userkey = _userkey 
                  AND hist.project_id = _project_id 
                  AND hist.episode_id = _episode_id)
 INTO v_exists
 FROM DUAL;


IF v_exists < 1 THEN
	INSERT INTO user_episode_hist (userkey, project_id, episode_id) VALUES (_userkey, _project_id, _episode_id);
END IF; 

 	
	SELECT EXISTS (SELECT uep.episode_id FROM user_episode_progress uep WHERE uep.userkey = _userkey AND uep.project_id = _project_id AND uep.episode_id = _episode_id)
	 INTO v_exists
	 FROM DUAL;
	
	IF v_exists < 1 THEN 
		INSERT INTO user_episode_progress  (userkey, project_id, episode_id) VALUES (_userkey, _project_id, _episode_id);
	END IF;



END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_update_user_episode_scene_hist` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`remote`@`%` PROCEDURE `sp_update_user_episode_scene_hist`(
IN _userkey BIGINT,
IN _project_id INT,
IN _episode_id INT,
IN _scene_id VARCHAR(10)
)
BEGIN
	
	
	
	DECLARE v_exists INT DEFAULT 0;
	
	
	SELECT EXISTS (SELECT usp.userkey FROM user_scene_progress usp WHERE usp.userkey = _userkey AND usp.project_id = _project_id AND usp.episode_id  = _episode_id AND usp.scene_id  = _scene_id)
	  INTO v_exists
	  FROM DUAL;
	 
	 
	IF v_exists < 1 THEN 
		INSERT INTO pier.user_scene_progress
			(userkey, project_id, episode_id, scene_id)
			VALUES(_userkey, _project_id, _episode_id, _scene_id);
	END IF;
	

	
	SELECT EXISTS (SELECT z.scene_id FROM user_scene_hist z WHERE z.userkey = _userkey AND z.project_id = _project_id AND z.scene_id = _scene_id) 
	  INTO v_exists
	  FROM DUAL;
	 
	IF v_exists < 1 THEN
		INSERT INTO user_scene_hist (userkey, project_id, episode_id, scene_id) VALUES (_userkey, _project_id, _episode_id, _scene_id);
	END IF;
	
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_update_user_favor` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`remote`@`%` PROCEDURE `sp_update_user_favor`(
IN _userkey BIGINT,
IN _project_id int,
IN _favor_name VARCHAR(20),
IN _score INT
)
proc:BEGIN

	
	
	
	
	DECLARE v_exists NUMERIC DEFAULT 0;
	
	
	SELECT EXISTS (SELECT z.favor_hist_no FROM user_favor z WHERE z.userkey = _userkey AND z.project_id = _project_id AND z.favor_name = _favor_name)
	INTO v_exists
	FROM DUAL;

	IF v_exists < 1 THEN 
	
		INSERT INTO user_favor (userkey, project_id, favor_name, score)  VALUES (_userkey, _project_id, _favor_name, _score);
		
	
	ELSE
	
		UPDATE user_favor 
		   SET score = score + _score 
		     , update_date = now()
		 WHERE userkey = _userkey
		   AND project_id = _project_id
		   AND favor_name = _favor_name;
	
		
	
	END IF;

	
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_update_user_illust_hist` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`remote`@`%` PROCEDURE `sp_update_user_illust_hist`(
IN _userkey BIGINT,
IN _project_id int,
IN _illust_id int,
IN _illust_type VARCHAR(10) 
)
PROC:BEGIN
	
	
	
	
	DECLARE v_exists NUMERIC DEFAULT 0;
	
	
	SELECT EXISTS (SELECT z.illust_hist_no 
	                 FROM user_illust z 
	                WHERE z.userkey = _userkey 
	                  AND z.project_id = _project_id 
	                  AND z.illust_id = _illust_id 
	                  AND z.illust_type = _illust_type)
	INTO v_exists
	FROM DUAL;

	IF v_exists < 1 THEN 
	
		INSERT INTO user_illust (userkey, project_id, illust_id, illust_type)  VALUES (_userkey, _project_id, _illust_id, _illust_type);
		SELECT 1 AS done
		  FROM DUAL;
	
	ELSE
		SELECT 0 AS done
		  FROM DUAL;
	
	END IF;

	
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_update_user_minicut_history` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`remote`@`%` PROCEDURE `sp_update_user_minicut_history`(
IN _userkey BIGINT,
IN _minicut_id INT,
IN _minicut_type VARCHAR(20),
IN _project_id INT
)
BEGIN
	
DECLARE v_chk TINYINT DEFAULT 0;

SELECT EXISTS (SELECT * FROM user_minicut z WHERE z.userkey = _userkey AND z.minicut_id = _minicut_id AND z.minicut_type= _minicut_type)
  INTO v_chk
  FROM DUAL;


IF v_chk = 0 THEN

INSERT INTO user_minicut(userkey, minicut_id, minicut_type, project_id)
VALUES (_userkey, _minicut_id, _minicut_type, _project_id);

END IF; 
	
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_update_user_mission_hist` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`remote`@`%` PROCEDURE `sp_update_user_mission_hist`(
IN _userkey BIGINT,
IN _mission_id INT 
)
PROC : BEGIN
	
	
	
	DECLARE v_exists NUMERIC DEFAULT 0;
	
	
	SELECT EXISTS (SELECT z.mission_id FROM user_mission z WHERE z.userkey = _userkey AND z.mission_id = _mission_id)
	INTO v_exists
	FROM DUAL;

	IF v_exists < 1 THEN 
	
		INSERT INTO user_mission (userkey, mission_id)  VALUES (_userkey, _mission_id);
		SELECT 1 AS done
		  FROM DUAL;
	
	ELSE
		SELECT 0 AS done
		  FROM DUAL;
	
	END IF;
	
	
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_update_user_next_episode` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`remote`@`%` PROCEDURE `sp_update_user_next_episode`(
IN _userkey BIGINT,
IN _project_id INT,
IN _nextEpisode_id INT
)
proc:BEGIN
	
	
	
	
	DECLARE v_episode_type VARCHAR(20) DEFAULT NULL;
	DECLARE v_episode_id INT DEFAULT 0;

	DECLARE v_isEnding TINYINT DEFAULT 0;

	SELECT a.episode_id, a.episode_type 
	  INTO v_episode_id, v_episode_type
	  FROM list_episode a
	 WHERE a.episode_id = _nextEpisode_id;
	
	IF v_episode_id = 0 THEN
	
		SELECT 0 done 
		  FROM DUAL;
		
		 LEAVE proc;
		
	END IF;

	
	IF v_episode_type = 'ending' THEN
		SET v_isEnding = 1;
	END IF;

	
    
	DELETE FROM user_episode_next WHERE userkey = _userkey AND project_id = _project_id;
	
	
	INSERT INTO user_episode_next (userkey, project_id, episode_id, is_ending) VALUES (_userkey, _project_id, _nextEpisode_id, v_isEnding);

	


	SELECT 1 done
	     , a.episode_id
	     , a.is_ending 
	  FROM user_episode_next a
	WHERE a.userkey = _userkey
      AND a.project_id = _project_id;
	
	
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_update_user_project_current` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`remote`@`%` PROCEDURE `sp_update_user_project_current`(
IN _userkey BIGINT,
IN _project_id INT,
IN _episode_id INT,
IN _scene_id VARCHAR(10),
IN _script_no BIGINT,
IN _is_final TINYINT 
)
BEGIN
	
	
	DECLARE v_episode_id INT DEFAULT 0;
	DECLARE v_history_check TINYINT DEFAULT 0;
	DECLARE v_check TINYINT DEFAULT 0;
	DECLARE v_special TINYINT DEFAULT 0; 
	
	DECLARE v_publish_date DATETIME; 
	DECLARE v_is_serial TINYINT DEFAULT 0; 
	
	
	
 	DECLARE v_next_open_min int DEFAULT 0;
	DECLARE v_open_decrease_rate int DEFAULT 0;
	
	
	DECLARE v_decrease_rate float DEFAULT 0;
	DECLARE v_open_min int DEFAULT 0;	

	
	DECLARE v_grade int DEFAULT 0; 
	DECLARE v_waiting_sale int DEFAULT 0; 
	DECLARE v_sale_rate float DEFAULT 0; 
	
	
	
	SELECT ta.grade, cg.waiting_sale
      INTO v_grade, v_waiting_sale
	  FROM table_account ta
	     , com_grade cg 
	 WHERE userkey = _userkey
	   AND cg.grade = ta.grade ;
	
	IF v_waiting_sale > 0 THEN
		
		
		SET v_sale_rate = v_waiting_sale / 100; 
		SET v_sale_rate  = 1 - v_sale_rate;
	
	END IF;
	
	
	
	
	SELECT CASE WHEN a.episode_type = 'side' THEN 1
		 		ELSE 0 END
		 , a.next_open_min 
		 , a.open_decrease_rate
		 , ifnull(a.publish_date, '2020-01-01')
		 , CASE WHEN ifnull(a.publish_date, '2020-01-01') > now() THEN 1 ELSE 0 END is_serial
		   INTO v_special, v_next_open_min, v_open_decrease_rate, v_publish_date, v_is_serial
	  FROM list_episode a
	 WHERE a.episode_id = _episode_id;
	
	
	IF v_next_open_min = 0 THEN 
		SET v_open_min = 0;
	
	ELSE 
		
		
		IF v_open_decrease_rate = 0 THEN 
			SET v_open_min = v_next_open_min;
		
		ELSE 
			
			SET	v_decrease_rate = v_open_decrease_rate / 100;
			SET v_decrease_rate  = 1 - v_decrease_rate;
  			SET v_open_min = v_next_open_min * v_decrease_rate;				
		END IF;
	END IF;


	
	SELECT EXISTS (SELECT z.* FROM user_episode_hist z WHERE z.userkey = _userkey AND z.episode_id= _episode_id)
	       INTO v_history_check 
	       FROM DUAL;
	
	
	IF v_history_check  > 0 THEN 
		SET v_open_min = 0;
	END IF;

	IF v_special > 0 THEN 
		SET v_open_min = 0;
	END IF;


	
	IF v_open_min > 0 AND v_sale_rate > 0 THEN
		SET v_open_min = v_open_min * v_sale_rate;
	END IF;

	
	

	
	SELECT EXISTS (SELECT z.project_id FROM user_project_current z WHERE z.userkey = _userkey AND z.project_id = _project_id AND z.is_special = v_special)
	  INTO v_check
	  FROM DUAL;
	 
	
	IF v_check < 1 THEN  
	
		
		IF v_history_check = 0 AND v_is_serial > 0 AND v_publish_date > now() THEN
		
			INSERT INTO user_project_current (userkey, project_id, is_special, episode_id, scene_id, script_no, is_final, update_date, next_open_time)
			VALUES (_userkey, _project_id, v_special,  _episode_id, _scene_id, _script_no, _is_final, now(), v_publish_date); 
	
		ELSE 
		
			
			INSERT INTO user_project_current (userkey, project_id, is_special, episode_id, scene_id, script_no, is_final, update_date, next_open_time)
			VALUES (_userkey, _project_id, v_special,  _episode_id, _scene_id, _script_no, _is_final, now(), date_add(now(), INTERVAL v_open_min minute));
		
		END IF;
	
	

	
	ELSE 
	
			SELECT a.episode_id 
			  INTO v_episode_id
			  FROM user_project_current a
			 WHERE a.userkey = _userkey   
			   AND a.project_id = _project_id 
			   AND a.is_special = v_special;
		
			
			
			IF v_history_check = 0 AND v_is_serial > 0 AND v_publish_date > now() THEN
			
			
				UPDATE user_project_current 
				   SET episode_id = _episode_id
				     , is_special = v_special
				     , scene_id = CASE WHEN _is_final > 0 THEN scene_id ELSE _scene_id END 
				     , script_no = CASE WHEN _is_final > 0 THEN script_no ELSE _script_no END
				     , is_final = _is_final
				     , update_date = now()
				     , next_open_time = v_publish_date
				WHERE userkey = _userkey
				  AND project_id = _project_id
				  AND is_special = v_special;
		
			ELSE 
			
				
				
				UPDATE user_project_current 
				   SET episode_id = _episode_id
				     , is_special = v_special
				     , scene_id = CASE WHEN _is_final > 0 THEN scene_id ELSE _scene_id END 
				     , script_no = CASE WHEN _is_final > 0 THEN script_no ELSE _script_no END
				     , is_final = _is_final
				     , update_date = now()
				     , next_open_time = CASE WHEN v_open_min > 0 AND v_episode_id <> _episode_id THEN date_add(now(), INTERVAL v_open_min minute)
				     						 ELSE next_open_time END
				WHERE userkey = _userkey
				  AND project_id = _project_id
				  AND is_special = v_special;
			
			END IF;			  
			  
			

	
	END IF;

	
	

SELECT a.project_id
    , a.episode_id 
    , a.is_special 
    , ifnull(a.scene_id, '') scene_id
    , ifnull(a.script_no, '') script_no 
    , fn_check_episode_is_ending(a.episode_id) is_ending
    , a.is_final
    , DATE_FORMAT(a.next_open_time, '%Y-%m-%d %T') next_open_time
    , le.chapter_number 
    , v_open_decrease_rate v_open_decrease_rate 
    , v_open_min v_open_min
    , v_grade grade
    , v_sale_rate grade_benefit
    FROM user_project_current a
       , list_episode le 
    WHERE a.userkey = _userkey
    AND a.project_id = _project_id
    AND le.project_id = a.project_id 
    AND le.episode_id = a.episode_id;
	
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_update_user_reset` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`remote`@`%` PROCEDURE `sp_update_user_reset`(
IN _userkey BIGINT,
IN _project_id INT,
IN _reset_count INT
)
proc:BEGIN
	
	DECLARE v_exists NUMERIC DEFAULT 0;
	
	
	SELECT EXISTS (SELECT z.* FROM user_reset z WHERE z.userkey = _userkey AND z.project_id = _project_id)
	INTO v_exists
	FROM DUAL;

	IF v_exists < 1 THEN 
	
		INSERT INTO user_reset (userkey, project_id, reset_count)  VALUES (_userkey, _project_id, _reset_count);
	
	ELSE
		
		UPDATE user_reset 
		SET reset_count = _reset_count
		WHERE userkey = _userkey 
		AND project_id  = _project_id; 
	
	END IF;
	
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_update_user_selection_current` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`remote`@`%` PROCEDURE `sp_update_user_selection_current`(
IN _userkey BIGINT,
IN _project_id INT,
IN _episode_id INT,
IN _target_scene_id int,
IN _selection_group int, 
IN _selection_no int
)
BEGIN
	
	DECLARE v_check TINYINT DEFAULT 0;
	DECLARE v_count TINYINT DEFAULT 0; 


	
	SELECT ifnull(max(play_count), 0)  
	INTO v_check
	FROM user_selection_current usc 
	WHERE userkey = _userkey 
	AND project_id = _project_id; 


	
	IF v_check = 0 THEN 
		
		SELECT ifnull(max(play_count), 0)
		INTO v_check
		FROM user_selection_ending use2
		WHERE userkey = _userkey
		AND project_id = _project_id; 
	
		IF v_check = 0 THEN 
			SET v_count = 1; 
		ELSE                
			SET v_count = v_check+1; 
		END IF; 	
	ELSE 
		SET v_count = v_check;
	END IF; 


	
	SELECT EXISTS 
	(SELECT z.* FROM user_selection_current usc 
	WHERE userkey = _userkey 
	AND project_id = _project_id 
	AND episode_id = _episode_id 
	AND selection_group = _selection_group)
  	INTO v_check
  	FROM DUAL;
 

	IF v_check < 1 THEN 
	
		INSERT INTO user_selection_current (userkey, project_id, episode_id, target_scene_id, selection_group, selection_no, play_count)
		VALUES (_userkey, _project_id, _episode_id, _target_scene_id, _selection_group, _selection_no, v_count);
		
	
	END IF;


END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_update_user_selection_progress` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`remote`@`%` PROCEDURE `sp_update_user_selection_progress`(
IN _userkey BIGINT,
IN _project_id INT,
IN _episode_id INT,
IN _target_scene_id VARCHAR(10),
IN _selection_data VARCHAR(240)
)
BEGIN
	
DECLARE v_check TINYINT DEFAULT 0;

SELECT EXISTS (SELECT z.* FROM user_selection_progress z WHERE z.userkey = _userkey AND z.episode_id = _episode_id AND z.target_scene_id = _target_scene_id AND z.selection_data = _selection_data)
  INTO v_check
  FROM DUAL;
 

IF v_check < 1 THEN 

	INSERT INTO user_selection_progress (userkey, project_id, episode_id, target_scene_id, selection_data)
	VALUES (_userkey, _project_id, _episode_id, _target_scene_id, _selection_data);
	

END IF;





END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_use_user_property` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`remote`@`%` PROCEDURE `sp_use_user_property`(
IN _userkey BIGINT,
IN _currency VARCHAR(20),
IN _quantity INT, 
IN _reason VARCHAR(30), 
IN _project_id INT 
)
BEGIN
	
DECLARE v_quantity NUMERIC DEFAULT 0; 
DECLARE v_property_no BIGINT;
DECLARE v_current NUMERIC; 
DECLARE v_total_property INT DEFAULT 0;
DECLARE v_paid TINYINT DEFAULT 0;

DECLARE v_paid_sum int DEFAULT 0; 
DECLARE v_free_sum int DEFAULT 0; 

DECLARE v_achievement_id int DEFAULT 0; 

DECLARE cursor_finished INTEGER DEFAULT 0;
DECLARE prop_cur CURSOR FOR
SELECT a.property_no
     , a.current_quantity
     , a.paid 
  FROM user_property a 
 WHERE a.userkey = _userkey
   AND now() < a.expire_date 
   AND a.currency = _currency
   AND a.current_quantity > 0
 ORDER BY a.expire_date, property_no; 
       
DECLARE CONTINUE HANDLER FOR NOT FOUND SET cursor_finished = 1;

SET v_quantity = _quantity; 


OPEN prop_cur;

	
	LOOPING:LOOP
		FETCH prop_cur INTO v_property_no, v_current, v_paid;
	
		IF cursor_finished = 1 THEN
			LEAVE LOOPING;
		END IF;
	
		IF v_current < v_quantity THEN 
			
			UPDATE user_property 
			   SET current_quantity = 0 
			 WHERE property_no = v_property_no;
			
			
			IF _currency IN ('gem', 'coin') AND v_paid = 1 THEN
				SET v_paid_sum = v_paid_sum + v_current; 
			ELSEIF _currency IN ('gem', 'coin') AND v_paid = 0 THEN
				SET v_free_sum = v_free_sum + v_current; 
			END IF;
			
			SET v_quantity = v_quantity - v_current; 

		ELSE 
			
			UPDATE user_property
			   SET current_quantity = current_quantity - v_quantity 
    		 WHERE property_no = v_property_no;
    		

			
			IF _currency IN ('gem', 'coin') AND v_paid = 1 THEN
				SET v_paid_sum = v_paid_sum + v_quantity; 
			ELSEIF _currency IN ('gem', 'coin') AND v_paid = 0 THEN
				SET v_free_sum = v_free_sum + v_quantity; 
			END IF;    		
    		
    		
			SET v_quantity = 0; 
		
		END IF;
	
	END LOOP LOOPING;

CLOSE prop_cur;

 	
SELECT fn_get_user_property(_userkey, _currency)
  INTO v_total_property
  FROM DUAL;
 

IF _currency IN ('gem', 'coin') THEN 

	
	IF _currency = 'gem' THEN 
		SET v_achievement_id = 10;
	ELSE 
		SET v_achievement_id = 11;
	END IF; 

	
	IF v_paid_sum > 0 THEN 
	
		INSERT INTO gamelog.log_property (userkey, log_type, currency, quantity, log_code, project_id, property_result, paid) VALUES(_userkey, 'use', _currency, v_paid_sum, _reason, _project_id, v_total_property, 1);

	END IF;

 	IF v_free_sum > 0 THEN 
 	
		INSERT INTO gamelog.log_property (userkey, log_type, currency, quantity, log_code, project_id, property_result, paid) VALUES(_userkey, 'use', _currency, v_free_sum, _reason, _project_id, v_total_property, 0);
		
	
	END IF;
	
	
	IF _reason <> 'coin_exchange' THEN 
		CALL sp_update_user_achievement(_userkey, v_achievement_id, _quantity); 
		
		
		IF _currency = 'gem' THEN 
			CALL sp_update_user_daily_mission(_userkey, 5, _quantity); 
		END IF;
	END IF;

ELSE 
	
	INSERT INTO gamelog.log_property (userkey, log_type, currency, quantity, log_code, project_id, property_result) VALUES(_userkey, 'use', _currency, _quantity, _reason, _project_id, v_total_property);

END IF;



SELECT v_paid_sum paid_sum
     , v_free_sum free_sum
  FROM DUAL;
	
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2024-03-23 21:46:24
