<script setup lang="ts">
import { defineProps, computed } from "vue";
import { scaleColor } from "./utils";
import * as d3 from "d3";

// Props, TODO: update types
type PropsType = {
  chartData: any;
  barWidth: number;
  barHeight: number;
  chartHeight: number;
  chartWidth: number;
  selected: object;
  vertical: boolean;
  margin: object;
};

const props = withDefaults(defineProps<PropsType>(), {
  barWidth: 0,
  barHeight: 0,
  chartHeight: 0,
  vertical: false,
});

// Chart configuration
const height = computed(() =>
  props.vertical ? props.chartHeight : props.barHeight
);
const width = computed(() =>
  props.vertical ? props.barWidth : props.chartWidth
);

// Chart data
const totals = computed(() => props.chartData.map((d) => d.total) ?? []);
const max = computed(() => d3.max(totals.value));

// Plotting helpers
const barColor = scaleColor(0.2);
const getRectAttributes = (d: any, i: number) => {
  const attrs: Record<string, any> = {};
  if (!props.vertical) {
    attrs.x = i * props.barWidth;
    attrs.y = 0;
    attrs.width = props.barWidth;
    attrs.height = props.barHeight * (d.total / max.value);
    attrs.fill = barColor;
  } else {
    attrs.x = 0;
    attrs.y = i * props.barHeight;
    attrs.width = props.barWidth * (d.total / max.value);
    attrs.height = props.barHeight;
    attrs.fill = barColor;
  }
  return attrs;
};

const tickColor = scaleColor(0.6);
const getRectTickAttributes = (d: any, i: number) => {
  const attrs: Record<string, any> = {};
  if (!props.vertical) {
    attrs.x = i * props.barWidth;
    attrs.y = props.barHeight * (d.total / max.value) - 1.5;
    attrs.width = props.barWidth;
    attrs.height = 1.5;
    attrs.fill = tickColor;
  } else {
    attrs.x = props.barWidth * (d.total / max.value) - 1.5;
    attrs.y = i * props.barHeight;
    attrs.width = 1.5;
    attrs.height = props.barHeight;
    attrs.fill = tickColor;
  }
  return attrs;
};

const offset = computed(() => {
  if (!props.vertical) {
    return `translate(${props.margin.left}, 0)`;
  }
  return `translate(0, ${props.margin.top})`;
});

const getBarClass = (d) => {
  const barClass = [d.class];
  if (props.selected.type === "hour") {
    if (d.hour == props.selected.hour) {
      barClass.push("selected");
    }
  }
  if (props.selected.type === "month") {
    if (d.year == props.selected.year && d.month == props.selected.month) {
      barClass.push("selected");
    }
  }

  return barClass;
};
</script>

<template>
  <svg class="barchart" ref="barchartRef" :height="height" :width="width">
    <g :transform="offset">
      <g class="bars-group">
        <rect
          v-for="(d, i) in chartData"
          class="bars"
          :class="d.class"
          :key="`${d.key}-${i}`"
          :opacity="0.6"
          storke="none"
          stroke-width="0"
          v-bind="getRectAttributes(d, i)"
        >
          <title>{{ d.total }} incidents, {{ d.key }}</title>
        </rect>
      </g>
      <g class="ticks-group">
        <rect
          v-for="(d, i) in chartData"
          class="ticks"
          :key="`${d.key}-${i}`"
          :class="getBarClass(d)"
          storke="none"
          stroke-width="0"
          v-bind="getRectTickAttributes(d, i)"
        ></rect>
      </g>
    </g>
  </svg>
</template>

<style scoped lang="scss">
.bars:hover {
  opacity: 1;
}
.selected {
  fill: #288be4;
}
</style>
