import fs from "node:fs";

const csv = fs.readFileSync("dataset/Symptom/dataset.csv", "utf8");
const keys = new Set();
for (const line of csv.split(/\r?\n/).slice(1)) {
  const cells = line.split(",");
  for (const value of cells.slice(1)) {
    const key = value.trim();
    if (key) keys.add(key);
  }
}
const overrides = {
  high_fever: { hi: "तेज़ बुखार", gu: "ખૂબ તાવ" },
  fever: { hi: "बुखार", gu: "તાવ" },
  headache: { hi: "सिरदर्द", gu: "માથાનો દુખાવો" },
  skin_rash: { hi: "त्वचा पर दाने/चकत्ते", gu: "ત્વચા પર ચકામા" },
  itching: { hi: "खुजली", gu: "ખંજવાળ" },
  cough: { hi: "खांसी", gu: "ઉધરસ" },
  vomiting: { hi: "उल्टी", gu: "ઉલટી" },
  fatigue: { hi: "थकान", gu: "થાક" },
  dizziness: { hi: "चक्कर", gu: "ચક્કર" },
  diarrhoea: { hi: "दस्त", gu: "ઝાડા" },
  stomach_pain: { hi: "पेट दर्द", gu: "પેટમાં દુખાવો" },
  abdominal_pain: { hi: "पेट दर्द", gu: "પેટમાં દુખાવો" },
  breathlessness: { hi: "सांस लेने में तकलीफ", gu: "શ્વાસ લેવામાં તકલીફ" },
  polyuria: { hi: "बार-बार पेशाब आना", gu: "વારંવાર પેશાબ આવવો" },
};
const pretty = (key) => key.replaceAll("_", " ").replace(/\b\w/g, (c) => c.toUpperCase());
const labels = Object.fromEntries([...keys].sort().map((key) => [key, {
  en: pretty(key), hi: overrides[key]?.hi || pretty(key), gu: overrides[key]?.gu || pretty(key),
}]));
fs.mkdirSync("ml/i18n", { recursive: true });
fs.writeFileSync("ml/i18n/symptom_labels.json", JSON.stringify(labels, null, 2) + "\n");
