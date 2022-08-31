import { reactive } from "vue";
import { fetchData } from "@/api";
import {
  BOUNDARY,
  NEIGHBORHOODS,
  POLICE_DISTRICTS,
  POLICE_STATIONS,
} from "@/api";
import type { GeoJSON } from "geojson";
import type { Loadable } from "@/types/loadable";

export interface MapLayersStore {
  boundary: GeoJSON;
  neighborhoods: GeoJSON;
  stations: GeoJSON;
  districts: GeoJSON;
}

const layers = reactive<Partial<MapLayersStore> & Loadable>({
  boundary: null,
  neighborhoods: null,
  stations: null,
  districts: null,

  loading: false,
  loadError: null,
});

async function loadLayer(resource: string, field: keyof MapLayersStore) {
  const response = await fetchData(resource);
  if (response.status === 200) {
    const data = (await response.json()) as GeoJSON;
    layers[field] = Object.freeze(data as GeoJSON);
  }
}

async function loadAll() {
  layers.loading = true;
  await Promise.all([
    loadLayer(BOUNDARY, "boundary"),
    loadLayer(NEIGHBORHOODS, "neighborhoods"),
    loadLayer(POLICE_STATIONS, "stations"),
    loadLayer(POLICE_DISTRICTS, "districts"),
  ]);
  layers.loading = false;
}

export function useMapLayersStore() {
  return {
    layers,
    loadAll,
  };
}
