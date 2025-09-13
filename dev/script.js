

const MAPBOX_ACCESS_TOKEN = "pk.eyJ1Ijoid2hlcmVpc2QiLCJhIjoiY21mMzkyeDF5MDlzMjJxb2hkOWQyMnQ5MSJ9.N_RtJqjsy8JiA8eE1HExjw"
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
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
	maxZoom: 19,
	attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

// *****Mapbox Standard *****
//   'https://api.mapbox.com/styles/v1/mapbox/streets-v12/tiles/256/{z}/{x}/{y}?access_token=YOUR_MAPBOX_ACCESS_TOKEN',
// L.tileLayer('https://api.mapbox.com/styles/v1/mapbox/streets-v12/tiles/256/{z}/{x}/{y}?access_token=' + MAPBOX_ACCESS_TOKEN, {
// 	maxZoom: 19,
// 	attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> © <a href="https://www.mapbox.com/about/maps/">Mapbox</a> <strong><a href="https://labs.mapbox.com/contribute/" target="_blank">Improve this map</a></strong>'
// }).addTo(map);

const info = L.control({ position: 'topright' });

info.onAdd = function (map) {
    this._div = L.DomUtil.create('div', 'info-box');
    this._div.innerHTML = '<h2>Last known location</h2><h4 id="last-date-time" style="margin-bottom: 2px"></h4><div id="status"></div>';
    return this._div;
};

info.addTo(map);

const markerIcon = L.icon({
    iconUrl: './hikingd.png',
    iconSize: [100, 100],
    iconAnchor: [50, 50]
});

const dMarker = L.marker([0, 0], { icon: markerIcon }).addTo(map);
var countdownInterval;

async function loadJsonData() {
    try {
        const response = await fetch('data.js', { cache: 'no-store', next: { revalidate: 0 } });
        const data = await response.json();
        if (data) {
            if(data.hikeEnded) {
                clearInterval(countdownInterval);
                document.getElementById("status").textContent = "Hike has ended.";
            } else {
                // Call updateCountdown initially to display the starting time
                updateCountdown(); 
                // Set up the interval to call updateCountdown every second
                countdownInterval = setInterval(updateCountdown, 1000); 
            }
            
            updateUI(data.locations);
        }
    } catch (error) {
        console.error('Error fetching JSON:', error);
    }
}

function updateUI(locations) {
    if (!locations || locations.length === 0) return;

    //get the most recent data point...
    const currentData = locations[locations.length - 1];

    updateInfoBox(currentData);

    //only update map if first load or location has changed...
    if ((dMarker.getLatLng().lat != currentData.lat) || (dMarker.getLatLng().lng != currentData.lng)) {
        clearPreviousLocationMarkers();
        addDMarker(currentData);
        addPreviousLocationMarkers(locations);
        drawRoute(locations);

        map.setView([currentData.lat, currentData.lng], map.getZoom(), {
            animate: true,
            pan: {
                duration: 2
            }
        });
    }
}

function updateInfoBox(currentData) {
    document.getElementById("last-date-time").innerText = "(" + getFormattedDateTimeString(currentData.dt) + ")";
}

function getFormattedDateTimeString(utcDateString) {
    const utcDate = new Date(utcDateString);
    return utcDate.toLocaleString([], {
        year: "2-digit",
        month: "numeric",
        day: "numeric",
        hour: "numeric",
        minute: "numeric",
        timeZoneName: "short",
    });
}

function clearPreviousLocationMarkers() {
    map.eachLayer(function (layer) {
        if ((layer instanceof L.Marker) && (layer !== dMarker)) {
            map.removeLayer(layer);
        }
        if (layer instanceof L.Polyline) {
            map.removeLayer(layer);
        }
    });
}

function addDMarker(currentData) {
    const utcDate = new Date(currentData.dt);
    const localTimeString = utcDate.toLocaleString();
    dMarker.setLatLng([currentData.lat, currentData.lng]);
    dMarker.bindTooltip(getToolTip(currentData));
}

