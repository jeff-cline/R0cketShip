/**
 * Phase 2 client-safe constants. No DB imports — safe to import from both
 * server and client components without dragging `pg` into the browser bundle.
 */
export const SIGNUP_BONUS_CENTS = 1_000;     // $10
export const MIN_DEPOSIT_CENTS = 100_000;    // $1,000
export const MIN_CPA_CENTS = 500;            // $5

export const MIN_DEPOSIT_DOLLARS = MIN_DEPOSIT_CENTS / 100;
export const MIN_CPA_DOLLARS = MIN_CPA_CENTS / 100;
export const SIGNUP_BONUS_DOLLARS = SIGNUP_BONUS_CENTS / 100;
