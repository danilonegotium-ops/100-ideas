import type { Lesson } from "./types";

/**
 * Curated beginner (A1) Serbian curriculum for expats in Belgrade/Novi Sad.
 * Fixed content shipped with the app (not database-driven) — only
 * per-user progress (lib/data.ts, `serbian_for_expats_progress` table)
 * needs the database. Kept as plain data so it's trivially unit-testable
 * (e.g. `gradeQuiz` in lib/quiz.ts) without a browser or a live Supabase
 * project.
 */
export const LESSONS: Lesson[] = [
  {
    slug: "pozdravi",
    title: "Pozdravi i upoznavanje",
    titleEn: "Greetings & introductions",
    description: "The basic greetings you'll use every single day.",
    vocab: [
      { sr: "Zdravo", en: "Hello (informal)" },
      { sr: "Dobar dan", en: "Good day / good afternoon" },
      { sr: "Dobro jutro", en: "Good morning" },
      { sr: "Dobro veče", en: "Good evening" },
      { sr: "Kako si?", en: "How are you? (informal)" },
      { sr: "Kako ste?", en: "How are you? (formal / plural)" },
      { sr: "Dobro sam, hvala", en: "I'm good, thanks" },
      { sr: "Ja sam...", en: "I am..." },
      { sr: "Drago mi je", en: "Nice to meet you" },
      { sr: "Doviđenja", en: "Goodbye" },
      { sr: "Ćao", en: "Bye / hi (informal)" },
    ],
    dialogue: [
      { speaker: "Ana", sr: "Zdravo! Kako si?", en: "Hello! How are you?" },
      { speaker: "Marko", sr: "Dobro sam, hvala. A ti?", en: "I'm good, thanks. And you?" },
      { speaker: "Ana", sr: "I ja sam dobro. Ja sam Ana.", en: "I'm good too. I'm Ana." },
      { speaker: "Marko", sr: "Drago mi je, Ana. Ja sam Marko.", en: "Nice to meet you, Ana. I'm Marko." },
    ],
    quiz: [
      {
        question: "How do you say \"Hello\" informally in Serbian?",
        options: ["Zdravo", "Hvala", "Doviđenja", "Molim"],
        correctIndex: 0,
      },
      {
        question: "What does \"Kako si?\" mean?",
        options: ["What's your name?", "How are you? (informal)", "Where are you from?", "Goodbye"],
        correctIndex: 1,
      },
      {
        question: "\"Drago mi je\" means:",
        options: ["I'm sorry", "Nice to meet you", "Good morning", "Thank you"],
        correctIndex: 1,
      },
      {
        question: "The formal way to ask \"How are you?\" is:",
        options: ["Kako si?", "Kako ste?", "Ko si ti?", "Šta ima?"],
        correctIndex: 1,
      },
      {
        question: "\"Doviđenja\" means:",
        options: ["Hello", "Please", "Goodbye", "Yes"],
        correctIndex: 2,
      },
    ],
  },
  {
    slug: "brojevi",
    title: "Brojevi 0–20",
    titleEn: "Numbers 0–20",
    description: "Count from zero to twenty — for prices, ages, and addresses.",
    vocab: [
      { sr: "nula", en: "0" },
      { sr: "jedan", en: "1" },
      { sr: "dva", en: "2" },
      { sr: "tri", en: "3" },
      { sr: "četiri", en: "4" },
      { sr: "pet", en: "5" },
      { sr: "šest", en: "6" },
      { sr: "sedam", en: "7" },
      { sr: "osam", en: "8" },
      { sr: "devet", en: "9" },
      { sr: "deset", en: "10" },
      { sr: "jedanaest", en: "11" },
      { sr: "dvanaest", en: "12" },
      { sr: "trinaest", en: "13" },
      { sr: "petnaest", en: "15" },
      { sr: "dvadeset", en: "20" },
    ],
    dialogue: [
      { speaker: "Jovan", sr: "Koliko stanova ima u zgradi?", en: "How many apartments are in the building?" },
      { speaker: "Petra", sr: "Ima deset stanova.", en: "There are ten apartments." },
      { speaker: "Jovan", sr: "A koliko soba imaš?", en: "And how many rooms do you have?" },
      { speaker: "Petra", sr: "Imam tri sobe.", en: "I have three rooms." },
    ],
    quiz: [
      {
        question: "\"Pet\" means:",
        options: ["4", "5", "6", "7"],
        correctIndex: 1,
      },
      {
        question: "How do you say \"ten\" in Serbian?",
        options: ["jedanaest", "deset", "devet", "dvanaest"],
        correctIndex: 1,
      },
      {
        question: "\"Dvadeset\" means:",
        options: ["10", "12", "20", "22"],
        correctIndex: 2,
      },
      {
        question: "Which number is \"sedam\"?",
        options: ["6", "7", "8", "9"],
        correctIndex: 1,
      },
      {
        question: "\"Trinaest\" means:",
        options: ["3", "13", "30", "33"],
        correctIndex: 1,
      },
    ],
  },
  {
    slug: "hrana-i-pice",
    title: "Naručivanje hrane i pića",
    titleEn: "Ordering food & drink",
    description: "Order confidently at a kafana or restaurant.",
    vocab: [
      { sr: "Molim vas", en: "Please / excuse me (formal)" },
      { sr: "Konobar / Konobarica", en: "Waiter / waitress" },
      { sr: "Jelovnik", en: "Menu" },
      { sr: "Voda", en: "Water" },
      { sr: "Kafa", en: "Coffee" },
      { sr: "Pivo", en: "Beer" },
      { sr: "Račun, molim", en: "The bill, please" },
      { sr: "Da li imate...?", en: "Do you have...?" },
      { sr: "Ja bih...", en: "I would like..." },
      { sr: "Prijatno!", en: "Enjoy your meal!" },
    ],
    dialogue: [
      { speaker: "Konobar", sr: "Dobar dan! Šta biste želeli?", en: "Good afternoon! What would you like?" },
      { speaker: "Gost", sr: "Dobar dan. Ja bih kafu i čašu vode, molim.", en: "Good afternoon. I'd like a coffee and a glass of water, please." },
      { speaker: "Konobar", sr: "Naravno. Nešto za jelo?", en: "Of course. Anything to eat?" },
      { speaker: "Gost", sr: "Da, da li imate burek?", en: "Yes, do you have burek?" },
      { speaker: "Konobar", sr: "Imamo. Odmah stiže.", en: "We do. Coming right up." },
    ],
    quiz: [
      {
        question: "\"Ja bih...\" means:",
        options: ["I have", "I would like", "I am", "I want to go"],
        correctIndex: 1,
      },
      {
        question: "How do you ask for the bill?",
        options: ["Jelovnik, molim", "Račun, molim", "Voda, molim", "Kafa, molim"],
        correctIndex: 1,
      },
      {
        question: "\"Konobar\" means:",
        options: ["Chef", "Waiter", "Guest", "Menu"],
        correctIndex: 1,
      },
      {
        question: "You'd hear \"Prijatno!\" ...",
        options: ["right before you start eating", "right after you pay", "as a morning greeting", "when you're leaving forever"],
        correctIndex: 0,
      },
      {
        question: "\"Da li imate...?\" means:",
        options: ["Where is...?", "Do you have...?", "How much is...?", "Can I...?"],
        correctIndex: 1,
      },
    ],
  },
  {
    slug: "pravci",
    title: "Snalaženje i pravci",
    titleEn: "Directions",
    description: "Ask for and understand directions around the city.",
    vocab: [
      { sr: "Levo", en: "Left" },
      { sr: "Desno", en: "Right" },
      { sr: "Pravo", en: "Straight ahead" },
      { sr: "Blizu", en: "Near" },
      { sr: "Daleko", en: "Far" },
      { sr: "Ovde", en: "Here" },
      { sr: "Tamo", en: "There" },
      { sr: "Gde je...?", en: "Where is...?" },
      { sr: "Ulica", en: "Street" },
      { sr: "Skrenite", en: "Turn (instruction)" },
    ],
    dialogue: [
      { speaker: "Turista", sr: "Izvinite, gde je autobuska stanica?", en: "Excuse me, where is the bus station?" },
      { speaker: "Prolaznik", sr: "Idite pravo do semafora, onda skrenite levo.", en: "Go straight to the traffic light, then turn left." },
      { speaker: "Turista", sr: "Je li daleko?", en: "Is it far?" },
      { speaker: "Prolaznik", sr: "Ne, blizu je, pet minuta hoda.", en: "No, it's close, a five-minute walk." },
      { speaker: "Turista", sr: "Hvala vam puno!", en: "Thank you very much!" },
    ],
    quiz: [
      {
        question: "\"Levo\" means:",
        options: ["Right", "Left", "Straight", "Near"],
        correctIndex: 1,
      },
      {
        question: "In directions, \"pravo\" means:",
        options: ["Right", "Left", "Straight ahead", "Far"],
        correctIndex: 2,
      },
      {
        question: "\"Gde je...?\" means:",
        options: ["Who is...?", "What is...?", "Where is...?", "When is...?"],
        correctIndex: 2,
      },
      {
        question: "\"Blizu\" means:",
        options: ["Far", "Near", "Here", "There"],
        correctIndex: 1,
      },
      {
        question: "\"Skrenite\" is an instruction meaning:",
        options: ["Stop", "Wait", "Turn", "Walk"],
        correctIndex: 2,
      },
    ],
  },
  {
    slug: "porodica",
    title: "Porodica i ljudi",
    titleEn: "Family & people",
    description: "Talk about your family and the people around you.",
    vocab: [
      { sr: "Majka / Mama", en: "Mother" },
      { sr: "Otac / Tata", en: "Father" },
      { sr: "Sestra", en: "Sister" },
      { sr: "Brat", en: "Brother" },
      { sr: "Baba", en: "Grandmother" },
      { sr: "Deda", en: "Grandfather" },
      { sr: "Ćerka", en: "Daughter" },
      { sr: "Sin", en: "Son" },
      { sr: "Suprug / Muž", en: "Husband" },
      { sr: "Supruga / Žena", en: "Wife" },
      { sr: "Prijatelj / Prijateljica", en: "Friend (m/f)" },
    ],
    dialogue: [
      { speaker: "Iva", sr: "Imaš li braću ili sestre?", en: "Do you have siblings?" },
      { speaker: "Sam", sr: "Imam jednu sestru i jednog brata. A ti?", en: "I have one sister and one brother. And you?" },
      { speaker: "Iva", sr: "Ja sam jedinac. Ali imam mnogo prijatelja u Beogradu.", en: "I'm an only child. But I have many friends in Belgrade." },
      { speaker: "Sam", sr: "To je lepo!", en: "That's nice!" },
    ],
    quiz: [
      {
        question: "\"Brat\" means:",
        options: ["Sister", "Brother", "Father", "Friend"],
        correctIndex: 1,
      },
      {
        question: "\"Baba\" means:",
        options: ["Grandfather", "Aunt", "Grandmother", "Mother"],
        correctIndex: 2,
      },
      {
        question: "\"Ćerka\" means:",
        options: ["Son", "Daughter", "Wife", "Sister"],
        correctIndex: 1,
      },
      {
        question: "\"Prijatelj\" means:",
        options: ["Neighbor", "Colleague", "Friend", "Cousin"],
        correctIndex: 2,
      },
      {
        question: "\"Imaš li braću ili sestre?\" means:",
        options: ["Do you have children?", "Do you have siblings?", "Are you married?", "Where is your family?"],
        correctIndex: 1,
      },
    ],
  },
  {
    slug: "dani-i-vreme",
    title: "Dani u nedelji i vreme",
    titleEn: "Days of the week & time",
    description: "Days, today/tomorrow/yesterday, and asking the time.",
    vocab: [
      { sr: "ponedeljak", en: "Monday" },
      { sr: "utorak", en: "Tuesday" },
      { sr: "sreda", en: "Wednesday" },
      { sr: "četvrtak", en: "Thursday" },
      { sr: "petak", en: "Friday" },
      { sr: "subota", en: "Saturday" },
      { sr: "nedelja", en: "Sunday" },
      { sr: "danas", en: "today" },
      { sr: "sutra", en: "tomorrow" },
      { sr: "juče", en: "yesterday" },
      { sr: "Koliko je sati?", en: "What time is it?" },
    ],
    dialogue: [
      { speaker: "Dušan", sr: "Koji je danas dan?", en: "What day is it today?" },
      { speaker: "Mina", sr: "Danas je sreda.", en: "Today is Wednesday." },
      { speaker: "Dušan", sr: "A kada je sastanak?", en: "And when is the meeting?" },
      { speaker: "Mina", sr: "Sastanak je u petak, u deset sati.", en: "The meeting is on Friday, at ten o'clock." },
    ],
    quiz: [
      {
        question: "\"Petak\" means:",
        options: ["Monday", "Thursday", "Friday", "Sunday"],
        correctIndex: 2,
      },
      {
        question: "\"Sutra\" means:",
        options: ["Yesterday", "Today", "Tomorrow", "Never"],
        correctIndex: 2,
      },
      {
        question: "\"Koliko je sati?\" means:",
        options: ["What day is it?", "What time is it?", "How old are you?", "How much does it cost?"],
        correctIndex: 1,
      },
      {
        question: "As a day name, \"nedelja\" is:",
        options: ["Saturday", "Sunday", "Monday", "Wednesday"],
        correctIndex: 1,
      },
      {
        question: "\"Juče\" means:",
        options: ["Tomorrow", "Today", "Yesterday", "Now"],
        correctIndex: 2,
      },
    ],
  },
  {
    slug: "kupovina",
    title: "Kupovina i novac",
    titleEn: "Shopping & money",
    description: "Shop at a pijaca or store and understand prices.",
    vocab: [
      { sr: "Prodavnica", en: "Store / shop" },
      { sr: "Pijaca", en: "Market" },
      { sr: "Koliko košta?", en: "How much does it cost?" },
      { sr: "Cena", en: "Price" },
      { sr: "Novac", en: "Money" },
      { sr: "Dinar", en: "Dinar (RSD currency)" },
      { sr: "Kusur", en: "Change (money)" },
      { sr: "Jeftino", en: "Cheap" },
      { sr: "Skupo", en: "Expensive" },
      { sr: "Popust", en: "Discount" },
    ],
    dialogue: [
      { speaker: "Kupac", sr: "Izvinite, koliko košta ovaj sir?", en: "Excuse me, how much is this cheese?" },
      { speaker: "Prodavac", sr: "Osamsto dinara po kilogramu.", en: "Eight hundred dinars per kilogram." },
      { speaker: "Kupac", sr: "To je malo skupo. Imate li nešto jeftinije?", en: "That's a bit expensive. Do you have something cheaper?" },
      { speaker: "Prodavac", sr: "Imamo domaći sir, on je jeftiniji.", en: "We have homemade cheese, it's cheaper." },
      { speaker: "Kupac", sr: "Dobro, uzeću pola kilograma.", en: "Okay, I'll take half a kilogram." },
    ],
    quiz: [
      {
        question: "\"Koliko košta?\" means:",
        options: ["What is this?", "How much does it cost?", "Where can I buy this?", "Is it fresh?"],
        correctIndex: 1,
      },
      {
        question: "\"Skupo\" means:",
        options: ["Cheap", "Expensive", "Free", "Discounted"],
        correctIndex: 1,
      },
      {
        question: "\"Dinar\" is:",
        options: ["A type of bread", "Serbian currency", "A market stall", "A weight unit"],
        correctIndex: 1,
      },
      {
        question: "\"Kusur\" means:",
        options: ["Receipt", "Change (money)", "Bag", "Discount"],
        correctIndex: 1,
      },
      {
        question: "\"Pijaca\" means:",
        options: ["Supermarket", "Bakery", "Market", "Restaurant"],
        correctIndex: 2,
      },
    ],
  },
  {
    slug: "svakodnevne-fraze",
    title: "Svakodnevne fraze i glagoli",
    titleEn: "Everyday phrases & verbs",
    description: "The small phrases that get you through any conversation.",
    vocab: [
      { sr: "Hvala", en: "Thank you" },
      { sr: "Molim", en: "Please / you're welcome" },
      { sr: "Izvinite", en: "Excuse me / sorry (formal)" },
      { sr: "Da", en: "Yes" },
      { sr: "Ne", en: "No" },
      { sr: "Razumem", en: "I understand" },
      { sr: "Ne razumem", en: "I don't understand" },
      { sr: "Govorite li engleski?", en: "Do you speak English?" },
      { sr: "Kako se kaže...?", en: "How do you say...?" },
      { sr: "Nema na čemu", en: "You're welcome" },
    ],
    dialogue: [
      { speaker: "Sofija", sr: "Izvinite, govorite li engleski?", en: "Excuse me, do you speak English?" },
      { speaker: "Petar", sr: "Malo. Ja učim srpski, pa mi je teško.", en: "A little. I'm learning Serbian, so it's hard for me." },
      { speaker: "Sofija", sr: "Nema problema, polako. Kako se kaže \"window\" na srpskom?", en: "No problem, take your time. How do you say \"window\" in Serbian?" },
      { speaker: "Petar", sr: "Prozor.", en: "Window (prozor)." },
      { speaker: "Sofija", sr: "Hvala!", en: "Thanks!" },
      { speaker: "Petar", sr: "Nema na čemu.", en: "You're welcome." },
    ],
    quiz: [
      {
        question: "\"Hvala\" means:",
        options: ["Please", "Thank you", "Sorry", "Yes"],
        correctIndex: 1,
      },
      {
        question: "\"Ne razumem\" means:",
        options: ["I understand", "I don't know", "I don't understand", "I don't speak"],
        correctIndex: 2,
      },
      {
        question: "\"Kako se kaže...?\" means:",
        options: ["What is your name?", "How do you say...?", "Where is...?", "How are you?"],
        correctIndex: 1,
      },
      {
        question: "\"Izvinite\" means:",
        options: ["Goodbye", "Excuse me / sorry", "Please", "Welcome"],
        correctIndex: 1,
      },
      {
        question: "\"Nema na čemu\" is the reply to:",
        options: ["a question", "an apology", "\"hvala\" (thank you)", "a greeting"],
        correctIndex: 2,
      },
    ],
  },
];

export function getLessonBySlug(slug: string): Lesson | undefined {
  return LESSONS.find((lesson) => lesson.slug === slug);
}
