import { reactive } from "vue";

export interface Options {
  month: number;
  year: number;

  type: string;
}

const options = reactive<Options>({
  month: 1,
  year: 2015,
  type: "*",
});

export function useSummariesStore() {
  return {
    options,
  };
}
