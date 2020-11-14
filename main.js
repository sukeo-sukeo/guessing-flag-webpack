'use strict'

const SELECT_BOX = document.querySelector('#sub_region')
const NAME_WRAPPER = document.querySelector('#cauntry_name_wrapper')
const FLAG_WRAPPER = document.querySelector('#cauntry_flag_wrapper')

let correctCount = null

const baseUrl = 'https://restcountries.eu/rest/v2/';

(() => {
  fetch(baseUrl + 'all')
    .then((res) => res.json())
    .then((data) => {
      const dict = new Map();
      data.forEach((e) => {
        if (dict.has(e.subregion)) {
          const x = dict.get(e.subregion);
          dict.set(e.subregion, parseInt(x + 1));
        } else {
          dict.set(e.subregion, 1);
        }
      });
    
      dict.forEach((v, key) => {
        createTag('option', ['value', key], key + ' : ' + v + 'カ国', SELECT_BOX)
      });
    });
})();

SELECT_BOX.addEventListener('change', event => {
  correctCount = 0;
  initElements(NAME_WRAPPER, FLAG_WRAPPER)
  
  fetch(baseUrl + 'subregion/' + event.target.value)
    .then((res) => res.json())
    .then((data) => {
      console.log(data);
      const nameData = shuffle(formatData(data).nameData)
      const flagData = shuffle(formatData(data).flagData)
      createHTML(nameData, flagData)
    })
    .then(() => {
      const NAME_CARDS = document.querySelectorAll(".flag_name");
      const FLAG_CARDS = document.querySelectorAll(".flag_pic");
      const CARDS = [...NAME_CARDS, ...FLAG_CARDS];
      playGame(CARDS)
    });
})

const playGame = (CARDS) => {
  if (correctCount === CARDS.length / 2) {
    gemaClear()
    return
  }
  let answers = []
  CARDS.forEach((card) => {
    card.onclick = e => {
      const cardName = e.target.className.split(' ')[1]
      const cardPlace = e.target.className.split(' ')[0]
      // １枚めと同じ場所のカードは選択できない
      if (answers.length === 1 && answers[0][0] === cardPlace) {
        return
      } else {
        e.target.classList.add('clicked')
        answers.push([cardPlace, cardName])
      }
      if (answers.length === 2) {
        judge(answers, CARDS);
      }
    };
  });
};

const judge = (answers, CARDS) => {
  if (answers[0][1] === answers[1][1]) {
    console.log('正解！');
    changeStyle(
      /*deleteClassName =*/ "clicked",
      /*addClassName =*/ "corrected",
      /*timer =*/ 1000
    );
    correctCount++
    console.log(correctCount);
  } else {
    console.log('間違い');
    changeStyle(
      /*deleteClassName =*/ "clicked",
      /*addClassName =*/ false,
      /*timer =*/ 1000
    );
  }
  answers.length = 0
  playGame(CARDS)
}

const gemaClear = () => {
  correctCount = 0
  initElements(NAME_WRAPPER, FLAG_WRAPPER)
  NAME_WRAPPER.innerHTML = '<h1>Mission Complete!!</h1>'
}

const shuffle = ([...arr]) => {
  let m = arr.length
  while (m) {
    const i = Math.floor(Math.random() * m--)
    console.log(i);
    [arr[m], arr[i]] = [arr[i], arr[m]]
  }
  return arr
};

const formatData = (data) => {
  let nameData = [];
  let flagData = [];
  data.forEach((d) => {
    nameData.push({
      name: d.name,
      translations: d.translations,
    });
    flagData.push({
      name: d.name,
      flag: d.flag,
    });
  });
  return {
    nameData,
    flagData,
  };
};

const createHTML = (nameData, flagData) => {
  console.log(nameData, flagData);
  nameData.forEach((el) => {
    createTag('p', ['class', `flag_name ${el.name.replace(/\s/g, '_')}`], `${el.translations.ja}`, NAME_WRAPPER);
  });
  flagData.forEach((el) => {
    createTag('img', [['src', el.flag],['class', `flag_pic ${el.name.replace(/\s/g, '_')}`]], false, FLAG_WRAPPER);
  });
}

const changeStyle = (delClassName, addClassName, timer) => {
  setTimeout(() => {
    const elements = document.querySelectorAll(`.${delClassName}`)
    elements.forEach(element => element.classList.remove(delClassName))
    if (addClassName) {
      elements.forEach(element => element.classList.add(addClassName));
    }
  }, timer)
}

const initElements = (...args) => {
  args.forEach(arg => {
    while (arg.firstChild) {
      arg.removeChild(arg.firstChild);
    }
  });
};

//createTag('p', ['id', 'user_name' ], 'username: ', data_wrapper) return <p id='user_name'>username: </p>
//attrs, contentが不要の時はfalseを引数に入れてください
const createTag = (elementName, attrs, content, parentNode) => {
  const el = document.createElement(elementName)

  if (attrs !== false) {
    if (typeof attrs !== 'object') {
      console.error(
        '第２引数は配列、ペアでお願いします[attribute, attributeName]\n属性やテキストが必要ないときは"false"を入れてください'
      );
      return;
    }

    if (typeof attrs[0] === 'object') {
      attrs.forEach(attr => {
        el.setAttribute(attr[0], attr[1])
      })
    } else {
      el.setAttribute(attrs[0], attrs[1])
    }
  }

  if (content !== false) el.textContent = content

  if (parentNode) parentNode.appendChild(el)

  return el
}


