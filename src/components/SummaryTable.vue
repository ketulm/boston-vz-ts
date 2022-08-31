<script setup lang="ts">
import { computed } from "vue";
import { HOURS, MONTHS } from "@/config/constants";
import { scaleColor } from "./utils";
import { useSummariesStore } from "@/models/summary";
import { useBvzStore } from "@/models/bvz";
import * as d3 from "d3";
import Barchart from "./Barchart.vue";

const { bvz } = useBvzStore();
const { summary } = useSummariesStore();

const nested = computed(() => {
  return summary.nested[bvz.modeType];
});

const totalSelected = computed(() => {
  return bvz.selected.incidents?.length;
});

// Chart related configs
const { margin, cellHeight, cellWidth, barHeight } = bvz.config;
const height = computed(() => cellHeight * HOURS.length);
const width = computed(() => summary.years.length * MONTHS.length * cellWidth);
const chartHeight = computed(() => height.value + margin.top + margin.bottom);
const chartWidth = computed(() => width.value + margin.left + margin.right);
const yearColumnCenter = (12 * cellWidth) / 2;

const sizeScale = computed(() => {
  return d3
    .scaleSqrt()
    .domain([0, summary.stats.hour.max])
    .range([0, (cellWidth - 1) * 0.5]);
});

const legendTicks = computed(() => {
  const ticks = d3
    .scaleLinear()
    .domain([0, summary.stats.hour.max])
    .nice()
    .ticks(5);

  if (ticks[0] < 5) ticks[0] = summary.stats.hour.min;

  return ticks;
});

// Compute css class
const getMonthClass = (year: any, month: any) => {
  month = typeof month === "object" ? +month.key : month + 1;
  const monthClass = [`year-${year.key}-${month}`];

  if (
    bvz.selected.type === "month" &&
    bvz.selected.month == month &&
    bvz.selected.year == year.key
  ) {
    monthClass.push("selected");
  }
  return monthClass;
};

const getHourClass = (year: any, month: any, hour: any) => {
  const hourClass = [`hour-${year.key}-${month.key}-${hour.key}`];

  if (
    (bvz.selected.type === "single" &&
      bvz.selected.year == year.key &&
      bvz.selected.month == month.key &&
      bvz.selected.hour == hour.key) ||
    (bvz.selected.type === "hour" && bvz.selected.hour == hour.key)
  ) {
    hourClass.push("selected");
  }
  return hourClass;
};

const getHourLabelClass = (hour: any) => {
  const hourClass = [`hour-${hour}`];

  if (bvz.selected.type === "hour" && bvz.selected.hour == hour) {
    hourClass.push("selected");
  }
  return hourClass;
};

// Selection handling
const handleSelectHour = (hourNumber: number) => {
  const incidents = nested.value.summary
    .map((year) => {
      return year.values
        .map((month: any) => {
          return month.values
            .filter((hour: any) => hour.key == hourNumber)
            .map((hour: any) => hour.values)
            .flat();
        })
        .flat();
    })
    .flat();

  bvz.selected = {
    hour: hourNumber,
    incidents: incidents,
    type: "hour",
  };
};

const handleSelectMonth = (year: any, monthNumber: number) => {
  const month = year.values[monthNumber];
  const incidents = month.values.map((item: any) => item.values).flat();

  bvz.selected = {
    year: year.key,
    month: month.key,
    incidents: incidents,
    type: "month",
  };
};

const handleSelectSingle = (year: any, month: any, hour: any) => {
  bvz.selected = {
    year: year.key,
    month: month.key,
    hour: hour.key,
    incidents: hour.values,
    type: "single",
  };
};
</script>

