export const businesses = [
  { id: "all",     name: "All businesses", short: "ALL", color: "#1D9E75", customers: 284 },
  { id: "nook",    name: "Nook Café",      short: "NC",  color: "#1D9E75", customers: 128, emoji: String.fromCharCode(0x2615) },
  { id: "kook",    name: "Kook 미용실",     short: "K",   color: "#3B6BCC", customers: 76,  emoji: "✂️" },
  { id: "fortlee", name: "Fort Lee Gym",   short: "FL",  color: "#C26B1F", customers: 53,  emoji: "💪" },
  { id: "kbbq",    name: "Korean BBQ",     short: "KB",  color: "#C53A6B", customers: 27,  emoji: "🥩" },
];

export const trend30 = [
  41, 38, 52, 47, 55, 62, 49, 58, 64, 71,
  68, 75, 82, 78, 85, 91, 87, 79, 88, 96,
  103, 98, 105, 112, 108, 117, 121, 115, 124, 132,
];

export const redeem30 = [
  8, 11, 9, 14, 12, 18, 15, 17, 19, 22,
  24, 21, 27, 25, 28, 31, 29, 26, 32, 35,
  37, 34, 38, 41, 39, 42, 45, 43, 47, 49,
];

export const cardMix = [
  { label: "Stamp",      value: 178, color: "#1D9E75" },
  { label: "Coupon",     value: 96,  color: "#3B6BCC" },
  { label: "Cashback",   value: 54,  color: "#C26B1F" },
  { label: "Membership", value: 31,  color: "#C53A6B" },
];

export const bizActivity = [
  { name: "Nook Café",    stamps: 412, redemptions: 138, color: "#1D9E75" },
  { name: "Kook 미용실",   stamps: 264, redemptions: 81,  color: "#3B6BCC" },
  { name: "Fort Lee Gym", stamps: 187, redemptions: 52,  color: "#C26B1F" },
  { name: "Korean BBQ",   stamps: 96,  redemptions: 28,  color: "#C53A6B" },
];

export const activity = [
  { type: "stamp",  who: "Min-jae K.",  biz: "Nook Café",    when: "2 min ago",  detail: "+1 stamp " + String.fromCharCode(183) + " 7/10" },
  { type: "redeem", who: "Sarah Chen",  biz: "Korean BBQ",   when: "8 min ago",  detail: "Redeemed: Free entrée" },
  { type: "signup", who: "David P.",    biz: "Fort Lee Gym", when: "14 min ago", detail: "New customer " + String.fromCharCode(183) + " Wallet added" },
  { type: "stamp",  who: "Hye-jin L.",  biz: "Kook 미용실",   when: "22 min ago", detail: "+1 stamp " + String.fromCharCode(183) + " 3/8" },
  { type: "push",   who: "—",           biz: "Nook Café",    when: "31 min ago", detail: "Sent to 128 customers" },
  { type: "redeem", who: "Marco V.",    biz: "Nook Café",    when: "47 min ago", detail: "Redeemed: Free latte" },
  { type: "stamp",  who: "Yu-jin S.",   biz: "Kook 미용실",   when: "1h ago",     detail: "+1 stamp " + String.fromCharCode(183) + " 5/8" },
  { type: "signup", who: "Olivia R.",   biz: "Korean BBQ",   when: "2h ago",     detail: "New customer " + String.fromCharCode(183) + " Wallet added" },
];

export const scheduledPush = [
  { biz: "Nook Café",    title: "Weekend special: 2x stamps",          when: "Tomorrow, 9:00 AM", reach: 128, status: "scheduled" },
  { biz: "Korean BBQ",   title: "We miss you — 10% off this week",     when: "May 2, 11:00 AM",   reach: 27,  status: "scheduled" },
  { biz: "Fort Lee Gym", title: "New class drop " + String.fromCharCode(183) + " Saturday boot camp", when: "May 3, 7:00 AM",    reach: 53,  status: "draft" },
];

