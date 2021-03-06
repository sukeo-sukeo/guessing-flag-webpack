"use strict";

import "./style.scss";
import {
  WORLDMAP,
  MINIMAP,
  fetchWorld,
  makeMarker,
  makeCircle,
  hiddenName,
  removeMarker,
} from "./js/world.js";
import { createChart } from "./js/chart.js";
import { dataManage, MARKER_URL, baseUrl, aboutMe } from "./js/data.js";
import { createCollectionView } from "./js/collection.js";
import { createTag } from './js/function.js'

const SELECT_BOX = document.getElementById("sub_region");
const START_BTN = document.getElementById("start_btn");
const SWITCH_BTN = document.getElementById("name_switch");
const FLAG_WRAPPER = document.getElementById("cauntry_flag_wrapper");
const RESULT_CLOSE_BTN = document.getElementById("result_close");

const collectionBtn = document.getElementById('collection_btn')
const menuBtn = document.getElementById('menue_btn')
const aboumeBtn = document.getElementById('aboutme_btn')
const popUpDom = document.getElementsByClassName("leaflet-popup-pane");

const Q_LEVEL = {
  easy: 5,
  normal: 10,
  hard: 15,
};

let level = Q_LEVEL.normal;

let correctCount = null;
let mistakeCount = null;

let referMarkers = [];
let referCircle;
let subregionName;

let isPlaying = false;
let nameHidden = false;

const fetchData = (str) => fetch(baseUrl + str).then((res) => res.json());

const firstReading = () => {
  fetchWorld().addTo(WORLDMAP);
  fetchWorld().addTo(MINIMAP);
  fetchData("all").then((data) => {
    console.log(data);
    // localStorage.clear();
    
    const headerDict = makeDict(data);
    const headerDOMs = createSubregionTags(headerDict);
    headerDOMs.forEach((dom) => {
      SELECT_BOX.appendChild(dom);
    });
    [...popUpDom].forEach((dom) => {
      dom.style.visibility = "hidden";
    });
  }).then(() => {
    if (!localStorage.getItem('isStarted')) setTimeout(() => aboutMe(), 1500)
    setTimeout(() => localStorage.setItem("isStarted", "true"), 2000);
  })
};

aboumeBtn.addEventListener('click', () => aboutMe())

collectionBtn.addEventListener('click', () => fetchData("all").then((data) => createCollectionView(data)))

menuBtn.addEventListener('click', () => createChart(dataManage))


RESULT_CLOSE_BTN.addEventListener("click", () => {
  const result = document.getElementById("result");
  initElements(result);
  createChart(dataManage);
});

SWITCH_BTN.addEventListener("click", () => hiddenName());

START_BTN.addEventListener("click", () => {
  // correctCount = 10;
  if (isPlaying) {
    if (confirm("テストをあきらめて地域選択にもどりますか？")) {
      changeBtn("テストにチャレンジ");
      document.getElementById("subregion_name").textContent = "";
      clearView();
      const val =
        parseInt(localStorage.getItem(`${subregionName} challengeCount`)) - 1;
      localStorage.setItem(`${subregionName} challengeCount`, val);
      return;
    } else {
      return;
    }
  }

  if (referMarkers.length === 0) {
    alert("地域を選択してください");
    return;
  }

  if (!localStorage[`${subregionName} challengeCount`]) {
    localStorage.setItem(`${subregionName} challengeCount`, 1);
  } else {
    const val =
      parseInt(localStorage.getItem(`${subregionName} challengeCount`)) + 1;
    localStorage.setItem(`${subregionName} challengeCount`, val);
  }

  setFlagDOM(referMarkers);
  const MARKERS_DOM = document.querySelectorAll(".leaflet-marker-icon");
  const FLAGS_DOM = document.querySelectorAll(".flag_pic");
  MARKERS_DOM.forEach((d) => {
    d.setAttribute("src", MARKER_URL);
    d.style.width = "30px";
    d.style.height = "30px";
  });
  changeBtn("もどる");

  const TARGET_DOMS = [...MARKERS_DOM, ...FLAGS_DOM];
  console.log(TARGET_DOMS);
  playGame(TARGET_DOMS);
});

