/**
 * A structured, client-side dataset of real Indonesian public transport
 * locations — used directly by the Map page for marker rendering, so the
 * map isn't limited to whatever happens to be in the transport_stops table
 * (which currently only covers Jakarta's TransJakarta/MRT/LRT/KRL corridors
 * used by routeService's journey planning).
 *
 * PROVENANCE: every entry here is a real, named, currently-operating station
 * or stop, compiled from well-documented public knowledge of these systems
 * (Wikipedia-level facts: system names, station names, real lines/corridors).
 * Coordinates are best-effort approximations of each location's real
 * position, not survey-grade GPS pulled from an official dataset — treat
 * this the same as the `curated` tag used in the Supabase schema, NOT as
 * `official` government data. See README for why the actual data.go.id /
 * satudata.jakarta.go.id / jakartasatu.jakarta.go.id sources couldn't be
 * scraped automatically (JS-rendered dashboards, bot detection, and a
 * non-lat/lng coordinate system, respectively).
 *
 * Coverage is representative, not nationwide-exhaustive — full national
 * coverage of every angkot/mikrolet stop in Indonesia is not a static-file
 * problem, it's a live-GTFS-feed problem. This covers Jakarta most densely
 * (since that's where Rutein's journey planning lives) plus the major
 * transit systems of five other big Indonesian cities, intercity rail
 * hubs, airport rail, and key ferry/port terminals.
 */

export type IndonesiaTransportType =
  | 'transjakarta'
  | 'bus'
  | 'krl'
  | 'mrt'
  | 'lrt'
  | 'train'
  | 'airport_rail'
  | 'ferry'
  | 'terminal'
  | 'other';

export interface IndonesiaTransportLocation {
  id: string;
  name: string;
  type: IndonesiaTransportType;
  latitude: number;
  longitude: number;
  city: string;
  province: string;
  /** Optional: line/corridor/operator name, shown in the marker popup. */
  line?: string;
}

let _seq = 0;
function loc(
  name: string,
  type: IndonesiaTransportType,
  latitude: number,
  longitude: number,
  city: string,
  province: string,
  line?: string
): IndonesiaTransportLocation {
  _seq += 1;
  return { id: `idn-${_seq}`, name, type, latitude, longitude, city, province, line };
}

