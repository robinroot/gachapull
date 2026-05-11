import { useEffect } from "react";
import { useSiteSettings } from "@/lib/site-settings";

export function useTitle(title: string) {
  const { settings } = useSiteSettings();
  useEffect(() => {
    document.title = `${title} | ${settings.siteName}`;
  }, [title, settings.siteName]);
}

export function formatIdr(amount: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatUsd(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

export function formatCoins(amount: number) {
  return new Intl.NumberFormat("en-US").format(amount);
}
