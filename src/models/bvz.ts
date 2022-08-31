import { reactive } from "vue";
import type { ModeType } from "./incidents";

interface BVZConfig {
  modeType: ModeType | "*";

  selected: {
    year?: number | string;
    month?: number | string;
    hour?: number | string;
    incidents?: string[] | number[];
    type?: "month" | "hour" | "single";
  };

  config: {
    cellWidth: number;
    cellHeight: number;
    barHeight: number;

    margin: {
      top: number;
      bottom: number;
      left: number;
      right: number;
    };

    legendWidth: number;
    legendMargin: {
      top: number;
      left: number;
    };
  };
}

const bvz = reactive<BVZConfig>({
  modeType: "*",
  selected: {},
  config: {
    cellWidth: 14,
    cellHeight: 14,
    barHeight: 25,

    margin: {
      bottom: 2,
      top: 50,
      left: 50,
      right: 5,
    },

    legendWidth: 60,
    legendMargin: {
      top: 60,
      left: 8,
    },
  },
});

export function useBvzStore() {
  return {
    bvz,
  };
}