export const cards = [
  { id: "c1",  name: "Coffee lovers",       biz: "Nook Café",    bizColor: "#1D9E75", type: "stamp",      status: "active", active: 86, issued: 412, redemptions: 138, reward: "Free latte after 10 stamps",       updated: "2h ago",  stamps: 10, gradient: ["#0F4D38","#1D9E75"] },
  { id: "c2",  name: "Weekend special",     biz: "Nook Café",    bizColor: "#1D9E75", type: "coupon",     status: "active", active: 42, issued: 64,  redemptions: 31,  reward: "20% off all drinks",               updated: "1d ago",  stamps: null, gradient: ["#1B3D24","#3F8F5C"] },
  { id: "c3",  name: "Hair refresh",        biz: "Kook 미용실",   bizColor: "#3B6BCC", type: "stamp",      status: "active", active: 58, issued: 264, redemptions: 81,  reward: "Free cut after 8 visits",          updated: "5h ago",  stamps: 8, gradient: ["#0F2A55","#3B6BCC"] },
  { id: "c4",  name: "VIP membership",      biz: "Kook 미용실",   bizColor: "#3B6BCC", type: "membership", status: "active", active: 12, issued: 12,  redemptions: 4,   reward: "Priority booking + 15% off",       updated: "3d ago",  stamps: null, gradient: ["#1A1A1F","#3F4252"] },
  { id: "c5",  name: "Gym starter pack",    biz: "Fort Lee Gym", bizColor: "#C26B1F", type: "cashback",   status: "active", active: 36, issued: 142, redemptions: 41,  reward: "5% back on every visit",           updated: "12h ago", stamps: null, gradient: ["#5C2F0E","#C26B1F"] },
  { id: "c6",  name: "Boot camp pass",      biz: "Fort Lee Gym", bizColor: "#C26B1F", type: "stamp",      status: "draft",  active: 0,  issued: 0,   redemptions: 0,   reward: "Free class after 6 sessions",      updated: "Just now", stamps: 6, gradient: ["#5C2F0E","#C26B1F"] },
  { id: "c7",  name: "BBQ feast card",      biz: "Korean BBQ",   bizColor: "#C53A6B", type: "stamp",      status: "active", active: 27, issued: 96,  redemptions: 28,  reward: "Free entrée after 7 visits",       updated: "1d ago",  stamps: 7, gradient: ["#5C1A30","#C53A6B"] },
  { id: "c8",  name: "Anniversary coupon",  biz: "Korean BBQ",   bizColor: "#C53A6B", type: "coupon",     status: "paused", active: 14, issued: 28,  redemptions: 9,   reward: "Free dessert on birthday",         updated: "1w ago",  stamps: null, gradient: ["#5C1A30","#C53A6B"] },
  { id: "c9",  name: "Welcome bonus",       biz: "Nook Café",    bizColor: "#1D9E75", type: "coupon",     status: "active", active: 50, issued: 78,  redemptions: 22,  reward: "Free pastry on signup",            updated: "2d ago",  stamps: null, gradient: ["#0F4D38","#1D9E75"] },
  { id: "c10", name: "Color treatment club",biz: "Kook 미용실",   bizColor: "#3B6BCC", type: "stamp",      status: "active", active: 19, issued: 47,  redemptions: 12,  reward: "Free toner after 5 colors",        updated: "4d ago",  stamps: 5, gradient: ["#0F2A55","#3B6BCC"] },
  { id: "c11", name: "Personal trainer pass",biz: "Fort Lee Gym",bizColor: "#C26B1F", type: "membership", status: "active", active: 8,  issued: 8,   redemptions: 2,   reward: "10 PT sessions / month",           updated: "6d ago",  stamps: null, gradient: ["#5C2F0E","#C26B1F"] },
  { id: "c12", name: "Group dinner deal",   biz: "Korean BBQ",   bizColor: "#C53A6B", type: "coupon",     status: "draft",  active: 0,  issued: 0,   redemptions: 0,   reward: "Group of 4: 1 free portion",      updated: "Today",   stamps: null, gradient: ["#5C1A30","#C53A6B"] },
];

