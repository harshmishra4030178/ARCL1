import { extractRecordSrfNo, getDatePrefixYYMMDD, getRecordReceiptDate } from "./srfGenerator.js";

const escapeCertRegex = (val) => String(val || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * Classifies any calibration record / instrument into one of ARCL's 6 NABL discipline codes:
 * - F: Force
 * - D: Dimensions
 * - M: Mass
 * - R: RPM (Speed & Time)
 * - T: Temperature (Thermal & Humidity)
 * - P: Pressure (Pressure & Vacuum)
 */
export const getDisciplineCertCode = (record = {}) => {
  const obs = record?.observationData || {};
  const params = obs?.parameters || {};

  const explicitDiscipline = [
    obs.discipline,
    params.discipline,
    record.discipline,
    record.category,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (explicitDiscipline) {
    if (/\b(rpm|speed|tachometer)\b/i.test(explicitDiscipline)) return "R";
    if (/\b(pressure|vacuum)\b/i.test(explicitDiscipline)) return "P";
    if (/\b(temp|temperature|thermal|humidity)\b/i.test(explicitDiscipline)) return "T";
    if (/\b(dimension|dimensional|length|aperture)\b/i.test(explicitDiscipline)) return "D";
    if (/\b(mass|volume|balance|weight)\b/i.test(explicitDiscipline)) return "M";
    if (/\bforce\b/i.test(explicitDiscipline)) return "F";
  }

  const text = [
    obs.instrument,
    record.instrument,
    obs.range,
    record.instrumentRange,
    record.make,
    record.modelNo,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  // Order matters so composite names like "Sieve Shaker" -> R, "Pressure Gauge" -> P, "Dial Gauge" -> D, "Steel Scale" -> D
  if (/\b(rpm|tachometer|shaker|vibrating|vibrator|centrifuge|stirrer|rotary|timer|stopwatch|stop watch|speed)\b/i.test(text)) {
    return "R";
  }
  if (/\b(pressure|vacuum|dead weight|manometer|air entrainment|hydraulic jack|bar|psi|kpa|mpa)\b|kg\/cm/i.test(text)) {
    return "P";
  }
  if (
    /\b(temp|temperature|thermal|oven|furnace|muffle|water bath|curing tank|incubator|bod|hot plate|thermometer|rtd|thermocouple|hygro|humidity|chamber|freezer|refrigerator|autoclave|flash point|softening point)\b|°c/i.test(
      text
    )
  ) {
    return "T";
  }
  if (
    /\b(dimension|dimensional|vernier|caliper|micrometer|dial gauge|depth gauge|bore gauge|feeler|radius gauge|flakiness|elongation|sieve|mould|mold|slump|flow table|steel scale|measuring tape|tape|height gauge|thickness gauge|length|aperture|blaine|le-chatelier|micron|mm)\b|µm/i.test(
      text
    )
  ) {
    return "D";
  }
  if (/\b(mass|weigh|weighing|balance|standard weight|weight box|pycnometer|volumetric|graduated cylinder|measuring cylinder|pipette|burette|kg|mg|ml)\b/i.test(text)) {
    return "M";
  }
  if (
    /\b(force|ctm|utm|compression|tensile|cbr|marshall|load cell|proving ring|flexural|pull-out|pull out|rebound hammer|schmidt|impact value|crushing value|shear|triaxial|penetrometer|vane|torque|hardness|vicat|dynamometer|kn|kgf|ton)\b/i.test(
      text
    )
  ) {
    return "F";
  }

  return "F";
};

export const isPlaceholderCertificateNo = (certNo) => {
  const s = String(certNo || "").trim();
  if (!s) return true;
  if (/^ARCL-CAL-\d{4}-\d+$/i.test(s)) return true;
  if (/^ARCL-CAL-\d{4}-CERT$/i.test(s)) return true;
  if (/^ARCL-CAL-\d{4}-HM\d+$/i.test(s)) return true;
  return false;
};

/**
 * Allocates next sequential ARCL Certificate No. for the record's discipline & SRF No.:
 * Format: ARCL/<CODE>/<SRF_NO>/<SEQ>
 * Examples:
 * - Force:       ARCL/F/261112/01/01, ARCL/F/261112/01/02
 * - Dimensions:  ARCL/D/261112/01/01, ARCL/D/261112/01/02
 * - Mass:        ARCL/M/261112/01/01
 * - RPM:         ARCL/R/261112/01/01
 * - Temperature: ARCL/T/261112/01/01
 * - Pressure:    ARCL/P/261112/01/01
 */
export const allocateNextCertificateNo = async (
  record,
  { CalibrationRecord, srfNo = "", usedCertNos = null } = {}
) => {
  const rawSrf = String(srfNo || extractRecordSrfNo(record) || "").trim();
  const fallbackPrefix = getDatePrefixYYMMDD(getRecordReceiptDate(record)).replace(/\/+$/, "");
  const resolvedSrf = rawSrf || `${fallbackPrefix}/01`;

  const code = getDisciplineCertCode(record);
  const prefix = `ARCL/${code}/${resolvedSrf}/`;
  const seqRegex = new RegExp(`^${escapeCertRegex(prefix)}(\\d+)$`, "i");

  let maxSeq = 0;
  const consume = (candidate) => {
    const m = String(candidate || "").trim().match(seqRegex);
    if (m) {
      const n = parseInt(m[1], 10);
      if (!Number.isNaN(n) && n > maxSeq) maxSeq = n;
    }
  };

  if (usedCertNos && typeof usedCertNos[Symbol.iterator] === "function") {
    for (const c of usedCertNos) {
      consume(c);
    }
  }

  if (CalibrationRecord?.find) {
    const prefixPattern = new RegExp(`^${escapeCertRegex(prefix)}`, "i");
    const existing = await CalibrationRecord.find({
      $or: [
        { "records.certificateNo": prefixPattern },
        { "authorizationData.certificateNo": prefixPattern },
        { "inwardRegister.certificateNo": prefixPattern },
      ],
    })
      .select("records.certificateNo authorizationData.certificateNo inwardRegister.certificateNo")
      .lean();

    for (const doc of existing) {
      consume(doc?.records?.certificateNo);
      consume(doc?.authorizationData?.certificateNo);
      consume(doc?.inwardRegister?.certificateNo);
    }
  }

  const nextCert = `${prefix}${String(maxSeq + 1).padStart(2, "0")}`;
  if (usedCertNos && typeof usedCertNos.add === "function") {
    usedCertNos.add(nextCert);
  }
  return nextCert;
};
