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
  FaSlidersH,
  FaLayerGroup,
  FaPaste,
  FaGlobe,
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
  unitNo: "Shop No. 6",
  buildingName: "Siddhivinayak Park CHS",
  areaDetails: "Sector - 8A, Airoli, Navi Mumbai, Maharashtra - 400708",
  address: "Shop No. 6, Siddhivinayak Park CHS, Sector - 8A, Airoli, Navi Mumbai, Maharashtra - 400708",
  latitude: 19.1553,
  longitude: 72.9982,
};

/**
 * Helper to parse coordinates or Google Maps link from pasted text
 */
const parseGoogleMapsOrCoords = (str) => {
  if (!str) return null;
  const trimmed = str.trim();

  // Pattern 1: Lat, Lon e.g. "19.1553, 72.9982" or "19.1553 72.9982"
  const latLonMatch = trimmed.match(/^(-?\d{1,2}(?:\.\d+)?)[,\s]+(-?\d{1,3}(?:\.\d+)?)$/);
  if (latLonMatch) {
    const lat = parseFloat(latLonMatch[1]);
    const lon = parseFloat(latLonMatch[2]);
    if (!isNaN(lat) && !isNaN(lon) && lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180) {
      return { lat, lon, label: `Custom Coordinates (${lat}, ${lon})` };
    }
  }

  // Pattern 2: Google Maps URL containing @lat,lon
  const atMatch = trimmed.match(/@(-?\d{1,2}\.\d+),(-?\d{1,3}\.\d+)/);
  if (atMatch) {
    return {
      lat: parseFloat(atMatch[1]),
      lon: parseFloat(atMatch[2]),
      label: "Google Maps Coordinates",
    };
  }

  // Pattern 3: Google Maps URL containing q=lat,lon or ll=lat,lon
  const qMatch = trimmed.match(/[?&](?:q|ll)=(-?\d{1,2}\.\d+),(-?\d{1,3}\.\d+)/);
  if (qMatch) {
    return {
      lat: parseFloat(qMatch[1]),
      lon: parseFloat(qMatch[2]),
      label: "Google Maps Location",
    };
  }

  return null;
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
  const layersRef = useRef({ street: null, satellite: null, labels: null });
  const watchIdRef = useRef(null);
  const searchTimeoutRef = useRef(null);

  const [coords, setCoords] = useState({
    latitude: initialLatitude || 19.1553,
    longitude: initialLongitude || 72.9982,
  });
  const [radiusMeters, setRadiusMeters] = useState(initialRadius || 150);

  // Split address fields: building name, unit/shop no, and detected area
  const [unitNo, setUnitNo] = useState("Shop No. 6");
  const [buildingName, setBuildingName] = useState("Siddhivinayak Park CHS");
  const [areaDetails, setAreaDetails] = useState("Sector - 8A, Airoli, Navi Mumbai, Maharashtra - 400708");
  const [fullAddressOverride, setFullAddressOverride] = useState("");

  const [mapType, setMapType] = useState("satellite"); // Default to Satellite View so users can see rooftops!
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [pastedCoordsResult, setPastedCoordsResult] = useState(null);
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

      // If initial address provided, parse or set
      if (initialAddress) {
        setFullAddressOverride(initialAddress);
        const parts = initialAddress.split(",");
        if (parts.length >= 3) {
          setUnitNo(parts[0].trim());
          setBuildingName(parts[1].trim());
          setAreaDetails(parts.slice(2).join(",").trim());
        } else {
          setBuildingName(initialAddress);
        }
      } else {
        setUnitNo(ARCL_AIROLI_LAB.unitNo);
        setBuildingName(ARCL_AIROLI_LAB.buildingName);
        setAreaDetails(ARCL_AIROLI_LAB.areaDetails);
      }

      setSearchQuery("");
      setSearchResults([]);
      setPastedCoordsResult(null);
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

  // Compute computed combined address
  const computedAddress = [unitNo.trim(), buildingName.trim(), areaDetails.trim()]
    .filter(Boolean)
    .join(", ");

  // Reverse geocoding helper (updates areaDetails but PRESERVES user's buildingName!)
  const performReverseGeocode = useCallback(async (lat, lon) => {
    try {
      setIsReverseGeocoding(true);
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`,
        { headers: { Accept: "application/json" } }
      );
      if (res.ok) {
        const data = await res.json();
        const addr = data?.address || {};

        // Extract detected building if available
        const detectedBuilding =
          addr.building ||
          addr.house_name ||
          addr.residential ||
          addr.commercial ||
          addr.amenity ||
          addr.shop ||
          addr.office ||
          "";

        // Extract road, sector, city, state, pincode
        const parts = [
          addr.road,
          addr.suburb || addr.neighbourhood || addr.city_district,
          addr.city || addr.town || addr.village,
          addr.state,
          addr.postcode,
        ]
          .filter(Boolean)
          .filter((v, i, a) => a.indexOf(v) === i);

        const newArea = parts.length > 0 ? parts.join(", ") : data.display_name || "";
        setAreaDetails(newArea);

        // Only update buildingName if currently empty and OSM found one
        if (detectedBuilding) {
          setBuildingName((prev) => (prev && prev.trim() ? prev : detectedBuilding));
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

  // Toggle between Street and Satellite View
  const handleToggleMapType = (targetType) => {
    if (!mapInstanceRef.current || !layersRef.current.street) return;
    const map = mapInstanceRef.current;
    const { street, satellite, labels } = layersRef.current;

    if (targetType === "satellite") {
      if (map.hasLayer(street)) map.removeLayer(street);
      if (!map.hasLayer(satellite)) satellite.addTo(map);
      if (!map.hasLayer(labels)) labels.addTo(map);
      setMapType("satellite");
      toast.info("🛰️ Satellite View Activated! Building rooftops aur compound saaf dikhenge.");
    } else {
      if (map.hasLayer(satellite)) map.removeLayer(satellite);
      if (map.hasLayer(labels)) map.removeLayer(labels);
      if (!map.hasLayer(street)) street.addTo(map);
      setMapType("street");
      toast.info("🗺️ Street View Activated!");
    }
  };

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

        // Custom Red Delivery-Style Pin Icon
        const pinHtml = `
          <div style="position: relative; transform: translate(-50%, -100%);">
            <div style="width: 40px; height: 40px; background: #ef4444; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); display: flex; align-items: center; justify-content: center; box-shadow: 0 12px 25px -4px rgba(239, 68, 68, 0.7); border: 3.5px solid #ffffff;">
              <div style="width: 14px; height: 14px; background: #ffffff; border-radius: 50%; transform: rotate(45deg); display: flex; align-items: center; justify-content: center;">
                <div style="width: 6px; height: 6px; background: #ef4444; border-radius: 50%;"></div>
              </div>
            </div>
            <div style="width: 18px; height: 6px; background: rgba(0,0,0,0.45); border-radius: 50%; margin: -4px auto 0 auto; filter: blur(1.5px);"></div>
          </div>
        `;

        const customPinIcon = L.divIcon({
          className: "arcl-delivery-pin",
          html: pinHtml,
          iconSize: [40, 46],
          iconAnchor: [20, 46],
        });

        const map = L.map(mapContainerRef.current, {
          center: [coords.latitude, coords.longitude],
          zoom: 18, // High zoom level to see building rooftops
          zoomControl: false,
        });

        // Add standard zoom control at bottom right
        L.control.zoom({ position: "bottomright" }).addTo(map);

        // Tile Layers
        const streetLayer = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          maxZoom: 19,
          attribution: '&copy; <a href="https://openstreetmap.org">OpenStreetMap</a>',
        });

        // Esri High-Resolution Satellite Tiles (Shows real rooftops & compound gates in India)
        const satelliteLayer = L.tileLayer(
          "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
          {
            maxZoom: 19,
            attribution: "Tiles &copy; Esri &mdash; High-Resolution Satellite",
          }
        );

        // Hybrid Boundaries & Road Labels for Satellite view
        const labelsLayer = L.tileLayer(
          "https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}",
          { maxZoom: 19 }
        );

        layersRef.current = {
          street: streetLayer,
          satellite: satelliteLayer,
          labels: labelsLayer,
        };

        // Default to Satellite View so user can clearly see their building
        satelliteLayer.addTo(map);
        labelsLayer.addTo(map);

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
          fillOpacity: 0.18,
          weight: 2.5,
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

        // Smooth size invalidation after modal transition
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

  // Autocomplete Search & Coords Parser Debounce
  const handleSearchInputChange = (e) => {
    const val = e.target.value;
    setSearchQuery(val);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Check if input is a pasted Google Maps URL or Coordinates
    const parsedCoords = parseGoogleMapsOrCoords(val);
    setPastedCoordsResult(parsedCoords);

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
      setSearchQuery("");
      setSearchResults([]);
      setPastedCoordsResult(null);

      if (mapInstanceRef.current && markerRef.current) {
        const L = window.L;
        const target = L.latLng(lat, lon);
        markerRef.current.setLatLng(target);
        if (circleRef.current) {
          circleRef.current.setLatLng(target);
        }
        mapInstanceRef.current.flyTo(target, 18, { duration: 1.2 });
      }

      // If user selected a specific place, use its primary name as building/landmark
      const parts = (item.display_name || "").split(",");
      if (parts.length > 0) {
        setBuildingName(parts[0].trim());
        setAreaDetails(parts.slice(1).join(",").trim());
      }

      toast.info(`📍 Moved to: ${item.display_name?.split(",")[0] || "Selected Place"}`);
    }
  };

  // Jump to Pasted Google Maps Coords
  const handleSelectPastedCoords = () => {
    if (!pastedCoordsResult) return;
    const { lat, lon } = pastedCoordsResult;
    setCoords({ latitude: parseFloat(lat.toFixed(6)), longitude: parseFloat(lon.toFixed(6)) });
    setSearchQuery("");
    setSearchResults([]);
    setPastedCoordsResult(null);

    if (mapInstanceRef.current && markerRef.current) {
      const L = window.L;
      const target = L.latLng(lat, lon);
      markerRef.current.setLatLng(target);
      if (circleRef.current) {
        circleRef.current.setLatLng(target);
      }
      mapInstanceRef.current.flyTo(target, 19, { duration: 1.2 });
    }

    performReverseGeocode(lat, lon);
    toast.success(`🎯 Jumped to Google Maps Coordinates (${lat}, ${lon})!`);
  };

  // Paste from Clipboard helper
  const handlePasteClipboard = async () => {
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard?.readText) {
        const text = await navigator.clipboard.readText();
        if (text) {
          setSearchQuery(text);
          const parsed = parseGoogleMapsOrCoords(text);
          if (parsed) {
            setPastedCoordsResult(parsed);
            toast.info("📍 Coordinates detected in clipboard! Click the green button to jump.");
          } else {
            handleSearchInputChange({ target: { value: text } });
          }
        }
      } else {
        toast.info("Please paste Google Maps link directly into the search bar.");
      }
    } catch (e) {
      toast.info("Paste shortcut not permitted. Please paste in search box (Ctrl+V).");
    }
  };

  // Preset ARCL Airoli Lab
  const handleSelectAiroliPreset = () => {
    const lat = ARCL_AIROLI_LAB.latitude;
    const lon = ARCL_AIROLI_LAB.longitude;
    setCoords({ latitude: lat, longitude: lon });
    setUnitNo(ARCL_AIROLI_LAB.unitNo);
    setBuildingName(ARCL_AIROLI_LAB.buildingName);
    setAreaDetails(ARCL_AIROLI_LAB.areaDetails);
    setSearchQuery("");
    setSearchResults([]);
    setPastedCoordsResult(null);

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
    const finalAddress =
      fullAddressOverride.trim() || computedAddress.trim() || ARCL_AIROLI_LAB.address;

    onConfirmLocation({
      latitude: coords.latitude,
      longitude: coords.longitude,
      radiusMeters,
      address: finalAddress,
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-4xl w-full shadow-2xl flex flex-col overflow-hidden max-h-[96vh] animate-in fade-in zoom-in-95 duration-200">
        {/* MODAL HEADER */}
        <div className="px-5 py-3.5 border-b border-slate-800 bg-slate-950/90 flex items-center justify-between">
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
                  Blinkit / Zepto Style
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Satellite View me apni building rooftop dekhein, pin drop karein, ya building name search/type karein.
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

        {/* SEARCH BAR & SHORTCUTS BAR */}
        <div className="p-3.5 sm:p-4 bg-slate-900/95 border-b border-slate-800 space-y-2.5">
          {/* Smart Search Bar (Supports Text, Coords, or Google Maps Link) */}
          <div className="relative">
            <div className="flex items-center gap-2 bg-slate-950 border border-slate-700 focus-within:border-amber-400 rounded-2xl px-3.5 py-2.5 transition shadow-inner">
              <FaSearch className="text-slate-400 text-sm flex-shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={handleSearchInputChange}
                placeholder="Search building, area (e.g. Sector 8A Airoli) ya Google Maps link/coords paste karein..."
                className="w-full bg-transparent text-xs sm:text-sm text-white placeholder-slate-500 outline-none"
              />

              <button
                type="button"
                onClick={handlePasteClipboard}
                className="hidden sm:inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[10px] font-bold text-slate-300 hover:text-white transition cursor-pointer flex-shrink-0"
                title="Paste from clipboard"
              >
                <FaPaste className="text-[10px]" />
                <span>Paste</span>
              </button>

              {searching && (
                <div className="w-4 h-4 border-2 border-amber-400 border-t-transparent rounded-full animate-spin flex-shrink-0"></div>
              )}
              {searchQuery && !searching && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setSearchResults([]);
                    setPastedCoordsResult(null);
                  }}
                  className="text-slate-400 hover:text-white p-1"
                >
                  <FaTimes size={12} />
                </button>
              )}
            </div>

            {/* Suggestions Dropdown (With Google Maps Paste Detection & No-Results Guide) */}
            {(pastedCoordsResult || searchResults.length > 0 || (searchQuery.trim().length >= 3 && !searching)) && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-slate-950 border border-slate-700 rounded-2xl shadow-2xl z-40 max-h-64 overflow-y-auto divide-y divide-slate-800">
                {/* 1. Google Maps / Custom Coords Quick Jump */}
                {pastedCoordsResult && (
                  <button
                    type="button"
                    onClick={handleSelectPastedCoords}
                    className="w-full text-left px-4 py-3 bg-emerald-950/80 hover:bg-emerald-900 border-b border-emerald-700/50 transition flex items-center justify-between cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <FaCrosshairs className="text-emerald-400 text-base animate-pulse" />
                      <div>
                        <div className="text-xs sm:text-sm font-black text-emerald-300">
                          🎯 {pastedCoordsResult.label} Detected!
                        </div>
                        <div className="text-[11px] text-emerald-200 font-mono">
                          Lat: {pastedCoordsResult.lat.toFixed(6)}, Lon: {pastedCoordsResult.lon.toFixed(6)}
                        </div>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-lg bg-emerald-500 text-slate-950 font-black text-xs">
                      Jump to Location ↗
                    </span>
                  </button>
                )}

                {/* 2. Text Search Suggestions */}
                {searchResults.map((item, idx) => {
                  const parts = (item.display_name || "").split(",");
                  const mainName = parts[0];
                  const secondaryName = parts.slice(1).join(",").trim();

                  return (
                    <button
                      key={item.place_id || idx}
                      type="button"
                      onClick={() => handleSelectSearchResult(item)}
                      className="w-full text-left px-4 py-2.5 hover:bg-slate-800/80 transition flex items-start gap-3 cursor-pointer group"
                    >
                      <FaMapMarkerAlt className="text-amber-400 text-sm mt-1 flex-shrink-0 group-hover:scale-110 transition" />
                      <div className="min-w-0 flex-1">
                        <div className="text-xs sm:text-sm font-bold text-white truncate">{mainName}</div>
                        <div className="text-[11px] text-slate-400 truncate">{secondaryName}</div>
                      </div>
                    </button>
                  );
                })}

                {/* 3. Helpful Advice if Building Not in Public Directory */}
                {searchResults.length === 0 && !pastedCoordsResult && !searching && (
                  <div className="p-3.5 text-xs text-slate-300 space-y-1.5 bg-slate-900/90">
                    <div className="font-bold text-amber-400 flex items-center gap-1.5">
                      <FaInfoCircle /> Building Name Not in Map Directory?
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      💡 India me har choti building ka naam map directory me register nahi hota.
                      <br />
                      1. Upar apna <strong>Area / Sector</strong> search karein (jaise <em>Sector 8A Airoli</em>).
                      <br />
                      2. Map me <strong>[🛰️ Satellite View]</strong> on karke apni building ki chhat dekh kar red pin drop karein.
                      <br />
                      3. Neeche <strong>'Building / Society Name'</strong> me apni building ka exact naam khud likh lein!
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Map Controls & Quick Shortcuts Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
            <div className="flex items-center gap-2 flex-wrap">
              {/* Satellite / Street View Toggle */}
              <div className="inline-flex rounded-xl bg-slate-950 p-0.5 border border-slate-700 shadow-inner">
                <button
                  type="button"
                  onClick={() => handleToggleMapType("satellite")}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                    mapType === "satellite"
                      ? "bg-amber-500 text-slate-950 shadow-xs"
                      : "text-slate-400 hover:text-white"
                  }`}
                  title="Real Satellite Aerial View (shows rooftops & compound walls)"
                >
                  <FaSatellite className="text-[11px]" />
                  <span>🛰️ Satellite View</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleToggleMapType("street")}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                    mapType === "street"
                      ? "bg-amber-500 text-slate-950 shadow-xs"
                      : "text-slate-400 hover:text-white"
                  }`}
                  title="Street Map View"
                >
                  <FaLayerGroup className="text-[11px]" />
                  <span>🗺️ Street Map</span>
                </button>
              </div>

              {/* Preset ARCL Airoli Lab */}
              <button
                type="button"
                onClick={handleSelectAiroliPreset}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-950/70 hover:bg-emerald-900/80 border border-emerald-600/60 text-emerald-300 text-xs font-bold transition shadow-xs cursor-pointer active:scale-95"
                title="Directly select ARCL Airoli Lab"
              >
                <FaBuilding className="text-emerald-400 text-xs" />
                <span>🏢 ARCL Airoli Lab (Sector 8A)</span>
              </button>

              {/* Locate Me GPS */}
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
                <span>{locating ? "🛰️ GPS Tracking..." : "🎯 Locate Me (Live GPS)"}</span>
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
                    Accuracy: ~{gpsAccuracy}m{" "}
                    {gpsAccuracy <= 25 ? "🟢 (Exact Fix)" : "🟡 (Fine-tune by dragging pin)"}
                  </span>
                </span>
              </div>
            )}
          </div>
        </div>

        {/* INTERACTIVE MAP CONTAINER */}
        <div className="relative flex-1 min-h-[320px] sm:min-h-[380px] bg-slate-950">
          <div ref={mapContainerRef} className="w-full h-full min-h-[320px] sm:min-h-[380px] z-10" />

          {/* Floating Instructions Pill on Top of Map */}
          <div className="absolute top-3 left-3 z-20 pointer-events-none">
            <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700/80 px-3 py-1.5 rounded-xl shadow-lg flex items-center gap-2 text-white text-xs">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
              <span className="font-semibold">
                {mapType === "satellite"
                  ? "Satellite View: Apni building ki chhat dekh kar red pin 📍 wahan drop karein"
                  : "Drag red pin 📍 or tap anywhere to place exact building entrance"}
              </span>
            </div>
          </div>

          {/* Reverse Geocoding Status */}
          {isReverseGeocoding && (
            <div className="absolute bottom-3 left-3 z-20 pointer-events-none">
              <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700/80 px-3 py-1.5 rounded-xl shadow-lg flex items-center gap-2 text-amber-300 text-xs">
                <div className="w-3.5 h-3.5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin"></div>
                <span>Resolving location address...</span>
              </div>
            </div>
          )}
        </div>

        {/* BOTTOM BLINKIT-STYLE ADDRESS & BUILDING FORM */}
        <div className="p-3.5 sm:p-4 bg-slate-950 border-t border-slate-800 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-start">
            {/* 1. Flat/Shop No. */}
            <div className="sm:col-span-3 space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Shop / Flat / Room No:
              </label>
              <input
                type="text"
                value={unitNo}
                onChange={(e) => {
                  setUnitNo(e.target.value);
                  setFullAddressOverride("");
                }}
                placeholder="Shop No. 6, 1st Floor..."
                className="w-full bg-slate-900 border border-slate-700 focus:border-amber-400 rounded-xl px-3 py-2 text-xs text-white outline-none shadow-inner"
              />
            </div>

            {/* 2. Building / Society Name (User can directly type their building name!) */}
            <div className="sm:col-span-5 space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-amber-400 flex items-center justify-between">
                <span>🏢 Building / Society / Company Name:</span>
                <span className="text-[9px] text-slate-400 lowercase font-normal">(type building name here)</span>
              </label>
              <input
                type="text"
                value={buildingName}
                onChange={(e) => {
                  setBuildingName(e.target.value);
                  setFullAddressOverride("");
                }}
                placeholder="Apni building ka naam likhein (e.g. Siddhivinayak Park CHS)..."
                className="w-full bg-slate-900 border-2 border-amber-500/70 focus:border-amber-400 rounded-xl px-3 py-2 text-xs font-bold text-white outline-none shadow-inner"
              />
            </div>

            {/* 3. Geofence Perimeter Radius Slider */}
            <div className="sm:col-span-4 bg-slate-900/80 border border-slate-800 rounded-2xl p-2.5 space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-300 text-[11px] flex items-center gap-1">
                  <FaSlidersH className="text-amber-400" /> Geofence Radius:
                </span>
                <span className="font-mono font-black text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-lg border border-amber-400/30 text-[11px]">
                  {radiusMeters}m
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
              <div className="flex justify-between text-[9px] text-slate-500">
                <span>25m (Lab Room)</span>
                <span>150m (Compound)</span>
                <span>500m (Campus)</span>
              </div>
            </div>
          </div>

          {/* Full Address Preview & Coordinates */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[10px]">
              <span className="font-bold text-slate-400 uppercase tracking-wider">
                📍 Full Registered Address &amp; Coordinates:
              </span>
              <span className="font-mono text-amber-300 bg-slate-900 px-2 py-0.5 rounded-md border border-slate-800">
                Lat: {coords.latitude.toFixed(6)}, Lon: {coords.longitude.toFixed(6)}
              </span>
            </div>
            <input
              type="text"
              value={fullAddressOverride || computedAddress}
              onChange={(e) => setFullAddressOverride(e.target.value)}
              placeholder="Full office address..."
              className="w-full bg-slate-900/90 border border-slate-700 focus:border-amber-400 rounded-xl px-3 py-1.5 text-xs text-slate-200 outline-none"
            />
          </div>

          {/* Bottom Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 pt-1 border-t border-slate-800/80">
            <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
              <FaInfoCircle className="text-amber-400 flex-shrink-0" />
              <span>
                Staff members with <strong>'Office Only'</strong> login can only access inside this{" "}
                <strong>{radiusMeters}m</strong> geofence boundary.
              </span>
            </div>

            <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold transition cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleConfirm}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs transition shadow-lg shadow-amber-500/25 flex items-center gap-2 cursor-pointer active:scale-95"
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
