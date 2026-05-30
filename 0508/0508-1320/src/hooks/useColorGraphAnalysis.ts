import { useMemo } from 'react';
import { RegionColors } from '../types';
import {
  colorKnowledgeGraph,
  getColorNode,
  getEdgeBetween,
  ColorNode,
  ColorEdge,
} from '../data/colorKnowledgeGraph';

export interface TraitAnalysis {
  trait: string;
  score: number;
  sourceColors: string[];
}

export interface GraphRelationship {
  edge: ColorEdge;
  fromNode: ColorNode;
  toNode: ColorNode;
}

export interface GraphAnalysisResult {
  mainTraits: TraitAnalysis[];
  enhanceRelationships: GraphRelationship[];
  conflictRelationships: GraphRelationship[];
  colorNodes: ColorNode[];
  overallDescription: string;
  harmonyScore: number;
}

export const useColorGraphAnalysis = (regionColors: RegionColors): GraphAnalysisResult => {
  return useMemo(() => {
    const usedColors = Object.values(regionColors).filter((c) => c);
    const uniqueColors = [...new Set(usedColors)];

    if (uniqueColors.length === 0) {
      return {
        mainTraits: [],
        enhanceRelationships: [],
        conflictRelationships: [],
        colorNodes: [],
        overallDescription: '请先为面具填色，系统将根据配色知识图谱分析角色性格。',
        harmonyScore: 0,
      };
    }

    const colorNodes = uniqueColors
      .map((color) => getColorNode(color))
      .filter((n): n is ColorNode => n !== undefined);

    const traitScores: Record<string, { score: number; colors: string[] }> = {};

    colorNodes.forEach((node) => {
      const colorWeight = usedColors.filter((c) => c.toUpperCase() === node.color.toUpperCase()).length;
      const weight = node.strength * colorWeight;

      node.traits.forEach((trait) => {
        if (!traitScores[trait]) {
          traitScores[trait] = { score: 0, colors: [] };
        }
        traitScores[trait].score += weight;
        if (!traitScores[trait].colors.includes(node.color)) {
          traitScores[trait].colors.push(node.color);
        }
      });
    });

    const enhanceRelationships: GraphRelationship[] = [];
    const conflictRelationships: GraphRelationship[] = [];

    for (let i = 0; i < uniqueColors.length; i++) {
      for (let j = i + 1; j < uniqueColors.length; j++) {
        const edge = getEdgeBetween(uniqueColors[i], uniqueColors[j]);
        if (edge) {
          const fromNode = getColorNode(edge.from);
          const toNode = getColorNode(edge.to);
          if (fromNode && toNode) {
            const relationship = { edge, fromNode, toNode };
            if (edge.type === 'enhance') {
              enhanceRelationships.push(relationship);
            } else {
              conflictRelationships.push(relationship);
            }
          }
        }
      }
    }

    enhanceRelationships.forEach((rel) => {
      const boost = rel.edge.weight * 2;
      [...rel.fromNode.traits, ...rel.toNode.traits].forEach((trait) => {
        if (traitScores[trait]) {
          traitScores[trait].score += boost;
        }
      });
    });

    conflictRelationships.forEach((rel) => {
      const reduce = rel.edge.weight * 1.5;
      [...rel.fromNode.traits, ...rel.toNode.traits].forEach((trait) => {
        if (traitScores[trait]) {
          traitScores[trait].score = Math.max(0, traitScores[trait].score - reduce);
        }
      });
    });

    const mainTraits: TraitAnalysis[] = Object.entries(traitScores)
      .map(([trait, data]) => ({
        trait,
        score: data.score,
        sourceColors: data.colors,
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    const maxScore = mainTraits.length > 0 ? mainTraits[0].score : 1;
    const normalizedTraits = mainTraits.map((t) => ({
      ...t,
      score: Math.round((t.score / maxScore) * 100),
    }));

    let overallDescription = '';
    if (normalizedTraits.length > 0) {
      const primary = normalizedTraits[0];
      overallDescription = `根据色彩知识图谱分析，这个角色最鲜明的特质是「${primary.trait}」。`;

      if (enhanceRelationships.length > 0) {
        const topEnhance = enhanceRelationships.sort(
          (a, b) => b.edge.weight - a.edge.weight
        )[0];
        overallDescription += ` ${topEnhance.fromNode.name}与${topEnhance.toNode.name}相互增益，${topEnhance.edge.description}。`;
      }

      if (conflictRelationships.length > 0) {
        const topConflict = conflictRelationships.sort(
          (a, b) => b.edge.weight - a.edge.weight
        )[0];
        overallDescription += ` 同时，${topConflict.fromNode.name}与${topConflict.toNode.name}形成张力，${topConflict.edge.description}，使角色性格更具层次。`;
      }

      if (normalizedTraits.length > 1) {
        const secondary = normalizedTraits.slice(1, 3).map((t) => t.trait).join('、');
        overallDescription += ` 此外还展现出「${secondary}」等特质。`;
      }
    }

    const totalRelationships = enhanceRelationships.length + conflictRelationships.length;
    const harmonyScore =
      totalRelationships > 0
        ? Math.round(
            ((enhanceRelationships.reduce((s, r) => s + r.edge.weight, 0) -
              conflictRelationships.reduce((s, r) => s + r.edge.weight, 0) +
              totalRelationships) /
              (totalRelationships * 2) *
              100
          )
        : 100;

    return {
      mainTraits: normalizedTraits,
      enhanceRelationships: enhanceRelationships.sort((a, b) => b.edge.weight - a.edge.weight),
      conflictRelationships: conflictRelationships.sort((a, b) => b.edge.weight - a.edge.weight),
      colorNodes,
      overallDescription,
      harmonyScore: Math.max(0, Math.min(100, harmonyScore)),
    };
  }, [regionColors]);
};
