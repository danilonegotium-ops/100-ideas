/* Curated beginner shadowing phrases — English <-> Serbian (Latin script).
   Each pair is spoken by the browser's speechSynthesis in the chosen target
   language; the other language is shown as the translation. */

const PHRASE_PAIRS = [
  { en: "Hello, how are you?", sr: "Zdravo, kako si?" },
  { en: "My name is Ana.", sr: "Zovem se Ana." },
  { en: "Nice to meet you.", sr: "Drago mi je." },
  { en: "Where is the train station?", sr: "Gde je železnička stanica?" },
  { en: "How much does this cost?", sr: "Koliko ovo košta?" },
  { en: "I would like a coffee, please.", sr: "Želeo bih kafu, molim." },
  { en: "Can you help me?", sr: "Možeš li mi pomoći?" },
  { en: "I don't understand.", sr: "Ne razumem." },
  { en: "Could you repeat that, please?", sr: "Možeš li to ponoviti, molim te?" },
  { en: "What time is it?", sr: "Koliko je sati?" },
  { en: "See you tomorrow.", sr: "Vidimo se sutra." },
  { en: "Thank you very much.", sr: "Hvala ti puno." },
  { en: "You're welcome.", sr: "Nema na čemu." },
  { en: "I'm sorry, I'm late.", sr: "Izvini, kasnim." },
  { en: "Where is the bathroom?", sr: "Gde je toalet?" },
  { en: "This is delicious.", sr: "Ovo je ukusno." },
  { en: "I live in Belgrade.", sr: "Ja živim u Beogradu." },
  { en: "Have a nice day!", sr: "Prijatan dan!" },
  { en: "What is your favorite food?", sr: "Šta je tvoja omiljena hrana?" },
  { en: "Let's go for a walk.", sr: "Hajde da idemo u šetnju." },
];

if (typeof module !== "undefined" && module.exports) {
  module.exports = { PHRASE_PAIRS };
}
