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

const SORT_PRICE: plotSortFn = (a, b) => (a.rentPrice / a.rentDuration) - (b.rentPrice / b.rentDuration);
const SORT_PLOTNAME: plotSortFn = (a, b) => stringSorter(a.name, b.name);
const SORT_LANDLORD: plotSortFn = (a, b) => stringSorter(a.landlord?.name ?? a.owner?.name ?? "", b.landlord?.name ?? b.owner?.name ?? "");

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

fetch("https://cityrp.api.jotoho.de/api/rentals/plots").then(async (response) => {
    const plotsContainer = document.querySelector<HTMLTableSectionElement>("#plots > tbody");
    if (response.ok && plotsContainer) {
        const plots: Plot[] = JSON.parse(await response.text());

        console.debug("Plot information received from server:", plots);

        generatePlotList(plots, plotsContainer, SORT_PRICE);

        plotsContainer.parentElement
            ?.querySelector
            ?.("th.th-plotname")
            ?.addEventListener
            ?.("click", generatePlotList.bind(this, plots, plotsContainer, SORT_PLOTNAME), { passive: true });
        plotsContainer.parentElement
            ?.querySelector
            ?.("th.th-priceweekly")
            ?.addEventListener
            ?.("click", generatePlotList.bind(this, plots, plotsContainer, SORT_PRICE), { passive: true });;
        plotsContainer.parentElement
            ?.querySelector
            ?.("th.th-landlord")
            ?.addEventListener
            ?.("click", generatePlotList.bind(this, plots, plotsContainer, SORT_LANDLORD), { passive: true });;
    }
    else if (plotsContainer && plotsContainer.parentElement) {
        plotsContainer.parentElement.outerHTML = `<p>Loading plot data failed! Contact MoSS.</p>`;
    }
});
