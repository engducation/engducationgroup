/**
 * Phonetic map: IPA → mô tả tiếng Việt ngắn gọn
 *
 * Được dùng trong PronunciationTooltip để giải thích cách đọc
 * phiên âm IPA của một từ vựng tiếng Anh cho học viên Việt.
 *
 * Mỗi key là 1 ký hiệu IPA; value là cặp [âm thanh, ví dụ tham chiếu].
 * Ký tự nào không có trong map sẽ hiển thị "âm X" mặc định.
 */

export type PhoneticEntry = {
  /** The IPA symbol (or digraph) */
  symbol: string;
  /** Short Vietnamese description, e.g. 'âm "c"' */
  sound: string;
  /** A reference word that uses the sound, e.g. 'cup' */
  example?: string;
};

const RAW_MAP: Record<string, Omit<PhoneticEntry, "symbol">> = {
  // ── Vowels ───────────────────────────────────────────────────────
  "iː": { sound: "âm \"i\" dài (see)", example: "see" },
  "ɪ": { sound: "âm \"i\" ngắn", example: "bit" },
  "e": { sound: "âm \"e\" (đờ)", example: "bed" },
  "ɛ": { sound: "âm \"e\" mở", example: "bed" },
  "æ": { sound: "âm \"a\" rộng", example: "cat" },
  "a": { sound: "âm \"a\"", example: "father" },
  "ɑ": { sound: "âm \"o\" sâu", example: "hot" },
  "ɔ": { sound: "âm \"o\"", example: "thought" },
  "o": { sound: "âm \"ô\"", example: "go" },
  "oʊ": { sound: "âm \"ô-u\"", example: "boat" },
  "u": { sound: "âm \"u\" dài", example: "food" },
  "ʊ": { sound: "âm \"u\" ngắn", example: "book" },
  "uː": { sound: "âm \"u\" dài", example: "food" },
  "ə": { sound: "âm \"ơ\" nhẹ", example: "ago" },
  "ɜ": { sound: "âm \"ơ\" mở", example: "bird" },
  "ɜː": { sound: "âm \"ơ\" dài", example: "bird" },
  "ʌ": { sound: "âm \"u\" ngắn", example: "cup" },
  "eɪ": { sound: "âm \"ây\"", example: "day" },
  "aɪ": { sound: "âm \"ai\"", example: "my" },
  "aʊ": { sound: "âm \"ao\"", example: "now" },
  "ɔɪ": { sound: "âm \"oi\"", example: "boy" },
  "aʊə": { sound: "âm \"aue\"", example: "hour" },
  "iə": { sound: "âm \"ia\"", example: "near" },
  "eə": { sound: "âm \"ea\"", example: "hair" },
  "ʊə": { sound: "âm \"ua\"", example: "pure" },

  // ── Consonants ───────────────────────────────────────────────────
  p: { sound: "âm \"p\" (bật hơi)", example: "pen" },
  b: { sound: "âm \"b\"", example: "bat" },
  t: { sound: "âm \"t\" (bật hơi)", example: "ten" },
  d: { sound: "âm \"d\"", example: "dog" },
  k: { sound: "âm \"c\" (bật hơi)", example: "cat" },
  ɡ: { sound: "âm \"g\"", example: "go" },
  g: { sound: "âm \"g\"", example: "go" },
  f: { sound: "âm \"ph\"", example: "fish" },
  v: { sound: "âm \"v\"", example: "van" },
  θ: { sound: "âm \"th\" (gió)", example: "think" },
  ð: { sound: "âm \"th\" (rung)", example: "this" },
  s: { sound: "âm \"s\"", example: "sun" },
  z: { sound: "âm \"z\"", example: "zoo" },
  ʃ: { sound: "âm \"sh\"", example: "shoe" },
  ʒ: { sound: "âm \"zh\"", example: "vision" },
  h: { sound: "âm \"h\"", example: "hat" },
  tʃ: { sound: "âm \"ch\"", example: "chair" },
  dʒ: { sound: "âm \"j\"", example: "jam" },
  m: { sound: "âm \"m\"", example: "moon" },
  n: { sound: "âm \"n\"", example: "net" },
  ŋ: { sound: "âm \"ng\"", example: "sing" },
  l: { sound: "âm \"l\"", example: "leaf" },
  r: { sound: "âm \"r\"", example: "red" },
  ɹ: { sound: "âm \"r\"", example: "red" },
  w: { sound: "âm \"w\"", example: "wet" },
  j: { sound: "âm \"y\"", example: "yes" },
  "ɾ": { sound: "âm \"r\" lướt", example: "butter (Mỹ)" },
  "ʔ": { sound: "âm \"?\" (bật hơi glottal)", example: "uh-oh" },
  ʍ: { sound: "âm \"wh\"", example: "which" },
};

/**
 * Build a list of phonetic entries from a string like "/ˈkʌmftəbl/".
 * The string may contain stress marks (ˈ ˌ), length marks (ː) and the
 * surrounding slashes; we strip them and slice the string into the
 * digraphs / single symbols defined in `RAW_MAP`. Unrecognized symbols
 * are returned with a generic "âm X" placeholder so the user still gets
 * per-character feedback.
 */
export function parsePhonetic(input: string): PhoneticEntry[] {
  if (!input) return [];
  // Strip the surrounding slashes and any whitespace.
  let cleaned = input.trim();
  if (cleaned.startsWith("/") && cleaned.endsWith("/")) {
    cleaned = cleaned.slice(1, -1);
  }
  // Drop stress/length markers; we only want the phoneme symbols.
  cleaned = cleaned.replace(/[ˈˌː͡]/g, "");

  const out: PhoneticEntry[] = [];
  let i = 0;
  while (i < cleaned.length) {
    // Try longest match first: 2-char digraphs then 1-char.
    const two = cleaned.slice(i, i + 2);
    const one = cleaned[i];

    let entry: Omit<PhoneticEntry, "symbol"> | undefined;
    let len = 0;
    if (two && RAW_MAP[two]) {
      entry = RAW_MAP[two];
      len = 2;
    } else if (one && RAW_MAP[one]) {
      entry = RAW_MAP[one];
      len = 1;
    } else if (one) {
      // Unrecognized — generate a generic placeholder.
      entry = { sound: `âm "${one}"` };
      len = 1;
    }
    if (entry && len > 0) {
      out.push({ symbol: cleaned.slice(i, i + len), ...entry });
      i += len;
    } else {
      // Skip unknown whitespace/punctuation.
      i += 1;
    }
  }
  return out;
}
