/**
 * quotationStorage.js
 * Persistent client & equipment suggestions manager for Official Quotation Live Visual Editor.
 * Automatically saves new customer names and equipment items so they appear
 * in auto-suggestions even after typing just a single letter.
 */

export const INITIAL_SEED_CLIENTS = [
  {
    companyName: "AHLUWALIA CONTRACTS INDIA LIMITED",
    gstin: "27AATCA7874C1ZB",
    address: "3rd & 4th, 301 & 401, PATATTHU BUSINESS PLAZA, C.S.T ROAD, KALINA, SANTACRUZ, Mumbai, Maharashtra, 400098",
    cityStatePin: "Mumbai, MAHARASHTRA, 400098",
    phone: "+91 8009559900",
    email: "info@ahluwalia.net",
    source: "seed",
  },
  {
    companyName: "RDSS QUALITY CONTROL LAB PRIVATE LIMITED",
    gstin: "27AAOCR3275P1ZH",
    address: "FLAT NO-1105, A-WING, 11TH FLOOR, SHREEJI GREENS\nBELAVALI, Ambarnath",
    cityStatePin: "Thane, MAHARASHTRA, 421503",
    phone: "+91 8369458583",
    email: "arclinstruments@gmail.com",
    source: "seed",
  },
  {
    companyName: "LARSEN & TOUBRO LIMITED (L&T Construction)",
    gstin: "27AAACL0149A1Z7",
    address: "L&T House, Ballard Estate, P. O. Box: 278, Mumbai - 400001",
    cityStatePin: "Mumbai, MAHARASHTRA, 400001",
    phone: "+91 22 67525656",
    email: "infodesk@larsentoubro.com",
    source: "seed",
  },
  {
    companyName: "TATA PROJECTS LIMITED",
    gstin: "27AAACT0578E1Z7",
    address: "One Boulevard, Lake Boulevard Road, Hiranandani Business Park, Powai, Mumbai - 400076",
    cityStatePin: "Mumbai, MAHARASHTRA, 400076",
    phone: "+91 22 66255600",
    email: "tataprojects@tataprojects.com",
    source: "seed",
  },
  {
    companyName: "GODREJ CONSTRUCTION",
    gstin: "27AAACG0426P1Z3",
    address: "Plant 13, Pirojshanagar, Eastern Express Highway, Vikhroli East, Mumbai - 400079",
    cityStatePin: "Mumbai, MAHARASHTRA, 400079",
    phone: "+91 22 67961700",
    email: "construction@godrej.com",
    source: "seed",
  },
  {
    companyName: "NCC LIMITED",
    gstin: "27AABCN1280L1Z9",
    address: "NCC House, Madhapur / Navi Mumbai Project Site",
    cityStatePin: "Navi Mumbai, MAHARASHTRA, 400703",
    phone: "+91 40 23268888",
    email: "info@nccltd.in",
    source: "seed",
  },
  {
    companyName: "SHAPOORJI PALLONJI AND COMPANY PRIVATE LIMITED",
    gstin: "27AAACS1392A1Z5",
    address: "SP Centre, 41/44 Minoo Desai Marg, Colaba, Mumbai - 400005",
    cityStatePin: "Mumbai, MAHARASHTRA, 400005",
    phone: "+91 22 67490000",
    email: "contact@shapoorji.com",
    source: "seed",
  },
  {
    companyName: "J. KUMAR INFRAPROJECTS LIMITED",
    gstin: "27AAACJ2286A1Z4",
    address: "16-A, Andheri Industrial Estate, Veera Desai Road, Andheri West, Mumbai - 400053",
    cityStatePin: "Mumbai, MAHARASHTRA, 400053",
    phone: "+91 22 67743555",
    email: "info@jkumar.com",
    source: "seed",
  },
  {
    companyName: "AFCONS INFRASTRUCTURE LIMITED",
    gstin: "27AAACA0475E1Z5",
    address: "Afcons House, 16 Shah Industrial Estate, Veera Desai Road, Azadnagar, Andheri West, Mumbai - 400053",
    cityStatePin: "Mumbai, MAHARASHTRA, 400053",
    phone: "+91 22 67191000",
    email: "info@afcons.com",
    source: "seed",
  },
];

const STORAGE_KEY_CLIENTS = "arcl_saved_quotation_clients";
const STORAGE_KEY_ITEMS = "arcl_saved_quotation_items";

