'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { 
  ChevronLeftIcon, 
  ChevronRightIcon,
  XMarkIcon,
  MagnifyingGlassPlusIcon as ZoomInIcon,
  MagnifyingGlassMinusIcon as ZoomOutIcon,
  ArrowsPointingOutIcon,
  ArrowsPointingInIcon,
  PlayIcon,
  PauseIcon,
  Squares2X2Icon,
  ViewColumnsIcon,
  ListBulletIcon,
  PhotoIcon
} from '@heroicons/react/24/outline';
import { createPortal } from 'react-dom';

export default function Gallery({
  images = [], // Array of {id, src, thumbnail, title, caption, tags}
  layout = 'grid', // grid, masonry, carousel, list
  columns = 3, // 그리드 컬럼 수
  gap = 16, // 이미지 간 간격
  showThumbnails = true, // 썸네일 표시 여부
  showCaptions = true, // 캡션 표시 여부
  showTags = true, // 태그 표시 여부
  enableFullscreen = true, // 전체화면 지원
  enableZoom = true, // 줌 지원
  enableAutoplay = false, // 자동 재생 (carousel)
  autoplayInterval = 3000, // 자동 재생 간격
  onImageClick,
  onTagClick,
  className = '',
  loadMore, // 무한 스크롤 함수
  hasMore = false,
  loader
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isPlaying, setIsPlaying] = useState(enableAutoplay);
  const [viewMode, setViewMode] = useState(layout);
  const [selectedTags, setSelectedTags] = useState(new Set());
  const galleryRef = useRef(null);
  const fullscreenRef = useRef(null);
  const autoplayRef = useRef(null);

  // 필터링된 이미지
  const filteredImages = selectedTags.size > 0
    ? images.filter(img => 
        img.tags && img.tags.some(tag => selectedTags.has(tag))
      )
    : images;

  // 자동 재생
  useEffect(() => {
    if (!isPlaying || viewMode !== 'carousel') return;

    autoplayRef.current = setInterval(() => {
      setCurrentIndex((prev) => 
        prev < filteredImages.length - 1 ? prev + 1 : 0
      );
    }, autoplayInterval);

    return () => clearInterval(autoplayRef.current);
  }, [isPlaying, viewMode, filteredImages.length, autoplayInterval]);

  // 키보드 네비게이션
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isFullscreen) return;

      switch (e.key) {
        case 'ArrowLeft':
          navigatePrevious();
          break;
        case 'ArrowRight':
          navigateNext();
          break;
        case 'Escape':
          setIsFullscreen(false);
          break;
        case '+':
        case '=':
          handleZoomIn();
          break;
        case '-':
          handleZoomOut();
          break;
        case '0':
          setZoomLevel(1);
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen, currentIndex, filteredImages.length]);

  // 네비게이션 함수들
  const navigatePrevious = useCallback(() => {
    setCurrentIndex((prev) => 
      prev > 0 ? prev - 1 : filteredImages.length - 1
    );
  }, [filteredImages.length]);

  const navigateNext = useCallback(() => {
    setCurrentIndex((prev) => 
      prev < filteredImages.length - 1 ? prev + 1 : 0
    );
  }, [filteredImages.length]);

  // 줌 함수들
  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(prev + 0.5, 3));
  };

  const handleZoomOut = () => {
    setZoomLevel((prev) => Math.max(prev - 0.5, 0.5));
  };

  // 태그 선택
  const handleTagSelect = (tag) => {
    const newTags = new Set(selectedTags);
    if (newTags.has(tag)) {
      newTags.delete(tag);
    } else {
      newTags.add(tag);
    }
    setSelectedTags(newTags);
    
    if (onTagClick) {
      onTagClick(tag, !selectedTags.has(tag));
    }
  };

  // 이미지 클릭
  const handleImageClick = (image, index) => {
    setCurrentIndex(index);
    if (enableFullscreen) {
      setIsFullscreen(true);
    }
    if (onImageClick) {
      onImageClick(image, index);
    }
  };

  // 그리드 레이아웃
  const renderGrid = () => (
    <div
      className={`grid gap-${gap/4}`}
      style={{
        gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`
      }}
    >
      {filteredImages.map((image, index) => (
        <GalleryItem
          key={image.id || index}
          image={image}
          index={index}
          onClick={() => handleImageClick(image, index)}
          showCaption={showCaptions}
          showTags={showTags}
          onTagClick={handleTagSelect}
          selectedTags={selectedTags}
        />
      ))}
    </div>
  );

  // 캐러셀 레이아웃
  const renderCarousel = () => (
    <div className="relative">
      <div className="relative aspect-video overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800">
        {filteredImages[currentIndex] && (
          <img
            src={filteredImages[currentIndex].src}
            alt={filteredImages[currentIndex].title}
            className="w-full h-full object-contain"
          />
        )}
        
        {/* 네비게이션 버튼 */}
        <button
          onClick={navigatePrevious}
          className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors"
          aria-label="이전 이미지"
        >
          <ChevronLeftIcon className="w-6 h-6" />
        </button>
        
        <button
          onClick={navigateNext}
          className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors"
          aria-label="다음 이미지"
        >
          <ChevronRightIcon className="w-6 h-6" />
        </button>

        {/* 재생/일시정지 버튼 */}
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className="absolute bottom-4 right-4 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors"
          aria-label={isPlaying ? "일시정지" : "재생"}
        >
          {isPlaying ? (
            <PauseIcon className="w-5 h-5" />
          ) : (
            <PlayIcon className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* 썸네일 */}
      {showThumbnails && (
        <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
          {filteredImages.map((image, index) => (
            <button
              key={image.id || index}
              onClick={() => setCurrentIndex(index)}
              className={`flex-shrink-0 w-20 h-20 rounded-md overflow-hidden border-2 transition-all ${
                index === currentIndex
                  ? 'border-emerald-500 ring-2 ring-emerald-500/50'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-400'
              }`}
            >
              <img
                src={image.thumbnail || image.src}
                alt={`썸네일 ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );

  // 리스트 레이아웃
  const renderList = () => (
    <div className="space-y-4">
      {filteredImages.map((image, index) => (
        <div
          key={image.id || index}
          className="flex gap-4 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer"
          onClick={() => handleImageClick(image, index)}
        >
          <img
            src={image.thumbnail || image.src}
            alt={image.title}
            className="w-32 h-32 object-cover rounded-lg"
          />
          <div className="flex-1">
            {image.title && (
              <h3 className="font-semibold text-lg mb-2 text-gray-900 dark:text-gray-100">
                {image.title}
              </h3>
            )}
            {image.caption && showCaptions && (
              <p className="text-gray-600 dark:text-gray-400 mb-2">
                {image.caption}
              </p>
            )}
            {image.tags && showTags && (
              <div className="flex flex-wrap gap-2">
                {image.tags.map((tag) => (
                  <TagButton
                    key={tag}
                    tag={tag}
                    selected={selectedTags.has(tag)}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleTagSelect(tag);
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );

  // 전체화면 뷰어
  const renderFullscreenViewer = () => {
    if (!isFullscreen || !filteredImages[currentIndex]) return null;

    const content = (
      <div className="fixed inset-0 z-[9999] bg-black/95 flex flex-col">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-4 bg-black/50">
          <h3 className="text-white text-lg font-medium">
            {filteredImages[currentIndex].title || `이미지 ${currentIndex + 1} / ${filteredImages.length}`}
          </h3>
          
          <div className="flex items-center gap-2">
            {enableZoom && (
              <>
                <button
                  onClick={handleZoomOut}
                  className="p-2 text-white hover:bg-white/20 rounded-lg transition-colors"
                  aria-label="축소"
                >
                  <ZoomOutIcon className="w-5 h-5" />
                </button>
                
                <span className="text-white px-2">
                  {Math.round(zoomLevel * 100)}%
                </span>
                
                <button
                  onClick={handleZoomIn}
                  className="p-2 text-white hover:bg-white/20 rounded-lg transition-colors"
                  aria-label="확대"
                >
                  <ZoomInIcon className="w-5 h-5" />
                </button>
              </>
            )}
            
            <button
              onClick={() => setIsFullscreen(false)}
              className="p-2 text-white hover:bg-white/20 rounded-lg transition-colors"
              aria-label="닫기"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 이미지 */}
        <div className="flex-1 relative overflow-auto">
          <img
            src={filteredImages[currentIndex].src}
            alt={filteredImages[currentIndex].title}
            className="absolute inset-0 m-auto max-w-full max-h-full transition-transform duration-300"
            style={{
              transform: `scale(${zoomLevel})`,
              cursor: zoomLevel > 1 ? 'move' : 'default'
            }}
          />

          {/* 네비게이션 */}
          <button
            onClick={navigatePrevious}
            className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors"
            aria-label="이전"
          >
            <ChevronLeftIcon className="w-8 h-8" />
          </button>
          
          <button
            onClick={navigateNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors"
            aria-label="다음"
          >
            <ChevronRightIcon className="w-8 h-8" />
          </button>
        </div>

        {/* 캡션 */}
        {filteredImages[currentIndex].caption && (
          <div className="p-4 bg-black/50 text-white text-center">
            {filteredImages[currentIndex].caption}
          </div>
        )}
      </div>
    );

    return typeof window !== 'undefined' ? createPortal(content, document.body) : null;
  };

  return (
    <div className={className}>
      {/* 컨트롤 바 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-lg transition-colors ${
              viewMode === 'grid'
                ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
                : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400'
            }`}
            aria-label="그리드 보기"
          >
            <Squares2X2Icon className="w-5 h-5" />
          </button>
          
          <button
            onClick={() => setViewMode('carousel')}
            className={`p-2 rounded-lg transition-colors ${
              viewMode === 'carousel'
                ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
                : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400'
            }`}
            aria-label="캐러셀 보기"
          >
            <PhotoIcon className="w-5 h-5" />
          </button>
          
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-lg transition-colors ${
              viewMode === 'list'
                ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
                : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400'
            }`}
            aria-label="리스트 보기"
          >
            <ListBulletIcon className="w-5 h-5" />
          </button>
        </div>

        <div className="text-sm text-gray-600 dark:text-gray-400">
          {filteredImages.length}개 이미지
        </div>
      </div>

      {/* 태그 필터 */}
      {showTags && getAllTags(images).length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {getAllTags(images).map((tag) => (
            <TagButton
              key={tag}
              tag={tag}
              selected={selectedTags.has(tag)}
              onClick={() => handleTagSelect(tag)}
            />
          ))}
        </div>
      )}

      {/* 갤러리 렌더링 */}
      <div ref={galleryRef}>
        {viewMode === 'grid' && renderGrid()}
        {viewMode === 'carousel' && renderCarousel()}
        {viewMode === 'list' && renderList()}
      </div>

      {/* 로더 */}
      {hasMore && loader && (
        <div className="flex justify-center py-8">
          {loader}
        </div>
      )}

      {/* 전체화면 뷰어 */}
      {renderFullscreenViewer()}
    </div>
  );
}

// 갤러리 아이템 컴포넌트
function GalleryItem({ image, index, onClick, showCaption, showTags, onTagClick, selectedTags }) {
  const [loaded, setLoaded] = useState(false);

  return (
    <div
      className="relative group cursor-pointer overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800"
      onClick={onClick}
    >
      <div className="aspect-square">
        {!loaded && (
          <div className="absolute inset-0 animate-pulse bg-gray-200 dark:bg-gray-700" />
        )}
        <img
          src={image.thumbnail || image.src}
          alt={image.title || `이미지 ${index + 1}`}
          className={`w-full h-full object-cover transition-all duration-300 ${
            loaded ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
          } group-hover:scale-110`}
          onLoad={() => setLoaded(true)}
        />
      </div>

      {/* 오버레이 */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
          {image.title && (
            <h3 className="font-semibold mb-1">{image.title}</h3>
          )}
          {image.caption && showCaption && (
            <p className="text-sm opacity-90 line-clamp-2">{image.caption}</p>
          )}
        </div>
      </div>
    </div>
  );
}

// 태그 버튼 컴포넌트
function TagButton({ tag, selected, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1 text-sm rounded-full transition-all ${
        selected
          ? 'bg-emerald-600 text-white'
          : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
      }`}
    >
      {tag}
    </button>
  );
}

// 유틸리티 함수
function getAllTags(images) {
  const tags = new Set();
  images.forEach(img => {
    if (img.tags) {
      img.tags.forEach(tag => tags.add(tag));
    }
  });
  return Array.from(tags);
}