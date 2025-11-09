/**
 * Known GTFS test data for assertions
 * Based on public Metra GTFS static data
 *
 * Note: These values may need to be updated if the GTFS feed changes.
 * Station and line IDs are relatively stable.
 */

export const KNOWN_STATIONS = {
  CHICAGO_UNION: {
    name: 'Chicago Union Station',
    searchTerm: 'Chicago Union',
  },
  OGILVIE: {
    name: 'Ogilvie Transportation Center',
    searchTerm: 'Ogilvie',
  },
  MILLENNIUM_STATION: {
    name: 'Millennium Station',
    searchTerm: 'Millennium',
  },
  AURORA: {
    name: 'Aurora',
    searchTerm: 'Aurora',
  },
  JOLIET: {
    name: 'Joliet',
    searchTerm: 'Joliet',
  },
  ELBURN: {
    name: 'Elburn',
    searchTerm: 'Elburn',
  },
  KENOSHA: {
    name: 'Kenosha',
    searchTerm: 'Kenosha',
  },
} as const;

export const KNOWN_LINES = {
  BNSF: {
    name: 'BNSF Railway',
    searchTerm: 'BNSF',
    color: '#00a651',
  },
  UP_N: {
    name: 'Union Pacific North',
    searchTerm: 'Union Pacific North',
    color: '#c60c30',
  },
  UP_NW: {
    name: 'Union Pacific Northwest',
    searchTerm: 'Union Pacific Northwest',
    color: '#ffb612',
  },
  UP_W: {
    name: 'Union Pacific West',
    searchTerm: 'Union Pacific West',
    color: '#ffb612',
  },
  ROCK_ISLAND: {
    name: 'Rock Island',
    searchTerm: 'Rock Island',
    color: '#1c4c9c',
  },
  METRA_ELECTRIC: {
    name: 'Metra Electric',
    searchTerm: 'Metra Electric',
    color: '#fa4616',
  },
  MILWAUKEE_N: {
    name: 'Milwaukee District North',
    searchTerm: 'Milwaukee District North',
    color: '#f58220',
  },
  MILWAUKEE_W: {
    name: 'Milwaukee District West',
    searchTerm: 'Milwaukee District West',
    color: '#f58220',
  },
  HERITAGE_CORRIDOR: {
    name: 'Heritage Corridor',
    searchTerm: 'Heritage Corridor',
    color: '#f58220',
  },
  NORTH_CENTRAL: {
    name: 'North Central Service',
    searchTerm: 'North Central',
    color: '#00a651',
  },
  SOUTHWEST_SERVICE: {
    name: 'SouthWest Service',
    searchTerm: 'SouthWest',
    color: '#f58220',
  },
} as const;

/**
 * Total number of Metra lines
 */
export const TOTAL_METRA_LINES = 11;

/**
 * Common route combinations for testing
 */
export const COMMON_ROUTES = {
  CHICAGO_TO_AURORA: {
    origin: KNOWN_STATIONS.CHICAGO_UNION,
    destination: KNOWN_STATIONS.AURORA,
    line: KNOWN_LINES.BNSF,
  },
  OGILVIE_TO_ELBURN: {
    origin: KNOWN_STATIONS.OGILVIE,
    destination: KNOWN_STATIONS.ELBURN,
    line: KNOWN_LINES.UP_W,
  },
  CHICAGO_TO_JOLIET: {
    origin: KNOWN_STATIONS.CHICAGO_UNION,
    destination: KNOWN_STATIONS.JOLIET,
    line: KNOWN_LINES.ROCK_ISLAND,
  },
  OGILVIE_TO_KENOSHA: {
    origin: KNOWN_STATIONS.OGILVIE,
    destination: KNOWN_STATIONS.KENOSHA,
    line: KNOWN_LINES.UP_N,
  },
} as const;
