import type { Metadata } from 'next';
import Homepage from './Homepage';

export const metadata: Metadata = {
  title: 'Nook — 손님이 다시 오는 이유를 만들어드립니다',
  description: '앱 다운로드 없이 고객 휴대폰 월렛에 바로 저장되는 디지털 적립카드 + 푸시알림 + 할인쿠폰. Fort Lee 지역 업체를 위한 로열티 플랫폼.',
  keywords: 'loyalty card, 적립카드, digital wallet, Korean restaurant, Fort Lee, NJ, 쿠폰, 단골',
  openGraph: {
    title: 'Nook — Digital Loyalty Cards for Local Businesses',
    description: 'Stamp cards in Apple & Google Wallet. Push notifications. Smart coupons. No app needed.',
    type: 'website',
  },
};

export default function Page() {
  return <Homepage />;
}
