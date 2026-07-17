// keywords.json dosyasını okuyup kullanıma hazırlayan fonksiyon
async function loadKeywords() {
  const url = chrome.runtime.getURL('keywords.json');
  const response = await fetch(url);
  const data = await response.json();
  return data;
}
// Metni normalize eder: küçük harf + sansür çözme
function normalizeText(text) {
  let result = text
    .replace(/İ/g, 'i')
    .replace(/I/g, 'i')
    .toLowerCase();

  const censorMap = {
    '0': 'o', '1': 'i', '3': 'e',
    '4': 'a', '5': 's', '7': 't',
    '@': 'a', '$': 's'
  };

  for (const [censored, real] of Object.entries(censorMap)) {
    result = result.split(censored).join(real);
  }

  return result;
}

// Asıl karar fonksiyonu: bu metin bahis içeriği mi?
function isBettingContent(text, keywords) {
  let cleaned = normalizeText(text);
  cleaned = removeIgnored(cleaned, keywords.ignored);

  const allTerms = [...keywords.kesin, ...keywords.genel];

  return allTerms.some(term => cleaned.includes(term));
}