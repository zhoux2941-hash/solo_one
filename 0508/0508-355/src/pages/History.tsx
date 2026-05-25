import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Trash2,
  Eye,
  BarChart3,
  ArrowUp,
  ArrowDown,
  Minus,
} from "lucide-react";
import { useAssessmentStore, AssessmentRecord } from "@/store/useAssessmentStore";
import { constitutions, getConstitutionColor, getConstitutionName } from "@/data/constitutions";
import TrendLineChart from "@/components/TrendLineChart";

export default function History() {
  const navigate = useNavigate();
  const { assessments, deleteAssessment, result } = useAssessmentStore();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [visibleConstitutions, setVisibleConstitutions] = useState<Set<string>>(
    new Set(constitutions.map((c) => c.id))
  );

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else if (next.size < 2) {
        next.add(id);
      }
      return next;
    });
  };

  const toggleConstitution = (id: string) => {
    setVisibleConstitutions((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleDelete = (id: string) => {
    if (confirm("确定要删除这条记录吗？")) {
      deleteAssessment(id);
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const handleViewDetail = (record: AssessmentRecord) => {
    navigate(`/result?record=${record.id}`);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const selectedRecords = assessments.filter((a) => selectedIds.has(a.id));
  const canCompare = selectedRecords.length === 2;

  const getScoreDiff = (
    constitutionId: string
  ): { diff: number; direction: "up" | "down" | "same" } => {
    if (!canCompare) return { diff: 0, direction: "same" };
    const [earlier, later] = [...selectedRecords].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    const diff = later.scores[constitutionId] - earlier.scores[constitutionId];
    return {
      diff,
      direction: diff > 0 ? "up" : diff < 0 ? "down" : "same",
    };
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f5f0e6] to-[#e8e0d0] py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 text-[#6b8e9e] hover:text-[#2d5a4a] transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            返回首页
          </button>
          <h1
            className="text-3xl font-bold text-[#2d5a4a]"
            style={{ fontFamily: "'Noto Serif SC', serif" }}
          >
            历史测评记录
          </h1>
          <div className="w-24" />
        </div>

        {assessments.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-16 text-center">
            <BarChart3 className="w-16 h-16 mx-auto mb-4 text-[#c9a962]" />
            <p className="text-xl text-[#6b8e9e] mb-4">暂无测评记录</p>
            <p className="text-gray-500 mb-6">完成首次测评后，记录将保存在这里</p>
            <button
              onClick={() => navigate("/questionnaire")}
              className="px-8 py-3 bg-[#c9a962] text-[#2d5a4a] rounded-xl font-bold hover:bg-[#d4b872] transition-colors"
            >
              开始测评
            </button>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2
                  className="text-xl font-bold text-[#2d5a4a]"
                  style={{ fontFamily: "'Noto Serif SC', serif" }}
                >
                  体质变化趋势
                </h2>
                <p className="text-sm text-gray-500">
                  点击图例切换体质显示
                </p>
              </div>
              <TrendLineChart
                assessments={assessments}
                visibleConstitutions={visibleConstitutions}
              />
              <div className="flex flex-wrap gap-2 mt-4">
                {constitutions.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => toggleConstitution(c.id)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-all duration-200 ${
                      visibleConstitutions.has(c.id)
                        ? "bg-[#f5f0e6] shadow-sm"
                        : "bg-gray-100 opacity-50"
                    }`}
                  >
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: c.color }}
                    />
                    <span className="text-gray-700">{c.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
              <h2
                className="text-xl font-bold text-[#2d5a4a] mb-4"
                style={{ fontFamily: "'Noto Serif SC', serif" }}
              >
                对比分析
                {selectedIds.size > 0 && (
                  <span className="text-sm text-gray-500 ml-2">
                    已选 {selectedIds.size} / 2
                  </span>
                )}
              </h2>
              {canCompare ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-[#e5dcc8]">
                        <th className="text-left py-3 px-4 text-[#2d5a4a]">体质</th>
                        <th className="text-center py-3 px-4 text-gray-500">
                          {formatDate(selectedRecords[0].date)}
                        </th>
                        <th className="text-center py-3 px-4 text-gray-500">
                          {formatDate(selectedRecords[1].date)}
                        </th>
                        <th className="text-center py-3 px-4 text-[#2d5a4a]">变化</th>
                      </tr>
                    </thead>
                    <tbody>
                      {constitutions.map((c) => {
                        const { diff, direction } = getScoreDiff(c.id);
                        const [earlier, later] = [...selectedRecords].sort(
                          (a, b) =>
                            new Date(a.date).getTime() - new Date(b.date).getTime()
                        );
                        return (
                          <tr key={c.id} className="border-b border-[#f0e8d8]">
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2">
                                <span
                                  className="w-3 h-3 rounded-full"
                                  style={{ backgroundColor: c.color }}
                                />
                                <span className="font-medium">{c.name}</span>
                              </div>
                            </td>
                            <td className="text-center py-3 px-4 font-bold" style={{ color: c.color }}>
                              {earlier.scores[c.id]}
                            </td>
                            <td className="text-center py-3 px-4 font-bold" style={{ color: c.color }}>
                              {later.scores[c.id]}
                            </td>
                            <td className="text-center py-3 px-4">
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-sm font-medium ${
                                  direction === "up"
                                    ? "bg-green-100 text-green-700"
                                    : direction === "down"
                                    ? "bg-red-100 text-red-700"
                                    : "bg-gray-100 text-gray-600"
                                }`}
                              >
                                {direction === "up" && <ArrowUp className="w-3 h-3" />}
                                {direction === "down" && <ArrowDown className="w-3 h-3" />}
                                {direction === "same" && <Minus className="w-3 h-3" />}
                                {diff !== 0 && Math.abs(diff)}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">
                  请选择两条记录进行对比（最多选择2条）
                </p>
              )}
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2
                className="text-xl font-bold text-[#2d5a4a] mb-4"
                style={{ fontFamily: "'Noto Serif SC', serif" }}
              >
                测评记录
              </h2>
              <div className="space-y-3">
                {assessments.map((record) => {
                  const isSelected = selectedIds.has(record.id);
                  return (
                    <div
                      key={record.id}
                      className={`border-2 rounded-xl p-4 transition-all duration-200 ${
                        isSelected
                          ? "border-[#c9a962] bg-[#c9a962]/5"
                          : "border-[#e5dcc8] hover:border-[#c9a962]/50"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelect(record.id)}
                            className="w-5 h-5 rounded border-[#c9a962] text-[#c9a962] focus:ring-[#c9a962]"
                          />
                          <div>
                            <p className="font-medium text-[#2d5a4a]">
                              {formatDate(record.date)}
                            </p>
                            <div className="flex items-center gap-3 mt-1">
                              <span
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
                                style={{
                                  backgroundColor: `${getConstitutionColor(record.mainConstitution)}20`,
                                  color: getConstitutionColor(record.mainConstitution),
                                }}
                              >
                                主要：{getConstitutionName(record.mainConstitution)}
                              </span>
                              {record.secondaryConstitution !==
                                record.mainConstitution && (
                                <span
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
                                  style={{
                                    backgroundColor: `${getConstitutionColor(record.secondaryConstitution)}20`,
                                    color: getConstitutionColor(record.secondaryConstitution),
                                  }}
                                >
                                  兼有：{getConstitutionName(record.secondaryConstitution)}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleViewDetail(record)}
                            className="p-2 rounded-lg text-[#6b8e9e] hover:bg-[#f5f0e6] hover:text-[#2d5a4a] transition-colors"
                            title="查看详情"
                          >
                            <Eye className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleDelete(record.id)}
                            className="p-2 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                            title="删除"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
