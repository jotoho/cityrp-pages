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

fetch("https://cityrp.api.jotoho.de/api/rentals/plots").then(async (response) => {
    const plotsContainer = document.querySelector<HTMLTableSectionElement>("#plots > tbody");
    if (response.ok && plotsContainer) {
        const plots: Plot[] = JSON.parse(await response.text());

        console.debug("Plot information received from server:", plots);

        const filter = (plot: Plot) => plot.plotType == "RENTED" && plot.tenant == null && plot.rentDuration >= 24 * 3600 && plot.rentPrice >= 1 && plot.rentExpiryTime == 0;

        plots.filter(filter)
            .toSorted((a, b) => (a.rentPrice / a.rentDuration) - (b.rentPrice / b.rentDuration))
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
    }
    else if (plotsContainer && plotsContainer.parentElement) {
        plotsContainer.parentElement.outerHTML = `<p>Loading plot data failed! Contact MoSS.</p>`;
    }
});
