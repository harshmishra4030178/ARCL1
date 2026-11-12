#!/usr/bin/env python3
"""
ARCL Format-Matched Hard-Copy Pen Scanner Extractor (RapidOCR v3 PP-OCRv6 + OpenCV)
- Compares Soft Copy structure (unfilled vs pre-filled cells) with Scanned Sheet
- Protects pre-printed / fixed columns & already-filled cells
- Extracts ONLY handwritten pen markings into unfilled table cells, Repeatability MU boxes, and blank metadata slots
- Uses blue-ink-preserving gridline removal + constrained numeric CTC decoding for open-top pen handwriting
- Leaves ambiguous low-confidence cells blank + flags them for quick visual confirmation via cropped pen previews
"""

import sys
import os
import json
import re
import base64
import cv2
import numpy as np
from PIL import Image, ImageOps

try:
    from rapidocr import RapidOCR as RapidOCRv3
    HAS_RAPIDOCR_V3 = True
except ImportError:
    from rapidocr_onnxruntime import RapidOCR as RapidOCROld
    HAS_RAPIDOCR_V3 = False

_OCR_INSTANCE = None
_NUMERIC_MASK = None
_CHAR_LIST = None


def get_ocr():
    global _OCR_INSTANCE
    if _OCR_INSTANCE is None:
        if HAS_RAPIDOCR_V3:
            import logging
            logging.getLogger("RapidOCR").setLevel(logging.ERROR)
            _OCR_INSTANCE = RapidOCRv3()
        else:
            _OCR_INSTANCE = RapidOCROld()
    return _OCR_INSTANCE


def norm_str(s):
    return re.sub(r"[^a-z0-9]+", "", str(s or "").lower())


def clean_numeric_token(raw_text, is_numeric_col=True):
    txt = str(raw_text or "").strip()
    if not txt:
        return ""
    if not is_numeric_col:
        return txt

    compact = txt.replace(" ", "")
    m_dash = re.fullmatch(r"(\d)-(\d)", compact)
    if m_dash:
        return f"{m_dash.group(1)}{m_dash.group(2)}"

    # Allow ONLY digits, dot, sign, or unambiguous lookalikes (O/o->0, I/l/|->1).
    # Reject strings with letters like "U.1" or "u.2" so numeric CTC decodes the full number ("4.1", "4.2")!
    if not re.fullmatch(r"[+-]?[0-9.,OolI|]+", compact):
        return ""

    mapped = (
        compact.replace("O", "0")
        .replace("o", "0")
        .replace("I", "1")
        .replace("l", "1")
        .replace("|", "1")
        .replace(",", ".")
    )
    if re.fullmatch(r"[+-]?\d+(?:\.\d+)?", mapped):
        return mapped
    return ""


def encode_crop_data_url(bgr_crop):
    if bgr_crop is None or bgr_crop.size == 0:
        return ""
    ok, buf = cv2.imencode(".png", bgr_crop)
    if not ok:
        return ""
    return "data:image/png;base64," + base64.b64encode(buf.tobytes()).decode("ascii")


