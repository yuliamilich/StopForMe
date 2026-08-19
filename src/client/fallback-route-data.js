export const fallbackRouteData = {
  route: {
    shortName: "117",
    directionName: "Line 117 to Jerusalem",
    durationMinutes: 38,
  },
  mapPath: "M120 380 C210 286 284 262 354 300 C432 342 480 286 515 228 C553 165 620 151 690 183 C755 213 800 174 824 110",
  requestTargets: {
    pickup: "city-hall",
    dropoff: "maccabim-reut",
  },
  stops: [
    {
      id: "central",
      name: "Modi'in-Maccabim-Reut Central Station",
      shortName: "Central Station",
      x: 120,
      y: 380,
      progress: 0,
    },
    {
      id: "city-hall",
      name: "City Hall",
      shortName: "City Hall",
      x: 260,
      y: 282,
      progress: 0.24,
    },
    {
      id: "dam-hamaccabim",
      name: "Dam HaMaccabim/Hashmonaim Boulevard",
      shortName: "Dam HaMaccabim",
      x: 420,
      y: 330,
      progress: 0.45,
    },
    {
      id: "modiin-east",
      name: "Modi'in East Junction",
      shortName: "Modi'in East",
      x: 560,
      y: 170,
      progress: 0.68,
    },
    {
      id: "maccabim-reut",
      name: "Maccabim Reut Junction",
      shortName: "Maccabim Reut",
      x: 824,
      y: 110,
      progress: 1,
    },
  ],
};
