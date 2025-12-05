'use client';

import { useState, useRef, useEffect, createContext, useContext, useCallback } from 'react';
import { ArrowsPointingOutIcon, Bars3Icon } from '@heroicons/react/24/outline';

// DragAndDrop 컨텍스트
const DragDropContext = createContext();

/**
 * 드래그 앤 드롭 컨테이너 컴포넌트 (WCAG 2.1 준수)
 * Local 테마 컬러와 다크모드 지원
 * 
 * @param {Object} props - 컴포넌트 props
 * @param {Function} props.onDragStart - 드래그 시작 핸들러
 * @param {Function} props.onDragEnd - 드래그 종료 핸들러
 * @param {Function} props.onDrop - 드롭 핸들러
 * @param {Function} props.onReorder - 순서 변경 핸들러
 * @param {string} props.dropZoneText - 드롭존 텍스트
 * @param {boolean} props.disabled - 비활성화 여부
 * @param {string} props.direction - 드래그 방향 ('vertical' | 'horizontal' | 'both')
 */
const DragAndDrop = ({
  children,
  onDragStart,
  onDragEnd,
  onDrop,
  onReorder,
  dropZoneText = '여기에 항목을 드롭하세요',
  disabled = false,
  direction = 'vertical',
  className = ''
}) => {
  const [draggedItem, setDraggedItem] = useState(null);
  const [draggedOver, setDraggedOver] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dropZones, setDropZones] = useState([]);

  // 드래그 시작 핸들러
  const handleDragStart = useCallback((item, index, event) => {
    if (disabled) return;
    
    setDraggedItem({ ...item, index });
    setIsDragging(true);
    
    // 드래그 이미지 설정
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', JSON.stringify({ ...item, index }));
    }
    
    if (onDragStart) {
      onDragStart(item, index, event);
    }
  }, [disabled, onDragStart]);

  // 드래그 종료 핸들러
  const handleDragEnd = useCallback((event) => {
    setDraggedItem(null);
    setDraggedOver(null);
    setIsDragging(false);
    
    if (onDragEnd) {
      onDragEnd(event);
    }
  }, [onDragEnd]);

  // 드래그오버 핸들러
  const handleDragOver = useCallback((index, event) => {
    event.preventDefault();
    if (disabled) return;
    
    setDraggedOver(index);
    
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move';
    }
  }, [disabled]);

  // 드롭 핸들러
  const handleDrop = useCallback((targetIndex, event) => {
    event.preventDefault();
    if (disabled || !draggedItem) return;
    
    const sourceIndex = draggedItem.index;
    
    if (sourceIndex !== targetIndex) {
      if (onReorder) {
        onReorder(sourceIndex, targetIndex, draggedItem);
      }
      
      if (onDrop) {
        onDrop(draggedItem, targetIndex, event);
      }
    }
    
    setDraggedOver(null);
  }, [disabled, draggedItem, onReorder, onDrop]);

  // 드롭존 등록
  const registerDropZone = useCallback((id) => {
    setDropZones(prev => [...prev, id]);
    return () => {
      setDropZones(prev => prev.filter(zoneId => zoneId !== id));
    };
  }, []);

  // 컨텍스트 값
  const contextValue = {
    draggedItem,
    draggedOver,
    isDragging,
    direction,
    disabled,
    handleDragStart,
    handleDragEnd,
    handleDragOver,
    handleDrop,
    registerDropZone
  };

  return (
    <DragDropContext.Provider value={contextValue}>
      <div 
        className={`drag-drop-container ${isDragging ? 'dragging' : ''} ${className}`}
        role="application"
        aria-label="드래그 앤 드롭 컨테이너"
      >
        {children}
      </div>
    </DragDropContext.Provider>
  );
};

/**
 * 드래그 가능한 아이템 컴포넌트
 */
const DraggableItem = ({
  item,
  index,
  children,
  dragHandle = false,
  className = '',
  disabled: externalDisabled = false,
  ...props
}) => {
  const context = useContext(DragDropContext);
  
  // 개발 환경에서 컨텍스트 사용 경고
  if (process.env.NODE_ENV === 'development' && !context) {
    console.warn('DraggableItem은 DragAndDrop 컴포넌트 내부에서 사용하는 것이 권장됩니다.');
  }
  
  // Context가 없을 때 기본값과 함수 제공
  const {
    draggedItem = null,
    draggedOver = null,
    isDragging = false,
    disabled = externalDisabled,
    handleDragStart = () => {},
    handleDragEnd = () => {},
    handleDragOver = () => {},
    handleDrop = () => {}
  } = context || {};

  const itemRef = useRef(null);
  const isDraggedItem = draggedItem?.index === index;
  const isDropTarget = draggedOver === index;
  const isBeingDragged = isDragging && isDraggedItem;

  // 키보드 네비게이션
  const handleKeyDown = (event) => {
    if (disabled) return;
    
    const { key, ctrlKey } = event;
    
    if (key === ' ' && ctrlKey) {
      // Ctrl + Space로 드래그 모드 시작
      event.preventDefault();
      handleDragStart(item, index, { dataTransfer: null });
    } else if (key === 'Escape') {
      // ESC로 드래그 취소
      handleDragEnd();
    }
  };

  return (
    <div
      ref={itemRef}
      draggable={!disabled && !dragHandle}
      onDragStart={(e) => handleDragStart(item, index, e)}
      onDragEnd={handleDragEnd}
      onDragOver={(e) => handleDragOver(index, e)}
      onDrop={(e) => handleDrop(index, e)}
      onKeyDown={handleKeyDown}
      tabIndex={disabled ? -1 : 0}
      className={`
        draggable-item transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-mint-500/50
        ${isBeingDragged ? 'opacity-50 scale-105 shadow-lg z-50' : ''}
        ${isDropTarget ? 'border-2 border-dashed border-mint-500 bg-mint-50 dark:bg-mint-900/20' : ''}
        ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-grab active:cursor-grabbing'}
        ${className}
      `}
      role="button"
      aria-grabbed={isDraggedItem}
      aria-label={`드래그 가능한 항목 ${index + 1}${isDraggedItem ? ' (드래그 중)' : ''}`}
      {...props}
    >
      {dragHandle && (
        <DragHandle item={item} index={index} />
      )}
      {children}
    </div>
  );
};

