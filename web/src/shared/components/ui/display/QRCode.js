'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { 
  DocumentDuplicateIcon,
  ShareIcon,
  CloudArrowDownIcon,
  EyeIcon,
  QrCodeIcon
} from '@heroicons/react/24/outline';

export default function QRCode({
  value = '', // QR코드로 인코딩할 값
  size = 200, // QR코드 크기 (px)
  level = 'M', // 오류 복원 레벨 L, M, Q, H
  bgColor = '#FFFFFF', // 배경색
  fgColor = '#000000', // 전경색
  includeMargin = true, // 여백 포함
  imageSettings, // 중앙 이미지 {src, x, y, height, width, excavate}
  onGenerate, // 생성 완료 콜백
  className = '',
  showControls = true, // 컨트롤 버튼 표시
  showInfo = false, // 정보 표시
  downloadFileName = 'qrcode', // 다운로드 파일명
  renderAs = 'canvas' // canvas, svg, img
}) {
  const [qrCodeDataURL, setQrCodeDataURL] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);
  const canvasRef = useRef(null);
  const containerRef = useRef(null);

  // QR코드 생성 (간단한 구현 - 실제로는 qrcode.js 라이브러리 사용 권장)
  const generateQRCode = useCallback(async () => {
    if (!value) {
      setError('QR코드로 변환할 값이 없습니다.');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      // 실제 환경에서는 qrcode 라이브러리 사용
      // import QRCodeLib from 'qrcode';
      
      // 임시 구현 - 실제로는 아래처럼 사용:
      // const dataURL = await QRCodeLib.toDataURL(value, {
      //   width: size,
      //   margin: includeMargin ? 4 : 0,
      //   color: {
      //     dark: fgColor,
      //     light: bgColor
      //   },
      //   errorCorrectionLevel: level
      // });

      // 임시 플레이스홀더 이미지
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      
      // 배경
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, size, size);
      
      // 간단한 QR코드 패턴 (실제 QR코드 아님)
      ctx.fillStyle = fgColor;
      const cellSize = size / 21; // 21x21 그리드
      
      // 파인더 패턴 (좌상단, 우상단, 좌하단)
      const drawFinderPattern = (startX, startY) => {
        // 외부 사각형
        ctx.fillRect(startX, startY, cellSize * 7, cellSize * 7);
        ctx.fillStyle = bgColor;
        ctx.fillRect(startX + cellSize, startY + cellSize, cellSize * 5, cellSize * 5);
        ctx.fillStyle = fgColor;
        ctx.fillRect(startX + cellSize * 2, startY + cellSize * 2, cellSize * 3, cellSize * 3);
      };

      drawFinderPattern(0, 0); // 좌상단
      drawFinderPattern(size - cellSize * 7, 0); // 우상단
      drawFinderPattern(0, size - cellSize * 7); // 좌하단
      
      // 데이터 패턴 (간단한 체크 패턴)
      for (let i = 0; i < 21; i++) {
        for (let j = 0; j < 21; j++) {
          if ((i + j) % 2 === 0 && 
              !((i < 9 && j < 9) || (i < 9 && j > 11) || (i > 11 && j < 9))) {
            ctx.fillRect(i * cellSize, j * cellSize, cellSize, cellSize);
          }
        }
      }

      // 중앙 이미지 추가
      if (imageSettings && imageSettings.src) {
        const img = new Image();
        img.onload = () => {
          const { x = size/2 - imageSettings.width/2, 
                  y = size/2 - imageSettings.height/2, 
                  width = 40, 
                  height = 40, 
                  excavate = true } = imageSettings;
          
          if (excavate) {
            // 이미지 영역 지우기
            ctx.clearRect(x - 5, y - 5, width + 10, height + 10);
            ctx.fillStyle = bgColor;
            ctx.fillRect(x - 5, y - 5, width + 10, height + 10);
          }
          
          ctx.drawImage(img, x, y, width, height);
          
          const dataURL = canvas.toDataURL('image/png');
          setQrCodeDataURL(dataURL);
          
          if (onGenerate) onGenerate(dataURL);
        };
        img.src = imageSettings.src;
      } else {
        const dataURL = canvas.toDataURL('image/png');
        setQrCodeDataURL(dataURL);
        
        if (onGenerate) onGenerate(dataURL);
      }

    } catch (err) {
      setError('QR코드 생성 중 오류가 발생했습니다.');
      console.error('QR Code generation error:', err);
    } finally {
      setIsGenerating(false);
    }
  }, [value, size, level, bgColor, fgColor, includeMargin, imageSettings, onGenerate]);

  // 값이 변경되면 QR코드 재생성
  useEffect(() => {
    generateQRCode();
  }, [generateQRCode]);

  // 클립보드에 복사
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(value);
      // 토스트 알림 표시 (실제 환경에서는 토스트 컴포넌트 사용)
      alert('클립보드에 복사되었습니다!');
    } catch (err) {
      console.error('클립보드 복사 실패:', err);
    }
  };

  // 이미지 다운로드
  const downloadImage = useCallback(() => {
    if (!qrCodeDataURL) return;

    const link = document.createElement('a');
    link.href = qrCodeDataURL;
    link.download = `${downloadFileName}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [qrCodeDataURL, downloadFileName]);

  // 공유 (Web Share API)
  const shareImage = async () => {
    if (!qrCodeDataURL) return;

    try {
      if (navigator.share && navigator.canShare) {
        // 데이터 URL을 Blob으로 변환
        const response = await fetch(qrCodeDataURL);
        const blob = await response.blob();
        const file = new File([blob], `${downloadFileName}.svg`, { type: 'image/png' });

        await navigator.share({
          title: 'QR 코드',
          text: value,
          files: [file]
        });
      } else {
        // 폴백: 클립보드에 복사
        copyToClipboard();
      }
    } catch (err) {
      console.error('공유 실패:', err);
    }
  };

  // 전체화면 보기
  const viewFullscreen = () => {
    if (!qrCodeDataURL) return;

    const newWindow = window.open('', '_blank');
    newWindow.document.write(`
      <html>
        <head><title>QR Code - ${value}</title></head>
        <body style="margin:0; padding:20px; text-align:center; background:#f3f4f6;">
          <img src="${qrCodeDataURL}" style="max-width:100%; height:auto;" alt="QR Code" />
          <p style="margin-top:20px; color:#666;">${value}</p>
        </body>
      </html>
    `);
  };

  if (error) {
    return (
      <div className={`flex flex-col items-center justify-center p-8 border-2 border-dashed border-red-300 rounded-lg ${className}`}>
        <QrCodeIcon className="w-16 h-16 text-red-400 mb-4" />
        <p className="text-red-600 dark:text-red-400 text-center">{error}</p>
        <button 
          onClick={generateQRCode}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          다시 생성
        </button>
      </div>
    );
  }

  return (
    <div className={`inline-flex flex-col items-center ${className}`} ref={containerRef}>
      {/* QR코드 이미지 */}
      <div className="relative group">
        {isGenerating ? (
          <div 
            className="flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg"
            style={{ width: size, height: size }}
          >
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
          </div>
        ) : qrCodeDataURL ? (
          <img 
            src={qrCodeDataURL} 
            alt="QR Code"
            width={size}
            height={size}
            className="rounded-lg shadow-lg"
            ref={canvasRef}
          />
        ) : (
          <div 
            className="bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center"
            style={{ width: size, height: size }}
          >
            <QrCodeIcon className="w-16 h-16 text-gray-400" />
          </div>
        )}

        {/* 호버 오버레이 */}
        {qrCodeDataURL && (
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

      {/* 값 표시 */}
      {showInfo && value && (
        <div className="mt-4 max-w-xs">
          <p className="text-sm text-gray-600 dark:text-gray-400 text-center break-all">
            {value}
          </p>
        </div>
      )}

      {/* 컨트롤 버튼들 */}
      {showControls && qrCodeDataURL && (
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

          {navigator.share && (
            <button
              onClick={shareImage}
              className="p-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              title="공유"
              aria-label="공유"
            >
              <ShareIcon className="w-5 h-5" />
            </button>
          )}
        </div>
      )}

      {/* 정보 표시 */}
      {showInfo && (
        <div className="mt-4 text-xs text-gray-500 dark:text-gray-400 space-y-1">
          <div>크기: {size}×{size}px</div>
          <div>오류 복원: {level}</div>
          <div>문자 수: {value.length}</div>
        </div>
      )}
    </div>
  );
}

// WiFi QR코드
export function WiFiQRCode({ 
  ssid, 
  password, 
  security = 'WPA', 
  hidden = false,
  ...props 
}) {
  const wifiString = `WIFI:T:${security};S:${ssid};P:${password};H:${hidden ? 'true' : 'false'};;`;
  
  return (
    <QRCode
      value={wifiString}
      {...props}
    />
  );
}

// 연락처 QR코드 (vCard)
export function ContactQRCode({ 
  name, 
  phone, 
  email, 
  organization,
  url,
  ...props 
}) {
  const vCard = `BEGIN:VCARD
VERSION:3.0
FN:${name}
TEL:${phone}
EMAIL:${email}
${organization ? `ORG:${organization}` : ''}
${url ? `URL:${url}` : ''}
END:VCARD`;
  
  return (
    <QRCode
      value={vCard}
      {...props}
    />
  );
}

// SMS QR코드
export function SMSQRCode({ 
  phoneNumber, 
  message = '',
  ...props 
}) {
  const smsString = `SMS:${phoneNumber}:${message}`;
  
  return (
    <QRCode
      value={smsString}
      {...props}
    />
  );
}

// 이메일 QR코드
export function EmailQRCode({ 
  email, 
  subject = '', 
  body = '',
  ...props 
}) {
  const emailString = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  
  return (
    <QRCode
      value={emailString}
      {...props}
    />
  );
}

// 위치 QR코드
export function LocationQRCode({ 
  latitude, 
  longitude, 
  label = '',
  ...props 
}) {
  const locationString = `geo:${latitude},${longitude}${label ? `?q=${encodeURIComponent(label)}` : ''}`;
  
  return (
    <QRCode
      value={locationString}
      {...props}
    />
  );
}