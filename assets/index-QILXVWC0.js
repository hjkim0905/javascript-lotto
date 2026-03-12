(function polyfill() {
  const relList = document.createElement("link").relList;
  if (relList && relList.supports && relList.supports("modulepreload")) return;
  for (const link of document.querySelectorAll('link[rel="modulepreload"]')) processPreload(link);
  new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type !== "childList") continue;
      for (const node of mutation.addedNodes) if (node.tagName === "LINK" && node.rel === "modulepreload") processPreload(node);
    }
  }).observe(document, {
    childList: true,
    subtree: true
  });
  function getFetchOpts(link) {
    const fetchOpts = {};
    if (link.integrity) fetchOpts.integrity = link.integrity;
    if (link.referrerPolicy) fetchOpts.referrerPolicy = link.referrerPolicy;
    if (link.crossOrigin === "use-credentials") fetchOpts.credentials = "include";
    else if (link.crossOrigin === "anonymous") fetchOpts.credentials = "omit";
    else fetchOpts.credentials = "same-origin";
    return fetchOpts;
  }
  function processPreload(link) {
    if (link.ep) return;
    link.ep = true;
    const fetchOpts = getFetchOpts(link);
    fetch(link.href, fetchOpts);
  }
})();
const loadComponent = (id, path) => {
  return fetch(path).then((response) => response.text()).then((data) => {
    document.getElementById(id).insertAdjacentHTML("beforeend", data);
    return loadNestedComponents(document.getElementById(id));
  });
};
const loadNestedComponents = (root) => {
  const targetComponents = root.querySelectorAll("[data-component]");
  const promises = [...targetComponents].map((element) => {
    const elementPath = element.dataset.component;
    element.removeAttribute("data-component");
    return fetch(elementPath).then((response) => response.text()).then((html) => {
      element.insertAdjacentHTML("beforeend", html);
      return loadNestedComponents(element);
    });
  });
  return Promise.all(promises);
};
const parseStringToNumber = (userInput) => {
  return Number(userInput);
};
const LOTTO_RULES = Object.freeze({
  NUMBER_COUNT: 6,
  MAX_NUMBER: 45,
  MIN_NUMBER: 1
});
const PRIZE_PER_RANK = Object.freeze({
  1: 2e9,
  2: 3e7,
  3: 15e5,
  4: 5e4,
  5: 5e3
});
const validateNumber = (userInput) => {
  if (Number.isNaN(userInput)) throw new Error("[ERROR] 숫자를 입력해주세요");
  if (!Number.isFinite(userInput))
    throw new Error("[ERROR] 유효한 숫자를 입력해주세요");
  return userInput;
};
const validateRange = (number) => {
  if (number > LOTTO_RULES.MAX_NUMBER)
    throw new Error("[ERROR] 로또 번호는 45이하의 숫자로 입력해주세요");
  if (number < LOTTO_RULES.MIN_NUMBER)
    throw new Error("[ERROR] 로또 번호는 1이상의 숫자로 입력해주세요");
  return number;
};
const validateNoDuplicate = (lottoNumbers) => {
  if (lottoNumbers.length !== new Set(lottoNumbers).size)
    throw new Error("[ERROR] 로또 번호는 중복되지 않는 숫자로 입력해주세요");
  return lottoNumbers;
};
const validateCount = (lottoNumbers) => {
  if (lottoNumbers.length !== 6)
    throw new Error("[ERROR] 로또는 6개의 숫자로 이루어져야 합니다.");
  return lottoNumbers;
};
const validatePositive = (number) => {
  if (number <= 0) throw new Error("[ERROR] 양수만 입력해주세요");
  return number;
};
const validateUnit = (purchaseAmount) => {
  if (purchaseAmount % 1e3 !== 0)
    throw new Error("[ERROR] 1000 단위의 숫자로 입력해주세요");
  return purchaseAmount;
};
const validatePurchaseAmount = (number) => {
  validateNumber(number);
  validatePositive(number);
  validateUnit(number);
  return number;
};
const validateLottoNumbers = (lottoNumbers) => {
  validateNoDuplicate(lottoNumbers);
  validateCount(lottoNumbers);
  lottoNumbers.forEach((lottoNumber) => {
    validateNumber(lottoNumber);
    validateRange(lottoNumber);
  });
  return lottoNumbers;
};
const validateBonusNumber = (bonusNumber, winningNumbers) => {
  validateNumber(bonusNumber);
  validateRange(bonusNumber);
  if (winningNumbers.includes(bonusNumber))
    throw new Error("[ERROR] 보너스 번호는 당첨 번호와 중복될 수 없습니다.");
  return bonusNumber;
};
const getPurchaseAmountInput = () => document.querySelector("#purchase-input-section input").value;
const getWinningNumbersInput = () => [...document.querySelectorAll("#winning-inputs-div input")].map(
  (element) => element.value
);
const getBonusNumberInput = () => document.querySelector("#winning-bonus-div input").value;
class Lotto {
  #numbers;
  constructor(lottoNumberList) {
    this.#validate(lottoNumberList);
    this.#numbers = [...lottoNumberList].sort((a, b) => a - b);
  }
  #validate(numbers) {
    if (numbers.length !== LOTTO_RULES.NUMBER_COUNT)
      throw new Error("[ERROR] 로또 번호는 6개여야 합니다.");
    if (new Set(numbers).size !== LOTTO_RULES.NUMBER_COUNT)
      throw new Error("[ERROR] 로또 번호는 중복되지 않아야 합니다.");
    if (numbers.some(
      (n) => n < LOTTO_RULES.MIN_NUMBER || n > LOTTO_RULES.MAX_NUMBER
    ))
      throw new Error("[ERROR] 로또 번호는 1~45 사이여야 합니다.");
  }
  getNumbers() {
    return [...this.#numbers];
  }
}
const generateLottos = (randomNumbersList) => {
  return randomNumbersList.map((randomNumbers) => new Lotto(randomNumbers));
};
const generateRandomNumbers = () => {
  const randomSet = /* @__PURE__ */ new Set();
  while (randomSet.size < LOTTO_RULES.NUMBER_COUNT) {
    randomSet.add(
      Math.floor(Math.random() * LOTTO_RULES.MAX_NUMBER) + LOTTO_RULES.MIN_NUMBER
    );
  }
  return Array.from(randomSet);
};
const renderPurchaseCount = (count) => {
  document.getElementById("purchase-count-span").textContent = `총 ${count}개를 구매하였습니다.`;
};
const renderLottoList = (lottos) => {
  const section = document.getElementById("purchase-lotto-section");
  section.innerHTML = "";
  lottos.forEach((lotto) => {
    const row = document.createElement("div");
    row.id = "purchase-lottos";
    row.innerHTML = `<span id="lotto-icon">🎟️</span><span class="game-container-span">${lotto.getNumbers().join(", ")}</span>`;
    section.appendChild(row);
  });
};
const renderStatistics = (prizeList, profitRate) => {
  const rows = document.querySelectorAll("#statistics-table tbody tr");
  const order = [5, 4, 3, 2, 1];
  rows.forEach((row, index) => {
    row.cells[2].textContent = `${prizeList[order[index]]}개`;
  });
  document.getElementById("profit-div").textContent = `당신의 총 수익률은 ${profitRate}%입니다.`;
};
const resetGame = () => {
  document.getElementById("purchase-count-span").textContent = "";
  document.getElementById("purchase-lotto-section").innerHTML = "";
  document.querySelector("#purchase-input-section input").value = "";
  document.querySelectorAll("#winning-inputs-div input").forEach((element) => {
    element.value = "";
  });
  document.querySelector("#winning-bonus-div input").value = "";
};
class WinningLotto extends Lotto {
  #bonusNumber;
  constructor(numbers, bonus) {
    super(numbers);
    this.#validateBonusNumber(numbers, bonus);
    this.#bonusNumber = bonus;
  }
  #validateBonusNumber(winningNumbers, bonusNumber) {
    if (bonusNumber < 1 || bonusNumber > 45)
      throw new Error("[ERROR] 보너스 번호는 1~45 사이여야 합니다.");
    if (winningNumbers.includes(bonusNumber))
      throw new Error("[ERROR] 보너스 번호는 당첨 번호와 중복될 수 없습니다.");
  }
  getBonusNumber() {
    return this.#bonusNumber;
  }
  getRank(lotto) {
    const matchingCount = lotto.getNumbers().filter((x) => this.getNumbers().includes(x)).length;
    const isBonus = lotto.getNumbers().includes(this.#bonusNumber);
    if (matchingCount === 6) return 1;
    if (matchingCount === 5 && isBonus) return 2;
    if (matchingCount === 5) return 3;
    if (matchingCount === 4) return 4;
    if (matchingCount === 3) return 5;
    return null;
  }
}
const getReturnRate = (prizeList, purchaseAmount) => {
  const totalPrize = prizeList.reduce((acc, count, index) => {
    return acc + (PRIZE_PER_RANK[index] ?? 0) * count;
  }, 0);
  return Math.round(totalPrize / purchaseAmount * 100 * 10) / 10;
};
const getPrizeList = (purchasedLottos, winningLotto) => {
  const prizeList = [0, 0, 0, 0, 0, 0];
  purchasedLottos.forEach((lotto) => {
    const rank = winningLotto.getRank(lotto);
    if (rank !== null) prizeList[rank]++;
  });
  return prizeList;
};
const BASE_URL = "/javascript-lotto/";
loadComponent("main", `${BASE_URL}src/ui/html/main.html`).then(() => {
  const modalContainer = document.getElementById("modal-container");
  const modalCloseButton = document.getElementById("modal-close-button");
  document.querySelector("#modal-close-button img").src = `${BASE_URL}close-button.svg`;
  let purchaseAmount = 0;
  let generatedLottos = [];
  document.querySelector("#purchase-input-section button").addEventListener("click", () => {
    try {
      const amount = parseStringToNumber(getPurchaseAmountInput());
      validatePurchaseAmount(amount);
      purchaseAmount = amount;
      const purchaseCount = amount / 1e3;
      generatedLottos = generateLottos(
        Array.from({ length: purchaseCount }, generateRandomNumbers)
      );
      renderPurchaseCount(purchaseCount);
      renderLottoList(generatedLottos);
    } catch (e) {
      alert(e.message);
    }
  });
  document.querySelector("#winning-input-section button").addEventListener("click", () => {
    try {
      const winningNumbers = getWinningNumbersInput().map(
        (number) => parseStringToNumber(number)
      );
      const bonusNumber = parseStringToNumber(getBonusNumberInput());
      validateLottoNumbers(winningNumbers);
      validateBonusNumber(bonusNumber, winningNumbers);
      const winningLotto = new WinningLotto(winningNumbers, bonusNumber);
      const prizeList = getPrizeList(generatedLottos, winningLotto);
      const profitRate = getReturnRate(prizeList, purchaseAmount);
      renderStatistics(prizeList, profitRate);
      modalContainer.style.display = "flex";
    } catch (e) {
      alert(e.message);
    }
  });
  modalContainer.addEventListener("click", (e) => {
    if (e.target === modalContainer) {
      modalContainer.style.display = "none";
    }
  });
  modalCloseButton.addEventListener("click", () => {
    modalContainer.style.display = "none";
  });
  document.querySelector("#modal-statistics-section button").addEventListener("click", () => {
    resetGame();
    purchaseAmount = 0;
    generatedLottos = [];
    modalContainer.style.display = "none";
  });
});