/**
 * Get all saved clients from localStorage merged with seed clients
 */
export const getSavedQuotationClients = () => {
  if (typeof window === "undefined") return INITIAL_SEED_CLIENTS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CLIENTS);
    if (!raw) return INITIAL_SEED_CLIENTS;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return INITIAL_SEED_CLIENTS;

    // Merge seed clients with user-saved clients (user-saved take precedence)
    const clientMap = new Map();
    INITIAL_SEED_CLIENTS.forEach((c) => {
      clientMap.set(c.companyName.trim().toLowerCase(), c);
    });
    parsed.forEach((c) => {
      if (c && c.companyName) {
        clientMap.set(c.companyName.trim().toLowerCase(), { ...c, source: "saved" });
      }
    });
    return Array.from(clientMap.values());
  } catch (err) {
    console.error("Failed to load saved quotation clients:", err);
    return INITIAL_SEED_CLIENTS;
  }
};

/**
 * Save or update a client in localStorage
 */
export const saveQuotationClient = (client) => {
  if (typeof window === "undefined" || !client || !client.companyName) return false;
  const name = String(client.companyName).trim();
  if (!name) return false;

  try {
    const currentList = getSavedQuotationClients();
    const normalizedKey = name.toLowerCase();

    // Check if client already exists
    const existingIndex = currentList.findIndex(
      (c) => c.companyName.trim().toLowerCase() === normalizedKey
    );

    const clientPayload = {
      companyName: name,
      gstin: String(client.gstin || "").trim().toUpperCase(),
      address: String(client.address || "").trim(),
      cityStatePin: String(client.cityStatePin || "").trim(),
      phone: String(client.phone || "").trim(),
      email: String(client.email || "").trim(),
      updatedAt: new Date().toISOString(),
      source: "saved",
    };

    let updatedList;
    if (existingIndex >= 0) {
      // Merge with existing details so we don't overwrite with blank values
      const existing = currentList[existingIndex];
      updatedList = [...currentList];
      updatedList[existingIndex] = {
        ...existing,
        ...clientPayload,
        gstin: clientPayload.gstin || existing.gstin || "",
        address: clientPayload.address || existing.address || "",
        cityStatePin: clientPayload.cityStatePin || existing.cityStatePin || "",
        phone: clientPayload.phone || existing.phone || "",
        email: clientPayload.email || existing.email || "",
      };
    } else {
      updatedList = [clientPayload, ...currentList];
    }

    localStorage.setItem(STORAGE_KEY_CLIENTS, JSON.stringify(updatedList));
    return true;
  } catch (err) {
    console.error("Failed to save quotation client:", err);
    return false;
  }
};

/**
 * Delete a custom saved client from localStorage
 */
export const deleteSavedQuotationClient = (companyName) => {
  if (typeof window === "undefined" || !companyName) return false;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CLIENTS);
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return false;
    const filtered = parsed.filter(
      (c) => c.companyName.trim().toLowerCase() !== String(companyName).trim().toLowerCase()
    );
    localStorage.setItem(STORAGE_KEY_CLIENTS, JSON.stringify(filtered));
    return true;
  } catch (err) {
    console.error("Failed to delete saved quotation client:", err);
    return false;
  }
};

/**
 * Get saved equipment items from localStorage
 */
export const getSavedQuotationItems = () => {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_ITEMS);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error("Failed to load saved quotation items:", err);
    return [];
  }
};

/**
 * Save new quotation items to localStorage
 */
export const saveQuotationItems = (items) => {
  if (typeof window === "undefined" || !Array.isArray(items) || items.length === 0) return false;
  try {
    const current = getSavedQuotationItems();
    const itemMap = new Map();
    current.forEach((it) => {
      if (it && it.name) itemMap.set(it.name.trim().toLowerCase(), it);
    });

    items.forEach((it) => {
      const name = String(it.name || "").trim();
      if (!name) return;
      const key = name.toLowerCase();
      itemMap.set(key, {
        name,
        subText: String(it.subText || "").trim() || "NABL Traceable Report",
        hsnSac: String(it.hsnSac || "998346").trim(),
        rate: Number(it.rate) || 500,
        savedAt: new Date().toISOString(),
      });
    });

    const updated = Array.from(itemMap.values());
    localStorage.setItem(STORAGE_KEY_ITEMS, JSON.stringify(updated));
    return true;
  } catch (err) {
    console.error("Failed to save quotation items:", err);
    return false;
  }
};
