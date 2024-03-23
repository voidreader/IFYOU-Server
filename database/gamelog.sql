-- MySQL dump 10.13  Distrib 8.0.32, for Linux (x86_64)
--
-- Host: localhost    Database: gamelog
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
-- Current Database: `gamelog`
--

CREATE DATABASE /*!32312 IF NOT EXISTS*/ `gamelog` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;

USE `gamelog`;

--
-- Table structure for table `log_action`
--

DROP TABLE IF EXISTS `log_action`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `log_action` (
  `log_no` bigint NOT NULL AUTO_INCREMENT,
  `userkey` bigint NOT NULL,
  `action_type` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '액션 타입',
  `log_data` varchar(520) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '사용한 데이터 JSON',
  `action_date` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `project_id` int DEFAULT NULL,
  `episode_id` int DEFAULT '-1',
  PRIMARY KEY (`log_no`),
  KEY `log_action_userkey_IDX` (`userkey`,`action_type`) USING BTREE,
  KEY `log_action_action_date_IDX` (`action_date`,`action_type`) USING BTREE,
  KEY `log_action_date_type_IDX` (`action_date`,`action_type`,`userkey`) USING BTREE,
  KEY `log_action_userkey_IDX3` (`userkey`,`action_date`) USING BTREE,
  KEY `log_action_project_id_IDX` (`project_id`,`action_type`,`action_date`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=336842 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='모든 유저의 행동을 기록한다.';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `log_ad`
--

DROP TABLE IF EXISTS `log_ad`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `log_ad` (
  `log_no` bigint NOT NULL AUTO_INCREMENT,
  `userkey` bigint NOT NULL,
  `project_id` int DEFAULT NULL COMMENT '작품id',
  `episode_id` int NOT NULL DEFAULT '-1',
  `ad_type` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '광고타입',
  `action_date` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`log_no`),
  KEY `log_ad_userkey_IDX` (`userkey`,`ad_type`,`action_date`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=65780 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='광고보기로그';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `log_admin`
--

DROP TABLE IF EXISTS `log_admin`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `log_admin` (
  `log_no` bigint NOT NULL AUTO_INCREMENT,
  `admin_id` varchar(30) NOT NULL,
  `action_type` varchar(35) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `log_data` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `action_date` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`log_no`),
  KEY `log_admin_action_type_IDX` (`action_type`,`action_date`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=100759 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='어드민 로그';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `log_allpass_play`
--

DROP TABLE IF EXISTS `log_allpass_play`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `log_allpass_play` (
  `userkey` bigint DEFAULT NULL COMMENT '유저키',
  `project_id` int DEFAULT NULL COMMENT '작품id',
  `episode_id` int DEFAULT NULL COMMENT '에피소드id',
  `play_date` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '플레이 완료 시간',
  KEY `log_allpass_play_userkey_IDX` (`userkey`,`project_id`,`episode_id`) USING BTREE,
  KEY `log_allpass_play_play_date_IDX` (`play_date`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='올패스 기간동안 플레이 완료한 에피소드 수집';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `log_client_error`
--

DROP TABLE IF EXISTS `log_client_error`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `log_client_error` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `userkey` int NOT NULL,
  `project_id` int NOT NULL,
  `raw_data` varchar(2000) DEFAULT NULL,
  `error_message` varchar(240) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `IDX_007d5ee539ffc85435ae60e9f8` (`userkey`,`created_at`),
  KEY `IDX_3fee054dd19e5b2b17843f3101` (`project_id`,`created_at`)
) ENGINE=InnoDB AUTO_INCREMENT=64 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `log_first_episode_user`
--

DROP TABLE IF EXISTS `log_first_episode_user`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `log_first_episode_user` (
  `project_id` int DEFAULT NULL,
  `userkey` bigint DEFAULT NULL,
  UNIQUE KEY `log_first_episode_user_project_id_IDX` (`project_id`,`userkey`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='작품별 첫번째 에피소드 플레이 유저';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `log_freepass`
--

DROP TABLE IF EXISTS `log_freepass`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `log_freepass` (
  `log_no` bigint NOT NULL AUTO_INCREMENT,
  `userkey` bigint NOT NULL,
  `project_id` int NOT NULL,
  `freepass_no` int NOT NULL DEFAULT '-1' COMMENT '연결된 프리패스 타임딜. 없으면 -1',
  `price` int NOT NULL COMMENT '구매 당시 가격',
  `purchase_date` datetime DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `log_freepass_un` (`log_no`),
  KEY `log_freepass_userkey_IDX` (`userkey`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=174 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='프리패스 구매기록';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `log_project_retention`
--

DROP TABLE IF EXISTS `log_project_retention`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `log_project_retention` (
  `project_id` int DEFAULT NULL,
  `start_date` datetime DEFAULT NULL,
  `end_date` datetime DEFAULT NULL,
  `episode_no` int DEFAULT NULL,
  `cnt` int DEFAULT NULL,
  `sortno` int DEFAULT NULL,
  UNIQUE KEY `log_project_retention_project_id_IDX` (`project_id`,`episode_no`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='프로젝트 에피소드별 리텐션 구하기';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `log_property`
--

DROP TABLE IF EXISTS `log_property`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `log_property` (
  `log_no` bigint NOT NULL AUTO_INCREMENT,
  `userkey` bigint NOT NULL COMMENT '유저키',
  `log_type` varchar(20) NOT NULL COMMENT '획득, 사용',
  `currency` varchar(20) NOT NULL COMMENT '화폐',
  `quantity` int NOT NULL COMMENT '수량',
  `log_code` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '획득, 사용 코드',
  `action_date` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '발생일시',
  `project_id` int NOT NULL DEFAULT '-1' COMMENT '프로젝트 ID',
  `property_result` int DEFAULT NULL COMMENT '재화 사용,획득 후 결과 값',
  `paid` tinyint NOT NULL DEFAULT '0' COMMENT '유료 재화 여부',
  PRIMARY KEY (`log_no`),
  KEY `log_property_userkey_IDX` (`userkey`,`action_date`,`currency`) USING BTREE,
  KEY `log_property_project_id_IDX` (`project_id`,`action_date`) USING BTREE,
  KEY `idx_property_log` (`userkey`,`project_id`,`log_type`,`currency`,`log_code`)
) ENGINE=InnoDB AUTO_INCREMENT=44870 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='유저 재산 로그';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `log_request_error`
--

DROP TABLE IF EXISTS `log_request_error`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `log_request_error` (
  `log_no` bigint NOT NULL AUTO_INCREMENT,
  `userkey` bigint DEFAULT NULL,
  `raw_data` varchar(4000) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT '통신 전송 데이터, 오류 전문',
  `message` varchar(2000) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT 'Exception Message 분류',
  `action_date` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`log_no`),
  KEY `log_request_error_userkey_IDX` (`userkey`,`action_date`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=4113 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `log_user`
--

DROP TABLE IF EXISTS `log_user`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `log_user` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `userkey` int NOT NULL,
  `project_id` int NOT NULL,
  `episode_id` int NOT NULL DEFAULT '0',
  `action_type` varchar(30) NOT NULL,
  `log_data` varchar(400) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `IDX_70b1934312d5d997eb25d482e4` (`created_at`,`project_id`,`action_type`),
  KEY `IDX_d8595de2fdfac1635f22c34f22` (`userkey`,`created_at`,`action_type`)
) ENGINE=InnoDB AUTO_INCREMENT=344 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `stat_daily_main`
--

DROP TABLE IF EXISTS `stat_daily_main`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `stat_daily_main` (
  `stat_no` int NOT NULL AUTO_INCREMENT,
  `dau` int DEFAULT NULL COMMENT '일 사용자',
  `nru` int DEFAULT NULL COMMENT '신규 앱 설치자',
  `pu` int DEFAULT NULL COMMENT '유료 상품 결제 건수',
  `search_date` datetime DEFAULT NULL COMMENT '조회날짜',
  `create_date` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '생성일',
  PRIMARY KEY (`stat_no`),
  UNIQUE KEY `stat_daily_main_search_date_IDX` (`search_date`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='일일 집계 메인';
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
-- Table structure for table `stat_project_sum`
--

DROP TABLE IF EXISTS `stat_project_sum`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `stat_project_sum` (
  `project_id` int DEFAULT NULL,
  `hit_count` int NOT NULL DEFAULT '0',
  `like_count` int NOT NULL DEFAULT '0',
  `last_stat_date` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `stat_project_sum_project_id_IDX` (`project_id`) USING BTREE,
  KEY `stat_project_sum_hit_count_IDX` (`hit_count`) USING BTREE,
  KEY `stat_project_sum_project_id_IDX2` (`project_id`,`hit_count`) USING BTREE,
  KEY `stat_project_sum_like_count_IDX` (`like_count`) USING BTREE,
  KEY `stat_project_sum_project_id_IDX3` (`project_id`,`like_count`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='프로젝트 누적 수치 모음. 좋아요, 조회수 등등';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping routines for database 'gamelog'
--
/*!50003 DROP FUNCTION IF EXISTS `fn_country_dau` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`remote`@`%` FUNCTION `fn_country_dau`(
_from_date varchar(10),
_country_code VARCHAR(10)
) RETURNS int
BEGIN
	
DECLARE v_dau NUMERIC;

SELECT count(DISTINCT ta.userkey)
  INTO v_dau
  FROM gamelog.log_action la 
     , table_account ta 
 WHERE la.action_date BETWEEN '${from_date}' AND concat('${from_date}' ' 23:59:59')
   AND ta.userkey = la.userkey 
   AND ta.country = 'SA'
;

RETURN v_dau;
	
	
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP FUNCTION IF EXISTS `fn_get_project_action_unique_user` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`remote`@`%` FUNCTION `fn_get_project_action_unique_user`(
_fromdate datetime,
_todate datetime,
_action_type varchar(20),
_project_id INT
) RETURNS int
BEGIN
	
DECLARE v_cnt int DEFAULT 0;	
	
 SELECT count(DISTINCT userkey)
   INTO v_cnt
   FROM gamelog.log_action la 
      , list_project_master lpm 
  WHERE la.action_date BETWEEN _fromdate AND _todate
    AND la.action_type = _action_type
    AND lpm.project_id = CAST(JSON_EXTRACT(la.log_data, '$.project_id') AS UNSIGNED )
    AND lpm.project_id = _project_id; 
   
RETURN v_cnt;   

	
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP FUNCTION IF EXISTS `fn_multi_watch_user_from_project` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`remote`@`%` FUNCTION `fn_multi_watch_user_from_project`(
_project_id int,
_story_count int
) RETURNS int
BEGIN
	
	DECLARE v_cnt int DEFAULT 0;

SELECT count(*) 
  INTO v_cnt
  FROM (
		SELECT z.userkey
		  FROM ( SELECT DISTINCT hist.project_id, a.userkey 
		   FROM gamelog.stat_project_user a
		      , pier.user_episode_hist hist
		  WHERE a.project_id = _project_id
		    AND a.userkey = hist.userkey
		) z
		GROUP BY z.userkey
		HAVING count(*) >= _story_count
) x;


RETURN v_cnt;
	
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

-- Dump completed on 2024-03-23 21:46:44
