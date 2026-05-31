import { SolarTerm, Question } from '../models/solarTerm';
import { shuffleArray } from '../utils/shuffle';
import { SOLAR_TERMS } from '../data/solarTerms';

function buildQuestion(term: SolarTerm, allTerms: SolarTerm[], index: number): Question {
  const wrongOptions = allTerms
    .filter((t) => t.id !== term.id)
    .sort(() => Math.random() - 0.5)
    .slice(0, 2);

  const options = shuffleArray([term, ...wrongOptions]);

  return {
    id: `question-${index}`,
    solarTerm: term,
    options,
    correctAnswerId: term.id,
  };
}

export function generateQuestions(
  solarTerms: SolarTerm[],
  count: number
): Question[] {
  const shuffledTerms = shuffleArray(solarTerms).slice(0, count);
  return shuffledTerms.map((term, index) => buildQuestion(term, solarTerms, index));
}

export function generatePracticeQuestion(solarTerm: SolarTerm): Question {
  return buildQuestion(solarTerm, SOLAR_TERMS, Date.now());
}

export function checkAnswer(question: Question, selectedId: string): boolean {
  return question.correctAnswerId === selectedId;
}

export function getCorrectAnswer(question: Question): SolarTerm {
  return question.solarTerm;
}
