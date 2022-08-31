const HOST_URL = window.location.href;

const BOUNDARY = `${HOST_URL}/data/City_of_Boston_Boundary.geojson`;
const NEIGHBORHOODS = `${HOST_URL}/data/Boston_Neighborhoods.geojson`;
const POLICE_STATIONS = `${HOST_URL}/data/Boston_Police_Stations.geojson`;
const POLICE_DISTRICTS = `${HOST_URL}/data/Police_Districts.geojson`;
const VISION_ZERO = `${HOST_URL}/data/vision_zero_ss.json`;

function fetchData(resource: string) {
  return fetch(resource, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });
}

export {
  BOUNDARY,
  NEIGHBORHOODS,
  POLICE_STATIONS,
  POLICE_DISTRICTS,
  VISION_ZERO,
  fetchData,
};
