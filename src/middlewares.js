// 앱 클라이언트에서 호출 처리 middleware
export const clientCallMiddleware = (req, res, next) => {
  // console.log("clientCallMiddleware");
  // global.user = req.body;
  next();
};

/////////// 이미지 용도에 맞게 폴더를 분리하기 위해서 multer를 세분화한다.
