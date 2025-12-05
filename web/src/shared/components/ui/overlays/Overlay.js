'use client';

import React from 'react';

/**
 * 기본 오버레이 컴포넌트
 */
const Overlay = ({ 
  isOpen = false, 
  onClose, 
  children, 
  className = '',
  zIndex = 'z-50',
  ...props 
}) => {
  if (!isOpen) return null;

  return (
    <div
      className={`fixed inset-0 ${zIndex} ${className}`}
      onClick={onClose}
      {...props}
    >
      <div
        className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm"
        aria-hidden="true"
      />
      <div className="relative z-10 h-full flex items-center justify-center p-4">
        {children}
      </div>
    </div>
  );
};

export default Overlay;