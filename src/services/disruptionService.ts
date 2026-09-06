import { getActiveDisruptions, subscribeToDisruptions } from './transportService';
import type { Disruption } from '@/types/database.types';

export async function getDisruptions(): Promise<Disruption[]> {
  return getActiveDisruptions();
}

export function watchDisruptions(onChange: (disruption: Disruption) => void): () => void {
  return subscribeToDisruptions(onChange);
}

export function severityWeight(severity: Disruption['severity']): number {
  switch (severity) {
    case 'critical':
      return 4;
    case 'high':
      return 3;
    case 'moderate':
      return 2;
    case 'low':
    default:
      return 1;
  }
}

export function sortBySeverity(disruptions: Disruption[]): Disruption[] {
  return [...disruptions].sort((a, b) => severityWeight(b.severity) - severityWeight(a.severity));
}
