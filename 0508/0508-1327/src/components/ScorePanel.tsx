import React from 'react';
import { RoundScore, POSE_NAMES } from '@/types/game';
import { SCORING } from '@/constants/config';
import { getScoreRating, getTimingDescription } from '@/game/scoring';
import { Trophy, TrendingUp, Target, Zap } from 'lucide-react';

interface ScorePanelProps {
  lastScore: RoundScore | null;
  scores: RoundScore[];
}

export const ScorePanel: React.FC<ScorePanelProps> = ({ lastScore, scores }) => {
  const playerScores = scores.filter((s) => s.player === 'player');
  const aiScores = scores.filter((s) => s.player === 'ai');
  const playerTotal = playerScores.reduce((sum, s) => sum + s.total, 0);
  const aiTotal = aiScores.reduce((sum, s) => sum + s.total, 0);
  const playerAvg = playerScores.length > 0 ? Math.round(playerTotal / playerScores.length) : 0;
  const aiAvg = aiScores.length > 0 ? Math.round(aiTotal / aiScores.length) : 0;

  return (
    <div className="bg-white rounded-2xl shadow-lg p-5 border-2 border-amber-100">
      <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
        <Trophy className="w-5 h-5 text-amber-500" />
        得分明细
      </h3>

      {lastScore ? (
        <div className="mb-4 p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-200">
          <div className="text-center mb-3">
            <span
              className="text-2xl font-bold"
              style={{ color: getScoreRating(lastScore.total).color }}
            >
              {getScoreRating(lastScore.total).rating}
            </span>
            <div className="text-3xl font-bold text-gray-800 mt-1">{lastScore.total}</div>
            <div className="text-xs text-gray-500 mt-1">
              第 {lastScore.round} 轮 - {lastScore.player === 'player' ? '你' : 'AI'}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Target className="w-4 h-4 text-purple-500" />
                姿态分
              </div>
              <span className="font-semibold text-purple-600">{lastScore.poseScore}/{SCORING.POSE_SCORE_MAX}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-purple-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${(lastScore.poseScore / SCORING.POSE_SCORE_MAX) * 100}%` }}
              />
            </div>

            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <TrendingUp className="w-4 h-4 text-blue-500" />
                高度分
              </div>
              <span className="font-semibold text-blue-600">{lastScore.heightScore}/{SCORING.HEIGHT_SCORE_MAX}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${(lastScore.heightScore / SCORING.HEIGHT_SCORE_MAX) * 100}%` }}
              />
            </div>

            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Zap className="w-4 h-4 text-green-500" />
                落地分
              </div>
              <span className="font-semibold text-green-600">{lastScore.landingScore}/{SCORING.LANDING_SCORE_MAX}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-green-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${(lastScore.landingScore / SCORING.LANDING_SCORE_MAX) * 100}%` }}
              />
            </div>

            <div className="pt-2 border-t border-amber-200">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">时机精度</span>
                <span
                  className="font-semibold"
                  style={{
                    color: getTimingDescription(lastScore.timingAccuracy / 100).color,
                  }}
                >
                  {lastScore.timingAccuracy}%
                </span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-8 text-gray-400 bg-gray-50 rounded-xl mb-4">
          等待第一轮得分...
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-red-50 rounded-xl p-3 border border-red-100">
          <div className="text-xs text-red-600 font-medium mb-1">你</div>
          <div className="text-2xl font-bold text-red-700">{playerTotal}</div>
          <div className="text-xs text-gray-500">
            {playerScores.length} 轮 · 平均 {playerAvg}
          </div>
        </div>
        <div className="bg-blue-50 rounded-xl p-3 border border-blue-100">
          <div className="text-xs text-blue-600 font-medium mb-1">AI</div>
          <div className="text-2xl font-bold text-blue-700">{aiTotal}</div>
          <div className="text-xs text-gray-500">
            {aiScores.length} 轮 · 平均 {aiAvg}
          </div>
        </div>
      </div>
    </div>
  );
};