//エリア選択で
SELECT_BOX.addEventListener("click", (event) => {
  if (event.target.className.split(" ")[0] !== "subregion") {
    return;
  }
  if (isPlaying) {
    return;
  }

  referMarkers.forEach((d) => {
    d.closePopup();
  });

  initElements(FLAG_WRAPPER);

  subregionName = event.target.textContent;
  document.getElementById('subregion_name').textContent = subregionName
  const target = event.target.id.replace(/_/g, " ");
  fetch(baseUrl + "subregion/" + target)
    .then((res) => res.json())
    .then((data) => {
      //dataを整形
      return shuffle(formatData(data));
    })
    .then((data) => {
      //マーカーを設置
      const markers = data.map(d => {
        return makeMarker(
          [d.latlng[0], d.latlng[1]],
          d.translations.ja
        );
      });

      //マーカーデータの参照を作成
      referMarkers = markers;

      //ズームインの為の座標値を算出
      let sumLat = null;
      let sumLng = null;

      markers.forEach((marker) => {
        sumLat += marker._latlng.lat;
        sumLng += marker._latlng.lng;
        marker.addTo(WORLDMAP);
      });

      //ズームしてポインタを表示
      WORLDMAP.setView([sumLat / markers.length, sumLng / markers.length], 4);
      const circle = makeCircle(
        sumLat / markers.length,
        sumLng / markers.length
      );
      referCircle = circle;
      circle.addTo(MINIMAP);
      return data;
    })
    .then((data) => {
      const MARKERS_DOM = document.querySelectorAll(".leaflet-marker-icon");
      MARKERS_DOM.forEach((DOM, i) => {
        //classの座標値でjudgeする方向性
        DOM.classList.add(data[i].latlng.join("_"));
        //マーカーのimgを国旗に変更
        DOM.setAttribute("src", data[i].flag);
        DOM.style.width = "60px";
        DOM.style.height = "40px";
      });
    });
});

const playGame = (TERGET_DOMS) => {
  isPlaying = true;
  if (correctCount === TERGET_DOMS.length / 2 || correctCount === level) {
    gameClear(TERGET_DOMS);
    return;
  }
  let answers = [];
  TERGET_DOMS.forEach((target_dom) => {
    target_dom.onclick = (e) => {
      const ansContainer = e.target.className.split(" ")[0];
      const ansLatLng = e.target.className.split(" ")[3];
      if (
        // １枚めと同じcontainerは選択できない
        (answers.length === 1 && answers[0][0] === ansContainer) ||
        // 正解したマーカーは選択できない
        e.target.getAttribute("name") === "corrected"
      ) {
        return;
      } else {
        e.target.classList.add("clicked");
        answers.push([ansContainer, ansLatLng, e.target]);
      }
      if (answers.length === 2) {
        judge(answers, TERGET_DOMS);
      }
    };
  });
};

const judge = (answers, TERGET_DOMS) => {
  console.log(answers[0], answers[1]);
  console.log(answers[0][1], answers[1][1]);
  if (answers[0][1] === answers[1][1]) {
    console.log("正解！");
    const markerDom = getImgSrc(answers).markerDom;
    const flagSrc = getImgSrc(answers).flagSrc;
    const flagDom = getImgSrc(answers).flagDom;
    setTimeout(() => {
      changeClass(/*del =*/ "clicked", /*add =*/ false);
      flagDom.classList.add("corrected");
      markerDom.setAttribute("name", "corrected");
      markerDom.setAttribute("src", flagSrc);
      markerDom.style.width = "40px";
      markerDom.style.height = "30px";
    }, 1000);
    correctCount++;
    console.log(correctCount);
  } else {
    console.log("間違い");
    setTimeout(() => changeClass(/*del =*/ "clicked", /*add =*/ false), 1000);
    mistakeCount++;
    console.log(mistakeCount);
  }
  answers.length = 0;
  playGame(TERGET_DOMS);
};

const gameClear = (data) => {
  isPlaying = false;
  document.getElementById("subregion_name").textContent = ""
  changeBtn("テストにチャレンジ");
  if (!localStorage[`${subregionName} clearCount`]) {
    localStorage.setItem(`${subregionName} clearCount`, 1);
  } else {
    const val =
      parseInt(localStorage.getItem(`${subregionName} clearCount`)) + 1;
    localStorage.setItem(`${subregionName} clearCount`, val);
  }

  const getFlagImgs = data.filter(
    (d) => d.className.split(" ")[0] === "flag_pic"
  );
  console.log(getFlagImgs[0].getAttribute("name"));
  const src = getFlagImgs.map((img) => img.getAttribute("src"));
  const name = getFlagImgs.map((img) => img.getAttribute("name"));
  console.log(src, name);

  const msg = document.getElementById("clearMsg");
  $("#result_modal").modal();
  console.log(mistakeCount);
  if (!mistakeCount) {
    result_getFlag(src, name, src.length);
    msg.textContent = "Get all flags!";
    clearView();
    return;
  }
  if (mistakeCount <= 5) {
    result_getFlag(src, name, 5);
    msg.textContent = "Get two flags!";
    clearView();
    return;
  }
  if (mistakeCount <= 3) {
    result_getFlag(src, name, 3);
    msg.textContent = "Get three flags!";
    clearView();
    return;
  }
  result_getFlag(src, name, 1);
  msg.textContent = "Get one flags!";
  clearView();
};

const result_getFlag = (src, name, leng) => {
  const result = document.getElementById("result");
  for (let i = 0; i < leng; i++) {
    createTag(
      "img",
      [
        ["src", src[i]],
        ["alt", name[i]],
        ["class", "result_flag"],
      ],
      false,
      result
    );
    localStorage.setItem(`${name[i]} src`, src[i]);
  }
};

const clearView = () => {
  isPlaying = false;
  correctCount = 0;
  mistakeCount = 0;
  initElements(FLAG_WRAPPER);
  referMarkers.length = 0;
};

