// Coding Challenges in Serbian — question bank.
// Scope note (see MASTER_TRACKER.md): no safe way to execute arbitrary user
// code client-side for this sprint, so these are multiple-choice /
// fill-in-the-blank challenges instead of a full code-execution judge. All
// prompts/explanations are in Serbian (Latin script); code snippets are
// plain JavaScript, chosen because it's easy to read for beginners without
// needing a compiler/type system explanation.
//
// type "mcq": `options` + `correctIndex` (0-based).
// type "fill": `answers` is a list of acceptable normalized strings (see
// normalizeAnswer() in app.js for how user input is compared).

const CHALLENGES = [
  {
    id: 1,
    category: "Promenljive",
    type: "mcq",
    prompt: "Koja je ispravna sintaksa za deklarisanje promenljive u JavaScript-u čija se vrednost NE MENJA nakon inicijalizacije?",
    code: null,
    options: ["var x = 5;", "let x = 5;", "const x = 5;", "static x = 5;"],
    correctIndex: 2,
    explanation: "const se koristi za promenljive čija se vrednost ne menja nakon deklaracije. let i var dozvoljavaju kasniju promenu vrednosti.",
  },
  {
    id: 2,
    category: "Promenljive",
    type: "mcq",
    prompt: "Šta će ispisati ovaj kod?",
    code: 'let a = 5;\nlet b = "5";\nconsole.log(a == b);',
    options: ["true", "false", "undefined", "Greška (error)"],
    correctIndex: 0,
    explanation: "Operator == poredi vrednosti nakon konverzije tipova (type coercion), pa je 5 == '5' tačno (true). Da smo koristili === (strogo poređenje), rezultat bi bio false.",
  },
  {
    id: 3,
    category: "Promenljive",
    type: "fill",
    prompt: "Dopuni: da bismo proverili da li su dve vrednosti STROGO jednake (i po tipu i po vrednosti), koristimo operator ___.",
    code: null,
    answers: ["===", "== =="],
    explanation: "=== proverava i vrednost i tip, za razliku od == koji vrši konverziju tipova pre poređenja.",
  },
  {
    id: 4,
    category: "Uslovi",
    type: "mcq",
    prompt: "Šta će ispisati ovaj kod?",
    code: 'let broj = 7;\nif (broj % 2 === 0) {\n  console.log("paran");\n} else {\n  console.log("neparan");\n}',
    options: ["paran", "neparan", "7", "Greška"],
    correctIndex: 1,
    explanation: "Operator % vraća ostatak deljenja. 7 % 2 je 1, što nije jednako 0, pa se izvršava else grana i ispisuje se 'neparan'.",
  },
  {
    id: 5,
    category: "Uslovi",
    type: "mcq",
    prompt: "Šta vraća izraz 5 > 3 && 2 > 4 ?",
    code: null,
    options: ["true", "false", "NaN", "0"],
    correctIndex: 1,
    explanation: "Operator && (logičko I) vraća true samo ako su OBA uslova tačna. Pošto 2 > 4 nije tačno, ceo izraz je false.",
  },
  {
    id: 6,
    category: "Uslovi",
    type: "fill",
    prompt: "Dopuni kod tako da se ispiše 'punoletan' ako je promenljiva godine veća ili jednaka 18: if (godine ___ 18) { console.log('punoletan'); }",
    code: null,
    answers: [">="],
    explanation: "Operator >= znači 'veće ili jednako'.",
  },
  {
    id: 7,
    category: "Petlje",
    type: "mcq",
    prompt: "Koja je vrednost promenljive zbir na kraju izvršavanja ovog koda?",
    code: "let zbir = 0;\nfor (let i = 1; i <= 5; i++) {\n  zbir += i;\n}\nconsole.log(zbir);",
    options: ["10", "15", "5", "25"],
    correctIndex: 1,
    explanation: "Petlja sabira brojeve od 1 do 5: 1+2+3+4+5 = 15.",
  },
  {
    id: 8,
    category: "Petlje",
    type: "mcq",
    prompt: "Koje vrednosti će biti ispisane, tim redosledom?",
    code: "for (let i = 0; i < 3; i++) {\n  console.log(i);\n}",
    options: ["1, 2, 3", "0, 1, 2", "0, 1, 2, 3", "1, 2"],
    correctIndex: 1,
    explanation: "Petlja počinje od i = 0 i izvršava se dok je uslov i < 3 tačan, pa ispisuje 0, 1, 2.",
  },
  {
    id: 9,
    category: "Petlje",
    type: "mcq",
    prompt: "Koja petlja se izvršava BAREM jednom, čak i kada je uslov od samog početka netačan?",
    code: null,
    options: ["for", "while", "do...while", "forEach"],
    correctIndex: 2,
    explanation: "do...while prvo izvrši telo petlje, a tek posle toga proverava uslov, pa se telo uvek izvrši bar jednom.",
  },
  {
    id: 10,
    category: "Petlje",
    type: "fill",
    prompt: "Dopuni kod da petlja ide unazad od 5 do 1 (uključujući 1): for (let i = 5; i ___ 1; i--) { console.log(i); }",
    code: null,
    answers: [">="],
    explanation: "Da bi petlja obradila i vrednost i = 1, uslov mora biti i >= 1 (sa i > 1 bismo preskočili poslednji broj).",
  },
  {
    id: 11,
    category: "Funkcije",
    type: "mcq",
    prompt: "Šta se ispisuje u konzoli?",
    code: "function saberi(a, b) {\n  return a + b;\n}\nconsole.log(saberi(3, 4));",
    options: ["34", "7", "NaN", "undefined"],
    correctIndex: 1,
    explanation: "Funkcija saberi vraća zbir dva argumenta: 3 + 4 = 7.",
  },
  {
    id: 12,
    category: "Funkcije",
    type: "mcq",
    prompt: "Da li će se 'Zdravo' ispisati u konzoli nakon izvršavanja ovog koda?",
    code: 'function pozdrav() {\n  console.log("Zdravo");\n}\npozdrav;',
    options: ["Da", "Ne, jer funkcija nije pozvana (nedostaju zagrade)", "Ne, jer nedostaje return", "Da, ali samo jednom"],
    correctIndex: 1,
    explanation: "Da bi se funkcija izvršila, mora se pozvati sa zagradama: pozdrav(). Samo pisanje imena funkcije je referenca na nju, a ne poziv.",
  },
  {
    id: 13,
    category: "Funkcije",
    type: "mcq",
    prompt: "Šta funkcija vraća ako u njoj nema eksplicitnog return iskaza?",
    code: null,
    options: ["0", "null", "undefined", "Grešku pri izvršavanju"],
    correctIndex: 2,
    explanation: "Ako funkcija nema return, njena povratna vrednost je automatski undefined.",
  },
  {
    id: 14,
    category: "Funkcije",
    type: "fill",
    prompt: "Dopuni definiciju funkcije koja prima parametar ime i vraća pozdravnu poruku: function pozdrav(ime) { ___ 'Zdravo, ' + ime; }",
    code: null,
    answers: ["return"],
    explanation: "Ključna reč return vraća vrednost iz funkcije onome ko je pozvao.",
  },
  {
    id: 15,
    category: "Funkcije",
    type: "mcq",
    prompt: "Šta se ispisuje u konzoli?",
    code: "const kvadrat = (x) => x * x;\nconsole.log(kvadrat(4));",
    options: ["8", "16", "4", "Greška, arrow funkcije ne postoje"],
    correctIndex: 1,
    explanation: "Ovo je arrow funkcija koja vraća x * x. Za x = 4, rezultat je 16.",
  },
];

if (typeof module !== "undefined" && module.exports) {
  module.exports = { CHALLENGES };
}
