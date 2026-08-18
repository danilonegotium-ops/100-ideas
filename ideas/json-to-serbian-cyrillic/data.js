// Serbian Latin -> Cyrillic transliteration table.
//
// Serbian Latin has 30 letters, three of which are digraphs (lj, nj, dž) that
// each correspond to a SINGLE Cyrillic letter (љ, њ, џ). Digraphs must be
// matched before single letters, and each has three case-forms in Latin
// (all-lower, title-case, all-upper) that both collapse to just two case
// forms in Cyrillic, because Cyrillic љ/њ/џ have no separate "digraph"
// concept — e.g. both "Lj" and "LJ" become "Љ".
//
// q, w, x, y are not part of the standard Serbian alphabet (they only show
// up in foreign/borrowed words, URLs, emails, etc.) and are intentionally
// left unchanged.

const LATIN_TO_CYRILLIC_PAIRS = [
  // --- digraphs (must be matched before single letters) ---
  ["dž", "џ"], ["Dž", "Џ"], ["DŽ", "Џ"],
  ["lj", "љ"], ["Lj", "Љ"], ["LJ", "Љ"],
  ["nj", "њ"], ["Nj", "Њ"], ["NJ", "Њ"],

  // --- single letters, lowercase ---
  ["a", "а"], ["b", "б"], ["c", "ц"], ["č", "ч"], ["ć", "ћ"],
  ["d", "д"], ["đ", "ђ"], ["e", "е"], ["f", "ф"], ["g", "г"],
  ["h", "х"], ["i", "и"], ["j", "ј"], ["k", "к"], ["l", "л"],
  ["m", "м"], ["n", "н"], ["o", "о"], ["p", "п"], ["r", "р"],
  ["s", "с"], ["š", "ш"], ["t", "т"], ["u", "у"], ["v", "в"],
  ["z", "з"], ["ž", "ж"],

  // --- single letters, uppercase ---
  ["A", "А"], ["B", "Б"], ["C", "Ц"], ["Č", "Ч"], ["Ć", "Ћ"],
  ["D", "Д"], ["Đ", "Ђ"], ["E", "Е"], ["F", "Ф"], ["G", "Г"],
  ["H", "Х"], ["I", "И"], ["J", "Ј"], ["K", "К"], ["L", "Л"],
  ["M", "М"], ["N", "Н"], ["O", "О"], ["P", "П"], ["R", "Р"],
  ["S", "С"], ["Š", "Ш"], ["T", "Т"], ["U", "У"], ["V", "В"],
  ["Z", "З"], ["Ž", "Ж"]
];

// Grouped rows for the on-page reference table (base letter -> lower/upper pair).
const MAPPING_TABLE_DISPLAY = [
  ["A a", "А а"], ["B b", "Б б"], ["C c", "Ц ц"], ["Č č", "Ч ч"], ["Ć ć", "Ћ ћ"],
  ["D d", "Д д"], ["Dž dž", "Џ џ"], ["Đ đ", "Ђ ђ"], ["E e", "Е е"], ["F f", "Ф ф"],
  ["G g", "Г г"], ["H h", "Х х"], ["I i", "И и"], ["J j", "Ј ј"], ["K k", "К к"],
  ["L l", "Л л"], ["Lj lj", "Љ љ"], ["M m", "М м"], ["N n", "Н н"], ["Nj nj", "Њ њ"],
  ["O o", "О о"], ["P p", "П п"], ["R r", "Р р"], ["S s", "С с"], ["Š š", "Ш ш"],
  ["T t", "Т т"], ["U u", "У у"], ["V v", "В в"], ["Z z", "З з"], ["Ž ž", "Ж ж"]
];

if (typeof module !== "undefined" && module.exports) {
  module.exports = { LATIN_TO_CYRILLIC_PAIRS, MAPPING_TABLE_DISPLAY };
}
