# Solar Panel ROI Calculator

For Serbian homeowners to see if solar panels are worth it based on local electricity prices.
User enters either a desired system size (kW) or available roof area (m²), their average monthly
electricity bill (EUR), and a city/region. The tool estimates install cost, annual production,
annual savings, and payback period.

**⚠ These are estimates for planning only, not a formal quote** — shown as a visible disclaimer in
the UI and repeated here.

## How it works

- `data.js` holds `SOLAR_CONSTANTS`: install cost per kW, blended average residential electricity
  price, roof-area-per-kW assumption, and a per-city annual solar yield (kWh produced per kW
  installed per year) for 14 Serbian cities/regions.
- `app.js` has pure calculation functions (no DOM) so the math is sanity-checkable in plain Node:
  `systemSizeFromRoofArea`, `estimateSystemCost`, `estimateAnnualProductionKwh`,
  `estimateAnnualConsumptionKwh` (derived from the monthly bill), `estimateAnnualSavingsEUR`, and
  `estimatePaybackYears`, composed by `calculateSolarROI`.
- Savings are calculated as `min(annual production, annual consumption) × price/kWh`, not raw
  production × price. This is a deliberate scope call: Serbia's residential "prosumer" net-metering
  scheme nets solar surplus against your own consumption within a billing cycle rather than paying
  full retail for everything exported, so capping savings at estimated consumption is more realistic
  than assuming every exported kWh is worth full price. If the estimated production is well above
  estimated consumption, the UI shows a note suggesting a smaller system may pay back faster.
- Monthly bill is entered directly in EUR (with a hint to divide an RSD bill by ~117) rather than
  asking for both RSD and a separately-input exchange rate — kept to one currency throughout to
  avoid compounding two independent estimate errors (price/kWh assumption + exchange rate
  assumption) into the result.

## Data sourcing — read before trusting the numbers

All constants in `data.js` are **ballpark planning estimates**, not pulled from a live pricing
API or the current official EPS tariff decision:

- **Install cost (1100 EUR/kW)**: ballpark based on commonly cited residential turnkey installer
  pricing in Serbia (roughly 1000-1300 EUR/kW depending on system size/equipment). Not a specific
  installer's quote.
- **Electricity price (0.095 EUR/kWh blended)**: EPS actually bills residential customers on a
  tiered/zonal system (green/blue/red consumption zones × higher/lower time-of-day tariff), so a
  real household's effective rate depends on how much and when they consume. 0.095 EUR/kWh
  approximates a mid-usage household's blended rate — it is a simplification, not the literal EPS
  tariff table.
- **Solar yield by city (1340-1440 kWh/kWp/year)**: rough regional midpoints consistent with
  published solar-resource literature for the Balkans (Serbia broadly sits in the ~1300-1550
  kWh/kWp/year band, higher in the south/southeast, lower in the cloudier west), not a per-address
  PVGIS API lookup.

**This data should be refreshed** against the current EPS tariff decision (published on eps.rs)
and real installer quotes before being used for an actual financial decision — see the TODO
comment at the top of `data.js`.

## Out of scope for this pass

- No live PVGIS API call for a precise per-address solar yield.
- No modeling of panel degradation (~0.5%/year), inverter replacement cost, or future electricity
  price changes over the system's lifetime.
- No distinction between full net-metering vs. feed-in-tariff prosumer schemes — savings are
  conservatively capped at estimated self-consumption.
- No financing/loan-interest modeling — payback period is cash-purchase-only.
