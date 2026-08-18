// History Through Maps — curated era dataset.
//
// Data source note (see SPEC.md for the full explanation): this is a
// HAND-BUILT, illustrative dataset, not a GIS/geographic one. An open
// dataset of real historical boundary GeoJSON does exist (the
// "historical-basemaps" project on GitHub), but it's licensed GPLv3, which
// is not a safe fit to embed in this project (not CC0/public-domain, and
// GPL's copyleft terms are a bad match for a static asset bundled into an
// otherwise unlicensed site). Rather than risk that, the map here is a
// simplified SCHEMATIC: each of the 10 REGIONS below always occupies the
// same fixed grid cell across every era (so the layout is stable and
// readable), and only the ruling power's name + the era's blurb change as
// the year slider moves. It is explicitly NOT accurate cartography — no
// real border shapes, just a loose compass-direction arrangement of
// commonly-discussed European/Mediterranean regions. Historical content
// (who ruled what, roughly, per era) was hand-written for this project from
// general, widely-known history — the kind of high-level facts found in any
// European history overview (fall of Rome 476, Fourth Crusade 1204, fall of
// Constantinople 1453, Reconquista completed 1492, Poland's partitions
// 1772-95, German/Italian unification 1861-71, WWI's 1914 outbreak, the
// USSR's 1991 dissolution, German reunification 1990, Yugoslavia's 1990s
// breakup) — simplified for a one-paragraph-per-era summary, not sourced
// from any single reference.

// Fixed schematic grid position for each region — same position in every
// era. `color` is tied to the region SLOT (for visual consistency across
// eras), not to whichever power currently rules it.
const REGIONS = [
  { id: "britishIsles", label: "British Isles", col: 0, row: 0, color: "#60a5fa" },
  { id: "scandinavia", label: "Scandinavia", col: 1, row: 0, color: "#38bdf8" },
  { id: "polandBaltic", label: "Poland / Baltic", col: 2, row: 0, color: "#f472b6" },
  { id: "russiaEast", label: "Russia / Eastern Europe", col: 3, row: 0, color: "#f87171" },
  { id: "iberia", label: "Iberia", col: 0, row: 1, color: "#fb923c" },
  { id: "franceGaul", label: "France / Gaul", col: 1, row: 1, color: "#a78bfa" },
  { id: "germanyCentral", label: "Germany / Central Europe", col: 2, row: 1, color: "#9ca3af" },
  { id: "balkans", label: "Balkans", col: 3, row: 1, color: "#4ade80" },
  { id: "italy", label: "Italy", col: 1, row: 2, color: "#facc15" },
  { id: "anatolia", label: "Anatolia", col: 2, row: 2, color: "#2dd4bf" },
];

