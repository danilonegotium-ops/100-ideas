// Seed data for the Balkan dummy-data generator.
// Curated by hand for this tool — realistic Serbian/Balkan first names,
// last names, and cities. Not scraped; just common, well-known names.

const FIRST_NAMES = [
  // female
  "Ana", "Milica", "Jovana", "Marija", "Jelena", "Ivana", "Tamara", "Katarina",
  "Nikolina", "Teodora", "Sofija", "Andjela", "Dragana", "Vesna", "Milena",
  // male
  "Nikola", "Marko", "Stefan", "Milan", "Petar", "Aleksandar", "Vladimir",
  "Nemanja", "Dušan", "Miloš", "Uroš", "Filip", "Luka", "Ognjen", "Bogdan"
];

const LAST_NAMES = [
  "Jovanović", "Petrović", "Nikolić", "Marković", "Đorđević", "Stojanović",
  "Ilić", "Stanković", "Pavlović", "Milošević", "Popović", "Ristić",
  "Kovačević", "Simić", "Vasić", "Todorović", "Lazić", "Obradović",
  "Ković", "Radovanović", "Antić", "Živković", "Đurić", "Savić",
  "Vuković", "Mitrović", "Cvetković", "Aleksić", "Nedeljković", "Perić"
];

const CITIES = [
  "Beograd", "Novi Sad", "Niš", "Kragujevac", "Subotica", "Zrenjanin",
  "Pančevo", "Čačak", "Kraljevo", "Novi Pazar", "Leskovac", "Užice",
  "Vranje", "Šabac", "Sombor", "Podgorica", "Banja Luka", "Sarajevo",
  "Skopje", "Zagreb"
];

const EMAIL_DOMAINS = ["gmail.com", "yahoo.com", "outlook.com", "posta.rs"];

if (typeof module !== "undefined" && module.exports) {
  module.exports = { FIRST_NAMES, LAST_NAMES, CITIES, EMAIL_DOMAINS };
}
