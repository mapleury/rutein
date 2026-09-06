export type RoadType =
  | 'toll_road'
  | 'national_road'
  | 'provincial_road'
  | 'city_street'
  | 'other';

export type DisruptionSeverity =
  | 'low'
  | 'medium'
  | 'high'
  | 'critical';

export type DisruptionCause =
  | 'weather'
  | 'maintenance'
  | 'traffic'
  | 'event'
  | 'accident'
  | 'policy'
  | 'other';

export interface IndonesiaRoadDisruption {
  id: string;
  title: string;
  description: string;
  cause: DisruptionCause;
  severity: DisruptionSeverity;
  roadType: RoadType;
  affectedRoads: string[];
  latitude?: number;
  longitude?: number;
  isActive: boolean;
  reportedAt: string;
}

export const DISRUPTION_SEVERITY_LABELS: Record<DisruptionSeverity, string> = {
  low: 'Rendah',
  medium: 'Sedang',
  high: 'Tinggi',
  critical: 'Kritis',
};

export const DISRUPTION_CAUSE_LABELS: Record<DisruptionCause, string> = {
  weather: 'Cuaca & Banjir',
  maintenance: 'Pemeliharaan Jalan',
  traffic: 'Kepadatan Arus',
  event: 'Kegiatan Publik / Aksi',
  accident: 'Kecelakaan Lalu Lintas',
  policy: 'Rekayasa Lalu Lintas',
  other: 'Lainnya',
};

export const ROAD_TYPE_LABELS: Record<RoadType, string> = {
  toll_road: 'Jalan Tol',
  national_road: 'Jalan Nasional',
  provincial_road: 'Jalan Provinsi',
  city_street: 'Jalan Perkotaan',
  other: 'Jalan Umum',
};

function recentIso(minutesAgo: number): string {
  const d = new Date(Date.now() - minutesAgo * 60 * 1000);
  return d.toISOString();
}

let _disSeq = 0;
function roadAlert(
  title: string,
  description: string,
  cause: DisruptionCause,
  severity: DisruptionSeverity,
  roadType: RoadType,
  affectedRoads: string[],
  isActive: boolean,
  minutesAgo: number,
  latitude?: number,
  longitude?: number
): IndonesiaRoadDisruption {
  _disSeq += 1;
  return {
    id: `road-alert-idn-${_disSeq}`,
    title,
    description,
    cause,
    severity,
    roadType,
    affectedRoads,
    isActive,
    reportedAt: recentIso(minutesAgo),
    latitude,
    longitude
  };
}

export const INDONESIA_ROAD_DISRUPTIONS: IndonesiaRoadDisruption[] = [
  roadAlert(
    'Rekonstruksi Perkerasan Jalan Tol Jakarta-Tangerang',
    'Pekerjaan rekonstruksi perkerasan beton di lajur 1 dan bahu luar. Terjadi penyempitan lajur dan antrean kendaraan dari Kebon Jeruk hingga Karang Tengah pada jam sibuk.',
    'maintenance',
    'high',
    'toll_road',
    ['Tol Jakarta-Tangerang KM 03 - KM 09'],
    true,
    35,
    -6.1925,
    106.7441
  ),

  roadAlert(
    'Genangan Air di Simpang Jalan Daan Mogot',
    'Hujan intensitas tinggi menyebabkan genangan air setinggi 30-40 cm di sekitar simpang Rawa Buaya. Ruas jalan tidak disarankan bagi sepeda motor dan sedan. Pengendara dialihkan melintasi Tol JORR W1.',
    'weather',
    'critical',
    'city_street',
    ['Jl. Daan Mogot', 'Simpang Cengkareng / Rawa Buaya'],
    true,
    70,
    -6.1531,
    106.7350
  ),

  roadAlert(
    'Kepadatan Volume Lalu Lintas: Tol Layang MBZ',
    'Volume kendaraan menuju arah Cikampek dan Bandung meningkat signifikan. Terpantau antrean kendaraan dan laju tersendat (kecepatan rata-rata 15-20 km/jam). Diimbau memilih jalur bawah Tol Jakarta-Cikampek.',
    'traffic',
    'high',
    'toll_road',
    ['Jalan Layang Sheikh Mohamed Bin Zayed (MBZ)'],
    true,
    120,
    -6.2625,
    107.0345
  ),


  roadAlert(
    'Pengalihan Arus Lalu Lintas Sekitar Patung Kuda / Monas',
    'Penutupan jalan sementara diberlakukan di seputar Bundaran Patung Kuda Arjuna Wijaya karena kegiatan penyampaian pendapat. Jl. Medan Merdeka Barat steril dari kendaraan umum dan dialihkan ke Jl. Budi Kemuliaan.',
    'event',
    'high',
    'city_street',
    ['Jl. Medan Merdeka Barat', 'Kawasan Patung Kuda Monas'],
    true,
    180,
    -6.1818,
    106.8220
  ),

  roadAlert(
    'Pemberlakuan Sistem Contraflow: Tol Jagorawi',
    'Guna mengurai kepadatan arus komuter keluar Jakarta pada sore hari, lajur contraflow diberlakukan mulai KM 17 (Cimanggis) hingga KM 28 (Ciawi). Tetap patuhi rambu dan arahan petugas.',
    'policy',
    'medium',
    'toll_road',
    ['Tol Jagorawi KM 17 - KM 28'],
    true,
    210,
    -6.4250,
    106.8741
  ),


  roadAlert(
    'Penanganan Truk Terguling di Tol Cipularang KM 92',
    'Evakuasi kendaraan logistik terguling di KM 92 arah Jakarta telah berhasil diselesaikan oleh petugas gabungan Jasa Marga dan PJR. Seluruh lajur telah kembali dibuka normal.',
    'accident',
    'critical',
    'toll_road',
    ['Tol Cipularang KM 92'],
    false,
    420,
    -6.5891,
    107.4111
  )
];
export const SEVERITY_COLORS: Record<DisruptionSeverity, string> = {
  low: '#F59E0B',
  medium: '#F97316',
  high: '#EF4444',
  critical: '#B91C1C'
};