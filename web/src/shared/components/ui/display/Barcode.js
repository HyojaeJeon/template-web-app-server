'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { 
  DocumentDuplicateIcon,
  CloudArrowDownIcon,
  EyeIcon,
  PrinterIcon
} from '@heroicons/react/24/outline';

export default function Barcode({
  value = '', // 바코드로 인코딩할 값
  format = 'CODE128', // CODE128, CODE39, EAN13, EAN8, UPC, ITF14
  width = 300, // 바코드 너비
  height = 100, // 바코드 높이
  displayValue = true, // 하단에 값 표시
  fontSize = 14, // 폰트 크기
  textAlign = 'center', // 텍스트 정렬
  textPosition = 'bottom', // top, bottom
  textMargin = 10, // 텍스트와 바코드 간격
  background = '#FFFFFF', // 배경색
  lineColor = '#000000', // 바 색상
  margin = 10, // 여백
  flat = false, // 평면 스타일 (그라데이션 없음)
  onGenerate, // 생성 완료 콜백
  className = '',
  showControls = true, // 컨트롤 버튼 표시
  showInfo = false, // 정보 표시
  downloadFileName = 'barcode', // 다운로드 파일명
  validationMessage = '유효하지 않은 바코드 값입니다.' // 검증 실패 메시지
}) {
  const [barcodeDataURL, setBarcodeDataURL] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);
  const canvasRef = useRef(null);

  // 바코드 검증
  const validateValue = useCallback((val, fmt) => {
    if (!val) return false;

    switch (fmt) {
      case 'CODE128':
        // CODE128은 ASCII 문자만 허용
        return /^[\x00-\x7F]*$/.test(val);
        
      case 'CODE39':
        // CODE39는 숫자, 대문자, 일부 특수문자만 허용
        return /^[0-9A-Z\-. $\/+%]*$/.test(val);
        
      case 'EAN13':
        // EAN13은 12~13자리 숫자
        return /^\d{12,13}$/.test(val);
        
      case 'EAN8':
        // EAN8은 7~8자리 숫자
        return /^\d{7,8}$/.test(val);
        
      case 'UPC':
        // UPC-A는 11~12자리 숫자
        return /^\d{11,12}$/.test(val);
        
      case 'ITF14':
        // ITF14는 13~14자리 숫자
        return /^\d{13,14}$/.test(val);
        
      default:
        return true;
    }
  }, []);

  // 체크섬 계산 (EAN13용)
  const calculateEAN13Checksum = (digits) => {
    let sum = 0;
    for (let i = 0; i < 12; i++) {
      sum += parseInt(digits[i]) * (i % 2 === 0 ? 1 : 3);
    }
    return (10 - (sum % 10)) % 10;
  };

  // 바코드 생성 (간단한 구현 - 실제로는 jsbarcode 라이브러리 사용 권장)
  const generateBarcode = useCallback(async () => {
    if (!value) {
      setError('바코드로 변환할 값이 없습니다.');
      return;
    }

    if (!validateValue(value, format)) {
      setError(validationMessage);
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      // 실제 환경에서는 JsBarcode 라이브러리 사용
      // import JsBarcode from 'jsbarcode';
      
      // 실제로는 아래처럼 사용:
      // JsBarcode(canvas, value, {
      //   format: format,
      //   width: 2,
      //   height: height - (displayValue ? fontSize + textMargin : 0),
      //   displayValue: displayValue,
      //   fontSize: fontSize,
      //   textAlign: textAlign,
      //   textPosition: textPosition,
      //   textMargin: textMargin,
      //   background: background,
      //   lineColor: lineColor,
      //   margin: margin
      // });

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      canvas.width = width;
      canvas.height = height;

      // 배경
      ctx.fillStyle = background;
      ctx.fillRect(0, 0, width, height);

      // 간단한 바코드 패턴 생성 (실제 바코드 규격 아님)
      const barcodeHeight = displayValue ? height - fontSize - textMargin - margin * 2 : height - margin * 2;
      const barcodeWidth = width - margin * 2;
      const barCount = Math.min(value.length * 8, barcodeWidth / 2);
      const barWidth = barcodeWidth / barCount;

      ctx.fillStyle = lineColor;
      
      // 시작 패턴
      for (let i = 0; i < barCount; i++) {
        // 값을 기반으로 바 패턴 생성 (단순화된 버전)
        const charCode = value.charCodeAt(i % value.length);
        if ((charCode + i) % 2 === 0) {
          const x = margin + i * barWidth;
          ctx.fillRect(x, margin + (textPosition === 'top' && displayValue ? fontSize + textMargin : 0), 
                      Math.max(1, barWidth * 0.8), barcodeHeight);
        }
      }

      // 값 표시
      if (displayValue) {
        ctx.fillStyle = lineColor;
        ctx.font = `${fontSize}px monospace`;
        ctx.textAlign = textAlign;

        const textY = textPosition === 'top' 
          ? margin + fontSize 
          : height - margin;
        
        const textX = textAlign === 'center' 
          ? width / 2 
          : textAlign === 'right' 
            ? width - margin 
            : margin;

        ctx.fillText(value, textX, textY);
      }

      const dataURL = canvas.toDataURL('image/png');
      setBarcodeDataURL(dataURL);
      
      if (onGenerate) onGenerate(dataURL);

    } catch (err) {
      setError('바코드 생성 중 오류가 발생했습니다.');
      console.error('Barcode generation error:', err);
    } finally {
      setIsGenerating(false);
    }
  }, [value, format, width, height, displayValue, fontSize, textAlign, textPosition, 
      textMargin, background, lineColor, margin, validateValue, validationMessage, onGenerate]);

  // 값이 변경되면 바코드 재생성
  useEffect(() => {
    generateBarcode();
  }, [generateBarcode]);

  // 클립보드에 복사
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(value);
      // 토스트 알림 (실제 환경에서는 토스트 컴포넌트 사용)
      alert('클립보드에 복사되었습니다!');
    } catch (err) {
      console.error('클립보드 복사 실패:', err);
    }
  };

  // 이미지 다운로드
  const downloadImage = useCallback(() => {
    if (!barcodeDataURL) return;

    const link = document.createElement('a');
    link.href = barcodeDataURL;
    link.download = `${downloadFileName}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [barcodeDataURL, downloadFileName]);

  // 인쇄
  const printBarcode = () => {
    if (!barcodeDataURL) return;

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Barcode - ${value}</title>
          <style>
            body { margin: 0; padding: 20px; text-align: center; }
            img { max-width: 100%; height: auto; }
            @media print {
              body { padding: 0; }
            }
          </style>
        </head>
        <body>
          <img src="${barcodeDataURL}" alt="Barcode" />
          <p>${value}</p>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  // 전체화면 보기
  const viewFullscreen = () => {
    if (!barcodeDataURL) return;

    const newWindow = window.open('', '_blank');
    newWindow.document.write(`
      <html>
        <head><title>Barcode - ${value}</title></head>
        <body style="margin:0; padding:20px; text-align:center; background:#f3f4f6;">
          <img src="${barcodeDataURL}" style="max-width:100%; height:auto;" alt="Barcode" />
          <p style="margin-top:20px; color:#666; font-family:monospace;">${value}</p>
        </body>
      </html>
    `);
  };

  if (error) {
    return (
      <div className={`flex flex-col items-center justify-center p-8 border-2 border-dashed border-red-300 rounded-lg ${className}`}>
        <div className="w-16 h-16 text-red-400 mb-4">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <rect x="2" y="6" width="2" height="12"/>
            <rect x="5" y="6" width="1" height="12"/>
            <rect x="7" y="6" width="2" height="12"/>
            <rect x="10" y="6" width="1" height="12"/>
            <rect x="12" y="6" width="2" height="12"/>
            <rect x="15" y="6" width="1" height="12"/>
            <rect x="17" y="6" width="2" height="12"/>
            <rect x="20" y="6" width="2" height="12"/>
          </svg>
        </div>
        <p className="text-red-600 dark:text-red-400 text-center">{error}</p>
        <button 
          onClick={generateBarcode}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          다시 생성
        </button>
      </div>
    );
  }

  return (
    <div className={`inline-flex flex-col items-center ${className}`}>
      {/* 바코드 이미지 */}
      <div className="relative group">
        {isGenerating ? (
          <div 
            className="flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg"
            style={{ width, height }}
          >
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
          </div>
        ) : barcodeDataURL ? (
          <img 
            src={barcodeDataURL} 
            alt="Barcode"
            width={width}
            height={height}
            className="rounded-lg shadow-lg"
            ref={canvasRef}
          />
        ) : (
          <div 
            className="bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center"
            style={{ width, height }}
          >
            <svg className="w-16 h-16 text-gray-400" viewBox="0 0 24 24" fill="currentColor">
              <rect x="2" y="6" width="2" height="12"/>
              <rect x="5" y="6" width="1" height="12"/>
              <rect x="7" y="6" width="2" height="12"/>
              <rect x="10" y="6" width="1" height="12"/>
              <rect x="12" y="6" width="2" height="12"/>
              <rect x="15" y="6" width="1" height="12"/>
              <rect x="17" y="6" width="2" height="12"/>
              <rect x="20" y="6" width="2" height="12"/>
            </svg>
          </div>
        )}

        {/* 호버 오버레이 */}
        {barcodeDataURL && (
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
            <button
              onClick={viewFullscreen}
              className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors"
              aria-label="전체화면 보기"
            >
              <EyeIcon className="w-6 h-6 text-white" />
            </button>
          </div>
        )}
      </div>

      {/* 컨트롤 버튼들 */}
      {showControls && barcodeDataURL && (
        <div className="flex gap-2 mt-4">
          <button
            onClick={copyToClipboard}
            className="p-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            title="텍스트 복사"
            aria-label="텍스트 복사"
          >
            <DocumentDuplicateIcon className="w-5 h-5" />
          </button>

          <button
            onClick={downloadImage}
            className="p-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            title="이미지 다운로드"
            aria-label="이미지 다운로드"
          >
            <CloudArrowDownIcon className="w-5 h-5" />
          </button>

          <button
            onClick={printBarcode}
            className="p-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            title="인쇄"
            aria-label="인쇄"
          >
            <PrinterIcon className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* 정보 표시 */}
      {showInfo && (
        <div className="mt-4 text-xs text-gray-500 dark:text-gray-400 space-y-1 text-center">
          <div>형식: {format}</div>
          <div>크기: {width}×{height}px</div>
          <div>값: {value}</div>
          <div>길이: {value.length}자</div>
        </div>
      )}
    </div>
  );
}

// EAN13 바코드 (13자리 제품 바코드)
export function EAN13Barcode({ productCode, ...props }) {
  // EAN13 형식으로 변환 (12자리면 체크섬 추가)
  const formatEAN13 = (code) => {
    if (code.length === 12) {
      const checksum = calculateEAN13Checksum(code);
      return code + checksum;
    }
    return code;
  };

  const calculateEAN13Checksum = (digits) => {
    let sum = 0;
    for (let i = 0; i < 12; i++) {
      sum += parseInt(digits[i]) * (i % 2 === 0 ? 1 : 3);
    }
    return (10 - (sum % 10)) % 10;
  };

  return (
    <Barcode
      value={formatEAN13(productCode)}
      format="EAN13"
      width={350}
      height={120}
      {...props}
    />
  );
}

// CODE128 바코드 (일반 텍스트용)
export function Code128Barcode({ text, ...props }) {
  return (
    <Barcode
      value={text}
      format="CODE128"
      width={300}
      height={100}
      {...props}
    />
  );
}

// CODE39 바코드 (산업용 표준)
export function Code39Barcode({ code, ...props }) {
  return (
    <Barcode
      value={code.toUpperCase()}
      format="CODE39"
      width={350}
      height={100}
      {...props}
    />
  );
}

// 재고 관리용 바코드
export function InventoryBarcode({ 
  itemId, 
  category = '00', 
  location = '001',
  ...props 
}) {
  const inventoryCode = `${category}${location}${itemId.toString().padStart(6, '0')}`;
  
  return (
    <Barcode
      value={inventoryCode}
      format="CODE128"
      width={300}
      height={80}
      fontSize={12}
      displayValue={true}
      {...props}
    />
  );
}