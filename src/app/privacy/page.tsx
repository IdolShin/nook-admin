'use client';

import LegalPage, { Section, Bullets, Callout, useLegalLang } from '@/components/LegalPage';

export default function PrivacyPage() {
  const [lang, setLang] = useLegalLang();
  const en = lang === 'en';

  return (
    <LegalPage
      lang={lang}
      setLang={setLang}
      eyebrow="NOOK WALLET"
      title={en ? 'Privacy Policy' : '개인정보처리방침'}
      updated={en ? 'Last updated: August 15, 2026' : '최종 수정일: 2026년 8월 15일'}
    >
      <Section title={en ? 'The short version' : '요약'}>
        {en ? (
          <>
            Nook Wallet is a digital loyalty card service. We collect the minimum needed to
            keep your stamps working: who you are, which shops you joined, and when you visited.
            We do not sell your data, we do not run ads, and we do not share your information
            with anyone except the shop whose card you signed up for and the vendors that run
            our service.
          </>
        ) : (
          <>
            Nook Wallet은 디지털 적립카드 서비스입니다. 스탬프가 제대로 동작하는 데 꼭 필요한 정보만
            수집합니다 — 누구인지, 어느 매장에 가입했는지, 언제 방문했는지. 데이터를 판매하지 않고,
            광고에 사용하지 않으며, 가입하신 매장과 서비스 운영에 필요한 업체 외에는 공유하지 않습니다.
          </>
        )}
      </Section>

      <Section title={en ? 'Who we are' : '운영 주체'}>
        {en
          ? 'Nook Wallet is operated by Woosang Shin (New Jersey, USA). Questions about this policy? Email '
          : 'Nook Wallet은 신우상(미국 뉴저지)이 운영합니다. 본 방침에 대한 문의는 '}
        <a href="mailto:hello@nook-wallet.com">hello@nook-wallet.com</a>
        {en ? '.' : ' 으로 보내주세요.'}
      </Section>

      <Section title={en ? 'What we collect' : '수집하는 정보'}>
        <b>{en ? 'Customers (people collecting stamps)' : '고객 (스탬프를 모으시는 분)'}</b>
        <Bullets items={en ? [
          <>Your nickname or display name, and your card number (e.g. NOO12345).</>,
          <>Your email and name, if you sign in with Google or create an account with a password. Passwords are stored only as a one-way hash — we never see them.</>,
          <>Your birth month and day, only if you choose to give it, so a shop can send you a birthday reward. We do not ask for your birth year.</>,
          <>Your stamp, point and coupon history for each shop you joined, including visit timestamps.</>,
          <>Your approximate location, only while the wallet screen is open and only if you allow it in your browser. It is used on your device to sort nearby shops to the top and is never stored on our servers.</>,
          <>Basic technical data such as your browser type and IP address, kept in server logs for security and troubleshooting.</>,
        ] : [
          <>닉네임(표시 이름)과 카드번호 (예: NOO12345).</>,
          <>구글로 로그인하거나 비밀번호 계정을 만드신 경우 이메일과 이름. 비밀번호는 단방향 해시로만 저장되어 저희도 원문을 볼 수 없습니다.</>,
          <>생일 월·일 (직접 입력하신 경우에 한함) — 매장의 생일 쿠폰 발송용. 출생 연도는 받지 않습니다.</>,
          <>가입하신 매장별 스탬프·포인트·쿠폰 내역과 방문 시각.</>,
          <>대략적인 위치 — 월렛 화면을 열어둔 동안, 브라우저에서 허용하신 경우에만. 가까운 매장을 위로 정렬하는 데 기기 안에서만 쓰이며 서버에 저장하지 않습니다.</>,
          <>브라우저 종류, IP 주소 등 기본 기술 정보 — 보안 및 장애 대응 목적의 서버 로그.</>,
        ]} />

        <div style={{ marginTop: 18 }}>
          <b>{en ? 'Business owners' : '매장 사장님'}</b>
        </div>
        <Bullets items={en ? [
          <>Business name, owner email, phone and store address (address is used to place your shop on the map for nearby customers).</>,
          <>Your loyalty card settings, coupons, and aggregate stats about your own customers.</>,
        ] : [
          <>상호명, 사장님 이메일, 연락처, 매장 주소 (주소는 근처 고객에게 매장을 노출하는 데 사용).</>,
          <>적립카드 설정, 쿠폰, 본인 매장 고객에 대한 통계.</>,
        ]} />
      </Section>

      <Section title={en ? 'What we never collect' : '수집하지 않는 정보'}>
        <Bullets items={en ? [
          <>Payment card numbers, bank details, or any financial account information from customers.</>,
          <>Social security numbers or government IDs.</>,
          <>Your contacts, photos, messages, or files.</>,
          <>Background or continuous location tracking.</>,
        ] : [
          <>고객의 카드번호, 계좌정보 등 금융정보.</>,
          <>주민등록번호·신분증 정보.</>,
          <>연락처, 사진, 메시지, 파일.</>,
          <>백그라운드 위치 추적.</>,
        ]} />
      </Section>

      <Section title={en ? 'How we use it' : '이용 목적'}>
        <Bullets items={en ? [
          <>To show your stamp balance and rewards, and to add a stamp when you tap an NFC stamp or a staff member enters your card number.</>,
          <>To send notifications you asked for — a stamp was added, a reward is ready, a coupon arrived, or a birthday gift from a shop.</>,
          <>To let you sign in and keep you signed in, so the right card gets the stamp.</>,
          <>To give each shop stats about its own customers (visit counts, how many rewards were redeemed).</>,
          <>To keep the service secure — for example a short cooldown between taps so one card can’t be scanned repeatedly by mistake.</>,
        ] : [
          <>스탬프 잔량과 리워드를 보여주고, NFC 스탬프에 탭하거나 직원이 카드번호를 입력했을 때 적립 처리.</>,
          <>동의하신 알림 발송 — 적립 완료, 리워드 준비, 쿠폰 도착, 생일 선물 등.</>,
          <>로그인 및 로그인 유지 — 올바른 카드에 적립되도록.</>,
          <>매장별 자체 고객 통계 제공 (방문 수, 리워드 사용 수).</>,
          <>서비스 보호 — 예: 실수로 연속 적립되지 않도록 탭 간 대기시간 적용.</>,
        ]} />
      </Section>

      <Section title={en ? 'Google sign-in' : '구글 로그인'}>
        {en ? (
          <>
            If you sign in with Google, we receive only your name, email address and profile
            picture from Google. We use it to create your Nook account and to recognize you when
            you come back on a different phone. That is the only thing we use Google for — your
            cards themselves live in Nook Wallet, not in any Google product.
            {' '}
            <i>
              Legacy note: a small number of early users added a pass to Google Wallet before we
              moved to Nook Wallet. For those existing passes only, we still send Google the shop
              name, card number and stamp balance so the pass doesn’t go stale. No new passes are
              created.
            </i>
          </>
        ) : (
          <>
            구글로 로그인하시면 구글로부터 이름, 이메일, 프로필 사진만 받습니다. Nook 계정 생성과
            다른 기기에서 재방문 시 본인 확인에만 사용합니다. 구글은 로그인에만 쓰이며, 카드 자체는
            구글이 아닌 Nook Wallet에 보관됩니다.
            {' '}
            <i>
              참고: Nook Wallet으로 전환하기 전 일부 초기 이용자가 구글 월렛에 패스를 추가했습니다.
              해당 기존 패스에 한해, 내용이 오래되지 않도록 매장명·카드번호·적립 수를 구글에
              계속 전송합니다. 새로 발급되는 패스는 없습니다.
            </i>
          </>
        )}
        <Callout>
          {en ? (
            <>
              <b>Limited Use:</b> Nook Wallet’s use and transfer of information received from
              Google APIs adheres to the{' '}
              <a href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noopener noreferrer">
                Google API Services User Data Policy
              </a>, including the Limited Use requirements. We do not use Google user data for
              advertising, and we do not sell it or transfer it to third parties except as needed
              to provide this service.
            </>
          ) : (
            <>
              <b>제한적 사용:</b> Nook Wallet이 구글 API로부터 받은 정보의 사용 및 전송은{' '}
              <a href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noopener noreferrer">
                Google API Services User Data Policy
              </a>의 Limited Use 요건을 준수합니다. 구글 사용자 데이터를 광고에 사용하지 않으며,
              서비스 제공에 필요한 경우를 제외하고 판매하거나 제3자에게 전송하지 않습니다.
            </>
          )}
        </Callout>
      </Section>

      <Section title={en ? 'Who else sees your data' : '제3자 제공'}>
        {en
          ? 'We share only what each party needs to do its job:'
          : '각 업체가 역할 수행에 필요한 범위 내에서만 공유합니다:'}
        <Bullets items={en ? [
          <><b>The shop you joined</b> — sees your display name, card number, stamp history and birthday month/day (if given). A shop can only see its own customers, never another shop’s.</>,
          <><b>Supabase</b> — database hosting.</>,
          <><b>Railway</b> — application hosting.</>,
          <><b>Google</b> — sign-in only (if you choose to sign in with Google).</>,
          <><b>Resend</b> — sending emails such as password resets and coupons.</>,
        ] : [
          <><b>가입하신 매장</b> — 표시 이름, 카드번호, 적립 내역, 생일 월·일(입력 시)을 봅니다. 매장은 자기 고객만 볼 수 있고 다른 매장 고객은 볼 수 없습니다.</>,
          <><b>Supabase</b> — 데이터베이스 호스팅.</>,
          <><b>Railway</b> — 애플리케이션 호스팅.</>,
          <><b>Google</b> — 구글 로그인을 사용하시는 경우 로그인 처리에만.</>,
          <><b>Resend</b> — 비밀번호 재설정·쿠폰 등 이메일 발송.</>,
        ]} />
        <div style={{ marginTop: 12 }}>
          {en
            ? 'We do not sell your personal information, and we do not share it for advertising or cross-context behavioral advertising.'
            : '개인정보를 판매하지 않으며, 광고 목적으로 제공하지 않습니다.'}
        </div>
      </Section>

      <Section title={en ? 'How long we keep it' : '보유 기간'}>
        {en ? (
          <>
            We keep your card and stamp history for as long as your account exists, so your
            progress isn’t lost. Delete your account and it all goes — permanently, within 30 days,
            including backups. Server logs are kept for up to 90 days.
          </>
        ) : (
          <>
            적립 내역이 사라지지 않도록 계정이 존재하는 동안 보관합니다. 계정을 삭제하시면 백업을
            포함해 30일 이내에 완전히 파기됩니다. 서버 로그는 최대 90일 보관합니다.
          </>
        )}
      </Section>

      <Section title={en ? 'Your choices' : '이용자의 권리'}>
        <Bullets items={en ? [
          <><b>See your data</b> — open your wallet at <a href="/wallet">nook-wallet.com/wallet</a>.</>,
          <><b>Remove one card</b> — tap the card in your wallet and remove it.</>,
          <><b>Delete everything</b> — delete your account from your wallet screen, or email us and we’ll do it within 7 days.</>,
          <><b>Stop notifications</b> — turn them off in your browser or phone settings at any time.</>,
          <><b>Turn off location</b> — deny the browser permission; nearby sorting simply stops.</>,
          <><b>Ask a shop to remove you</b> — any shop can delete a customer from its own dashboard.</>,
        ] : [
          <><b>내 정보 확인</b> — <a href="/wallet">nook-wallet.com/wallet</a> 에서 월렛 열기.</>,
          <><b>카드 1장만 삭제</b> — 월렛에서 해당 카드 선택 후 삭제.</>,
          <><b>전체 삭제</b> — 월렛 화면에서 계정 삭제, 또는 메일 주시면 7일 이내 처리.</>,
          <><b>알림 중단</b> — 브라우저·휴대폰 설정에서 언제든 해제.</>,
          <><b>위치 끄기</b> — 브라우저 권한 거부 시 근처 정렬만 동작하지 않습니다.</>,
          <><b>매장에 삭제 요청</b> — 매장은 대시보드에서 고객을 삭제할 수 있습니다.</>,
        ]} />
      </Section>

      <Section title={en ? 'Children' : '아동'}>
        {en
          ? 'Nook Wallet is not directed at children under 13, and we do not knowingly collect their information. If you believe a child has signed up, email us and we will delete the account.'
          : 'Nook Wallet은 만 13세 미만 아동을 대상으로 하지 않으며, 알면서 정보를 수집하지 않습니다. 아동이 가입한 것으로 보이면 메일 주시면 삭제하겠습니다.'}
      </Section>

      <Section title={en ? 'Security' : '보안'}>
        {en
          ? 'All traffic is encrypted over HTTPS. Passwords are hashed with bcrypt. NFC stamps use one-time cryptographic counters so a tap cannot be copied and replayed. No system is perfect, so please use a password you don’t reuse elsewhere.'
          : '모든 통신은 HTTPS로 암호화됩니다. 비밀번호는 bcrypt로 해시 처리합니다. NFC 스탬프는 일회용 암호 카운터를 사용해 복제·재사용을 막습니다. 완벽한 시스템은 없으니 다른 곳과 다른 비밀번호를 사용해주세요.'}
      </Section>

      <Section title={en ? 'Changes' : '변경'}>
        {en
          ? 'If we make a meaningful change to this policy, we will update the date at the top and, for significant changes, notify you in the app or by email.'
          : '중요한 변경이 있으면 상단 날짜를 갱신하고, 중대한 변경은 앱 내 또는 이메일로 알려드립니다.'}
      </Section>
    </LegalPage>
  );
}