const ERAS = [
  {
    year: 500,
    yearLabel: "500 CE",
    title: "The fall of Rome's aftermath",
    blurb: "The Western Roman Empire collapsed in 476 CE. Its former territories fragmented into Germanic successor kingdoms — Franks in Gaul, Visigoths in Iberia, Ostrogoths in Italy — while the Eastern Roman (Byzantine) Empire carried on from Constantinople, still wealthy and centralized. Scandinavia and much of Eastern Europe remained organized as tribal societies outside any Roman administrative system.",
    rulers: {
      britishIsles: "Anglo-Saxon kingdoms",
      scandinavia: "Germanic tribal chiefdoms",
      polandBaltic: "Slavic & Baltic tribes",
      russiaEast: "Slavic & steppe tribes",
      iberia: "Visigothic Kingdom",
      franceGaul: "Kingdom of the Franks",
      germanyCentral: "Germanic tribal kingdoms",
      balkans: "Byzantine (Eastern Roman) Empire",
      italy: "Ostrogothic Kingdom",
      anatolia: "Byzantine (Eastern Roman) Empire",
    },
  },
  {
    year: 1200,
    yearLabel: "1200 CE",
    title: "High Middle Ages, on the eve of the Fourth Crusade",
    blurb: "Centralized feudal kingdoms had solidified across Western Europe — France, England, and the Holy Roman Empire were the dominant powers. The Crusades (from 1095) reshaped relations with Byzantium and the Islamic world; Byzantium, though still ruling from Constantinople, was weakening and would be sacked by crusaders in 1204. The Reconquista was steadily pushing Muslim rule out of Iberia, while Kievan Rus' had fragmented into competing principalities, not yet touched by the Mongols.",
    rulers: {
      britishIsles: "Kingdom of England & Scotland",
      scandinavia: "Kingdoms of Denmark, Norway, Sweden",
      polandBaltic: "Fragmented Poland & pagan Baltic tribes",
      russiaEast: "Kievan Rus' principalities",
      iberia: "Christian kingdoms vs. Almohad Caliphate",
      franceGaul: "Kingdom of France (Capetians)",
      germanyCentral: "Holy Roman Empire (Hohenstaufen)",
      balkans: "Byzantine Empire (weakening)",
      italy: "Papal States, city-states & Norman Sicily",
      anatolia: "Byzantine Empire & Seljuk Sultanate of Rum",
    },
  },
  {
    year: 1500,
    yearLabel: "1500 CE",
    title: "The eve of the Age of Exploration",
    blurb: "The Ottoman Empire, having taken Constantinople in 1453, now controlled Anatolia and most of the Balkans, ending Byzantium for good. Spain and Portugal, newly unified Christian kingdoms after completing the Reconquista in 1492, launched the Age of Exploration — the same year Columbus reached the Americas. Russia was consolidating under Moscow after ending Mongol overlordship in 1480, while Poland-Lithuania and the Holy Roman Empire remained large but internally fragmented powers.",
    rulers: {
      britishIsles: "Kingdom of England (Tudor) & Scotland",
      scandinavia: "Kalmar Union (Denmark, Norway, Sweden)",
      polandBaltic: "Polish-Lithuanian union",
      russiaEast: "Grand Duchy of Moscow",
      iberia: "Spain (Castile & Aragon) & Portugal",
      franceGaul: "Kingdom of France (Valois)",
      germanyCentral: "Holy Roman Empire (Habsburg)",
      balkans: "Ottoman Empire",
      italy: "Fragmented Italian states (Italian Wars begin)",
      anatolia: "Ottoman Empire",
    },
  },
  {
    year: 1800,
    yearLabel: "1800 CE",
    title: "Poland erased, France in revolution",
    blurb: "Poland had vanished from the map, partitioned among Russia, Prussia, and Austria by 1795. France, having overthrown its monarchy in the 1789 Revolution, was on the verge of Napoleonic conquest that would soon redraw much of the continent. Russia had grown into a major European power, while the Ottoman Empire continued a long, slow decline, still nominally controlling the Balkans and Anatolia.",
    rulers: {
      britishIsles: "United Kingdom of Great Britain & Ireland",
      scandinavia: "Denmark-Norway & Sweden",
      polandBaltic: "Partitioned — absorbed by Russia, Prussia & Austria",
      russiaEast: "Russian Empire",
      iberia: "Kingdoms of Spain & Portugal",
      franceGaul: "French Republic (Napoleon rising)",
      germanyCentral: "Holy Roman Empire (fragmented, declining)",
      balkans: "Ottoman Empire (weakening)",
      italy: "Fragmented states, French influence growing",
      anatolia: "Ottoman Empire",
    },
  },
  {
    year: 1914,
    yearLabel: "1914",
    title: "The outbreak of the First World War",
    blurb: "Europe had consolidated into large nation-states and empires. Germany and Italy, unified in the late 1800s, joined established powers Britain, France, Russia, and Austria-Hungary in a tense alliance system. The Balkans had just been reshaped by the 1912-13 Balkan Wars, and Austria-Hungary's 1908 annexation of Bosnia inflamed regional tensions. The assassination of Archduke Franz Ferdinand in Sarajevo in June 1914 triggered the alliance system, plunging the continent into war.",
    rulers: {
      britishIsles: "United Kingdom (British Empire)",
      scandinavia: "Independent Denmark, Norway, Sweden",
      polandBaltic: "Divided — German, Russian & Austro-Hungarian rule",
      russiaEast: "Russian Empire",
      iberia: "Kingdom of Spain & Republic of Portugal",
      franceGaul: "French Third Republic",
      germanyCentral: "German Empire",
      balkans: "Newly independent states after the Balkan Wars",
      italy: "Kingdom of Italy",
      anatolia: "Ottoman Empire (declining)",
    },
  },
  {
    year: 2000,
    yearLabel: "2000",
    title: "After the Cold War and Yugoslavia's breakup",
    blurb: "The map had been redrawn again by the collapse of Communism. The Soviet Union dissolved in 1991, restoring independence to Poland, the Baltic states, and others. Germany reunified in 1990. Yugoslavia violently broke apart through the 1990s into Slovenia, Croatia, Bosnia and Herzegovina, and a rump Serbia-Montenegro, with the Kosovo conflict ending in 1999. The European Union, expanding steadily since the 1950s, was preparing its largest enlargement yet.",
    rulers: {
      britishIsles: "United Kingdom & Ireland (EU members)",
      scandinavia: "Denmark, Norway (non-EU), Sweden",
      polandBaltic: "Independent Poland, Lithuania, Latvia, Estonia",
      russiaEast: "Russian Federation",
      iberia: "Spain & Portugal (EU members)",
      franceGaul: "France (EU founding member)",
      germanyCentral: "Reunified Germany",
      balkans: "Post-Yugoslavia: Slovenia, Croatia, Serbia & others",
      italy: "Italy (EU founding member)",
      anatolia: "Republic of Turkey",
    },
  },
];

if (typeof module !== "undefined" && module.exports) {
  module.exports = { REGIONS, ERAS };
}
