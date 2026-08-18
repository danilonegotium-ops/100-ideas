// Plant Care Guide — curated houseplant catalogue.
// `baseWateringDays` is a general-purpose approximation (typical indoor
// conditions, average pot size) drawn from commonly cited houseplant-care
// guidance, NOT a substitute for reading your specific plant's tag or a
// dedicated botanical source. app.js nudges this base interval up/down using
// the live humidity (and a little temperature) for the user's city.
const PLANTS = [
  { id: "pothos", name: "Pothos (Epipremnum aureum)", baseWateringDays: 7, light: "Low to bright indirect", notes: "Very forgiving — let the top few cm of soil dry out between waterings." },
  { id: "snake-plant", name: "Snake Plant (Sansevieria)", baseWateringDays: 14, light: "Low to bright indirect", notes: "Extremely drought tolerant. Overwatering is the main risk." },
  { id: "zz-plant", name: "ZZ Plant (Zamioculcas zamiifolia)", baseWateringDays: 14, light: "Low to medium", notes: "Stores water in rhizomes; happy being neglected." },
  { id: "spider-plant", name: "Spider Plant (Chlorophytum comosum)", baseWateringDays: 7, light: "Medium to bright indirect", notes: "Likes evenly moist soil but tolerates missed waterings." },
  { id: "peace-lily", name: "Peace Lily (Spathiphyllum)", baseWateringDays: 6, light: "Medium indirect", notes: "Droops visibly when thirsty, recovers fast once watered." },
  { id: "monstera", name: "Monstera Deliciosa", baseWateringDays: 7, light: "Bright indirect", notes: "Let the top 3-5 cm of soil dry before watering again." },
  { id: "fiddle-leaf-fig", name: "Fiddle Leaf Fig (Ficus lyrata)", baseWateringDays: 7, light: "Bright indirect", notes: "Sensitive to both over- and under-watering; keep a consistent routine." },
  { id: "rubber-plant", name: "Rubber Plant (Ficus elastica)", baseWateringDays: 7, light: "Bright indirect", notes: "Wipe large leaves occasionally so they can photosynthesize efficiently." },
  { id: "aloe-vera", name: "Aloe Vera", baseWateringDays: 14, light: "Bright direct to indirect", notes: "Succulent — soak-and-dry watering, never leave it sitting wet." },
  { id: "philodendron", name: "Heartleaf Philodendron", baseWateringDays: 7, light: "Medium to bright indirect", notes: "Vining and forgiving, similar care to pothos." },
  { id: "boston-fern", name: "Boston Fern", baseWateringDays: 3, light: "Medium indirect", notes: "Likes consistently moist soil and higher humidity than most houseplants." },
  { id: "english-ivy", name: "English Ivy (Hedera helix)", baseWateringDays: 5, light: "Medium light", notes: "Prefers soil kept lightly moist, not soggy." },
  { id: "chinese-evergreen", name: "Chinese Evergreen (Aglaonema)", baseWateringDays: 7, light: "Low to medium", notes: "Tolerant of low light and irregular watering." },
  { id: "jade-plant", name: "Jade Plant (Crassula ovata)", baseWateringDays: 14, light: "Bright light", notes: "Succulent — let soil dry out fully between waterings." },
  { id: "calathea", name: "Calathea", baseWateringDays: 4, light: "Medium indirect", notes: "Prefers consistently moist soil and higher humidity; sulks in dry air." },
  { id: "dracaena", name: "Dracaena", baseWateringDays: 10, light: "Medium to bright indirect", notes: "Sensitive to fluoride/chlorine — filtered or rested tap water helps." },
  { id: "succulent-mixed", name: "Succulent (e.g. Echeveria)", baseWateringDays: 14, light: "Bright light", notes: "Soak thoroughly, then let dry out completely before watering again." },
  { id: "cactus", name: "Cactus (desert type)", baseWateringDays: 21, light: "Bright direct", notes: "Water sparingly, more in growing season, almost not at all in winter." },
  { id: "areca-palm", name: "Areca Palm", baseWateringDays: 5, light: "Bright indirect", notes: "Likes soil kept lightly moist; brown tips often mean low humidity or hard water." },
  { id: "orchid", name: "Orchid (Phalaenopsis)", baseWateringDays: 7, light: "Bright indirect", notes: "Water when roots look silvery-grey rather than on a strict calendar; avoid standing water." },
];

if (typeof module !== "undefined" && module.exports) {
  module.exports = { PLANTS };
}
