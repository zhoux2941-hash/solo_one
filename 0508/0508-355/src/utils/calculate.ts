import { questions, getQuestionCountByConstitution } from "@/data/questions";
import { CONSTITUTION_ORDER } from "@/data/constitutions";

export type Answers = Record<number, number>;

export interface ScoreResult {
  constitutionId: string;
  rawScore: number;
  convertedScore: number;
}

export interface AssessmentResult {
  scores: Record<string, number>;
  mainConstitution: string;
  secondaryConstitution: string;
  isPinghe: boolean;
}

export function calculateRawScore(
  answers: Answers,
  constitutionId: string
): number {
  const constitutionQuestions = questions.filter(
    (q) => q.constitutionId === constitutionId
  );

  let rawScore = 0;
  for (const q of constitutionQuestions) {
    const answer = answers[q.id];
    if (answer === undefined) continue;
    if (q.reverseScored) {
      rawScore += 6 - answer;
    } else {
      rawScore += answer;
    }
  }

  return rawScore;
}

export function calculateConvertedScore(
  rawScore: number,
  questionCount: number
): number {
  if (questionCount === 0) return 0;
  return Math.round(((rawScore - questionCount) / (questionCount * 4)) * 100);
}

export function calculateAllScores(answers: Answers): Record<string, number> {
  const scores: Record<string, number> = {};

  for (const constitutionId of CONSTITUTION_ORDER) {
    const rawScore = calculateRawScore(answers, constitutionId);
    const questionCount = getQuestionCountByConstitution(constitutionId);
    scores[constitutionId] = calculateConvertedScore(rawScore, questionCount);
  }

  return scores;
}

export function determineConstitution(
  scores: Record<string, number>
): AssessmentResult {
  const sorted = [...CONSTITUTION_ORDER]
    .map((id) => ({ id, score: scores[id] }))
    .sort((a, b) => b.score - a.score);

  const mainConstitution = sorted[0].id;
  const secondaryConstitution = sorted[1].id;

  const pingheScore = scores["pinghe"];
  const otherMaxScore = Math.max(
    ...CONSTITUTION_ORDER.filter((id) => id !== "pinghe").map(
      (id) => scores[id]
    )
  );

  const isPinghe = pingheScore >= 60 && otherMaxScore < 30;

  return {
    scores,
    mainConstitution,
    secondaryConstitution,
    isPinghe,
  };
}

export function calculateAssessment(answers: Answers): AssessmentResult {
  const scores = calculateAllScores(answers);
  return determineConstitution(scores);
}

export function getConstitutionLevel(score: number): string {
  if (score >= 60) return "典型";
  if (score >= 40) return "倾向";
  if (score >= 30) return "有";
  return "无";
}

export function getConstitutionLevelColor(level: string): string {
  switch (level) {
    case "典型":
      return "#c4654a";
    case "倾向":
      return "#d4753c";
    case "有":
      return "#c9a962";
    default:
      return "#4a9e7e";
  }
}
