import * as d3 from "d3";
import simpleheat from "simpleheat";
import { reactive } from "vue";
import type { FeatureCollection, GeoJSON } from "geojson";
import type { Incident } from "@/models/incidents";

interface UseDensityMapOptions {
  height: number;
  width: number;

  // refs
  mapvisRef: HTMLDivElement;
  mapRef: SVGElement;
  heatmapRef: HTMLCanvasElement;
  selectionRef: SVGElement;
}

interface MapStore {
  projection: any;
  path: any;

  quadtree: any;
  heatmapData: any;

  hoverIncidents: any;
  totalHoverIncidents: any;
  filteredIncidents: any;
  hover: {
    x: number;
    y: number;
    r: number;
  };
}

// Heatmap model
const map = reactive<MapStore>({
  projection: undefined,
  path: undefined,

  quadtree: undefined,
  heatmapData: undefined,

  hoverIncidents: [],
  totalHoverIncidents: 0,
  filteredIncidents: [],

  hover: {
    x: 0,
    y: 0,
    r: 10,
  },
});

export function useDensityMap(options: UseDensityMapOptions) {
  // Initializes the map chart
  const initMap = (neighborhoods: GeoJSON) => {
    map.projection = d3
      .geoMercator()
      .fitWidth(options.width, neighborhoods)
      .fitHeight(options.height, neighborhoods);

    map.path = d3.geoPath(map.projection);

    const mapLayer = d3.select(options.mapRef);
    mapLayer
      .append("g")
      .selectAll(".boundary")
      .data((neighborhoods as FeatureCollection).features)
      .enter()
      .append("path")
      .attr("class", "boundary")
      .attr("d", map.path)
      .attr("stroke", "#fff")
      .attr("stroke-width", ".2")
      .attr("stroke-opacity", ".7")
      .style("fill", "#222")
      .attr("title", (d) => d.properties.Name);

    const hoverbox = mapLayer
      .append("rect")
      .attr("class", "hoverbox")
      .style("transform", "translate(0,0)")
      .style("height", 0)
      .style("width", 0)
      .style("stroke", "none")
      .style("fill", "#ccc")
      .attr("x", 0)
      .attr("y", 0)
      .attr("opacity", 0.05);

    d3.select(options.selectionRef)
      .on("mousemove", function (event) {
        hoverbox.attr("visibility", "visible");
        [map.hover.x, map.hover.y] = d3.pointer(event);
        updateHoverSelection();
        moveHoverbox();
      })
      .on("mouseout", function () {
        hoverbox.attr("visibility", "hidden");
      });
  };

  // Pre-computes projected coordinates
  const computeCoordinates = (incidents: Incident[]) => {
    incidents.forEach((d) => {
      [d.x, d.y] = map.projection([d.long, d.lat]);
    });
  };

  // Filter and transform data, recreate quadtree for hover interaction
  const processAndFilterData = (incidents: Incident[]) => {
    map.heatmapData = incidents.map((d) => [d.x, d.y, 1]);
    map.quadtree = d3
      .quadtree()
      .x((d) => d.x)
      .y((d) => d.y);
    map.quadtree.addAll(incidents);
  };

  // Draws the heat map
  const updateHeatmap = (incidents: Incident[]) => {
    processAndFilterData(incidents);
    const heat = simpleheat(options.heatmapRef);
    heat.data(map.heatmapData);
    heat.radius(1.5, 2);
    heat.gradient({
      1: d3.interpolateGreys(0.3),
      0.5: d3.interpolateGreys(0.5),
      0: d3.interpolateGreys(1),
    });
    heat.draw(0.05);
  };

  // Hover selection
  const updateHoverSelection = () => {
    const r = map.hover.r;
    const [x0, y0] = [map.hover.x - r, map.hover.y - r];
    const [x3, y3] = [map.hover.x, map.hover.y];
    const points = [];
    map.quadtree.visit((node, x1, y1, x2, y2) => {
      if (!node.length) {
        do {
          const { x, y } = node.data;
          if (x >= x0 && x < x3 && y >= y0 && y < y3) {
            points.push(node.data);
          }
        } while ((node = node.next));
      }
      return x1 >= x3 || y1 >= y3 || x2 < x0 || y2 < y0;
    });

    map.hoverIncidents = points;
  };

  const moveHoverbox = () => {
    const { x, y, r } = map.hover;
    const mapLayer = d3.select(options.mapRef);
    mapLayer
      .select(".hoverbox")
      .attr("class", "hoverbox")
      .style("transform", `translate(${x - r}px,${y - r}px)`)
      .style("height", r)
      .style("width", r)
      .style("stroke", "#fff")
      .style("storke-opacity", 1)
      .style("fill", "#288BE4") //#ccc
      .attr("opacity", 0.5);
  };

  const updateSelectionSvg = (selectedIncidents: Incident[]) => {
    const svg = d3.select(options.selectionRef);
    svg.selectAll("*").remove();

    if (selectedIncidents.length) {
      svg
        .selectAll(".selected-incident")
        .data(selectedIncidents)
        .enter()
        .append("circle")
        .attr("class", "selected-incident")
        .attr("cx", (d) => d.x)
        .attr("cy", (d) => d.y)
        .attr("r", 4)
        .attr("stroke", "#111")
        .attr("stroke-width", "1")
        .style("fill", "#288be4")
        .style("opacity", 1);
    }
  };

  return {
    map,
    initMap,
    computeCoordinates,
    processAndFilterData,
    updateHeatmap,
    updateHoverSelection,
    updateSelectionSvg,
  };
}
