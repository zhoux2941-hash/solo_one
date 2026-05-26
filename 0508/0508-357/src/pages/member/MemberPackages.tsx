import { useEffect, useState } from 'react';
import Navbar from '../../components/Navbar';
import { useAuthStore } from '../../store/useAuthStore';
import { Package } from '../../../shared/types';
import * as api from '../../lib/api';
import { Check, Star, Zap, Crown, Loader2 } from 'lucide-react';

export default function MemberPackages() {
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasingId, setPurchasingId] = useState<number | null>(null);
  const [successMessage, setSuccessMessage] = useState('');
  const { refreshMemberProfile } = useAuthStore();

  useEffect(() => {
    loadPackages();
  }, []);

  const loadPackages = async () => {
    try {
      const data = await api.getPackages();
      setPackages(data);
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (pkg: Package) => {
    if (!window.confirm(`确定购买「${pkg.name}」吗？\n价格：¥${pkg.price}`)) {
      return;
    }

    setPurchasingId(pkg.id);
    setSuccessMessage('');

    try {
      await api.purchasePackage(pkg.id);
      setSuccessMessage(`购买成功！${pkg.classes}节课已到账`);
      refreshMemberProfile();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: any) {
      alert(err.response?.data?.message || '购买失败，请重试');
    } finally {
      setPurchasingId(null);
    }
  };

  const getIcon = (pkg: Package) => {
    if (pkg.classes >= 50) return <Crown className="w-8 h-8" />;
    if (pkg.classes >= 20) return <Zap className="w-8 h-8" />;
    return <Star className="w-8 h-8" />;
  };

  const getColor = (pkg: Package) => {
    if (pkg.classes >= 50) return 'from-amber-400 to-orange-500';
    if (pkg.classes >= 20) return 'from-emerald-400 to-green-500';
    return 'from-blue-400 to-blue-600';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar role="member" />
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-12 bg-gray-200 rounded-lg w-64" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-96 bg-gray-200 rounded-2xl" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar role="member" />
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">购买课时包</h1>
          <p className="text-gray-600">选择适合您的套餐，开启专业训练之旅</p>
        </div>

        {successMessage && (
          <div className="mb-6 bg-emerald-50 border border-emerald-200 text-emerald-700 px-6 py-4 rounded-xl flex items-center">
            <Check className="w-5 h-5 mr-2" />
            {successMessage}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {packages.map((pkg) => (
            <div
              key={pkg.id}
              className={`relative bg-white rounded-2xl shadow-sm border-2 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${
                pkg.isRecommended
                  ? 'border-emerald-400 ring-4 ring-emerald-100'
                  : 'border-gray-100'
              }`}
            >
              {pkg.isRecommended && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-gradient-to-r from-emerald-500 to-green-500 text-white px-4 py-1 rounded-full text-sm font-medium shadow-lg">
                    热门推荐
                  </span>
                </div>
              )}

              <div className={`p-8 ${pkg.isRecommended ? 'pt-12' : ''}`}>
                <div
                  className={`w-16 h-16 bg-gradient-to-br ${getColor(
                    pkg
                  )} rounded-2xl flex items-center justify-center text-white mb-6`}
                >
                  {getIcon(pkg)}
                </div>

                <h3 className="text-xl font-bold text-gray-900 mb-2">{pkg.name}</h3>
                <p className="text-gray-500 text-sm mb-6">{pkg.description}</p>

                <div className="mb-6">
                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-4xl font-bold text-gray-900">¥{pkg.price}</span>
                    <span className="text-gray-400 line-through">¥{pkg.originalPrice}</span>
                  </div>
                  <p className="text-sm text-gray-500">
                    平均 ¥{(pkg.price / pkg.classes).toFixed(0)}/节 · 有效期 {pkg.validityDays} 天
                  </p>
                </div>

                <div className="space-y-3 mb-8">
                  {[
                    `${pkg.classes} 节专业课程`,
                    `${pkg.validityDays} 天有效期`,
                    '专属教练一对一指导',
                    '免费课程规划咨询',
                  ].map((feature, idx) => (
                    <div key={idx} className="flex items-center gap-3 text-sm text-gray-600">
                      <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                      {feature}
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => handlePurchase(pkg)}
                  disabled={purchasingId === pkg.id}
                  className={`w-full py-4 rounded-xl font-semibold transition-all duration-200 ${
                    pkg.isRecommended
                      ? 'bg-gradient-to-r from-emerald-500 to-green-500 text-white hover:shadow-lg hover:shadow-emerald-200'
                      : 'bg-gradient-to-r from-blue-800 to-blue-500 text-white hover:shadow-lg hover:shadow-blue-200'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {purchasingId === pkg.id ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 inline animate-spin" />
                      购买中...
                    </>
                  ) : (
                    '立即购买'
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 bg-white rounded-2xl p-8 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">购买须知</h3>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-start gap-2">
              <span className="text-blue-500 font-medium">1.</span>
              课时包购买后立即生效，有效期从购买日起计算
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-500 font-medium">2.</span>
              课时可用于预约任意教练的课程，每节课扣除1课时
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-500 font-medium">3.</span>
              预约后如需取消，请提前24小时操作，逾期将扣除课时
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-500 font-medium">4.</span>
              课时包过期后未使用的课时将自动作废，不予退款
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
