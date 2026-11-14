const FEED_URL = 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_week.geojson';// Initialize the map
const map = L.map('map', { worldCopyJump: true }).setView([20, 0], 2);// Add OpenStreetMap tile layer
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; OpenStreetMap contributors' }).addTo(map);
const layer = L.layerGroup().addTo(map);
let currentEvents = [];


// Utility functions
function markerSize(magnitude) { return Math.max(10, Math.min(34, magnitude * 5)); }
function markerClass(magnitude) { return magnitude >= 6 ? 'large' : magnitude >= 5 ? 'medium' : ''; }
function formatTime(timestamp) { return new Intl.DateTimeFormat('en-US', { month:'short', day:'numeric', hour:'numeric', minute:'2-digit' }).format(new Date(timestamp)); }
function shortPlace(place) { return place ? place.replace(' of ', ' · ') : 'Location unavailable'; }

function renderEvents(events) {
  currentEvents = events.sort((a,b) => b.properties.mag - a.properties.mag);// Sort events by magnitude descending Each earthquake’s
  // coordinates are used to place a marker on the Leaflet mapn
  layer.clearLayers();
  const list = document.querySelector('#eventList'); list.innerHTML = '';
  currentEvents.slice(0, 12).forEach((event, index) => {
    // Extract coordinates and magnitude
    const [longitude, latitude] = event.geometry.coordinates;
    const magnitude = event.properties.mag || 0;
    const size = markerSize(magnitude);
    // Create a custom div icon for the marker
    const icon = L.divIcon({ className:'custom-icon', html:`<div class="pulse-marker ${markerClass(magnitude)}" style="width:${size}px;height:${size}px"></div>`, iconSize:[size,size], iconAnchor:[size/2,size/2] });
    const marker = L.marker([latitude, longitude], { icon }).addTo(layer);
    marker.bindPopup(`<strong>${magnitude.toFixed(1)} magnitude</strong><br>${event.properties.place}<br><small>${formatTime(event.properties.time)}</small>`);
    const button = document.createElement('button'); button.className = 'event-item'; button.innerHTML = `<span class="magnitude">${magnitude.toFixed(1)}</span><span class="event-place">${shortPlace(event.properties.place)}<span class="event-time">${formatTime(event.properties.time)}</span></span>`;
    button.addEventListener('click', () => { map.flyTo([latitude, longitude], Math.max(3, map.getZoom()), { duration:1.2 }); marker.openPopup(); }); list.appendChild(button);
    if (index === 0) marker.bindTooltip('Strongest event', { direction:'top' });
  });
  const strongest = currentEvents[0];
  // Update summary statistics
  document.querySelector('#eventCount').textContent = events.length;
  document.querySelector('#strongestMagnitude').textContent = strongest ? strongest.properties.mag.toFixed(1) : '—';
  document.querySelector('#strongestLocation').textContent = strongest ? shortPlace(strongest.properties.place) : 'No events found';
  document.querySelector('#lastUpdated').textContent = new Intl.DateTimeFormat('en-US', { hour:'numeric', minute:'2-digit' }).format(new Date());
}
// Load earthquake data from the USGS feed
async function loadEarthquakes() {
  const loading = document.querySelector('#mapLoading'); loading.classList.remove('hidden');
  // Fetch the earthquake data from the USGS feed
  //WHERE THE API IS CALLED AND THE DATA IS RENDERED ON THE MAP AND LIST
  try { const response = await fetch(FEED_URL); if (!response.ok) throw new Error('USGS feed unavailable'); const data = await response.json(); renderEvents(data.features.filter(e => e.geometry && e.properties.mag !== null)); }
  catch (error) { document.querySelector('#eventList').innerHTML = '<p class="empty-state">The live feed could not be loaded. Please try again.</p>'; console.error(error); }
  finally { loading.classList.add('hidden'); }
}
document.querySelector('#refreshButton').addEventListener('click', loadEarthquakes);
loadEarthquakes();
