// Google Maps JS API loader (singleton)
let loader: Promise<any> | null = null;

export function loadGoogleMaps(): Promise<any> {
  if (typeof window === "undefined") return Promise.reject(new Error("no window"));
  const w = window as any;
  if (w.google?.maps) return Promise.resolve(w.google);
  if (loader) return loader;

  loader = new Promise((resolve, reject) => {
    w.__foxInitMaps = () => resolve(w.google);
    const key = import.meta.env.VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_BROWSER_KEY;
    const ch = import.meta.env.VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_TRACKING_ID ?? "";
    if (!key) {
      reject(new Error("Google Maps browser key missing"));
      return;
    }
    const s = document.createElement("script");
    s.src = `https://maps.googleapis.com/maps/api/js?key=${key}&loading=async&libraries=places,marker&callback=__foxInitMaps${ch ? `&channel=${ch}` : ""}`;
    s.async = true;
    s.onerror = () => reject(new Error("Failed to load Google Maps"));
    document.head.appendChild(s);
  });
  return loader;
}

// Gaborone, Botswana
export const BW_CENTER = { lat: -24.6282, lng: 25.9231 };
