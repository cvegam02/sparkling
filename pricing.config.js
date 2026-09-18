'use strict';

// Placeholder pricing rules for the quote calculator.
//
// HOW TO EDIT THIS FILE (no coding needed):
// - Replace any `null` with a number (a whole dollar amount, no `$` sign)
//   once you know the real price for that combination.
// - `ranges[service][size]` is a [low, high] pair. Leave BOTH as `null`
//   until you have a real number for that exact combination — the
//   calculator shows a "we'll confirm by chat" message instead of a price
//   whenever either side of the pair is missing.
// - `areaAdjustmentPercent` nudges the whole range up or down per area
//   (e.g. `10` adds 10%, `-5` subtracts 5%). Leave at `0` if all three
//   areas should cost the same.
//
// The keys below (service ids, size ids, area ids) must stay exactly as
// they are — they're what the calculator's dropdowns send. Only the
// numbers should change.

module.exports = {
  // [low, high] dollar range per service x property size. All `null` until
  // real prices are set.
  ranges: {
    presale: {
      studio: [null, null],
      twothree: [null, null],
      fourplus: [null, null]
    },
    'post-sale': {
      studio: [null, null],
      twothree: [null, null],
      fourplus: [null, null]
    },
    additional: {
      studio: [null, null],
      twothree: [null, null],
      fourplus: [null, null]
    }
  },

  // Percentage adjustment applied to the range above, per service area.
  areaAdjustmentPercent: {
    ocala: 0,
    tampa: 0,
    'spring-hill': 0
  }
};
