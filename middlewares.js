import multer from "multer";
import multerS3 from "multer-s3";
import aws from "aws-sdk";
import path from "path";
import iconv from "iconv-lite";
import routes from "./routes";
import { logger } from "./logger";

// s3 init
const s3 = new aws.S3({
  accessKeyId: process.env.AWS_KEY,
  secretAccessKey: process.env.AWS_SECRET_KEY,
});

const bucketName = `pierstore/assets`;
const uploadFile = "uploadFile";

// 파일 업로드 = multer npm 사용해야 한다.
// 파일이 함께 전송되어 있을때, multer를 쓰지 않으면 다른 body의 변수도 없어짐!!!

// 사운드 파일 업로드
const multerSound = multer({
  storage: multerS3({
    s3,
    bucket: "pierstorystore/assets",
    contentType: multerS3.AUTO_CONTENT_TYPE,
    acl: "public-read",
    fileFilter(req, file, cb) {
      if (!file) {
        cb(null, false);
      } else {
        cb(null, true);
      }
    },

    metadata(req, file, cb) {
      cb(null, { fileName: file.fieldname });
    },
    key(req, file, cb) {
      // const originalName = iconv.deco

      const fileLength = file.originalname.length;
      const lastDot = file.originalname.lastIndexOf(".");
      const fileExtension = file.originalname.substring(
        lastDot + 1,
        fileLength
      );

      // console.log(`multer log ${originalName}`);
      // 사운드 파일 경로 지정
      cb(null, `${req.params.id}/sounds/${Date.now()}.${fileExtension}`);
    },
  }),
});

// 미니컷 이미지 업로드 용도.
const multerComDesign = multer({
  storage: multerS3({
    s3,
    bucket: bucketName,
    contentType: multerS3.AUTO_CONTENT_TYPE,
    acl: "public-read",
    fileFilter(req, file, cb) {
      if (!file) {
        cb(null, false);
      } else {
        cb(null, true);
      }
    },

    metadata(req, file, cb) {
      cb(null, { fileName: file.fieldname });
    },
    key(req, file, cb) {
      // const originalName = iconv.deco

      const fileLength = file.originalname.length;
      const lastDot = file.originalname.lastIndexOf(".");
      const fileExtension = file.originalname.substring(
        lastDot + 1,
        fileLength
      );

      let fileLocalPath = "";

      // 경로 조정
      if (req.params.id === -1 || req.params.id === "-1") {
        fileLocalPath = `com/${Date.now()}.${fileExtension}`;
      } else {
        fileLocalPath = `com/${req.params.id}/${Date.now()}.${fileExtension}`;
      }

      // 여기에 등록되는 이미지들은, com 폴더 아래에 프로젝트 ID(params.id) 하위로 들어가도록 변경한다.
      // 이전에는 프로젝트ID/com 폴더에 들어가있기 때문에 데이터관리에서 다운로드 데이터를 삭제하게되면
      // 현재 보여지고 있는 화면의 이미지도 삭제되는 경우가 생기기때문이다.
      cb(null, fileLocalPath);
    },
  }),
}); // end of multer com design

// 미니컷 이미지 업로드 용도.
const multerMinicut = multer({
  storage: multerS3({
    s3,
    bucket: bucketName,
    contentType: multerS3.AUTO_CONTENT_TYPE,
    acl: "public-read",
    fileFilter(req, file, cb) {
      if (!file) {
        cb(null, false);
      } else {
        cb(null, true);
      }
    },

    metadata(req, file, cb) {
      cb(null, { fileName: file.fieldname });
    },
    key(req, file, cb) {
      // const originalName = iconv.deco

      const fileLength = file.originalname.length;
      const lastDot = file.originalname.lastIndexOf(".");
      const fileExtension = file.originalname.substring(
        lastDot + 1,
        fileLength
      );

      // 업로드 폴더 및 이름 변경 image
      cb(null, `${req.params.id}/image/${Date.now()}.${fileExtension}`);
    },
  }),
}); // end of multer minicut

