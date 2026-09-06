import type { IndonesiaTransportType } from '@/data/indonesiaTransportData';
import type { RouteOption } from '@/types/domain.types';
import type { LogicalRouteOption } from '@/services/routeService';

export interface BudgetRouteCandidate {
  id: string;
  title: string;
  totalCostIdr: number;
  totalDurationMins: number;
  transfers: number;
  walkingDistanceM: number;
  modes: IndonesiaTransportType[];
  description: string;
  routeOptionRef?: RouteOption | LogicalRouteOption;
}

export interface BudgetEvaluationResult {
  category: 'cheapest' | 'balanced' | 'fastest';
  categoryTitle: string;
  route: BudgetRouteCandidate;
  isOverBudget: boolean;
  costFormatted: string;
  durationFormatted: string;
}

export interface LongTermProjection {
  costPerTrip: number;
  weeklyCost: number;
  monthlyCost: number;
  formattedPerTrip: string;
  formattedWeekly: string;
  formattedMonthly: string;
}

export const CANDIDATE_JOURNEYS: BudgetRouteCandidate[] = [
  {
    id: 'route-tj-direct',
    title: 'TransJakarta Direct',
    totalCostIdr: 3500,
    totalDurationMins: 52,
    transfers: 0,
    walkingDistanceM: 450,
    modes: ['transjakarta'],
    description: 'Rute Koridor TransJakarta langsung tanpa transit.',
  },
  {
    id: 'route-krl-basic',
    title: 'KRL Commuter Line',
    totalCostIdr: 4000,
    totalDurationMins: 50,
    transfers: 1,
    walkingDistanceM: 550,
    modes: ['krl'],
    description: 'KRL Commuter Line via stasiun transit utama.',
  },
  {
    id: 'route-tj-krl-combo',
    title: 'TransJakarta + KRL',
    totalCostIdr: 7500,
    totalDurationMins: 44,
    transfers: 1,
    walkingDistanceM: 350,
    modes: ['transjakarta', 'krl'],
    description: 'Kombinasi TransJakarta dan KRL untuk menghemat waktu.',
  },
  {
    id: 'route-balanced-standard',
    title: 'KRL + Bus Feeder',
    totalCostIdr: 8000,
    totalDurationMins: 42,
    transfers: 1,
    walkingDistanceM: 300,
    modes: ['krl', 'bus'],
    description: 'Kombinasi seimbang waktu tempuh, biaya, dan kemudahan transit.',
  },
  {
    id: 'route-mrt-tj',
    title: 'MRT + TransJakarta',
    totalCostIdr: 11500,
    totalDurationMins: 35,
    transfers: 1,
    walkingDistanceM: 250,
    modes: ['mrt', 'transjakarta'],
    description: 'Kombinasi MRT cepat dengan koridor TransJakarta.',
  },
  {
    id: 'route-mrt-express',
    title: 'MRT + Airport Rail',
    totalCostIdr: 12000,
    totalDurationMins: 32,
    transfers: 1,
    walkingDistanceM: 200,
    modes: ['mrt', 'airport_rail'],
    description: 'Perjalanan cepat menggunakan jaringan MRT dan KA Bandara.',
  },
  {
    id: 'route-ojek-lrt',
    title: 'Ojek + LRT Express',
    totalCostIdr: 18000,
    totalDurationMins: 26,
    transfers: 1,
    walkingDistanceM: 100,
    modes: ['other', 'lrt'],
    description: 'Menghubungkan lokasi awal dengan LRT via ojek cepat.',
  },
  {
    id: 'route-express-direct',
    title: 'Express Direct Transit',
    totalCostIdr: 25000,
    totalDurationMins: 22,
    transfers: 0,
    walkingDistanceM: 50,
    modes: ['other', 'mrt'],
    description: 'Perjalanan paling cepat tanpa jalan kaki jauh.',
  },
];

export function formatRupiah(amount: number): string {
  return `Rp${amount.toLocaleString('id-ID')}`;
}

