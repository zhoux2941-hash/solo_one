import { getDb } from '../db/database.js';
import type { ImageFeatures } from './imageService.js';

export interface PatternRecommendation {
  patternId: number;
  subtype: string;
  era: string;
  description: string;
  categoryType: string;
  confidence: number;
  matchedFeatures: string[];
}

export interface Pattern {
  id: number;
  category_id: number;
  subtype: string;
  era: string;
  era_range: string | null;
  description: string | null;
  features: string | null;
}

export interface PatternWithCategory extends Pattern {
  category_type: string;
}

function mapImageFeaturesToQuery(imageFeatures: ImageFeatures) {
  return {
    circular_symmetry: imageFeatures.symmetryHint,
    line_density: imageFeatures.edgeDensity,
    curvature: imageFeatures.contrast * 0.8,
    radial_balance: imageFeatures.symmetryHint * 0.9,
    center_focus: imageFeatures.contrast > 0.3 ? 0.7 : 0.4,
    edge_complexity: imageFeatures.edgeDensity,
  };
}

export function recommendPatterns(imageFeatures: ImageFeatures): PatternRecommendation[] {
  const db = getDb();
  if (!db) return [];

  const queryFeatures = mapImageFeaturesToQuery(imageFeatures);

  const patternsResult = db.exec(
    `SELECT p.id, p.subtype, p.era, p.description, pc.type as category_type
     FROM patterns p
     JOIN pattern_categories pc ON p.category_id = pc.id`
  );

  if (!patternsResult.length || !patternsResult[0].values.length) return [];

  const featuresResult = db.exec(
    `SELECT pattern_id, feature_name, weight FROM feature_vectors`
  );

  const featureMap = new Map<number, Map<string, number>>();
  if (featuresResult.length && featuresResult[0].values.length) {
    for (const row of featuresResult[0].values) {
      const patternId = row[0] as number;
      const featureName = row[1] as string;
      const weight = row[2] as number;
      if (!featureMap.has(patternId)) {
        featureMap.set(patternId, new Map());
      }
      featureMap.get(patternId)!.set(featureName, weight);
    }
  }

  const recommendations: PatternRecommendation[] = [];

  for (const row of patternsResult[0].values) {
    const patternId = row[0] as number;
    const subtype = row[1] as string;
    const era = row[2] as string;
    const description = row[3] as string;
    const categoryType = row[4] as string;

    const patternFeatures = featureMap.get(patternId);
    if (!patternFeatures) continue;

    let totalDiff = 0;
    let featureCount = 0;
    const matchedFeatures: string[] = [];

    for (const [fname, fvalue] of Object.entries(queryFeatures)) {
      const dbWeight = patternFeatures.get(fname);
      if (dbWeight !== undefined) {
        const diff = Math.abs(dbWeight - fvalue);
        totalDiff += diff;
        featureCount++;
        if (diff < 0.25) {
          matchedFeatures.push(fname);
        }
      }
    }

    if (featureCount === 0) continue;

    const avgDiff = totalDiff / featureCount;
    const confidence = Math.max(0, Math.min(1, 1 - avgDiff));

    recommendations.push({
      patternId,
      subtype,
      era,
      description,
      categoryType,
      confidence,
      matchedFeatures,
    });
  }

  recommendations.sort((a, b) => b.confidence - a.confidence);

  return recommendations.slice(0, 8);
}

export function getAllPatterns(): PatternWithCategory[] {
  const db = getDb();
  if (!db) return [];

  const result = db.exec(
    `SELECT p.id, p.category_id, p.subtype, p.era, p.era_range, p.description, p.features, pc.type as category_type
     FROM patterns p
     JOIN pattern_categories pc ON p.category_id = pc.id
     ORDER BY p.id`
  );

  if (!result.length || !result[0].values.length) return [];

  return result[0].values.map((row) => ({
    id: row[0] as number,
    category_id: row[1] as number,
    subtype: row[2] as string,
    era: row[3] as string,
    era_range: row[4] as string | null,
    description: row[5] as string | null,
    features: row[6] as string | null,
    category_type: row[7] as string,
  }));
}

export function getPatternById(id: number): PatternWithCategory | null {
  const db = getDb();
  if (!db) return null;

  const stmt = db.prepare(
    `SELECT p.id, p.category_id, p.subtype, p.era, p.era_range, p.description, p.features, pc.type as category_type
     FROM patterns p
     JOIN pattern_categories pc ON p.category_id = pc.id
     WHERE p.id = ?`
  );
  stmt.bind([id]);

  if (stmt.step()) {
    const row = stmt.getAsObject();
    stmt.free();
    return {
      id: row.id as number,
      category_id: row.category_id as number,
      subtype: row.subtype as string,
      era: row.era as string,
      era_range: row.era_range as string | null,
      description: row.description as string | null,
      features: row.features as string | null,
      category_type: row.category_type as string,
    };
  }

  stmt.free();
  return null;
}
