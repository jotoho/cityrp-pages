/*
SPDX-License-Identifier: AGPL-3.0-only
SPDX-FileCopyrightText: 2025 Jonas Tobias Hopusch <git@jotoho.de>
*/

type RealtyPlayer = {
    name: string,
    uuid: string,
    type: string,
    balance: number,
};

type RegionLabel = {
    label: string,
    id: number,
};

type Plot = {
    name: string,
    plotType: string,
    regionLabelList: RegionLabel[],
    owner: RealtyPlayer | null,
    landlord: RealtyPlayer | null,
    tenant: RealtyPlayer | null,
    rentDuration: number,
    rentExpiryTime: number,
    rentPrice: number,
    id: number,
    parentPlot: Plot | null,
};

type plotSortFn = (a: Plot, b: Plot) => number;

const stringSorter = (a: string, b: string) => {
    a = a.toUpperCase();
    b = b.toUpperCase();
    return a == b ? 0 : (a > b ? 1 : -1);
};

/* ── Sorting ─────────────────────────────────────────────────────────── */

const landlordOf = (plot: Plot): string => plot.landlord?.name ?? plot.owner?.name ?? "";
const locationOf = (plot: Plot): string => plot.parentPlot?.name ?? "unknown";
const regionLabelsOf = (plot: Plot): string =>
    plot.regionLabelList.map(label => label.label).join(" ").trim();
const weeklyPriceOf = (plot: Plot): number =>
    plot.rentPrice / (plot.rentDuration / (7 * 24 * 3600));

/*
 * Every column is sortable, keyed by the class on its <th>. Each comparator
 * sorts ascending; descending is handled by inverting the result.
 */
const SORTERS = new Map<string, plotSortFn>([
    ["th-plotname", (a, b) => stringSorter(a.name, b.name)],
    ["th-price", (a, b) => a.rentPrice - b.rentPrice],
    ["th-duration", (a, b) => a.rentDuration - b.rentDuration],
    ["th-priceweekly", (a, b) => weeklyPriceOf(a) - weeklyPriceOf(b)],
    ["th-locatedin", (a, b) => stringSorter(locationOf(a), locationOf(b))],
    ["th-regionlabels", (a, b) => stringSorter(regionLabelsOf(a), regionLabelsOf(b))],
    ["th-landlord", (a, b) => stringSorter(landlordOf(a), landlordOf(b))],
]);

const DEFAULT_COLUMN = "th-priceweekly";

const PREDICATES: ((plot: Plot) => boolean)[] = [
    plot => plot.plotType == "RENTED",
    plot => plot.tenant == null,
    plot => plot.rentDuration >= 24 * 3600,
    plot => plot.rentPrice >= 1,
    plot => plot.rentExpiryTime == 0,
];

const generatePlotList = async (plots: Plot[],
    plotsContainer: HTMLTableSectionElement,
    sortFn: plotSortFn) => {

    while (plotsContainer.firstChild != null) {
        plotsContainer.removeChild(plotsContainer.firstChild);
    }

    plots
        .filter(plot => PREDICATES.map(pred => pred(plot)).every(b => b === true))
        .toSorted(sortFn)
        .map((plotInfo) => {
            const entry = document.createElement("tr");
            const entryName = entry.appendChild(document.createElement("td"))
            entryName.innerText = plotInfo.name;
            entryName.className = "plotname";
            const entryRentPrice = entry.appendChild(document.createElement("td"));
            entryRentPrice.innerText = "$" + Math.ceil(plotInfo.rentPrice).toString();
            entryRentPrice.className = "rentprice";
            const entryDuration = entry.appendChild(document.createElement("td"));
            entryDuration.className = "rentduration";
            entryDuration.innerText = `${Math.floor(plotInfo.rentDuration / (24 * 3600))} days`;
            const weeklyAveragePrice = plotInfo.rentPrice / (plotInfo.rentDuration / (7 * 24 * 3600));
            const entryAvgPrice = entry.appendChild(document.createElement("td"));
            entryAvgPrice.innerText = `$${Math.ceil(weeklyAveragePrice)}`;
            entryAvgPrice.className = "rentavgprice";
            const entryLocation = entry.appendChild(document.createElement("td"));
            entryLocation.innerText = plotInfo.parentPlot?.name ?? "unknown";
            entryLocation.className = "location";
            const entryRegionLabel = entry.appendChild(document.createElement("td"));
            entryRegionLabel.className = "regionlabels";
            entryRegionLabel.innerText = plotInfo.regionLabelList
                .map(obj => obj.label)
                .reduce((agg, cur) => agg + " " + cur, "")
                .trim();
            const entryLandlord = entry.appendChild(document.createElement("td"));
            entryLandlord.innerText = plotInfo.landlord?.name ?? plotInfo.owner?.name ?? "";
            entryLandlord.className = "landlord";
            return entry;
        })
        .filter(obj => !!obj)
        .forEach((entry) => {
            plotsContainer.insertAdjacentElement('beforeend', entry)
        });
};

