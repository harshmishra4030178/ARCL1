"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  FaSearch,
  FaTimes,
  FaCheck,
  FaBuilding,
  FaCompass,
  FaMapMarkerAlt,
  FaCrosshairs,
  FaSatellite,
  FaInfoCircle,
  FaCheckCircle,
  FaSlidersH,
} from "react-icons/fa";
import { toast } from "react-toastify";

/**
 * Dynamically load Leaflet JS and CSS from CDN with fallback.
 * Works seamlessly in client-side React / Next.js without SSR issues.
 */
const loadLeafletAssets = () => {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") return resolve(null);
    if (window.L) return resolve(window.L);

    // 1. Inject Leaflet CSS
    if (!document.getElementById("leaflet-css-cdn")) {
      const link = document.createElement("link");
      link.id = "leaflet-css-cdn";
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }

    // 2. Inject Leaflet JS
    if (document.getElementById("leaflet-js-cdn")) {
      const script = document.getElementById("leaflet-js-cdn");
      if (window.L) return resolve(window.L);
      script.addEventListener("load", () => resolve(window.L));
      script.addEventListener("error", () => reject(new Error("Failed to load Leaflet JS")));
      return;
    }

    const script = document.createElement("script");
    script.id = "leaflet-js-cdn";
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.async = true;

    script.onload = () => {
      if (window.L) {
        resolve(window.L);
      } else {
        reject(new Error("Leaflet loaded but window.L is undefined"));
      }
    };

    script.onerror = () => {
      // Fallback CDN if unpkg is blocked
      const fallbackScript = document.createElement("script");
      fallbackScript.src = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.js";
      fallbackScript.async = true;
      fallbackScript.onload = () => resolve(window.L);
      fallbackScript.onerror = (e) => reject(e);
      document.head.appendChild(fallbackScript);
    };

    document.head.appendChild(script);
  });
};

const ARCL_AIROLI_LAB = {
  name: "ARCL Instruments Airoli Laboratory",
  address: "Shop No. 6, Siddhivinayak Park CHS, Sector - 8A, Airoli, Navi Mumbai, Maharashtra - 400708",
  latitude: 19.1553,
  longitude: 72.9982,
};

