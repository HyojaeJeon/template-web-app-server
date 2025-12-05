'use client';

/**
 * 푸터 컴포넌트 (WCAG 2.1 준수)
 * Local 테마 컬러와 다크모드 지원
 * 
 * @param {Object} props - 컴포넌트 props
 * @param {Array} props.links - 푸터 링크 배열
 * @param {Object} props.companyInfo - 회사 정보
 * @param {boolean} props.showSocial - 소셜 미디어 링크 표시 여부
 * @param {string} props.variant - 푸터 타입 ('simple' | 'detailed' | 'minimal')
 * @param {string} props.className - 추가 CSS 클래스
 */
const Footer = ({
  links = [],
  companyInfo = {},
  showSocial = true,
  variant = 'detailed',
  className = ''
}) => {
  const currentYear = new Date().getFullYear();

  const defaultLinks = [
    { label: '개인정보처리방침', href: '/privacy' },
    { label: '이용약관', href: '/terms' },
    { label: '고객지원', href: '/support' },
    { label: '도움말', href: '/help' }
  ];

  const socialLinks = [
    { name: 'Facebook', href: '#', icon: 'facebook' },
    { name: 'Zalo', href: '#', icon: 'zalo' },
    { name: 'Instagram', href: '#', icon: 'instagram' }
  ];

  const defaultCompanyInfo = {
    name: 'Delivery VN',
    address: '123 Nguyen Hue Street, District 1, Ho Chi Minh City, Vietnam',
    phone: '+84 28 1234 5678',
    email: 'support@template.com',
    businessNumber: '0123456789'
  };

  const company = { ...defaultCompanyInfo, ...companyInfo };
  const footerLinks = links.length > 0 ? links : defaultLinks;

  if (variant === 'minimal') {
    return (
      <footer 
        className={`bg-white dark:bg-gray-900 border-t border-slate-200 dark:border-gray-700 py-4 ${className}`}
        role="contentinfo"
      >
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-sm text-slate-500 dark:text-gray-400">
            © {currentYear} {company.name}. All rights reserved.
          </p>
        </div>
      </footer>
    );
  }

  if (variant === 'simple') {
    return (
      <footer 
        className={`bg-gradient-to-r from-slate-50 to-slate-100 dark:from-gray-900 dark:to-gray-800 
                   border-t border-slate-200 dark:border-gray-700 py-6 ${className}`}
        role="contentinfo"
      >
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-mint-500 to-green-500 
                            dark:from-mint-400 dark:to-green-400 flex items-center justify-center">
                <span className="text-white font-bold text-sm">D</span>
              </div>
              <span className="text-lg font-bold bg-gradient-to-r from-mint-600 to-green-600 
                             dark:from-mint-400 dark:to-green-400 bg-clip-text text-transparent">
                {company.name}
              </span>
            </div>
            
            <nav className="flex flex-wrap justify-center gap-6" aria-label="푸터 네비게이션">
              {footerLinks.map((link, index) => (
                <a
                  key={index}
                  href={link.href}
                  className="text-sm text-slate-600 dark:text-gray-300 hover:text-mint-600 
                           dark:hover:text-mint-400 transition-colors duration-200"
                >
                  {link.label}
                </a>
              ))}
            </nav>

            <p className="text-sm text-slate-500 dark:text-gray-400">
              © {currentYear} All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    );
  }

  // Detailed variant
  return (
    <footer 
      className={`bg-gradient-to-b from-slate-50 via-white to-slate-50 
                 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900
                 border-t border-slate-200 dark:border-gray-700 ${className}`}
      role="contentinfo"
    >
      {/* 메인 푸터 콘텐츠 */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* 회사 정보 */}
          <div className="lg:col-span-2">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-mint-500 to-green-500 
                            dark:from-mint-400 dark:to-green-400 flex items-center justify-center
                            shadow-lg shadow-mint-500/25 dark:shadow-mint-400/25">
                <span className="text-white font-bold text-lg">D</span>
              </div>
              <div className="ml-3">
                <h2 className="text-xl font-bold bg-gradient-to-r from-mint-600 to-green-600 
                             dark:from-mint-400 dark:to-green-400 bg-clip-text text-transparent">
                  {company.name}
                </h2>
                <p className="text-sm text-slate-500 dark:text-gray-400">
                  Local 배달 서비스 플랫폼
                </p>
              </div>
            </div>
            
            <div className="space-y-2 text-sm text-slate-600 dark:text-gray-300">
              <p className="flex items-start">
                <svg className="w-4 h-4 mr-2 mt-0.5 text-mint-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                </svg>
                {company.address}
              </p>
              <p className="flex items-center">
                <svg className="w-4 h-4 mr-2 text-mint-500" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                </svg>
                <a href={`tel:${company.phone}`} className="hover:text-mint-600 dark:hover:text-mint-400 transition-colors">
                  {company.phone}
                </a>
              </p>
              <p className="flex items-center">
                <svg className="w-4 h-4 mr-2 text-mint-500" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                  <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                </svg>
                <a href={`mailto:${company.email}`} className="hover:text-mint-600 dark:hover:text-mint-400 transition-colors">
                  {company.email}
                </a>
              </p>
              <p className="text-xs text-slate-500 dark:text-gray-400 mt-2">
                사업자등록번호: {company.businessNumber}
              </p>
            </div>
          </div>

          {/* 빠른 링크 */}
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">
              빠른 링크
            </h3>
            <nav className="space-y-2" aria-label="푸터 빠른 링크">
              {footerLinks.map((link, index) => (
                <a
                  key={index}
                  href={link.href}
                  className="block text-sm text-slate-600 dark:text-gray-300 
                           hover:text-mint-600 dark:hover:text-mint-400 
                           transition-colors duration-200"
                >
                  {link.label}
                </a>
              ))}
            </nav>
          </div>

          {/* 고객 지원 */}
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">
              고객 지원
            </h3>
            <div className="space-y-2 text-sm text-slate-600 dark:text-gray-300">
              <p>운영 시간</p>
              <p className="text-xs">월-금: 9:00 - 18:00</p>
              <p className="text-xs">토-일: 10:00 - 16:00</p>
              
              <div className="pt-4">
                <div className="p-3 bg-gradient-to-r from-mint-50 to-green-50 
                              dark:from-mint-900/20 dark:to-green-900/20 rounded-lg">
                  <p className="text-xs font-medium text-mint-700 dark:text-mint-300 mb-1">
                    24시간 긴급 지원
                  </p>
                  <a href="tel:+84281234567" 
                     className="text-sm font-bold text-green-600 dark:text-green-400 
                              hover:text-green-700 dark:hover:text-green-300 transition-colors">
                    +84 28 1234 5678
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 소셜 미디어 & 하단 정보 */}
      {showSocial && (
        <div className="border-t border-slate-200 dark:border-gray-700 
                      bg-slate-50/50 dark:bg-gray-800/50">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
              {/* 소셜 미디어 */}
              <div className="flex items-center space-x-4">
                <span className="text-sm text-slate-500 dark:text-gray-400">팔로우하세요:</span>
                <div className="flex space-x-3">
                  {socialLinks.map((social, index) => (
                    <a
                      key={index}
                      href={social.href}
                      className="w-8 h-8 bg-gradient-to-r from-slate-100 to-slate-200 
                               dark:from-gray-700 dark:to-gray-600
                               hover:from-mint-500 hover:to-green-500
                               dark:hover:from-mint-400 dark:hover:to-green-400
                               text-slate-600 dark:text-gray-300 hover:text-white
                               rounded-full flex items-center justify-center
                               transition-all duration-200 hover:scale-110"
                      aria-label={`${social.name} 팔로우`}
                    >
                      <span className="text-xs font-bold">
                        {social.icon === 'facebook' ? 'f' : 
                         social.icon === 'zalo' ? 'Z' : 
                         social.icon === 'instagram' ? '📷' : social.name.charAt(0)}
                      </span>
                    </a>
                  ))}
                </div>
              </div>

              {/* 저작권 정보 */}
              <div className="text-center md:text-right">
                <p className="text-sm text-slate-500 dark:text-gray-400">
                  © {currentYear} {company.name}. All rights reserved.
                </p>
                <p className="text-xs text-slate-400 dark:text-gray-500 mt-1">
                  Made with ❤️ in Vietnam
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </footer>
  );
};

export default Footer;