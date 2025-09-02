

const MAPBOX_ACCESS_TOKEN = "pk.eyJ1Ijoid2hlcmVpc2QiLCJhIjoiY21mMnQybm9rMDRmbTJrcTljcWg2NzViZCJ9.suwjyVDj4jKzzCW-DHwDbA"
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
// }).addTo(map);

// *****OpenStreetMap Standard *****
// L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
// 	maxZoom: 19,
// 	attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
// }).addTo(map);

// *****Mapbox Standard *****
  'https://api.mapbox.com/styles/v1/mapbox/streets-v12/tiles/256/{z}/{x}/{y}?access_token=YOUR_MAPBOX_ACCESS_TOKEN',
L.tileLayer('https://api.mapbox.com/styles/v1/mapbox/streets-v12/tiles/256/{z}/{x}/{y}?access_token=' + MAPBOX_ACCESS_TOKEN, {
	maxZoom: 19,
	attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> © <a href="https://www.mapbox.com/about/maps/">Mapbox</a> <strong><a href="https://labs.mapbox.com/contribute/" target="_blank">Improve this map</a></strong>'
}).addTo(map);

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

const dMarker = L.marker([0, 0], { icon: markerIcon }).addTo(map);

async function loadJsonData() {
    try {
        const response = await fetch('data.js', { cache: 'no-store' });
        const allData = await response.json();
        
        //get the most recent data point...
        const currentData = allData[allData.length - 1];

        //update the date/time display...
        const utcDate = new Date(currentData.dt);
        const localTimeString = utcDate.toLocaleString();
        document.getElementById("last-date-time").innerText = "(" + localTimeString + ")";

        //only update markers and view if first load or location has changed...
        if ((dMarker.getLatLng().lat != currentData.lat) || (dMarker.getLatLng().lng != currentData.lng)) {
            //clear markers and polylines...
            map.eachLayer(function (layer) {
                if ((layer instanceof L.Marker) && (layer !== dMarker)) {
                    map.removeLayer(layer);
                }
                if (layer instanceof L.Polyline) {
                    map.removeLayer(layer);
                }
            });

            //Add dMarker
            dMarker.setLatLng([currentData.lat, currentData.lng]);
            dMarker.bindTooltip(`<b>${localTimeString}</b><br>Elevation: ${Math.round(currentData.el)} ft`);
            map.setView([currentData.lat, currentData.lng], map.getZoom(), {
                animate: true,
                pan: {
                    duration: 2
                }
            });

            //Add the previous locations as markers...
            for (let i = 0; i < allData.length - 1; i++) {
                const dataPoint = allData[i];
                let ptMarker = L.marker([dataPoint.lat, dataPoint.lng], { icon: L.divIcon({html: `<h1>${(i + 1)}</h1>`}) }).addTo(map);
                const utcDate = new Date(dataPoint.dt);
                const localTimeString = utcDate.toLocaleString();
                ptMarker.bindTooltip(`<b>${localTimeString}</b><br>Elevation: ${Math.round(dataPoint.el)} ft`);
            }

            drawRoute(allData);
        }
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

function drawRoute(allData) {
    if (allData.length < 2) return; // Need at least two points to draw a route

    const allPoints = allData.slice().map(dataPoint => [dataPoint.lat, dataPoint.lng]);

    // Mapbox Directions API limits the number of waypoints in a single request to 25, so chunk the requests...
    chunkedPoints = chunkArray(allPoints, 25);

    for (let i = 0; i < chunkedPoints.length; i++) {
        const pointStrings = chunkedPoints.map(point => point.join(','));
        const url = `https://api.mapbox.com/directions/v5/mapbox/walking/${pointStrings.join(';')}?geometries=geojson&access_token=${MAPBOX_ACCESS_TOKEN}`;

        fetch(url)
        .then(r => r.json())
        .then(data => {
            if (!data.routes || !data.routes.length) return;

            const route = data.routes[0].geometry;
            const coords = route.coordinates.map(c => [c[1], c[0]]);
            const line = L.polyline(coords, { color: '#f60', weight: 4 }).addTo(map);
            //map.fitBounds(line.getBounds());
        });    
    }
}

function chunkArray(arr, chunkSize) {
  const result = [];
  for (let i = 0; i < arr.length; i += chunkSize) {
    result.push(arr.slice(i, i + chunkSize));
  }
  return result;
}

// Call updateCountdown initially to display the starting time
updateCountdown(); 

// Set up the interval to call updateCountdown every second
let countdownInterval = setInterval(updateCountdown, 1000); 

//initial data load
document.addEventListener('DOMContentLoaded', loadJsonData);