// 프로젝트 관련 이미지 올리기
const multerProjectImage = multer({
  storage: multerS3({
    s3,
    bucket: bucketName,
    contentType: multerS3.AUTO_CONTENT_TYPE,
    acl: "public-read",
    fileFilter(req, file, cb) {
      if (!file) {
        cb(null, false);
      } else {
        cb(null, true);
      }
    },

    metadata(req, file, cb) {
      cb(null, { fileName: file.fieldname });
    },
    key(req, file, cb) {
      // const originalName = iconv.deco

      const fileLength = file.originalname.length;
      const lastDot = file.originalname.lastIndexOf(".");
      const fileExtension = file.originalname.substring(
        lastDot + 1,
        fileLength
      );

      // 업로드 폴더 및 이름 변경
      cb(null, `${req.params.id}/project/${Date.now()}.${fileExtension}`);
    },
  }),
}); // end of multer project

// 배경 올리기.
const multerBackground = multer({
  storage: multerS3({
    s3,
    bucket: bucketName,
    contentType: multerS3.AUTO_CONTENT_TYPE,
    acl: "public-read",
    fileFilter(req, file, cb) {
      if (!file) {
        cb(null, false);
      } else {
        cb(null, true);
      }
    },

    metadata(req, file, cb) {
      cb(null, { fileName: file.fieldname });
    },
    key(req, file, cb) {
      // const originalName = iconv.deco

      const fileLength = file.originalname.length;
      const lastDot = file.originalname.lastIndexOf(".");
      const fileExtension = file.originalname.substring(
        lastDot + 1,
        fileLength
      );

      // 업로드 폴더 및 이름 변경
      cb(null, `${req.params.id}/bg/${Date.now()}.${fileExtension}`);
    },
  }),
}); // end of multer bg

const multerImage = multer({
  storage: multerS3({
    s3,
    bucket: "pierstorystore/assets",
    contentType: multerS3.AUTO_CONTENT_TYPE,
    acl: "public-read",
    fileFilter(req, file, cb) {
      if (!file) {
        cb(null, false);
      } else {
        cb(null, true);
      }
    },

    metadata(req, file, cb) {
      cb(null, { fileName: file.fieldname });
    },
    key(req, file, cb) {
      // const originalName = iconv.deco

      const fileLength = file.originalname.length;
      const lastDot = file.originalname.lastIndexOf(".");
      const fileExtension = file.originalname.substring(
        lastDot + 1,
        fileLength
      );

      cb(null, `${req.params.id}/${Date.now()}.${fileExtension}`);
    },
  }),
});

const multerBubbleImage = multer({
  storage: multerS3({
    s3,
    bucket: "pierstorystore/assets",
    contentType: multerS3.AUTO_CONTENT_TYPE,
    acl: "public-read",
    fileFilter(req, file, cb) {
      if (!file) {
        cb(null, false);
      } else {
        cb(null, true);
      }
    },

    metadata(req, file, cb) {
      cb(null, { fileName: file.fieldname });
    },
    key(req, file, cb) {
      // const originalName = iconv.deco

      const fileLength = file.originalname.length;
      const lastDot = file.originalname.lastIndexOf(".");
      const fileExtension = file.originalname.substring(
        lastDot + 1,
        fileLength
      );

      // console.log(`multer log ${originalName}`);

      cb(null, `bubble/${Date.now()}.${fileExtension}`);
    },
  }),
});

// Live2D Upload용 multer 객체 생성하기
const multerModelZip = multer({
  storage: multerS3({
    s3, // s3 키 정보
    bucket: "pierstorystore/models", // 설치될 저장소, 폴더
    contentType: multerS3.AUTO_CONTENT_TYPE,
    acl: "public-read", // 권한

    fileFilter(req, file, cb) {
      if (!file) {
        // 파일 없으면 필터링 되도록 처리
        cb(null, false);
      } else {
        cb(null, true);
      }
    },

    metadata(req, file, cb) {
      cb(null, { fileName: file.fieldname });
    },

    key(req, file, cb) {
      // zip 파일이 원본이 올라갈 위치를 지정한다.
      // 위의 버킷과 조합되어 pierstorystore/models/프로젝트id/파일원본이름 으로 업로드 되도록 한다.
      cb(null, `${req.params.id}/${file.originalname}`);
    },
  }),
});

