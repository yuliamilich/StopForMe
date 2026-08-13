import { createReadStream, mkdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { createInterface } from "node:readline";

const DEFAULT_OPTIONS = {
  input: "data/raw/gtfs",
  out: "data/line-117.js",
  route: "117",
  routeName: "Modi,Jerusalem,מודיעין,ירושלים",
  headsign: "Jerusalem,ירושלים",
  originName: "Modi,מודיעין",
  destinationName: "Hale'om,Jerusalem,Hanassi,ירושלים,הלאום",
  pickupName: "City Hall,עירייה",
  dropoffName: "Makabim-Re'ut Junction,מכבים,רעות",
};

const options = parseArgs(process.argv.slice(2));

function parseArgs(args) {
  const parsed = { ...DEFAULT_OPTIONS };

  for (let index = 0; index < args.length; index += 2) {
    const key = args[index];
    const value = args[index + 1];

    if (!key?.startsWith("--") || value === undefined) {
      throw new Error(`Expected --key value arguments. Received: ${args.join(" ")}`);
    }

    const optionName = key.slice(2);
    if (!(optionName in parsed)) {
      throw new Error(`Unknown option: ${key}`);
    }

    parsed[optionName] = value;
  }

  return parsed;
}

function parseCsvLine(line) {
  const values = [];
  let current = "";
  let quoted = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];

    if (char === '"' && quoted && next === '"') {
      current += '"';
      index += 1;
      continue;
    }

    if (char === '"') {
      quoted = !quoted;
      continue;
    }

    if (char === "," && !quoted) {
      values.push(current);
      current = "";
      continue;
    }

    current += char;
  }

  values.push(current);
  return values;
}

async function readCsv(filePath, onRow) {
  const stream = createReadStream(filePath, { encoding: "utf8" });
  const lines = createInterface({ input: stream, crlfDelay: Infinity });
  let headers;

  for await (const line of lines) {
    if (!headers) {
      headers = parseCsvLine(line).map((header) => header.replace(/^\uFEFF/, "").trim());
      continue;
    }

    if (!line.trim()) continue;

    const values = parseCsvLine(line);
    const row = {};
    headers.forEach((header, index) => {
      row[header] = (values[index] ?? "").trim();
    });
    await onRow(row);
  }
}

