'use strict';

// Pricing rules for the quote calculator (itemized, CleanCalc-style).
//
// HOW TO EDIT THIS FILE (no coding needed):
// - Prices are dollar amounts with no `$` sign. Cents are fine (e.g. 39.75).
// - `minutes` is how long one unit of that item takes; it only feeds the
//   "Estimated time" and "Suggested cleaners" lines, never the price.
// - Set any price to `null` if it isn't decided yet. The calculator then
//   shows a "we'll confirm by chat" message instead of a total whenever the
//   visitor picks that item — it never shows `$null`.
// - `default` is the starting count shown on the page; `max` caps the
//   +/- stepper.
//
// The keys below (standard, bedrooms, windows, ocala, ...) must stay exactly
// as they are — the page content in content/*/quote-calculator.json refers
// to them by name. Only the numbers should change.

module.exports = {
  // Flat starting price for each type of cleaning. `timeMultiplier` scales
  // the estimated time (a deep clean takes longer per room).
  cleaningTypes: {
    standard: { basePrice: 100, timeMultiplier: 1 },
    deep: { basePrice: 150, timeMultiplier: 1.5 }
  },

  // Minutes added to every job on top of the rooms (setup, walkthrough).
  baseMinutes: 60,

  // Price per room, added once per room of that kind.
  rooms: {
    bedrooms: { price: 25, minutes: 30, default: 1, max: 10 },
    bathrooms: { price: 20, minutes: 30, default: 1, max: 10 },
    kitchens: { price: 30, minutes: 45, default: 1, max: 3 },
    laundry: { price: 15, minutes: 15, default: 0, max: 3 },
    living: { price: 15, minutes: 15, default: 0, max: 5 },
    dining: { price: 15, minutes: 10, default: 0, max: 3 }
  },

  // Optional add-ons. `count` items get a +/- stepper, `toggle` items a
  // yes/no checkbox.
  extras: {
    windows: { kind: 'count', price: 39.75, minutes: 15, default: 0, max: 40 },
    fridge: { kind: 'toggle', price: 30, minutes: 20 },
    oven: { kind: 'toggle', price: 30, minutes: 20 }
  },

  // Travel ("Distance") fee per service area. Use 0 for no fee.
  travelFee: {
    ocala: 20,
    tampa: 20,
    'spring-hill': 20
  },

  // One cleaner per this many minutes of work, clamped to [min, max].
  crew: { minutesPerCleaner: 240, min: 1, max: 4 }
};
