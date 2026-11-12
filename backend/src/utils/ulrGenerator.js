export const ULR_REGEX = /^CC2863(\d{2})(\d{9})F$/;

/**
 * Validates exact 18-character NABL ULR format: CC2863 + YY + 9-digit sequence + F
 * Example: CC286326000000001F
 */
export const isValidUlrNo = (val) => ULR_REGEX.test(String(val || "").trim().toUpperCase());

export const normalizeUlrNo = (val) => {
  const cleaned = String(val || "").trim().toUpperCase();
  return ULR_REGEX.test(cleaned) ? cleaned : "";
};

export const parseUlrSequence = (val) => {
  const match = String(val || "").trim().toUpperCase().match(ULR_REGEX);
  if (!match) return null;
  return {
    year: match[1],
    seq: parseInt(match[2], 10),
  };
};

export const formatUlrNo = (seqNum, yearTwoDigit) => {
  const fallbackYear = String(new Date().getFullYear()).slice(-2);
  const yy = String(yearTwoDigit || fallbackYear)
    .replace(/\D/g, "")
    .slice(-2)
    .padStart(2, "0");
  const safeSeq = Math.max(1, Math.floor(Number(seqNum) || 1));
  return `CC2863${yy}${String(safeSeq).padStart(9, "0")}F`;
};

export const getTwoDigitYear = (dateInput) => {
  if (dateInput) {
    const dt = new Date(dateInput);
    if (!Number.isNaN(dt.getTime())) {
      return String(dt.getFullYear()).slice(-2);
    }
  }
  return String(new Date().getFullYear()).slice(-2);
};

export const extractRecordUlrNo = (rec) => {
  if (!rec) return "";
  const candidates = [
    rec.records?.ulrNo,
    rec.inwardRegister?.ulrNo,
    rec.authorizationData?.ulrNo,
    rec.observationData?.ulrNo,
    rec.ulrNo,
  ];
  for (const cand of candidates) {
    const norm = normalizeUlrNo(cand);
    if (norm) return norm;
  }
  return "";
};

export const isEligibleForAutoUlr = (rec) => {
  if (!rec) return false;
  if (rec.inwardRegister?.srfDone === true) return true;
  if (rec.inwardRegister?.srfDone === false && rec.inwardRegister?.srfDoneAt) return false;
  if (rec.authorizationData?.status === "Approved") return true;
  return ["Calibration Done", "Certificate Uploaded", "Invoice Sent"].includes(rec.stage);
};

export const findMaxDbUlrSeq = async (CalibrationRecord) => {
  if (!CalibrationRecord) return 0;
  const rows = await CalibrationRecord.find({
    $or: [
      { "records.ulrNo": { $regex: "^CC2863", $options: "i" } },
      { "inwardRegister.ulrNo": { $regex: "^CC2863", $options: "i" } },
      { "authorizationData.ulrNo": { $regex: "^CC2863", $options: "i" } },
      { "observationData.ulrNo": { $regex: "^CC2863", $options: "i" } },
    ],
  })
    .select("records.ulrNo inwardRegister.ulrNo authorizationData.ulrNo observationData.ulrNo")
    .lean();

  let maxSeq = 0;
  for (const r of rows) {
    const candidates = [
      r.records?.ulrNo,
      r.inwardRegister?.ulrNo,
      r.authorizationData?.ulrNo,
      r.observationData?.ulrNo,
    ];
    for (const cand of candidates) {
      const parsed = parseUlrSequence(cand);
      if (parsed && parsed.seq > maxSeq) {
        maxSeq = parsed.seq;
      }
    }
  }
  return maxSeq;
};

/**
 * Atomically reserves `count` strictly sequential, non-repeating 18-char ULR numbers.
 * Seeded from the DB high-water mark so manual edits or prior rows are never duplicated.
 */
export const allocateNextUlrNumbers = async (
  count = 1,
  { year, CalibrationRecord, mongoose, counterCollectionName = "calibrationcounters", counterId = "arcl_ulr_global_seq" } = {}
) => {
  const n = Math.max(1, Math.floor(Number(count) || 1));
  const yy = getTwoDigitYear(year ? new Date(Number(`20${String(year).slice(-2)}`), 0, 1) : null);
  const maxDbSeq = CalibrationRecord ? await findMaxDbUlrSeq(CalibrationRecord) : 0;

  let startSeq = maxDbSeq + 1;
  const db = mongoose?.connection?.db;
  if (db) {
    const countersCol = db.collection(counterCollectionName);
    await countersCol.updateOne(
      { _id: counterId },
      { $max: { seq: maxDbSeq }, $set: { updatedAt: new Date() } },
      { upsert: true }
    );
    const updated = await countersCol.findOneAndUpdate(
      { _id: counterId },
      { $inc: { seq: n }, $set: { updatedAt: new Date() } },
      { upsert: true, returnDocument: "after" }
    );
    const endSeq = Number(updated?.value?.seq ?? updated?.seq ?? maxDbSeq + n);
    startSeq = Math.max(maxDbSeq + 1, endSeq - n + 1);
  }

  return Array.from({ length: n }, (_, i) => formatUlrNo(startSeq + i, yy));
};

