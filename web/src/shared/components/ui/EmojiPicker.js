/**
 * Emoji Picker Component - Dropdown Style with Portal
 * 이모티콘 선택 드롭다운 (Portal 기반)
 */
'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { FaceSmileIcon, HeartIcon, FireIcon, StarIcon, SparklesIcon, HandThumbUpIcon } from '@heroicons/react/24/outline';
import { XMarkIcon } from '@heroicons/react/24/solid';

// 카테고리별 이모티콘 데이터
const EMOJI_CATEGORIES = [
  {
    id: 'smileys',
    name: '스마일 & 감정',
    icon: FaceSmileIcon,
    emojis: [
      '😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂',
      '🙂', '🙃', '😉', '😊', '😇', '🥰', '😍', '🤩',
      '😘', '😗', '😚', '😙', '🥲', '😋', '😛', '😜',
      '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔', '🤐',
      '🤨', '😐', '😑', '😶', '😏', '😒', '🙄', '😬',
      '🤥', '😌', '😔', '😪', '🤤', '😴', '😷', '🤒'
    ]
  },
  {
    id: 'gestures',
    name: '손동작 & 제스처',
    icon: HandThumbUpIcon,
    emojis: [
      '👋', '🤚', '🖐', '✋', '🖖', '👌', '🤌', '🤏',
      '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆',
      '🖕', '👇', '☝️', '👍', '👎', '✊', '👊', '🤛',
      '🤜', '👏', '🙌', '👐', '🤲', '🤝', '🙏', '✍️'
    ]
  },
  {
    id: 'hearts',
    name: '하트 & 사랑',
    icon: HeartIcon,
    emojis: [
      '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍',
      '🤎', '💔', '❤️‍🔥', '❤️‍🩹', '💕', '💞', '💓', '💗',
      '💖', '💘', '💝', '💟', '♥️', '💌', '💋', '💏'
    ]
  },
  {
    id: 'animals',
    name: '동물 & 자연',
    icon: SparklesIcon,
    emojis: [
      '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼',
      '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🐔',
      '🐧', '🐦', '🐤', '🦆', '🦅', '🦉', '🦇', '🐺',
      '🐗', '🐴', '🦄', '🐝', '🐛', '🦋', '🐌', '🐞'
    ]
  },
  {
    id: 'food',
    name: '음식 & 음료',
    icon: FireIcon,
    emojis: [
      '🍏', '🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇',
      '🍓', '🫐', '🍈', '🍒', '🍑', '🥭', '🍍', '🥥',
      '🥝', '🍅', '🍆', '🥑', '🥦', '🥬', '🥒', '🌶',
      '🫑', '🌽', '🥕', '🫒', '🧄', '🧅', '🥔', '🍠',
      '🍞', '🥐', '🥖', '🫓', '🥨', '🥯', '🥞', '🧇',
      '🧀', '🍖', '🍗', '🥩', '🥓', '🍔', '🍟', '🍕',
      '🌭', '🥪', '🌮', '🌯', '🫔', '🥙', '🧆', '🍳',
      '🥘', '🍲', '🫕', '🥣', '🥗', '🍿', '🧈', '🧂'
    ]
  },
  {
    id: 'activities',
    name: '활동 & 스포츠',
    icon: StarIcon,
    emojis: [
      '⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉',
      '🥏', '🎱', '🪀', '🏓', '🏸', '🏒', '🏑', '🥍',
      '🏏', '🪃', '🥅', '⛳', '🪁', '🏹', '🎣', '🤿',
      '🥊', '🥋', '🎽', '🛹', '🛼', '🛷', '⛸', '🥌',
      '🎿', '⛷', '🏂', '🪂', '🏋️', '🤼', '🤸', '🤺'
    ]
  },
  {
    id: 'objects',
    name: '물건 & 아이템',
    icon: SparklesIcon,
    emojis: [
      '💼', '📁', '📂', '🗂', '📅', '📆', '🗒', '🗓',
      '📇', '📈', '📉', '📊', '📋', '📌', '📍', '📎',
      '🖇', '📏', '📐', '✂️', '🗃', '🗄', '🗑', '🔒',
      '🔓', '🔏', '🔐', '🔑', '🗝', '🔨', '🪓', '⛏',
      '⚒', '🛠', '🗡', '⚔️', '🔫', '🪃', '🏹', '🛡',
      '🪚', '🔧', '🪛', '🔩', '⚙️', '🗜', '⚖️', '🦯'
    ]
  },
  {
    id: 'symbols',
    name: '기호 & 심볼',
    icon: StarIcon,
    emojis: [
      '✅', '☑️', '✔️', '✖️', '❌', '❎', '➕', '➖',
      '➗', '✏️', '📝', '💯', '💢', '💥', '💫', '💦',
      '💨', '🕳', '💬', '👁️‍🗨️', '🗨', '🗯', '💭', '💤',
      '⭐', '🌟', '✨', '⚡', '💥', '🔥', '☄️', '💫'
    ]
  }
];

