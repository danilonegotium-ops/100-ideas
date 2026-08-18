// Gde Na Rucak — seed restaurant data.
//
// SOURCING NOTE (see SPEC.md for the full version): this is a *curated starting
// set*, not a scraped or verified directory. Every entry below is a real,
// well-known, long-established restaurant/kafana the author is confident
// exists — no invented names. Confidence is highest for Beograd and Novi Sad
// (more widely documented cities); the Niš and Kragujevac lists are
// intentionally shorter because fewer entries met the "confident it's real
// and well-known" bar. No addresses/phone numbers are included since those
// would need live verification this tool can't do. Always confirm a place is
// still open before making plans around it.

const CITIES = ["Beograd", "Novi Sad", "Niš", "Kragujevac"];
const BUDGET_TIERS = ["€", "€€", "€€€"];

const RESTAURANTS = [
  // ---- Beograd ----
  { name: "Tri Šešira", city: "Beograd", cuisine: "Traditional Serbian kafana", budget: "€€", neighborhood: "Skadarlija" },
  { name: "Dva Jelena", city: "Beograd", cuisine: "Traditional Serbian kafana", budget: "€€", neighborhood: "Skadarlija" },
  { name: "Šešir Moj", city: "Beograd", cuisine: "Traditional Serbian kafana", budget: "€€", neighborhood: "Skadarlija" },
  { name: "Znak Pitanja (\"?\")", city: "Beograd", cuisine: "Traditional Serbian, oldest kafana in the city", budget: "€€", neighborhood: "Stari Grad, near the Cathedral" },
  { name: "Manufaktura", city: "Beograd", cuisine: "Serbian comfort food", budget: "€€", neighborhood: "Terazije" },
  { name: "Ambar", city: "Beograd", cuisine: "Modern Balkan small plates", budget: "€€€", neighborhood: "Dorćol" },
  { name: "Radost Fine Food", city: "Beograd", cuisine: "Vegetarian / vegan", budget: "€€", neighborhood: "Dorćol" },
  { name: "Lorenzo & Kakalamba", city: "Beograd", cuisine: "Eclectic garden restaurant", budget: "€€", neighborhood: "Vračar" },
  { name: "Little Bay", city: "Beograd", cuisine: "Themed fine dining", budget: "€€€", neighborhood: "Zeleni Venac" },
  { name: "Pekara Trpković", city: "Beograd", cuisine: "Bakery / burek", budget: "€", neighborhood: "multiple locations" },

  // ---- Novi Sad ----
  { name: "Plava Frajla", city: "Novi Sad", cuisine: "Traditional Serbian / Vojvodina kafana", budget: "€€", neighborhood: "Stari Grad (Old Town)" },
  { name: "Fish i Zeleniš", city: "Novi Sad", cuisine: "Seafood & vegetarian fine dining", budget: "€€€", neighborhood: "Center" },
  { name: "Salaš 137", city: "Novi Sad", cuisine: "Traditional Vojvodina salaš (farmstead) cuisine", budget: "€€", neighborhood: "Čenej, outskirts" },
  { name: "Chef Uroš", city: "Novi Sad", cuisine: "Modern fine dining tasting menu", budget: "€€€", neighborhood: "Center" },
  { name: "Fabrika", city: "Novi Sad", cuisine: "Ćevapi & grill", budget: "€", neighborhood: "Center" },
  { name: "Lazin Salaš", city: "Novi Sad", cuisine: "Traditional Vojvodina salaš cuisine", budget: "€€", neighborhood: "outskirts" },
  { name: "List", city: "Novi Sad", cuisine: "Modern European bistro", budget: "€€", neighborhood: "Center" },

  // ---- Niš ----
  { name: "Stambol Kapija", city: "Niš", cuisine: "Traditional Serbian", budget: "€€", neighborhood: "near the Fortress (Tvrđava)" },
  { name: "Hotel Ambasador", city: "Niš", cuisine: "Traditional Serbian, hotel restaurant", budget: "€€€", neighborhood: "Trg Kralja Milana (Center)" },
  { name: "Kazandžijsko Sokače", city: "Niš", cuisine: "Traditional Serbian kafana quarter", budget: "€€", neighborhood: "Old Bazaar, near the Fortress" },
  { name: "Pekara Trpković", city: "Niš", cuisine: "Bakery / burek", budget: "€", neighborhood: "Center" },
  { name: "Fabrika", city: "Niš", cuisine: "Ćevapi & grill", budget: "€", neighborhood: "Center" },

  // ---- Kragujevac ----
  { name: "Hotel Kragujevac", city: "Kragujevac", cuisine: "Traditional Serbian, hotel restaurant", budget: "€€", neighborhood: "Center" },
  { name: "Šumarice", city: "Kragujevac", cuisine: "Traditional Serbian", budget: "€€", neighborhood: "Šumarice Memorial Park" },
  { name: "Pekara Trpković", city: "Kragujevac", cuisine: "Bakery / burek", budget: "€", neighborhood: "Center" },
  { name: "Fabrika", city: "Kragujevac", cuisine: "Ćevapi & grill", budget: "€", neighborhood: "Center" },
];

if (typeof module !== "undefined" && module.exports) {
  module.exports = { CITIES, BUDGET_TIERS, RESTAURANTS };
}
