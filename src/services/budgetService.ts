import { supabase } from '@/lib/supabaseClient';
import { handleSupabaseError } from './supabaseService';
import type { BudgetPlan, RouteType, TravelPeriod } from '@/types/database.types';
import type { RouteOption } from '@/types/domain.types';

export interface BudgetCalculationInput {
  travelPeriod: TravelPeriod;
  tripsPerPeriod: number;
  routeOption: RouteOption;
}

export interface BudgetCalculationResult {
  costPerTrip: number;
  dailyCost: number;
  weeklyCost: number;
  monthlyCost: number;
}

const DAYS_PER_WEEK = 7;
const WORK_DAYS_PER_WEEK = 5;
const WEEKS_PER_MONTH = 4.345;

export function calculateBudget({ travelPeriod, tripsPerPeriod, routeOption }: BudgetCalculationInput): BudgetCalculationResult {
  const costPerTrip = routeOption.totalCostIdr;

  let dailyCost: number;
  switch (travelPeriod) {
    case 'daily':
      dailyCost = costPerTrip * tripsPerPeriod;
      break;
    case 'weekly':
      dailyCost = (costPerTrip * tripsPerPeriod) / DAYS_PER_WEEK;
      break;
    case 'monthly':
      dailyCost = (costPerTrip * tripsPerPeriod) / (WEEKS_PER_MONTH * DAYS_PER_WEEK);
      break;
  }

  const weeklyCost = dailyCost * WORK_DAYS_PER_WEEK;
  const monthlyCost = weeklyCost * WEEKS_PER_MONTH;

  return {
    costPerTrip: round2(costPerTrip),
    dailyCost: round2(dailyCost),
    weeklyCost: round2(weeklyCost),
    monthlyCost: round2(monthlyCost),
  };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export async function createBudgetPlan(params: {
  userId: string;
  name: string;
  destinationLabel: string;
  destinationLat: number;
  destinationLng: number;
  originLabel?: string;
  originLat?: number;
  originLng?: number;
  travelPeriod: TravelPeriod;
  tripsPerPeriod: number;
  preferredRouteType: RouteType;
  calculation: BudgetCalculationResult;
  selectedRoute?: RouteOption;
}): Promise<BudgetPlan> {
  const { data: plan, error } = await supabase
    .from('budget_plans')
    .insert({
      user_id: params.userId,
      name: params.name,
      destination_label: params.destinationLabel,
      destination_lat: params.destinationLat,
      destination_lng: params.destinationLng,
      origin_label: params.originLabel ?? null,
      origin_lat: params.originLat ?? null,
      origin_lng: params.originLng ?? null,
      travel_period: params.travelPeriod,
      trips_per_period: params.tripsPerPeriod,
      preferred_route_type: params.preferredRouteType,
      estimated_cost_per_trip: params.calculation.costPerTrip,
      estimated_daily_cost: params.calculation.dailyCost,
      estimated_weekly_cost: params.calculation.weeklyCost,
      estimated_monthly_cost: params.calculation.monthlyCost,
    })
    .select()
    .single();

  if (error) handleSupabaseError('createBudgetPlan', error);

  if (params.selectedRoute) {
    const { error: routeError } = await supabase.from('budget_plan_routes').insert({
      budget_plan_id: plan!.id,
      route_label: params.selectedRoute.legs.map((l) => l.routeLabel ?? l.mode).join(' -> '),
      route_type: params.preferredRouteType,
      total_cost_idr: params.selectedRoute.totalCostIdr,
      total_duration_s: Math.round(params.selectedRoute.totalDurationS),
      transfers: params.selectedRoute.transfers,
      route_snapshot: params.selectedRoute,
    });
    if (routeError) handleSupabaseError('createBudgetPlan:routeSnapshot', routeError);
  }

  return plan!;
}

export async function listBudgetPlans(userId: string): Promise<BudgetPlan[]> {
  const { data, error } = await supabase
    .from('budget_plans')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) handleSupabaseError('listBudgetPlans', error);
  return data ?? [];
}

export async function deleteBudgetPlan(planId: string): Promise<void> {
  const { error } = await supabase.from('budget_plans').delete().eq('id', planId);
  if (error) handleSupabaseError('deleteBudgetPlan', error);
}
