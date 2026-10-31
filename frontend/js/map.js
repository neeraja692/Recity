/**
 * Leaflet Interactive Map Module for ReCity
 */

let mapInstance = null;
let markersLayer = null;
let pickerMarker = null;

const MapModule = {
  init(containerId = "leafletMap", center = [12.9716, 77.5946], zoom = 13) {
    if (mapInstance) {
      mapInstance.remove();
    }

    const container = document.getElementById(containerId);
    if (!container) return;

    mapInstance = L.map(containerId).setView(center, zoom);

    // OpenStreetMap CartoDB Positron / Standard tiles
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 19
    }).addTo(mapInstance);

    markersLayer = L.layerGroup().addTo(mapInstance);

    // Click handler for picker mode (if registering a space)
    mapInstance.on('click', (e) => {
      const latInput = document.getElementById("regLatitude");
      const lngInput = document.getElementById("regLongitude");
      if (latInput && lngInput) {
        latInput.value = e.latlng.lat.toFixed(5);
        lngInput.value = e.latlng.lng.toFixed(5);
        MapModule.setPickerPin(e.latlng.lat, e.latlng.lng);
        App.showToast(`Selected map coordinates: ${e.latlng.lat.toFixed(4)}, ${e.latlng.lng.toFixed(4)}`);
      }
    });

    // Invalidate map size after animation
    setTimeout(() => {
      if (mapInstance) mapInstance.invalidateSize();
    }, 300);
  },

  renderSpaces(spaces) {
    if (!markersLayer) return;
    markersLayer.clearLayers();

    if (!spaces || spaces.length === 0) return;

    const bounds = [];

    spaces.forEach((s) => {
      if (!s.latitude || !s.longitude) return;

      const latLng = [s.latitude, s.longitude];
      bounds.push(latLng);

      const color = MapModule.getColorForNeed(s.primary_community_need);
      const iconHtml = `
        <div style="
          background: ${color};
          width: 32px;
          height: 32px;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          border: 2.5px solid #ffffff;
          box-shadow: 0 4px 10px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <div style="
            width: 10px;
            height: 10px;
            background: #ffffff;
            border-radius: 50%;
            transform: rotate(45deg);
          "></div>
        </div>
      `;

      const customIcon = L.divIcon({
        className: 'custom-map-pin',
        html: iconHtml,
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -28]
      });

      const marker = L.marker(latLng, { icon: customIcon });

      const popupHtml = `
        <div class="map-card-popup">
          <img src="${s.image_url}" alt="${s.title}" onerror="this.src='assets/before_plot.jpg'">
          <h4>${s.title}</h4>
          <p>${s.area_sqm} m² · ${s.ward}</p>
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
            <span style="font-size:10.5px; font-weight:700; background:#e6f4ea; color:#0f4435; padding:3px 8px; border-radius:999px;">
              ${s.primary_community_need}
            </span>
            <span style="font-size:11px; font-weight:800; color:#e11d48;">
              Score: ${s.priority_score}
            </span>
          </div>
          <button class="btn-primary" style="width:100%; font-size:11.5px; padding:6px 10px; justify-content:center;" onclick="App.openSpaceDetail(${s.id})">
            Revive & Explore Proposals →
          </button>
        </div>
      `;

      marker.bindPopup(popupHtml);
      markersLayer.addLayer(marker);
    });

    if (bounds.length > 0 && mapInstance) {
      mapInstance.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
    }
  },

  getColorForNeed(need) {
    if (need.includes("Green") || need.includes("Cooling")) return "#10b981";
    if (need.includes("Play") || need.includes("Children")) return "#f43f5e";
    if (need.includes("Learning") || need.includes("Skill")) return "#8b5cf6";
    if (need.includes("Rainwater")) return "#0ea5e9";
    if (need.includes("Seating") || need.includes("Seniors")) return "#f59e0b";
    return "#0f4435";
  },

  setPickerPin(lat, lng) {
    if (!mapInstance) return;
    if (pickerMarker) {
      mapInstance.removeLayer(pickerMarker);
    }
    pickerMarker = L.marker([lat, lng], {
      icon: L.divIcon({
        className: 'picker-pin',
        html: '<div style="background:#0f4435; width:20px; height:20px; border-radius:50%; border:3px solid #10b981; box-shadow:0 0 10px rgba(0,0,0,0.4);"></div>',
        iconSize: [20, 20],
        iconAnchor: [10, 10]
      })
    }).addTo(mapInstance);
  }
};
