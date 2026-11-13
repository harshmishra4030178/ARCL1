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
  FaCheckCircle,
  FaSave,
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
  areaText: "Sector - 8A, Airoli, Navi Mumbai, Maharashtra - 400708",
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

  // Address fields - start empty by default unless matching Airoli Lab preset
  const [unitNo, setUnitNo] = useState("");
  const [buildingName, setBuildingName] = useState("");
  const [areaText, setAreaText] = useState("");
  const [fullAddress, setFullAddress] = useState("");

  const [mapType, setMapType] = useState("satellite"); // Default to Satellite View so users can see rooftops!
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [pastedCoordsResult, setPastedCoordsResult] = useState(null);
  const [searching, setSearching] = useState(false);
  const [locating, setLocating] = useState(false);
  const [gpsAccuracy, setGpsAccuracy] = useState(null);
  const [isReverseGeocoding, setIsReverseGeocoding] = useState(false);

  // Helper to recompute fullAddress string from parts
  const composeAddress = (unit, bld, area) => {
    return [unit?.trim(), bld?.trim(), area?.trim()].filter(Boolean).join(", ");
  };

  // Sync initial props on open
  useEffect(() => {
    if (isOpen) {
      const lat = initialLatitude || 19.1553;
      const lon = initialLongitude || 72.9982;
      setCoords({ latitude: lat, longitude: lon });
      setRadiusMeters(initialRadius || 150);

      const isNearAiroli = Math.abs(lat - 19.1553) < 0.01 && Math.abs(lon - 72.9982) < 0.01;

      if (isNearAiroli) {
        setUnitNo("Shop No. 6");
        setBuildingName("Siddhivinayak Park CHS");
        setAreaText("Sector - 8A, Airoli, Navi Mumbai, Maharashtra - 400708");
        setFullAddress(initialAddress || ARCL_AIROLI_LAB.address);
      } else {
        // Location is custom / current user location (e.g. Nilaje, Dombivli, Kalyan)
        setUnitNo("");
        setBuildingName("");
        if (initialAddress && !initialAddress.includes("Siddhivinayak Park")) {
          setFullAddress(initialAddress);
          setAreaText(initialAddress);
        } else {
          // Immediately reverse-geocode the true coordinates!
          performReverseGeocode(lat, lon);
        }
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

  // Reverse geocoding helper (cleans fake presets and detects REAL street/locality address!)
  const performReverseGeocode = useCallback(
    async (lat, lon) => {
      try {
        setIsReverseGeocoding(true);
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`,
          { headers: { Accept: "application/json" } }
        );
        if (res.ok) {
          const data = await res.json();
          const addr = data?.address || {};

          // Extract building, road, neighbourhood, suburb, village, city, state, pincode
          const parts = [
            addr.building || addr.house_name || addr.amenity,
            addr.road,
            addr.neighbourhood,
            addr.suburb,
            addr.village,
            addr.city || addr.town || addr.city_district,
            addr.county || addr.state_district,
            addr.state,
            addr.postcode,
          ]
            .filter(Boolean)
            .filter((v, i, a) => a.indexOf(v) === i);

          const newArea = parts.length > 0 ? parts.join(", ") : data.display_name || "";
          setAreaText(newArea);

          const isNearAiroli = Math.abs(lat - 19.1553) < 0.01 && Math.abs(lon - 72.9982) < 0.01;

          // If location is NOT Airoli, clear out default Airoli building & shop no so they never corrupt other cities!
          let currentBld = buildingName.trim();
          let currentUnit = unitNo.trim();
          if (!isNearAiroli && currentBld === "Siddhivinayak Park CHS") {
            currentBld = "";
            setBuildingName("");
          }
          if (!isNearAiroli && currentUnit === "Shop No. 6") {
            currentUnit = "";
            setUnitNo("");
          }

          // If OSM found a real building name at this location, use it
          if (!isNearAiroli && !currentBld && (addr.building || addr.house_name || addr.amenity)) {
            currentBld = addr.building || addr.house_name || addr.amenity;
            setBuildingName(currentBld);
          }

          // Update full address text box with true address!
          setFullAddress(composeAddress(currentUnit, currentBld, newArea));
        }
      } catch (e) {
        console.warn("Reverse geocode warning:", e);
      } finally {
        setIsReverseGeocoding(false);
      }
    },
    [buildingName, unitNo]
  );

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
      toast.info("🛰️ Satellite View: Building rooftops aur chhat saaf dikhegi!");
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
            <div style="width: 42px; height: 42px; background: #ef4444; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); display: flex; align-items: center; justify-content: center; box-shadow: 0 12px 25px -4px rgba(239, 68, 68, 0.7); border: 3.5px solid #ffffff;">
              <div style="width: 14px; height: 14px; background: #ffffff; border-radius: 50%; transform: rotate(45deg); display: flex; align-items: center; justify-content: center;">
                <div style="width: 6px; height: 6px; background: #ef4444; border-radius: 50%;"></div>
              </div>
            </div>
            <div style="width: 20px; height: 6px; background: rgba(0,0,0,0.5); border-radius: 50%; margin: -4px auto 0 auto; filter: blur(1.5px);"></div>
          </div>
        `;

        const customPinIcon = L.divIcon({
          className: "arcl-delivery-pin",
          html: pinHtml,
          iconSize: [42, 48],
          iconAnchor: [21, 48],
        });

        const map = L.map(mapContainerRef.current, {
          center: [coords.latitude, coords.longitude],
          zoom: 18,
          zoomControl: false,
        });

        L.control.zoom({ position: "bottomright" }).addTo(map);

        const streetLayer = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          maxZoom: 19,
          attribution: '&copy; <a href="https://openstreetmap.org">OpenStreetMap</a>',
        });

        const satelliteLayer = L.tileLayer(
          "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
          {
            maxZoom: 19,
            attribution: "Tiles &copy; Esri &mdash; High-Resolution Satellite",
          }
        );

        const labelsLayer = L.tileLayer(
          "https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}",
          { maxZoom: 19 }
        );

        layersRef.current = {
          street: streetLayer,
          satellite: satelliteLayer,
          labels: labelsLayer,
        };

        // Default to Satellite View
        satelliteLayer.addTo(map);
        labelsLayer.addTo(map);

        // Marker
        const marker = L.marker([coords.latitude, coords.longitude], {
          icon: customPinIcon,
          draggable: true,
          autoPan: true,
        }).addTo(map);

        // Circle
        const circle = L.circle([coords.latitude, coords.longitude], {
          radius: radiusMeters,
          color: "#f59e0b",
          fillColor: "#f59e0b",
          fillOpacity: 0.18,
          weight: 2.5,
          dashArray: "6, 6",
        }).addTo(map);

        // Marker dragend
        marker.on("dragend", async () => {
          const pos = marker.getLatLng();
          circle.setLatLng(pos);
          const lat = parseFloat(pos.lat.toFixed(6));
          const lon = parseFloat(pos.lng.toFixed(6));
          setCoords({ latitude: lat, longitude: lon });
          await performReverseGeocode(lat, lon);
        });

        // Click on map
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

        setTimeout(() => {
          if (mapInstanceRef.current) {
            mapInstanceRef.current.invalidateSize();
          }
        }, 300);

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

      const parts = (item.display_name || "").split(",");
      if (parts.length > 0) {
        const bld = parts[0].trim();
        const rest = parts.slice(1).join(",").trim();
        setBuildingName(bld);
        setAreaText(rest);
        setFullAddress(composeAddress(unitNo, bld, rest));
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
    toast.success(`🎯 Jumped to Coordinates (${lat}, ${lon})!`);
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
            toast.info("📍 Coordinates detected in clipboard! Click 'Jump to Location' button.");
          } else {
            handleSearchInputChange({ target: { value: text } });
          }
        }
      } else {
        toast.info("Please paste Google Maps link directly into search bar (Ctrl+V).");
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
    setAreaText(ARCL_AIROLI_LAB.areaText);
    setFullAddress(ARCL_AIROLI_LAB.address);
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

  // HIGH ACCURACY "LOCATE ME" GPS WATCHER
  const handleLocateMeHighAccuracy = () => {
    if (typeof window === "undefined" || !navigator?.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }

    setLocating(true);
    toast.info("📡 GPS Satellites se Live Coordinates fetch ho rahe hain... Kripya browser popup me 'Allow' karein.");

    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    let bestAccuracy = Infinity;

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
          toast.warn("GPS timeout. Please pick your building on map or type address below.");
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

          performReverseGeocode(lat, lon);
        }

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

  // Handler when user types building name: immediately updates fullAddress text box!
  const handleBuildingNameChange = (val) => {
    setBuildingName(val);
    setFullAddress(composeAddress(unitNo, val, areaText));
  };

  // Handler when user types unit/shop no: immediately updates fullAddress text box!
  const handleUnitNoChange = (val) => {
    setUnitNo(val);
    setFullAddress(composeAddress(val, buildingName, areaText));
  };

  const handleConfirm = () => {
    const finalAddress =
      fullAddress.trim() ||
      composeAddress(unitNo, buildingName, areaText) ||
      ARCL_AIROLI_LAB.address;

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
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      {/* MODAL DIALOG - STICKY HEADER & FOOTER SO SAVE BUTTON IS ALWAYS VISIBLE */}
      <div className="bg-slate-900 border-2 border-slate-700 rounded-3xl max-w-4xl w-full shadow-2xl flex flex-col max-h-[94vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* 1. STICKY MODAL HEADER */}
        <div className="px-5 py-3.5 border-b border-slate-800 bg-slate-950 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-rose-500 flex items-center justify-center shadow-lg shadow-amber-500/25 text-white font-black text-lg">
              📍
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-white tracking-tight">
                  Company Office &amp; Laboratory Location Picker
                </h3>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-400/20 text-emerald-300 border border-emerald-400/40">
                  Blinkit / Zepto Style
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Satellite View me apni building rooftop dekhein, pin drop karein, ya building name type karein.
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

        {/* 2. SCROLLABLE BODY CONTENT (MAP + INPUT FORM) */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-800/80">
          
          {/* SEARCH BAR & CONTROLS */}
          <div className="p-3.5 sm:p-4 bg-slate-900 space-y-2.5">
            <div className="relative">
              <div className="flex items-center gap-2 bg-slate-950 border-2 border-slate-700 focus-within:border-amber-400 rounded-2xl px-3.5 py-2.5 transition shadow-inner">
                <FaSearch className="text-amber-400 text-sm shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={handleSearchInputChange}
                  placeholder="Area / Sector search karein (e.g. Sector 8A Airoli) ya Google Maps coords paste karein..."
                  className="w-full bg-transparent text-xs sm:text-sm text-white placeholder-slate-500 outline-none font-medium"
                />

                <button
                  type="button"
                  onClick={handlePasteClipboard}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] font-bold text-slate-200 hover:text-white transition cursor-pointer shrink-0"
                  title="Paste from clipboard"
                >
                  <FaPaste className="text-[10px] text-amber-400" />
                  <span>Paste</span>
                </button>

                {searching && (
                  <div className="w-4 h-4 border-2 border-amber-400 border-t-transparent rounded-full animate-spin shrink-0"></div>
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

              {/* Suggestions Dropdown */}
              {(pastedCoordsResult || searchResults.length > 0 || (searchQuery.trim().length >= 3 && !searching)) && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-slate-950 border-2 border-slate-700 rounded-2xl shadow-2xl z-40 max-h-64 overflow-y-auto divide-y divide-slate-800">
                  {pastedCoordsResult && (
                    <button
                      type="button"
                      onClick={handleSelectPastedCoords}
                      className="w-full text-left px-4 py-3 bg-emerald-950 hover:bg-emerald-900 border-b border-emerald-700/50 transition flex items-center justify-between cursor-pointer"
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
                      <span className="px-3 py-1 rounded-xl bg-emerald-500 text-slate-950 font-black text-xs">
                        Jump to Location ↗
                      </span>
                    </button>
                  )}

                  {searchResults.map((item, idx) => {
                    const parts = (item.display_name || "").split(",");
                    const mainName = parts[0];
                    const secondaryName = parts.slice(1).join(",").trim();

                    return (
                      <button
                        key={item.place_id || idx}
                        type="button"
                        onClick={() => handleSelectSearchResult(item)}
                        className="w-full text-left px-4 py-2.5 hover:bg-slate-800 transition flex items-start gap-3 cursor-pointer group"
                      >
                        <FaMapMarkerAlt className="text-amber-400 text-sm mt-1 shrink-0 group-hover:scale-110 transition" />
                        <div className="min-w-0 flex-1">
                          <div className="text-xs sm:text-sm font-bold text-white truncate">{mainName}</div>
                          <div className="text-[11px] text-slate-400 truncate">{secondaryName}</div>
                        </div>
                      </button>
                    );
                  })}

                  {searchResults.length === 0 && !pastedCoordsResult && !searching && (
                    <div className="p-3.5 text-xs text-slate-300 space-y-1.5 bg-slate-900">
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

            {/* Quick Actions Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                {/* Satellite / Street View Toggle */}
                <div className="inline-flex rounded-xl bg-slate-950 p-0.5 border border-slate-700 shadow-inner">
                  <button
                    type="button"
                    onClick={() => handleToggleMapType("satellite")}
                    className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
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
                    className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
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

                <button
                  type="button"
                  onClick={handleSelectAiroliPreset}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-950 hover:bg-emerald-900 border border-emerald-600/60 text-emerald-300 text-xs font-bold transition shadow-xs cursor-pointer active:scale-95"
                  title="Directly select ARCL Airoli Lab"
                >
                  <FaBuilding className="text-emerald-400 text-xs" />
                  <span>🏢 ARCL Airoli Lab</span>
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
                  <span>{locating ? "🛰️ GPS Tracking..." : "🎯 Locate Me (Live GPS)"}</span>
                </button>
              </div>

              {gpsAccuracy !== null && (
                <div className="flex items-center gap-1.5 text-xs">
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border font-bold ${
                      gpsAccuracy <= 25
                        ? "bg-emerald-950 text-emerald-300 border-emerald-500/50"
                        : gpsAccuracy <= 75
                        ? "bg-amber-950 text-amber-300 border-amber-500/50"
                        : "bg-rose-950 text-rose-300 border-rose-500/50"
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
          <div className="relative h-[260px] sm:h-[300px] bg-slate-950">
            <div ref={mapContainerRef} className="w-full h-full z-10" />

            <div className="absolute top-3 left-3 z-20 pointer-events-none">
              <div className="bg-slate-950/90 backdrop-blur-md border border-slate-700 px-3 py-1.5 rounded-xl shadow-lg flex items-center gap-2 text-white text-xs">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping"></span>
                <span className="font-semibold">
                  {mapType === "satellite"
                    ? "Satellite View: Apni building ki chhat dekh kar red pin 📍 wahan drop karein"
                    : "Red pin 📍 ko drag karke building gate ya roof par rakhein"}
                </span>
              </div>
            </div>

            {isReverseGeocoding && (
              <div className="absolute bottom-3 left-3 z-20 pointer-events-none">
                <div className="bg-slate-950/90 backdrop-blur-md border border-slate-700 px-3 py-1.5 rounded-xl shadow-lg flex items-center gap-2 text-amber-300 text-xs">
                  <div className="w-3.5 h-3.5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin"></div>
                  <span>Resolving location address...</span>
                </div>
              </div>
            )}
          </div>

          {/* 3. CRYSTAL-CLEAR HIGH-CONTRAST FORM (BUILDING NAME + ADDRESS TEXT BOX) */}
          <div className="p-4 sm:p-5 bg-slate-950 space-y-4">
            
            {/* Top row: Building Name, Shop No, and Radius Slider */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5">
              
              {/* Building Name Input - Prominently Highlighted with Clear button */}
              <div className="sm:col-span-6 space-y-1.5">
                <label className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <FaBuilding /> 1. Apni Building / Society Ka Naam:
                  </span>
                  <span className="text-[10px] text-amber-300/80 font-bold lowercase">(optional - custom building)</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={buildingName}
                    onChange={(e) => handleBuildingNameChange(e.target.value)}
                    placeholder="e.g. Apni building/society ka naam yahan likhein (optional)..."
                    className="w-full bg-slate-900 border-2 border-amber-400 focus:border-amber-300 text-white rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-bold outline-none shadow-lg placeholder:text-slate-500 pr-8"
                  />
                  {buildingName && (
                    <button
                      type="button"
                      onClick={() => handleBuildingNameChange("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1 cursor-pointer"
                      title="Clear building name"
                    >
                      <FaTimes size={12} />
                    </button>
                  )}
                </div>
              </div>

              {/* Shop / Flat / Unit No with Clear button */}
              <div className="sm:col-span-3 space-y-1.5">
                <label className="text-xs font-black uppercase tracking-wider text-slate-300 block">
                  2. Shop / Flat No:
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={unitNo}
                    onChange={(e) => handleUnitNoChange(e.target.value)}
                    placeholder="e.g. Shop 6, Flat 101 (optional)..."
                    className="w-full bg-slate-900 border-2 border-slate-700 focus:border-amber-400 text-white rounded-xl px-3 py-2.5 text-xs sm:text-sm font-medium outline-none shadow-inner pr-8"
                  />
                  {unitNo && (
                    <button
                      type="button"
                      onClick={() => handleUnitNoChange("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1 cursor-pointer"
                      title="Clear unit no"
                    >
                      <FaTimes size={12} />
                    </button>
                  )}
                </div>
              </div>

              {/* Perimeter Radius */}
              <div className="sm:col-span-3 bg-slate-900 border-2 border-slate-800 rounded-xl p-2.5 space-y-1">
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
                  <span>25m</span>
                  <span>150m (Office)</span>
                  <span>500m</span>
                </div>
              </div>
            </div>

            {/* FULL REGISTERED ADDRESS TEXT BOX (THIS IS WHAT GETS SAVED) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between flex-wrap gap-1">
                <label className="text-xs font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                  <FaCheckCircle className="text-emerald-400" /> 3. Full Registered Office Address (Jo Database Me Save Hoga):
                </label>
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => performReverseGeocode(coords.latitude, coords.longitude)}
                    className="text-[10px] font-bold text-sky-400 hover:text-sky-300 bg-sky-950/80 border border-sky-700/60 px-2.5 py-1 rounded-lg transition cursor-pointer flex items-center gap-1"
                    title="Pin ke exact location ka asli address auto-detect karein"
                  >
                    <span>🔄 Re-Detect Address at Pin</span>
                  </button>
                  <span className="text-[11px] font-mono font-bold text-amber-300 bg-slate-900 px-2 py-0.5 rounded-lg border border-slate-800">
                    📍 Lat: {coords.latitude.toFixed(6)}, Lon: {coords.longitude.toFixed(6)}
                  </span>
                </div>
              </div>

              {/* Visible, high-contrast editable textarea */}
              <textarea
                rows={2}
                value={fullAddress}
                onChange={(e) => setFullAddress(e.target.value)}
                placeholder="Yahan pura address dikhega jo company office location ke roop me save hoga..."
                className="w-full bg-slate-900 border-2 border-emerald-500/80 focus:border-emerald-400 text-white rounded-xl p-3 text-xs sm:text-sm font-semibold outline-none shadow-lg resize-none leading-relaxed"
              />
              <p className="text-[10px] text-slate-400 italic">
                💡 Upar building name type karne par ya map me pin hilane par yeh text box turant auto-update hota hai. Aap chahein to yahan text ko manually bhi edit kar sakte hain.
              </p>
            </div>
          </div>
        </div>

        {/* 4. STICKY BOTTOM FOOTER - 100% ALWAYS VISIBLE WITH BIG SAVE BUTTON */}
        <div className="px-5 py-3.5 bg-slate-950 border-t-2 border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-300 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>
              Perimeter: <strong>{radiusMeters}m</strong> | Target: <strong>{buildingName || "Company Office"}</strong>
            </span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold transition cursor-pointer"
            >
              Cancel
            </button>

            {/* BIG UNMISTAKABLE CONFIRM & SAVE BUTTON */}
            <button
              type="button"
              onClick={handleConfirm}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-black text-xs sm:text-sm transition shadow-xl shadow-emerald-500/25 flex items-center gap-2 cursor-pointer active:scale-95"
            >
              <FaSave className="text-sm" />
              <span>Confirm &amp; Set Office Location</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
