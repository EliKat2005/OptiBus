// Coordenadas iniciales (Centro de Ibarra)
const IBARRA_LAT = 0.3517;
const IBARRA_LON = -78.1223;

// Cambia 'localhost' por la IP de tu PC en la red local si pruebas desde el celular
//const API_URL = 'http://localhost:8000';
//const WS_URL = 'ws://localhost:8000/ws';
const API_URL = 'http://192.168.1.100:8000';
const WS_URL = 'ws://192.168.1.100:8000/ws';
// 1. Inicializar mapa de Leaflet
const map = L.map('map').setView([IBARRA_LAT, IBARRA_LON], 14);

// 2. Cargar capa base (OpenStreetMap)
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap - OptiBus MVP'
}).addTo(map);

// Objeto para llevar el control de los iconos de los buses en el mapa
const busMarkers = {};

// 3. Función HTTP (REST) para cargar y dibujar las rutas desde PostGIS
async function loadRoutes() {
    try {
        const response = await fetch(`${API_URL}/api/routes`);
        const geojsonData = await response.json();
        
        const routeLayer = L.geoJSON(geojsonData, {
            style: function (feature) {
                return { color: "#2563eb", weight: 5, opacity: 0.8 };
            }
        }).addTo(map);
        
        // Auto-centrar el mapa basándose en la caja delimitadora de la ruta trazada
        if (geojsonData.features.length > 0) {
            map.fitBounds(routeLayer.getBounds());
        }
    } catch (error) {
        console.error("Error al cargar rutas estáticas:", error);
    }
}

// 4. Función en Tiempo Real (WebSockets) para mover los marcadores
function connectWebSocket() {
    const ws = new WebSocket(WS_URL);

    ws.onopen = () => {
        console.log("🟢 Conexión WebSocket establecida con el Cerebro OptiBus.");
    };

    ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        
        if (data.type === "bus_positions") {
            data.buses.forEach(bus => {
                // Si el autobús ya está en el mapa, animar a la nueva posición
                if (busMarkers[bus.id]) {
                    busMarkers[bus.id].setLatLng([bus.lat, bus.lon]);
                } else {
                    // Si es nuevo, creamos el marcador en el mapa
                    const marker = L.marker([bus.lat, bus.lon]).addTo(map);
                    marker.bindPopup(`<b>🚌 Unidad:</b> ${bus.id}`);
                    busMarkers[bus.id] = marker;
                }
            });
        }
    };

    ws.onclose = () => {
        console.log("🔴 WebSocket desconectado. Intentando reconectar en 3 segundos...");
        setTimeout(connectWebSocket, 3000);
    };
}

// Inicializar ciclo de vida de la aplicación frontend
document.addEventListener('DOMContentLoaded', () => {
    loadRoutes();
    connectWebSocket();
});