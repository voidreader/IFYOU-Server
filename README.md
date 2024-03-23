# 스토리 게임 플랫폼 (IFyou) 게임서버
스토리 게임 플랫폼의 게임 서버 프로젝트


## 📱 프로젝트 소개
[IFyou 플랫폼](https://lessgame.notion.site/IF-you-368bfdfe9e1546ddb67576a62382092a?pvs=4)  게임 서버입니다.

- Database 스키마는 database 폴더에 업로드 되었습니다. (mysqldump)
- 데이터베이스 오브젝트 리스트는 [링크 문서 참고](https://lessgame.notion.site/MySQL-Object-e980c0dec5414aa9896067c8a8e1876b?pvs=4)


## ⏰ 개발 기간
* 20.12 - 23.06

### 🧑‍🤝‍🧑 Repo 기여자 (프로젝트 참여자)
- 이형진(본인) : 메인 작업자 
- [임지은](https://github.com/ije90s) (21.06 - 22.07)


### ⚙️ 개발 환경
- `Node.js v18.16.0`
- `CentOS 7.8`
- **Framework** : Express 4.17.2
- **Database** : MySQL 8.0.25, ~~Redis~~(비용 이슈로 중간에 제거)

### 📌 주요 기능
- 게임 로그인 (NHN 게임베이스에서 유저 인증 후 접속)
- 상품 구매
- 게임 플레이를 위한 데이터 전달 및 게임 플레이 기록 저장
- 각종 통계를 위한 로그 데이터 저장
- 게임 내 여러 유저 행위에 대한 처리


### 👣 이슈
- 23.06 기술 이전을 위해 플랫폼 시스템에서 단일 게임들을 서포트 하는 시스템으로 변경 (PackageGameSystem 브랜치)
- 플랫폼 시스템은 '플랫폼-서버' 브랜치로 이동합니다. 
