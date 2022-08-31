import { reactive } from "vue";
import type { Incident, ModeType } from "./incidents";
import { nest } from "d3-collection";
import { HOURS, MONTHS } from "@/config/constants";

type IncidentSummary = {
  [s in ModeType]: number;
};

interface YearlySummary extends IncidentSummary {
  year: number;
  name: number;
  total: number;
}

interface Stats {
  min: number;
  max: number;
  totals: number;
}

interface AllStats {
  year: Stats;
  month: Stats;
  hour: Stats;
}

interface TotalStats {
  year?: string | number;
  month?: string | number;
  hour?: string | number;
  key: string;
  class: string;
  total: number;
}

interface SummaryStore {
  yearly: YearlySummary[];
  columns: ModeType[];
  titles: { [s in ModeType]: string };
  years: number[];
  nested: {
    [s in ModeType | "*"]: {
      incidents?: Incident[];
      summary?: any; // TODO: add nest type
      yearly?: TotalStats[];
      monthly?: TotalStats[];
      hourly?: TotalStats[];
    };
  };
  stats: AllStats;
}

const summary = reactive<SummaryStore>({
  yearly: [],
  years: [],
  columns: ["mv", "bike", "ped"],
  titles: { mv: "Motor Vehicles", bike: "Bikes", ped: "Pedestrians" },

  nested: {
    "*": {},
    mv: {},
    bike: {},
    ped: {},
  },

  stats: {
    year: {
      min: Infinity,
      max: -Infinity,
      totals: 0,
    },
    month: {
      min: Infinity,
      max: -Infinity,
      totals: 0,
    },
    hour: {
      min: Infinity,
      max: -Infinity,
      totals: 0,
    },
  },
});

export function useSummariesStore() {
  const summarize = async (incidents: readonly Incident[]) => {
    const years = new Set<number>();
    const yearly: Record<string, YearlySummary> = {};

    incidents.forEach((d: Incident) => {
      years.add(d.year);
      if (!yearly[d.year]) {
        yearly[d.year] = {
          year: d.year,
          name: d.year,
          total: 0,
          mv: 0,
          ped: 0,
          bike: 0,
        };
      }
      yearly[d.year][d.mode_type] = yearly[d.year][d.mode_type] + 1;
      yearly[d.year]["total"] = yearly[d.year]["total"] + 1;
    });

    summary.yearly = Object.values(yearly);
    summary.years = Array.from(years);
  };

  const summarizeNested = async (incidents: readonly Incident[]) => {
    _summarizeNestedHelper(incidents, "*");
    summary.columns.forEach((type) => _summarizeNestedHelper(incidents, type));
  };

  const _summarizeNestedHelper = async (
    incidents: readonly Incident[],
    type: ModeType | "*"
  ) => {
    const filtered = incidents.filter((d) => {
      return d.mode_type === type || type === "*";
    });

    const nested = nest()
      .key((d) => d.year)
      .key((d) => d.month)
      .sortKeys((a, b) => a - b)
      .key((d) => d.hour)
      .sortKeys((a, b) => a - b)
      .entries(filtered);

    const stats: AllStats = summary.stats;

    nested.forEach((year) => {
      let ytotal = 0;
      year.values.forEach((month) => {
        let mtotal = 0;
        month.values.forEach((hour) => {
          const htotal = hour.values.length;
          stats.hour.min = Math.min(htotal, stats.hour.min);
          stats.hour.max = Math.max(htotal, stats.hour.max);
          hour.total = htotal;
          mtotal = mtotal + htotal;
        });
        month.total = mtotal;
        ytotal = ytotal + mtotal;
        stats.month.min = Math.min(mtotal, stats.month.min);
        stats.month.max = Math.max(mtotal, stats.month.max);
      });
      year.total = ytotal;
      stats.year.min = Math.min(ytotal, stats.year.min);
      stats.year.max = Math.max(ytotal, stats.year.max);
    });

    // compute total by hours
    const totalByHour = HOURS.map((h, i) => ({
      key: h,
      hour: i,
      class: `hour-total hour-${i}`,
      total: 0,
    }));

    // compute total by month
    const totalByMonth: TotalStats[] = nested
      .map((year) => {
        return MONTHS.map((m, i) => {
          return {
            year: year.key,
            month: i + 1,
            key: `${m} ${year.key}`,
            class: `month-total month-${i + 1} year-${year.key}`,
            total: 0,
          };
        });
      })
      .flat();

    nested.map((year, y) => {
      year.values.map((month) => {
        month.values.forEach((hour) => {
          totalByHour[+hour.key].total += hour.total;
        });
        const mi = y * 12 + (+month.key - 1);
        totalByMonth[mi].total = month.total;
      });
    });

    // compute total by years
    const totalsByYear = nested.map((year) => ({
      year: year.key,
      key: `${year.key}`,
      class: `year-total year-${year.key}`,
      total: year.total,
    }));

    summary.nested[type].incidents = filtered;
    summary.nested[type].summary = nested;
    summary.nested[type].hourly = totalByHour;
    summary.nested[type].monthly = totalByMonth;
    summary.nested[type].yearly = totalsByYear;
  };

  return {
    summary,
    summarize,
    summarizeNested,
  };
}
