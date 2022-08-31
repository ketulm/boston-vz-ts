<script setup lang="ts">
import { ref, watch, computed } from "vue";
import { useDensityMap } from "@/hooks/heatmap";
import { useMapLayersStore } from "@/models/map-layers";
import { useIncidentsStore } from "@/models/incidents";
import { useBvzStore } from "@/models/bvz";
import { useSummariesStore } from "@/models/summary";

// map store
const heatmap = ref();
const height = ref(800);
const width = ref(900);
const rightClip = ref(155);

// refs
const mapvisRef = ref<HTMLDivElement>();
const mapRef = ref<SVGElement>();
const heatmapRef = ref<HTMLCanvasElement>();
const selectionRef = ref<SVGElement>();

const { summary } = useSummariesStore();
const { layers } = useMapLayersStore();
const { bvz } = useBvzStore();

const incidents = computed(() => {
  return summary.nested[bvz.modeType ?? "*"]?.incidents ?? [];
});

watch(
  () => layers.neighborhoods,
  () => {
    heatmap.value = useDensityMap({
      height: height.value,
      width: width.value,

      mapvisRef: mapvisRef.value!,
      mapRef: mapRef.value!,
      heatmapRef: heatmapRef.value!,
      selectionRef: selectionRef.value!,
    });
    heatmap.value.initMap(layers.neighborhoods);
    heatmap.value.computeCoordinates(incidents.value);
    heatmap.value.updateHeatmap(incidents.value);
  }
);

watch(
  () => bvz.modeType,
  () => {
    heatmap.value.updateHeatmap(incidents.value);
  }
);

watch(
  () => bvz.selected,
  () => {
    heatmap.value.updateSelectionSvg(bvz.selected.incidents ?? []);
  }
);

const selectedIncidents = computed(() => {
  return heatmap.value && heatmap.value.map.hoverIncidents.length;
});
</script>

<template>
  <div class="geoheatmap" ref="mapvisRef">
    <div class="readout" v-if="selectedIncidents > 0">
      {{ selectedIncidents }} incidents
    </div>
    <svg
      :viewBox="`0 0 ${width - rightClip} ${height}`"
      class="map"
      ref="mapRef"
      :height="height"
      :width="width - rightClip"
    ></svg>
    <canvas
      class="heatmap"
      ref="heatmapRef"
      :height="height"
      :width="width - rightClip"
    ></canvas>
    <svg
      class="selection"
      ref="selectionRef"
      :height="height"
      :width="width - rightClip"
    ></svg>
  </div>
</template>

<style scoped lang="scss">
.geoheatmap {
  position: relative;

  .map {
    flex-direction: column;
    justify-content: center;
    align-items: center;
  }

  .heatmap,
  .selection,
  .hover {
    position: absolute;
    left: 0;
    z-index: 100;
  }

  .selection {
    z-index: 110;
  }

  .hover {
    z-index: 109;
  }

  .readout {
    position: absolute;
    left: 20px;
    top: 40px;
    z-index: 200;
    font-weight: 100;
  }
}
</style>