export default function OfficeLocationPickerModal({
  isOpen,
  onClose,
  initialLatitude = 19.1553,
  initialLongitude = 72.9982,
  initialRadius = 150,
  initialAddress = "",
  onConfirmLocation,
  autoLocateOnOpen = false,
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const circleRef = useRef(null);
  const watchIdRef = useRef(null);
  const searchTimeoutRef = useRef(null);

  const [coords, setCoords] = useState({
    latitude: initialLatitude || 19.1553,
    longitude: initialLongitude || 72.9982,
  });
  const [radiusMeters, setRadiusMeters] = useState(initialRadius || 150);
  const [address, setAddress] = useState(initialAddress || "");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [locating, setLocating] = useState(false);
  const [gpsAccuracy, setGpsAccuracy] = useState(null);
  const [mapReady, setMapReady] = useState(false);
  const [isReverseGeocoding, setIsReverseGeocoding] = useState(false);

  // Sync initial props on open
  useEffect(() => {
    if (isOpen) {
      const lat = initialLatitude || 19.1553;
      const lon = initialLongitude || 72.9982;
      setCoords({ latitude: lat, longitude: lon });
      setRadiusMeters(initialRadius || 150);
      setAddress(initialAddress || "");
      setSearchQuery("");
      setSearchResults([]);
      setGpsAccuracy(null);
    }
  }, [isOpen, initialLatitude, initialLongitude, initialRadius, initialAddress]);

  // Clean up GPS watcher on unmount or close
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null && typeof navigator !== "undefined" && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, []);

  // Reverse geocoding helper
  const performReverseGeocode = useCallback(async (lat, lon) => {
    try {
      setIsReverseGeocoding(true);
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`,
        { headers: { Accept: "application/json" } }
      );
      if (res.ok) {
        const data = await res.json();
        if (data?.display_name) {
          setAddress(data.display_name);
        }
      }
    } catch (e) {
      console.warn("Reverse geocode warning:", e);
    } finally {
      setIsReverseGeocoding(false);
    }
  }, []);

  // Update pin, circle, and coordinates
  const updateMapMarkerAndCircle = useCallback(
    (lat, lon, newRadius, shouldPan = false) => {
      setCoords({ latitude: parseFloat(lat.toFixed(6)), longitude: parseFloat(lon.toFixed(6)) });

      if (mapInstanceRef.current && markerRef.current) {
        const L = window.L;
        const targetLatLng = L.latLng(lat, lon);

        markerRef.current.setLatLng(targetLatLng);

        if (circleRef.current) {
          circleRef.current.setLatLng(targetLatLng);
          circleRef.current.setRadius(newRadius ?? radiusMeters);
        }

        if (shouldPan) {
          mapInstanceRef.current.panTo(targetLatLng, { animate: true, duration: 0.8 });
        }
      }
    },
    [radiusMeters]
  );

  // Initialize Leaflet Map
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;

    loadLeafletAssets()
      .then((L) => {
        if (!isMounted || !mapContainerRef.current || !L) return;

        // If map already initialized, invalidate size and pan
        if (mapInstanceRef.current) {
          setTimeout(() => {
            if (mapInstanceRef.current) {
              mapInstanceRef.current.invalidateSize();
              updateMapMarkerAndCircle(coords.latitude, coords.longitude, radiusMeters, true);
            }
          }, 200);
          return;
        }

        // Create Custom Red Delivery-Style Pin Icon
        const pinHtml = `
          <div style="position: relative; transform: translate(-50%, -100%);">
            <div style="width: 38px; height: 38px; background: #ef4444; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); display: flex; align-items: center; justify-content: center; box-shadow: 0 10px 25px -5px rgba(239, 68, 68, 0.6); border: 3px solid #ffffff;">
              <div style="width: 14px; height: 14px; background: #ffffff; border-radius: 50%; transform: rotate(45deg); display: flex; align-items: center; justify-content: center;">
                <div style="width: 6px; height: 6px; background: #ef4444; border-radius: 50%;"></div>
              </div>
            </div>
            <div style="width: 16px; height: 6px; background: rgba(0,0,0,0.35); border-radius: 50%; margin: -4px auto 0 auto; filter: blur(1.5px);"></div>
          </div>
        `;

        const customPinIcon = L.divIcon({
          className: "arcl-delivery-pin",
          html: pinHtml,
          iconSize: [38, 44],
          iconAnchor: [19, 44],
        });

        const map = L.map(mapContainerRef.current, {
          center: [coords.latitude, coords.longitude],
          zoom: 17,
          zoomControl: false,
        });

        // Add standard zoom control at bottom right
        L.control.zoom({ position: "bottomright" }).addTo(map);

        // OpenStreetMap street tiles
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          maxZoom: 19,
          attribution: '&copy; <a href="https://openstreetmap.org">OpenStreetMap</a>',
        }).addTo(map);

        // Draggable Marker
        const marker = L.marker([coords.latitude, coords.longitude], {
          icon: customPinIcon,
          draggable: true,
          autoPan: true,
        }).addTo(map);

        // Geofence Circle Overlay
        const circle = L.circle([coords.latitude, coords.longitude], {
          radius: radiusMeters,
          color: "#f59e0b",
          fillColor: "#f59e0b",
          fillOpacity: 0.16,
          weight: 2,
          dashArray: "6, 6",
        }).addTo(map);

        // Listen for marker drag
        marker.on("dragend", async () => {
          const pos = marker.getLatLng();
          circle.setLatLng(pos);
          const lat = parseFloat(pos.lat.toFixed(6));
          const lon = parseFloat(pos.lng.toFixed(6));
          setCoords({ latitude: lat, longitude: lon });
          await performReverseGeocode(lat, lon);
        });

        // Listen for click anywhere on map
        map.on("click", async (e) => {
          marker.setLatLng(e.latlng);
          circle.setLatLng(e.latlng);
          const lat = parseFloat(e.latlng.lat.toFixed(6));
          const lon = parseFloat(e.latlng.lng.toFixed(6));
          setCoords({ latitude: lat, longitude: lon });
          await performReverseGeocode(lat, lon);
        });

        mapInstanceRef.current = map;
        markerRef.current = marker;
        circleRef.current = circle;
        setMapReady(true);

        // Ensure smooth sizing after modal animation
        setTimeout(() => {
          if (mapInstanceRef.current) {
            mapInstanceRef.current.invalidateSize();
          }
        }, 300);

        // Auto trigger GPS if requested
        if (autoLocateOnOpen) {
          handleLocateMeHighAccuracy();
        }
      })
      .catch((err) => {
        console.error("Leaflet loader error:", err);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  // Update circle radius when slider moves
  useEffect(() => {
    if (circleRef.current) {
      circleRef.current.setRadius(radiusMeters);
    }
  }, [radiusMeters]);

  // Autocomplete Search Debounce
  const handleSearchInputChange = (e) => {
    const val = e.target.value;
    setSearchQuery(val);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (!val || val.trim().length < 2) {
      setSearchResults([]);
      setSearching(false);
      return;
    }

    setSearching(true);
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const query = val.trim();
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
            query
          )}&countrycodes=in&limit=6&addressdetails=1`,
          { headers: { Accept: "application/json" } }
        );
        if (res.ok) {
          const list = await res.json();
          setSearchResults(list || []);
        }
      } catch (err) {
        console.warn("Location search error:", err);
      } finally {
        setSearching(false);
      }
    }, 350);
  };

  // Select Search Item
  const handleSelectSearchResult = (item) => {
    const lat = parseFloat(item.lat);
    const lon = parseFloat(item.lon);
    if (!isNaN(lat) && !isNaN(lon)) {
      setCoords({ latitude: parseFloat(lat.toFixed(6)), longitude: parseFloat(lon.toFixed(6)) });
      setAddress(item.display_name || "");
      setSearchQuery("");
      setSearchResults([]);

      if (mapInstanceRef.current && markerRef.current) {
        const L = window.L;
        const target = L.latLng(lat, lon);
        markerRef.current.setLatLng(target);
        if (circleRef.current) {
          circleRef.current.setLatLng(target);
        }
        mapInstanceRef.current.flyTo(target, 18, { duration: 1.2 });
      }
      toast.info(`📍 Moved to: ${item.display_name?.split(",")[0] || "Selected Place"}`);
    }
  };

  // Preset ARCL Airoli Lab
  const handleSelectAiroliPreset = () => {
    const lat = ARCL_AIROLI_LAB.latitude;
    const lon = ARCL_AIROLI_LAB.longitude;
    setCoords({ latitude: lat, longitude: lon });
    setAddress(ARCL_AIROLI_LAB.address);
    setSearchQuery("");
    setSearchResults([]);

    if (mapInstanceRef.current && markerRef.current) {
      const L = window.L;
      const target = L.latLng(lat, lon);
      markerRef.current.setLatLng(target);
      if (circleRef.current) {
        circleRef.current.setLatLng(target);
      }
      mapInstanceRef.current.flyTo(target, 18, { duration: 1.2 });
    }
    toast.success("🏢 ARCL Airoli Laboratory coordinates selected!");
  };

  // HIGH ACCURACY "LOCATE ME" GPS WATCHER (Blinkit / Zepto Style)
  const handleLocateMeHighAccuracy = () => {
    if (typeof window === "undefined" || !navigator?.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }

    setLocating(true);
    toast.info("📡 GPS Satellites se Live Coordinates fetch ho rahe hain... Kripya 'Allow' karein.");

    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    let bestAccuracy = Infinity;

    // Timeout safety: if GPS does not lock under 25m in 15 seconds, stop watcher but keep best position
    const safetyTimer = setTimeout(() => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
        setLocating(false);
        if (bestAccuracy !== Infinity) {
          toast.success(
            `🎯 GPS Position Fixed (Accuracy: ~${bestAccuracy}m).\nAap pin ko exact building roof par drag kar sakte hain!`
          );
        } else {
          toast.warn("GPS timeout. Please pick your building on the map or type address above.");
        }
      }
    }, 15000);

    watchIdRef.current = navigator.geolocation.watchPosition(
      async (pos) => {
        const lat = parseFloat(pos.coords.latitude.toFixed(6));
        const lon = parseFloat(pos.coords.longitude.toFixed(6));
        const accuracy = Math.round(pos.coords.accuracy || 0);

        setGpsAccuracy(accuracy);

        if (accuracy < bestAccuracy) {
          bestAccuracy = accuracy;
          setCoords({ latitude: lat, longitude: lon });

          if (mapInstanceRef.current && markerRef.current) {
            const L = window.L;
            const target = L.latLng(lat, lon);
            markerRef.current.setLatLng(target);
            if (circleRef.current) {
              circleRef.current.setLatLng(target);
            }
            mapInstanceRef.current.flyTo(target, 18, { duration: 1.0 });
          }

          // Reverse geocode
          performReverseGeocode(lat, lon);
        }

        // If satellite lock achieved (accuracy <= 25 meters), lock in and stop watching!
        if (accuracy <= 25) {
          clearTimeout(safetyTimer);
          if (watchIdRef.current !== null) {
            navigator.geolocation.clearWatch(watchIdRef.current);
            watchIdRef.current = null;
          }
          setLocating(false);
          toast.success(`🎯 High Precision GPS Lock Achieved! Accuracy: ~${accuracy} meters`);
        }
      },
      (err) => {
        clearTimeout(safetyTimer);
        setLocating(false);
        console.warn("GPS error:", err);
        if (err.code === 1) {
          toast.error("Location permission denied. Kripya browser URL bar me allow karein.");
        } else {
          toast.warn("GPS signal weak. Aap map me pin drag karke ya search karke address chun sakte hain.");
        }
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 14000,
      }
    );
  };

  const handleConfirm = () => {
    onConfirmLocation({
      latitude: coords.latitude,
      longitude: coords.longitude,
      radiusMeters,
      address: address.trim() || ARCL_AIROLI_LAB.address,
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-4xl w-full shadow-2xl flex flex-col overflow-hidden max-h-[94vh] animate-in fade-in zoom-in-95 duration-200">
        {/* MODAL HEADER */}
        <div className="px-5 py-4 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-rose-500 flex items-center justify-center shadow-lg shadow-amber-500/20 text-white font-black text-lg">
              📍
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-white tracking-tight">
                  Company Office &amp; Laboratory Location Picker
                </h3>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/40">
                  Live Satellite GPS
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Blinkit &amp; Zepto style: Search building, use Live GPS, or drag the red pin to exact laboratory entrance.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
            title="Close"
          >
            <FaTimes size={16} />
          </button>
        </div>

        {/* SEARCH BAR & PRESETS BAR */}
        <div className="p-4 bg-slate-900/95 border-b border-slate-800 space-y-3">
          {/* Autocomplete Search Input */}
          <div className="relative">
            <div className="flex items-center gap-2 bg-slate-950 border border-slate-700 focus-within:border-amber-400 rounded-2xl px-3.5 py-2.5 transition shadow-inner">
              <FaSearch className="text-slate-400 text-sm flex-shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={handleSearchInputChange}
                placeholder="Search building name, sector, street, landmark, area (e.g. Siddhivinayak Park Sector 8A Airoli)..."
                className="w-full bg-transparent text-sm text-white placeholder-slate-500 outline-none"
              />
              {searching && (
                <div className="w-4 h-4 border-2 border-amber-400 border-t-transparent rounded-full animate-spin flex-shrink-0"></div>
              )}
              {searchQuery && !searching && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setSearchResults([]);
                  }}
                  className="text-slate-400 hover:text-white p-1"
                >
                  <FaTimes size={12} />
                </button>
              )}
            </div>

            {/* Suggestions Dropdown */}
            {searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-slate-950 border border-slate-700 rounded-2xl shadow-2xl z-40 max-h-56 overflow-y-auto divide-y divide-slate-800">
                {searchResults.map((item, idx) => {
                  const parts = (item.display_name || "").split(",");
                  const mainName = parts[0];
                  const secondaryName = parts.slice(1).join(",").trim();

                  return (
                    <button
                      key={item.place_id || idx}
                      type="button"
                      onClick={() => handleSelectSearchResult(item)}
                      className="w-full text-left px-4 py-3 hover:bg-slate-800/80 transition flex items-start gap-3 cursor-pointer group"
                    >
                      <FaMapMarkerAlt className="text-amber-400 text-sm mt-1 flex-shrink-0 group-hover:scale-110 transition" />
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-bold text-white truncate">{mainName}</div>
                        <div className="text-xs text-slate-400 truncate">{secondaryName}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quick Shortcuts Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={handleSelectAiroliPreset}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-950/70 hover:bg-emerald-900/80 border border-emerald-600/60 text-emerald-300 text-xs font-bold transition shadow-xs cursor-pointer active:scale-95"
                title="Directly select ARCL Airoli Lab"
              >
                <FaBuilding className="text-emerald-400 text-xs" />
                <span>🏢 ARCL Airoli Lab (Sector 8A)</span>
              </button>

              <button
                type="button"
                disabled={locating}
                onClick={handleLocateMeHighAccuracy}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold border transition shadow-xs cursor-pointer active:scale-95 ${
                  locating
                    ? "bg-amber-500/20 text-amber-300 border-amber-500/50 animate-pulse"
                    : "bg-amber-500 hover:bg-amber-400 text-slate-950 font-black border-amber-400"
                }`}
                title="Acquire live GPS satellite position"
              >
                <FaCrosshairs className={`text-xs ${locating ? "animate-spin" : ""}`} />
                <span>{locating ? "🛰️ Acquiring GPS Satellites..." : "🎯 Locate Me (Live GPS)"}</span>
              </button>
            </div>

            {/* Live GPS Accuracy Badge */}
            {gpsAccuracy !== null && (
              <div className="flex items-center gap-1.5 text-xs">
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border font-bold ${
                    gpsAccuracy <= 25
                      ? "bg-emerald-950/70 text-emerald-300 border-emerald-500/50"
                      : gpsAccuracy <= 75
                      ? "bg-amber-950/70 text-amber-300 border-amber-500/50"
                      : "bg-rose-950/70 text-rose-300 border-rose-500/50"
                  }`}
                >
                  <FaSatellite className="text-[11px]" />
                  <span>
                    GPS Accuracy: ~{gpsAccuracy}m{" "}
                    {gpsAccuracy <= 25 ? "🟢 (Exact Fix)" : "🟡 (Fine-tune by dragging pin)"}
                  </span>
                </span>
              </div>
            )}
          </div>
        </div>

        {/* INTERACTIVE MAP CONTAINER */}
        <div className="relative flex-1 min-h-[350px] sm:min-h-[420px] bg-slate-950">
          <div ref={mapContainerRef} className="w-full h-full min-h-[350px] sm:min-h-[420px] z-10" />

          {/* Floating Instructions Pill on Top of Map */}
          <div className="absolute top-3 left-3 z-20 pointer-events-none">
            <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700/80 px-3 py-1.5 rounded-xl shadow-lg flex items-center gap-2 text-white text-xs">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
              <span className="font-semibold">
                Drag red pin 📍 or tap anywhere to place exact building entrance
              </span>
            </div>
          </div>

          {/* Reverse Geocoding Status */}
          {isReverseGeocoding && (
            <div className="absolute bottom-3 left-3 z-20 pointer-events-none">
              <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700/80 px-3 py-1.5 rounded-xl shadow-lg flex items-center gap-2 text-amber-300 text-xs">
                <div className="w-3.5 h-3.5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin"></div>
                <span>Resolving building address...</span>
              </div>
            </div>
          )}
        </div>

        {/* BOTTOM DETAILS & CONFIRM CARD */}
        <div className="p-4 sm:p-5 bg-slate-950 border-t border-slate-800 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
            {/* Selected Address Display */}
            <div className="md:col-span-7 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                  <FaBuilding /> Selected Office / Lab Address:
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  Lat: {coords.latitude.toFixed(6)}, Lon: {coords.longitude.toFixed(6)}
                </span>
              </div>

              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Shop No. 6, Siddhivinayak Park CHS, Sector - 8A, Airoli, Navi Mumbai..."
                className="w-full bg-slate-900 border border-slate-700 focus:border-amber-400 rounded-xl px-3 py-2 text-xs sm:text-sm text-white outline-none shadow-inner"
              />
            </div>

            {/* Geofence Perimeter Radius Slider */}
            <div className="md:col-span-5 bg-slate-900/80 border border-slate-800 rounded-2xl p-3 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-300 flex items-center gap-1.5">
                  <FaSlidersH className="text-amber-400" /> Geofence Radius:
                </span>
                <span className="font-mono font-black text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-lg border border-amber-400/30">
                  {radiusMeters} meters
                </span>
              </div>
              <input
                type="range"
                min="25"
                max="500"
                step="25"
                value={radiusMeters}
                onChange={(e) => setRadiusMeters(parseInt(e.target.value, 10))}
                className="w-full accent-amber-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>25m (Lab Room)</span>
                <span>150m (Compound)</span>
                <span>500m (MIDC Campus)</span>
              </div>
            </div>
          </div>

          {/* Bottom Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-slate-800/80">
            <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
              <FaInfoCircle className="text-amber-400 flex-shrink-0" />
              <span>
                Employees with <strong>'Office Only'</strong> access can only log in inside the yellow circle{" "}
                ({radiusMeters}m perimeter).
              </span>
            </div>

            <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold transition cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleConfirm}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs transition shadow-lg shadow-amber-500/25 flex items-center gap-2 cursor-pointer active:scale-95"
              >
                <FaCheck />
                <span>Confirm &amp; Set Office Location</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
