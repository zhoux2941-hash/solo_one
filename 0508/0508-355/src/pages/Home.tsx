import { useNavigate } from "react-router-dom";
import { Stethoscope, History, Sparkles } from "lucide-react";
import { constitutions } from "@/data/constitutions";
import { useAssessmentStore } from "@/store/useAssessmentStore";
import ConstitutionCard from "@/components/ConstitutionCard";

export default function Home() {
  const navigate = useNavigate();
  const { assessments, clearAssessment } = useAssessmentStore();

  const handleStartAssessment = () => {
    clearAssessment();
    navigate("/questionnaire");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f5f0e6] to-[#e8e0d0]">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-[#2d5a4a] mb-6 shadow-lg">
            <Stethoscope className="w-10 h-10 text-[#c9a962]" />
          </div>
          <h1
            className="text-5xl font-bold mb-4"
            style={{
              background: "linear-gradient(135deg, #2d5a4a, #c9a962)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              fontFamily: "'Noto Serif SC', serif",
            }}
          >
            中医体质辨识
          </h1>
          <p className="text-lg text-[#6b8e9e] max-w-xl mx-auto leading-relaxed">
            基于中华中医药学会《中医体质分类与判定》标准，
            通过60道标准化问卷，科学辨识您的体质类型，获取个性化养生建议
          </p>
          <div className="flex items-center justify-center gap-1 mt-4">
            <Sparkles className="w-4 h-4 text-[#c9a962]" />
            <span className="text-sm text-[#c9a962]">科学 · 专业 · 便捷</span>
            <Sparkles className="w-4 h-4 text-[#c9a962]" />
          </div>
        </div>

        <div className="flex justify-center gap-6 mb-16">
          <button
            onClick={handleStartAssessment}
            className="group flex items-center gap-3 px-10 py-4 bg-[#c9a962] text-[#2d5a4a] font-bold text-lg rounded-xl shadow-lg hover:shadow-xl hover:bg-[#d4b872] transition-all duration-300 hover:-translate-y-1"
          >
            <Stethoscope className="w-6 h-6" />
            开始测评
          </button>
          <button
            onClick={() => navigate("/history")}
            className="group flex items-center gap-3 px-10 py-4 border-2 border-[#2d5a4a] text-[#2d5a4a] font-bold text-lg rounded-xl hover:bg-[#2d5a4a] hover:text-white transition-all duration-300 hover:-translate-y-1"
          >
            <History className="w-6 h-6" />
            查看历史
            {assessments.length > 0 && (
              <span className="bg-[#c9a962] text-[#2d5a4a] text-sm px-2 py-0.5 rounded-full">
                {assessments.length}
              </span>
            )}
          </button>
        </div>

        <div className="mb-8">
          <h2
            className="text-2xl font-bold text-center mb-8 text-[#2d5a4a]"
            style={{ fontFamily: "'Noto Serif SC', serif" }}
          >
            九种体质简介
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {constitutions.map((c) => (
              <ConstitutionCard
                key={c.id}
                constitutionId={c.id}
                name={c.name}
                description={`${c.description}。${c.traits}`}
                color={c.color}
              />
            ))}
          </div>
        </div>

        <div className="mt-16 bg-white/60 rounded-2xl p-8 border border-[#c9a962]/30">
          <h3
            className="text-xl font-bold text-[#2d5a4a] mb-4"
            style={{ fontFamily: "'Noto Serif SC', serif" }}
          >
            关于中医体质
          </h3>
          <p className="text-gray-600 leading-relaxed mb-4">
            中医体质是指人体生命过程中，在先天禀赋和后天获得的基础上所形成的形态结构、
            生理功能和心理状态方面综合的、相对稳定的固有特质。体质决定了我们对某些疾病的易感性，
            以及发病后的病情发展趋势。
          </p>
          <p className="text-gray-600 leading-relaxed">
            中华中医药学会将中医体质分为九种类型：平和质、气虚质、阳虚质、阴虚质、
            痰湿质、湿热质、血瘀质、气郁质、特禀质。了解自身体质，针对性调理，
            是中医"治未病"的重要内容。
          </p>
        </div>
      </div>
    </div>
  );
}