// Live2D Upload용 multer 객체 생성하기
const multerLiveIllust = multer({
  storage: multerS3({
    s3, // s3 키 정보
    bucket: "pierstorystore/live_illusts", // 설치될 저장소, 폴더
    contentType: multerS3.AUTO_CONTENT_TYPE,
    acl: "public-read", // 권한

    fileFilter(req, file, cb) {
      if (!file) {
        // 파일 없으면 필터링 되도록 처리
        cb(null, false);
      } else {
        cb(null, true);
      }
    },

    metadata(req, file, cb) {
      cb(null, { fileName: file.fieldname });
    },

    key(req, file, cb) {
      // zip 파일이 원본이 올라갈 위치를 지정한다.
      // 위의 버킷과 조합되어 pierstorystore/models/프로젝트id/파일원본이름 으로 업로드 되도록 한다.
      cb(null, `${req.params.id}/${file.originalname}`);
    },
  }),
});

// Live2D Upload용 multer 객체 생성하기
const multerLiveObject = multer({
  storage: multerS3({
    s3, // s3 키 정보
    bucket: "pierstorystore/live_objects", // 설치될 저장소, 폴더
    contentType: multerS3.AUTO_CONTENT_TYPE,
    acl: "public-read", // 권한

    fileFilter(req, file, cb) {
      if (!file) {
        // 파일 없으면 필터링 되도록 처리
        cb(null, false);
      } else {
        cb(null, true);
      }
    },

    metadata(req, file, cb) {
      cb(null, { fileName: file.fieldname });
    },

    key(req, file, cb) {
      // zip 파일이 원본이 올라갈 위치를 지정한다.
      cb(null, `${req.params.id}/${file.originalname}`);
    },
  }),
});

// 플랫폼 공용 모델 업로드
const multerComModel = multer({
  storage: multerS3({
    s3, // s3 키 정보
    bucket: "pierstore/assets", // 설치될 저장소, 폴더
    contentType: multerS3.AUTO_CONTENT_TYPE,
    acl: "public-read", // 권한

    fileFilter(req, file, cb) {
      if (!file) {
        // 파일 없으면 필터링 되도록 처리
        cb(null, false);
      } else {
        cb(null, true);
      }
    },

    metadata(req, file, cb) {
      cb(null, { fileName: file.fieldname });
    },

    key(req, file, cb) {
      // zip 파일이 원본이 올라갈 위치를 지정한다.
      cb(null, `com/${file.originalname}`);
    },
  }),
});

export const localsMiddleware = (req, res, next) => {
  // locals에 있는건 템플릿에 변수명 처럼 존재할 수 있다.
  res.locals.siteName = "ADMIN";
  res.locals.routes = routes;
  res.locals.user = {
    isAuthenticated: true,
    id: 1,
  };

  // 미들웨어가 커넥션과 라우트들 사이에 있으니까 next를 실행해줘야한다.
  next();
};

// 앱 클라이언트에서 호출 처리 middleware
export const clientCallMiddleware = (req, res, next) => {
  // console.log("clientCallMiddleware");
  // global.user = req.body;
  next();
};

// export const uploadProjectImage = multer({ storage });
export const uploadImage = multerImage.single(uploadFile);
export const uploadModelZip = multerModelZip.single(uploadFile);
export const uploadBubbleImage = multerBubbleImage.single(uploadFile);
export const uploadSound = multerSound.single(uploadFile);
export const uploadLiveIllust = multerLiveIllust.single(uploadFile);
export const uploadLiveObject = multerLiveObject.single(uploadFile);

export const uploadComModelZip = multerComModel.single(uploadFile); // 공용 모델 ZIP 업로드

/////////// 이미지 용도에 맞게 폴더를 분리하기 위해서 multer를 세분화한다.

// 배경 업로드 용도 (2021.05.31)
export const uploadBG = multerBackground.single(uploadFile);

// 미니컷 이미지 업로드 용도
export const uploadMinicut = multerMinicut.single(uploadFile);

// 프로젝트 썸네일 업로드 용도
export const uploadProjectThumbnail = multerProjectImage.single(uploadFile);

// 공통 디자인 파일 업로드
export const uploadComDesign = multerComDesign.single(uploadFile);
