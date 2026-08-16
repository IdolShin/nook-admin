'use client';

import LegalPage, { Section, Bullets, Callout, useLegalLang } from '@/components/LegalPage';

export default function TermsPage() {
  const [lang, setLang] = useLegalLang();
  const en = lang === 'en';

  return (
    <LegalPage
      lang={lang}
      setLang={setLang}
      eyebrow="NOOK WALLET"
      title={en ? 'Terms of Service' : '이용약관'}
      updated={en ? 'Last updated: August 15, 2026' : '최종 수정일: 2026년 8월 15일'}
    >
      <Section title={en ? 'Agreement' : '약관의 적용'}>
        {en
          ? 'By using Nook Wallet — as a shop owner or as a customer collecting stamps — you agree to these terms. If you don’t agree, please don’t use the service. Nook Wallet is operated by Woosang Shin (New Jersey, USA), referred to below as "we" or "Nook".'
          : 'Nook Wallet을 이용하시면(매장 사장님이든 스탬프를 모으는 고객이든) 본 약관에 동의하는 것으로 봅니다. 동의하지 않으시면 서비스를 이용하지 말아주세요. Nook Wallet은 신우상(미국 뉴저지)이 운영하며, 이하 "저희" 또는 "Nook"이라 합니다.'}
      </Section>

      <Section title={en ? 'What Nook does' : '서비스 내용'}>
        {en
          ? 'Nook provides the software that lets a local shop run a digital stamp or membership card. Customers collect stamps by tapping an NFC stamp or by giving their card number to staff, and redeem rewards at the shop.'
          : 'Nook은 동네 매장이 디지털 스탬프·멤버십 카드를 운영할 수 있는 소프트웨어를 제공합니다. 고객은 NFC 스탬프에 탭하거나 직원에게 카드번호를 알려주어 적립하고, 매장에서 리워드를 사용합니다.'}
        <Callout>
          {en ? (
            <>
              <b>Important:</b> the rewards, discounts and free items belong to the shop, not to
              Nook. The shop decides what the reward is, honors it, and can change or end its
              program. Nook is the tool — we do not sell food, drinks or services, and we cannot
              force a shop to honor a reward.
            </>
          ) : (
            <>
              <b>중요:</b> 리워드·할인·무료 상품은 매장의 것이며 Nook의 것이 아닙니다. 리워드 내용
              결정, 제공, 변경·종료는 매장이 합니다. Nook은 도구를 제공할 뿐이며, 음식·음료·서비스를
              판매하지 않고, 매장에 리워드 제공을 강제할 수 없습니다.
            </>
          )}
        </Callout>
      </Section>

      <Section title={en ? 'Your account' : '계정'}>
        <Bullets items={en ? [
          <>Give accurate information and keep your password to yourself. You’re responsible for what happens under your account.</>,
          <>One person, one account. Don’t create accounts to farm stamps you didn’t earn.</>,
          <>Tell us right away at <a href="mailto:hello@nook-wallet.com">hello@nook-wallet.com</a> if you think someone else got into your account.</>,
          <>You can delete your account at any time from your wallet screen.</>,
        ] : [
          <>정확한 정보를 입력하고 비밀번호를 타인과 공유하지 마세요. 계정에서 일어난 일에 대한 책임은 본인에게 있습니다.</>,
          <>1인 1계정입니다. 적립하지 않은 스탬프를 얻기 위해 계정을 만들지 마세요.</>,
          <>계정이 도용된 것 같으면 즉시 <a href="mailto:hello@nook-wallet.com">hello@nook-wallet.com</a> 으로 알려주세요.</>,
          <>월렛 화면에서 언제든 계정을 삭제할 수 있습니다.</>,
        ]} />
      </Section>

      <Section title={en ? 'If you run a shop' : '매장 사장님의 의무'}>
        <Bullets items={en ? [
          <>Honor the rewards you advertise. If you change or end your program, tell your customers first.</>,
          <>Only add stamps for real visits, and only message customers who agreed to hear from you.</>,
          <>Your customer list is yours to use for your own loyalty program — not to sell, rent, or hand to anyone else.</>,
          <>Follow the laws that apply to you, including rules about marketing messages and gift or reward programs.</>,
          <>Keep your NFC stamps where staff can see them. If one is lost or stolen, deactivate it in your dashboard.</>,
        ] : [
          <>안내한 리워드를 반드시 제공해주세요. 프로그램을 변경·종료할 때는 고객에게 먼저 알려주세요.</>,
          <>실제 방문에 대해서만 적립하고, 수신에 동의한 고객에게만 메시지를 보내주세요.</>,
          <>고객 명단은 본인 매장의 적립 프로그램 운영에만 사용하세요 — 판매·대여·제3자 제공 금지.</>,
          <>마케팅 메시지, 상품권·리워드 관련 법규 등 적용 법령을 준수해주세요.</>,
          <>NFC 스탬프는 직원이 볼 수 있는 곳에 두세요. 분실·도난 시 대시보드에서 비활성화하세요.</>,
        ]} />
      </Section>

      <Section title={en ? 'Plans and payment' : '요금제 및 결제'}>
        {en
          ? 'Paid plans are billed monthly in advance and renew automatically until you cancel. Cancel any time — your plan runs to the end of the paid period and does not renew. We do not give partial refunds for a month already started. If we change prices, we will tell you at least 30 days before it affects you. Customers never pay Nook anything.'
          : '유료 플랜은 매월 선불로 청구되며 해지하실 때까지 자동 갱신됩니다. 언제든 해지 가능하며, 결제된 기간까지는 이용하고 그 이후 갱신되지 않습니다. 이미 시작된 달에 대한 부분 환불은 없습니다. 가격 변경 시 최소 30일 전에 안내드립니다. 고객은 Nook에 어떤 비용도 지불하지 않습니다.'}
      </Section>

      <Section title={en ? 'Fair use' : '금지 행위'}>
        {en ? 'Please don’t:' : '다음 행위는 금지됩니다:'}
        <Bullets items={en ? [
          <>Copy, clone or tamper with NFC stamps, card numbers or coupon codes.</>,
          <>Automate taps, scrape the service, or try to break into other people’s accounts.</>,
          <>Use Nook to send spam, scams, or anything illegal.</>,
          <>Resell or white-label the service without our written agreement.</>,
        ] : [
          <>NFC 스탬프, 카드번호, 쿠폰 코드의 복제·위조·조작.</>,
          <>자동 탭, 크롤링, 타인 계정 침입 시도.</>,
          <>스팸·사기·불법 목적의 이용.</>,
          <>서면 동의 없는 재판매 또는 화이트라벨 사용.</>,
        ]} />
      </Section>

      <Section title={en ? 'Availability' : '서비스 제공'}>
        {en
          ? 'We work hard to keep Nook running, but we can’t promise it will never go down. Service is provided "as is". If the app is unavailable, a shop can still serve its customers the normal way — please be kind to the staff.'
          : '서비스 유지에 최선을 다하지만 무중단을 약속드릴 수는 없습니다. 서비스는 "있는 그대로" 제공됩니다. 앱이 동작하지 않아도 매장은 평소처럼 응대할 수 있으니 직원분들께 너그러이 대해주세요.'}
      </Section>

      <Section title={en ? 'Limits of liability' : '책임의 제한'}>
        {en
          ? 'To the fullest extent the law allows, Nook is not liable for indirect or consequential losses, lost profits, or lost data. Our total liability to a shop is capped at what that shop paid us in the 3 months before the claim. For customers, who pay nothing, our liability is limited to restoring your stamp balance where we can. Nothing here limits liability that cannot legally be limited.'
          : '법이 허용하는 최대 범위에서, Nook은 간접·결과적 손해, 일실이익, 데이터 손실에 대해 책임지지 않습니다. 매장에 대한 총 책임 한도는 청구 발생 직전 3개월간 해당 매장이 지불한 금액입니다. 비용을 지불하지 않는 고객에 대해서는 가능한 범위에서 적립 내역을 복구하는 것으로 책임이 한정됩니다. 법적으로 제한할 수 없는 책임은 제한되지 않습니다.'}
      </Section>

      <Section title={en ? 'Ending things' : '이용 종료'}>
        {en
          ? 'You can stop using Nook and delete your account at any time. We may suspend or close an account that breaks these terms, that we’re legally required to close, or that hasn’t paid. If we close a paid account without cause, we refund the unused portion.'
          : '언제든 이용을 중단하고 계정을 삭제할 수 있습니다. 저희는 본 약관을 위반하거나, 법적으로 요구되거나, 요금이 미납된 계정을 정지·해지할 수 있습니다. 저희 귀책 없이 유료 계정을 해지하는 경우 미사용 기간을 환불합니다.'}
      </Section>

      <Section title={en ? 'Privacy' : '개인정보'}>
        {en ? 'How we handle your data is explained in our ' : '개인정보 처리 방식은 '}
        <a href="/privacy">{en ? 'Privacy Policy' : '개인정보처리방침'}</a>
        {en ? ', which is part of these terms.' : '에 설명되어 있으며, 본 약관의 일부입니다.'}
      </Section>

      <Section title={en ? 'Governing law' : '준거법'}>
        {en
          ? 'These terms are governed by the laws of the State of New Jersey, USA, without regard to conflict-of-law rules. Disputes will be handled in the state or federal courts located in New Jersey.'
          : '본 약관은 미국 뉴저지주 법률에 따르며, 국제사법 원칙은 적용하지 않습니다. 분쟁은 뉴저지주 소재 주법원 또는 연방법원에서 다룹니다.'}
      </Section>

      <Section title={en ? 'Contact' : '문의'}>
        <a href="mailto:hello@nook-wallet.com">hello@nook-wallet.com</a>
      </Section>
    </LegalPage>
  );
}