const makeDict = (data) => {
  const dict = new Map();
  data.forEach((e) => {
    if (dict.has(e.subregion)) {
      const x = dict.get(e.subregion);
      dict.set(e.subregion, parseInt(x + 1));
    } else {
      dict.set(e.subregion, 1);
    }
  });
  return dict;
};

const createSubregionTags = (dict) => {
  let i = 0;
  let renameKey = [];
  let japaneseKey = Object.keys(dataManage);
  let beforeSortData = [];
  dict.forEach((val, key) => {
    renameKey.push(key.replace(key, japaneseKey[i]));
    if (key) {
      const outlineTag = createTag(
        "div",
        ["class", "select_btn my-1 mr-3 " + dataManage[japaneseKey[i]].postion],
        false,
        false
      );
      createTag(
        /*tag*/ "button",
        [
          [/*attr1*/ "id", `${key.replace(/\s+/g, "_")}`],
          [/*attr2*/ "class", `subregion btn btn-outline-dark py-1 px-3`],
        ],
        /*value*/ renameKey[i],
        /*append*/ outlineTag
      );
      
      const innerTag = createTag(
        "div",
        ["class", "content_wrap m-0 p-0"],
        false,
        outlineTag
      );
      createTag(
        "p",
        ["class", "cauntry_count subregion_content m-0 p-0"],
        `${val}カ国`,
        innerTag
      );
      createTag(
        "p",
        ["class", "level subregion_content m-0 p-0"],
        "",
        innerTag
      );
      const getval1 = () => {
        const val = localStorage.getItem(`${renameKey[i]} challengeCount`);
        if (val) {
          return val;
        } else {
          return 0;
        }
      };

      const getval2 = () => {
        const val = localStorage.getItem(`${renameKey[i]} clearCount`);
        if (val) {
          return val;
        } else {
          return 0;
        }
      };
      createTag(
        "p",
        [
          ["class", "info subregion_content m-0 p-0"],
          ["href", "#"],
        ],
        `チャレンジ: ${getval1()}  クリア: ${getval2()}`,
        outlineTag
      );
      beforeSortData.push(outlineTag);
    }
    i++;
  });
  return beforeSortData.sort(
    (a, b) => a.className.split(" ")[3] - b.className.split(" ")[3]
  );
};

const formatData = (data) => {
  let flagData = [];
  data.forEach((d) => {
    if (d.latlng[0] !== undefined || d.latlng[1] !== undefined) {
      flagData.push({
        name: d.name,
        flag: d.flag,
        latlng: [d.latlng[0], d.latlng[1]],
        translations: d.translations,
      });
    }
  });
  return flagData;
};

const setFlagDOM = (flagData) => {
  console.log(flagData[0]);
  for (let i = 0; i < level; i++) {
    if (i >= flagData.length) return;
    createTag(
      "img",
      [
        ["src", flagData[i]._icon.currentSrc],
        [
          "class",
          `flag_pic _ _ ${flagData[i]._latlng.lat}_${flagData[i]._latlng.lng}`,
        ],
        ["name", flagData[i]._tooltip._content],
      ],
      false,
      FLAG_WRAPPER
    );
  }
};

const shuffle = ([...arr]) => {
  let m = arr.length;
  while (m) {
    const i = Math.floor(Math.random() * m--);
    console.log(i);
    [arr[m], arr[i]] = [arr[i], arr[m]];
  }
  return arr;
};

const initElements = (...args) => {
  if (referMarkers) {
    removeMarker(referMarkers);
  }
  if (referCircle) {
    removeCircle(referCircle);
  }
  args.forEach((arg) => {
    while (arg.firstChild) {
      arg.removeChild(arg.firstChild);
    }
  });
};

const changeClass = (delClassName, addClassName) => {
  const elements = document.querySelectorAll(`.${delClassName}`);
  elements.forEach((element) => element.classList.remove(delClassName));
  if (addClassName) {
    elements.forEach((element) => element.classList.add(addClassName));
  }
};

const getImgSrc = (answers) => {
  if (answers[0][0] !== "flag_pic") {
    return {
      markerDom: answers[0][2],
      markerSrc: answers[0][2].getAttribute("src"),
      flagDom: answers[1][2],
      flagSrc: answers[1][2].getAttribute("src"),
    };
  } else {
    return {
      markerDom: answers[1][2],
      markerSrc: answers[1][2].getAttribute("src"),
      flagDom: answers[0][2],
      flagSrc: answers[0][2].getAttribute("src"),
    };
  }
};

const changeBtn = (text) => {
  if (text === "もどる") {
    START_BTN.textContent = text;
    START_BTN.classList.remove("btn-info");
    START_BTN.classList.add("btn-danger");
  } else if (text === "テストにチャレンジ") {
    START_BTN.textContent = text;
    START_BTN.classList.remove("btn-danger");
    START_BTN.classList.add("btn-info");
  }
};

window.onload = firstReading();

export {createTag}