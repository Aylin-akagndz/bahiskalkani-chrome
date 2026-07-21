// Şu anki sayfanın domaini güvenli/meşru listede mi kontrol eder
async function isSafeDomain() {
  const url = chrome.runtime.getURL('mesru_alanlar.json');
  const response = await fetch(url);
  const data = await response.json();
const safeDomains = data.alanlar;

  const currentHost = window.location.hostname; // örn. "www.ntv.com.tr"

  return safeDomains.some(domain => currentHost.includes(domain));
}
// Sayfadaki tüm metin parçalarını gezip bahis içeriğini kapatır
async function scanPage() {
  const safe = await isSafeDomain();
  if (safe) return; // güvenli sitedeyiz, hiç tarama yapma

  const keywords = await loadKeywords();

  const walker = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_TEXT
  );

  const matchedNodes = [];
  let node;
  while (node = walker.nextNode()) {
    const text = node.nodeValue.trim();
    if (text.length === 0) continue;

    if (isBettingContent(text, keywords)) {
      matchedNodes.push(node);
    }
  }

  matchedNodes.forEach(hideNode);
}
// Bir metin düğümünün en yakın kutusunu (div, p vb.) bulup üstünü kapatır
function hideNode(textNode) {
  const parent = textNode.parentElement;
  if (!parent || parent.dataset.bahiskalkaniKapatildi) return;

  parent.dataset.bahiskalkaniKapatildi = "true";
  parent.style.position = "relative";

  const overlay = document.createElement("div");
  overlay.style.cssText = `
    position: absolute;
    top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(20, 20, 20, 0.95);
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 13px;
    z-index: 9999;
    border-radius: 4px;
  `;
  overlay.innerHTML = `
    <span>🛡️ Bahis içeriği gizlendi</span>
    <button class="bk-goster" style="
      margin-left: 8px; padding: 4px 10px; font-size: 12px;
      background: white; color: black; border: none;
      border-radius: 4px; cursor: pointer;
    ">Yine de göster</button>
  `;

  const tekrarGizleBtn = document.createElement("button");
  tekrarGizleBtn.textContent = "🛡️";
  tekrarGizleBtn.title = "Tekrar gizle";
  tekrarGizleBtn.style.cssText = `
    position: absolute;
    top: 4px; right: 4px;
    width: 24px; height: 24px;
    font-size: 12px;
    background: rgba(20,20,20,0.9);
    color: white;
    border: none;
    border-radius: 50%;
    cursor: pointer;
    z-index: 9998;
    display: none;
  `;

  overlay.querySelector(".bk-goster").addEventListener("click", (e) => {
    e.stopPropagation();
    overlay.style.display = "none";
    tekrarGizleBtn.style.display = "block";
  });

  tekrarGizleBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    overlay.style.display = "flex";
    tekrarGizleBtn.style.display = "none";
  });

  parent.appendChild(overlay);
  parent.appendChild(tekrarGizleBtn);
}

scanPage();