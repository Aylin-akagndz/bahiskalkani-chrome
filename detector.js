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
}// ignored listesindeki kelimeleri metinden çıkarır
function removeIgnored(text, ignoredList) {
  let result = text;
  for (const ignored of ignoredList) {
    result = result.split(ignored).join('');
  }
  return result;
}

function isBettingContent(text, keywords) {
  let cleaned = normalizeText(text);
  cleaned = removeIgnored(cleaned, keywords.ignored);

  // Kesin ifadeler her zaman engelleme sebebi (muaf bile olsa)
  const kesinEslesme = keywords.kesin.some(term => cleaned.includes(term));
  if (kesinEslesme) return true;

  // Muaf (haber/uyarı) bağlamı varsa, genel terimler artık sebep sayılmaz
  const muafVar = (keywords.muaf || []).some(term => cleaned.includes(term));
  if (muafVar) return false;

  // Muaf değilse, genel terimlere de bak
  return keywords.genel.some(term => cleaned.includes(term));
}