const DEFAULT_MAPS_API_KEY = "AIzaSyCw_xaujh1NWIpk5u3K0DiiZ1UYKkrfR6Y";
const GOOGLE_MAPS_SCRIPT_ID = "google-maps-js";

let mapsLoaderPromise: Promise<void> | null = null;

export const loadGoogleMapsApi = (): Promise<void> => {
  if (typeof window === "undefined") {
    return Promise.resolve();
  }

  if (window.google?.maps) {
    return Promise.resolve();
  }

  if (mapsLoaderPromise) {
    return mapsLoaderPromise;
  }

  mapsLoaderPromise = new Promise((resolve, reject) => {
    const existingScript = document.getElementById(
      GOOGLE_MAPS_SCRIPT_ID,
    ) as HTMLScriptElement | null;

    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(), { once: true });
      existingScript.addEventListener(
        "error",
        () => reject(new Error("Failed to load Google Maps API script.")),
        { once: true },
      );
      return;
    }

    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || DEFAULT_MAPS_API_KEY;
    const script = document.createElement("script");
    script.id = GOOGLE_MAPS_SCRIPT_ID;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () =>
      reject(new Error("Failed to load Google Maps API script."));

    document.head.appendChild(script);
  });

  return mapsLoaderPromise;
};
