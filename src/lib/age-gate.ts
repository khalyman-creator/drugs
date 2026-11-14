/**
 * Age gate constants, shared by the server-side check in the storefront layout
 * and the client component that collects the confirmation.
 *
 * Deliberately free of `next/headers` so it can be imported from both a server
 * component and a client component.
 */

/** Minimum age required to enter the storefront. */
export const MINIMUM_AGE = 21;

/**
 * Set only once a visitor confirms their age. Read server-side, so the
 * storefront is withheld before any product content reaches the browser rather
 * than being hidden behind an overlay that a visitor could simply dismiss.
 */
export const AGE_COOKIE = "silk_age_verified";

export const AGE_COOKIE_VALUE = "1";

/** One year — a returning visitor should not be asked on every visit. */
export const AGE_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;
