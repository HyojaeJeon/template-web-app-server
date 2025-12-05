'use client';

import { useState } from 'react';
import { format } from '@/shared/utils/format';
import { useTranslation } from '@/shared/i18n';

/**
 * ReviewCard Component
 * 
 * Local 배달 앱 리뷰 카드 컴포넌트
 * - 별점 및 리뷰 내용 표시
 * - 사용자 정보 및 주문 정보
 * - 사진 첨부 지원
 * - 리뷰 응답 기능
 * - Local 현지화 지원
 * 
 * WCAG 2.1 준수, 키보드 네비게이션, 스크린 리더 지원
 * 
 * @param {Object} props - ReviewCard 컴포넌트 props
 * @param {Object} props.review - 리뷰 데이터
 * @param {Function} props.onReply - 리뷰 응답 콜백
 * @param {Function} props.onHelpful - 도움됨 버튼 콜백
 * @param {Function} props.onReport - 신고 버튼 콜백
 * @param {boolean} props.showActions - 액션 버튼 표시 여부
 * @param {boolean} props.compact - 간소화 모드
 * @param {string} props.className - 추가 CSS 클래스
 */
const ReviewCard = ({
  review = {
    id: '',
    rating: 5,
    comment: '',
    user: {
      name: '',
      avatar: '',
      verified: false
    },
    order: {
      items: [],
      total: 0,
      date: new Date()
    },
    photos: [],
    helpful: 0,
    reply: null,
    createdAt: new Date(),
    isVerified: false
  },
  onReply,
  onHelpful,
  onReport,
  showActions = true,
  compact = false,
  className = ''
}) => {
  const { language } = useTranslation();
  const [showFullComment, setShowFullComment] = useState(false);
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [selectedPhoto, setSelectedPhoto] = useState(null);

  // 별점 렌더링
  const renderStars = (rating, size = 'w-5 h-5') => {
    return [...Array(5)].map((_, index) => (
      <svg
        key={index}
        className={`${size} ${
          index < rating 
            ? 'text-yellow-400' 
            : 'text-gray-300 dark:text-gray-600'
        }`}
        fill="currentColor"
        viewBox="0 0 20 20"
        aria-hidden="true"
      >
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
    ));
  };

  // 리뷰 응답 제출
  const handleReplySubmit = () => {
    if (replyText.trim() && onReply) {
      onReply(review.id, replyText.trim());
      setReplyText('');
      setShowReplyForm(false);
    }
  };

  // 이미지 모달
  const PhotoModal = () => {
    if (!selectedPhoto) return null;

    return (
      <div 
        className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
        onClick={() => setSelectedPhoto(null)}
        role="dialog"
        aria-modal="true"
        aria-label="리뷰 사진 확대보기"
      >
        <div className="relative max-w-4xl max-h-full">
          <img
            src={selectedPhoto}
            alt="리뷰 사진"
            className="max-w-full max-h-full object-contain rounded-lg"
          />
          <button
            onClick={() => setSelectedPhoto(null)}
            className="absolute top-4 right-4 w-10 h-10 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white transition-colors"
            aria-label="닫기"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    );
  };

  const isLongComment = review.comment.length > 200;
  const displayComment = showFullComment || !isLongComment 
    ? review.comment 
    : review.comment.slice(0, 200) + '...';

  return (
    <>
      <div className={`bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-6 ${className}`}>
        {/* 헤더 */}
        <div className="flex items-start gap-4 mb-4">
          {/* 프로필 */}
          <div className="flex-shrink-0">
            {review.user.avatar ? (
              <img
                src={review.user.avatar}
                alt={review.user.name}
                className="w-12 h-12 rounded-full object-cover"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-teal-500 to-emerald-500 flex items-center justify-center">
                <span className="text-white font-semibold text-lg">
                  {review.user.name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
          </div>

          {/* 사용자 정보 및 별점 */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <h4 className="font-semibold text-gray-900 dark:text-white truncate">
                {review.user.name}
              </h4>
              
              {review.user.verified && (
                <div className="flex-shrink-0 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center" title="인증된 사용자">
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </div>

            {/* 별점 */}
            <div className="flex items-center gap-2 mb-2">
              <div className="flex" role="img" aria-label={`${review.rating}점 만점에 ${review.rating}점`}>
                {renderStars(review.rating)}
              </div>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {review.rating}/5
              </span>
              
              {review.isVerified && (
                <span className="text-xs bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-2 py-1 rounded-full font-medium">
                  주문 확인됨
                </span>
              )}
            </div>

            {/* 날짜 */}
            <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
              <span>
                {format.dateByLocale(review.createdAt, language, 'medium')}
              </span>
              {!compact && review.order && (
                <span>
                  주문 금액: {review.order.total.toLocaleString()}₫
                </span>
              )}
            </div>
          </div>
        </div>

        {/* 주문 정보 */}
        {!compact && review.order?.items?.length > 0 && (
          <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">주문 메뉴</h5>
            <div className="flex flex-wrap gap-1">
              {review.order.items.map((item, index) => (
                <span 
                  key={index}
                  className="text-xs bg-white dark:bg-gray-600 text-gray-600 dark:text-gray-300 px-2 py-1 rounded-md"
                >
                  {item.name} x{item.quantity}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* 리뷰 내용 */}
        {review.comment && (
          <div className="mb-4">
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
              {displayComment}
            </p>
            
            {isLongComment && (
              <button
                onClick={() => setShowFullComment(!showFullComment)}
                className="text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 text-sm font-medium mt-2 transition-colors"
              >
                {showFullComment ? '접기' : '더보기'}
              </button>
            )}
          </div>
        )}

        {/* 사진 */}
        {review.images?.length > 0 && (
          <div className="mb-4">
            <div className="flex flex-wrap gap-2">
              {review.images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedPhoto(image.imageUrl || image)}
                  className="relative w-20 h-20 rounded-lg overflow-hidden hover:opacity-80 transition-opacity focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  aria-label={`리뷰 사진 ${index + 1} 확대보기`}
                >
                  <img
                    src={image.imageUrl || image}
                    alt={`리뷰 사진 ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  
                  {/* 확대 아이콘 */}
                  <div className="absolute inset-0 bg-black/0 hover:bg-black/20 flex items-center justify-center transition-colors">
                    <svg className="w-5 h-5 text-white opacity-0 hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                    </svg>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 사장님 답글 */}
        {review.reply && (
          <div className="mb-4 ml-4 pl-4 border-l-2 border-teal-200 dark:border-teal-700">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-gradient-to-r from-teal-500 to-emerald-500 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="text-sm font-semibold text-gray-900 dark:text-white">사장님</span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {format.dateByLocale(review.reply.createdAt, language, 'short')}
              </span>
            </div>
            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
              {review.reply.text}
            </p>
          </div>
        )}

        {/* 액션 버튼들 */}
        {showActions && (
          <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-4">
              {/* 도움됨 버튼 */}
              <button
                onClick={() => onHelpful?.(review.id)}
                className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-teal-600 dark:hover:text-teal-400 transition-colors"
                aria-label={`도움됨 ${review.helpful || 0}개`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                </svg>
                <span className="text-sm">{review.helpful || 0}</span>
              </button>

              {/* 답글 버튼 */}
              {onReply && !review.reply && (
                <button
                  onClick={() => setShowReplyForm(!showReplyForm)}
                  className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-teal-600 dark:hover:text-teal-400 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <span className="text-sm">답글</span>
                </button>
              )}
            </div>

            {/* 신고 버튼 */}
            {onReport && (
              <button
                onClick={() => onReport(review.id)}
                className="text-gray-400 hover:text-red-500 transition-colors"
                aria-label="리뷰 신고"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.865-.833-2.635 0L4.232 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </button>
            )}
          </div>
        )}

        {/* 답글 작성 폼 */}
        {showReplyForm && (
          <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="고객님께 정중하고 친절한 답글을 작성해주세요..."
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
              rows={3}
              maxLength={500}
            />
            
            <div className="flex items-center justify-between mt-3">
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {replyText.length}/500자
              </span>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setShowReplyForm(false);
                    setReplyText('');
                  }}
                  className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                >
                  취소
                </button>
                <button
                  onClick={handleReplySubmit}
                  disabled={!replyText.trim()}
                  className="px-4 py-2 bg-gradient-to-r from-teal-500 to-emerald-500 text-white text-sm font-medium rounded-lg hover:from-teal-600 hover:to-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  답글 등록
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <PhotoModal />
    </>
  );
};

export default ReviewCard;