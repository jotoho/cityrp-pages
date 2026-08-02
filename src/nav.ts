/*
SPDX-License-Identifier: AGPL-3.0-only
SPDX-FileCopyrightText: 2025 Jonas Tobias Hopusch <git@jotoho.de>
*/

/*
 * Behaviour for the shared header in partials/header.html:
 *  - marking the nav link of the current page
 *  - the light/dark theme toggle
 */

/* ── Current page indicator ──────────────────────────────────────────── */

const normalize = (path: string): string =>
    path.endsWith("/") ? path + "index.html" : path;

const markCurrentNavLink = () => {
    const here = normalize(window.location.pathname);

    for (const link of document.querySelectorAll<HTMLAnchorElement>("header > nav > a")) {
        if (link.origin === window.location.origin && normalize(link.pathname) === here) {
            link.setAttribute("aria-current", "page");
        }
    }
};

/* ── Theme toggle ────────────────────────────────────────────────────── */

/*
 * Dark is the default and needs no attribute, so the stylesheet alone renders
 * the right thing before this module runs. Only an explicit choice of light is
 * stored, which keeps the common case free of any flash of the wrong theme.
 */

const STORAGE_KEY = "cityrp-theme";

type Theme = "light" | "dark";

// localStorage throws in some privacy configurations; the toggle should still
// work for the current page in that case.
const readStoredTheme = (): Theme | null => {
    try {
        return window.localStorage.getItem(STORAGE_KEY) === "light" ? "light" : null;
    } catch {
        return null;
    }
};

const storeTheme = (theme: Theme) => {
    try {
        if (theme === "light") {
            window.localStorage.setItem(STORAGE_KEY, "light");
        } else {
            window.localStorage.removeItem(STORAGE_KEY);
        }
    } catch {
        /* not persisting is acceptable */
    }
};

const applyTheme = (theme: Theme) => {
    if (theme === "light") {
        document.documentElement.setAttribute("data-theme", "light");
    } else {
        document.documentElement.removeAttribute("data-theme");
    }
};

const currentTheme = (): Theme =>
    document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark";

const setUpThemeToggle = () => {
    const toggle = document.querySelector<HTMLButtonElement>("header > button.theme-toggle");

    toggle?.addEventListener("click", () => {
        const next: Theme = currentTheme() === "light" ? "dark" : "light";
        applyTheme(next);
        storeTheme(next);
    });
};

applyTheme(readStoredTheme() ?? "dark");
markCurrentNavLink();
setUpThemeToggle();
