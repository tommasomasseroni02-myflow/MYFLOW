const cityCoordinates = {
  Milano: { lat: 45.4642, lng: 9.19 },
  Roma: { lat: 41.9028, lng: 12.4964 },
  Torino: { lat: 45.0703, lng: 7.6869 },
  Napoli: { lat: 40.8518, lng: 14.2681 },
  Bologna: { lat: 44.4949, lng: 11.3426 }
};

let artistProfile = null;

const providers = [
  {
    id: 1,
    firstName: "Giulia",
    lastName: "Neri",
    stageName: "Giu Producer",
    role: "Producer",
    rating: 4.9,
    city: "Milano",
    address: "Isola",
    portfolio: "https://soundcloud.com/giuprod",
    contact: "@giuprod",
    photo: "",
    coords: { lat: 45.486, lng: 9.188 }
  },
  {
    id: 2,
    firstName: "Marco",
    lastName: "Ferraro",
    stageName: "Ferraro Studio",
    role: "Studio",
    rating: 4.7,
    city: "Roma",
    address: "Pigneto",
    portfolio: "https://ferrarostudio.example",
    contact: "+39 333 1234567",
    photo: "",
    coords: { lat: 41.889, lng: 12.527 }
  },
  {
    id: 3,
    firstName: "Sara",
    lastName: "Monti",
    stageName: "Lens&Light",
    role: "Fotografo",
    rating: 4.8,
    city: "Torino",
    address: "Quadrilatero",
    portfolio: "https://lenslight.example",
    contact: "@lenslight",
    photo: "",
    coords: { lat: 45.074, lng: 7.69 }
  },
  {
    id: 4,
    firstName: "Davide",
    lastName: "Russo",
    stageName: "Glow Styling",
    role: "Stylist",
    rating: 4.6,
    city: "Napoli",
    address: "Vomero",
    portfolio: "https://glowstyle.example",
    contact: "@glowstyling",
    photo: "",
    coords: { lat: 40.845, lng: 14.239 }
  },
  {
    id: 5,
    firstName: "Elena",
    lastName: "Berti",
    stageName: "Frame Studio",
    role: "Video",
    rating: 4.95,
    city: "Bologna",
    address: "Navile",
    portfolio: "https://framestudio.example",
    contact: "@framestudio",
    photo: "",
    coords: { lat: 44.507, lng: 11.343 }
  }
];

const mapEl = document.getElementById("map");
const mapSidebar = document.getElementById("mapSidebar");
const listView = document.getElementById("listView");
const mapView = document.getElementById("mapView");
const mapToggle = document.getElementById("mapToggle");
const listToggle = document.getElementById("listToggle");
const filterRole = document.getElementById("filterRole");
const sortBy = document.getElementById("sortBy");

const artistBtn = document.getElementById("artistBtn");
const providerBtn = document.getElementById("providerBtn");
const artistForm = document.getElementById("artistForm");
const providerForm = document.getElementById("providerForm");

artistBtn?.addEventListener("click", () => scrollToSection("artistPanel"));
providerBtn?.addEventListener("click", () => scrollToSection("providerPanel"));

function scrollToSection(id) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

artistForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  const data = new FormData(artistForm);
  const city = data.get("city");
  artistProfile = {
    firstName: data.get("firstName"),
    lastName: data.get("lastName"),
    stageName: data.get("stageName"),
    contact: data.get("contact"),
    city,
    service: data.get("service"),
    coords: cityCoordinates[city] ?? null
  };
  render();
  artistForm.reset();
  scrollToSection("listView");
});

providerForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  const data = new FormData(providerForm);
  providers.push({
    id: providers.length + 1,
    firstName: data.get("firstName"),
    lastName: data.get("lastName"),
    stageName: data.get("stageName"),
    role: data.get("role"),
    rating: Number(data.get("rating")) || 0,
    city: data.get("city"),
    address: data.get("address"),
    portfolio: data.get("portfolio"),
    contact: data.get("contact"),
    photo: data.get("photo"),
    coords: cityCoordinates[data.get("city")] ?? null
  });
  providerForm.reset();
  render();
});

