var firstLoad = true;
const map = L.map("map");
map.setView([0, 0], 17);

// L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
//   attribution: "© OpenStreetMap contributors",
// }).addTo(map);

// *******another tile provider*******
// L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
//   attribution: "© OpenStreetMap & CartoDB contributors",
// }).addTo(map);

//*******Google Satellite *******/
// L.tileLayer('https://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', {
//     maxZoom: 20,
//     subdomains: ['mt0', 'mt1', 'mt2', 'mt3']
// }).addTo(map);

//*******USGS Topo *******/
// var USGS_USTopo = L.tileLayer('https://basemap.nationalmap.gov/arcgis/rest/services/USGSTopo/MapServer/tile/{z}/{y}/{x}', {
// 	maxZoom: 20,
// 	attribution: 'Tiles courtesy of the <a href="https://usgs.gov/">U.S. Geological Survey</a>'
// });

// *****
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
	maxZoom: 19,
	attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
});

const info = L.control({ position: 'topright' });

info.onAdd = function (map) {
    this._div = L.DomUtil.create('div', 'info-box');
    this._div.innerHTML = '<h2>Last known location</h2><h4 id="last-date-time" style="margin-bottom: 2px"></h4><div>Checking for update in <span id="next-update-countdown">5:00</span></div>';
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

// Set the initial countdown time in seconds (e.g., 5 minutes = 300 seconds)
let totalSeconds = 300; 

// Get the HTML element where the timer will be displayed
const timerDisplay = document.getElementById('next-update-countdown'); 

function updateCountdown() {
    // Calculate minutes and seconds
    let minutes = Math.floor(totalSeconds / 60);
    let seconds = totalSeconds % 60;

    // Format minutes and seconds to always have two digits
    minutes = minutes < 10 ? '0' + minutes : minutes;
    seconds = seconds < 10 ? '0' + seconds : seconds;

    // Display the formatted time
    timerDisplay.textContent = `${minutes}:${seconds}`;

    // Decrease the total seconds
    totalSeconds--;

    // Stop the timer when it reaches zero
    if (totalSeconds < 0) {
        clearInterval(countdownInterval); // Stop the interval
        timerDisplay.textContent = "";
        // Reset the countdown for the next cycle
        totalSeconds = 300; 
        loadJsonData(); // Fetch new data
        // Restart the countdown
        countdownInterval = setInterval(updateCountdown, 1000);
    }
}

// Call updateCountdown initially to display the starting time
updateCountdown(); 

// Set up the interval to call updateCountdown every second
let countdownInterval = setInterval(updateCountdown, 1000); 

//initial data load
document.addEventListener('DOMContentLoaded', loadJsonData);