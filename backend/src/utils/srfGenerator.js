export const normalizeCustomerKey = (companyName) =>
  String(companyName || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");

export const getDatePrefixYYMMDD = (dateInput) => {
  const dt = dateInput ? new Date(dateInput) : new Date();
  const safeDt = Number.isNaN(dt.getTime()) ? new Date() : dt;
  const yy = String(safeDt.getFullYear()).slice(-2);
  const mm = String(safeDt.getMonth() + 1).padStart(2, "0");
  const dd = String(safeDt.getDate()).padStart(2, "0");
  return `${yy}${mm}${dd}/`;
};

export const getRecordReceiptDate = (rec) =>
  rec?.inwardRegister?.dateOfReceipt ||
  rec?.labPermission?.releaseDate ||
  rec?.calibrationDate ||
  rec?.challanDate ||
  rec?.createdAt ||
  new Date();

export const extractRecordSrfNo = (rec) =>
  String(rec?.inwardRegister?.srfNo || rec?.srfNo || "").trim();

export const parseSrfPrefixAndSeq = (srfNo) => {
  const match = String(srfNo || "")
    .trim()
    .match(/^(\d{6}\/)(\d+)$/);
  if (!match) return null;
  return {
    prefix: match[1],
    seq: parseInt(match[2], 10),
  };
};

export const formatSrfNo = (prefix, seq) =>
  `${prefix}${String(Math.max(1, Math.floor(Number(seq) || 1))).padStart(2, "0")}`;

/**
 * Groups items belonging to the exact same customer inward/challan batch.
 * Different customers ALWAYS produce distinct batch keys.
 */
export const buildSrfBatchKey = (rec) => {
  const custKey = normalizeCustomerKey(rec?.clientCompany) || `id_${String(rec?._id || "")}`;
  const rawDc = String(rec?.dcNo || "").trim().toLowerCase();
  const hasDc = rawDc && rawDc !== "-" && rawDc !== "n/a";
  if (hasDc) {
    return `${custKey}___dc___${rawDc}`;
  }
  const prefix = getDatePrefixYYMMDD(getRecordReceiptDate(rec));
  return `${custKey}___dt___${prefix}`;
};

const sortChronological = (records = []) =>
  [...records].sort((a, b) => {
    const tA = new Date(getRecordReceiptDate(a)).getTime() || 0;
    const tB = new Date(getRecordReceiptDate(b)).getTime() || 0;
    if (tA !== tB) return tA - tB;
    const cA = a?.createdAt ? new Date(a.createdAt).getTime() : 0;
    const cB = b?.createdAt ? new Date(b.createdAt).getTime() : 0;
    if (cA !== cB) return cA - cB;
    const srDiff = (Number(a?.srNo) || 0) - (Number(b?.srNo) || 0);
    if (srDiff !== 0) return srDiff;
    return String(a?._id || "").localeCompare(String(b?._id || ""));
  });

export const findDbSrfState = async (CalibrationRecord) => {
  const srfOwnerCustomer = new Map();
  const srfOwnerBatch = new Map();
  const maxSeqByPrefix = new Map();

  if (!CalibrationRecord?.find) {
    return { srfOwnerCustomer, srfOwnerBatch, maxSeqByPrefix };
  }

  const allDocs = await CalibrationRecord.find({
    $or: [
      { srfNo: { $exists: true, $ne: "" } },
      { "inwardRegister.srfNo": { $exists: true, $ne: "" } },
    ],
  })
    .select("clientCompany dcNo srfNo inwardRegister.srfNo inwardRegister.dateOfReceipt labPermission.releaseDate calibrationDate challanDate createdAt srNo")
    .lean();

  const ordered = sortChronological(allDocs);
  for (const doc of ordered) {
    const srf = extractRecordSrfNo(doc);
    if (!srf) continue;
    const srfLow = srf.toLowerCase();
    const custKey = normalizeCustomerKey(doc.clientCompany);
    const batchKey = buildSrfBatchKey(doc);

    if (!srfOwnerCustomer.has(srfLow)) {
      srfOwnerCustomer.set(srfLow, custKey);
      srfOwnerBatch.set(srfLow, batchKey);
    }

    const parsed = parseSrfPrefixAndSeq(srf);
    if (parsed) {
      const prevMax = maxSeqByPrefix.get(parsed.prefix) || 0;
      if (parsed.seq > prevMax) {
        maxSeqByPrefix.set(parsed.prefix, parsed.seq);
      }
    }
  }

  return { srfOwnerCustomer, srfOwnerBatch, maxSeqByPrefix };
};

export const allocateNextSrfNo = async (
  dateInput,
  { CalibrationRecord, srfOwnerCustomer, maxSeqByPrefix } = {}
) => {
  const state =
    srfOwnerCustomer && maxSeqByPrefix
      ? { srfOwnerCustomer, maxSeqByPrefix }
      : await findDbSrfState(CalibrationRecord);

  const prefix = getDatePrefixYYMMDD(dateInput);
  let seq = (state.maxSeqByPrefix.get(prefix) || 0) + 1;
  let candidate = formatSrfNo(prefix, seq);
  while (state.srfOwnerCustomer.has(candidate.toLowerCase())) {
    seq += 1;
    candidate = formatSrfNo(prefix, seq);
  }
  state.maxSeqByPrefix.set(prefix, seq);
  return candidate;
};

/**
 * Ensures every customer batch gets its own distinct SRF No. (YYMMDD/NN).
 * - Multiple items within the SAME customer's inward/DC batch share their batch SRF No.
 * - Different customers NEVER share an SRF No. (colliding or missing SRFs get /02, /03, ...).
 * Mutates records in-place and persists via bulkWrite when changed.
 */
export const ensureUniqueSrfNumbersForRecords = async (
  records = [],
  { CalibrationRecord } = {}
) => {
  if (!Array.isArray(records) || records.length === 0) return records;

  const { srfOwnerCustomer, srfOwnerBatch, maxSeqByPrefix } = await findDbSrfState(CalibrationRecord);
  const ordered = sortChronological(records);

  // Also ensure any SRF seen purely inside `records` registers its sequence max
  for (const r of ordered) {
    const srf = extractRecordSrfNo(r);
    const parsed = parseSrfPrefixAndSeq(srf);
    if (parsed) {
      const prevMax = maxSeqByPrefix.get(parsed.prefix) || 0;
      if (parsed.seq > prevMax) {
        maxSeqByPrefix.set(parsed.prefix, parsed.seq);
      }
    }
  }

  const batchGroups = new Map();
  for (const rec of ordered) {
    const batchKey = buildSrfBatchKey(rec);
    if (!batchGroups.has(batchKey)) {
      batchGroups.set(batchKey, {
        batchKey,
        custKey: normalizeCustomerKey(rec.clientCompany),
        receiptDate: getRecordReceiptDate(rec),
        items: [],
      });
    }
    batchGroups.get(batchKey).items.push(rec);
  }

  const bulkOps = [];

  for (const grp of batchGroups.values()) {
    const existingCandidates = grp.items
      .map((item) => extractRecordSrfNo(item))
      .filter(Boolean);

    let assignedSrf = "";
    for (const cand of existingCandidates) {
      const candLow = cand.toLowerCase();
      const ownerCust = srfOwnerCustomer.get(candLow);
      const ownerBatch = srfOwnerBatch.get(candLow);
      // Reuse only if unclaimed OR owned by the exact same customer & compatible batch
      if (!ownerCust || (ownerCust === grp.custKey && (!ownerBatch || ownerBatch === grp.batchKey))) {
        assignedSrf = cand;
        break;
      }
    }

    if (!assignedSrf) {
      assignedSrf = await allocateNextSrfNo(grp.receiptDate, {
        CalibrationRecord,
        srfOwnerCustomer,
        maxSeqByPrefix,
      });
    }

    const assignedLow = assignedSrf.toLowerCase();
    srfOwnerCustomer.set(assignedLow, grp.custKey);
    srfOwnerBatch.set(assignedLow, grp.batchKey);
    const parsedAssigned = parseSrfPrefixAndSeq(assignedSrf);
    if (parsedAssigned) {
      const prevMax = maxSeqByPrefix.get(parsedAssigned.prefix) || 0;
      if (parsedAssigned.seq > prevMax) {
        maxSeqByPrefix.set(parsedAssigned.prefix, parsedAssigned.seq);
      }
    }

    for (const rec of grp.items) {
      const curTop = String(rec.srfNo || "").trim();
      const curReg = String(rec.inwardRegister?.srfNo || "").trim();
      const oldSrf = curReg || curTop;
      const curInwardNo = String(rec.inwardRegister?.inwardNo || "").trim();

      let nextInwardNo = curInwardNo;
      if (oldSrf && oldSrf !== assignedSrf && curInwardNo.startsWith(`${oldSrf}-`)) {
        nextInwardNo = `${assignedSrf}-${curInwardNo.slice(oldSrf.length + 1)}`;
      }

      const needsTopUpdate = curTop !== assignedSrf;
      const needsRegUpdate = curReg !== assignedSrf;
      const needsInwardUpdate = nextInwardNo !== curInwardNo;

      if (needsTopUpdate || needsRegUpdate || needsInwardUpdate) {
        rec.srfNo = assignedSrf;
        if (!rec.inwardRegister) rec.inwardRegister = {};
        rec.inwardRegister.srfNo = assignedSrf;
        if (needsInwardUpdate) {
          rec.inwardRegister.inwardNo = nextInwardNo;
        }

        if (CalibrationRecord?.bulkWrite && rec._id) {
          const setFields = {
            srfNo: assignedSrf,
            "inwardRegister.srfNo": assignedSrf,
          };
          if (needsInwardUpdate) {
            setFields["inwardRegister.inwardNo"] = nextInwardNo;
          }
          bulkOps.push({
            updateOne: {
              filter: { _id: rec._id },
              update: { $set: setFields },
            },
          });
        }
      }
    }
  }

  if (bulkOps.length > 0 && CalibrationRecord?.bulkWrite) {
    await CalibrationRecord.bulkWrite(bulkOps, { ordered: false });
  }

  return records;
};
