import './globals.css';
import Providers from './providers';

export const metadata = {
  title: '배달 VN - 점주용 관리 시스템',
  description: 'Local 음식 배달 앱 점주용 관리 시스템',
  icons: {
    icon: [
      { url: '/icon-192x192.png' },
      { url: '/icon-192x192.png', sizes: '32x32', type: 'image/png' },
      { url: '/icon-192x192.png', sizes: '16x16', type: 'image/png' },
    ],
    shortcut: '/icon-192x192.png',
    apple: [
      { url: '/icon-192x192.png' },
      { url: '/icon-192x192.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  // 개발 환경에서 CSP 완전 허용
  ...(process.env.NODE_ENV === 'development' && {
    other: {
      'http-equiv': 'Content-Security-Policy',
      content: "default-src * 'unsafe-inline' 'unsafe-eval'; script-src * 'unsafe-inline' 'unsafe-eval'; connect-src * 'unsafe-inline'; img-src * data: blob: 'unsafe-inline'; frame-src *; style-src * 'unsafe-inline';"
    }
  })
}

export default function RootLayout({ children }) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}