export const INDONESIA_TRANSPORT_DATA: IndonesiaTransportLocation[] = [
  // ------------------------------------------------------------
  // Jakarta — MRT (North-South Line, all 13 real stations)
  // ------------------------------------------------------------
  loc('Lebak Bulus Grab', 'mrt', -6.2897, 106.7750, 'Jakarta', 'DKI Jakarta', 'MRT North-South Line'),
  loc('Fatmawati', 'mrt', -6.2921, 106.7976, 'Jakarta', 'DKI Jakarta', 'MRT North-South Line'),
  loc('Cipete Raya', 'mrt', -6.2851, 106.7994, 'Jakarta', 'DKI Jakarta', 'MRT North-South Line'),
  loc('Haji Nawi', 'mrt', -6.2779, 106.7998, 'Jakarta', 'DKI Jakarta', 'MRT North-South Line'),
  loc('Blok A', 'mrt', -6.2695, 106.7986, 'Jakarta', 'DKI Jakarta', 'MRT North-South Line'),
  loc('Blok M BCA', 'mrt', -6.2440, 106.7993, 'Jakarta', 'DKI Jakarta', 'MRT North-South Line'),
  loc('ASEAN', 'mrt', -6.2364, 106.7998, 'Jakarta', 'DKI Jakarta', 'MRT North-South Line'),
  loc('Senayan', 'mrt', -6.2258, 106.8011, 'Jakarta', 'DKI Jakarta', 'MRT North-South Line'),
  loc('Istora Mandiri', 'mrt', -6.2201, 106.8064, 'Jakarta', 'DKI Jakarta', 'MRT North-South Line'),
  loc('Bendungan Hilir', 'mrt', -6.2077, 106.8121, 'Jakarta', 'DKI Jakarta', 'MRT North-South Line'),
  loc('Setiabudi Astra', 'mrt', -6.2018, 106.8175, 'Jakarta', 'DKI Jakarta', 'MRT North-South Line'),
  loc('Dukuh Atas BNI', 'mrt', -6.1974, 106.8228, 'Jakarta', 'DKI Jakarta', 'MRT North-South Line'),
  loc('Bundaran HI', 'mrt', -6.1950, 106.8231, 'Jakarta', 'DKI Jakarta', 'MRT North-South Line'),

  // Jakarta — LRT Jakarta (Kelapa Gading Line)
  loc('Pegangsaan Dua', 'lrt', -6.1520, 106.9021, 'Jakarta', 'DKI Jakarta', 'LRT Jakarta'),
  loc('Boulevard Utara', 'lrt', -6.1471, 106.8949, 'Jakarta', 'DKI Jakarta', 'LRT Jakarta'),
  loc('Boulevard Selatan', 'lrt', -6.1508, 106.8938, 'Jakarta', 'DKI Jakarta', 'LRT Jakarta'),
  loc('Pulomas', 'lrt', -6.1667, 106.8873, 'Jakarta', 'DKI Jakarta', 'LRT Jakarta'),
  loc('Equestrian', 'lrt', -6.1787, 106.8813, 'Jakarta', 'DKI Jakarta', 'LRT Jakarta'),
  loc('Velodrome', 'lrt', -6.1897, 106.8785, 'Jakarta', 'DKI Jakarta', 'LRT Jakarta'),

  // Jakarta — LRT Jabodebek (key interchange stations, Cibubur + Bekasi lines)
  loc('Dukuh Atas LRT', 'lrt', -6.1978, 106.8232, 'Jakarta', 'DKI Jakarta', 'LRT Jabodebek'),
  loc('Cawang', 'lrt', -6.2434, 106.8607, 'Jakarta', 'DKI Jakarta', 'LRT Jabodebek'),
  loc('Kuningan', 'lrt', -6.2246, 106.8298, 'Jakarta', 'DKI Jakarta', 'LRT Jabodebek'),
  loc('Halim', 'lrt', -6.2661, 106.8899, 'Jakarta', 'DKI Jakarta', 'LRT Jabodebek'),
  loc('Harjamukti', 'lrt', -6.3639, 106.8858, 'Depok', 'Jawa Barat', 'LRT Jabodebek Cibubur Line'),
  loc('Jati Mulya', 'lrt', -6.3122, 107.0132, 'Bekasi', 'Jawa Barat', 'LRT Jabodebek Bekasi Line'),

  // Jakarta — TransJakarta (across multiple curated corridors)
  loc('Blok M', 'transjakarta', -6.2440, 106.7993, 'Jakarta', 'DKI Jakarta', 'Koridor 1'),
  loc('Sisingamangaraja', 'transjakarta', -6.2385, 106.8007, 'Jakarta', 'DKI Jakarta', 'Koridor 1'),
  loc('Kota', 'transjakarta', -6.1370, 106.8133, 'Jakarta', 'DKI Jakarta', 'Koridor 1'),
  loc('Ragunan', 'transjakarta', -6.3096, 106.8203, 'Jakarta', 'DKI Jakarta', 'Koridor 6H'),
  loc('Mampang Prapatan', 'transjakarta', -6.2452, 106.8236, 'Jakarta', 'DKI Jakarta', 'Koridor 6H'),
  loc('Monas', 'transjakarta', -6.1754, 106.8272, 'Jakarta', 'DKI Jakarta', 'Koridor 6H'),
  loc('Pulogadung', 'transjakarta', -6.1868, 106.9008, 'Jakarta', 'DKI Jakarta', 'Koridor 2'),
  loc('Senen', 'transjakarta', -6.1770, 106.8420, 'Jakarta', 'DKI Jakarta', 'Koridor 2'),
  loc('Harmoni', 'transjakarta', -6.1655, 106.8175, 'Jakarta', 'DKI Jakarta', 'Koridor 2'),
  loc('Pinang Ranti', 'transjakarta', -6.2913, 106.8687, 'Jakarta', 'DKI Jakarta', 'Koridor 9'),
  loc('Semanggi', 'transjakarta', -6.2245, 106.8188, 'Jakarta', 'DKI Jakarta', 'Koridor 9'),
  loc('Pluit', 'transjakarta', -6.1233, 106.7929, 'Jakarta', 'DKI Jakarta', 'Koridor 9'),
  loc('Ciledug', 'transjakarta', -6.2313, 106.7268, 'Jakarta', 'DKI Jakarta', 'Koridor 13'),
  loc('Kapten Tendean', 'transjakarta', -6.2410, 106.8221, 'Jakarta', 'DKI Jakarta', 'Koridor 13'),

  // Jakarta — KRL Commuter Line (Bogor Line + key interchanges)
  loc('Bogor', 'krl', -6.5950, 106.7890, 'Bogor', 'Jawa Barat', 'KRL Bogor Line'),
  loc('Cilebut', 'krl', -6.5443, 106.7994, 'Bogor', 'Jawa Barat', 'KRL Bogor Line'),
  loc('Bojong Gede', 'krl', -6.5093, 106.7893, 'Bogor', 'Jawa Barat', 'KRL Bogor Line'),
  loc('Citayam', 'krl', -6.4599, 106.8194, 'Depok', 'Jawa Barat', 'KRL Bogor Line'),
  loc('Depok Baru', 'krl', -6.3989, 106.8232, 'Depok', 'Jawa Barat', 'KRL Bogor Line'),
  loc('Pasar Minggu', 'krl', -6.2848, 106.8407, 'Jakarta', 'DKI Jakarta', 'KRL Bogor Line'),
  loc('Tebet', 'krl', -6.2262, 106.8514, 'Jakarta', 'DKI Jakarta', 'KRL Bogor Line'),
  loc('Manggarai', 'krl', -6.2100, 106.8500, 'Jakarta', 'DKI Jakarta', 'KRL — major interchange hub'),
  loc('Gondangdia', 'krl', -6.1857, 106.8320, 'Jakarta', 'DKI Jakarta', 'KRL Bogor Line'),
  loc('Juanda', 'krl', -6.1657, 106.8309, 'Jakarta', 'DKI Jakarta', 'KRL Bogor Line'),
  loc('Jakarta Kota', 'krl', -6.1370, 106.8133, 'Jakarta', 'DKI Jakarta', 'KRL — northern terminus'),
  loc('Tangerang', 'krl', -6.1783, 106.6319, 'Tangerang', 'Banten', 'KRL Tangerang Line'),
  loc('Bekasi', 'krl', -6.2382, 107.0021, 'Bekasi', 'Jawa Barat', 'KRL Bekasi Line'),

  // Jakarta — Airport rail (Soekarno-Hatta, real Railink/KAI Bandara stations)
  loc('BNI City (Sudirman Baru)', 'airport_rail', -6.2032, 106.8129, 'Jakarta', 'DKI Jakarta', 'KA Bandara Soekarno-Hatta'),
  loc('Batu Ceper', 'airport_rail', -6.1590, 106.6470, 'Tangerang', 'Banten', 'KA Bandara Soekarno-Hatta'),
  loc('Soekarno-Hatta Airport Station', 'airport_rail', -6.1256, 106.6558, 'Tangerang', 'Banten', 'KA Bandara Soekarno-Hatta'),

  // Jakarta area — intercity rail terminals
  loc('Gambir', 'train', -6.1766, 106.8306, 'Jakarta', 'DKI Jakarta', 'Intercity rail — main terminus'),
  loc('Pasar Senen', 'train', -6.1770, 106.8420, 'Jakarta', 'DKI Jakarta', 'Intercity rail'),

  // Jakarta — ferry / port
  loc('Pelabuhan Tanjung Priok', 'ferry', -6.1045, 106.8800, 'Jakarta', 'DKI Jakarta', 'Sea port / ferry terminal'),
  loc('Pelabuhan Kali Adem (Kepulauan Seribu)', 'ferry', -6.1050, 106.7734, 'Jakarta', 'DKI Jakarta', 'Island ferry terminal'),

  // Jakarta — main bus terminals
  loc('Terminal Kampung Rambutan', 'terminal', -6.3106, 106.8611, 'Jakarta', 'DKI Jakarta', 'Intercity bus terminal'),
  loc('Terminal Pulogebang', 'terminal', -6.1859, 106.9412, 'Jakarta', 'DKI Jakarta', 'Intercity bus terminal'),
  loc('Terminal Kalideres', 'terminal', -6.1531, 106.7027, 'Jakarta', 'DKI Jakarta', 'Intercity bus terminal'),

  // ------------------------------------------------------------
  // Bandung — Trans Metro Bandung + intercity rail
  // ------------------------------------------------------------
  loc('Cibiru', 'bus', -6.9187, 107.7218, 'Bandung', 'Jawa Barat', 'Trans Metro Bandung Koridor 2'),
  loc('Alun-alun Bandung', 'bus', -6.9218, 107.6070, 'Bandung', 'Jawa Barat', 'Trans Metro Bandung Koridor 2'),
  loc('Cibeureum', 'bus', -6.9367, 107.5648, 'Bandung', 'Jawa Barat', 'Trans Metro Bandung Koridor 2'),
  loc('Bandung', 'train', -6.9147, 107.6023, 'Bandung', 'Jawa Barat', 'Intercity rail — main station'),

  // ------------------------------------------------------------
  // Yogyakarta — Trans Jogja + intercity rail
  // ------------------------------------------------------------
  loc('Terminal Jombor', 'bus', -7.7481, 110.3572, 'Yogyakarta', 'DI Yogyakarta', 'Trans Jogja Koridor 1A'),
  loc('Malioboro', 'bus', -7.7930, 110.3654, 'Yogyakarta', 'DI Yogyakarta', 'Trans Jogja Koridor 1A'),
  loc('Prambanan', 'bus', -7.7521, 110.4914, 'Yogyakarta', 'DI Yogyakarta', 'Trans Jogja Koridor 1A'),
  loc('Yogyakarta Tugu', 'train', -7.7893, 110.3634, 'Yogyakarta', 'DI Yogyakarta', 'Intercity rail — main station'),

  // ------------------------------------------------------------
  // Surabaya — Suroboyo Bus + intercity rail
  // ------------------------------------------------------------
  loc('Terminal Purabaya (Bungurasih)', 'terminal', -7.3466, 112.7189, 'Surabaya', 'Jawa Timur', 'Suroboyo Bus / intercity terminal'),
  loc('Tugu Pahlawan', 'bus', -7.2455, 112.7378, 'Surabaya', 'Jawa Timur', 'Suroboyo Bus'),
  loc('Rajawali', 'bus', -7.2350, 112.7350, 'Surabaya', 'Jawa Timur', 'Suroboyo Bus'),
  loc('Surabaya Gubeng', 'train', -7.2646, 112.7526, 'Surabaya', 'Jawa Timur', 'Intercity rail — main station'),

  // ------------------------------------------------------------
  // Semarang — Trans Semarang + intercity rail
  // ------------------------------------------------------------
  loc('Terminal Mangkang', 'bus', -6.9575, 110.2938, 'Semarang', 'Jawa Tengah', 'Trans Semarang Koridor 1'),
  loc('Simpang Lima', 'bus', -6.9902, 110.4229, 'Semarang', 'Jawa Tengah', 'Trans Semarang Koridor 1'),
  loc('Semarang Tawang', 'train', -6.9667, 110.4308, 'Semarang', 'Jawa Tengah', 'Intercity rail — main station'),

  // ------------------------------------------------------------
  // Palembang — LRT Palembang (real, opened 2018 for Asian Games) + ferry
  // ------------------------------------------------------------
  loc('Bandara SMB II', 'lrt', -2.8987, 104.6997, 'Palembang', 'Sumatera Selatan', 'LRT Sumatera Selatan'),
  loc('Jakabaring', 'lrt', -3.0034, 104.7729, 'Palembang', 'Sumatera Selatan', 'LRT Sumatera Selatan'),
  loc('Ampera', 'lrt', -2.9917, 104.7614, 'Palembang', 'Sumatera Selatan', 'LRT Sumatera Selatan'),

  // ------------------------------------------------------------
  // Medan — airport rail + intercity rail
  // ------------------------------------------------------------
  loc('Medan', 'train', -3.5952, 98.6772, 'Medan', 'Sumatera Utara', 'Intercity rail — main station'),
  loc('Kualanamu Airport Station', 'airport_rail', -3.6425, 98.8853, 'Deli Serdang', 'Sumatera Utara', 'KA Bandara Kualanamu'),

  // ------------------------------------------------------------
  // Java-Bali ferry crossing — Merak/Bakauheni + Ketapang/Gilimanuk
  // ------------------------------------------------------------
  loc('Pelabuhan Merak', 'ferry', -5.9319, 106.0022, 'Cilegon', 'Banten', 'Java-Sumatra ferry crossing'),
  loc('Pelabuhan Ketapang', 'ferry', -8.1478, 114.3922, 'Banyuwangi', 'Jawa Timur', 'Java-Bali ferry crossing'),
];

/** Lookup used by marker/filter components to render every known type consistently. */
export const TRANSPORT_TYPE_LABELS: Record<IndonesiaTransportType, string> = {
  transjakarta: 'TransJakarta',
  bus: 'Bus / BRT',
  krl: 'KRL Commuter',
  mrt: 'MRT',
  lrt: 'LRT',
  train: 'Intercity Train',
  airport_rail: 'Airport Rail',
  ferry: 'Ferry / Port',
  terminal: 'Bus Terminal',
  other: 'Other',
};
