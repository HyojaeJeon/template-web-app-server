'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';

const RepeaterField = ({
  name = 'repeater',
  value = [],
  onChange,
  children,
  className = '',
  maxItems = 20,
  minItems = 0,
  addButtonText = '항목 추가',
  removeButtonText = '삭제',
  emptyMessage = '항목이 없습니다. 새 항목을 추가해보세요.',
  sortable = false,
  allowEmpty = true,
  defaultValue = {},
  renderItem,
  renderAddButton,
  renderRemoveButton,
  onAdd,
  onRemove,
  onReorder,
  'data-testid': testId,
  'aria-label': ariaLabel = '반복 필드',
  ...props
}) => {
  const [items, setItems] = useState(value || []);
  const [draggedItem, setDraggedItem] = useState(null);
  const containerRef = useRef(null);

  useEffect(() => {
    setItems(value || []);
  }, [value]);

  const handleItemsChange = useCallback((newItems) => {
    setItems(newItems);
    if (onChange) {
      onChange(newItems);
    }
  }, [onChange]);

  const addItem = useCallback(() => {
    if (items.length >= maxItems) return;

    const newItem = typeof defaultValue === 'function' ? defaultValue() : { ...defaultValue };
    const newItems = [...items, newItem];
    
    handleItemsChange(newItems);
    
    if (onAdd) {
      onAdd(newItem, items.length);
    }

    // 새로 추가된 항목으로 포커스 이동 (접근성)
    setTimeout(() => {
      const newItemElement = containerRef.current?.querySelector(`[data-item-index="${items.length}"]`);
      if (newItemElement) {
        const firstInput = newItemElement.querySelector('input, select, textarea, button');
        firstInput?.focus();
      }
    }, 100);
  }, [items, maxItems, defaultValue, handleItemsChange, onAdd]);

  const removeItem = useCallback((index) => {
    if (items.length <= minItems) return;

    const itemToRemove = items[index];
    const newItems = items.filter((_, i) => i !== index);
    
    handleItemsChange(newItems);
    
    if (onRemove) {
      onRemove(itemToRemove, index);
    }

    // 이전 항목으로 포커스 이동 (접근성)
    setTimeout(() => {
      const targetIndex = Math.max(0, index - 1);
      const targetElement = containerRef.current?.querySelector(`[data-item-index="${targetIndex}"]`);
      if (targetElement) {
        const firstInput = targetElement.querySelector('input, select, textarea, button');
        firstInput?.focus();
      }
    }, 100);
  }, [items, minItems, handleItemsChange, onRemove]);

  const updateItem = useCallback((index, updatedItem) => {
    const newItems = items.map((item, i) => i === index ? updatedItem : item);
    handleItemsChange(newItems);
  }, [items, handleItemsChange]);

  const handleReorder = useCallback((reorderedItems) => {
    handleItemsChange(reorderedItems);
    if (onReorder) {
      onReorder(reorderedItems);
    }
  }, [handleItemsChange, onReorder]);

  const itemVariants = {
    initial: { opacity: 0, y: -20, scale: 0.95 },
    animate: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 24
      }
    },
    exit: { 
      opacity: 0, 
      y: -20, 
      scale: 0.95,
      transition: {
        duration: 0.2,
        ease: 'easeOut'
      }
    }
  };

  const DefaultAddButton = () => (
    <motion.button
      type="button"
      onClick={addItem}
      disabled={items.length >= maxItems}
      className={`
        w-full px-4 py-3 rounded-lg border-2 border-dashed transition-all duration-200
        ${items.length >= maxItems 
          ? 'border-gray-300 text-gray-400 cursor-not-allowed bg-gray-50' 
          : 'border-primary-300 text-primary-600 hover:border-primary-400 hover:bg-primary-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2'
        }
        dark:border-primary-400 dark:text-primary-300 dark:hover:bg-primary-900/20
      `}
      whileHover={{ scale: items.length >= maxItems ? 1 : 1.02 }}
      whileTap={{ scale: items.length >= maxItems ? 1 : 0.98 }}
      aria-label={`${addButtonText} (${items.length}/${maxItems})`}
    >
      <span className="flex items-center justify-center space-x-2">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
        <span>{addButtonText}</span>
      </span>
    </motion.button>
  );

  const DefaultRemoveButton = ({ index }) => (
    <motion.button
      type="button"
      onClick={() => removeItem(index)}
      disabled={items.length <= minItems}
      className={`
        p-2 rounded-md transition-colors duration-200
        ${items.length <= minItems 
          ? 'text-gray-400 cursor-not-allowed' 
          : 'text-red-500 hover:text-red-600 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2'
        }
        dark:hover:bg-red-900/20
      `}
      whileHover={{ scale: items.length <= minItems ? 1 : 1.1 }}
      whileTap={{ scale: items.length <= minItems ? 1 : 0.9 }}
      aria-label={`${removeButtonText} ${index + 1}번 항목`}
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
      </svg>
    </motion.button>
  );

  const renderItemContent = (item, index) => {
    if (renderItem) {
      return renderItem(item, index, updateItem);
    }

    if (typeof children === 'function') {
      return children(item, index, updateItem);
    }

    return React.Children.map(children, (child) => {
      if (React.isValidElement(child)) {
        return React.cloneElement(child, {
          value: item[child.props.name],
          onChange: (value) => updateItem(index, { ...item, [child.props.name]: value }),
        });
      }
      return child;
    });
  };

  const ItemWrapper = sortable ? motion.div : motion.div;

  const ReorderableItems = () => (
    <Reorder.Group
      axis="y"
      values={items}
      onReorder={handleReorder}
      className="space-y-4"
    >
      <AnimatePresence mode="popLayout">
        {items.map((item, index) => (
          <Reorder.Item
            key={`${name}-${index}`}
            value={item}
            dragListener={sortable}
            className={`
              relative bg-white rounded-lg border border-gray-200 p-4 shadow-sm
              ${sortable ? 'cursor-grab active:cursor-grabbing' : ''}
              dark:bg-gray-800 dark:border-gray-600
            `}
            variants={itemVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            layout
            data-item-index={index}
            onDragStart={() => setDraggedItem(index)}
            onDragEnd={() => setDraggedItem(null)}
            style={{
              zIndex: draggedItem === index ? 1000 : 1
            }}
          >
            <div className="flex items-start justify-between space-x-4">
              <div className="flex-1 space-y-4">
                {renderItemContent(item, index)}
              </div>
              
              <div className="flex items-center space-x-2">
                {sortable && (
                  <div 
                    className="p-1 text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing"
                    aria-label="항목 순서 변경"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
                    </svg>
                  </div>
                )}
                
                {renderRemoveButton ? 
                  renderRemoveButton(index, removeItem) : 
                  <DefaultRemoveButton index={index} />
                }
              </div>
            </div>
          </Reorder.Item>
        ))}
      </AnimatePresence>
    </Reorder.Group>
  );

  const StaticItems = () => (
    <div className="space-y-4">
      <AnimatePresence mode="popLayout">
        {items.map((item, index) => (
          <motion.div
            key={`${name}-${index}`}
            className="relative bg-white rounded-lg border border-gray-200 p-4 shadow-sm dark:bg-gray-800 dark:border-gray-600"
            variants={itemVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            layout
            data-item-index={index}
          >
            <div className="flex items-start justify-between space-x-4">
              <div className="flex-1 space-y-4">
                {renderItemContent(item, index)}
              </div>
              
              <div className="flex items-center">
                {renderRemoveButton ? 
                  renderRemoveButton(index, removeItem) : 
                  <DefaultRemoveButton index={index} />
                }
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );

  return (
    <div
      ref={containerRef}
      className={`space-y-4 ${className}`}
      data-testid={testId}
      role="group"
      aria-label={ariaLabel}
      aria-describedby={`${name}-info`}
      {...props}
    >
      <div
        id={`${name}-info`}
        className="sr-only"
        aria-live="polite"
      >
        현재 {items.length}개 항목 (최소 {minItems}개, 최대 {maxItems}개)
      </div>

      {items.length === 0 && allowEmpty ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <svg className="w-12 h-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a1 1 0 011-1h6a1 1 0 011 1v2M7 7h10" />
          </svg>
          <p>{emptyMessage}</p>
        </div>
      ) : sortable ? (
        <ReorderableItems />
      ) : (
        <StaticItems />
      )}

      <div className="pt-2">
        {renderAddButton ? 
          renderAddButton(addItem, items.length >= maxItems) : 
          <DefaultAddButton />
        }
        
        {maxItems && (
          <p className="text-sm text-gray-500 mt-2 dark:text-gray-400">
            {items.length}/{maxItems}개 항목
          </p>
        )}
      </div>
    </div>
  );
};

// 간단한 반복 필드 (기본 텍스트 입력용)
export const SimpleRepeaterField = ({
  name = 'simple-repeater',
  value = [],
  onChange,
  placeholder = '값을 입력하세요',
  className = '',
  ...props
}) => {
  return (
    <RepeaterField
      name={name}
      value={value.map((item, index) => ({ value: item, id: index }))}
      onChange={(items) => onChange(items.map(item => item.value))}
      defaultValue={{ value: '' }}
      className={className}
      {...props}
    >
      {(item, index, updateItem) => (
        <input
          type="text"
          value={item.value || ''}
          onChange={(e) => updateItem(index, { ...item, value: e.target.value })}
          placeholder={placeholder}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          aria-label={`항목 ${index + 1}`}
        />
      )}
    </RepeaterField>
  );
};

export default RepeaterField;