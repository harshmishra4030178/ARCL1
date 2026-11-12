#!/usr/bin/env python3
"""
ARCL Metrological PDF Observation Format Parser & Auto-Compressor
Extracts Equipment details, parameters, and reading table columns from an uploaded PDF.
Compresses large embedded raster images and minimizes PDF byte size.
Outputs JSON to stdout.
"""

import sys
import os
import json
import re

# Redirect pymupdf layout messages to stderr
os.environ["PYMUPDF_MESSAGE"] = "fd:2"

try:
    import pymupdf
except ImportError:
    import fitz as pymupdf

def clean_text(s):
    if not s:
        return ""
    text = re.sub(r'\s+', ' ', str(s)).strip()
    text = text.replace('\ufffd', '±')
    text = re.sub(r'\+\s*/\s*-', '±', text)
    return text

def detect_equipment_category(text):
    t = text.lower()
    if any(w in t for w in ["rpm", "tachometer", "centrifuge", "speed", "rotating", "motor"]):
        return "Speed / RPM"
    if any(w in t for w in ["flakiness", "thickness gauge", "feeler", "radius gauge", "sieve", "caliper", "vernier", "micrometer", "dial", "height gauge", "depth"]):
        return "Dimensional"
    if any(w in t for w in ["kn", "force", "compression", "tensile", "ctm", "utm", "proving ring"]):
        return "Force"
    if any(w in t for w in ["bar", "psi", "kpa", "mpa", "pressure gauge", "pressure", "vacuum", "manometer"]):
        return "Pressure"
    if any(w in t for w in ["mm", "micron"]):
        return "Dimensional"
    if any(w in t for w in ["°c", "temp", "temperature", "thermometer", "rtd", "thermocouple", "oven", "furnace", "bath"]):
        return "Thermal"
    if any(w in t for w in ["gram", "kg", "mg", "weighing", "balance", "weight", "mass"]):
        return "Mass"
    if any(w in t for w in ["volt", "ampere", "ohm", "multimeter", "current", "voltage", "resistance"]):
        return "Electrical"
    return "General Metrology"

def compress_pdf_document(doc, output_path=None, max_dim=1400, jpeg_quality=68):
    """
    Downsamples large embedded images, strips unused objects,
    and applies deflate stream compression to produce an ultra-compact PDF.
    """
    try:
        from PIL import Image
        import io

        for page in doc:
            for img_info in page.get_images(full=True):
                xref = img_info[0]
                try:
                    base_image = doc.extract_image(xref)
                    if not base_image or not base_image.get("image"):
                        continue
                    img_bytes = base_image["image"]
                    if len(img_bytes) < 50000:
                        continue
                    im = Image.open(io.BytesIO(img_bytes))
                    orig_w, orig_h = im.size
                    if orig_w > max_dim or orig_h > max_dim or len(img_bytes) > 150000:
                        im.thumbnail((max_dim, max_dim), Image.Resampling.LANCZOS)
                        if im.mode in ("RGBA", "P"):
                            im = im.convert("RGB")
                        buf = io.BytesIO()
                        im.save(buf, format="JPEG", quality=jpeg_quality, optimize=True)
                        new_bytes = buf.getvalue()
                        if len(new_bytes) < len(img_bytes):
                            doc.update_stream(xref, new_bytes)
                except Exception:
                    pass
    except Exception:
        pass

    if output_path:
        doc.save(
            output_path,
            garbage=4,
            deflate=True,
            clean=True,
            deflate_images=True,
            deflate_fonts=True,
        )
    return doc

