import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const typeMeta: Record<string, { label: string; color: string; bg: string; text: string }> = {
  stamp:      { label: "Stamp",      color: "#1D9E75", bg: "#E8F7F2", text: "#085041" },
  coupon:     { label: "Coupon",     color: "#3B6BCC", bg: "#E5EDF8", text: "#1F4E94" },
  cashback:   { label: "Cashback",   color: "#C26B1F", bg: "#FBEFD9", text: "#8C5A11" },
  membership: { label: "Membership", color: "#1A1A1F", bg: "#EDEDF0", text: "#1A1A1F" },
};

export const statusMeta: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  active:   { label: "Active",  color: "#0D6B45", bg: "#E8F7F2", dot: "#1D9E75" },
  draft:    { label: "Draft",   color: "#5C5F66", bg: "#F0F1F4", dot: "#8A8D94" },
  paused:   { label: "Paused",  color: "#8C5A11", bg: "#FBEFD9", dot: "#C26B1F" },
};

export const customerStatusMeta: Record<string, { label: string; bg: string; fg: string; dot: string }> = {
  vip:      { label: "VIP",     bg: "#FBEFD9", fg: "#8C5A11", dot: "#C26B1F" },
  active:   { label: "Active",  bg: "#E8F7F2", fg: "#085041", dot: "#1D9E75" },
  new:      { label: "New",     bg: "#E5EDF8", fg: "#1F4E94", dot: "#3B6BCC" },
  "at-risk": { label: "At risk", bg: "#FBE6EE", fg: "#99355C", dot: "#C53A6B" },
};