function normalize(value) {
  return String(value || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function includesText(value, query) {
  return normalize(value).includes(normalize(query));
}

function matchesAnyText(value, queryList) {
  return String(queryList)
    .split(",")
    .map((query) => query.trim())
    .filter(Boolean)
    .some((query) => includesText(value, query));
}

function slugify(value, fallback) {
  const slug = normalize(value)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  return slug || fallback;
}

function secondsSinceMidnight(value) {
  const [hours = "0", minutes = "0", seconds = "0"] = String(value).split(":");
  return Number(hours) * 3600 + Number(minutes) * 60 + Number(seconds);
}

function minutesBetween(startTime, value) {
  return Math.round((secondsSinceMidnight(value) - secondsSinceMidnight(startTime)) / 60);
}

function projectPoints(points, width = 900, height = 520, margin = 48) {
  const lats = points.map((point) => point.latitude);
  const lons = points.map((point) => point.longitude);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLon = Math.min(...lons);
  const maxLon = Math.max(...lons);
  const lonSpan = maxLon - minLon || 1;
  const latSpan = maxLat - minLat || 1;

  return points.map((point) => ({
    ...point,
    x: margin + ((point.longitude - minLon) / lonSpan) * (width - margin * 2),
    y: height - margin - ((point.latitude - minLat) / latSpan) * (height - margin * 2),
  }));
}

function makePath(points) {
  if (points.length === 0) return "";
  const roundedPoints = points
    .map((point) => ({ x: Math.round(point.x), y: Math.round(point.y) }))
    .filter((point, index, allPoints) => index === 0 || point.x !== allPoints[index - 1].x || point.y !== allPoints[index - 1].y);
  const maxPoints = 360;
  const sampledPoints =
    roundedPoints.length > maxPoints
      ? roundedPoints.filter((point, index) => index === 0 || index === roundedPoints.length - 1 || index % Math.ceil(roundedPoints.length / maxPoints) === 0)
      : roundedPoints;
  const [first, ...rest] = sampledPoints;
  return [`M${first.x} ${first.y}`, ...rest.map((point) => `L${point.x} ${point.y}`)].join(" ");
}

function distanceBetween(first, second) {
  return Math.hypot(first.x - second.x, first.y - second.y);
}

function closestProgressOnShape(stop, shapePoints) {
  if (shapePoints.length < 2) return stop.progress ?? 0;

  const segmentLengths = [];
  let totalLength = 0;

  for (let index = 1; index < shapePoints.length; index += 1) {
    const length = distanceBetween(shapePoints[index - 1], shapePoints[index]);
    segmentLengths.push(length);
    totalLength += length;
  }

  if (totalLength === 0) return 0;

  let traversedLength = 0;
  let bestDistance = Number.POSITIVE_INFINITY;
  let bestLengthAlongShape = 0;

  for (let index = 1; index < shapePoints.length; index += 1) {
    const start = shapePoints[index - 1];
    const end = shapePoints[index];
    const segmentLength = segmentLengths[index - 1];

    if (segmentLength === 0) continue;

    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const t = Math.max(0, Math.min(1, ((stop.x - start.x) * dx + (stop.y - start.y) * dy) / (segmentLength ** 2)));
    const projected = {
      x: start.x + dx * t,
      y: start.y + dy * t,
    };
    const distance = distanceBetween(stop, projected);

    if (distance < bestDistance) {
      bestDistance = distance;
      bestLengthAlongShape = traversedLength + segmentLength * t;
    }

    traversedLength += segmentLength;
  }

  return bestLengthAlongShape / totalLength;
}

function assignShapeProgress(stops, shapePoints) {
  if (stops.length === 0) return [];
  if (shapePoints.length < 2) {
    return stops.map((stop, index) => ({
      ...stop,
      progress: stops.length === 1 ? 0 : Number((index / (stops.length - 1)).toFixed(4)),
    }));
  }

  let previousProgress = 0;
  return stops.map((stop, index) => {
    const rawProgress = index === 0 ? 0 : index === stops.length - 1 ? 1 : closestProgressOnShape(stop, shapePoints);
    const progress = Math.max(previousProgress, Math.min(1, rawProgress));
    previousProgress = progress;

    return {
      ...stop,
      progress: Number(progress.toFixed(4)),
    };
  });
}

function chooseTargetStop(stops, query, fallbackIndex) {
  return stops.find((stop) => includesText(stop.name, query)) || stops[fallbackIndex];
}

async function main() {
  const inputDir = resolve(options.input);
  const agencies = new Map();
  const routes = [];
  const trips = new Map();
  const stopRows = new Map();
  const stopTimesByTrip = new Map();
  const allRouteStopIds = new Set();
  const shapePoints = [];

  await readCsv(join(inputDir, "agency.txt"), (row) => {
    agencies.set(row.agency_id, row);
  });

  await readCsv(join(inputDir, "routes.txt"), (row) => {
    if (row.route_short_name === options.route) {
      routes.push(row);
    }
  });

  if (routes.length === 0) {
    throw new Error(`Could not find route_short_name ${options.route}`);
  }

  const preferredRoutes = routes.filter((route) =>
    matchesAnyText(`${route.route_long_name} ${route.route_desc}`, options.routeName),
  );
  const routeIds = new Set((preferredRoutes.length > 0 ? preferredRoutes : routes).map((route) => route.route_id));
  await readCsv(join(inputDir, "trips.txt"), (row) => {
    if (routeIds.has(row.route_id)) {
      trips.set(row.trip_id, row);
    }
  });

  if (trips.size === 0) {
    throw new Error(`Could not find trips for route ${options.route}`);
  }

  const tripIds = new Set(trips.keys());
  await readCsv(join(inputDir, "stop_times.txt"), (row) => {
    if (!tripIds.has(row.trip_id)) return;

    const rows = stopTimesByTrip.get(row.trip_id) || [];
    rows.push(row);
    stopTimesByTrip.set(row.trip_id, rows);
    allRouteStopIds.add(row.stop_id);
  });

  await readCsv(join(inputDir, "stops.txt"), (row) => {
    if (allRouteStopIds.has(row.stop_id)) {
      stopRows.set(row.stop_id, row);
    }
  });

  let selectedTripId;
  let selectedScore = -1;

  for (const [tripId, trip] of trips.entries()) {
    const stopTimes = (stopTimesByTrip.get(tripId) || []).sort(
      (first, second) => Number(first.stop_sequence) - Number(second.stop_sequence),
    );
    if (stopTimes.length === 0) continue;

    const firstStop = stopRows.get(stopTimes[0].stop_id);
    const lastStop = stopRows.get(stopTimes[stopTimes.length - 1].stop_id);
    const score = [
      matchesAnyText(trip.trip_headsign, options.headsign) ? 10 : 0,
      matchesAnyText(firstStop?.stop_name, options.originName) ? 20 : 0,
      matchesAnyText(lastStop?.stop_name, options.destinationName) ? 20 : 0,
      stopTimes.length,
    ].reduce((sum, value) => sum + value, 0);

    if (score > selectedScore) {
      selectedTripId = tripId;
      selectedScore = score;
    }
  }

  if (!selectedTripId) {
    throw new Error(`Could not select a representative trip for route ${options.route}`);
  }

  const selectedTrip = trips.get(selectedTripId);
  const selectedStopTimes = stopTimesByTrip
    .get(selectedTripId)
    .sort((first, second) => Number(first.stop_sequence) - Number(second.stop_sequence));

  if (selectedTrip.shape_id) {
    await readCsv(join(inputDir, "shapes.txt"), (row) => {
      if (row.shape_id === selectedTrip.shape_id) {
        shapePoints.push({
          latitude: Number(row.shape_pt_lat),
          longitude: Number(row.shape_pt_lon),
          sequence: Number(row.shape_pt_sequence),
        });
      }
    });
  }

  const stopGeoPoints = selectedStopTimes.map((stopTime) => {
    const stop = stopRows.get(stopTime.stop_id);
    if (!stop) {
      throw new Error(`Missing stop ${stopTime.stop_id} from stops.txt`);
    }

    return {
      stopTime,
      stop,
      latitude: Number(stop.stop_lat),
      longitude: Number(stop.stop_lon),
    };
  });

  const projectedStops = projectPoints(stopGeoPoints);
  const projectedShape =
    shapePoints.length > 1
      ? projectPoints(shapePoints.sort((first, second) => first.sequence - second.sequence))
      : projectedStops;
  const firstDeparture = selectedStopTimes[0].departure_time || selectedStopTimes[0].arrival_time;
  const route = routes.find((candidate) => candidate.route_id === selectedTrip.route_id) || routes[0];
  const agency = agencies.get(route.agency_id);

  const stopsWithoutProgress = projectedStops.map((point) => {
    const arrival = point.stopTime.arrival_time || point.stopTime.departure_time;
    const name = point.stop.stop_name;

    return {
      id: slugify(name, `stop-${point.stop.stop_id}`),
      stopId: point.stop.stop_id,
      name,
      shortName: name.split("/")[0].trim(),
      city: point.stop.stop_desc || "",
      sequence: Number(point.stopTime.stop_sequence),
      scheduledOffsetMinutes: minutesBetween(firstDeparture, arrival),
      latitude: point.latitude,
      longitude: point.longitude,
      x: Math.round(point.x),
      y: Math.round(point.y),
    };
  });
  const stops = assignShapeProgress(stopsWithoutProgress, projectedShape);

  const pickupStop = chooseTargetStop(stops, options.pickupName, 1);
  const dropoffStop = chooseTargetStop(stops, options.dropoffName, Math.min(4, stops.length - 1));
  const lastStop = stops[stops.length - 1];
  const output = `window.STOP_FOR_ME_ROUTE = ${JSON.stringify(
    {
      source: {
        kind: "gtfs-import",
        provider: "Israel Ministry of Transport GTFS",
        feedDirectoryUrl: "https://gtfs.mot.gov.il/gtfsfiles/",
        generatedAt: new Date().toISOString(),
        generatedFrom: "local extracted GTFS feed",
      },
      route: {
        id: route.route_id,
        agencyName: agency?.agency_name || "",
        shortName: route.route_short_name || options.route,
        longName: route.route_long_name || "",
        directionName: selectedTrip.trip_headsign || "",
        destinationName: lastStop.name,
        durationMinutes: lastStop.scheduledOffsetMinutes,
        representativeTripId: selectedTripId,
      },
      mapPath: makePath(projectedShape),
      requestTargets: {
        pickup: pickupStop.id,
        dropoff: dropoffStop.id,
      },
      stops,
    },
    null,
    2,
  )};\n`;

  mkdirSync(resolve(options.out, ".."), { recursive: true });
  writeFileSync(options.out, output, "utf8");
  console.log(`Wrote ${options.out} with ${stops.length} stops from route ${options.route}.`);
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