def extract_spatial_table(doc):
    """
    Extracts table structure directly from text block spatial coordinates
    when find_tables() finds no vector table borders.
    100% faithful to the uploaded PDF, no dummy/fake rows.
    """
    if len(doc) == 0:
        return [], []
    page = doc[0]
    words = page.get_text('words')
    if not words:
        return [], []

    # 1. Locate start of observation section
    obs_start_y = None
    for w in sorted(words, key=lambda x: (x[1], x[0])):
        txt = w[4].lower()
        if ('7.' in txt or 'observ' in txt) and w[0] < 220 and w[1] > 180:
            obs_start_y = w[1]
            break

    if obs_start_y is None:
        for w in words:
            if 'observ' in w[4].lower() and w[1] > 150:
                obs_start_y = w[1]
                break

    if obs_start_y is None:
        # Search for any line containing common table column headers
        for w in words:
            if w[1] > 180 and any(h in w[4].lower() for h in ['description', 'parameter', 'specification', 'nominal', 'measured', 'speed', 'load', 'trial', 'actual', 'reading', 'requirement']):
                obs_start_y = w[1] - 8
                break

    if obs_start_y is None:
        obs_start_y = 200

    # 2. Locate end of observation table
    obs_end_y = 99999
    for w in words:
        if w[1] > obs_start_y + 35:
            txt = w[4].lower()
            if any(k in txt for k in ['calibration by', 'reviewed', 'authorized', 'signature', 'page no', 'calibrated by']):
                if w[1] < obs_end_y:
                    obs_end_y = w[1]

    if obs_end_y == 99999:
        obs_end_y = page.rect.height - 35

    # Filter words strictly in observation table area
    table_words = [w for w in words if obs_start_y + 8 <= w[1] < obs_end_y]
    if not table_words:
        return [], []

    # Cluster words into horizontal lines
    lines = []
    for w in sorted(table_words, key=lambda x: x[1]):
        matched = False
        for l in lines:
            if abs(l['y'] - w[1]) < 7:
                l['words'].append(w)
                l['y'] = (l['y'] * len(l['words']) + w[1]) / (len(l['words']) + 1)
                matched = True
                break
        if not matched:
            lines.append({'y': w[1], 'words': [w]})

    # Find the header row
    header_line_idx = -1
    for idx, l in enumerate(lines[:6]):
        line_text = " ".join(w[4].lower() for w in l['words'])
        if any(h in line_text for h in ['description', 'parameter', 'observation', 'requirement', 'specification', 'gap size', 'measured', 'speed', 'nominal', 'load']):
            header_line_idx = idx
            break

    if header_line_idx == -1:
        header_line_idx = 0

    header_line = lines[header_line_idx]
    header_words = list(header_line['words'])
    data_start_idx = header_line_idx + 1

    # Multi-line header consolidation (e.g. "As Per IS 2386-(part-1)-1993" or "Speed of" + "EcentricShaft")
    last_header_y = header_line['y']
    while data_start_idx < len(lines):
        next_line = lines[data_start_idx]
        next_text = " ".join(w[4].lower() for w in next_line['words'])
        
        # Stop at footers
        if any(term in next_text for term in ['repeatability', 'calibration by', 'reviewed &', 'authorized by', 'for mu', 'page no']):
            break
        
        # Must be close vertically to the header (wrapped text cell)
        y_diff = next_line['y'] - last_header_y
        if y_diff > 25:
            break
            
        # Must not contain measurements/data values (e.g. 200 + 2 mm, 63-50, etc.)
        if bool(re.search(r'\b\d+(\.\d+)?\b', next_text)) or any(sym in next_text for sym in ['±', '+', 't ']):
            break

        # Check continuation triggers: previous ended in preposition or next has header terms
        is_cont = any(k in next_text for k in ['standard', 'shaft', 'ecentric', 'per', 'machine', 'master', '(rpm)', '(mm)', '(kn)', '(bar)'])
        prev_has_of = any(w[4].lower() in ['of', 'for', 'in', 'as', 'per'] for w in header_words)
        
        if is_cont or prev_has_of:
            header_words.extend(next_line['words'])
            last_header_y = next_line['y']
            data_start_idx += 1
        else:
            break

    # Group header words into distinct column centers
    header_words.sort(key=lambda w: w[0])
    col_clusters = []
    for w in header_words:
        matched = False
        for c in col_clusters:
            if abs(w[0] - c['max_x']) < 35 or abs(w[0] - c['center_x']) < 50:
                c['words'].append(w)
                c['min_x'] = min(c['min_x'], w[0])
                c['max_x'] = max(c['max_x'], w[2])
                c['center_x'] = (c['min_x'] + c['max_x']) / 2
                matched = True
                break
        if not matched:
            col_clusters.append({
                'min_x': w[0],
                'max_x': w[2],
                'center_x': (w[0] + w[2]) / 2,
                'words': [w]
            })

    col_clusters.sort(key=lambda c: c['min_x'])

    # Build column boundaries [ (min_x, max_x) ]
    columns = []
    seen_keys = set()
    for i, c in enumerate(col_clusters):
        c_words = sorted(c['words'], key=lambda w: (round(w[1]/8), w[0]))
        label = " ".join(w[4] for w in c_words)
        label = clean_text(label)

        left_bound = 0 if i == 0 else (col_clusters[i-1]['max_x'] + c['min_x']) / 2
        right_bound = 1000 if i == len(col_clusters) - 1 else (c['max_x'] + col_clusters[i+1]['min_x']) / 2

        lbl_lower = label.lower()
        col_type = "text"
        unit = ""
        if any(k in lbl_lower for k in ['sr. no', 'sr.no', 's.no', 'sl.no']):
            key = "sNo"
            col_type = "text"
        elif any(k in lbl_lower for k in ['observ', 'measured', 'reading', 'actual']):
            col_type = "number"
            key = "observation" if "observ" in lbl_lower else "measured"
        elif any(k in lbl_lower for k in ['require', 'specification', 'spec', 'tolerance']):
            col_type = "text"
            key = "requirement" if "require" in lbl_lower else "specification"
        elif "desc" in lbl_lower:
            key = "description"
            col_type = "text"
        elif "param" in lbl_lower:
            key = "parameter"
            col_type = "text"
        elif "speed" in lbl_lower or "rpm" in lbl_lower:
            key = "speed"
            col_type = "number"
            unit = "rpm"
        else:
            clean_lbl = re.sub(r'[^a-zA-Z0-9]', '_', label.lower()).strip('_')
            key = f"col_{i}_{clean_lbl[:15]}" if clean_lbl else f"col_{i}"

        if "mm" in lbl_lower:
            unit = "mm"
        elif "rpm" in lbl_lower:
            unit = "rpm"
        elif "kn" in lbl_lower:
            unit = "kN"
        elif "bar" in lbl_lower:
            unit = "bar"

        uniq_key = key
        cnt = 1
        while uniq_key in seen_keys:
            cnt += 1
            uniq_key = f"{key}_{cnt}"
        seen_keys.add(uniq_key)

        columns.append({
            'key': uniq_key,
            'label': label,
            'type': col_type,
            'unit': unit,
            'minWidth': '75px' if uniq_key.startswith('sNo') else '130px',
            '_left': left_bound,
            '_right': right_bound
        })

    # Find the primary key column (Parameter or Specification or Col 0)
    primary_col_idx = 0
    for idx, c in enumerate(columns):
        if c['key'] in ['parameter', 'specification', 'speed']:
            primary_col_idx = idx
            break
    if primary_col_idx == 0 and len(columns) > 1 and columns[0]['key'] == 'description':
        primary_col_idx = 1

    primary_col = columns[primary_col_idx]

    # Find primary rows from words in primary column
    raw_lines = lines[data_start_idx:]
    primary_lines = []
    for l in raw_lines:
        l_text = " ".join(w[4].lower() for w in l['words'])
        if any(term in l_text for term in ['repeatability', 'calibration by', 'reviewed &', 'authorized by', 'for mu']):
            break
        p_words = [w for w in l['words'] if primary_col['_left'] <= (w[0]+w[2])/2 < primary_col['_right']]
        if p_words:
            primary_lines.append({
                'y': l['y'],
                'text': clean_text(" ".join(w[4] for w in sorted(p_words, key=lambda w: w[0])))
            })

    data_rows = []
    if primary_lines:
        # Build lines for each other column
        other_col_lines = {}
        for c_idx, col in enumerate(columns):
            if c_idx == primary_col_idx:
                continue
            col_lines = []
            for l in raw_lines:
                l_text = " ".join(w[4].lower() for w in l['words'])
                if any(term in l_text for term in ['repeatability', 'calibration by', 'reviewed &', 'authorized by', 'for mu']):
                    break
                cw = [w for w in l['words'] if col['_left'] <= (w[0]+w[2])/2 < col['_right']]
                if cw:
                    col_lines.append({
                        'y': l['y'],
                        'text': clean_text(" ".join(w[4] for w in sorted(cw, key=lambda w: w[0])))
                    })
            other_col_lines[col['key']] = col_lines

        # For each primary line, find the closest text in other columns
        for p_idx, pl in enumerate(primary_lines):
            p_y = pl['y']
            row_dict = {primary_col['key']: pl['text']}

            for c_idx, col in enumerate(columns):
                if c_idx == primary_col_idx:
                    continue
                k = col['key']
                candidates = other_col_lines.get(k, [])
                if not candidates:
                    row_dict[k] = ""
                    continue

                if k == 'description':
                    closest_desc = None
                    min_d = 999
                    for cand in candidates:
                        d = abs(cand['y'] - p_y)
                        if d < min_d:
                            min_d = d
                            closest_desc = cand['text']
                    row_dict[k] = closest_desc if min_d < 45 else ""
                else:
                    closest_text = ""
                    min_d = 999
                    for cand in candidates:
                        d = abs(cand['y'] - p_y)
                        if d < 18 and d < min_d:
                            min_d = d
                            closest_text = cand['text']
                    row_dict[k] = closest_text

            data_rows.append(row_dict)

        # Forward-fill and backward-fill Description column for row spans
        if 'description' in [c['key'] for c in columns]:
            for i in range(1, len(data_rows)):
                if not data_rows[i]['description'] and data_rows[i-1]['description']:
                    data_rows[i]['description'] = data_rows[i-1]['description']
            if data_rows and not data_rows[0]['description'] and len(data_rows) > 1 and data_rows[1]['description']:
                data_rows[0]['description'] = data_rows[1]['description']
    else:
        # Direct line clustering fallback
        for l in raw_lines:
            l_text = " ".join(w[4].lower() for w in l['words'])
            if any(term in l_text for term in ['repeatability', 'calibration by', 'reviewed &', 'authorized by', 'for mu']):
                break
            row_dict = {}
            has_val = False
            for col in columns:
                cw = [w for w in l['words'] if col['_left'] <= (w[0]+w[2])/2 < col['_right']]
                cw.sort(key=lambda w: w[0])
                txt = clean_text(" ".join(w[4] for w in cw))
                if txt:
                    has_val = True
                row_dict[col['key']] = txt
            if has_val:
                data_rows.append(row_dict)

    for col in columns:
        col.pop('_left', None)
        col.pop('_right', None)

    # If the PDF table is a blank observation format ready for laboratory input, provide 5 clean rows
    if not data_rows and columns:
        data_rows = [{c['key']: "" for c in columns} for _ in range(5)]

    return columns, data_rows

