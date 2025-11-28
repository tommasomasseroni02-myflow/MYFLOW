import { fetchProviders, upsertArtistProfile, upsertProviderProfile } from './api.js';
import { getSession, onAuthChange, requireAuth, signOutUser } from './auth.js';

const cityCoordinates = {
  Milano: { lat: 45.4642, lng: 9.19 },
  Roma: { lat: 41.9028, lng: 12.4964 },
  Torino: { lat: 45.0703, lng: 7.6869 },
  Napoli: { lat: 40.8518, lng: 14.2681 },
  Bologna: { lat: 44.4949, lng: 11.3426 }
};

let artistProfile = null;
let providers = [];
let session = null;

const mapEl = document.getElementById('map');
const mapSidebar = document.getElementById('mapSidebar');
const listView = document.getElementById('listView');
const mapView = document.getElementById('mapView');
const mapToggle = document.getElementById('mapToggle');
const listToggle = document.getElementById('listToggle');
const filterRole = document.getElementById('filterRole');
const sortBy = document.getElementById('sortBy');

const artistBtn = document.getElementById('artistBtn');
const providerBtn = document.getElementById('providerBtn');
const artistForm = document.getElementById('artistForm');
const providerForm = document.getElementById('providerForm');

const sessionStatus = document.getElementById('sessionStatus');
const artistStatus = document.getElementById('artistStatus');
const providerStatus = document.getElementById('providerStatus');
const logoutBtn = document.getElementById('logoutBtn');

artistBtn?.addEventListener('click', () => scrollToSection('artistPanel'));
providerBtn?.addEventListener('click', () => scrollToSection('providerPanel'));

function scrollToSection(id) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

artistForm?.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!artistForm) return;
  const data = new FormData(artistForm);
  const city = data.get('city');
  const profile = {
    firstName: data.get('firstName'),
    lastName: data.get('lastName'),
    stageName: data.get('stageName'),
    contact: data.get('contact'),
    city,
    service: data.get('service'),
    coords: cityCoordinates[city] ?? null
  };

  try {
    setStatus(artistStatus, 'Apro il login Auth0 di Netlify...');
    session = await requireAuth('signup');
    updateSessionUI();
    await upsertArtistProfile(profile, session?.user?.id);
    artistProfile = profile;
    setStatus(artistStatus, 'Profilo artista salvato e sessione attiva.');
    render();
    artistForm.reset();
    scrollToSection('listView');
  } catch (error) {
    setStatus(artistStatus, `Errore: ${error.message}`);
  }
});

providerForm?.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!providerForm) return;
  const data = new FormData(providerForm);
  const city = data.get('city');
  const profile = {
    firstName: data.get('firstName'),
    lastName: data.get('lastName'),
    stageName: data.get('stageName'),
    email: data.get('email'),
    role: data.get('role'),
    rating: Number(data.get('rating')) || 0,
    city,
    address: data.get('address'),
    portfolio: data.get('portfolio'),
    contact: data.get('contact'),
    photo: data.get('photo'),
    coords: cityCoordinates[city] ?? null
  };

  try {
    setStatus(providerStatus, 'Accedi con Auth0 di Netlify per pubblicare...');
    session = await requireAuth('signup');
    updateSessionUI();
    await upsertProviderProfile(profile, session?.user?.id);
    setStatus(providerStatus, 'Profilo pubblicato con autenticazione completata.');
    providerForm.reset();
    await loadProviders();
    render();
  } catch (error) {
    setStatus(providerStatus, `Errore: ${error.message}`);
  }
});

filterRole?.addEventListener('change', render);
sortBy?.addEventListener('change', render);
mapToggle?.addEventListener('click', () => switchView(true));
listToggle?.addEventListener('click', () => switchView(false));

logoutBtn?.addEventListener('click', async () => {
  try {
    await signOutUser();
    session = null;
    updateSessionUI();
    setStatus(artistStatus, '');
    setStatus(providerStatus, '');
  } catch (error) {
    setStatus(sessionStatus, `Errore nel logout: ${error.message}`);
  }
});

function switchView(showMap) {
  if (!mapView || !listView || !mapToggle || !listToggle) return;
  mapView.style.display = showMap ? 'grid' : 'none';
  listView.style.display = showMap ? 'none' : 'grid';
  mapToggle.classList.toggle('pill--active', showMap);
  listToggle.classList.toggle('pill--active', !showMap);
}

