
const map = L.map("map");
map.setView([0, 0], 15);

// L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
//   attribution: "© OpenStreetMap contributors",
// }).addTo(map);

// *******another tile provider*******
// L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
//   attribution: "© OpenStreetMap & CartoDB contributors",
// }).addTo(map);

L.tileLayer('http://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',{
        maxZoom: 20,
        subdomains:['mt0','mt1','mt2','mt3']
}).addTo(map);

const info = L.control({position: 'topright'});

info.onAdd = function (map) {
    this._div = L.DomUtil.create('div', 'info-box');
    this._div.innerHTML = '<h3>Last known location</h3><h2 id="last-date-time"></h2>';
    return this._div;
};

info.addTo(map);

const markerIcon = L.icon({
    iconUrl: './hikingd.png',
    iconSize: [45, 72],
    iconAnchor: [10, 44],
    popupAnchor: [-3, -76]
});

const marker = L.marker([0, 0], { icon: markerIcon }).addTo(map);
marker.bindTooltip(
  `d is here!`
);

async function loadJsonData() {
  try {
    const response = await fetch('data.js', {cache: 'no-store'});
    const data = await response.json();
    marker.setLatLng([data.lat, data.lng]);
    map.setView([data.lat, data.lng], 15);
    } catch (error) {
        console.error('Error fetching JSON:', error);
    }
}


document.addEventListener('DOMContentLoaded', loadJsonData);