export function calculateLongTermProjection(costPerTrip: number): LongTermProjection {
  const weeklyCost = costPerTrip * 10;
  const monthlyCost = Math.round(weeklyCost * 4.33);

  return {
    costPerTrip,
    weeklyCost,
    monthlyCost,
    formattedPerTrip: formatRupiah(costPerTrip),
    formattedWeekly: formatRupiah(weeklyCost),
    formattedMonthly: formatRupiah(monthlyCost),
  };
}

export function evaluateBudgetOptions(
  appliedBudget: number,
  customCandidates?: BudgetRouteCandidate[]
): {
  cheapest: BudgetEvaluationResult | null;
  balanced: BudgetEvaluationResult | null;
  fastest: BudgetEvaluationResult | null;
  hasInBudgetOptions: boolean;
} {
  const pool = (customCandidates && customCandidates.length > 0) ? customCandidates : CANDIDATE_JOURNEYS;

  const ABSOLUTE_MIN_FARE = 3500;
  if (appliedBudget < ABSOLUTE_MIN_FARE) {
    return {
      cheapest: null,
      balanced: null,
      fastest: null,
      hasInBudgetOptions: false,
    };
  }

  const sortedByCost = [...pool].sort((a, b) => a.totalCostIdr - b.totalCostIdr);
  const minCost = sortedByCost[0]?.totalCostIdr ?? 3500;

  const inBudgetOptions = pool.filter((r) => r.totalCostIdr <= appliedBudget);
  const availablePool = inBudgetOptions.length > 0 ? inBudgetOptions : pool;

  const cheapestRoute = [...availablePool].sort(
    (a, b) => a.totalCostIdr - b.totalCostIdr || a.totalDurationMins - b.totalDurationMins
  )[0] || sortedByCost[0];

  const maxCost = Math.max(...pool.map((r) => r.totalCostIdr));
  const minDur = Math.min(...pool.map((r) => r.totalDurationMins));
  const maxDur = Math.max(...pool.map((r) => r.totalDurationMins));
  const maxTr = Math.max(...pool.map((r) => r.transfers));

  const scoreRoute = (r: BudgetRouteCandidate) => {
    const normCost = (r.totalCostIdr - minCost) / (maxCost - minCost || 1);
    const normDur = (r.totalDurationMins - minDur) / (maxDur - minDur || 1);
    const normTr = r.transfers / (maxTr || 1);
    return 0.4 * normCost + 0.4 * normDur + 0.2 * normTr;
  };

  const sortedByScore = [...availablePool].sort((a, b) => scoreRoute(a) - scoreRoute(b));
  let balancedRoute = sortedByScore.find((r) => r.id !== cheapestRoute.id);
  if (!balancedRoute) {
    balancedRoute = cheapestRoute;
  }

  const fastestInBudget = inBudgetOptions.length > 0
    ? [...inBudgetOptions].sort((a, b) => a.totalDurationMins - b.totalDurationMins)[0]
    : null;

  const fastestOverall = [...pool].sort((a, b) => a.totalDurationMins - b.totalDurationMins)[0];

  let fastestRoute = fastestInBudget ?? fastestOverall;
  const isFastestOverBudget = fastestRoute.totalCostIdr > appliedBudget;

  return {
    hasInBudgetOptions: true,
    cheapest: {
      category: 'cheapest',
      categoryTitle: 'Paling hemat',
      route: cheapestRoute,
      isOverBudget: cheapestRoute.totalCostIdr > appliedBudget,
      costFormatted: formatRupiah(cheapestRoute.totalCostIdr),
      durationFormatted: `${cheapestRoute.totalDurationMins} menit`,
    },
    balanced: {
      category: 'balanced',
      categoryTitle: 'Seimbang',
      route: balancedRoute,
      isOverBudget: balancedRoute.totalCostIdr > appliedBudget,
      costFormatted: formatRupiah(balancedRoute.totalCostIdr),
      durationFormatted: `${balancedRoute.totalDurationMins} menit`,
    },
    fastest: {
      category: 'fastest',
      categoryTitle: 'Lebih cepat',
      route: fastestRoute,
      isOverBudget: isFastestOverBudget,
      costFormatted: formatRupiah(fastestRoute.totalCostIdr),
      durationFormatted: `${fastestRoute.totalDurationMins} menit`,
    },
  };
}
