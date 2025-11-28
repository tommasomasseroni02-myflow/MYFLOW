import { supabase } from './auth.js';

function withCoords(city) {
  const cityCoordinates = {
    Milano: { lat: 45.4642, lng: 9.19 },
    Roma: { lat: 41.9028, lng: 12.4964 },
    Torino: { lat: 45.0703, lng: 7.6869 },
    Napoli: { lat: 40.8518, lng: 14.2681 },
    Bologna: { lat: 44.4949, lng: 11.3426 }
  };
  return city ? cityCoordinates[city] ?? null : null;
}

function safeClient() {
  if (!supabase) throw new Error('Supabase non configurato');
  return supabase;
}

export async function fetchProviders() {
  const client = safeClient();
  const { data, error } = await client.from('providers').select('*');
  if (error) {
    console.error('Errore nel caricamento dei provider', error);
    return [];
  }
  return data || [];
}

export async function upsertProviderProfile(profile, userId) {
  const client = safeClient();
  const coords = withCoords(profile.city);
  const payload = {
    user_id: userId ?? null,
    email: profile.email,
    first_name: profile.firstName,
    last_name: profile.lastName,
    stage_name: profile.stageName,
    role: profile.role,
    rating: profile.rating,
    city: profile.city,
    address: profile.address,
    portfolio: profile.portfolio,
    contact: profile.contact,
    photo: profile.photo,
    latitude: coords?.lat ?? null,
    longitude: coords?.lng ?? null
  };
  const { error } = await client.from('providers').upsert(payload, { onConflict: 'email' });
  if (error) throw error;
  return payload;
}

export async function upsertArtistProfile(profile, userId) {
  const client = safeClient();
  const coords = withCoords(profile.city);
  const payload = {
    user_id: userId ?? null,
    email: profile.contact,
    first_name: profile.firstName,
    last_name: profile.lastName,
    stage_name: profile.stageName,
    service: profile.service,
    city: profile.city,
    latitude: coords?.lat ?? null,
    longitude: coords?.lng ?? null
  };
  const { error } = await client.from('artists').upsert(payload, { onConflict: 'email' });
  if (error) throw error;
  return payload;
}
