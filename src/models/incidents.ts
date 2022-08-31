import { reactive } from "vue";
import { fetchData } from "@/api";
import { VISION_ZERO } from "@/api";
import type { Loadable } from "@/types/loadable";
export type ModeType = "mv" | "ped" | "bike";

export interface Incident {
  id: number;
  mode_type: ModeType;
  lat: number;
  long: number;
  year: number;
  month: number;
  hour: number;
  x: number;
  y: number;
}

export interface IncidentsStore {
  all: readonly Incident[];
}

const incidents = reactive<IncidentsStore & Loadable>({
  all: [],

  loading: false,
  loadError: null,
});

export function useIncidentsStore() {
  const load = async () => {
    incidents.loading = true;

    const response = await fetchData(VISION_ZERO);
    if (response.status === 200) {
      const data = (await response.json()) as { data: Incident[]; schema: any };
      incidents.all = Object.freeze(
        data.data.map((incident: Partial<Incident>) => {
          incident.lat = +incident.lat!;
          incident.long = +incident.long!;
          incident.id = incident.year! * 100 + incident.month!;
          return incident as Incident;
        })
      );
    }

    incidents.loading = false;
  };

  return {
    incidents,
    load,
  };
}