filterRole?.addEventListener("change", render);
sortBy?.addEventListener("change", render);
mapToggle?.addEventListener("click", () => switchView(true));
listToggle?.addEventListener("click", () => switchView(false));

function switchView(showMap) {
  mapView.style.display = showMap ? "grid" : "none";
  listView.style.display = showMap ? "none" : "grid";
  mapToggle.classList.toggle("pill--active", showMap);
  listToggle.classList.toggle("pill--active", !showMap);
}

function getDistanceKm(coordsA, coordsB) {
  if (!coordsA || !coordsB) return null;
  const R = 6371;
  const dLat = deg2rad(coordsB.lat - coordsA.lat);
  const dLng = deg2rad(coordsB.lng - coordsA.lng);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(deg2rad(coordsA.lat)) * Math.cos(deg2rad(coordsB.lat)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return +(R * c).toFixed(1);
}

function deg2rad(deg) {
  return deg * (Math.PI / 180);
}

function render() {
  const role = filterRole.value;
  const order = sortBy.value;

  const filtered = providers
    .filter((pro) => (role ? pro.role === role : true))
    .map((pro) => ({ ...pro, distance: artistProfile?.coords ? getDistanceKm(artistProfile.coords, pro.coords) : null }));

  const sorted = filtered.sort((a, b) => {
    if (order === "distance") {
      if (a.distance === null) return 1;
      if (b.distance === null) return -1;
      return a.distance - b.distance;
    }
    return b.rating - a.rating;
  });

  renderList(sorted);
  renderMap(sorted);
}

function renderList(items) {
  listView.innerHTML = "";
  items.forEach((item) => {
    const card = document.createElement("article");
    card.className = "card";
    card.innerHTML = `
      <div class="card__header">
        <div class="avatar">${initials(item.stageName)}</div>
        <div>
          <h3>${item.stageName}</h3>
          <p class="meta">${item.role} • ${item.city}${item.address ? " – " + item.address : ""}</p>
        </div>
      </div>
      <div class="rating">⭐ ${item.rating.toFixed(1)}</div>
      ${item.distance ? `<p class="meta">${item.distance} km da te</p>` : ""}
      ${item.portfolio ? `<a href="${item.portfolio}" target="_blank" rel="noreferrer">Portfolio</a>` : ""}
      <p class="meta">Contatto: ${item.contact || "n/d"}</p>
    `;
    listView.appendChild(card);
  });
}

function renderMap(items) {
  mapEl.querySelectorAll(".pin").forEach((el) => el.remove());
  mapSidebar.innerHTML = "";

  if (artistProfile?.coords) {
    dropPin(artistProfile.coords, "pin--artist");
  }

  items.forEach((item) => {
    if (!item.coords) return;
    dropPin(item.coords, "pin--provider");
    const div = document.createElement("div");
    div.className = "map__item";
    div.innerHTML = `
      <div>
        <strong>${item.stageName}</strong><br />
        <span class="meta">${item.role} • ${item.city}</span>
      </div>
      <span class="badge">⭐ ${item.rating.toFixed(1)}</span>
    `;
    mapSidebar.appendChild(div);
  });
}

function dropPin(coords, className) {
  const pin = document.createElement("div");
  pin.className = `pin ${className}`;
  const { x, y } = project(coords);
  pin.style.left = `${x}%`;
  pin.style.top = `${y}%`;
  mapEl.appendChild(pin);
}

function project({ lat, lng }) {
  // Simple projection for demo purposes only
  const minLat = 40.5;
  const maxLat = 46.5;
  const minLng = 7;
  const maxLng = 14.5;
  const x = ((lng - minLng) / (maxLng - minLng)) * 100;
  const y = (1 - (lat - minLat) / (maxLat - minLat)) * 100;
  return { x: clamp(x, 2, 98), y: clamp(y, 2, 98) };
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function initials(name) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();
}

// Start
render();
switchView(false);
