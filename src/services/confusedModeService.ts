import { supabase } from '@/lib/supabaseClient';
import type { ConfusedModeAIContext } from '@/types/confusedMode.types';
import type { Disruption, UserPreferences } from '@/types/database.types';
import type { GeoPoint } from '@/types/domain.types';

export interface ConfusedModeLocation {
  latitude: number;
  longitude: number;
  accuracy?: number;
  address?: string;
}

export interface ConfusedModeMapPlace {
  name: string;
  location: GeoPoint;
}

export interface ConfusedModeDestination {
  name?: string;
  location: GeoPoint;
}

export interface NearbyTransport {
  type: string;
  name: string;
  distance?: number;
  latitude?: number;
  longitude?: number;
}

export type ConfusedModeContext = ConfusedModeAIContext;

export interface ConfusedModeMessage {
  role: 'user' | 'assistant';
  content: string;
}

export const SUGGESTED_EMERGENCY_QUESTIONS: string[] = [
  "Saya ada di mana sekarang?",
  "Bagaimana cara pulang ke Rumah?",
  "Rute terbaik ke Kantor / Sekolah",
  "Cari rute paling cepat ke tujuan",
  "Cari rute paling hemat",
];

export async function sendConfusedModeMessage(
  messages: ConfusedModeMessage[],
  context: ConfusedModeAIContext
): Promise<{
  reply: string;
  implemented: boolean;
}> {
  const geminiApiKey = import.meta.env.VITE_GEMINI_API_KEY;

  if (geminiApiKey && geminiApiKey.trim().length > 0) {
    try {
      const systemInstruction = `Kamu adalah RUTEIN AI Assistant, asisten navigasi transportasi publik di Indonesia yang ramah, natural, dan sangat ringkas.

ATURAN PENTING GAYA BAHASA & KONTEN:
1. Gunakan Bahasa Indonesia yang sangat alami, santun, dan tidak kaku. Jangan pernah gunakan frasa terjemahan kaku seperti "Schedule (Jadwal) fitur di Rutein...". Gunakan frasa alami seperti: "Fitur Jadwal (Schedule) di RUTEIN berfungsi untuk..."
2. JANGAN MENGHALUSINASI FITUR YANG TIDAK ADA. Fitur yang benar-benar ada di RUTEIN saat ini adalah:
   - **Peta Interaktif & Perbandingan Rute**: Mencari rute tercepat, termurah, dan paling seimbang.
   - **Budget Planner**: Merencanakan perjalanan sesuai kantong harian komuter.
   - **Jadwal (Schedule)**: Melihat daftar stasiun/halte, hitung mundur keberangkatan terdekat (real-time countdown), tarif, dan jam operasional harian.
   - **Confused Mode**: Asisten AI untuk membantu pengguna yang bingung memilih transportasi.
3. Jawablah secara SINGKAT, PADAT, dan RINGKAS (maksimal 2-3 poin to-the-point). Hindari paragraf penutup yang panjang dan berulang-ulang.

DATA KONTEKS PENGGUNA SAAT INI:
- Lokasi GPS: ${context.currentLocation ? `${context.currentLocation.address || 'Koordinat'} (${context.currentLocation.latitude}, ${context.currentLocation.longitude})` : 'Belum terhubung'}
- Halte/Stasiun Terdekat: ${context.nearbyTransport.map(t => `${t.name} (${t.type}, ${t.distanceMeters}m)`).join(', ') || 'Tidak ada'}
- Tempat Terdekat: ${context.nearbyPlaces.map(p => p.name).join(', ') || 'Tidak ada'}
- Gangguan Layanan Aktif: ${context.activeDisruptions.map(d => d.title).join(', ') || 'Tidak ada'}
- Rute Terhitung: ${context.navigationResult && context.navigationResult.options.length > 0 ? `Ke ${context.navigationResult.resolvedDestination.name || context.navigationResult.destinationQuery} via ${context.navigationResult.options[0].label} (Durasi ~${Math.round(context.navigationResult.options[0].totalDurationSeconds / 60)} min, Tarif Rp${context.navigationResult.options[0].totalCostIdr})` : 'Tidak ada'}`;

      const contents = [
        { role: 'user', parts: [{ text: systemInstruction }] },
        ...messages.map((m) => ({
          role: m.role === 'user' ? 'user' : 'model',
          parts: [{ text: m.content }],
        })),
      ];

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey.trim()}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents }),
        }
      );

      if (res.ok) {
        const json = await res.json();
        const textReply = json?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (textReply) {
          return { reply: textReply, implemented: true };
        }
      }
    } catch (geminiError) {
      console.warn('Gemini Direct API call failed, falling back to Supabase/Local engine:', geminiError);
    }
  }

  // 2. Priority 2: Supabase Edge Function 'confused-mode'
  const { data, error } = await supabase.functions.invoke('confused-mode', {
    body: {
      messages,
      context,
    },
  });

  if (error) {
    console.error('Confused Mode error:', error);

    try {
      const errorData = await error.context.json();

      return {
        reply:
          errorData.reply ?? errorData.error ?? 'Asisten AI mengalami sedikit kendala server. Silakan coba lagi.',
        implemented: false,
      };
    } catch {
      return {
        reply: 'Asisten AI mengalami sedikit kendala server. Silakan coba lagi.',
        implemented: false,
      };
    }
  }

  return {
    reply: data?.reply ?? 'Tidak ada tanggapan yang diterima dari asisten.',
    implemented: data?.implemented ?? true,
  };
}