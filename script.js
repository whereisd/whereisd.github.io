
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

var markerIcon = L.icon({
    iconUrl: './hikingd.png',
    iconSize: [38, 63],
    iconAnchor: [22, 94],
    popupAnchor: [-3, -76]
});

const marker = L.marker([0, 0], { icon: markerIcon }).addTo(map);
// marker.setStyle({ fillColor: 'orange', color: 'green' });
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