def parse_pdf_observation_format(pdf_path, compressed_output_path=None):
    if not os.path.exists(pdf_path):
        return {"error": f"File not found: {pdf_path}"}

    orig_size = os.path.getsize(pdf_path) if os.path.exists(pdf_path) else 0

    doc = pymupdf.open(pdf_path)
    full_text = ""
    for page in doc:
        full_text += page.get_text() + "\n"

    category = detect_equipment_category(full_text)

    # 1. Detect Instrument / Equipment Name
    inst_name = ""
    m_obs = re.search(r'Observation\s+of\s+([A-Za-z0-9\s\-\(\)\/]{3,60})', full_text, re.IGNORECASE)
    if m_obs:
        candidate = clean_text(m_obs.group(1))
        candidate = re.split(r'(?:\d{2}|Format|Issue|ARCL|Page|\n)', candidate)[0].strip()
        if len(candidate) > 2:
            inst_name = candidate

    if not inst_name:
        m_inst = re.search(r'(?:Instrument Name|Equipment Name|Description of Equipment)\s*[:\-–\s]+\s*([A-Za-z0-9\s\-\(\)\/]{3,50})', full_text, re.IGNORECASE)
        if m_inst:
            candidate = clean_text(m_inst.group(1))
            candidate = re.sub(r'^(?:Instrument Name|Equipment Name|Description of Equipment)\s*[:\-–\s]*', '', candidate, flags=re.IGNORECASE).strip()
            candidate = re.split(r'(?:Make|Model|Sr\.|Range|Least|Temp|Date|1\.|2\.|3\.|4\.)', candidate)[0].strip()
            if len(candidate) > 2:
                inst_name = candidate

    if not inst_name:
        for line in full_text.split('\n')[:12]:
            line_c = clean_text(line)
            if any(k in line_c.lower() for k in ["flakiness", "thickness", "compression testing", "universal testing", "micrometer", "caliper", "pressure gauge", "balance", "indicator"]):
                inst_name = line_c
                break

    if not inst_name:
        inst_name = f"{category} Calibration Equipment"

    # 2. Detect Range & Least Count
    range_val = ""
    m_range = re.search(r'Range(?:\s*\([^)]+\))?\s*(?::-|:|-|–)\s*([0-9][^\n\r]{0,35})', full_text, re.IGNORECASE)
    if m_range:
        cand_r = clean_text(m_range.group(1))
        cand_r = re.split(r'(?:Location|Condition|Environmental|Temp|RH|Method|Reference|Details)', cand_r, flags=re.IGNORECASE)[0].strip()
        if cand_r and not re.fullmatch(r'[0-5]', cand_r):
            range_val = cand_r

    least_count = ""
    m_lc = re.search(r'(?:Least Count|L\.?\s*C\.?|Resolution)\s*(?::-|:|-|–)\s*([0-9][^\n\r]{0,25})', full_text, re.IGNORECASE)
    if m_lc:
        cand_lc = clean_text(m_lc.group(1))
        if cand_lc and not re.fullmatch(r'[0-5]', cand_lc):
            least_count = cand_lc

    location_val = ""
    m_loc = re.search(r'Location\s*(?::-|:|-|–)\s*([^\n\r]{1,60})', full_text, re.IGNORECASE)
    if m_loc:
        cand_loc = re.split(r'(?:Condition|Environmental|Temp|RH|Method|Reference|Details|\d+\.)', clean_text(m_loc.group(1)), flags=re.IGNORECASE)[0].strip()
        if cand_loc and not re.fullmatch(r'(?:Location|[:\-]+)', cand_loc, re.IGNORECASE):
            location_val = cand_loc

    # 3. Detect Environmental Condition (Temp & Humidity)
    temp_val = "25.0 ± 2°C"
    m_temp = re.search(r'Temp\.?\s*[:\-–\s]*\s*(\([0-9\.\±\+\-\s]+\)\s*(?:°C|C)?|[0-9\.]+\s*(?:±\s*[0-9\.]+)?\s*(?:°C|C)?)', full_text, re.IGNORECASE)
    if m_temp:
        temp_val = clean_text(m_temp.group(1)).strip()

    rh_val = "50 ± 10% RH"
    m_rh = re.search(r'RH\s*[:\-–\s]*\s*(\([0-9\.\-\s]+\)\s*%|[0-9\.\-]+\s*(?:-\s*[0-9\.]+)?\s*%)', full_text, re.IGNORECASE)
    if m_rh:
        rh_val = clean_text(m_rh.group(1)).strip()

    # 4. Detect Format Metadata, Reference Standard, Master Equipments
    format_no = ""
    m_fmt = re.search(r'(ARCL\/OB\/[0-9A-Za-z]+)', full_text)
    if m_fmt:
        format_no = m_fmt.group(1)

    format_issue_no = "01"
    m_fiss = re.search(r'Format\s*Issue\s*No\.?\s*[:\-–\s]*\s*([0-9]+)', full_text, re.IGNORECASE)
    if m_fiss:
        format_issue_no = m_fiss.group(1)

    format_issue_date = ""
    m_fdate = re.search(r'Format\s*Issue\s*Date\.?\s*[:\-–\s]*\s*([0-9]{2}[\/\-][0-9]{2}[\/\-][0-9]{4})', full_text, re.IGNORECASE)
    if m_fdate:
        format_issue_date = m_fdate.group(1)

    calib_method = "ARCL-CP-STANDARD"
    m_cmeth = re.search(r'(ARCL\-CP\-[0-9A-Za-z]+)', full_text)
    if m_cmeth:
        calib_method = m_cmeth.group(1)

    ref_standard = "IS / ISO Metrology Standard"
    m_ref_line = re.search(r'Reference\s*Standard\s*[:\-–\s]*\s*([^\n\r]+)', full_text, re.IGNORECASE)
    if m_ref_line and clean_text(m_ref_line.group(1)):
        ref_standard = clean_text(m_ref_line.group(1))
    else:
        m_std = re.search(r'((?:IS|ISO|ASTM|DIN|IEC|NABL)[\s:\-]*[0-9]{2,}[^\n\r]{0,60})', full_text, re.IGNORECASE)
        if m_std:
            ref_standard = clean_text(m_std.group(1))

    master_desc = ""
    m_mst = re.search(r'(?:Digital Tachometer|Tachometer|Digital Vernier Caliper|Vernier Caliper|External Micrometer|Micrometer|Proving Ring|Load Cell|Pressure Calibrator|Dead Weight Tester|Standard Weights|Gauge Block|RTD Sensor|Thermocouple)', full_text, re.IGNORECASE)
    if m_mst:
        master_desc = clean_text(m_mst.group(0))

    master_id = ""
    m_mid = re.search(r'(ARCL\/(?!OB)[A-Z0-9]+\/[0-9]+)', full_text)
    if m_mid:
        master_id = m_mid.group(1)

    master_cert = ""
    master_due = ""
    master_trace = ""
    master_equipments = []

    # 5. Extract Tables cleanly (distinguishing Master Equipment Table vs Observation Table)
    detected_columns = []
    default_readings = []
    repeatability_readings = []

    sub_hdr_re = re.compile(
        r'^(?:1st|2nd|3rd|4th|5th|r\s*[1-5]|trial(?:\s*\d+)?|uuc|duc|master|reading(?:\s*\d+)?|obs|observed|measured|actual|od|id|depth|inc|increasing|dec|decreasing|up|down|warp|weft|left|right|top|mid|middle|bot|bottom|x|y|z|zero|mean|avg|average|error|std|r\([id]\))$',
        re.IGNORECASE,
    )

    def extract_col_unit(label):
        m_p = re.search(r'\((mm|cm|m|µm|um|km|kg|g|mg|kN|N|bar|psi|kPa|MPa|Pa|°C|C|F|rpm|%|Hz|V|mV|A|mA|Ω|s|sec|min|hr|ml|ltr)\)', label, re.IGNORECASE)
        if m_p:
            return m_p.group(1).strip()
        m_c = re.search(r',\s*(mm|kN|N|bar|psi|kPa|MPa|°C|rpm|%|µm|um|g|kg|mg)\s*$', label, re.IGNORECASE)
        if m_c:
            return m_c.group(1).strip()
        return ""

    for page_idx in range(len(doc)):
        page = doc[page_idx]
        table_finder = page.find_tables()
        tables = table_finder.tables if hasattr(table_finder, "tables") else []

        for tbl in tables:
            extracted_data = tbl.extract()
            if not extracted_data or len(extracted_data) < 2:
                continue

            # Check if this table is actually the Master Equipment table
            top_rows_text = " ".join(clean_text(c).lower() for r in extracted_data[:2] for c in r if clean_text(c))
            is_master_tbl = (
                any(k in top_rows_text for k in ["equipement description", "equipment description", "master equipment", "master name", "standard equipment", "details of master"])
                or ("description" in top_rows_text and any(k in top_rows_text for k in ["id mark", "id no", "certificate", "traceab"]))
            ) and any(k in top_rows_text for k in ["id mark", "id no", "certificate", "cert", "due date", "valid upto", "traceab"])
            if is_master_tbl:
                hdr_idx = 0 if any(k in " ".join(clean_text(c).lower() for c in extracted_data[0] if c) for k in ["description", "master", "id mark", "id no", "certificate"]) else 1
                if hdr_idx < len(extracted_data):
                    m_hdr = [clean_text(c).lower() for c in extracted_data[hdr_idx]]
                    for r in extracted_data[hdr_idx + 1:]:
                        vals = [clean_text(c) for c in r]
                        joined = " ".join(vals).lower()
                        if not joined.strip() or "observation" in joined or "discipline" in joined:
                            break
                        me = {"description": "", "idMark": "", "certNo": "", "dueDate": "", "traceableBy": ""}
                        for ci, htxt in enumerate(m_hdr):
                            v = vals[ci] if ci < len(vals) else ""
                            if not v:
                                continue
                            if ("desc" in htxt or "master" in htxt or "name" in htxt) and not me["description"]:
                                me["description"] = v
                            elif ("id mark" in htxt or "id no" in htxt or htxt in ("id", "id.") or "serial" in htxt) and not me["idMark"]:
                                me["idMark"] = v
                            elif "cert" in htxt and not me["certNo"]:
                                me["certNo"] = v
                            elif ("due" in htxt or "valid" in htxt) and not me["dueDate"]:
                                me["dueDate"] = v
                            elif "trace" in htxt and not me["traceableBy"]:
                                me["traceableBy"] = v
                        if me["description"] or me["idMark"] or me["certNo"]:
                            master_equipments.append(me)
                continue

            # Skip general header/metadata boxes
            first_row_str = " ".join([clean_text(c).lower() for c in extracted_data[0] if clean_text(c)])
            if any(w in first_row_str for w in ["inward", "receipt", "recipt", "format no", "issue date", "condition of item", "description of equipment", "environmental condition"]):
                continue

            # Locate the real column header row inside this table
            obs_header_idx = -1
            best_score = -100
            header_kw_re = re.compile(
                r'\b(?:sr\.?\s*no|s\.?\s*no|sl\.?\s*no|nominal|specification|gap\s*size|measured|observed|reading|trial|uuc|duc|master|standard|indicated|average|mean|error|deviation|tolerance|permissible|requirement|parameter|description|remarks|aperture|sieve|range|length|width|height|depth|dia(?:meter)?|thickness|weight|mass|load|force|pressure|speed|rpm|temp|voltage|current|resistance|time)\b',
                re.IGNORECASE,
            )

            for r_idx in range(min(len(extracted_data), 6)):
                r_cells = extracted_data[r_idx]
                non_empty = [clean_text(c) for c in r_cells if clean_text(c)]
                if not non_empty:
                    continue
                first_c = non_empty[0]
                r_lower = " ".join(c.lower() for c in non_empty)
                # Strictly skip section heading rows like "7. Observation(mm) : Discipline: ..."
                if re.match(r'^(?:\d+\.?\s*)?(?:observ(?:a|t)ion|results?)\b', first_c, re.IGNORECASE):
                    continue
                if any(term in r_lower for term in ["calibrated by", "calibration by", "reviewed", "authorized", "approved", "page no", "for repeatability"]):
                    continue
                if len(non_empty) < 2:
                    continue

                score = 0
                for cell_txt in non_empty:
                    if header_kw_re.search(cell_txt):
                        score += 15
                    if re.match(r'^\d+(?:\.\d+)?(?:\s*[-\u2013±]\s*\d+(?:\.\d+)?)?$', cell_txt):
                        score -= 18
                if score > best_score and score > 0:
                    best_score = score
                    obs_header_idx = r_idx

            if obs_header_idx == -1:
                continue

            top_row = [clean_text(c) for c in extracted_data[obs_header_idx]]
            sub_row = [clean_text(c) for c in extracted_data[obs_header_idx + 1]] if (obs_header_idx + 1) < len(extracted_data) else []
            non_empty_sub = [c for c in sub_row if c]
            has_sub_header = (
                len(non_empty_sub) >= 2
                and not any(re.match(r'^\d+(?:\.\d+)?\s*[-\u2013±]\s*\d+(?:\.\d+)?$', c) for c in non_empty_sub)
                and any(sub_hdr_re.match(c) or re.search(r'\b(?:reading|trial|uuc|duc|increasing|decreasing)\b', c, re.IGNORECASE) for c in non_empty_sub)
            )

            data_start_idx = obs_header_idx + (2 if has_sub_header else 1)

            # Build column indices accurately across single or 2-row merged headers
            col_specs = []
            num_cols = max(len(top_row), len(sub_row))
            if has_sub_header:
                # Forward-fill merged parent cell label across empty sibling columns when sub-header exists
                last_top = ""
                for c_idx in range(num_cols):
                    t_txt = top_row[c_idx] if c_idx < len(top_row) else ""
                    s_txt = sub_row[c_idx] if c_idx < len(sub_row) else ""
                    if t_txt:
                        last_top = t_txt
                    effective_top = t_txt if t_txt else (last_top if s_txt else "")
                    if not effective_top and not s_txt:
                        continue
                    if s_txt and effective_top and effective_top.lower() != s_txt.lower() and not re.match(r'^(?:observation|readings?)$', effective_top, re.IGNORECASE):
                        full_lbl = f"{effective_top} — {s_txt}"
                    else:
                        full_lbl = s_txt or effective_top
                    col_specs.append({"col_idx": c_idx, "label": clean_text(full_lbl)})
            else:
                for c_idx, t_txt in enumerate(top_row):
                    if t_txt:
                        col_specs.append({"col_idx": c_idx, "label": t_txt})

            if len(col_specs) < 2:
                continue

            col_defs = []
            seen_keys = set()
            for idx, spec in enumerate(col_specs):
                h = spec["label"]
                h_lower = h.lower()
                key = f"col_{idx}"
                col_type = "number"
                unit = extract_col_unit(h)
                formula = ""
                min_w = "120px"

                if re.search(r'^(?:sr|sl|s)\.?\s*no', h_lower):
                    key = "sNo"
                    col_type = "text"
                    min_w = "70px"
                elif any(w in h_lower for w in ["measured gap", "as measured"]):
                    key = "measuredGap"
                    col_type = "number"
                    min_w = "160px"
                elif any(w in h_lower for w in ["gap size", "is 2386"]):
                    key = "gapSize"
                    col_type = "text"
                    min_w = "190px"
                elif any(w in h_lower for w in ["specification", "size range"]):
                    key = "specification"
                    col_type = "text"
                    min_w = "120px"
                elif any(w in h_lower for w in ["nominal", "denom", "specified", "target", "load applied"]):
                    key = "nominal"
                    col_type = "number"
                elif any(w in h_lower for w in ["reading on master", "master value", "true value", "site ec", "standard value"]):
                    key = "masterValue" if "reading on master" in h_lower else "masterLoad"
                    col_type = "number"
                    min_w = "130px"
                elif re.search(r'reading.*1|1st|trial\s*1', h_lower):
                    key = "reading1"
                    col_type = "number"
                elif re.search(r'reading.*2|2nd|trial\s*2', h_lower):
                    key = "reading2"
                    col_type = "number"
                elif re.search(r'reading.*3|3rd|trial\s*3', h_lower):
                    key = "reading3"
                    col_type = "number"
                elif any(w in h_lower for w in ["average", "mean", "indicated", "observed", "measured", "actual"]):
                    key = "average" if ("average" in h_lower or "mean" in h_lower) else "indicated"
                    col_type = "formula" if ("average" in h_lower or "mean" in h_lower) else "number"
                    min_w = "130px"
                elif any(w in h_lower for w in ["indication error", "ind. error", "relative error", "error", "deviation"]):
                    key = "indError" if "indication" in h_lower or "relative" in h_lower else "error"
                    col_type = "formula"
                    unit = unit or "%"
                    formula = "((indicated - masterLoad) / masterLoad) * 100" if key == "indError" else ""
                elif any(w in h_lower for w in ["repeatability", "rep error"]):
                    key = "repError"
                    col_type = "number"
                    unit = unit or "%"
                elif any(w in h_lower for w in ["uncertainty", "muc", "±", "expanded"]):
                    key = "uncertainty"
                    col_type = "text"
                    unit = unit or "%"
                elif any(w in h_lower for w in ["remark", "description", "requirement", "tolerance"]):
                    key = "remarks" if "remark" in h_lower else ("tolerance" if "toler" in h_lower else "description")
                    col_type = "text"

                uniq_key = key
                cnt = 1
                while uniq_key in seen_keys:
                    cnt += 1
                    uniq_key = f"{key}_{cnt}"
                seen_keys.add(uniq_key)

                # Inspect first 5 data rows in this column for text/±/range patterns
                for sr in range(data_start_idx, min(len(extracted_data), data_start_idx + 6)):
                    sc = spec["col_idx"]
                    if sc < len(extracted_data[sr]):
                        sv = clean_text(extracted_data[sr][sc])
                        if sv and (re.search(r'[±a-zA-Z]', sv) or re.match(r'^\d+(?:\.\d+)?\s*[-\u2013/]\s*\d+(?:\.\d+)?$', sv)):
                            if col_type == "number":
                                col_type = "text"
                            break

                col_defs.append({
                    "key": uniq_key,
                    "label": h,
                    "type": col_type,
                    "unit": unit,
                    "formula": formula,
                    "minWidth": min_w,
                    "_col_idx": spec["col_idx"],
                })

            if len(col_defs) >= 2:
                detected_columns = col_defs
                for r in extracted_data[data_start_idx:]:
                    cells = [clean_text(c) for c in r if clean_text(c)]
                    if not cells:
                        continue
                    joined = " ".join(cells).lower()
                    if "for repeatability" in joined or "for mu" in joined:
                        rep_vals = [clean_text(c) for c in r if clean_text(c) and not re.search(r'for|repeatability|mu', c, re.IGNORECASE)]
                        repeatability_readings = rep_vals[:5]
                        continue
                    if any(term in joined for term in ["calibration by", "calibrated by", "page no", "reviewed &", "signature", "authorized by"]):
                        break

                    reading_row = {}
                    has_val = False
                    for cd in col_defs:
                        c_i = cd["_col_idx"]
                        val = clean_text(r[c_i]) if c_i < len(r) else ""
                        if val:
                            has_val = True
                        reading_row[cd["key"]] = val
                    if has_val:
                        default_readings.append(reading_row)

                for cd in detected_columns:
                    cd.pop("_col_idx", None)
                break
        if detected_columns:
            break

    if master_equipments:
        primary_m = master_equipments[0]
        master_desc = master_desc or primary_m.get("description", "")
        master_id = master_id or primary_m.get("idMark", "")
        master_cert = primary_m.get("certNo", "")
        master_due = primary_m.get("dueDate", "")
        master_trace = primary_m.get("traceableBy", "")

    # 6. SPATIAL TABLE EXTRACTION (For borderless PDFs)
    if not detected_columns or len(detected_columns) < 2:
        spatial_cols, spatial_rows = extract_spatial_table(doc)
        if spatial_cols and len(spatial_cols) >= 2:
            detected_columns = spatial_cols
            default_readings = spatial_rows

    # 7. CLEAN FALLBACK
    if not detected_columns or len(detected_columns) < 2:
        detected_columns = [
            {"key": "point", "label": "Calibration Parameter / Test Point", "type": "text", "minWidth": "160px"},
            {"key": "reading", "label": "Observed Reading", "type": "number", "minWidth": "140px"}
        ]
        default_readings = []

    if detected_columns and not default_readings:
        default_readings = [
            {c["key"]: (str(i + 1) if re.match(r'^sNo(?:_\d+)?$', c["key"], re.IGNORECASE) else "") for c in detected_columns}
            for i in range(5)
        ]

    def snap_edges(vals, tol=2.5):
        sorted_v = sorted(set(round(v, 1) for v in vals))
        out = []
        for v in sorted_v:
            if not out or abs(v - out[-1]) > tol:
                out.append(v)
        return out

    def nearest_edge_idx(edges, val):
        return min(range(len(edges)), key=lambda i: abs(edges[i] - val))

    def extract_exact_pdf_sheets(pdf_doc):
        sheets_out = []
        for p_idx in range(min(len(pdf_doc), 12)):
            pg = pdf_doc[p_idx]
            pg_name = f"Page {p_idx + 1}"
            tf = pg.find_tables()
            pg_tables = tf.tables if hasattr(tf, "tables") else []
            tbl_bboxes = [t.bbox for t in pg_tables if hasattr(t, "bbox")]

            def in_any_table(bbox):
                cx = (bbox[0] + bbox[2]) * 0.5
                cy = (bbox[1] + bbox[3]) * 0.5
                for tb in tbl_bboxes:
                    if (tb[0] - 2) <= cx <= (tb[2] + 2) and (tb[1] - 2) <= cy <= (tb[3] + 2):
                        return True
                return False

            raw_blocks = []

            # 1. Exact bordered tables with rowSpan / colSpan reconstruction
            for t_i, t in enumerate(pg_tables):
                ext = t.extract()
                if not ext:
                    continue
                xs_raw, ys_raw = [], []
                for rw in t.rows:
                    for cb in rw.cells:
                        if cb:
                            xs_raw.extend([cb[0], cb[2]])
                            ys_raw.extend([cb[1], cb[3]])
                xs = snap_edges(xs_raw)
                ys = snap_edges(ys_raw)
                if len(xs) < 2 or len(ys) < 2:
                    continue

                cols_meta = [
                    {"c": ci, "wpx": int(max(45, min(320, round((xs[ci + 1] - xs[ci]) * 1.45))))}
                    for ci in range(len(xs) - 1)
                ]

                num_grid_rows = len(ys) - 1
                grid_rows_map = {ri: [] for ri in range(num_grid_rows)}
                covered = set()

                # Resolve column header label for every c0 (supporting horizontal merges + 2-row sub-headers)
                col_hdr_labels = {}
                if len(ext) > 0:
                    last_top_h = ""
                    has_sub_h = (
                        len(ext) > 1
                        and any(sub_hdr_re.match(clean_text(x)) for x in ext[1] if clean_text(x))
                    )
                    for ci in range(max(len(ext[0]), len(ext[1]) if len(ext) > 1 else 0)):
                        th = clean_text(ext[0][ci]) if ci < len(ext[0]) else ""
                        if th:
                            last_top_h = th
                        sh = clean_text(ext[1][ci]) if (has_sub_h and len(ext) > 1 and ci < len(ext[1])) else ""
                        if th and sh and th.lower() != sh.lower():
                            col_hdr_labels[ci] = f"{th} — {sh}"
                        elif sh and last_top_h and last_top_h.lower() != sh.lower():
                            col_hdr_labels[ci] = f"{last_top_h} — {sh}"
                        else:
                            col_hdr_labels[ci] = sh or th or last_top_h

                for r_i, rw in enumerate(t.rows):
                    row_ext = ext[r_i] if r_i < len(ext) else []
                    for c_i, cb in enumerate(rw.cells):
                        if not cb:
                            continue
                        c0 = nearest_edge_idx(xs, cb[0])
                        c1 = max(c0 + 1, nearest_edge_idx(xs, cb[2]))
                        r0 = nearest_edge_idx(ys, cb[1])
                        r1 = max(r0 + 1, nearest_edge_idx(ys, cb[3]))
                        if (r0, c0) in covered:
                            continue
                        for rr in range(r0, r1):
                            for cc in range(c0, c1):
                                covered.add((rr, cc))
                        col_span = c1 - c0
                        row_span = r1 - r0
                        txt = clean_text(row_ext[c_i]) if c_i < len(row_ext) else ""
                        is_hdr = r0 == 0 or (
                            r0 == 1
                            and r_i < len(ext)
                            and any(sub_hdr_re.match(clean_text(x)) for x in ext[r_i] if clean_text(x))
                        )
                        is_blank_input = txt == "" or bool(re.match(r'^[_\.\-\s]{3,}$', txt))
                        is_serial = bool(re.match(r'^\d{1,3}$', txt)) and c0 == 0 and r0 > 0
                        # Determine header label for placeholder & measurement detection
                        hdr_lbl = col_hdr_labels.get(c_i) or col_hdr_labels.get(c0) or ""
                        is_measure_col = bool(
                            re.search(r'(?:reading|obs|measured|actual|trial|master|error|dev|nominal|indicated|average|mean)', hdr_lbl, re.IGNORECASE)
                        )
                        if is_hdr:
                            cell_kind = "header"
                        elif is_blank_input:
                            cell_kind = "input"
                            txt = ""
                        elif r0 > 0 and not is_serial and is_measure_col:
                            cell_kind = "input"
                        else:
                            cell_kind = "label"

                        grid_rows_map[r0].append({
                            "r": r0,
                            "c": c0,
                            "ref": f"T{t_i}_R{r0}C{c0}",
                            "rowSpan": row_span,
                            "colSpan": col_span,
                            "value": txt,
                            "formula": "",
                            "kind": cell_kind,
                            "align": "center" if (is_hdr or cell_kind == "input" or is_serial) else "left",
                            "bold": is_hdr,
                            "placeholder": hdr_lbl if cell_kind == "input" else "",
                        })

                tbl_rows_out = []
                for ri in range(num_grid_rows):
                    row_cells = sorted(grid_rows_map[ri], key=lambda x: x["c"])
                    h_pt = ys[ri + 1] - ys[ri]
                    tbl_rows_out.append({
                        "r": ri,
                        "hpx": int(max(22, min(80, round(h_pt * 1.35)))),
                        "isHeaderRow": ri == 0,
                        "cells": row_cells,
                    })

                raw_blocks.append({
                    "kind": "table",
                    "y0": round(t.bbox[1], 1),
                    "colsMeta": cols_meta,
                    "rows": tbl_rows_out,
                })

            # 2. Standalone text lines outside tables in exact vertical position
            pg_dict = pg.get_text("dict")
            spans_outside = []
            for blk in pg_dict.get("blocks", []):
                if blk.get("type") != 0:
                    continue
                for ln in blk.get("lines", []):
                    for sp in ln.get("spans", []):
                        stxt = clean_text(sp.get("text", ""))
                        sb = sp.get("bbox", [0, 0, 0, 0])
                        if not stxt or in_any_table(sb):
                            continue
                        spans_outside.append({
                            "x0": sb[0],
                            "y0": sb[1],
                            "x1": sb[2],
                            "text": stxt,
                            "bold": bool(sp.get("flags", 0) & 16),
                            "size": round(sp.get("size", 10), 1),
                        })

            spans_outside.sort(key=lambda s: (round(s["y0"] / 5.0), s["x0"]))
            grouped_lines = []
            for sp in spans_outside:
                if grouped_lines and abs(sp["y0"] - grouped_lines[-1]["y0"]) <= 5.0:
                    grouped_lines[-1]["spans"].append(sp)
                else:
                    grouped_lines.append({"y0": sp["y0"], "spans": [sp]})

            for ln_idx, gl in enumerate(grouped_lines):
                sps = sorted(gl["spans"], key=lambda s: s["x0"])
                merged_items = []
                for sp in sps:
                    if merged_items and (sp["x0"] - merged_items[-1]["x1"]) <= 22.0:
                        merged_items[-1]["text"] = f"{merged_items[-1]['text']} {sp['text']}".strip()
                        merged_items[-1]["x1"] = max(merged_items[-1]["x1"], sp["x1"])
                        merged_items[-1]["bold"] = merged_items[-1]["bold"] or sp["bold"]
                    else:
                        merged_items.append(dict(sp))

                line_cells = []
                for m_i, it in enumerate(merged_items):
                    txt = clean_text(it["text"])
                    m_blank_field = re.match(r'^(.+?[:\-])\s*([_\.]{3,}|\s*)$', txt)
                    if m_blank_field and len(m_blank_field.group(1)) >= 3 and m_i == len(merged_items) - 1:
                        lbl = m_blank_field.group(1).strip()
                        line_cells.append({"kind": "label", "value": lbl, "bold": it["bold"]})
                        line_cells.append({
                            "kind": "input",
                            "ref": f"L{ln_idx}_{m_i}",
                            "value": "",
                            "placeholder": lbl.rstrip(":- "),
                        })
                    else:
                        line_cells.append({
                            "kind": "title" if it["size"] >= 13 or "arcl" in txt.lower() else ("section" if re.match(r'^\d+\.\s*[A-Za-z]', txt) else "label"),
                            "value": txt,
                            "bold": it["bold"] or it["size"] >= 12,
                        })

                raw_blocks.append({
                    "kind": "line",
                    "y0": round(gl["y0"], 1),
                    "items": line_cells,
                })

            raw_blocks.sort(key=lambda b: b["y0"])
            is_scanned = len(raw_blocks) == 0 and len(pg.get_images(full=True)) > 0

            sheets_out.append({
                "sheetName": pg_name,
                "role": "observation" if p_idx == 0 else "general",
                "kind": "pdf",
                "isScanned": is_scanned,
                "blocks": raw_blocks,
            })

        return sheets_out

    exact_sheets = extract_exact_pdf_sheets(doc)

    # Perform High-Efficiency Compression on the PDF
    comp_size = orig_size
    if compressed_output_path:
        try:
            compress_pdf_document(doc, compressed_output_path)
            if os.path.exists(compressed_output_path):
                comp_size = os.path.getsize(compressed_output_path)
        except Exception as e:
            sys.stderr.write(f"PDF compression notice: {e}\n")

    result = {
        "success": True,
        "name": inst_name or "Calibration Equipment",
        "equipmentType": category,
        "standardReference": ref_standard,
        "calibrationMethod": calib_method,
        "repeatabilityMu": ", ".join(repeatability_readings),
        "repeatabilityReadings": repeatability_readings,
        "parameters": {
            "range": range_val,
            "leastCount": least_count,
            "location": location_val,
            "temperature": temp_val,
            "humidity": rh_val,
            "formatNo": format_no or "ARCL/OB/01",
            "formatIssueNo": format_issue_no,
            "formatIssueDate": format_issue_date,
            "masterEquipment": master_desc,
            "masterDescription": master_desc,
            "masterId": master_id,
            "masterCertNo": master_cert,
            "masterDueDate": master_due,
            "masterTraceable": master_trace or "NABL Accredited Lab",
            "masterEquipments": master_equipments,
            "repeatabilityMu": ", ".join(repeatability_readings),
            "repeatabilityReadings": repeatability_readings,
        },
        "tableColumns": detected_columns,
        "defaultReadings": default_readings,
        "exactSheets": exact_sheets,
        "sheetsSummary": [{"name": s["sheetName"], "role": s["role"], "rowCount": len(s.get("blocks", [])), "colCount": 0} for s in exact_sheets],
        "pageCount": len(doc),
        "compression": {
            "originalBytes": orig_size,
            "compressedBytes": comp_size,
            "savedPercent": f"{round((1 - comp_size / max(orig_size, 1)) * 100, 1)}%" if orig_size > comp_size else "0%",
        },
    }

    return result

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No PDF file path provided"}))
        sys.exit(1)

    pdf_file = sys.argv[1]
    comp_out = sys.argv[2] if len(sys.argv) > 2 else None
    res = parse_pdf_observation_format(pdf_file, compressed_output_path=comp_out)
    print(json.dumps(res, indent=2))
