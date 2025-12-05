'use client';

import { useState, useRef } from 'react';
import { format } from '@/shared/utils/format';
import { useTranslation } from '@/shared/i18n';

/**
 * 내보내기 버튼 컴포넌트 - Local App MVP 전용
 * CSV, Excel, PDF 내보내기 지원, WCAG 2.1 준수, Local 테마 적용, 다크모드 지원
 * 
 * @param {Array|Function} data - 내보낼 데이터 배열 또는 데이터 반환 함수
 * @param {Array} formats - 지원할 내보내기 형식 ['csv', 'excel', 'pdf']
 * @param {string} filename - 기본 파일명 (확장자 제외)
 * @param {Object} options - 내보내기 옵션
 * @param {string} buttonText - 버튼 텍스트
 * @param {string} variant - 버튼 스타일 변형
 * @param {boolean} disabled - 비활성화 상태
 * @param {string} className - 추가 CSS 클래스
 */
const ExportButton = ({
  data = [],
  formats = ['csv', 'excel', 'pdf'],
  filename = 'export',
  options = {},
  buttonText = '내보내기',
  variant = 'primary',
  disabled = false,
  className = '',
  onExportStart,
  onExportComplete,
  onExportError,
  ...props
}) => {
  const { language } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // 기본 옵션 설정
  const defaultOptions = {
    csv: {
      separator: ',',
      encoding: 'utf-8-bom', // 한글 지원을 위한 BOM 추가
      headers: true,
      quoteStrings: true
    },
    excel: {
      sheetName: 'Sheet1',
      autoWidth: true,
      dateFormat: 'yyyy-mm-dd',
      numberFormat: '#,##0'
    },
    pdf: {
      orientation: 'portrait', // portrait | landscape
      format: 'a4',
      margin: { top: 40, right: 40, bottom: 40, left: 40 },
      fontSize: 10,
      title: filename
    },
    ...options
  };

  // 포맷별 아이콘 및 색상
  const formatConfig = {
    csv: {
      icon: '📊',
      label: 'CSV',
      description: '쉼표로 구분된 값',
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-100 dark:bg-green-900/30'
    },
    excel: {
      icon: '📈',
      label: 'Excel',
      description: 'Microsoft Excel 파일',
      color: 'text-emerald-600 dark:text-emerald-400',
      bgColor: 'bg-emerald-100 dark:bg-emerald-900/30'
    },
    pdf: {
      icon: '📄',
      label: 'PDF',
      description: 'PDF 문서',
      color: 'text-red-600 dark:text-red-400',
      bgColor: 'bg-red-100 dark:bg-red-900/30'
    }
  };

  // 데이터 가져오기
  const getData = async () => {
    if (typeof data === 'function') {
      return await data();
    }
    return Array.isArray(data) ? data : [];
  };

  // CSV 내보내기
  const exportToCsv = async (exportData) => {
    const csvOptions = defaultOptions.csv;
    
    if (!exportData.length) return;

    const headers = Object.keys(exportData[0]);
    let csvContent = '';

    // 헤더 추가
    if (csvOptions.headers) {
      csvContent += headers
        .map(header => csvOptions.quoteStrings ? `"${header}"` : header)
        .join(csvOptions.separator) + '\n';
    }

    // 데이터 추가
    exportData.forEach(row => {
      const values = headers.map(header => {
        let value = row[header] || '';
        
        // 값 처리
        if (value === null || value === undefined) {
          value = '';
        } else if (typeof value === 'object') {
          value = JSON.stringify(value);
        } else {
          value = String(value);
        }

        // 쿼트 처리
        if (csvOptions.quoteStrings || value.includes(csvOptions.separator) || value.includes('\n')) {
          value = `"${value.replace(/"/g, '""')}"`;
        }

        return value;
      });
      
      csvContent += values.join(csvOptions.separator) + '\n';
    });

    // BOM 추가 (한글 지원)
    const bom = csvOptions.encoding === 'utf-8-bom' ? '\ufeff' : '';
    const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' });
    
    downloadFile(blob, `${filename}.csv`);
  };

  // Excel 내보내기 (간단한 XML 기반)
  const exportToExcel = async (exportData) => {
    if (!exportData.length) return;

    const excelOptions = defaultOptions.excel;
    const headers = Object.keys(exportData[0]);
    
    // Excel XML 구조 생성
    let xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
          xmlns:o="urn:schemas-microsoft-com:office:office"
          xmlns:x="urn:schemas-microsoft-com:office:excel"
          xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
          xmlns:html="http://www.w3.org/TR/REC-html40">
  <DocumentProperties xmlns="urn:schemas-microsoft-com:office:office">
    <Title>${filename}</Title>
    <Created>${new Date().toISOString()}</Created>
  </DocumentProperties>
  <Styles>
    <Style ss:ID="Header">
      <Font ss:Bold="1"/>
      <Interior ss:Color="#2AC1BC" ss:Pattern="Solid"/>
    </Style>
    <Style ss:ID="Number">
      <NumberFormat ss:Format="${excelOptions.numberFormat}"/>
    </Style>
    <Style ss:ID="Date">
      <NumberFormat ss:Format="${excelOptions.dateFormat}"/>
    </Style>
  </Styles>
  <Worksheet ss:Name="${excelOptions.sheetName}">
    <Table>`;

    // 헤더 행
    xmlContent += '<Row>';
    headers.forEach(header => {
      xmlContent += `<Cell ss:StyleID="Header"><Data ss:Type="String">${escapeXml(header)}</Data></Cell>`;
    });
    xmlContent += '</Row>';

    // 데이터 행들
    exportData.forEach(row => {
      xmlContent += '<Row>';
      headers.forEach(header => {
        const value = row[header];
        let dataType = 'String';
        let cellValue = '';
        let styleId = '';

        if (value === null || value === undefined) {
          cellValue = '';
        } else if (typeof value === 'number') {
          dataType = 'Number';
          cellValue = value;
          styleId = ' ss:StyleID="Number"';
        } else if (value instanceof Date) {
          dataType = 'DateTime';
          cellValue = value.toISOString();
          styleId = ' ss:StyleID="Date"';
        } else {
          cellValue = escapeXml(String(value));
        }

        xmlContent += `<Cell${styleId}><Data ss:Type="${dataType}">${cellValue}</Data></Cell>`;
      });
      xmlContent += '</Row>';
    });

    xmlContent += `    </Table>
  </Worksheet>
</Workbook>`;

    const blob = new Blob([xmlContent], { 
      type: 'application/vnd.ms-excel;charset=utf-8;' 
    });
    
    downloadFile(blob, `${filename}.xls`);
  };

  // PDF 내보내기 (간단한 HTML-PDF 방식)
  const exportToPdf = async (exportData) => {
    if (!exportData.length) return;

    const pdfOptions = defaultOptions.pdf;
    const headers = Object.keys(exportData[0]);

    // HTML 테이블 생성
    let htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>${pdfOptions.title}</title>
      <style>
        @page {
          size: ${pdfOptions.format} ${pdfOptions.orientation};
          margin: ${pdfOptions.margin.top}px ${pdfOptions.margin.right}px ${pdfOptions.margin.bottom}px ${pdfOptions.margin.left}px;
        }
        body {
          font-family: 'Noto Sans KR', Arial, sans-serif;
          font-size: ${pdfOptions.fontSize}px;
          line-height: 1.4;
          color: #333;
        }
        h1 {
          color: #2AC1BC;
          text-align: center;
          margin-bottom: 20px;
          font-size: ${pdfOptions.fontSize + 4}px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin: 0 auto;
        }
        th, td {
          border: 1px solid #ddd;
          padding: 8px;
          text-align: left;
        }
        th {
          background-color: #2AC1BC;
          color: white;
          font-weight: bold;
        }
        tr:nth-child(even) {
          background-color: #f9f9f9;
        }
        .footer {
          margin-top: 20px;
          text-align: center;
          font-size: ${pdfOptions.fontSize - 2}px;
          color: #666;
        }
      </style>
    </head>
    <body>
      <h1>${pdfOptions.title}</h1>
      <table>
        <thead>
          <tr>
            ${headers.map(header => `<th>${escapeHtml(header)}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
    `;

    exportData.forEach(row => {
      htmlContent += '<tr>';
      headers.forEach(header => {
        let value = row[header];
        if (value === null || value === undefined) {
          value = '';
        } else if (typeof value === 'object') {
          value = JSON.stringify(value);
        } else {
          value = String(value);
        }
        htmlContent += `<td>${escapeHtml(value)}</td>`;
      });
      htmlContent += '</tr>';
    });

    htmlContent += `
        </tbody>
      </table>
      <div class="footer">
        Generated on ${format.dateTime(new Date(), language)} | Vietnam Delivery App
      </div>
    </body>
    </html>`;

    // HTML을 PDF로 변환 (브라우저의 print 기능 사용)
    const printWindow = window.open('', '_blank');
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    
    setTimeout(() => {
      printWindow.print();
      setTimeout(() => printWindow.close(), 1000);
    }, 500);
  };

  // XML 이스케이프
  const escapeXml = (str) => {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  };

  // HTML 이스케이프
  const escapeHtml = (str) => {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  };

  // 파일 다운로드
  const downloadFile = (blob, fileName) => {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  // 내보내기 실행
  const handleExport = async (format) => {
    if (disabled || isLoading) return;

    setIsLoading(true);
    setIsDropdownOpen(false);

    try {
      onExportStart?.(format);
      
      const exportData = await getData();
      
      if (!exportData || exportData.length === 0) {
        throw new Error('내보낼 데이터가 없습니다.');
      }

      switch (format) {
        case 'csv':
          await exportToCsv(exportData);
          break;
        case 'excel':
          await exportToExcel(exportData);
          break;
        case 'pdf':
          await exportToPdf(exportData);
          break;
        default:
          throw new Error(`지원하지 않는 형식입니다: ${format}`);
      }

      onExportComplete?.(format, exportData.length);
    } catch (error) {
      console.error('Export error:', error);
      onExportError?.(format, error);
    } finally {
      setIsLoading(false);
    }
  };

  // 단일 형식인 경우 직접 내보내기
  const handleSingleFormatExport = () => {
    if (formats.length === 1) {
      handleExport(formats[0]);
    } else {
      setIsDropdownOpen(!isDropdownOpen);
    }
  };

  // 버튼 스타일
  const getButtonStyles = () => {
    const baseStyles = `
      inline-flex items-center justify-center gap-3 px-6 py-3 font-semibold rounded-xl
      transition-all duration-200
      focus:outline-none focus:ring-4 disabled:opacity-50 disabled:cursor-not-allowed
    `;

    const variants = {
      primary: `
        bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600
        text-white shadow-lg hover:shadow-xl focus:ring-teal-500/30
      `,
      secondary: `
        bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700
        text-gray-900 dark:text-white border-2 border-gray-200 dark:border-gray-600
        hover:border-teal-500 dark:hover:border-teal-400 shadow-md hover:shadow-lg
        focus:ring-teal-500/30
      `,
      outline: `
        bg-transparent hover:bg-teal-50 dark:hover:bg-teal-900/20
        text-teal-600 dark:text-teal-400 border-2 border-teal-500 dark:border-teal-400
        hover:border-teal-600 dark:hover:border-teal-300 focus:ring-teal-500/30
      `
    };

    return `${baseStyles} ${variants[variant] || variants.primary}`;
  };

  return (
    <div className={`relative ${className}`} {...props}>
      {/* 메인 버튼 */}
      <button
        onClick={handleSingleFormatExport}
        disabled={disabled || isLoading}
        className={getButtonStyles()}
        aria-label={`${buttonText}${formats.length > 1 ? ' 형식 선택' : ''}`}
        aria-expanded={formats.length > 1 ? isDropdownOpen : undefined}
        aria-haspopup={formats.length > 1 ? 'menu' : undefined}
      >
        {isLoading ? (
          <>
            <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
            내보내는 중...
          </>
        ) : (
          <>
            <span className="text-lg">📤</span>
            {buttonText}
            {formats.length > 1 && (
              <svg 
                className={`w-4 h-4 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`}
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            )}
          </>
        )}
      </button>

      {/* 드롭다운 메뉴 */}
      {formats.length > 1 && isDropdownOpen && (
        <div
          ref={dropdownRef}
          className="
            absolute top-full left-0 mt-2 w-64 z-50
            bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700
            transform transition-all duration-200 origin-top
          "
          role="menu"
          aria-label="내보내기 형식 선택"
        >
          <div className="p-3 space-y-1">
            {formats.map((format) => {
              const config = formatConfig[format];
              if (!config) return null;

              return (
                <button
                  key={format}
                  onClick={() => handleExport(format)}
                  disabled={isLoading}
                  className="
                    w-full flex items-center gap-4 p-4 rounded-xl text-left
                    hover:bg-gray-50 dark:hover:bg-gray-800
                    transition-colors duration-200
                    disabled:opacity-50 disabled:cursor-not-allowed
                    group
                  "
                  role="menuitem"
                >
                  <div className={`
                    w-12 h-12 rounded-xl ${config.bgColor} flex items-center justify-center
                    text-2xl group-hover:scale-110 transition-transform duration-200
                  `}>
                    {config.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={`font-semibold ${config.color} text-base`}>
                      {config.label}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                      {config.description}
                    </div>
                  </div>
                  <svg 
                    className="w-5 h-5 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300"
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                  </svg>
                </button>
              );
            })}
          </div>

          {/* 드롭다운 푸터 */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 rounded-b-2xl">
            <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
              내보낼 데이터: {Array.isArray(data) ? data.length : '?'}개 항목
            </div>
          </div>
        </div>
      )}

      {/* 백드롭 (드롭다운 닫기용) */}
      {isDropdownOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsDropdownOpen(false)}
          aria-hidden="true"
        />
      )}
    </div>
  );
};

export default ExportButton;