const reportFailure = () => {
    const plotsContainer = document.querySelector<HTMLTableSectionElement>("#plots > tbody");
    if (plotsContainer?.parentElement) {
        plotsContainer.parentElement.outerHTML = `<p>Loading plot data failed! Contact MoSS.</p>`;
    }
};

/*
 * Wires click and keyboard sorting onto the table headers, and keeps aria-sort
 * in sync so the active column and its direction are both visible (the
 * stylesheet draws the arrows from it) and announced by screen readers.
 */
const setUpSorting = (plots: Plot[], plotsContainer: HTMLTableSectionElement) => {
    const table = plotsContainer.parentElement;
    if (!table) {
        return;
    }

    let activeColumn = DEFAULT_COLUMN;
    let ascending = true;

    const render = () => {
        const compare = SORTERS.get(activeColumn);
        if (!compare) {
            return;
        }

        generatePlotList(plots, plotsContainer,
            ascending ? compare : (a, b) => -compare(a, b));

        for (const columnClass of SORTERS.keys()) {
            table.querySelector(`th.${columnClass}`)?.setAttribute(
                "aria-sort",
                columnClass !== activeColumn
                    ? "none"
                    : ascending ? "ascending" : "descending",
            );
        }
    };

    const sortBy = (columnClass: string) => {
        // Re-clicking the active column reverses it; a new column starts ascending.
        if (columnClass === activeColumn) {
            ascending = !ascending;
        } else {
            activeColumn = columnClass;
            ascending = true;
        }
        render();
    };

    for (const columnClass of SORTERS.keys()) {
        const header = table.querySelector<HTMLTableCellElement>(`th.${columnClass}`);
        if (!header) {
            continue;
        }

        // Headers are not focusable by default, so sorting was mouse-only.
        header.tabIndex = 0;
        header.addEventListener("click", () => { sortBy(columnClass); }, { passive: true });
        header.addEventListener("keydown", (event) => {
            if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                sortBy(columnClass);
            }
        });
    }

    render();
};

// In dev the request goes through the vite proxy (see vite.config.js), because
// the API only allows CORS from the production origin.
const PLOTS_ENDPOINT = import.meta.env.DEV
    ? "/api/rentals/plots"
    : "https://cityrp.api.jotoho.de/api/rentals/plots";

fetch(PLOTS_ENDPOINT).then(async (response) => {
    const plotsContainer = document.querySelector<HTMLTableSectionElement>("#plots > tbody");
    if (response.ok && plotsContainer) {
        const plots: Plot[] = JSON.parse(await response.text());

        console.debug("Plot information received from server:", plots);

        setUpSorting(plots, plotsContainer);
    }
    else {
        reportFailure();
    }
}).catch((error: unknown) => {
    // Without this the table silently stays empty when the request rejects
    // outright (offline, DNS failure, CORS).
    console.error("Could not load plot data:", error);
    reportFailure();
});
