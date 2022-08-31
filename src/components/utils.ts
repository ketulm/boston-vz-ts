import * as d3 from "d3";

export function scaleColor(p: number) {
  return d3.color(d3.interpolateGreys(1 - p)).hex();
}
