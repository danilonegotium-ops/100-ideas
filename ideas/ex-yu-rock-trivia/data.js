// Ex-Yu Rock Trivia — curated question bank.
// 20 multiple-choice questions about Yugoslav rock/pop history, spanning
// Belgrade, Zagreb, Sarajevo, Ljubljana, Novi Sad and Skopje scenes.
// Every fact here is one the author has real confidence in (well-documented
// bands/songs/people) — no invented trivia.

const TRIVIA_QUESTIONS = [
  {
    id: "q1",
    question: 'Which Sarajevo-formed band, led by Goran Bregović, became one of the best-selling acts in Yugoslav rock history?',
    options: ["Bijelo Dugme", "Divlje Jagode", "YU Grupa", "Indexi"],
    correctIndex: 0,
    funFact: 'Bijelo Dugme ("White Button") formed in Sarajevo in 1974 and is widely considered the most commercially successful Yugoslav rock band ever.',
  },
  {
    id: "q2",
    question: "Bora Đorđević is the outspoken, lyrics-first frontman of which Belgrade rock band?",
    options: ["Partibrejkers", "Riblja Čorba", "Idoli", "Ekatarina Velika"],
    correctIndex: 1,
    funFact: 'Riblja Čorba ("Fish Stew") formed in Belgrade in 1978 and became known for Bora Đorđević\'s biting, satirical lyrics.',
  },
  {
    id: "q3",
    question: 'Branimir "Johnny" Štulić fronted which influential Zagreb rock band, known for the song "Balkan"?',
    options: ["Haustor", "Film", "Azra", "Prljavo Kazalište"],
    correctIndex: 2,
    funFact: "Azra formed in Zagreb in the late 1970s and Štulić's poetic, politically-charged lyrics made them one of Yugoslavia's most influential new wave acts.",
  },
  {
    id: "q4",
    question: 'Which Belgrade new wave band had the hits "Devojko Mala" and "Maljčiki"?',
    options: ["Šarlo Akrobata", "Idoli", "Disciplina Kičme", "Električni Orgazam"],
    correctIndex: 1,
    funFact: "Idoli were part of the Belgrade new wave trio (with Šarlo Akrobata and Električni Orgazam) that defined the city's early-1980s sound.",
  },
  {
    id: "q5",
    question: "Milan Mladenović fronted which influential Belgrade band, formed after his earlier band Šarlo Akrobata split up?",
    options: ["Partibrejkers", "Riblja Čorba", "YU Grupa", "Ekatarina Velika"],
    correctIndex: 3,
    funFact: 'Ekatarina Velika (often shortened to "EKV") became one of the most respected Yugoslav rock bands of the 1980s, with songs like "Zemlja" and "Fabrika".',
  },
  {
    id: "q6",
    question: "Milan Mladenović was part of which band, alongside Dušan Kojić \"Koja\", before EKV?",
    options: ["Šarlo Akrobata", "Haustor", "Leb i Sol", "Kerber"],
    correctIndex: 0,
    funFact: "Šarlo Akrobata was a short-lived but hugely influential Belgrade new wave band (1979–1981) — several of its members went on to EKV and Disciplina Kičme.",
  },
  {
    id: "q7",
    question: '"Bajaga i Instruktori" is fronted by Momčilo Bajagić "Bajaga", formerly a guitarist in which band?',
    options: ["Azra", "Riblja Čorba", "Divlje Jagode", "Parni Valjak"],
    correctIndex: 1,
    funFact: "Bajaga played guitar in Riblja Čorba before launching his own hugely popular pop-rock project, Bajaga i Instruktori, in 1984.",
  },
  {
    id: "q8",
    question: 'Which Zagreb rock band, fronted by Davor Gobac, is known for the song "Mangup"?',
    options: ["Film", "Parni Valjak", "Prljavo Kazalište", "Haustor"],
    correctIndex: 2,
    funFact: 'Prljavo Kazalište ("Dirty Theatre") formed in Zagreb in 1977 and remains one of Croatia\'s most enduring rock bands.',
  },
  {
    id: "q9",
    question: "Guitarist Vlatko Stefanovski is best known for blending rock with Macedonian folk in which band?",
    options: ["Leb i Sol", "YU Grupa", "Kerber", "Galija"],
    correctIndex: 0,
    funFact: 'Leb i Sol ("Bread and Salt") formed in Skopje in 1975 and pioneered a jazz-and-folk-inflected instrumental rock sound.',
  },
  {
    id: "q10",
    question: "Sejo Sexon fronted which Sarajevo rock band associated with the city's \"New Primitives\" scene?",
    options: ["Divlje Jagode", "Zabranjeno Pušenje", "Indexi", "Crvena Jabuka"],
    correctIndex: 1,
    funFact: 'Zabranjeno Pušenje ("No Smoking") formed in Sarajevo in 1980; several members were also part of the satirical TV troupe "Top Lista Nadrealista".',
  },
  {
    id: "q11",
    question: "Which veteran Belgrade rock band, one of the oldest in ex-Yugoslavia, is fronted by the Jelić brothers?",
    options: ["YU Grupa", "Kerber", "Galija", "Smak"],
    correctIndex: 0,
    funFact: "YU Grupa formed in Belgrade in 1970 and is still active today — one of the longest-running rock acts from the region.",
  },
  {
    id: "q12",
    question: "Đorđe Balašević began his career fronting which band before going solo?",
    options: ["Rani Mraz", "Zdravo", "Suncokret", "Pop Mašina"],
    correctIndex: 0,
    funFact: 'Rani Mraz ("Early Frost") was a Novi Sad folk-rock band Balašević led in the late 1970s before his long, storytelling-driven solo career.',
  },
  {
    id: "q13",
    question: "Alen Islamović was a longtime vocalist for which Sarajevo hard rock band?",
    options: ["Bijelo Dugme", "Divlje Jagode", "Indexi", "Crvena Jabuka"],
    correctIndex: 1,
    funFact: "Divlje Jagode (\"Wild Strawberries\") formed in Sarajevo in 1976 and were one of Yugoslavia's premier hard rock acts.",
  },
  {
    id: "q14",
    question: 'Which iconic Zagreb rock band, formed in the early 1970s, is known for hits like "Purpurna Vrela"?',
    options: ["Prljavo Kazalište", "Parni Valjak", "Film", "Haustor"],
    correctIndex: 1,
    funFact: 'Parni Valjak ("Steamroller") formed in Zagreb in 1975 and became one of the most enduring bands in the region.',
  },
  {
    id: "q15",
    question: 'What is the name of Bijelo Dugme\'s hugely popular folk-rock song, later re-recorded as an instrumental by Goran Bregović and closely tied to Balkan wedding celebrations?',
    options: ["Đurđevdan", "Kad Bi Bio Bijelo Dugme", "Loše Vino", "Hajdemo U Planine"],
    correctIndex: 0,
    funFact: '"Đurđevdan" ("St. George\'s Day") became a wedding/celebration standard across the region and internationally, especially after Bregović\'s later versions.',
  },
  {
    id: "q16",
    question: "Which Slovenian band is often credited as Yugoslavia's first punk rock band?",
    options: ["Pankrti", "Laibach", "Buldožer", "Lačni Franz"],
    correctIndex: 0,
    funFact: 'Pankrti ("The Bastards") formed in Ljubljana in 1977, right at the start of the global punk wave.',
  },
  {
    id: "q17",
    question: "Ljubljana, alongside Belgrade and Zagreb, was one of the key hubs of the Yugoslav new wave and punk scene. Which republic was it the capital of?",
    options: ["Slovenia", "Croatia", "Macedonia", "Montenegro"],
    correctIndex: 0,
    funFact: "Ljubljana's scene produced acts like Pankrti and, slightly later, the industrial group Laibach.",
  },
  {
    id: "q18",
    question: "The rock band Galija, known for anthemic songs and later religious/patriotic themes, originally formed in which Serbian city?",
    options: ["Niš", "Kragujevac", "Novi Sad", "Subotica"],
    correctIndex: 1,
    funFact: 'Galija formed in Kragujevac in 1977, fronted by Nenad "Đovani" Milosavljević, and became known for anthemic songs like "Nebo".',
  },
  {
    id: "q19",
    question: 'The satirical TV comedy troupe "Top Lista Nadrealista" was closely connected to members of which Sarajevo rock band?',
    options: ["Indexi", "Zabranjeno Pušenje", "Plavi Orkestar", "Crvena Jabuka"],
    correctIndex: 1,
    funFact: "Several members of Zabranjeno Pušenje, including Sejo Sexon and Nele Karajlić, were also core cast members of Top Lista Nadrealista.",
  },
  {
    id: "q20",
    question: 'Dušan Kojić "Koja" formed which genre-blending Belgrade band after Šarlo Akrobata split up, mixing punk, funk, and electronic elements?',
    options: ["Disciplina Kičme", "Partibrejkers", "Obojeni Program", "Van Gogh"],
    correctIndex: 0,
    funFact: 'Disciplina Kičme ("Spine Discipline") became known for its genre-crossing sound and, later, Koja\'s alter ego "Rambo Amadeus" side project.',
  },
];

if (typeof module !== "undefined" && module.exports) {
  module.exports = { TRIVIA_QUESTIONS };
}
