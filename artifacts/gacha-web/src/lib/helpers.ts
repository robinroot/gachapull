import { useEffect } from "react";

export function useTitle(title: string) {
  useEffect(() => {
    document.title = `${title} | GachaPull`;
  }, [title]);
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
