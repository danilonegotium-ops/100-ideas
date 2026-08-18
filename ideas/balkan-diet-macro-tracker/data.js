// Balkan Diet Macro Tracker — curated food data.
//
// All calorie/protein/carb/fat figures are ESTIMATES for typical home-cooked
// portions, based on the known general composition of each dish. They are
// for personal planning purposes only, not medical/nutritional advice, and
// not lab-measured values. Actual values vary with recipe, portion size,
// and who's cooking. Each entry's `serving` string describes the reference
// portion the numbers are based on.

const BALKAN_FOODS = [
  { id: "sarma", name: "Sarma", serving: "2 rolls", calories: 320, proteinG: 16, carbsG: 22, fatG: 18 },
  { id: "cevapi", name: "Ćevapi", serving: "5 pieces, no bread", calories: 380, proteinG: 28, carbsG: 2, fatG: 28 },
  { id: "ajvar", name: "Ajvar", serving: "2 tbsp (30g)", calories: 95, proteinG: 1, carbsG: 6, fatG: 8 },
  { id: "pljeskavica", name: "Pljeskavica", serving: "1 patty (~200g), no bread", calories: 420, proteinG: 30, carbsG: 3, fatG: 32 },
  { id: "burek-meso", name: "Burek sa Mesom", serving: "1 slice (~150g)", calories: 410, proteinG: 15, carbsG: 30, fatG: 25 },
  { id: "burek-sir", name: "Burek sa Sirom", serving: "1 slice (~150g)", calories: 390, proteinG: 13, carbsG: 29, fatG: 24 },
  { id: "gibanica", name: "Gibanica", serving: "1 slice (~150g)", calories: 390, proteinG: 14, carbsG: 27, fatG: 24 },
  { id: "karadjordjeva", name: "Karađorđeva Šnicla", serving: "1 portion", calories: 520, proteinG: 32, carbsG: 26, fatG: 32 },
  { id: "prebranac", name: "Prebranac", serving: "1 bowl (~250g)", calories: 320, proteinG: 12, carbsG: 38, fatG: 13 },
  { id: "musaka", name: "Musaka", serving: "1 portion (~300g)", calories: 430, proteinG: 19, carbsG: 32, fatG: 25 },
  { id: "punjene-paprike", name: "Punjene Paprike", serving: "2 peppers with sauce", calories: 310, proteinG: 16, carbsG: 22, fatG: 17 },
  { id: "djuvec", name: "Đuveč", serving: "1 plate (~300g)", calories: 360, proteinG: 20, carbsG: 38, fatG: 12 },
  { id: "pasulj", name: "Pasulj / Grah", serving: "1 bowl (~300g)", calories: 340, proteinG: 17, carbsG: 40, fatG: 12 },
  { id: "sopska-salata", name: "Šopska Salata", serving: "1 plate (~250g)", calories: 190, proteinG: 8, carbsG: 10, fatG: 13 },
  { id: "srpska-salata", name: "Srpska Salata", serving: "1 plate (~200g), no cheese", calories: 90, proteinG: 2, carbsG: 12, fatG: 4 },
  { id: "palacinke", name: "Palačinke", serving: "2 crepes with jam", calories: 240, proteinG: 7, carbsG: 33, fatG: 8 },
  { id: "kremsnita", name: "Kremšnita", serving: "1 piece", calories: 310, proteinG: 6, carbsG: 34, fatG: 16 },
  { id: "kajmak", name: "Kajmak", serving: "2 tbsp (30g)", calories: 130, proteinG: 2, carbsG: 1, fatG: 14 },
  { id: "somun", name: "Somun / Lepinja", serving: "1 flatbread", calories: 260, proteinG: 8, carbsG: 50, fatG: 2 },
  { id: "proja", name: "Proja", serving: "1 slice", calories: 210, proteinG: 5, carbsG: 28, fatG: 9 },
  { id: "cufte", name: "Ćufte u Sosu", serving: "4 meatballs with sauce", calories: 350, proteinG: 22, carbsG: 14, fatG: 22 },
  { id: "raznjici", name: "Ražnjići", serving: "1 skewer (~150g)", calories: 300, proteinG: 26, carbsG: 1, fatG: 20 },
  { id: "riblja-corba", name: "Riblja Čorba", serving: "1 bowl", calories: 220, proteinG: 18, carbsG: 12, fatG: 10 },
  { id: "corba-povrce", name: "Čorba od Povrća", serving: "1 bowl", calories: 130, proteinG: 4, carbsG: 18, fatG: 5 },
  { id: "japrak", name: "Sarma od Vinovog Lišća (Japrak)", serving: "4 pieces", calories: 210, proteinG: 9, carbsG: 18, fatG: 11 },
  { id: "kacamak", name: "Kačamak", serving: "1 cup", calories: 300, proteinG: 7, carbsG: 32, fatG: 16 },
  { id: "zeljanica", name: "Zeljanica", serving: "1 slice", calories: 260, proteinG: 8, carbsG: 24, fatG: 15 },
  { id: "krompirusa", name: "Krompiruša", serving: "1 slice", calories: 280, proteinG: 6, carbsG: 34, fatG: 13 },
  { id: "baklava", name: "Baklava", serving: "1 piece", calories: 330, proteinG: 4, carbsG: 38, fatG: 18 },
  { id: "tulumba", name: "Tulumba", serving: "3 pieces", calories: 280, proteinG: 3, carbsG: 40, fatG: 12 },
  { id: "vanilice", name: "Vanilice", serving: "2 cookies", calories: 220, proteinG: 3, carbsG: 26, fatG: 12 },
  { id: "cokoladna-torta", name: "Čokoladna Torta", serving: "1 slice", calories: 380, proteinG: 5, carbsG: 44, fatG: 20 },
  { id: "turska-kafa", name: "Turska Kafa (no sugar)", serving: "1 cup", calories: 5, proteinG: 0, carbsG: 1, fatG: 0 },
  { id: "kefir", name: "Kefir", serving: "1 cup (~250ml)", calories: 150, proteinG: 8, carbsG: 12, fatG: 8 },
  { id: "jogurt", name: "Jogurt (plain)", serving: "1 cup (~250ml)", calories: 140, proteinG: 8, carbsG: 10, fatG: 7 },
  { id: "beli-sir", name: "Beli Sir", serving: "50g", calories: 140, proteinG: 9, carbsG: 2, fatG: 11 },
  { id: "pihtije", name: "Pihtije", serving: "1 portion (~150g)", calories: 220, proteinG: 18, carbsG: 2, fatG: 15 },
  { id: "cvarci", name: "Čvarci", serving: "30g", calories: 210, proteinG: 12, carbsG: 0, fatG: 18 },
  { id: "slanina", name: "Slanina", serving: "30g", calories: 190, proteinG: 6, carbsG: 0, fatG: 18 },
  { id: "kobasice", name: "Kobasice sa Roštilja", serving: "1 piece (~100g)", calories: 280, proteinG: 15, carbsG: 3, fatG: 23 },
  { id: "med", name: "Med", serving: "1 tbsp", calories: 60, proteinG: 0, carbsG: 17, fatG: 0 },
  { id: "orasi", name: "Orasi", serving: "small handful (~30g)", calories: 200, proteinG: 5, carbsG: 4, fatG: 19 },
];

if (typeof module !== "undefined" && module.exports) {
  module.exports = { BALKAN_FOODS };
}
