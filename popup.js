document.getElementById("title").textContent = chrome.i18n.getMessage("brightnessLabel");
document.getElementById("fine-title").textContent = chrome.i18n.getMessage("fineLabel");

const radios = document.querySelectorAll('input[name="brightness"]');
const fine = document.getElementById("fine");
const fineValue = document.getElementById("fine-value");

// 亮度 = 十位（單選）+ 個位（滑桿 0~9）；100 沒有個位
const tensOf = (p) => (p >= 100 ? 100 : Math.floor(p / 10) * 10);
const onesOf = (p) => (p >= 100 ? 0 : p % 10);

let current = 100;

function render(percent) {
  current = percent;
  radios.forEach((r) => {
    r.checked = Number(r.value) === tensOf(percent);
  });
  fine.value = onesOf(percent);
  fine.disabled = percent === 100;
  fineValue.textContent = `+${onesOf(percent)}%`;
}

chrome.storage.sync.get({ brightness: 100 }, ({ brightness }) => render(brightness));

radios.forEach((r) => {
  r.addEventListener("change", () => {
    const level = Number(r.value);
    const next = level === 100 ? 100 : level + onesOf(current);
    render(next);
    chrome.storage.sync.set({ brightness: next });
  });
});

fine.addEventListener("input", () => {
  const next = tensOf(current) + Number(fine.value);
  render(next);
  chrome.storage.sync.set({ brightness: next });
});