function addPreviousLocationMarkers(locations) {
    for (let i = 0; i < locations.length - 1; i++) {
        const dataPoint = locations[i];
        let ptMarker = L.marker([dataPoint.lat, dataPoint.lng], { icon: L.divIcon({html: `<h1>${(i + 1)}</h1>`}) }).addTo(map);
        const utcDate = new Date(dataPoint.dt);
        const localTimeString = utcDate.toLocaleString();
        ptMarker.bindTooltip(getToolTip(dataPoint));
    }
}

function getToolTip(dataPoint) {
    return `<b>${getFormattedDateTimeString(dataPoint.dt)}</b>
        <br>
        Elevation: ${getFormattedElevation(dataPoint.el)}
        <br>
        Temperature: ${dataPoint.tmpF ? dataPoint.tmpF + " °F" : "No data" }`;
}


function getFormattedElevation(elevationFeet) {
    const elevationMeters = convertFeetToMeters(elevationFeet);
    return `${Math.round(elevationFeet).toLocaleString()} ft (${Math.round(elevationMeters).toLocaleString()} m)`;
}

function convertFeetToMeters(feet) {
    return feet * 0.3048;
}

function drawRoute(locations) {
    if (locations.length < 2) return; // Need at least two points to draw a route

    const allPoints = locations.slice().map(dataPoint => [dataPoint.lng, dataPoint.lat]);

    // Mapbox Directions API limits the number of waypoints in a single request to 25, so chunk the requests...
    const chunkedPoints = chunkArray(allPoints, 25);

    for (let i = 0; i < chunkedPoints.length; i++) {
        const pointsString = convert2DArrayToString(chunkedPoints[i]); 
        const url = `https://api.mapbox.com/directions/v5/mapbox/walking/${pointsString}?geometries=geojson&waypoints_per_route=true&access_token=${MAPBOX_ACCESS_TOKEN}`;

        fetch(url)
        .then(r => r.json())
        .then(data => {
            if (!data.routes || !data.routes.length) return;

            const route = data.routes[0].geometry;
            const coords = route.coordinates.map(c => [c[1], c[0]]);
            const line = L.polyline(coords, { color: '#f60', weight: 4 }).addTo(map);
        });    
    }
}

// Set the initial countdown time in seconds (e.g., 5 minutes = 300 seconds)
let totalSeconds = 300; 

function updateCountdown() {
    let statusDisplay = document.getElementById('status');
    // Calculate minutes and seconds
    let minutes = Math.floor(totalSeconds / 60);
    let seconds = totalSeconds % 60;

    // Format minutes and seconds to always have two digits
    minutes = minutes < 10 ? '0' + minutes : minutes;
    seconds = seconds < 10 ? '0' + seconds : seconds;

    // Display the formatted time
    statusDisplay.textContent = `Checking for update in ${minutes}:${seconds}`;

    // Decrease the total seconds
    totalSeconds--;

    // Stop the timer when it reaches zero
    if (totalSeconds < 0) {
        clearInterval(countdownInterval); // Stop the interval
        statusDisplay.textContent = "";
        // Reset the countdown for the next cycle
        totalSeconds = 300; 
        loadJsonData(); // Fetch new data
    }
}

function chunkArray(arr, chunkSize) {
  const result = [];
  for (let i = 0; i < arr.length; i += chunkSize) {
    result.push(arr.slice(i, i + chunkSize));
  }
  return result;
}

function convert2DArrayToString(array2D) {
  // Map each inner array to a string with comma-separated values
  const innerStrings = array2D.map(innerArray => innerArray.join(','));

  // Join the resulting strings with semicolons
  const finalString = innerStrings.join(';');

  return finalString;
}

//initial data load
document.addEventListener('DOMContentLoaded', loadJsonData);