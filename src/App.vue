<script setup lang="ts">
import GeoHeatmap from "./components/GeoHeatmap.vue";
import SummaryTable from "./components/SummaryTable.vue";

import { computed, onBeforeMount, ref } from "vue";
import { useMapLayersStore } from "@/models/map-layers";
import { useIncidentsStore, type ModeType } from "@/models/incidents";
import { useSummariesStore } from "@/models/summary";
import { useBvzStore } from "./models/bvz";

const { bvz } = useBvzStore();
const incidentsStore = useIncidentsStore();
const summaryStore = useSummariesStore();
const layersStore = useMapLayersStore();

const loading = ref(true);

onBeforeMount(async () => {
  await incidentsStore.load();
  await summaryStore.summarize(incidentsStore.incidents.all);
  await summaryStore.summarizeNested(incidentsStore.incidents.all);
  await layersStore.loadAll();

  loading.value = false;
});

const yearsTitle = computed(() => {
  const { years } = summaryStore.summary;
  if (years.length == 0) return "";
  const first = years[0];
  const last = years[years.length - 1];
  return `${first} to ${last}`;
});

const handleUpdateModeType = (type: "*" | ModeType) => {
  bvz.modeType = type;
  bvz.selected = {};
};
</script>

<template>
  <header class="header">
    <div class="title">Boston Traffic Incidents</div>
    <div class="subtitle">{{ yearsTitle }}</div>
    <div class="actions" v-show="!loading">
      <div class="buttons has-addons">
        <button
          class="button is-small"
          :class="bvz.modeType === '*' ? 'is-selected is-info' : ''"
          @click="handleUpdateModeType('*')"
        >
          All
        </button>
        <button
          class="button is-small"
          :class="bvz.modeType === 'mv' ? 'is-selected is-info' : ''"
          @click="handleUpdateModeType('mv')"
        >
          <span class="icon">
            <i class="mdi mdi-car"></i>
          </span>
          <span>Vehicle</span>
        </button>
        <button
          class="button is-small"
          :class="bvz.modeType === 'ped' ? 'is-selected is-info' : ''"
          @click="handleUpdateModeType('ped')"
        >
          <span class="icon">
            <i class="mdi mdi-walk"></i>
          </span>
          <span>Pedestrian</span>
        </button>
        <button
          class="button is-small"
          :class="bvz.modeType === 'bike' ? 'is-selected is-info' : ''"
          @click="handleUpdateModeType('bike')"
        >
          <span class="icon">
            <i class="mdi mdi-bike"></i>
          </span>
          <span>Bike</span>
        </button>
      </div>
    </div>
  </header>
  <section class="map" v-show="!loading && !incidentsStore.incidents.loading">
    <GeoHeatmap></GeoHeatmap>
  </section>

  <section class="vis" v-show="!loading && !incidentsStore.incidents.loading">
    <SummaryTable>
      <div class="summary">
        <div>
          <p>
            Vision Zero is a multi-national initiative that aims to eliminate
            serious or fatal traffic incidents by 2030. This visualization shows
            all the serious incidents that occurred in Boston, MA from 2015 to
            2019 using the data provided by
            <a
              href="https://data.boston.gov/dataset/vision-zero-crash-records"
              target="_blank"
              >data.boston.gov</a
            >.
          </p>
          <br />
          <p>
            This interactive visualization capability shows geographic and
            temporal hotspots where many of these incidents occur.
          </p>
          <br />
          <p>
            Using the incident type filter, places where serious incidents
            involving pedestrian or bicycle can be focused on. Using the
            calendar view, incidents that occur at certain hour, in certain
            month, or at certain hour across all years can be highlighted in the
            map view.
          </p>
          <br />
        </div>
      </div>
    </SummaryTable>
  </section>
  <footer
    class="afooter"
    v-show="!loading && !incidentsStore.incidents.loading"
  >
    Ketul Mavani
  </footer>
</template>

<style lang="scss">
#app {
  display: grid;
  grid-template-columns: 0.4fr 0.6fr;
  grid-template-rows: min-content 1fr min-content;
  grid-template-areas: "header header" "map vis" "footer footer";
  overflow: hidden;
  margin: 0 auto;
  max-width: 2100px;
  max-height: 100vh;
  gap: 1rem;

  .header {
    grid-area: header;
    display: flex;
    align-items: baseline;
    gap: 1rem;
    padding: 1rem;

    .actions {
      margin-left: auto;
    }
  }

  .map {
    grid-area: map;
    align-self: stretch;
    justify-self: stretch;
    transition: all 0.2s ease-in-out;
  }

  .vis {
    grid-area: vis;
    align-self: stretch;
    justify-self: stretch;
    align-items: flex-start;
    transition: all 0.2s ease-in-out;
  }

  .afooter {
    grid-area: footer;
    justify-self: flex-end;
    opacity: 0.1;
    font-size: 0.8rem;
    user-select: none;
  }

  .title {
    font-family: "Montserrat", "Arial", sans-serif;
    font-weight: 500;
    color: #fff;
    padding: 0;
    margin: 0;
  }

  .subtitle {
    padding: 0;
    margin: 0;
  }

  .summary {
    display: flex;
    margin-left: 2rem;
    opacity: 0.6;
    text-align: justify;

    a {
      text-decoration: none;
      opacity: 1;
      color: inherit;
      &:hover {
        opacity: 0.5;
      }
    }
  }

  .button:not(.is-selected) {
    background-color: transparent;
    border-color: transparent;
    color: #fff;
    border: 1px solid #fff3;
  }
}
</style>
