/**
 * @file theme.ts
 * @brief Handles the application's visual house theme.
 *
 * @details
 * The selected house changes only the application's colors.
 * It does not change the user's real household.
 *
 * The selected theme is persisted in the User database model
 * (via the /api/theme endpoint) and restored on future sessions.
 */

/**
 * @brief Lists every available visual house theme.
 *
 * @details
 * The "as const" assertion allows TypeScript to preserve
 * the exact string values instead of treating them as
 * generic strings.
 */
export const HOUSE_THEMES = [
    "parchment",
    "gryffindor",
    "slytherin",
    "ravenclaw",
    "hufflepuff",
] as const;

/**
 * @brief Represents one valid visual house theme.
 *
 * @details
 * This type is automatically inferred from HOUSE_THEMES.
 */
export type HouseTheme = (typeof HOUSE_THEMES)[number];

/**
 * @brief Default visual house theme.
 *
 * @details
 * Used when the user has not selected a valid theme yet.
 */
export const DEFAULT_HOUSE_THEME: HouseTheme = "parchment";

/**
 * @brief Checks whether a value is a valid visual house theme.
 *
 * @details
 * Verifies that the provided value matches one of the
 * supported house theme names.
 *
 * @param value (unknown) Value to validate.
 *
 * @return true if the value is one of the supported house themes,
 * otherwise false.
 */
export function is_house_theme(value: unknown): boolean {
    return (
        typeof value === "string" &&
        HOUSE_THEMES.includes(value as HouseTheme)
    );
}

/**
 * @brief Applies the selected visual theme to the application.
 *
 * @details
 * The function updates the data-theme attribute of the root
 * HTML element.
 *
 * CSS variables defined in app.css then automatically switch
 * to the corresponding color palette.
 *
 * Example result:
 * the root HTML element receives data-theme="slytherin".
 *
 * During server-side rendering (SSR), the document object
 * does not exist, so the function returns immediately.
 *
 * @param theme (HouseTheme) Visual house theme to apply.
 *
 * @return void
 */
export function apply_house_theme(theme: HouseTheme): void {
    if (typeof document === "undefined") {
        return;
    }

    document.documentElement.dataset.theme = theme;
}