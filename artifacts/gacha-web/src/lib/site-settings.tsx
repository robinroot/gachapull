import { createContext, useContext, useEffect, useState, useCallback } from "react";

export type SiteSettings = {
  siteName: string;
  siteTagline: string;
  faviconUrl: string;
  metaDescription: string;
  metaKeywords: string;
  ogTitle: string;
  ogDescription: string;
  ogImageUrl: string;
};

const DEFAULTS: SiteSettings = {
  siteName: "GachaPull",
  siteTagline: "Pokemon & One Piece",
  faviconUrl: "",
  metaDescription: "",
  metaKeywords: "",
  ogTitle: "",
  ogDescription: "",
  ogImageUrl: "",
};

const SiteSettingsContext = createContext<{
  settings: SiteSettings;
  refetch: () => void;
}>({ settings: DEFAULTS, refetch: () => {} });

export function SiteSettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<SiteSettings>(DEFAULTS);

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch("/api/site-settings");
      if (!res.ok) return;
      const data = await res.json() as Partial<SiteSettings>;
      setSettings({ ...DEFAULTS, ...data });
    } catch {
      // silently fall back to defaults
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  // Apply favicon dynamically
  useEffect(() => {
    const url = settings.faviconUrl;
    if (!url) return;
    let link = document.querySelector<HTMLLinkElement>("link[rel~='icon']");
    if (!link) {
      link = document.createElement("link");
      link.rel = "icon";
      document.head.appendChild(link);
    }
    link.href = url;
  }, [settings.faviconUrl]);

  // Apply meta tags dynamically
  useEffect(() => {
    const setMeta = (name: string, content: string) => {
      if (!content) return;
      let el = document.querySelector<HTMLMetaElement>(`meta[name="${name}"]`);
      if (!el) {
        el = document.createElement("meta");
        el.name = name;
        document.head.appendChild(el);
      }
      el.content = content;
    };
    const setOgMeta = (property: string, content: string) => {
      if (!content) return;
      let el = document.querySelector<HTMLMetaElement>(`meta[property="${property}"]`);
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute("property", property);
        document.head.appendChild(el);
      }
      el.content = content;
    };

    setMeta("description", settings.metaDescription);
    setMeta("keywords", settings.metaKeywords);
    setOgMeta("og:site_name", settings.siteName);
    setOgMeta("og:title", settings.ogTitle || settings.siteName);
    setOgMeta("og:description", settings.ogDescription || settings.metaDescription);
    if (settings.ogImageUrl) setOgMeta("og:image", settings.ogImageUrl);
  }, [settings]);

  return (
    <SiteSettingsContext.Provider value={{ settings, refetch: fetchSettings }}>
      {children}
    </SiteSettingsContext.Provider>
  );
}

export function useSiteSettings() {
  return useContext(SiteSettingsContext);
}
