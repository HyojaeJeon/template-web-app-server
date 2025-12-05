'use client';

import React from 'react';

/**
 * 백드롭 컴포넌트
 */
const Backdrop = ({ 
  isOpen = false, 
  onClose, 
  className = '',
  opacity = 'bg-opacity-50',
  blur = 'backdrop-blur-sm',
  ...props 
}) => {
  if (!isOpen) return null;

  return (
    <div
      className={`fixed inset-0 z-40 bg-black ${opacity} ${blur} ${className}`}
      onClick={onClose}
      {...props}
    />
  );
};

export default Backdrop;