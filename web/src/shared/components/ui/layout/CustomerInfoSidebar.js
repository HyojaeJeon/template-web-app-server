/**
 * CustomerInfoSidebar - 고객 정보 사이드바 컴포넌트
 * Local App MVP - 점주용 웹 관리자
 * 작업리스트 섹션 6.3: 공통 UI 컴포넌트 - CustomerInfoSidebar
 */

'use client';

import React, { memo, useState, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  User,
  Phone,
  MapPin,
  Calendar,
  Star,
  ShoppingBag,
  MessageCircle,
  Clock,
  Award,
  Edit3,
  Save,
  X,
  ChevronDown,
  ChevronUp,
  Heart,
  Flag
} from 'lucide-react';

const CustomerInfoSidebar = memo(({
  customer,
  isOpen = false,
  onClose,
  onUpdateCustomerNotes,
  onUpdateCustomerTags,
  className = ''
}) => {
  const { t } = useTranslation(['chat', 'customers']);
  
  // 로컬 상태
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [isEditingTags, setIsEditingTags] = useState(false);
  const [customerNotes, setCustomerNotes] = useState(customer?.notes || '');
  const [customerTags, setCustomerTags] = useState(customer?.tags || []);
  const [newTag, setNewTag] = useState('');
  const [expandedSections, setExpandedSections] = useState({
    profile: true,
    orderHistory: true,
    chatHistory: false,
    satisfaction: false
  });

  // 고객이 없을 때
  if (!customer) {
    return (
      <div className={`${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      } fixed right-0 top-0 h-full w-80 bg-white shadow-xl z-50 transition-transform duration-300 ease-in-out ${className}`}>
        <div className="p-6 flex items-center justify-center h-full">
          <div className="text-center">
            <User size={48} className="text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">{t('chat:selectCustomerToView')}</p>
          </div>
        </div>
      </div>
    );
  }

  // 섹션 토글
  const toggleSection = useCallback((section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  }, []);

  // 노트 저장
  const handleSaveNotes = useCallback(async () => {
    try {
      await onUpdateCustomerNotes?.(customer.id, customerNotes);
      setIsEditingNotes(false);
    } catch (error) {
      console.error('고객 노트 저장 실패:', error);
    }
  }, [customer.id, customerNotes, onUpdateCustomerNotes]);

  // 태그 추가
  const handleAddTag = useCallback(() => {
    if (newTag.trim() && !customerTags.includes(newTag.trim())) {
      const updatedTags = [...customerTags, newTag.trim()];
      setCustomerTags(updatedTags);
      setNewTag('');
    }
  }, [newTag, customerTags]);

  // 태그 제거
  const handleRemoveTag = useCallback((tagToRemove) => {
    const updatedTags = customerTags.filter(tag => tag !== tagToRemove);
    setCustomerTags(updatedTags);
  }, [customerTags]);

  // 태그 저장
  const handleSaveTags = useCallback(async () => {
    try {
      await onUpdateCustomerTags?.(customer.id, customerTags);
      setIsEditingTags(false);
    } catch (error) {
      console.error('고객 태그 저장 실패:', error);
    }
  }, [customer.id, customerTags, onUpdateCustomerTags]);

  // 고객 등급 계산
  const getCustomerTier = useMemo(() => {
    const orderCount = customer.orderHistory?.length || 0;
    const totalSpent = customer.totalSpent || 0;
    
    if (orderCount >= 50 || totalSpent >= 5000000) {
      return { tier: 'VIP', color: 'text-purple-600', bgColor: 'bg-purple-100', icon: Award };
    } else if (orderCount >= 20 || totalSpent >= 2000000) {
      return { tier: 'GOLD', color: 'text-yellow-600', bgColor: 'bg-yellow-100', icon: Star };
    } else if (orderCount >= 5 || totalSpent >= 500000) {
      return { tier: 'SILVER', color: 'text-gray-600', bgColor: 'bg-gray-100', icon: Star };
    }
    return { tier: 'BRONZE', color: 'text-orange-600', bgColor: 'bg-orange-100', icon: User };
  }, [customer.orderHistory, customer.totalSpent]);

  // 만족도 평균 계산
  const averageSatisfaction = useMemo(() => {
    if (!customer.satisfactionHistory?.length) return null;
    const total = customer.satisfactionHistory.reduce((sum, record) => sum + record.rating, 0);
    return (total / customer.satisfactionHistory.length).toFixed(1);
  }, [customer.satisfactionHistory]);

  const TierIcon = getCustomerTier.icon;

  return (
    <div className={`${
      isOpen ? 'translate-x-0' : 'translate-x-full'
    } fixed right-0 top-0 h-full w-80 bg-white shadow-xl z-50 transition-transform duration-300 ease-in-out overflow-y-auto ${className}`}>
      
      {/* 헤더 */}
      <div className="sticky top-0 bg-white border-b border-gray-200 p-4 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <TierIcon size={20} className={getCustomerTier.color} />
            <h3 className="text-lg font-semibold text-gray-900 ml-2">
              {t('chat:customerInfo')}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* 고객 프로필 섹션 */}
        <div className="space-y-4">
          <button
            onClick={() => toggleSection('profile')}
            className="w-full flex items-center justify-between text-left"
          >
            <h4 className="text-base font-semibold text-gray-900">
              {t('chat:customerProfile')}
            </h4>
            {expandedSections.profile ? (
              <ChevronUp size={16} className="text-gray-500" />
            ) : (
              <ChevronDown size={16} className="text-gray-500" />
            )}
          </button>

          {expandedSections.profile && (
            <div className="space-y-4">
              {/* 기본 정보 */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                      <User size={24} className="text-primary" />
                    </div>
                    <div className="ml-3">
                      <h5 className="font-medium text-gray-900">
                        {customer.fullName || customer.name}
                      </h5>
                      <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getCustomerTier.bgColor} ${getCustomerTier.color}`}>
                        <TierIcon size={12} className="mr-1" />
                        {getCustomerTier.tier}
                      </div>
                    </div>
                  </div>
                  
                  {customer.isFavorite && (
                    <Heart size={16} className="text-red-500 fill-red-500" />
                  )}
                </div>

                {/* 연락처 정보 */}
                <div className="space-y-2">
                  {customer.phone && (
                    <div className="flex items-center">
                      <Phone size={14} className="text-gray-500" />
                      <span className="text-sm text-gray-700 ml-2">
                        {customer.phone}
                      </span>
                    </div>
                  )}

                  {customer.address && (
                    <div className="flex items-start">
                      <MapPin size={14} className="text-gray-500 mt-0.5" />
                      <span className="text-sm text-gray-700 ml-2 flex-1">
                        {customer.address}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center">
                    <Calendar size={14} className="text-gray-500" />
                    <span className="text-sm text-gray-700 ml-2">
                      {t('customers:memberSince')}: {new Date(customer.createdAt).toLocaleDateString('vi-VN')}
                    </span>
                  </div>
                </div>
              </div>

              {/* 주문 통계 */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-blue-50 rounded-lg p-3 text-center">
                  <ShoppingBag size={20} className="text-blue-600 mx-auto mb-1" />
                  <div className="text-lg font-semibold text-blue-900">
                    {customer.orderHistory?.length || 0}
                  </div>
                  <div className="text-xs text-blue-600">
                    {t('customers:totalOrders')}
                  </div>
                </div>
                
                <div className="bg-green-50 rounded-lg p-3 text-center">
                  <Star size={20} className="text-green-600 mx-auto mb-1" />
                  <div className="text-lg font-semibold text-green-900">
                    {averageSatisfaction || 'N/A'}
                  </div>
                  <div className="text-xs text-green-600">
                    {t('customers:avgRating')}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 주문 이력 섹션 */}
        <div className="space-y-4">
          <button
            onClick={() => toggleSection('orderHistory')}
            className="w-full flex items-center justify-between text-left"
          >
            <h4 className="text-base font-semibold text-gray-900">
              {t('chat:orderHistory')} ({customer.orderHistory?.length || 0})
            </h4>
            {expandedSections.orderHistory ? (
              <ChevronUp size={16} className="text-gray-500" />
            ) : (
              <ChevronDown size={16} className="text-gray-500" />
            )}
          </button>

          {expandedSections.orderHistory && (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {customer.orderHistory?.slice(0, 5).map((order, index) => (
                <div key={order.id || index} className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-900">
                      #{order.orderNumber || order.id}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      order.status === 'DELIVERED' 
                        ? 'bg-green-100 text-green-700'
                        : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {t(`orders:status.${order.status}`)}
                    </span>
                  </div>
                  
                  <div className="text-sm text-gray-600">
                    {new Date(order.createdAt).toLocaleDateString('vi-VN')}
                  </div>
                  
                  <div className="text-sm font-medium text-gray-900 mt-1">
                    {order.total?.toLocaleString('vi-VN')} VND
                  </div>
                </div>
              ))}
              
              {customer.orderHistory?.length === 0 && (
                <div className="text-center py-8">
                  <ShoppingBag size={32} className="text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">
                    {t('customers:noOrderHistory')}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 채팅 이력 섹션 */}
        <div className="space-y-4">
          <button
            onClick={() => toggleSection('chatHistory')}
            className="w-full flex items-center justify-between text-left"
          >
            <h4 className="text-base font-semibold text-gray-900">
              {t('chat:chatHistory')} ({customer.chatHistory?.length || 0})
            </h4>
            {expandedSections.chatHistory ? (
              <ChevronUp size={16} className="text-gray-500" />
            ) : (
              <ChevronDown size={16} className="text-gray-500" />
            )}
          </button>

          {expandedSections.chatHistory && (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {customer.chatHistory?.slice(0, 10).map((chat, index) => (
                <div key={chat.id || index} className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      <MessageCircle size={14} className="text-gray-500" />
                      <span className="text-sm text-gray-600 ml-2">
                        {chat.type === 'ORDER_INQUIRY' ? t('chat:orderInquiry') : t('chat:generalInquiry')}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {new Date(chat.createdAt).toLocaleDateString('vi-VN')}
                    </span>
                  </div>
                  
                  {chat.lastMessage && (
                    <p className="text-sm text-gray-700 line-clamp-2">
                      {chat.lastMessage}
                    </p>
                  )}
                  
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-gray-500">
                      {chat.messageCount} {t('chat:messages')}
                    </span>
                    {chat.responseTime && (
                      <span className="text-xs text-gray-500">
                        {t('chat:avgResponseTime')}: {chat.responseTime}min
                      </span>
                    )}
                  </div>
                </div>
              ))}
              
              {customer.chatHistory?.length === 0 && (
                <div className="text-center py-8">
                  <MessageCircle size={32} className="text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">
                    {t('chat:noChatHistory')}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 만족도 히스토리 섹션 */}
        <div className="space-y-4">
          <button
            onClick={() => toggleSection('satisfaction')}
            className="w-full flex items-center justify-between text-left"
          >
            <h4 className="text-base font-semibold text-gray-900">
              {t('chat:satisfactionHistory')}
            </h4>
            {expandedSections.satisfaction ? (
              <ChevronUp size={16} className="text-gray-500" />
            ) : (
              <ChevronDown size={16} className="text-gray-500" />
            )}
          </button>

          {expandedSections.satisfaction && (
            <div className="space-y-3">
              {/* 평균 만족도 */}
              {averageSatisfaction && (
                <div className="bg-yellow-50 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">
                      {t('customers:avgSatisfaction')}
                    </span>
                    <div className="flex items-center">
                      <Star size={16} className="text-yellow-500 fill-yellow-500" />
                      <span className="text-sm font-semibold text-yellow-700 ml-1">
                        {averageSatisfaction}/5.0
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* 최근 만족도 기록 */}
              <div className="max-h-40 overflow-y-auto space-y-2">
                {customer.satisfactionHistory?.slice(0, 5).map((record, index) => (
                  <div key={index} className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            size={12}
                            className={`${
                              i < record.rating
                                ? 'text-yellow-500 fill-yellow-500'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-xs text-gray-500">
                        {new Date(record.createdAt).toLocaleDateString('vi-VN')}
                      </span>
                    </div>
                    {record.comment && (
                      <p className="text-xs text-gray-600 mt-1">
                        "{record.comment}"
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 고객 메모 섹션 */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-base font-semibold text-gray-900">
              {t('chat:customerNotes')}
            </h4>
            <button
              onClick={() => {
                if (isEditingNotes) {
                  handleSaveNotes();
                } else {
                  setIsEditingNotes(true);
                }
              }}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              {isEditingNotes ? (
                <Save size={16} className="text-green-600" />
              ) : (
                <Edit3 size={16} className="text-gray-500" />
              )}
            </button>
          </div>

          {isEditingNotes ? (
            <div className="space-y-2">
              <textarea
                value={customerNotes}
                onChange={(e) => setCustomerNotes(e.target.value)}
                placeholder={t('chat:addCustomerNotes')}
                className="w-full p-3 border border-gray-300 rounded-lg resize-none h-24 text-sm"
                maxLength={500}
              />
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">
                  {customerNotes.length}/500
                </span>
                <button
                  onClick={() => {
                    setCustomerNotes(customer?.notes || '');
                    setIsEditingNotes(false);
                  }}
                  className="text-xs text-red-600 hover:text-red-700"
                >
                  {t('common:cancel')}
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 rounded-lg p-3 min-h-16">
              {customerNotes ? (
                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                  {customerNotes}
                </p>
              ) : (
                <p className="text-sm text-gray-500 italic">
                  {t('chat:noNotesYet')}
                </p>
              )}
            </div>
          )}
        </div>

        {/* 고객 태그 섹션 */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-base font-semibold text-gray-900">
              {t('chat:customerTags')}
            </h4>
            <button
              onClick={() => {
                if (isEditingTags) {
                  handleSaveTags();
                } else {
                  setIsEditingTags(true);
                }
              }}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              {isEditingTags ? (
                <Save size={16} className="text-green-600" />
              ) : (
                <Edit3 size={16} className="text-gray-500" />
              )}
            </button>
          </div>

          {/* 태그 목록 */}
          <div className="flex flex-wrap gap-2">
            {customerTags.map((tag, index) => (
              <div key={index} className="flex items-center bg-primary/10 rounded-full px-3 py-1">
                <span className="text-sm text-primary">{tag}</span>
                {isEditingTags && (
                  <button
                    onClick={() => handleRemoveTag(tag)}
                    className="ml-2"
                  >
                    <X size={12} className="text-primary" />
                  </button>
                )}
              </div>
            ))}
            
            {customerTags.length === 0 && !isEditingTags && (
              <p className="text-sm text-gray-500 italic w-full">
                {t('chat:noTagsYet')}
              </p>
            )}
          </div>

          {/* 태그 추가 */}
          {isEditingTags && (
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                placeholder={t('chat:addNewTag')}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                maxLength={20}
              />
              <button
                onClick={handleAddTag}
                disabled={!newTag.trim()}
                className="px-3 py-2 bg-primary text-white rounded-lg text-sm disabled:bg-gray-300"
              >
                {t('common:add')}
              </button>
            </div>
          )}
        </div>

        {/* 고객 활동 요약 */}
        <div className="bg-gradient-to-r from-primary/5 to-success/5 rounded-lg p-4">
          <h4 className="text-base font-semibold text-gray-900 mb-3">
            {t('chat:activitySummary')}
          </h4>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">{t('customers:lastOrder')}:</span>
              <span className="text-sm text-gray-900">
                {customer.lastOrderDate 
                  ? new Date(customer.lastOrderDate).toLocaleDateString('vi-VN')
                  : t('customers:noOrders')
                }
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">{t('customers:totalSpent')}:</span>
              <span className="text-sm font-medium text-gray-900">
                {(customer.totalSpent || 0).toLocaleString('vi-VN')} VND
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">{t('chat:lastChatDate')}:</span>
              <span className="text-sm text-gray-900">
                {customer.lastChatDate 
                  ? new Date(customer.lastChatDate).toLocaleDateString('vi-VN')
                  : t('chat:noChats')
                }
              </span>
            </div>
          </div>
        </div>

        {/* 빠른 액션 */}
        <div className="space-y-2">
          <h4 className="text-base font-semibold text-gray-900">
            {t('chat:quickActions')}
          </h4>
          
          <div className="grid grid-cols-2 gap-2">
            <button className="flex items-center justify-center p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
              <Phone size={16} className="text-blue-600" />
              <span className="text-sm text-blue-600 ml-2">
                {t('common:call')}
              </span>
            </button>
            
            <button className="flex items-center justify-center p-3 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors">
              <Flag size={16} className="text-purple-600" />
              <span className="text-sm text-purple-600 ml-2">
                {t('chat:markVIP')}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

CustomerInfoSidebar.displayName = 'CustomerInfoSidebar';

export default CustomerInfoSidebar;