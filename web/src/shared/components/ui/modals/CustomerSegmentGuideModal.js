'use client';

import { useTranslation } from '@/shared/i18n';
import { useRouter } from 'next/navigation';
import EnhancedModal from './EnhancedModal';
import {
  Target,
  TrendingUp,
  Users,
  Zap,
  Globe,
  CheckCircle,
  ShoppingCart,
  Activity,
  Award,
  Clock,
  Star,
  Sparkles
} from 'lucide-react';
import { PrimaryButton } from '../buttons';

/**
 * 고객 세그먼트 안내 모달
 *
 * 점주들에게 고객 세그먼트 시스템의 개념, 사용법, 활용 시나리오를 설명하는 모달
 *
 * @param {boolean} isOpen - 모달 표시 여부
 * @param {function} onClose - 모달 닫기 핸들러
 */
export default function CustomerSegmentGuideModal({ isOpen, onClose }) {
  const { t, isLoading } = useTranslation();
  const router = useRouter();

  // 번역 로딩 중이면 모달을 표시하지 않음
  if (isLoading) return null;

  // 안전하게 배열 반환하는 헬퍼 함수
  const getArrayFromTranslation = (key) => {
    const result = t(key, { returnObjects: true });
    return Array.isArray(result) ? result : [];
  };

  const handleCreateSegment = () => {
    onClose();
    router.push('/dashboard/customers/segments/rules/create');
  };

  return (
    <EnhancedModal
      isOpen={isOpen}
      onClose={onClose}
      title={t('customers.segments.guide.modalTitle')}
      size="xl"
      variant="vietnamese"
    >
      <div className="space-y-8">
        {/* 소개 */}
        <section className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 p-6 rounded-xl border border-emerald-200 dark:border-emerald-700/30">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-emerald-500 rounded-lg">
              <Target className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">
                {t('customers.segments.guide.intro.title')}
              </h3>
              <p className="text-gray-700 dark:text-gray-300">
                {t('customers.segments.guide.intro.description')}
              </p>
            </div>
          </div>
        </section>

        {/* 비즈니스 목적 & 핵심 기능 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 비즈니스 목적 */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-4">
              <TrendingUp className="w-5 h-5 text-blue-500" />
              <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                {t('customers.segments.guide.purpose.title')}
              </h4>
            </div>
            <ul className="space-y-2">
              {getArrayFromTranslation('customers.segments.guide.purpose.items').map((item, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                  <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* 핵심 기능 */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-4">
              <Zap className="w-5 h-5 text-amber-500" />
              <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                {t('customers.segments.guide.features.title')}
              </h4>
            </div>
            <ul className="space-y-2">
              {getArrayFromTranslation('customers.segments.guide.features.items').map((item, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                  <Sparkles className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* 주요 구성 요소 */}
        <section>
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-500" />
            {t('customers.segments.guide.components.title')}
          </h3>

          <div className="space-y-4">
            {/* 세그먼트 규칙 */}
            <div className="bg-gray-50 dark:bg-gray-800/50 p-5 rounded-lg border border-gray-200 dark:border-gray-700">
              <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                {t('customers.segments.guide.components.rule.title')}
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                {t('customers.segments.guide.components.rule.description')}
              </p>
              <ul className="space-y-1.5 text-sm">
                {getArrayFromTranslation('customers.segments.guide.components.rule.fields').map((field, idx) => (
                  <li key={idx} className="text-gray-700 dark:text-gray-300 pl-4 relative before:content-['•'] before:absolute before:left-0 before:text-emerald-500">
                    {field}
                  </li>
                ))}
              </ul>
            </div>

            {/* 조건 타입 */}
            <div className="bg-gray-50 dark:bg-gray-800/50 p-5 rounded-lg border border-gray-200 dark:border-gray-700">
              <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">
                {t('customers.segments.guide.components.conditionTypes.title')}
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 구매 관련 */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <ShoppingCart className="w-4 h-4 text-purple-500" />
                    <h5 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {t('customers.segments.guide.components.conditionTypes.purchase.title')}
                    </h5>
                  </div>
                  <ul className="space-y-1 text-sm">
                    {getArrayFromTranslation('customers.segments.guide.components.conditionTypes.purchase.items').map((item, idx) => (
                      <li key={idx} className="text-gray-600 dark:text-gray-400 pl-4 relative before:content-['→'] before:absolute before:left-0 before:text-purple-500">
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* 활동 관련 */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Activity className="w-4 h-4 text-blue-500" />
                    <h5 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {t('customers.segments.guide.components.conditionTypes.activity.title')}
                    </h5>
                  </div>
                  <ul className="space-y-1 text-sm">
                    {getArrayFromTranslation('customers.segments.guide.components.conditionTypes.activity.items').map((item, idx) => (
                      <li key={idx} className="text-gray-600 dark:text-gray-400 pl-4 relative before:content-['→'] before:absolute before:left-0 before:text-blue-500">
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* 비교 연산자 */}
            <div className="bg-gray-50 dark:bg-gray-800/50 p-5 rounded-lg border border-gray-200 dark:border-gray-700">
              <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">
                {t('customers.segments.guide.components.operators.title')}
              </h4>
              <div className="flex flex-wrap gap-2">
                {getArrayFromTranslation('customers.segments.guide.components.operators.items').map((op, idx) => (
                  <span key={idx} className="px-3 py-1.5 bg-white dark:bg-gray-700 rounded-lg text-xs font-medium text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600">
                    {op}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* 활용 시나리오 */}
        <section>
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-500" />
            {t('customers.segments.guide.scenarios.title')}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* VIP 고객 */}
            <div className="bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 p-5 rounded-xl border border-amber-200 dark:border-amber-700/30">
              <div className="text-2xl mb-2">{t('customers.segments.guide.scenarios.vip.name').split(' ')[0]}</div>
              <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2 text-sm">
                {t('customers.segments.guide.scenarios.vip.title')}
              </h4>
              <div className="space-y-1 mb-3">
                {getArrayFromTranslation('customers.segments.guide.scenarios.vip.conditions').map((cond, idx) => (
                  <div key={idx} className="text-xs text-gray-700 dark:text-gray-300 flex items-start gap-1.5">
                    <CheckCircle className="w-3 h-3 text-amber-500 flex-shrink-0 mt-0.5" />
                    <span>{cond}</span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 pt-3 border-t border-amber-200 dark:border-amber-700/30">
                <strong>용도:</strong> {t('customers.segments.guide.scenarios.vip.use')}
              </p>
            </div>

            {/* 휴면 고객 */}
            <div className="bg-gradient-to-br from-slate-50 to-gray-50 dark:from-slate-900/20 dark:to-gray-900/20 p-5 rounded-xl border border-slate-200 dark:border-slate-700/30">
              <div className="text-2xl mb-2">{t('customers.segments.guide.scenarios.dormant.name').split(' ')[0]}</div>
              <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2 text-sm">
                {t('customers.segments.guide.scenarios.dormant.title')}
              </h4>
              <div className="space-y-1 mb-3">
                {getArrayFromTranslation('customers.segments.guide.scenarios.dormant.conditions').map((cond, idx) => (
                  <div key={idx} className="text-xs text-gray-700 dark:text-gray-300 flex items-start gap-1.5">
                    <CheckCircle className="w-3 h-3 text-slate-500 flex-shrink-0 mt-0.5" />
                    <span>{cond}</span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 pt-3 border-t border-slate-200 dark:border-slate-700/30">
                <strong>용도:</strong> {t('customers.segments.guide.scenarios.dormant.use')}
              </p>
            </div>

            {/* 신규 고객 */}
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 p-5 rounded-xl border border-emerald-200 dark:border-emerald-700/30">
              <div className="text-2xl mb-2">{t('customers.segments.guide.scenarios.new.name').split(' ')[0]}</div>
              <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2 text-sm">
                {t('customers.segments.guide.scenarios.new.title')}
              </h4>
              <div className="space-y-1 mb-3">
                {getArrayFromTranslation('customers.segments.guide.scenarios.new.conditions').map((cond, idx) => (
                  <div key={idx} className="text-xs text-gray-700 dark:text-gray-300 flex items-start gap-1.5">
                    <CheckCircle className="w-3 h-3 text-emerald-500 flex-shrink-0 mt-0.5" />
                    <span>{cond}</span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 pt-3 border-t border-emerald-200 dark:border-emerald-700/30">
                <strong>용도:</strong> {t('customers.segments.guide.scenarios.new.use')}
              </p>
            </div>
          </div>
        </section>

        {/* 동작 방식 */}
        <section>
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-purple-500" />
            {t('customers.segments.guide.howItWorks.title')}
          </h3>

          <div className="space-y-3">
            {/* 우선순위 */}
            <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg border border-purple-200 dark:border-purple-700/30">
              <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2 text-sm">
                {t('customers.segments.guide.howItWorks.priority.title')}
              </h4>
              <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                {t('customers.segments.guide.howItWorks.priority.description')}
              </p>
              <div className="bg-white dark:bg-gray-800 px-3 py-2 rounded text-xs font-mono text-purple-700 dark:text-purple-300">
                {t('customers.segments.guide.howItWorks.priority.example')}
              </div>
            </div>

            {/* 실시간 통계 */}
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-700/30">
              <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2 text-sm">
                {t('customers.segments.guide.howItWorks.stats.title')}
              </h4>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                {t('customers.segments.guide.howItWorks.stats.description')}
              </p>
            </div>

            {/* 다국어 지원 */}
            <div className="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-lg border border-emerald-200 dark:border-emerald-700/30">
              <div className="flex items-center gap-2 mb-2">
                <Globe className="w-4 h-4 text-emerald-500" />
                <h4 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
                  {t('customers.segments.guide.howItWorks.multilingual.title')}
                </h4>
              </div>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                {t('customers.segments.guide.howItWorks.multilingual.description')}
              </p>
            </div>
          </div>
        </section>

        {/* 활용 팁 */}
        <section className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-6 rounded-xl border border-blue-200 dark:border-blue-700/30">
          <div className="flex items-center gap-3 mb-4">
            <Star className="w-5 h-5 text-blue-500" />
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
              {t('customers.segments.guide.tips.title')}
            </h3>
          </div>
          <ul className="space-y-2">
            {getArrayFromTranslation('customers.segments.guide.tips.items').map((tip, idx) => (
              <li key={idx} className="flex items-start gap-3 text-sm text-gray-700 dark:text-gray-300">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                  {idx + 1}
                </div>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* CTA */}
        <section className="bg-gradient-to-r from-emerald-500 to-teal-500 p-8 rounded-2xl text-center text-white">
          <h3 className="text-2xl font-bold mb-3">
            {t('customers.segments.guide.cta.title')}
          </h3>
          <p className="text-emerald-50 mb-6">
            {t('customers.segments.guide.cta.description')}
          </p>
          <PrimaryButton
            onClick={handleCreateSegment}
            className="bg-white text-emerald-600 hover:bg-gray-100 font-semibold px-8 py-3 text-lg shadow-lg"
          >
            {t('customers.segments.guide.cta.createButton')}
          </PrimaryButton>
        </section>
      </div>
    </EnhancedModal>
  );
}
