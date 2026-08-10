// Shared spacing/layout conventions — reference these instead of picking
// ad hoc padding/grid values so new sections stay visually consistent.

export const SECTION_PADDING = "py-16 sm:py-20";
export const CONTAINER = "mx-auto max-w-7xl px-4 sm:px-6";
export const PRODUCT_GRID = "grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4 xl:grid-cols-5";

// Window (in days) a product counts as "New" on its badge — derived from
// created_at at render time, not a stored flag.
export const NEW_ARRIVAL_DAYS = 14;
