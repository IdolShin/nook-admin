import { Noto_Sans_KR } from 'next/font/google';

const notoSansKR = Noto_Sans_KR({
  subsets: ['latin'],
  weight: ['300', '400', '500', '700'],
  display: 'swap',
  variable: '--font-noto',
});

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return <div className={notoSansKR.variable}>{children}</div>;
}
