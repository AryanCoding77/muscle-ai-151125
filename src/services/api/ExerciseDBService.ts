// ExerciseDBService - RapidAPI client for fetching exercises with GIFs

import { EXERCISEDB_CONFIG } from '../../config/constants';

export interface ExerciseDBItem {
  id: string;
  name: string;
  bodyPart: string;
  target: string;
  equipment: string;
  gifUrl: string;
}

export type ExercisesByTarget = Record<string, ExerciseDBItem[]>;

export class ExerciseDBService {
  private static instance: ExerciseDBService;

  static getInstance() {
    if (!ExerciseDBService.instance) {
      ExerciseDBService.instance = new ExerciseDBService();
    }
    return ExerciseDBService.instance;
  }

  private get headers() {
    return {
      'X-RapidAPI-Key': EXERCISEDB_CONFIG.RAPIDAPI_KEY,
      'X-RapidAPI-Host': EXERCISEDB_CONFIG.HOST,
    } as Record<string, string>;
  }

  public hasApiKey(): boolean {
    return !!EXERCISEDB_CONFIG.RAPIDAPI_KEY;
  }

  private normalizeGifUrl(url: string): string {
    if (!url) return url;
    // Force HTTPS (CloudFront supports https)
    if (url.startsWith('http://')) {
      return 'https://' + url.slice('http://'.length);
    }
    return url;
  }

  async fetchExercisesByTarget(target: string, limit = EXERCISEDB_CONFIG.MAX_EXERCISES_PER_TARGET): Promise<ExerciseDBItem[]> {
    if (!this.hasApiKey()) return [];

    const url = `${EXERCISEDB_CONFIG.BASE_URL}/exercises/target/${encodeURIComponent(target)}`;
    const res = await fetch(url, { headers: this.headers });
    if (!res.ok) {
      console.warn(`[ExerciseDB] Failed to fetch target ${target}: ${res.status} ${res.statusText}`);
      return [];
    }
    const data: ExerciseDBItem[] = await res.json();
    // Deduplicate by name and slice to limit
    const seen = new Set<string>();
    const unique = data.filter((e) => {
      const key = e.name.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      const gif = this.normalizeGifUrl(e.gifUrl);
      // Ensure URL looks like a GIF or remote animated resource
      (e as any).gifUrl = gif;
      return !!gif;
    });
    return unique.slice(0, limit);
  }

  async fetchExercisesByBodyPart(bodyPart: string, limit = EXERCISEDB_CONFIG.MAX_EXERCISES_PER_TARGET): Promise<ExerciseDBItem[]> {
    if (!this.hasApiKey()) return [];

    const url = `${EXERCISEDB_CONFIG.BASE_URL}/exercises/bodyPart/${encodeURIComponent(bodyPart)}`;
    const res = await fetch(url, { headers: this.headers });
    if (!res.ok) return [];
    const data: ExerciseDBItem[] = await res.json();
    const mapped = data.map((e) => ({ ...e, gifUrl: this.normalizeGifUrl(e.gifUrl) }));
    return mapped.filter((e) => !!e.gifUrl).slice(0, limit);
  }

  async fetchExercisesForTargets(targets: string[]): Promise<ExercisesByTarget> {
    const limitedTargets = Array.from(new Set(targets)).slice(0, EXERCISEDB_CONFIG.MAX_TARGETS);
    const entries = await Promise.all(
      limitedTargets.map(async (t) => {
        const items = await this.fetchExercisesByTarget(t);
        return [t, items] as [string, ExerciseDBItem[]];
      })
    );
    return Object.fromEntries(entries);
  }
}
