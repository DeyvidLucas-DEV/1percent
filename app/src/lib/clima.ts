// Clima via Open-Meteo (gratuito, sem chave). Localização via expo-location
// (reverse geocoding pega cidade). Cache em SQLite com TTL de 30 min.
//
// IMPORTANTE: expo-location é importado DINAMICAMENTE pra não crashar o app
// se o módulo nativo não estiver disponível (build sem prebuild, Expo Go, etc).

import { getDb } from '../db/schema';
import { Ionicons } from '@expo/vector-icons';

export type Clima = {
  temperatura: number;
  codigo: number;
  cidade: string;
  capturadoEm: string;
};

const TTL_MIN = 30;

export type IconeIonicons = keyof typeof Ionicons.glyphMap;

export function iconePorCodigo(codigo: number): IconeIonicons {
  if (codigo === 0) return 'sunny-outline';
  if (codigo >= 1 && codigo <= 3) return 'partly-sunny-outline';
  if (codigo === 45 || codigo === 48) return 'cloud-outline';
  if (codigo >= 51 && codigo <= 67) return 'rainy-outline';
  if (codigo >= 71 && codigo <= 77) return 'snow-outline';
  if (codigo >= 80 && codigo <= 82) return 'rainy-outline';
  if (codigo >= 95 && codigo <= 99) return 'thunderstorm-outline';
  return 'partly-sunny-outline';
}

async function carregarCache(): Promise<Clima | null> {
  try {
    const db = await getDb();
    const row = await db.getFirstAsync<{
      lat: number;
      lon: number;
      temperatura: number;
      codigo: number;
      cidade: string;
      capturado_em: string;
    }>(`SELECT * FROM clima_cache WHERE id = 1`);
    if (!row) return null;
    return {
      temperatura: row.temperatura,
      codigo: row.codigo,
      cidade: row.cidade,
      capturadoEm: row.capturado_em,
    };
  } catch {
    return null;
  }
}

async function salvarCache(
  lat: number,
  lon: number,
  c: Clima
): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO clima_cache (id, lat, lon, temperatura, codigo, cidade, capturado_em)
     VALUES (1, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       lat = excluded.lat,
       lon = excluded.lon,
       temperatura = excluded.temperatura,
       codigo = excluded.codigo,
       cidade = excluded.cidade,
       capturado_em = excluded.capturado_em`,
    [lat, lon, c.temperatura, c.codigo, c.cidade, c.capturadoEm]
  );
}

function expirou(capturadoEm: string): boolean {
  const dif = Date.now() - new Date(capturadoEm).getTime();
  return dif > TTL_MIN * 60 * 1000;
}

async function buscarOpenMeteo(lat: number, lon: number): Promise<{ temperatura: number; codigo: number } | null> {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code&timezone=auto`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = (await res.json()) as {
      current?: { temperature_2m?: number; weather_code?: number };
    };
    const t = data.current?.temperature_2m;
    const c = data.current?.weather_code;
    if (typeof t !== 'number' || typeof c !== 'number') return null;
    return { temperatura: Math.round(t), codigo: c };
  } catch {
    return null;
  }
}

async function getLocation(): Promise<{ latitude: number; longitude: number } | null> {
  try {
    const Location = await import('expo-location');
    const perm = await Location.requestForegroundPermissionsAsync();
    if (perm.status !== 'granted') return null;
    const pos = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    return { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
  } catch {
    return null;
  }
}

async function getCidade(latitude: number, longitude: number): Promise<string> {
  try {
    const Location = await import('expo-location');
    const geo = await Location.reverseGeocodeAsync({ latitude, longitude });
    return geo[0]?.city ?? geo[0]?.subregion ?? geo[0]?.region ?? 'Aqui';
  } catch {
    return 'Aqui';
  }
}

export async function obterClima(): Promise<Clima | null> {
  try {
    const cache = await carregarCache();
    if (cache && !expirou(cache.capturadoEm)) return cache;

    const coords = await getLocation();
    if (!coords) return cache;

    const { latitude, longitude } = coords;

    const [clima, cidade] = await Promise.all([
      buscarOpenMeteo(latitude, longitude),
      getCidade(latitude, longitude),
    ]);

    if (!clima) return cache;

    const novo: Clima = {
      temperatura: clima.temperatura,
      codigo: clima.codigo,
      cidade,
      capturadoEm: new Date().toISOString(),
    };
    await salvarCache(latitude, longitude, novo).catch(() => {});
    return novo;
  } catch {
    return null;
  }
}
