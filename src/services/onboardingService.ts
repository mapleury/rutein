import { supabase } from '@/lib/supabaseClient';
import type { IndonesiaTransportType } from '@/data/indonesiaTransportData';

export type OnboardingTransportType = Exclude<IndonesiaTransportType, 'other'>;
export type OnboardingProfileType = 'school' | 'travel' | 'work';

export interface OnboardingStatus {
  completed: boolean;
}

export async function getOnboardingStatus(userId: string): Promise<OnboardingStatus> {
  const { data, error } = await supabase
    .from('user_preferences')
    .select('onboarding_completed_at')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    console.warn('getOnboardingStatus failed:', error.message);
    return { completed: false };
  }

  return { completed: !!data?.onboarding_completed_at };
}

export async function saveTransportPreference(
  userId: string,
  transports: OnboardingTransportType[]
): Promise<void> {
  const { error } = await supabase
    .from('user_preferences')
    .upsert({ user_id: userId, preferred_transport: transports }, { onConflict: 'user_id' });

  if (error) throw error;
}

export async function saveProfileType(
  userId: string,
  profileType: OnboardingProfileType | null
): Promise<void> {
  const { error } = await supabase.from('user_preferences').upsert(
    {
      user_id: userId,
      profile_type: profileType,
      onboarding_completed_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' }
  );

  if (error) throw error;
}