export const customers = [
  { id: "u1",  name: "Min-jae Kim",  initials: "MK", color: "#1D9E75", phone: "+1 201 555 0142", joined: "Mar 8, 2026",  biz: ["Nook Café"],                         cards: 2, totalStamps: 38,  lastVisit: "2 min ago", spend: 412,  status: "vip",    tags: ["regular","weekday"] },
  { id: "u2",  name: "Sarah Chen",   initials: "SC", color: "#3B6BCC", phone: "+1 201 555 0184", joined: "Jan 22, 2026", biz: ["Korean BBQ","Nook Café"],            cards: 3, totalStamps: 72,  lastVisit: "8 min ago", spend: 980,  status: "vip",    tags: ["high-value"] },
  { id: "u3",  name: "David Park",   initials: "DP", color: "#C26B1F", phone: "+1 201 555 0119", joined: "Apr 14, 2026", biz: ["Fort Lee Gym"],                      cards: 1, totalStamps: 4,   lastVisit: "14 min ago", spend: 98,  status: "new",    tags: ["new"] },
  { id: "u4",  name: "Hye-jin Lee",  initials: "HL", color: "#C53A6B", phone: "+1 201 555 0177", joined: "Feb 3, 2026",  biz: ["Kook 미용실"],                        cards: 2, totalStamps: 14,  lastVisit: "22 min ago", spend: 245, status: "active", tags: ["referrer"] },
  { id: "u5",  name: "Marco Velez",  initials: "MV", color: "#1D9E75", phone: "+1 201 555 0163", joined: "Dec 12, 2025", biz: ["Nook Café"],                         cards: 1, totalStamps: 22,  lastVisit: "47 min ago", spend: 156, status: "active", tags: ["weekend"] },
  { id: "u6",  name: "Yu-jin Song",  initials: "YS", color: "#3B6BCC", phone: "+1 201 555 0125", joined: "Mar 30, 2026", biz: ["Kook 미용실","Nook Café"],            cards: 2, totalStamps: 19,  lastVisit: "1h ago",    spend: 318, status: "active", tags: ["regular"] },
  { id: "u7",  name: "Olivia Rocha", initials: "OR", color: "#C53A6B", phone: "+1 201 555 0102", joined: "Apr 28, 2026", biz: ["Korean BBQ"],                        cards: 1, totalStamps: 1,   lastVisit: "2h ago",    spend: 42,  status: "new",    tags: ["new"] },
  { id: "u8",  name: "James Cho",    initials: "JC", color: "#1A1A1F", phone: "+1 201 555 0156", joined: "Nov 4, 2025",  biz: ["Nook Café","Fort Lee Gym","Kook 미용실"], cards: 4, totalStamps: 124, lastVisit: "5h ago",  spend: 1842, status: "vip",   tags: ["high-value","referrer"] },
  { id: "u9",  name: "Nora Singh",   initials: "NS", color: "#C26B1F", phone: "+1 201 555 0188", joined: "Mar 18, 2026", biz: ["Fort Lee Gym"],                      cards: 1, totalStamps: 8,   lastVisit: "Yesterday", spend: 132, status: "at-risk", tags: ["lapsing"] },
  { id: "u10", name: "Dani Suh",     initials: "DS", color: "#3B6BCC", phone: "+1 201 555 0110", joined: "Feb 22, 2026", biz: ["Kook 미용실"],                        cards: 1, totalStamps: 6,   lastVisit: "3d ago",    spend: 180, status: "at-risk", tags: ["lapsing"] },
];

export const cohortRetention = [
  [100, 78, 64, 52, 44, 38, 35],
  [100, 82, 71, 60, 51, 45],
  [100, 85, 73, 63, 56],
  [100, 80, 69, 60],
  [100, 84, 72],
  [100, 81],
];

export const pastCampaigns = [
  { title: "Free pastry weekend",    biz: "Nook Café",    sent: "Apr 26", reach: 128, opens: 84, ctr: "65.6%" },
  { title: "10% off this week",      biz: "Korean BBQ",   sent: "Apr 22", reach: 27,  opens: 19, ctr: "70.3%" },
  { title: "New trainer announcement",biz: "Fort Lee Gym", sent: "Apr 19", reach: 53,  opens: 31, ctr: "58.4%" },
  { title: "Spring color promo",     biz: "Kook 미용실",   sent: "Apr 14", reach: 76,  opens: 42, ctr: "55.2%" },
];