def strip_cell_borders_and_crop_ink(cell_bgr):
    """
    Erases neutral dark horizontal/vertical grid lines while keeping colored pen strokes (e.g., blue ballpoint)
    and dark interior handwriting intact. Returns (preview_data_url, padded_bgr_for_ocr, has_ink).
    """
    if cell_bgr is None or cell_bgr.size == 0:
        return "", None, False
    h, w = cell_bgr.shape[:2]
    if h < 12 or w < 12:
        return "", None, False

    pad_y = min(4, max(1, h // 12))
    pad_x = min(5, max(1, w // 28))
    inner = cell_bgr[pad_y : h - pad_y, pad_x : w - pad_x].copy()
    if inner.size == 0:
        return "", None, False

    ih, iw = inner.shape[:2]
    b, g, r = cv2.split(inner.astype(np.int16))
    chroma = np.maximum(np.maximum(np.abs(b - r), np.abs(b - g)), np.abs(g - r))
    is_colored_pen = chroma > 20

    gray = cv2.cvtColor(inner, cv2.COLOR_BGR2GRAY)
    _, bw = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)

    # Detect long neutral horizontal and vertical grid lines via morphology
    hk = cv2.getStructuringElement(cv2.MORPH_RECT, (max(14, int(iw * 0.45)), 1))
    vk = cv2.getStructuringElement(cv2.MORPH_RECT, (1, max(14, int(ih * 0.55))))
    h_lines = cv2.morphologyEx(bw, cv2.MORPH_OPEN, hk)
    v_lines = cv2.morphologyEx(bw, cv2.MORPH_OPEN, vk)
    lines = cv2.dilate(cv2.bitwise_or(h_lines, v_lines), np.ones((3, 3), np.uint8))

    # Critical: NEVER erase colored pen ink intersecting a gridline
    lines[is_colored_pen] = 0

    clean = inner.copy()
    clean[lines > 0] = (255, 255, 255)
    clean_gray = cv2.cvtColor(clean, cv2.COLOR_BGR2GRAY)

    # Ignore 2px non-colored outer edge noise
    ink_mask = is_colored_pen | (clean_gray < 185)
    edge_mask = np.zeros_like(ink_mask, dtype=bool)
    edge_mask[:2, :] = True
    edge_mask[-2:, :] = True
    edge_mask[:, :2] = True
    edge_mask[:, -2:] = True
    ink_mask[edge_mask & (~is_colored_pen)] = False

    preview_url = encode_crop_data_url(inner)
    ys, xs = np.where(ink_mask)
    if len(xs) < 12:
        return preview_url, None, False

    x1 = max(0, int(xs.min()) - 5)
    x2 = min(iw, int(xs.max()) + 6)
    y1 = max(0, int(ys.min()) - 4)
    y2 = min(ih, int(ys.max()) + 5)
    tight = clean[y1:y2, x1:x2]
    padded = cv2.copyMakeBorder(tight, 16, 16, 18, 18, cv2.BORDER_CONSTANT, value=(255, 255, 255))
    return preview_url, padded, True


def recognize_numeric_cell(ocr, padded_bgr, is_numeric=True):
    """
    Runs RapidOCR v3 text_rec on a cleaned cell crop plus constrained numeric CTC decoding
    when general multilingual/English decoding outputs ambiguous letters like U.1 -> 4.1.
    Returns (value, confidence, raw_text).
    """
    if padded_bgr is None or padded_bgr.size == 0:
        return "", 0.0, ""

    raw_txt = ""
    raw_score = 0.0

    if HAS_RAPIDOCR_V3:
        res = ocr(padded_bgr, use_det=False, use_cls=False, use_rec=True)
        if res and res.txts:
            raw_txt = str(res.txts[0] or "").strip()
            raw_score = float(res.scores[0] or 0.0) if res.scores else 0.0
    else:
        rec_out, _ = ocr.text_recognizer([padded_bgr])
        if rec_out and len(rec_out) > 0:
            raw_txt = str(rec_out[0][0] or "").strip()
            raw_score = float(rec_out[0][1] or 0.0)

    cleaned_raw = clean_numeric_token(raw_txt, is_numeric_col=is_numeric)
    if not is_numeric:
        return cleaned_raw, raw_score, raw_txt

    if cleaned_raw and raw_score >= 0.48 and re.fullmatch(r"[+-]?\d+(?:\.\d+)?", cleaned_raw):
        return cleaned_raw, raw_score, raw_txt

    # Constrained numeric CTC decode on v3 ONNX logits to disambiguate open-top pen 4 (read as U/u)
    if HAS_RAPIDOCR_V3 and getattr(ocr, "text_rec", None) is not None and getattr(ocr.text_rec, "session", None) is not None:
        try:
            global _NUMERIC_MASK, _CHAR_LIST
            chars = ocr.text_rec.postprocess_op.character
            if _NUMERIC_MASK is None or _CHAR_LIST is None or len(_CHAR_LIST) != len(chars):
                _CHAR_LIST = chars
                allowed = {"0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "."}
                _NUMERIC_MASK = np.array([1.0 if c in allowed else 0.0 for c in chars], dtype=np.float32)

            norm_img = ocr.text_rec.resize_norm_img(
                padded_bgr,
                max_wh_ratio=padded_bgr.shape[1] / max(1.0, float(padded_bgr.shape[0])),
            )
            preds = ocr.text_rec.session(norm_img[None, ...])[0]
            blank_probs = preds[:, 0]
            digit_masked = preds * _NUMERIC_MASK[None, :]
            digit_idxs = digit_masked.argmax(axis=1)
            digit_probs = digit_masked.max(axis=1)

            out_chars, out_probs = [], []
            prev = 0
            for t_idx in range(len(blank_probs)):
                if float(blank_probs[t_idx]) >= 0.45:
                    prev = 0
                    continue
                idx_val = int(digit_idxs[t_idx])
                prob_val = float(digit_probs[t_idx])
                if idx_val != 0 and idx_val != prev and prob_val >= 0.002:
                    out_chars.append(chars[idx_val])
                    out_probs.append(prob_val)
                    prev = idx_val

            ctc_txt = "".join(out_chars).strip(".")
            ctc_conf = (sum(out_probs) / len(out_probs)) if out_probs else 0.0
            ctc_max = max(out_probs) if out_probs else 0.0
            # Require real digit evidence (>= 0.14 avg and >= 0.08 peak) so ambiguous cursive strokes flag for quick check
            if ctc_txt and re.fullmatch(r"\d+(?:\.\d+)?", ctc_txt) and ctc_conf >= 0.14 and ctc_max >= 0.08:
                return ctc_txt, ctc_conf, raw_txt
        except Exception:
            pass

    if cleaned_raw and raw_score >= 0.35 and re.fullmatch(r"[+-]?\d+(?:\.\d+)?", cleaned_raw):
        return cleaned_raw, raw_score, raw_txt

    return "", 0.0, raw_txt


def load_image_bgr(image_path):
    im = ImageOps.exif_transpose(Image.open(image_path)).convert("RGB")
    return cv2.cvtColor(np.array(im), cv2.COLOR_RGB2BGR)


def parse_detections_v3(res):
    items = []
    if not res or res.boxes is None or not res.txts:
        return items
    scores = res.scores if res.scores else [0.0] * len(res.txts)
    for box, text, score in zip(res.boxes, res.txts, scores):
        xs = [float(p[0]) for p in box]
        ys = [float(p[1]) for p in box]
        x1, x2 = min(xs), max(xs)
        y1, y2 = min(ys), max(ys)
        items.append({
            "x1": x1, "y1": y1, "x2": x2, "y2": y2,
            "cx": (x1 + x2) / 2.0, "cy": (y1 + y2) / 2.0,
            "w": x2 - x1, "h": y2 - y1,
            "text": str(text or "").strip(),
            "score": float(score or 0.0),
        })
    return items


def parse_detections_old(ocr_raw):
    items = []
    for entry in (ocr_raw or []):
        box, text, score = entry
        xs = [float(p[0]) for p in box]
        ys = [float(p[1]) for p in box]
        x1, x2 = min(xs), max(xs)
        y1, y2 = min(ys), max(ys)
        items.append({
            "x1": x1, "y1": y1, "x2": x2, "y2": y2,
            "cx": (x1 + x2) / 2.0, "cy": (y1 + y2) / 2.0,
            "w": x2 - x1, "h": y2 - y1,
            "text": str(text or "").strip(),
            "score": float(score or 0.0),
        })
    return items


def find_best_match(items, target_str, min_y=0, max_y=99999):
    t_norm = norm_str(target_str)
    if not t_norm or len(t_norm) < 2:
        return None
    best = None
    best_score = 0.0
    for it in items:
        if it["cy"] < min_y or it["cy"] > max_y:
            continue
        i_norm = norm_str(it["text"])
        if not i_norm:
            continue
        if t_norm == i_norm:
            return it
        if len(t_norm) >= 4 and (t_norm in i_norm or i_norm in t_norm):
            ratio = min(len(t_norm), len(i_norm)) / max(len(t_norm), len(i_norm))
            if ratio > best_score and ratio >= 0.55:
                best_score = ratio
                best = it
    return best


def analyze_scan(image_path, context):
    img = load_image_bgr(image_path)
    img_h, img_w = img.shape[:2]
    ocr = get_ocr()

    if HAS_RAPIDOCR_V3:
        full_res = ocr(img, use_det=True, use_cls=True, use_rec=True)
        items = parse_detections_v3(full_res)
    else:
        raw_res, _ = ocr(img)
        items = parse_detections_old(raw_res)

    columns = context.get("columns") or []
    fixed_rows = context.get("fixedRows") or []
    empty_col_keys = context.get("emptyColKeys") or []
    fixed_col_keys = [c.get("key") for c in columns if c.get("key") and c.get("key") not in empty_col_keys]
    already_filled_table = set(context.get("alreadyFilledTableCells") or [])
    exact_table_cell_map = context.get("exactTableCellMap") or {}
    exact_rep_cells = context.get("exactRepeatabilityCells") or []

    expected_format_no = str(context.get("formatNo") or "").strip()
    template_name = str(context.get("templateName") or context.get("instrument") or "").strip()

    # 1. Detect Same-to-Same Format Match
    matched_format_no = ""
    for it in items:
        if re.search(r"arcl[/\\][a-z0-9]+[/\\]\d+", it["text"], re.I):
            matched_format_no = it["text"]
            break

    format_no_matched = bool(
        expected_format_no
        and matched_format_no
        and norm_str(expected_format_no).replace("0", "o") == norm_str(matched_format_no).replace("0", "o")
    )

    title_matched = False
    if template_name:
        tmpl_words = [w for w in re.split(r"[^a-zA-Z0-9]+", template_name.lower()) if len(w) > 3]
        full_lower = " ".join(it["text"].lower() for it in items[:25])
        if tmpl_words and sum(1 for w in tmpl_words if w in full_lower) >= max(1, len(tmpl_words) // 2):
            title_matched = True

    # 2. Match table column headers inside table header band
    header_hits = {}
    table_header_y = None
    for col in columns:
        key = col.get("key")
        label = str(col.get("label") or key or "")
        words = [w for w in re.split(r"[^a-zA-Z0-9]+", label) if len(w) >= 3]
        candidates = [label] + ([" ".join(words[:2])] if len(words) >= 2 else []) + words[:1]
        for cand in candidates:
            hit = find_best_match(items, cand, min_y=img_h * 0.25, max_y=img_h * 0.65)
            if hit:
                header_hits[key] = hit
                if table_header_y is None or hit["y2"] > table_header_y:
                    table_header_y = hit["y2"]
                break

    obs_min_y = (table_header_y + 10) if table_header_y else img_h * 0.42
    rep_anchor = find_best_match(items, "Repeatability", min_y=img_h * 0.55, max_y=img_h * 0.92)
    cal_by_anchor = find_best_match(items, "Calibration By", min_y=img_h * 0.72, max_y=img_h * 0.98)
    obs_max_y = (rep_anchor["y1"] - 25) if rep_anchor else ((cal_by_anchor["y1"] - 40) if cal_by_anchor else img_h * 0.76)

    # 3. Match each pre-printed fixed row anchor on the Y axis
    row_anchors_y = []
    matched_row_count = 0
    for r_idx, f_row in enumerate(fixed_rows):
        matched_y = None
        ys_for_row = []
        xs_for_row = []
        for f_key in fixed_col_keys:
            val = str((f_row or {}).get(f_key) or "").strip()
            if not val:
                continue
            hit = find_best_match(items, val, min_y=obs_min_y - 12, max_y=obs_max_y + 12)
            if hit:
                ys_for_row.append(hit["cy"])
                xs_for_row.append((hit["cx"], hit["cy"]))
        if ys_for_row:
            matched_y = float(np.median(ys_for_row))
            matched_row_count += 1
        row_anchors_y.append({"rowIdx": r_idx, "cy": matched_y, "pts": xs_for_row})

    valid_pts = [(r["rowIdx"], r["cy"]) for r in row_anchors_y if r["cy"] is not None]
    row_step = 58.0
    if len(valid_pts) >= 2:
        diffs = [
            (valid_pts[k + 1][1] - valid_pts[k][1]) / max(1, valid_pts[k + 1][0] - valid_pts[k][0])
            for k in range(len(valid_pts) - 1)
        ]
        row_step = float(np.median(diffs))
        base_idx, base_y = valid_pts[0]
        for r in row_anchors_y:
            if r["cy"] is None:
                r["cy"] = base_y + (r["rowIdx"] - base_idx) * row_step

    slope_dy_dx = 0.0
    slopes = []
    for r in row_anchors_y:
        if len(r["pts"]) >= 2:
            pts_sorted = sorted(r["pts"], key=lambda p: p[0])
            dx = pts_sorted[-1][0] - pts_sorted[0][0]
            if dx > 120:
                slopes.append((pts_sorted[-1][1] - pts_sorted[0][1]) / dx)
    if slopes:
        slope_dy_dx = float(np.median(slopes))
    avg_fixed_x = float(np.mean([p[0] for r in row_anchors_y for p in r["pts"]])) if valid_pts else img_w * 0.35

    # 4. Compute X bounds ONLY for EMPTY target columns (NEVER fixed columns!)
    col_x_bounds = {}
    right_margin = img_w - 20
    left_margin = img_w * 0.06
    known_headers = sorted(
        [(col["key"], header_hits[col["key"]]["cx"], header_hits[col["key"]]["x1"], header_hits[col["key"]]["x2"])
         for col in columns if col.get("key") in header_hits],
        key=lambda t: t[1],
    )

    for idx_k, (ckey, cx, hx1, hx2) in enumerate(known_headers):
        prev_right = (known_headers[idx_k - 1][1] + cx) / 2.0 if idx_k > 0 else left_margin
        if idx_k > 0 and known_headers[idx_k - 1][0] not in empty_col_keys:
            prev_col_key = known_headers[idx_k - 1][0]
            prev_max_x = known_headers[idx_k - 1][3]
            for f_row in fixed_rows:
                val = str((f_row or {}).get(prev_col_key) or "").strip()
                hit = find_best_match(items, val, min_y=obs_min_y - 12, max_y=obs_max_y + 12)
                if hit and hit["x2"] > prev_max_x:
                    prev_max_x = hit["x2"]
            prev_right = max(prev_right, min(hx1 - 20, prev_max_x + 35))
        next_left = (cx + known_headers[idx_k + 1][1]) / 2.0 if idx_k + 1 < len(known_headers) else right_margin
        col_x_bounds[ckey] = (max(0, int(prev_right)), min(img_w, int(next_left)))

    if empty_col_keys and all(k not in col_x_bounds for k in empty_col_keys):
        start_x = int(img_w * 0.62)
        span = max(80, (int(right_margin) - start_x) // max(1, len(empty_col_keys)))
        for idx_e, ek in enumerate(empty_col_keys):
            col_x_bounds[ek] = (start_x + idx_e * span, min(img_w, start_x + (idx_e + 1) * span))

    # 5. Extract pen-written data strictly from UNFILLED table cells
    extracted_readings = []
    extracted_exact_values = {}
    cell_previews = []
    skipped_already_filled = []
    needs_review_count = 0
    half_h = max(22.0, min(38.0, row_step * 0.54))

    for r in row_anchors_y:
        r_idx = r["rowIdx"]
        row_obj = {}
        if r["cy"] is None:
            extracted_readings.append(row_obj)
            continue

        row_label = " | ".join(str((fixed_rows[r_idx] or {}).get(fk) or "") for fk in fixed_col_keys[:2]).strip(" |")
        for ckey in empty_col_keys:
            if f"{r_idx}:{ckey}" in already_filled_table:
                skipped_already_filled.append(f"Row {r_idx + 1} ({ckey})")
                continue
            if ckey not in col_x_bounds:
                continue

            cx1, cx2 = col_x_bounds[ckey]
            cell_cx = (cx1 + cx2) / 2.0
            adj_cy = r["cy"] + slope_dy_dx * (cell_cx - avg_fixed_x)
            ry1 = max(0, int(adj_cy - half_h))
            ry2 = min(img_h, int(adj_cy + half_h))

            col_meta = next((c for c in columns if c.get("key") == ckey), {})
            is_num_col = col_meta.get("type", "number") != "text"

            cell_bgr = img[ry1:ry2, cx1:cx2]
            preview_url, padded_ink, has_ink = strip_cell_borders_and_crop_ink(cell_bgr)

            val = ""
            conf = 0.0
            raw_guess = ""

            # Prefer high-res cleaned cell crop + constrained numeric CTC recognition
            if padded_ink is not None:
                val, conf, raw_guess = recognize_numeric_cell(ocr, padded_ink, is_numeric=is_num_col)

            # Fallback to full-page OCR hit inside cell bounds if clean crop missed
            if not val:
                cell_hits = sorted(
                    [
                        it for it in items
                        if cx1 <= it["cx"] <= cx2 and (ry1 - 4) <= it["cy"] <= (ry2 + 4) and it["score"] >= 0.45
                    ],
                    key=lambda h: h["cx"],
                )
                if cell_hits:
                    raw_joined = " ".join(h["text"] for h in cell_hits)
                    if not raw_guess:
                        raw_guess = raw_joined
                    cand = clean_numeric_token(raw_joined, is_numeric_col=is_num_col)
                    if cand:
                        val = cand
                        conf = float(np.mean([h["score"] for h in cell_hits]))

            cell_needs_review = bool(has_ink and not val)
            if cell_needs_review:
                needs_review_count += 1

            if val:
                row_obj[ckey] = val
                exact_cell_key = exact_table_cell_map.get(f"{r_idx}:{ckey}")
                if exact_cell_key:
                    extracted_exact_values[exact_cell_key] = val

            if preview_url:
                cell_previews.append({
                    "rowIdx": r_idx,
                    "colKey": ckey,
                    "rowLabel": row_label or f"Row {r_idx + 1}",
                    "colLabel": col_meta.get("label") or ckey,
                    "extractedValue": val,
                    "rawGuess": raw_guess,
                    "hasInk": has_ink,
                    "needsReview": cell_needs_review,
                    "confidence": round(conf, 2),
                    "cropDataUrl": preview_url,
                })

        extracted_readings.append(row_obj)

    # 6. Extract Repeatability MU (5 pen-written boxes to the right of anchor)
    repeatability_readings = ["", "", "", "", ""]
    repeatability_previews = []
    if rep_anchor:
        rep_y1 = max(0, int(rep_anchor["y1"] - 28))
        rep_y2 = min(img_h, int(rep_anchor["y2"] + 34))
        rep_band_x0 = min(img_w - 220, int(rep_anchor["x2"] + 40))
        rep_band_gray = cv2.cvtColor(img[rep_y1:rep_y2, rep_band_x0 : img_w - 2], cv2.COLOR_BGR2GRAY)
        v_proj = (rep_band_gray < 170).mean(axis=0)
        div_xs = [rep_band_x0 + i for i, val_p in enumerate(v_proj) if val_p > 0.45]
        clustered_divs = []
        for x in div_xs:
            if not clustered_divs or x - clustered_divs[-1][-1] > 25:
                clustered_divs.append([x])
            else:
                clustered_divs[-1].append(x)
        div_centers = [int(np.mean(g)) for g in clustered_divs]

        if len(div_centers) >= 6:
            box_ranges = [(div_centers[i], div_centers[i + 1]) for i in range(5)]
        elif len(div_centers) >= 5:
            last_w = max(140, div_centers[-1] - div_centers[-2]) if len(div_centers) >= 2 else int((img_w - rep_band_x0) / 5)
            box_ranges = [(div_centers[i], div_centers[i + 1]) for i in range(4)] + [
                (div_centers[4], min(img_w - 4, div_centers[4] + last_w + 55))
            ]
        else:
            rep_start_x = min(img_w - 200, int(rep_anchor["x2"] + 70))
            box_w = (img_w - 10 - rep_start_x) / 5.0
            box_ranges = [(int(rep_start_x + i * box_w), int(rep_start_x + (i + 1) * box_w)) for i in range(5)]

        for b_idx, (bx1, bx2) in enumerate(box_ranges):
            rep_meta = exact_rep_cells[b_idx] if b_idx < len(exact_rep_cells) else {}
            if rep_meta and not rep_meta.get("isEmpty", True):
                repeatability_readings[b_idx] = ""
                skipped_already_filled.append(f"Repeatability R{b_idx + 1}")
                continue

            box_bgr = img[rep_y1:rep_y2, bx1:bx2]
            preview_url, padded_ink, has_ink = strip_cell_borders_and_crop_ink(box_bgr)

            val = ""
            conf = 0.0
            raw_guess = ""
            if padded_ink is not None:
                val, conf, raw_guess = recognize_numeric_cell(ocr, padded_ink, is_numeric=True)

            if not val:
                rep_hits = [
                    it for it in items
                    if bx1 <= it["cx"] <= bx2 and rep_y1 <= it["cy"] <= rep_y2 and it["score"] >= 0.45
                ]
                if rep_hits:
                    raw_txt = " ".join(h["text"] for h in rep_hits)
                    if not raw_guess:
                        raw_guess = raw_txt
                    cand = clean_numeric_token(raw_txt, is_numeric_col=True)
                    if cand:
                        val = cand
                        conf = float(np.mean([h["score"] for h in rep_hits]))

            cell_needs_review = bool(has_ink and not val)
            if cell_needs_review:
                needs_review_count += 1

            repeatability_readings[b_idx] = val
            if val and rep_meta.get("cellKey"):
                extracted_exact_values[rep_meta["cellKey"]] = val

            if preview_url:
                repeatability_previews.append({
                    "idx": b_idx,
                    "label": f"R{b_idx + 1}",
                    "extractedValue": val,
                    "rawGuess": raw_guess,
                    "hasInk": has_ink,
                    "needsReview": cell_needs_review,
                    "confidence": round(conf, 2),
                    "cropDataUrl": preview_url,
                })

    raw_text = "\n".join(it["text"] for it in sorted(items, key=lambda x: (round(x["cy"] / 20), x["cx"])))

    return {
        "ok": True,
        "engine": "RapidOCR v3 PP-OCRv6 (Format-Matched Pen Extractor)",
        "formatMatch": {
            "matched": bool(format_no_matched or title_matched or matched_row_count >= 2),
            "formatNo": matched_format_no or expected_format_no,
            "matchedHeaders": list(header_hits.keys()),
            "matchedRows": matched_row_count,
            "fixedColumnsProtected": fixed_col_keys,
            "emptyTargetColumns": empty_col_keys,
            "alreadyFilledSkipped": skipped_already_filled,
            "needsReviewCount": needs_review_count,
        },
        "metadata": {},
        "readings": extracted_readings,
        "repeatabilityReadings": repeatability_readings,
        "exactSheetValues": extracted_exact_values,
        "cellPreviews": cell_previews,
        "repeatabilityPreviews": repeatability_previews,
        "rawText": raw_text,
    }


def main():
    if len(sys.argv) < 2:
        print(json.dumps({"ok": False, "error": "Image path required"}))
        return
    image_path = sys.argv[1]
    ctx = {}
    if len(sys.argv) >= 3 and sys.argv[2] and os.path.exists(sys.argv[2]):
        try:
            with open(sys.argv[2], "r", encoding="utf-8") as f:
                ctx = json.load(f)
        except Exception:
            ctx = {}
    try:
        out = analyze_scan(image_path, ctx)
        print(json.dumps(out, ensure_ascii=False))
    except Exception as exc:
        print(json.dumps({"ok": False, "error": str(exc)}))


if __name__ == "__main__":
    main()