/**
 * Assigns and persists unique sequential ULR numbers to ALL records missing one
 * (or holding an accidental duplicate within the list). Mutates records in-place too.
 */
export const ensureSequentialUlrNumbersForRecords = async (
  records = [],
  { CalibrationRecord, mongoose, forceAllProvided = true } = {}
) => {
  if (!Array.isArray(records) || records.length === 0) return records;

  const seenValid = new Set();
  const ordered = [...records].sort((a, b) => {
    const srDiff = (Number(a?.srNo) || 0) - (Number(b?.srNo) || 0);
    if (srDiff !== 0) return srDiff;
    const tA = a?.createdAt ? new Date(a.createdAt).getTime() : 0;
    const tB = b?.createdAt ? new Date(b.createdAt).getTime() : 0;
    if (tA !== tB) return tA - tB;
    return String(a?._id || "").localeCompare(String(b?._id || ""));
  });

  const needAllocation = [];
  const syncNeeded = [];

  for (const rec of ordered) {
    if (!forceAllProvided && !isEligibleForAutoUlr(rec)) continue;
    const existing = extractRecordUlrNo(rec);
    if (existing && !seenValid.has(existing)) {
      seenValid.add(existing);
      // Keep records.ulrNo and inwardRegister.ulrNo synchronized for every product
      const needsSync =
        normalizeUlrNo(rec.records?.ulrNo) !== existing ||
        normalizeUlrNo(rec.inwardRegister?.ulrNo) !== existing;
      if (needsSync) {
        syncNeeded.push({ rec, ulrNo: existing });
      }
    } else {
      needAllocation.push(rec);
    }
  }

  if (needAllocation.length === 0 && syncNeeded.length === 0) {
    return records;
  }

  const allocated =
    needAllocation.length > 0
      ? await allocateNextUlrNumbers(needAllocation.length, { CalibrationRecord, mongoose })
      : [];

  const bulkOps = [];

  for (const { rec, ulrNo } of syncNeeded) {
    const hasRecObj = Boolean(rec.records && typeof rec.records === "object");
    const hasInwardObj = Boolean(rec.inwardRegister && typeof rec.inwardRegister === "object");
    if (!hasRecObj) rec.records = {};
    rec.records.ulrNo = ulrNo;
    if (!hasInwardObj) rec.inwardRegister = {};
    rec.inwardRegister.ulrNo = ulrNo;
    if (CalibrationRecord && rec._id) {
      const setSync = {
        ...(hasRecObj ? { "records.ulrNo": ulrNo } : { records: { ulrNo } }),
        ...(hasInwardObj ? { "inwardRegister.ulrNo": ulrNo } : { inwardRegister: { srfDone: false, ulrNo } }),
      };
      bulkOps.push({
        updateOne: {
          filter: { _id: rec._id },
          update: { $set: setSync },
        },
      });
    }
  }

  needAllocation.forEach((rec, idx) => {
    const newUlr = allocated[idx];
    if (!newUlr) return;
    const hasRecObj = Boolean(rec.records && typeof rec.records === "object");
    const hasInwardObj = Boolean(rec.inwardRegister && typeof rec.inwardRegister === "object");
    if (!hasRecObj) rec.records = {};
    rec.records.ulrNo = newUlr;
    if (!hasInwardObj) rec.inwardRegister = {};
    rec.inwardRegister.ulrNo = newUlr;
    if (rec.authorizationData?.status === "Approved") {
      rec.authorizationData.ulrNo = newUlr;
    }

    if (CalibrationRecord && rec._id) {
      const setPayload = {
        ...(hasRecObj ? { "records.ulrNo": newUlr } : { records: { ulrNo: newUlr } }),
        ...(hasInwardObj
          ? { "inwardRegister.ulrNo": newUlr }
          : { inwardRegister: { srfDone: false, ulrNo: newUlr } }),
      };
      if (rec.authorizationData?.status === "Approved") {
        setPayload["authorizationData.ulrNo"] = newUlr;
      }
      bulkOps.push({
        updateOne: {
          filter: { _id: rec._id },
          update: { $set: setPayload },
        },
      });
    }
  });

  if (bulkOps.length > 0 && CalibrationRecord) {
    await CalibrationRecord.bulkWrite(bulkOps, { ordered: false });
  }

  return records;
};
