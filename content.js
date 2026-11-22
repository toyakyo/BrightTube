const STYLE_ID = "brighttube-style";
const BAR_ID = "brighttube-bar";
const LEVELS = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
const DEFAULT_BRIGHTNESS = 100;

let current = DEFAULT_BRIGHTNESS;

// 亮度 = 十位（單選）+ 個位（滑桿 0~9）；100 沒有個位
const tensOf = (p) => (p >= 100 ? 100 : Math.floor(p / 10) * 10);
const onesOf = (p) => (p >= 100 ? 0 : p % 10);

function applyBrightness(percent) {
  current = percent;
  let style = document.getElementById(STYLE_ID);
  if (!style) {
    style = document.createElement("style");
    style.id = STYLE_ID;
    (document.head || document.documentElement).appendChild(style);
    style.textContent = `video { filter: brightness(var(--brighttube, 1)) !important; }`;
  }
  document.documentElement.style.setProperty("--brighttube", percent / 100);
  const host = document.getElementById(BAR_ID);
  if (host) {
    const root = host.shadowRoot;
    root.querySelectorAll('input[type="radio"]').forEach((r) => {
      r.checked = Number(r.value) === tensOf(percent);
    });
    const fine = root.querySelector(".fine");
    fine.value = onesOf(percent);
    fine.disabled = percent === 100;
    root.querySelector(".fine-value").textContent = `+${onesOf(percent)}%`;
  }
}

const BAR_CSS = `
  .bar { display: flex; flex-direction: column; gap: 10px;
         box-sizing: border-box; width: max-content; max-width: 100%; padding: 10px 14px; border-radius: 8px;
         background: #000; color: #fff; font: 14px/1.2 Roboto, Arial, sans-serif; }
  .row { display: flex; align-items: center; gap: 12px; }
  .levels { display: flex; gap: 10px; min-width: 0; }
  .fine { flex: 1; min-width: 0; accent-color: #fff; margin: 0; cursor: pointer; }
  .fine:disabled { opacity: .4; cursor: default; }
  .fine-value { min-width: 3em; text-align: right; }
  .title { font-weight: 500; opacity: .8; }
  label { display: inline-flex; align-items: center; gap: 4px; cursor: pointer; white-space: nowrap; }
  input { accent-color: #fff; margin: 0; cursor: pointer; width: 14px; height: 14px; }
`;

// 外層樣式用 inline !important，避免被 YouTube 的 CSS 蓋掉
const HOST_STYLE = {
  display: "flex",
  "justify-content": "flex-end",
  position: "relative",
  "z-index": "1",
  width: "100%",
  "box-sizing": "border-box",
  margin: "10px 0 8px 0",
};

function buildBar() {
  const host = document.createElement("div");
  host.id = BAR_ID;
  for (const [k, v] of Object.entries(HOST_STYLE)) host.style.setProperty(k, v, "important");
  const root = host.attachShadow({ mode: "open" });
  const style = document.createElement("style");
  style.textContent = BAR_CSS;
  const bar = document.createElement("div");
  bar.className = "bar";
  const coarse = document.createElement("div");
  coarse.className = "row";
  const title = document.createElement("span");
  title.className = "title";
  title.textContent = chrome.i18n.getMessage("brightnessLabel");
  coarse.appendChild(title);
  const levels = document.createElement("div");
  levels.className = "levels";
  coarse.appendChild(levels);
  for (const level of LEVELS) {
    const label = document.createElement("label");
    const input = document.createElement("input");
    input.type = "radio";
    input.name = "brighttube";
    input.value = level;
    input.checked = level === tensOf(current);
    input.addEventListener("change", () => {
      chrome.storage.sync.set({ brightness: level === 100 ? 100 : level + onesOf(current) });
    });
    label.append(input, `${level}%`);
    levels.appendChild(label);
  }

  const fineRow = document.createElement("div");
  fineRow.className = "row";
  const fineTitle = document.createElement("span");
  fineTitle.className = "title";
  fineTitle.textContent = chrome.i18n.getMessage("fineLabel");
  const fine = document.createElement("input");
  fine.type = "range";
  fine.className = "fine";
  fine.min = 0;
  fine.max = 9;
  fine.step = 1;
  fine.value = onesOf(current);
  fine.disabled = current === 100;
  const fineValue = document.createElement("span");
  fineValue.className = "fine-value";
  fineValue.textContent = `+${onesOf(current)}%`;
  fine.addEventListener("input", () => {
    chrome.storage.sync.set({ brightness: tensOf(current) + Number(fine.value) });
  });
  fineRow.append(fineTitle, fine, fineValue);

  bar.append(coarse, fineRow);
  root.append(style, bar);
  return host;
}

function ensureBar() {
  const below = document.querySelector("ytd-watch-flexy #below");
  if (!below) return;
  const existing = document.getElementById(BAR_ID);
  if (existing && existing.parentNode === below && below.firstChild === existing) return;
  below.insertBefore(existing || buildBar(), below.firstChild);
}

chrome.storage.sync.get({ brightness: DEFAULT_BRIGHTNESS }, ({ brightness }) => {
  applyBrightness(brightness);
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "sync" && changes.brightness) {
    applyBrightness(changes.brightness.newValue);
  }
});

// YouTube 是 SPA：頁面切換或重繪後確保控制列仍存在
new MutationObserver(ensureBar).observe(document.documentElement, {
  childList: true,
  subtree: true,
});
document.addEventListener("yt-navigate-finish", ensureBar);