function getDistanceKm(coordsA, coordsB) {
  if (!coordsA || !coordsB) return null;
  const R = 6371;
  const dLat = deg2rad(coordsB.lat - coordsA.lat);
  const dLng = deg2rad(coordsB.lng - coordsA.lng);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(deg2rad(coordsA.lat)) * Math.cos(deg2rad(coordsB.lat)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return +(R * c).toFixed(1);
}

function deg2rad(deg) {
  return deg * (Math.PI / 180);
}

function render() {
  if (!filterRole || !sortBy) return;
  const role = filterRole.value;
  const order = sortBy.value;

  const filtered = providers
    .filter((pro) => (role ? pro.role === role : true))
    .map((pro) => ({
      ...pro,
      rating: pro.rating ?? 0,
      distance: artistProfile?.coords ? getDistanceKm(artistProfile.coords, pro.coords) : null
    }));

  const sorted = filtered.sort((a, b) => {
    if (order === 'distance') {
      if (a.distance === null) return 1;
      if (b.distance === null) return -1;
      return a.distance - b.distance;
    }
    return (b.rating ?? 0) - (a.rating ?? 0);
  });

  renderList(sorted);
  renderMap(sorted);
}

function renderList(items) {
  if (!listView) return;
  listView.innerHTML = '';
  items.forEach((item) => {
    const card = document.createElement('article');
    card.className = 'card';
    const ratingValue = Number(item.rating ?? 0).toFixed(1);
    card.innerHTML = `
      <div class="card__header">
        <div class="avatar">${initials(item.stageName)}</div>
        <div>
          <h3>${item.stageName}</h3>
          <p class="meta">${item.role} • ${item.city}${item.address ? ' – ' + item.address : ''}</p>
        </div>
      </div>
      <div class="rating">⭐ ${ratingValue}</div>
      ${item.distance ? `<p class="meta">${item.distance} km da te</p>` : ''}
      ${item.portfolio ? `<a href="${item.portfolio}" target="_blank" rel="noreferrer">Portfolio</a>` : ''}
      <p class="meta">Contatto: ${item.contact || item.email || 'n/d'}</p>
    `;
    listView.appendChild(card);
  });
}

function renderMap(items) {
  if (!mapEl || !mapSidebar) return;
  mapEl.querySelectorAll('.pin').forEach((el) => el.remove());
  mapSidebar.innerHTML = '';

  if (artistProfile?.coords) {
    dropPin(artistProfile.coords, 'pin--artist');
  }

  items.forEach((item) => {
    if (!item.coords) return;
    dropPin(item.coords, 'pin--provider');
    const div = document.createElement('div');
    div.className = 'map__item';
    const ratingValue = Number(item.rating ?? 0).toFixed(1);
    div.innerHTML = `
      <div>
        <strong>${item.stageName}</strong><br />
        <span class="meta">${item.role} • ${item.city}</span>
      </div>
      <span class="badge">⭐ ${ratingValue}</span>
    `;
    mapSidebar.appendChild(div);
  });
}

function dropPin(coords, className) {
  const pin = document.createElement('div');
  pin.className = `pin ${className}`;
  const { x, y } = project(coords);
  pin.style.left = `${x}%`;
  pin.style.top = `${y}%`;
  mapEl?.appendChild(pin);
}

function project({ lat, lng }) {
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
    .split(' ')
    .map((part) => part[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();
}

function setStatus(element, message) {
  if (!element) return;
  element.textContent = message;
}

function updateSessionUI() {
  if (session?.user) {
    setStatus(sessionStatus, `Loggato con Auth0 come ${session.user.email || session.user.id}`);
  } else {
    setStatus(sessionStatus, 'Non sei autenticato. Accedi con Auth0 tramite il widget Netlify.');
  }
}

async function loadProviders() {
  try {
    const result = await fetchProviders();
    providers = result.map((pro) => ({
      ...pro,
      coords:
        pro.latitude && pro.longitude
          ? { lat: Number(pro.latitude), lng: Number(pro.longitude) }
          : cityCoordinates[pro.city] ?? null
    }));
  } catch (error) {
    setStatus(providerStatus, `Errore nel caricamento: ${error.message}`);
  }
}

async function bootstrap() {
  session = await getSession();
  updateSessionUI();
  await loadProviders();
  render();
  switchView(false);
}

onAuthChange((_event, newSession) => {
  session = newSession;
  updateSessionUI();
});

bootstrap();
