import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Save,
  Utensils,
  Moon,
  Activity,
  Hand,
  Check,
} from "lucide-react";
import { useAssessmentStore } from "@/store/useAssessmentStore";
import { constitutions, getConstitution, getConstitutionColor, getConstitutionName } from "@/data/constitutions";
import { getConstitutionLevel, getConstitutionLevelColor } from "@/utils/calculate";
import ConstitutionRadarChart from "@/components/ConstitutionRadarChart";
import RecipeCard from "@/components/RecipeCard";

const tabConfig = [
  { key: "diet", label: "饮食调养", icon: Utensils },
  { key: "lifestyle", label: "起居调摄", icon: Moon },
  { key: "exercise", label: "运动保健", icon: Activity },
  { key: "acupoints", label: "穴位按摩", icon: Hand },
] as const;

type TabKey = (typeof tabConfig)[number]["key"];

export default function Result() {
  const navigate = useNavigate();
  const { result, saveAssessment, clearAssessment } = useAssessmentStore();
  const [activeTab, setActiveTab] = useState<TabKey>("diet");
  const [saved, setSaved] = useState(false);

  if (!result) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#f5f0e6] to-[#e8e0d0] flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-[#6b8e9e] mb-4">暂无测评结果</p>
          <button
            onClick={() => navigate("/")}
            className="px-6 py-3 bg-[#2d5a4a] text-white rounded-xl hover:bg-[#3d6a5a] transition-colors"
          >
            返回首页
          </button>
        </div>
      </div>
    );
  }

  const mainConstitution = getConstitution(result.mainConstitution);
  const secondaryConstitution = getConstitution(result.secondaryConstitution);

  const handleSave = () => {
    saveAssessment();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleBackToHome = () => {
    clearAssessment();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f5f0e6] to-[#e8e0d0] py-8">
      <div className="max-w-5xl mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 text-[#6b8e9e] hover:text-[#2d5a4a] transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            返回首页
          </button>
          <button
            onClick={handleSave}
            disabled={saved}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-all duration-200 ${
              saved
                ? "bg-[#4a9e7e] text-white"
                : "bg-[#c9a962] text-[#2d5a4a] hover:bg-[#d4b872] hover:shadow-md"
            }`}
          >
            {saved ? (
              <>
                <Check className="w-5 h-5" />
                已保存
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                保存记录
              </>
            )}
          </button>
        </div>

        <h1
          className="text-3xl font-bold text-center mb-8 text-[#2d5a4a]"
          style={{ fontFamily: "'Noto Serif SC', serif" }}
        >
          您的体质分析结果
        </h1>

        <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
          <div className="flex flex-col lg:flex-row items-center gap-8">
            <div className="flex-shrink-0">
              <ConstitutionRadarChart
                scores={result.scores}
                highlighted={result.mainConstitution}
                size={360}
              />
            </div>

            <div className="flex-1 w-full">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div
                  className="rounded-xl p-5 border-2"
                  style={{
                    backgroundColor: `${getConstitutionColor(result.mainConstitution)}15`,
                    borderColor: getConstitutionColor(result.mainConstitution),
                  }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-medium px-2 py-1 rounded-full bg-[#c9a962] text-[#2d5a4a]">
                      主要体质
                    </span>
                    {result.isPinghe && (
                      <span className="text-xs font-medium px-2 py-1 rounded-full bg-[#4a9e7e] text-white">
                        平和健康
                      </span>
                    )}
                  </div>
                  <h3
                    className="text-2xl font-bold"
                    style={{
                      color: getConstitutionColor(result.mainConstitution),
                      fontFamily: "'Noto Serif SC', serif",
                    }}
                  >
                    {mainConstitution?.name}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    得分：{result.scores[result.mainConstitution]} 分
                  </p>
                </div>

                {result.secondaryConstitution !== result.mainConstitution && (
                  <div
                    className="rounded-xl p-5 border-2"
                    style={{
                      backgroundColor: `${getConstitutionColor(result.secondaryConstitution)}10`,
                      borderColor: `${getConstitutionColor(result.secondaryConstitution)}60`,
                    }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-medium px-2 py-1 rounded-full bg-[#6b8e9e] text-white">
                        兼有体质
                      </span>
                    </div>
                    <h3
                      className="text-2xl font-bold"
                      style={{
                        color: getConstitutionColor(result.secondaryConstitution),
                        fontFamily: "'Noto Serif SC', serif",
                      }}
                    >
                      {secondaryConstitution?.name}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      得分：{result.scores[result.secondaryConstitution]} 分
                    </p>
                  </div>
                )}
              </div>

              <div className="bg-[#f5f0e6] rounded-xl p-4">
                <h4 className="font-bold text-[#2d5a4a] mb-3">各体质得分</h4>
                <div className="space-y-2">
                  {constitutions.map((c) => {
                    const score = result.scores[c.id] || 0;
                    const level = getConstitutionLevel(score);
                    const levelColor = getConstitutionLevelColor(level);
                    return (
                      <div
                        key={c.id}
                        className="flex items-center gap-3"
                      >
                        <span className="w-16 text-sm text-gray-600">
                          {c.name}
                        </span>
                        <div className="flex-1 h-4 bg-[#e5dcc8] rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${score}%`,
                              backgroundColor: c.color,
                            }}
                          />
                        </div>
                        <span
                          className="w-10 text-right text-sm font-bold"
                          style={{ color: c.color }}
                        >
                          {score}
                        </span>
                        <span
                          className="w-10 text-xs text-center px-1 py-0.5 rounded"
                          style={{
                            backgroundColor: `${levelColor}20`,
                            color: levelColor,
                          }}
                        >
                          {level}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
            {tabConfig.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium whitespace-nowrap transition-all duration-200 ${
                    activeTab === tab.key
                      ? "bg-[#2d5a4a] text-white shadow-md"
                      : "bg-[#f5f0e6] text-[#6b8e9e] hover:bg-[#e5dcc8]"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div className="space-y-6">
            {[result.mainConstitution, result.secondaryConstitution]
              .filter((id, index, arr) => arr.indexOf(id) === index)
              .map((constitutionId) => {
                const constitution = getConstitution(constitutionId);
                if (!constitution) return null;

                const isMain = constitutionId === result.mainConstitution;

                return (
                  <div
                    key={constitutionId}
                    className="border-2 rounded-xl p-5"
                    style={{
                      borderColor: isMain
                        ? getConstitutionColor(constitutionId)
                        : `${getConstitutionColor(constitutionId)}40`,
                      backgroundColor: isMain
                        ? `${getConstitutionColor(constitutionId)}08`
                        : "transparent",
                    }}
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center"
                        style={{
                          backgroundColor: getConstitutionColor(constitutionId),
                        }}
                      >
                        <span className="text-white text-sm font-bold">
                          {isMain ? "主" : "兼"}
                        </span>
                      </div>
                      <h4
                        className="text-xl font-bold"
                        style={{
                          color: getConstitutionColor(constitutionId),
                          fontFamily: "'Noto Serif SC', serif",
                        }}
                      >
                        {constitution.name}
                      </h4>
                    </div>

                    {activeTab === "diet" && (
                      <div className="space-y-4">
                        <div>
                          <h5 className="font-medium text-[#2d5a4a] mb-2">
                            饮食调养要点
                          </h5>
                          <ul className="space-y-2">
                            {constitution.advice.diet.map((item, i) => (
                              <li
                                key={i}
                                className="flex items-start gap-2 text-gray-600"
                              >
                                <span
                                  className="flex-shrink-0 w-1.5 h-1.5 rounded-full mt-2"
                                  style={{
                                    backgroundColor: getConstitutionColor(constitutionId),
                                  }}
                                />
                                {item}
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div>
                          <h5 className="font-medium text-[#2d5a4a] mb-3">
                            推荐食谱
                          </h5>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            {constitution.recipes.map((recipe, i) => (
                              <RecipeCard
                                key={i}
                                recipe={recipe}
                                color={getConstitutionColor(constitutionId)}
                                isMain={isMain && i === 0}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {activeTab === "lifestyle" && (
                      <div>
                        <h5 className="font-medium text-[#2d5a4a] mb-2">
                          起居调摄要点
                        </h5>
                        <ul className="space-y-2">
                          {constitution.advice.lifestyle.map((item, i) => (
                            <li
                              key={i}
                              className="flex items-start gap-2 text-gray-600"
                            >
                              <span
                                className="flex-shrink-0 w-1.5 h-1.5 rounded-full mt-2"
                                style={{
                                  backgroundColor: getConstitutionColor(constitutionId),
                                }}
                              />
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {activeTab === "exercise" && (
                      <div>
                        <h5 className="font-medium text-[#2d5a4a] mb-2">
                          运动保健要点
                        </h5>
                        <ul className="space-y-2">
                          {constitution.advice.exercise.map((item, i) => (
                            <li
                              key={i}
                              className="flex items-start gap-2 text-gray-600"
                            >
                              <span
                                className="flex-shrink-0 w-1.5 h-1.5 rounded-full mt-2"
                                style={{
                                  backgroundColor: getConstitutionColor(constitutionId),
                                }}
                              />
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {activeTab === "acupoints" && (
                      <div>
                        <h5 className="font-medium text-[#2d5a4a] mb-3">
                          穴位按摩保健
                        </h5>
                        <div className="grid gap-3">
                          {constitution.advice.acupoints.map((point, i) => (
                            <div
                              key={i}
                              className="bg-[#f5f0e6] rounded-lg p-3"
                            >
                              <div className="flex items-center gap-2 mb-1">
                                <span
                                  className="font-bold text-sm"
                                  style={{
                                    color: getConstitutionColor(constitutionId),
                                  }}
                                >
                                  {point.name}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {point.location}
                                </span>
                              </div>
                              <p className="text-sm text-gray-600">
                                {point.method}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        </div>

        <div className="bg-[#c9a962]/10 rounded-2xl p-6 border border-[#c9a962]/30">
          <h4
            className="text-lg font-bold text-[#2d5a4a] mb-2"
            style={{ fontFamily: "'Noto Serif SC', serif" }}
          >
            温馨提示
          </h4>
          <p className="text-sm text-gray-600 leading-relaxed">
            中医体质辨识结果仅供参考，不能替代专业医学诊断。养生建议应根据个人实际情况灵活调整，
            如有严重不适，请及时就医。建议定期（3-6个月）进行体质测评，观察体质变化趋势。
          </p>
        </div>

        <div className="flex justify-center gap-4 mt-8">
          <button
            onClick={() => navigate("/history")}
            className="px-6 py-3 bg-white border-2 border-[#2d5a4a] text-[#2d5a4a] rounded-xl font-medium hover:bg-[#2d5a4a] hover:text-white transition-all duration-200"
          >
            查看历史记录
          </button>
          <button
            onClick={handleBackToHome}
            className="px-6 py-3 bg-[#2d5a4a] text-white rounded-xl font-medium hover:bg-[#3d6a5a] transition-all duration-200"
          >
            返回首页
          </button>
        </div>
      </div>
    </div>
  );
}
