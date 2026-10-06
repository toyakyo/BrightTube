const STYLE_ID = "brighttube-style";
const BAR_ID = "brighttube-bar";
const LEVELS = [0, 10, 30, 50, 70, 100];
const DEFAULT_BRIGHTNESS = 100;

let current = DEFAULT_BRIGHTNESS;

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
    host.shadowRoot.querySelectorAll("input").forEach((r) => {
      r.checked = Number(r.value) === percent;
    });
  }
}

const BAR_CSS = `
  .bar { display: flex; align-items: center; justify-content: center; gap: 16px; flex-wrap: wrap;
         box-sizing: border-box; width: 50%; min-width: 360px; padding: 10px 14px; border-radius: 8px;
         background: #000; color: #fff; font: 14px/1.2 Roboto, Arial, sans-serif; }
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
  const title = document.createElement("span");
  title.className = "title";
  title.textContent = chrome.i18n.getMessage("brightnessLabel");
  bar.appendChild(title);
  for (const level of LEVELS) {
    const label = document.createElement("label");
    const input = document.createElement("input");
    input.type = "radio";
    input.name = "brighttube";
    input.value = level;
    input.checked = level === current;
    input.addEventListener("change", () => {
      chrome.storage.sync.set({ brightness: level });
    });
    label.append(input, `${level}%`);
    bar.appendChild(label);
  }
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
