var firstLoad = true;
const map = L.map("map");
map.setView([0, 0], 15);

// L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
//   attribution: "© OpenStreetMap contributors",
// }).addTo(map);

// *******another tile provider*******
// L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
//   attribution: "© OpenStreetMap & CartoDB contributors",
// }).addTo(map);

L.tileLayer('https://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', {
    maxZoom: 20,
    subdomains: ['mt0', 'mt1', 'mt2', 'mt3']
}).addTo(map);

const info = L.control({ position: 'topright' });

info.onAdd = function (map) {
    this._div = L.DomUtil.create('div', 'info-box');
    this._div.innerHTML = '<h2>Last known location</h2><h4 id="last-date-time"></h4>';
    return this._div;
};

info.addTo(map);

const markerIcon = L.icon({
    iconUrl: './hikingd.png',
    iconSize: [100, 100],
    iconAnchor: [50, 50]
});

const marker = L.marker([0, 0], { icon: markerIcon }).addTo(map);

async function loadJsonData() {
    try {
        const response = await fetch('data.js', { cache: 'no-store' });
        const data = await response.json();

        //only update marker and view if first load or location has changed...
        const currLatLng = marker.getLatLng();
        if ((firstLoad) || (currLatLng.lat != data.lat) || (currLatLng.lng != data.lng)) {
            firstLoad = false;
            marker.setLatLng([data.lat, data.lng]);
            map.setView([data.lat, data.lng], map.getZoom(), {
                animate: true,
                pan: {
                    duration: 2
                }
            });
        }

        // Need to remove the "()" around "(UTC)"...
        const utcDateString = data.dt.replace(/\(|\)/g, "");
        const utcDate = new Date(utcDateString);
        const localTimeString = utcDate.toLocaleString();
        document.getElementById("last-date-time").innerText = "(" + localTimeString + ")";
    } catch (error) {
        console.error('Error fetching JSON:', error);
    }
}

//initial data load
document.addEventListener('DOMContentLoaded', loadJsonData);

//auto-refresh every 5 mins
setInterval(() => {loadJsonData()}, 5*60*1000);
