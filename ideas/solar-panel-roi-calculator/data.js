/* Solar Panel ROI Calculator — Serbia constants
 *
 * IMPORTANT: These are BALLPARK PLANNING ESTIMATES, not verified live data.
 * They are based on general public knowledge of the Serbian residential solar
 * and electricity market (installer pricing commonly quoted in EUR/kW, EPS's
 * published tiered/zonal residential tariff structure, and general solar
 * resource literature for the Balkans/PVGIS-type climate data) as understood
 * as of this build (2026). They are NOT pulled from a live pricing API or the
 * current official EPS tariff decision. Before using this for a real
 * financial decision, an installer quote and the current EPS tariff table
 * should replace these numbers.
 *
 * TODO (update periodically): re-check against the latest EPS tariff
 * decision (published on eps.rs) and current installer quotes — energy
 * prices and equipment costs both move over time.
 */
var SOLAR_CONSTANTS = {
  // Average turnkey installed cost per kW of PV capacity for a typical
  // grid-tied residential ("prosumer") system in Serbia, in EUR.
  // Ballpark based on commonly cited residential installer pricing
  // (roughly 1000-1300 EUR/kW depending on system size and equipment).
  costPerKwEUR: 1100,

  // Blended average residential electricity price, in EUR/kWh, including
  // taxes/network fees. This is a SIMPLIFICATION: EPS actually bills
  // residential customers on a tiered/zonal system (green/blue/red
  // consumption zones, plus higher/lower time-of-day tariff), so a real
  // household's effective price depends on how much they consume and when.
  // 0.095 EUR/kWh approximates a mid-usage household's blended rate.
  avgResidentialPriceEURPerKWh: 0.095,

  // Approximate usable roof area (m²) needed per 1 kW of installed panels,
  // accounting for panel spacing, orientation, and obstructions (chimneys,
  // vents). Real modern panels are ~1.8-2.2 m² per ~400-450W panel, so this
  // includes typical installation overhead.
  usableRoofAreaPerKwM2: 6,

  // Assumed useful system lifetime in years, for framing payback vs. lifetime
  // (does not model panel degradation, inverter replacement, or future
  // electricity price changes).
  systemLifetimeYears: 25,

  // Estimated annual solar energy yield per 1 kW installed (kWh/kWp/year),
  // by city/region. Serbia's solar resource is generally higher in the
  // south/southeast (Niš, Leskovac, Vranje) and slightly lower in the more
  // cloud-prone west (Užice) and northern plains, broadly consistent with
  // published solar-resource maps for the Balkans (~1300-1550 kWh/kWp/year
  // range for Serbia). These are rough regional midpoints, not a per-address
  // PVGIS lookup.
  cities: [
    { key: 'beograd', name: 'Beograd', region: 'Central Serbia', annualYieldKwhPerKw: 1380 },
    { key: 'novisad', name: 'Novi Sad', region: 'Vojvodina', annualYieldKwhPerKw: 1360 },
    { key: 'subotica', name: 'Subotica', region: 'Vojvodina', annualYieldKwhPerKw: 1350 },
    { key: 'zrenjanin', name: 'Zrenjanin', region: 'Vojvodina', annualYieldKwhPerKw: 1370 },
    { key: 'pancevo', name: 'Pančevo', region: 'Vojvodina', annualYieldKwhPerKw: 1375 },
    { key: 'sabac', name: 'Šabac', region: 'West Serbia', annualYieldKwhPerKw: 1360 },
    { key: 'kragujevac', name: 'Kragujevac', region: 'Central Serbia', annualYieldKwhPerKw: 1400 },
    { key: 'cacak', name: 'Čačak', region: 'West Serbia', annualYieldKwhPerKw: 1380 },
    { key: 'uzice', name: 'Užice', region: 'West Serbia', annualYieldKwhPerKw: 1340 },
    { key: 'kraljevo', name: 'Kraljevo', region: 'Central Serbia', annualYieldKwhPerKw: 1400 },
    { key: 'nis', name: 'Niš', region: 'South Serbia', annualYieldKwhPerKw: 1430 },
    { key: 'leskovac', name: 'Leskovac', region: 'South Serbia', annualYieldKwhPerKw: 1420 },
    { key: 'vranje', name: 'Vranje', region: 'South Serbia', annualYieldKwhPerKw: 1440 },
    { key: 'novipazar', name: 'Novi Pazar', region: 'Southwest Serbia', annualYieldKwhPerKw: 1360 }
  ]
};
