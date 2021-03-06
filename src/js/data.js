'use strict'

export const dataManage = {
  南アジア: { postion: 0 },
  北ヨーロッパ: { postion: 1 },
  南ヨーロッパ: { postion: 1 },
  北アフリカ: { postion: 3 },
  ポリネシア: { postion: 6 },
  中央アフリカ: { postion: 3 },
  カリブ海: { postion: 6 },
  "": { postion: 0 },
  南アメリカ: { postion: 2 },
  西アジア: { postion: 0 },
  オーストラリア: { postion: 5 },
  西ヨーロッパ: { postion: 1 },
  東ヨーロッパ: { postion: 1 },
  中央アメリカ: { postion: 2 },
  西アフリカ: { postion: 3 },
  北アメリカ: { postion: 1 },
  南部アフリカ: { postion: 3 },
  東アフリカ: { postion: 3 },
  東南アジア: { postion: 0 },
  東アジア: { postion: 0 },
  メラネシア: { postion: 6 },
  ミクロネシア: { postion: 6 },
  中央アジア: { postion: 0 },
};

export const MARKER_URL =
  "https://unpkg.com/leaflet@1.4.0/dist/images/marker-icon-2x.png";

export const baseUrl = "https://restcountries.eu/rest/v2/";

export const aboutMe = () => {
  alert(
    `ようこそ!
        テストにチャレンジして世界の国旗を集めようよう！
        テストをクリアすると国旗がもらえるぞ！
        少ない間違いでテストをクリアするとほどたくさん国旗がもらえるぞ！`
  );
};