/**
 * 드래그 핸들 컴포넌트
 */
const DragHandle = ({ item, index, className = '', disabled: externalDisabled = false }) => {
  const context = useContext(DragDropContext);
  
  // 개발 환경에서 컨텍스트 사용 경고
  if (process.env.NODE_ENV === 'development' && !context) {
    console.warn('DragHandle은 DragAndDrop 컴포넌트 내부에서 사용하는 것이 권장됩니다.');
  }
  
  // Context가 없을 때 기본값 사용
  const { 
    disabled = externalDisabled, 
    handleDragStart = () => {}, 
    handleDragEnd = () => {} 
  } = context || {};

  return (
    <div
      draggable={!disabled}
      onDragStart={(e) => handleDragStart(item, index, e)}
      onDragEnd={handleDragEnd}
      className={`
        drag-handle inline-flex items-center justify-center p-2 cursor-grab active:cursor-grabbing
        text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300
        transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-mint-500/50
        ${disabled ? 'cursor-not-allowed opacity-50' : ''}
        ${className}
      `}
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-label="드래그 핸들"
    >
      <Bars3Icon className="w-5 h-5" />
    </div>
  );
};

/**
 * 드롭존 컴포넌트
 */
const DropZone = ({
  onDrop,
  children,
  text = '여기에 드롭하세요',
  acceptTypes = [],
  className = '',
  disabled: externalDisabled = false,
  ...props
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const context = useContext(DragDropContext);
  
  // 개발 환경에서 컨텍스트 사용 경고 (DropZone은 독립적으로 사용할 수 있으므로 warning level 낮춤)
  if (process.env.NODE_ENV === 'development' && !context) {
    console.info('DropZone: DragAndDrop 컴포넌트와 함께 사용하면 더 많은 기능을 사용할 수 있습니다.');
  }
  
  // Context가 없을 때 기본값 사용 (컴포넌트가 독립적으로 사용될 때)
  const { isDragging = false, disabled = externalDisabled } = context || {};
  const dropZoneRef = useRef(null);

  const handleDragEnter = (event) => {
    event.preventDefault();
    if (disabled) return;
    setIsHovered(true);
  };

  const handleDragLeave = (event) => {
    event.preventDefault();
    if (disabled) return;
    
    // 실제로 드롭존을 벗어났는지 확인
    if (!dropZoneRef.current?.contains(event.relatedTarget)) {
      setIsHovered(false);
    }
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    if (disabled) return;
    
    event.dataTransfer.dropEffect = 'copy';
  };

  const handleDrop = (event) => {
    event.preventDefault();
    if (disabled) return;
    
    setIsHovered(false);
    
    try {
      const data = event.dataTransfer.getData('text/plain');
      const parsedData = JSON.parse(data);
      
      if (onDrop) {
        onDrop(parsedData, event);
      }
    } catch (error) {
      console.warn('드롭 데이터 파싱 실패:', error);
    }
  };

  return (
    <div
      ref={dropZoneRef}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className={`
        drop-zone border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200
        ${isHovered || (isDragging && !disabled) ? 
          'border-mint-500 bg-mint-50 dark:bg-mint-900/20' : 
          'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50'
        }
        ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
        ${className}
      `}
      role="region"
      aria-label="드롭존"
      {...props}
    >
      {children || (
        <div className="flex flex-col items-center gap-3">
          <ArrowsPointingOutIcon 
            className={`w-8 h-8 ${
              isHovered ? 'text-mint-600 dark:text-mint-400' : 'text-gray-400 dark:text-gray-500'
            }`}
            aria-hidden="true"
          />
          <p className={`text-sm font-medium ${
            isHovered ? 'text-mint-600 dark:text-mint-400' : 'text-gray-500 dark:text-gray-400'
          }`}>
            {text}
          </p>
        </div>
      )}
    </div>
  );
};

/**
 * 드래그 앤 드롭 훅
 */
export const useDragAndDrop = (items = [], onReorder) => {
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [orderedItems, setOrderedItems] = useState(items);

  useEffect(() => {
    setOrderedItems(items);
  }, [items]);

  const moveItem = useCallback((fromIndex, toIndex) => {
    if (fromIndex === toIndex) return;

    const newItems = [...orderedItems];
    const draggedItem = newItems[fromIndex];
    
    newItems.splice(fromIndex, 1);
    newItems.splice(toIndex, 0, draggedItem);
    
    setOrderedItems(newItems);
    
    if (onReorder) {
      onReorder(fromIndex, toIndex, newItems);
    }
  }, [orderedItems, onReorder]);

  const handleDragStart = useCallback((item, index) => {
    setDraggedIndex(index);
  }, []);

  const handleDragEnd = useCallback(() => {
    setDraggedIndex(null);
  }, []);

  const handleReorder = useCallback((fromIndex, toIndex) => {
    moveItem(fromIndex, toIndex);
  }, [moveItem]);

  return {
    items: orderedItems,
    draggedIndex,
    handleDragStart,
    handleDragEnd,
    handleReorder,
    moveItem
  };
};

// 컴포넌트 결합
DragAndDrop.Item = DraggableItem;
DragAndDrop.Handle = DragHandle;
DragAndDrop.DropZone = DropZone;

export default DragAndDrop;