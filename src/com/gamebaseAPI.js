import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const gamebaseAppID = process.env.GAMEBASE_APPID;
const gamebaseSecret = process.env.GAMEBASE_SECRET;

const gamebaseURL = "https://api-gamebase.nhncloudservice.com/";
const gamebaseURL2 = `v1.3/apps/${gamebaseAppID}/`;

// gamebaseAPI 관련 axios
const gamebaseAxios = axios.create({
  baseURL: `${gamebaseURL}`,
  headers: { "X-Secret-Key": gamebaseSecret },
});

// gamebaseAPI 모음
export const gamebaseAPI = {
  // inapp API: 구매 후 재화를 지급했다면 consume (소비) 처리를 해주어야 한다.
  consume: (paymentSeq, purchaseToken) =>
    gamebaseAxios.post(`tcgb-inapp/${gamebaseURL2}consume`, {
      paymentSeq,
      accessToken: purchaseToken,
    }),

  // member API: 계정 상세 정보
  member: (gamebaseId) =>
    gamebaseAxios.get(`tcgb-member/${gamebaseURL2}members/${gamebaseId}`),
};
