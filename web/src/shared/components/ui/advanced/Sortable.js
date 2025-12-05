'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { ChevronUpIcon, ChevronDownIcon, Bars3Icon } from '@heroicons/react/24/outline';

/**
 * 정렬 가능한 리스트 컴포넌트 (WCAG 2.1 준수)
 * Local 테마 컬러와 다크모드 지원
 * 
 * @param {Object} props - 컴포넌트 props
 * @param {Array} props.items - 정렬할 아이템 배열
 * @param {Function} props.onSort - 정렬 변경 핸들러
 * @param {Function} props.renderItem - 아이템 렌더링 함수
 * @param {string} props.keyExtractor - 키 추출 함수 또는 속성명
 * @param {boolean} props.disabled - 비활성화 여부
 * @param {boolean} props.showHandle - 드래그 핸들 표시 여부
 * @param {string} props.direction - 정렬 방향 ('vertical' | 'horizontal')
 */
const Sortable = ({
  items = [],
  onSort,
  renderItem,
  keyExtractor = 'id',
  disabled = false,
  showHandle = true,
  direction = 'vertical',
  className = '',
  ...props
}) => {
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const [keyboardSelectedIndex, setKeyboardSelectedIndex] = useState(null);
  const [sortedItems, setSortedItems] = useState(items);
  
  const listRef = useRef(null);
  const itemRefs = useRef([]);

  // 아이템 업데이트
  useEffect(() => {
    setSortedItems(items);
  }, [items]);

  // 키 추출 함수
  const getKey = useCallback((item, index) => {
    if (typeof keyExtractor === 'function') {
      return keyExtractor(item, index);
    }
    return item[keyExtractor] || index;
  }, [keyExtractor]);

  // 아이템 이동
  const moveItem = useCallback((fromIndex, toIndex) => {
    if (fromIndex === toIndex || disabled) return;

    const newItems = [...sortedItems];
    const [movedItem] = newItems.splice(fromIndex, 1);
    newItems.splice(toIndex, 0, movedItem);

    setSortedItems(newItems);

    if (onSort) {
      onSort(newItems, fromIndex, toIndex);
    }
  }, [sortedItems, disabled, onSort]);

  // 드래그 시작
  const handleDragStart = useCallback((e, index) => {
    if (disabled) return;
    
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
    
    // 드래그 이미지 설정
    if (itemRefs.current[index]) {
      e.dataTransfer.setDragImage(itemRefs.current[index], 0, 0);
    }
  }, [disabled]);

  // 드래그 종료
  const handleDragEnd = useCallback(() => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  }, []);

  // 드래그 오버
  const handleDragOver = useCallback((e, index) => {
    e.preventDefault();
    if (disabled) return;
    
    setDragOverIndex(index);
    e.dataTransfer.dropEffect = 'move';
  }, [disabled]);

  // 드래그 리브
  const handleDragLeave = useCallback((e) => {
    if (!listRef.current?.contains(e.relatedTarget)) {
      setDragOverIndex(null);
    }
  }, []);

  // 드롭
  const handleDrop = useCallback((e, index) => {
    e.preventDefault();
    if (disabled) return;

    const draggedIdx = parseInt(e.dataTransfer.getData('text/plain'));
    moveItem(draggedIdx, index);
    
    setDraggedIndex(null);
    setDragOverIndex(null);
  }, [disabled, moveItem]);

  // 키보드 네비게이션
  const handleKeyDown = useCallback((e, index) => {
    if (disabled) return;

    const { key, ctrlKey, altKey } = e;

    switch (key) {
      case ' ':
      case 'Enter':
        if (ctrlKey) {
          // Ctrl + Space/Enter로 선택 모드 토글
          e.preventDefault();
          setKeyboardSelectedIndex(keyboardSelectedIndex === index ? null : index);
        }
        break;
        
      case 'ArrowUp':
        if (direction === 'vertical') {
          e.preventDefault();
          if (keyboardSelectedIndex === index && altKey) {
            // Alt + ArrowUp으로 위로 이동
            moveItem(index, Math.max(0, index - 1));
          } else {
            // 포커스 이동
            const prevIndex = Math.max(0, index - 1);
            itemRefs.current[prevIndex]?.focus();
          }
        }
        break;
        
      case 'ArrowDown':
        if (direction === 'vertical') {
          e.preventDefault();
          if (keyboardSelectedIndex === index && altKey) {
            // Alt + ArrowDown으로 아래로 이동
            moveItem(index, Math.min(sortedItems.length - 1, index + 1));
          } else {
            // 포커스 이동
            const nextIndex = Math.min(sortedItems.length - 1, index + 1);
            itemRefs.current[nextIndex]?.focus();
          }
        }
        break;
        
      case 'ArrowLeft':
        if (direction === 'horizontal') {
          e.preventDefault();
          if (keyboardSelectedIndex === index && altKey) {
            moveItem(index, Math.max(0, index - 1));
          } else {
            const prevIndex = Math.max(0, index - 1);
            itemRefs.current[prevIndex]?.focus();
          }
        }
        break;
        
      case 'ArrowRight':
        if (direction === 'horizontal') {
          e.preventDefault();
          if (keyboardSelectedIndex === index && altKey) {
            moveItem(index, Math.min(sortedItems.length - 1, index + 1));
          } else {
            const nextIndex = Math.min(sortedItems.length - 1, index + 1);
            itemRefs.current[nextIndex]?.focus();
          }
        }
        break;
        
      case 'Home':
        e.preventDefault();
        if (keyboardSelectedIndex === index && altKey) {
          // Alt + Home으로 맨 처음으로 이동
          moveItem(index, 0);
        } else {
          itemRefs.current[0]?.focus();
        }
        break;
        
      case 'End':
        e.preventDefault();
        if (keyboardSelectedIndex === index && altKey) {
          // Alt + End로 맨 마지막으로 이동
          moveItem(index, sortedItems.length - 1);
        } else {
          itemRefs.current[sortedItems.length - 1]?.focus();
        }
        break;
        
      case 'Escape':
        e.preventDefault();
        setKeyboardSelectedIndex(null);
        break;
    }
  }, [disabled, direction, keyboardSelectedIndex, moveItem, sortedItems.length]);

  // 정렬 버튼 클릭
  const handleSortClick = useCallback((index, direction) => {
    if (disabled) return;
    
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex >= 0 && targetIndex < sortedItems.length) {
      moveItem(index, targetIndex);
    }
  }, [disabled, moveItem, sortedItems.length]);

  return (
    <div
      ref={listRef}
      role="application"
      aria-label="정렬 가능한 리스트"
      className={`sortable-list ${direction === 'horizontal' ? 'flex flex-wrap gap-2' : 'space-y-2'} ${className}`}
      {...props}
    >
      {/* 사용 방법 안내 */}
      <div className="sr-only" aria-live="polite">
        Ctrl+Space로 항목을 선택하고, Alt+화살표키로 이동하세요. ESC로 선택을 해제할 수 있습니다.
      </div>

      {sortedItems.map((item, index) => {
        const key = getKey(item, index);
        const isDragged = draggedIndex === index;
        const isDropTarget = dragOverIndex === index;
        const isKeyboardSelected = keyboardSelectedIndex === index;
        const isFirst = index === 0;
        const isLast = index === sortedItems.length - 1;

        return (
          <div
            key={key}
            ref={(el) => (itemRefs.current[index] = el)}
            draggable={!disabled}
            onDragStart={(e) => handleDragStart(e, index)}
            onDragEnd={handleDragEnd}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, index)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            tabIndex={disabled ? -1 : 0}
            role="button"
            aria-grabbed={isDragged}
            aria-describedby={`sortable-item-help-${key}`}
            className={`
              sortable-item relative group transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-mint-500/50
              ${isDragged ? 'opacity-50 scale-105 z-10' : ''}
              ${isDropTarget ? 'border-2 border-dashed border-mint-500 bg-mint-50 dark:bg-mint-900/20' : ''}
              ${isKeyboardSelected ? 'ring-2 ring-mint-500 bg-mint-50 dark:bg-mint-900/20' : ''}
              ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-grab active:cursor-grabbing'}
              ${direction === 'horizontal' ? 'inline-block' : 'block'}
            `}
          >
            <div className="flex items-center gap-2">
              {/* 드래그 핸들 */}
              {showHandle && (
                <div className="drag-handle flex flex-col items-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Bars3Icon 
                    className="w-4 h-4 text-gray-400 dark:text-gray-500" 
                    aria-hidden="true"
                  />
                </div>
              )}

              {/* 정렬 버튼 */}
              {!showHandle && (
                <div className="sort-buttons flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    type="button"
                    onClick={() => handleSortClick(index, 'up')}
                    disabled={disabled || isFirst}
                    className={`
                      p-1 rounded text-xs transition-colors
                      ${disabled || isFirst ? 
                        'text-gray-300 dark:text-gray-600 cursor-not-allowed' : 
                        'text-gray-500 hover:text-mint-600 dark:text-gray-400 dark:hover:text-mint-400'
                      }
                    `}
                    aria-label="위로 이동"
                  >
                    <ChevronUpIcon className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSortClick(index, 'down')}
                    disabled={disabled || isLast}
                    className={`
                      p-1 rounded text-xs transition-colors
                      ${disabled || isLast ? 
                        'text-gray-300 dark:text-gray-600 cursor-not-allowed' : 
                        'text-gray-500 hover:text-mint-600 dark:text-gray-400 dark:hover:text-mint-400'
                      }
                    `}
                    aria-label="아래로 이동"
                  >
                    <ChevronDownIcon className="w-3 h-3" />
                  </button>
                </div>
              )}

              {/* 아이템 내용 */}
              <div className="flex-1">
                {renderItem ? renderItem(item, index) : (
                  <div className="p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                    {typeof item === 'string' ? item : JSON.stringify(item)}
                  </div>
                )}
              </div>

              {/* 순서 표시 */}
              <div className="order-indicator text-xs text-gray-500 dark:text-gray-400 font-mono">
                {index + 1}
              </div>
            </div>

            {/* 스크린 리더용 설명 */}
            <div id={`sortable-item-help-${key}`} className="sr-only">
              {isKeyboardSelected ? 
                `선택됨. Alt+화살표키로 이동하거나 ESC로 선택 해제하세요.` : 
                `항목 ${index + 1}/${sortedItems.length}. Ctrl+Space로 선택하세요.`
              }
            </div>
          </div>
        );
      })}

      {/* 빈 상태 */}
      {sortedItems.length === 0 && (
        <div className="empty-state text-center py-8 text-gray-500 dark:text-gray-400">
          정렬할 항목이 없습니다.
        </div>
      )}
    </div>
  );
};

export default Sortable;