export default function EmojiPicker({ isOpen, onClose, onEmojiSelect, triggerRef }) {
  const [selectedCategory, setSelectedCategory] = useState('smileys');
  const [searchQuery, setSearchQuery] = useState('');
  const [position, setPosition] = useState({ top: 0, left: 0, direction: 'bottom' });
  const [mounted, setMounted] = useState(false);
  const dropdownRef = useRef(null);

  // 클라이언트 사이드에서만 렌더링
  useEffect(() => {
    setMounted(true);
  }, []);

  // 드롭다운 위치 계산
  useEffect(() => {
    if (!isOpen || !triggerRef?.current || !mounted) return;

    const updatePosition = () => {
      const triggerRect = triggerRef.current.getBoundingClientRect();
      const dropdownHeight = 420; // 드롭다운 예상 높이
      const dropdownWidth = 400; // 드롭다운 너비
      const padding = 8; // 여백

      // 화면 경계 확인
      const viewportHeight = window.innerHeight;
      const viewportWidth = window.innerWidth;
      const spaceBelow = viewportHeight - triggerRect.bottom;
      const spaceAbove = triggerRect.top;
      const spaceRight = viewportWidth - triggerRect.right;

      // 상단/하단 방향 결정
      const direction = spaceBelow >= dropdownHeight || spaceBelow >= spaceAbove ? 'bottom' : 'top';

      // 좌우 위치 계산 (우측 정렬)
      let left = triggerRect.right - dropdownWidth;

      // 좌측 경계를 벗어나면 조정
      if (left < padding) {
        left = padding;
      }

      // 우측 경계를 벗어나면 조정
      if (left + dropdownWidth > viewportWidth - padding) {
        left = viewportWidth - dropdownWidth - padding;
      }

      // 상하 위치 계산
      const top = direction === 'bottom'
        ? triggerRect.bottom + padding
        : triggerRect.top - dropdownHeight - padding;

      setPosition({ top, left, direction });
    };

    updatePosition();

    // 스크롤/리사이즈 시 위치 재계산
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);

    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [isOpen, triggerRef, mounted]);

  // 외부 클릭 감지
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        triggerRef?.current &&
        !triggerRef.current.contains(event.target)
      ) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose, triggerRef]);

  // ESC 키로 닫기
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen || !mounted) return null;

  const currentCategory = EMOJI_CATEGORIES.find(cat => cat.id === selectedCategory);

  // 검색 필터링
  const filteredEmojis = searchQuery
    ? currentCategory.emojis.filter(emoji => emoji.includes(searchQuery))
    : currentCategory.emojis;

  const dropdown = (
    <div
      ref={dropdownRef}
      className="fixed z-[9999]"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
        width: '400px',
      }}
    >
      <div
        className={`bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col ${
          position.direction === 'top' ? 'animate-in slide-in-from-bottom-2' : 'animate-in slide-in-from-top-2'
        }`}
        style={{ maxHeight: '420px' }}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
            이모티콘 선택
          </h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
          >
            <XMarkIcon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* 검색 바 */}
        <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="이모티콘 검색..."
            className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
          />
        </div>

        {/* 카테고리 탭 */}
        <div className="flex items-center space-x-1 px-4 py-2 border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
          {EMOJI_CATEGORIES.map(category => {
            const Icon = category.icon;
            return (
              <button
                key={category.id}
                onClick={() => {
                  setSelectedCategory(category.id);
                  setSearchQuery('');
                }}
                className={`flex-shrink-0 p-1.5 rounded transition-colors ${
                  selectedCategory === category.id
                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400'
                }`}
                title={category.name}
              >
                <Icon className="h-4 w-4" />
              </button>
            );
          })}
        </div>

        {/* 이모티콘 그리드 */}
        <div className="flex-1 overflow-y-auto p-3">
          <div className="grid grid-cols-8 gap-1">
            {filteredEmojis.map((emoji, index) => (
              <button
                key={`${emoji}-${index}`}
                onClick={() => {
                  onEmojiSelect(emoji);
                  onClose();
                }}
                className="text-2xl p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors cursor-pointer"
              >
                {emoji}
              </button>
            ))}
          </div>

          {filteredEmojis.length === 0 && (
            <div className="text-center py-8 text-sm text-gray-500 dark:text-gray-400">
              검색 결과가 없습니다
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(dropdown, document.body);
}
