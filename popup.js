document.getElementById("title").textContent = chrome.i18n.getMessage("brightnessLabel");

const radios = document.querySelectorAll('input[name="brightness"]');

chrome.storage.sync.get({ brightness: 100 }, ({ brightness }) => {
  radios.forEach((r) => {
    r.checked = Number(r.value) === brightness;
  });
});

radios.forEach((r) => {
  r.addEventListener("change", () => {
    chrome.storage.sync.set({ brightness: Number(r.value) });
  });
});