<template>
  <div>
    <div class="column">
      <div class="row">
        <svg class="tablevis" :height="chartHeight" :width="chartWidth">
          <g
            class="chart"
            :transform="`translate(${margin.left},${margin.top})`"
          >
            <g
              class="year"
              v-for="(year, i) in nested.summary"
              :key="year.key"
              :transform="`translate(${i * 12 * cellWidth},0)`"
              :class="`year-${year.key}`"
            >
              <text
                class="year-label label"
                :transform="`translate(${yearColumnCenter},-38)`"
                :style="{
                  'text-align': 'center',
                  'font-weight': 100,
                  'font-size': '16px',
                  'text-anchor': 'middle',
                  fill: '#aaa',
                }"
                alignment-baseline="middle"
              >
                {{ year.key }}
                <title>{{ year.total }} incidents in year {{ year.key }}</title>
              </text>
              <rect
                class="column-sep"
                :width="0.25"
                :height="height + 20"
                :transform="`translate(${yearColumnCenter * 2}, -20)`"
                fill="#aaa"
                :opacity="0.8"
              ></rect>

              <g
                class="month"
                v-for="(monthName, i) in MONTHS"
                :key="`${year}-${monthName}`"
                :transform="`translate(${i * cellWidth},0)`"
                :class="getMonthClass(year, i)"
              >
                <text
                  class="month-label label"
                  :transform="`translate(${cellWidth / 2},-10)`"
                  :style="{
                    'text-align': 'center',
                    'font-weight': 100,
                    'font-size': '11px',
                    'text-anchor': 'middle',
                    fill: '#aaa',
                  }"
                  alignment-baseline="middle"
                  @click="handleSelectMonth(year, i)"
                >
                  {{ i + 1 }}
                </text>
              </g>

              <g
                class="month-axis"
                v-for="month in year.values"
                :key="month.key"
                :transform="`translate(${(+month.key - 1) * cellWidth},0)`"
                :class="getMonthClass(year, month)"
              >
                <circle
                  class="hour"
                  v-for="(hour, h) in month.values"
                  :class="getHourClass(year, month, hour)"
                  :key="hour.key"
                  :cx="cellWidth / 2"
                  :cy="hour.key * cellHeight + cellHeight / 2"
                  :r="sizeScale(hour.values.length)"
                  :fill="
                    scaleColor(
                      Math.max(0.3, hour.values.length / summary.stats.hour.max)
                    )
                  "
                  :opacity="0.6"
                  stroke="none"
                  @click="handleSelectSingle(year, month, hour)"
                >
                  <title>
                    {{ hour.values.length }} incidents at {{ HOURS[h] }} in
                    {{ MONTHS[+month.key] }} {{ year.key }}
                  </title>
                </circle>
              </g>
            </g>
          </g>
          <g
            class="hour-labels labels"
            :transform="`translate(0,${margin.top})`"
          >
            <text
              v-for="(hour, i) in HOURS"
              class="hour-label label"
              :class="getHourLabelClass(i)"
              :key="hour"
              :height="cellHeight"
              :width="cellWidth"
              :transform="`translate(${margin.left - 6},${
                cellHeight * (i + 1) - cellHeight / 2.0
              })`"
              :style="{
                'text-anchor': 'end',
                'font-weight': 100,
                'font-size': '12px',
                fill: '#aaa',
              }"
              alignment-baseline="middle"
              @click="handleSelectHour(i)"
            >
              {{ hour }}
            </text>
          </g>
        </svg>

        <barchart
          :vertical="true"
          :margin="margin"
          :chartData="nested.hourly"
          :barWidth="barHeight"
          :barHeight="cellHeight"
          :chartHeight="chartHeight"
          :chartWidth="chartWidth"
          :selected="bvz.selected"
        />

        <svg
          class="legend"
          :height="chartHeight"
          :width="bvz.config.legendWidth + bvz.config.legendMargin.left"
        >
          <g
            :transform="`translate(${bvz.config.legendMargin.left},${
              margin.top + cellHeight * 1.25
            })`"
          >
            <text
              v-for="(text, i) in ['# of', 'incidents']"
              :key="i"
              :style="{
                'font-weight': 100,
                'font-size': '11px',
                fill: '#aaa',
              }"
              text-anchor="left"
              alignment-baseline="middle"
              :x="bvz.config.legendMargin.left"
              :y="cellHeight * i"
            >
              {{ text }}
            </text>

            <g class="legend" :transform="`translate(0,${cellHeight * 2.25})`">
              <g class="legend-item" v-for="(d, i) in legendTicks" :key="d">
                <circle
                  class="legend-dot"
                  :cx="10"
                  :cy="cellHeight * i"
                  :r="sizeScale(d)"
                  :fill="scaleColor(Math.max(0.3, d / summary.stats.hour.max))"
                  :opacity="0.6"
                ></circle>
                <text
                  class="legend-label"
                  :style="{
                    'font-weight': 100,
                    'font-size': '11px',
                    fill: '#aaa',
                  }"
                  :x="10 + cellWidth"
                  :y="cellHeight * i"
                  text-anchor="left"
                  alignment-baseline="middle"
                  :opacity="0.6"
                >
                  {{ d }}
                </text>
              </g>
            </g>
          </g>
        </svg>
      </div>
      <barchart
        :vertical="false"
        :margin="margin"
        :chartData="nested.monthly"
        :barWidth="cellHeight"
        :barHeight="barHeight"
        :chartHeight="chartHeight"
        :chartWidth="chartWidth"
        :selected="bvz.selected"
      />

      <div :style="{ 'max-width': `${chartWidth}px` }">
        <div class="selection">
          <span v-show="totalSelected">
            {{ totalSelected }} incidents selected
          </span>
        </div>

        <slot> </slot>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
$highlight-color: #288be4;

.column {
  display: flex;
  flex-direction: column;
}
.row {
  display: flex;
  flex-direction: row;
}

.hour-label,
.month-label {
  cursor: pointer;

  &:hover {
    fill: $highlight-color;
  }
}

.hour {
  cursor: pointer;
  &:hover {
    stroke: $highlight-color;
    stroke-width: 1.75;
    opacity: 1;
  }
}

.month,
.hour,
.month-axis {
  &.selected {
    text {
      fill: $highlight-color !important;
    }
    .hour,
    &.hour {
      stroke: $highlight-color !important;
      stroke-width: 1.75;
      opacity: 1;
    }
  }
}

.month-label {
  &:hover {
    opacity: 0.75;
  }
}

.hour-label {
  &.selected {
    fill: $highlight-color !important;
  }
  &:hover {
    opacity: 0.75;
  }
}

.selection {
  padding: 1rem;
  font-size: 14px;
  text-align: right;
  opacity: 0.6;
  height: 4rem;
}
</style>
