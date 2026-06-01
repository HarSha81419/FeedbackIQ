#!/usr/bin/env python3
"""
preprocess_dataset.py

Usage:
    python preprocess_dataset.py raw_reviews.csv

This script converts messy, real-world review datasets into a standardized CSV
format suitable for FeedbackIQ's CSV upload feature.

It is beginner-friendly and modular. Adjust the `COLUMN_MAPPING` and
`SOURCE_NAME` at the top of the file to match your dataset.

Requirements:
    pandas, numpy

The output is written to `./processed/feedbackiq_dataset.csv` (created if missing).
"""

from __future__ import annotations

import argparse
import csv
import json
import os
import re
import sys
import unicodedata
from dataclasses import dataclass
from typing import Dict, Optional, Tuple

import numpy as np
import pandas as pd

try:
    import colorama
    colorama.init()
    COLOR_ENABLED = True
except Exception:
    COLOR_ENABLED = False

# --------------------------- CONFIGURATION ---------------------------
# Map the standardized column names used by FeedbackIQ to the column names
# present in the raw CSV file. Edit this mapping for each dataset.
COLUMN_MAPPING: Dict[str, str] = {
    # Allow users to explicitly map their input columns to standardized
    # output names. Keys are standard names used in the pipeline; values
    # are column names in the raw CSV. Leave blank or remove entries to
    # enable automatic alias detection.
    "customer_id": "userName",
    "feedback": "reviewText",
    # rating kept as possible input to fill `category` if category missing
    "rating": "score",
    "timestamp": "at",
    # source can be provided by mapping or via SOURCE_NAME static value
    # "source": "source_col",
}

# Static source value to assign to every row (useful when importing from a
# single source like "Google Play" or "Amazon"). Set to None to read from
# an input column instead.
SOURCE_NAME: Optional[str] = "Google Play"

# Whether to strip emojis from feedback text. Set to False to preserve them.
REMOVE_EMOJIS = True

# Maximum feedback text length (characters). Extremely long reviews will be
# truncated to this length to keep uploads reasonable. Set to None for no limit.
MAX_FEEDBACK_LENGTH: Optional[int] = 2000

# Output path
OUTPUT_DIR = "processed"
OUTPUT_FILENAME = "feedbackiq_dataset.csv"

# Output columns should match the backend upload schema required by
# FeedbackIQ: customer_id, feedback, source, timestamp, optional category/rating.
OUTPUT_COLUMN_NAMES = {
    "customer_id": "customer_id",
    "feedback": "feedback",
    "source": "source",
    "timestamp": "timestamp",
    "category": "category",
}

# --------------------------- HELPERS & CLEANING ---------------------------

EMOJI_PATTERN = re.compile(
    "[\U0001F600-\U0001F64F"  # emoticons
    "\U0001F300-\U0001F5FF"  # symbols & pictographs
    "\U0001F680-\U0001F6FF"  # transport & map symbols
    "\U0001F1E0-\U0001F1FF"  # flags (iOS)
    "]+",
    flags=re.UNICODE,
)

HTML_TAG_RE = re.compile(r"<[^>]+>")


def clean_text(text: Optional[str], remove_emojis: bool = True) -> str:
    """Normalize and clean a single text value.

    Steps:
    - Convert to string and normalize unicode.
    - Remove surrounding whitespace and collapse internal whitespace.
    - Remove HTML tags.
    - Optionally remove emojis.
    - Return an empty string for None/NaN inputs.
    """
    if text is None:
        return ""
    if isinstance(text, float) and np.isnan(text):
        return ""
    if hasattr(text, "__len__") and len(str(text).strip()) == 0:
        return ""

    # Convert non-string inputs (e.g., numbers) to string
    try:
        s = str(text)
    except Exception:
        return ""

    if s.lower() == "nan":
        return ""

    # Unicode normalization (NFKC recommended for text normalization)
    s = unicodedata.normalize("NFKC", s)

    # Remove HTML tags
    s = HTML_TAG_RE.sub("", s)

    # Optionally remove emojis
    if remove_emojis:
        s = EMOJI_PATTERN.sub("", s)

    # Collapse whitespace and trim
    s = re.sub(r"\s+", " ", s).strip()

    return s


def _color(text: str, kind: str = "info") -> str:
    if not COLOR_ENABLED:
        return text
    codes = {
        "info": "\x1b[34m",
        "success": "\x1b[32m",
        "warn": "\x1b[33m",
        "error": "\x1b[31m",
        "reset": "\x1b[0m",
    }
    return f"{codes.get(kind, '')}{text}{codes['reset']}"


def info(msg: str) -> None:
    print(_color(f"[INFO] {msg}", "info"))


def success(msg: str) -> None:
    print(_color(f"[OK] {msg}", "success"))


def warn(msg: str) -> None:
    print(_color(f"[WARN] {msg}", "warn"))


def error(msg: str) -> None:
    print(_color(f"[ERROR] {msg}", "error"))


def ensure_output_dir(path: str) -> None:
    os.makedirs(path, exist_ok=True)


@dataclass
class PreprocessResult:
    df: pd.DataFrame
    total_rows: int
    rows_removed_null: int
    duplicates_removed: int
    rows_skipped: int
    missing_values_count: Dict[str, int]
    detected_source_columns: list


def validate_mapping_and_columns(df: pd.DataFrame, mapping: Dict[str, str]) -> None:
    """Validate mapping provided by user. This only asserts that mappings are
    syntactically present; actual column detection happens later with aliases.
    """
    # No strict checks here; mapping is optional. We'll detect missing
    # required columns after alias resolution.
    if not isinstance(mapping, dict):
        raise ValueError("COLUMN_MAPPING must be a dict")
def detect_delimiter(sample: str) -> str:
    # Simple heuristic: count common delimiters in the sample and choose the
    # most frequent one. Fall back to comma.
    counts = {",": sample.count(","), ";": sample.count(";"), "\t": sample.count("\t")}
    delim = max(counts, key=counts.get)
    return delim if counts[delim] > 0 else ","


ALIASES = {
    # exact normalized alias -> standard output field
    "customer_name": "customer_id",
    "author_name": "customer_id",
    "username": "customer_id",
    "user": "customer_id",
    "user_id": "customer_id",
    "name": "customer_id",
    # feedback aliases
    "review": "feedback",
    "review_text": "feedback",
    "message": "feedback",
    "body": "feedback",
    "content": "feedback",
    # category/rating aliases
    "sentiment_label": "category",
    "rating": "category",
    "review_rating": "category",
    "score": "category",
    # timestamp aliases
    "date": "timestamp",
    "review_datetime_utc": "timestamp",
    "created_at": "timestamp",
    "time": "timestamp",
}


def load_dataset(path: str) -> Tuple[pd.DataFrame, Dict]:
    """Load CSV with delimiter and encoding detection. Returns DataFrame and
    metadata dict.
    """
    meta: Dict = {}
    if not os.path.isfile(path):
        raise FileNotFoundError(path)

    _, ext = os.path.splitext(path.lower())

    # Handle Excel files (.xls, .xlsx) separately
    if ext in (".xls", ".xlsx"):
        info("Detected Excel file. Attempting to read first sheet.")
        try:
            # openpyxl is the common engine for .xlsx; provide a helpful error
            # message if missing.
            try:
                import openpyxl  # type: ignore
            except Exception:
                raise RuntimeError(
                    "Missing dependency 'openpyxl'. Install with: pip install openpyxl"
                )
            df = pd.read_excel(path, engine="openpyxl", dtype=object)
            meta["encoding"] = None
            meta["delimiter"] = None
            meta["file_type"] = "excel"
            info(f"Loaded Excel with {len(df)} rows and {len(df.columns)} columns")
            # Warn for very large files
            if len(df) > 20000:
                warn("Large file detected (>20k rows). Processing may be slow or memory-intensive.")
            return df, meta
        except Exception as e:
            raise RuntimeError(f"Failed to read Excel file: {e}")

    # Otherwise assume a delimited text file and detect delimiter/encoding
    with open(path, "rb") as f:
        raw = f.read(8192)

    # Try utf-8 first, else latin-1
    encodings = ["utf-8", "latin-1", "cp1252"]
    detected_encoding = None
    sample = None
    for enc in encodings:
        try:
            sample = raw.decode(enc)
            detected_encoding = enc
            break
        except Exception:
            continue
    if detected_encoding is None:
        raise UnicodeDecodeError("Unable to decode file with common encodings")

    delim = detect_delimiter(sample or "")
    meta["encoding"] = detected_encoding
    meta["delimiter"] = delim
    meta["file_type"] = "text"

    info(f"Detected encoding={detected_encoding}, delimiter='{delim}'")

    try:
        df = pd.read_csv(path, sep=delim, encoding=detected_encoding, dtype=object, on_bad_lines="warn")
    except Exception as e:
        # Try fallback to python engine with more permissive parsing
        try:
            df = pd.read_csv(path, sep=delim, encoding=detected_encoding, dtype=object, engine="python", on_bad_lines="warn")
        except Exception as ex:
            raise RuntimeError(f"Failed to parse delimited file: {ex}")

    # Warn for very large files
    if len(df) > 20000:
        warn("Large file detected (>20k rows). Processing may be slow or memory-intensive.")

    return df, meta


def normalize_columns(df: pd.DataFrame) -> pd.DataFrame:
    """Normalize column names: lowercase, trim, replace spaces with underscores."""
    new_cols = []
    for c in df.columns:
        nc = str(c).strip().lower()
        nc = re.sub(r"\s+", "_", nc)
        nc = re.sub(r"[^a-z0-9_]+", "", nc)
        new_cols.append(nc)
    df = df.copy()
    df.columns = new_cols
    return df


def map_columns(df: pd.DataFrame, mapping: Dict[str, str]) -> Tuple[pd.DataFrame, Dict]:
    """Map input columns to standardized names using explicit mapping and
    alias detection. Returns transformed DataFrame and mapping used.
    """
    # canonical target fields we want in the output
    target_fields = ["customer_id", "feedback", "timestamp", "category", "source"]
    used_mapping: Dict[str, Optional[str]] = {k: None for k in target_fields}

    # Reverse mapping of ALIASES: alias_name -> standard
    # First, apply user-provided mapping (explicit). Normalize mapping keys
    # and values to match normalized DataFrame columns.
    df2 = df.copy()

    def normalize_name(name: str) -> str:
        n = str(name).strip().lower()
        n = re.sub(r"\s+", "_", n)
        n = re.sub(r"[^a-z0-9_]+", "", n)
        return n

    # Normalize mapping keys (allow rating -> category, customer_id -> customer_id)
    key_aliases = {
        "customer_id": "customer_id",
        "customer": "customer_id",
        "feedback": "feedback",
        "review": "feedback",
        "rating": "category",
        "category": "category",
        "timestamp": "timestamp",
        "time": "timestamp",
        "source": "source",
    }

    normalized_mapping: Dict[str, str] = {}
    for raw_key, src in mapping.items():
        if not src:
            continue
        std_key = key_aliases.get(str(raw_key).strip().lower(), None)
        if std_key is None:
            continue
        src_norm = normalize_name(src)
        normalized_mapping[std_key] = src_norm

    # Apply normalized explicit mapping if the column exists
    for std, src_norm in normalized_mapping.items():
        if src_norm in df2.columns:
            used_mapping[std] = src_norm

    # For each standardized field not yet mapped, try aliases
    for col in df2.columns:
        if col in used_mapping.values():
            continue
        if col in ALIASES:
            std = ALIASES[col]
            if used_mapping.get(std) is None:
                used_mapping[std] = col

    # Try pattern-based matching for headers not covered by exact aliases
    if used_mapping.get("customer_id") is None:
        for col in df2.columns:
            if "author" in col or "customer" in col or "reviewer" in col or "name" in col:
                used_mapping["customer_id"] = col
                break

    if used_mapping.get("feedback") is None:
        for col in df2.columns:
            if any(term in col for term in ["review", "message", "content", "body"]):
                if not any(term in col for term in ["rating", "score"]):
                    used_mapping["feedback"] = col
                    break

    if used_mapping.get("category") is None:
        for col in df2.columns:
            if any(term in col for term in ["rating", "score", "category", "sentiment"]):
                used_mapping["category"] = col
                break

    if used_mapping.get("timestamp") is None:
        for col in df2.columns:
            if any(term in col for term in ["date", "time", "datetime", "posted"]):
                used_mapping["timestamp"] = col
                break

    if used_mapping.get("source") is None:
        for col in df2.columns:
            if any(term in col for term in ["source", "platform", "origin", "app"]):
                used_mapping["source"] = col
                break

    # Special fallback: if category missing but rating present, use rating
    if used_mapping.get("category") is None:
        for c in ["rating", "score"]:
            if c in df2.columns:
                used_mapping["category"] = c
                break

    # If source not provided and SOURCE_NAME is None, detect common source columns
    for cand in ["source", "platform", "origin"]:
        if used_mapping.get("source") is None and cand in df2.columns:
            used_mapping["source"] = cand

    # Build output DataFrame with standardized names (only target fields)
    out = pd.DataFrame()
    for std in target_fields:
        src = used_mapping.get(std)
        if src and src in df2.columns:
            out[std] = df2[src].astype(object)
        else:
            out[std] = np.nan

    return out, used_mapping


def validate_rows(
    out: pd.DataFrame, remove_emojis_flag: bool, max_feedback_length: Optional[int]
) -> Tuple[pd.DataFrame, Dict]:
    """Perform validations and cleaning on the standardized DataFrame.

    Returns cleaned DataFrame and stats dict.
    """
    stats: Dict = {}
    stats["initial_rows"] = len(out)

    # Clean feedback and customer_id
    out["feedback"] = out["feedback"].apply(lambda x: clean_text(x, remove_emojis=remove_emojis_flag))
    out["customer_id"] = out["customer_id"].apply(lambda x: clean_text(x, remove_emojis=False))

    # Timestamp parsing
    out["_ts_parsed"] = pd.to_datetime(out["timestamp"], errors="coerce", utc=True)
    stats["invalid_timestamps"] = int(out["_ts_parsed"].isna().sum())

    # Replace timestamp with ISO where possible
    out["timestamp"] = out["_ts_parsed"].dt.strftime("%Y-%m-%dT%H:%M:%SZ").fillna(out["timestamp"])

    # Ensure no empty feedback rows
    before = len(out)
    out["_feedback_nonempty"] = out["feedback"].astype(str).str.strip().replace("", np.nan)
    invalid_feedback = out[out["_feedback_nonempty"].isna()].copy()
    stats["rows_with_empty_feedback"] = len(invalid_feedback)
    out = out[~out["_feedback_nonempty"].isna()].copy()

    # Remove duplicates (feedback + customer_id)
    before_dup = len(out)
    out.drop_duplicates(subset=["feedback", "customer_id"], inplace=True)
    stats["duplicates_removed"] = before_dup - len(out)

    # Enforce max length
    if max_feedback_length is not None:
        out["feedback"] = out["feedback"].apply(lambda s: s if len(s) <= max_feedback_length else s[:max_feedback_length])

    stats["final_rows"] = len(out)
    stats["rows_skipped"] = stats["initial_rows"] - stats["final_rows"]
    stats["missing_values_count"] = {c: int(out[c].isna().sum()) for c in out.columns}

    # Log invalid rows (first 10)
    if len(invalid_feedback) > 0:
        warn(f"Found {len(invalid_feedback)} rows with empty feedback; first 10 listed below:")
        with pd.option_context("display.max_colwidth", 200):
            print(invalid_feedback.head(10).to_string(index=False))

    return out, stats


def export_dataset(out: pd.DataFrame, output_dir: str, output_filename: str) -> str:
    ensure_output_dir(output_dir)
    out_path = os.path.join(output_dir, output_filename)
    # Ensure final column order matches backend upload spec: customer_id,feedback,source,timestamp,category
    final_cols = ["customer_id", "feedback", "source", "timestamp", "category"]
    cols_present = [c for c in final_cols if c in out.columns]
    out[cols_present].to_csv(out_path, index=False)
    return out_path


def generate_report(path: str, meta: Dict, used_mapping: Dict, stats: Dict) -> None:
    report = {
        "output_path": path,
        "meta": meta,
        "used_mapping": used_mapping,
        "stats": stats,
    }
    report_path = os.path.join(os.path.dirname(path), "preprocess_report.json")
    try:
        with open(report_path, "w", encoding="utf-8") as fh:
            json.dump(report, fh, indent=2)
        info(f"Saved preprocessing report to: {report_path}")
    except Exception as e:
        warn(f"Failed to save report: {e}")


def unit_checks(out_path: str) -> None:
    # Verify readable and row count > 0 and required columns exist
    try:
        df = pd.read_csv(out_path, dtype=object)
    except Exception as e:
        raise RuntimeError(f"Output CSV not readable: {e}")

    required = ["customer_id", "feedback", "source", "timestamp", "category"]
    missing = [c for c in required if c not in df.columns]
    if missing:
        raise RuntimeError(f"Output CSV missing required columns: {missing}")
    if len(df) == 0:
        raise RuntimeError("Output CSV has zero rows")

    success("Unit checks passed: output CSV readable and contains rows.")


def main() -> int:
    parser = argparse.ArgumentParser(description="Preprocess raw review CSV for FeedbackIQ upload.")
    parser.add_argument("input_csv", help="Path to the raw CSV file to preprocess")
    parser.add_argument("--remove-emojis", dest="remove_emojis", action="store_true", help="Remove emojis from feedback (overrides default)")
    parser.add_argument("--keep-emojis", dest="remove_emojis", action="store_false", help="Keep emojis in feedback")
    parser.add_argument("--source", help="Static source name to assign to all rows (overrides SOURCE_NAME in script)")
    parser.add_argument("--max-length", type=int, default=MAX_FEEDBACK_LENGTH, help="Max feedback text length; longer texts are truncated")
    parser.add_argument("--output", help="Output filename (defaults to processed/feedbackiq_dataset.csv)")

    parser.set_defaults(remove_emojis=REMOVE_EMOJIS)
    args = parser.parse_args()

    input_path = args.input_csv
    if not os.path.isfile(input_path):
        error(f"input file not found: {input_path}")
        return 2

    # Effective configuration
    source = args.source if args.source is not None else SOURCE_NAME
    remove_emojis_flag = args.remove_emojis
    max_len = args.max_length
    output_filename = args.output if args.output else OUTPUT_FILENAME

    info(f"Loading dataset: {input_path}")
    try:
        df, meta = load_dataset(input_path)
    except FileNotFoundError:
        error(f"Input file not found: {input_path}")
        return 2
    except UnicodeDecodeError as ude:
        error(f"Encoding error: {ude}")
        return 3
    except Exception as e:
        error(f"Failed to load dataset: {e}")
        return 3

    info("Normalizing column names")
    df = normalize_columns(df)

    info("Mapping columns using aliases and provided mapping")
    out_std, used_mapping = map_columns(df, COLUMN_MAPPING)

    # If source is static, fill it when missing
    if source is not None and (out_std["source"].isna().all()):
        out_std["source"] = source

    info("Validating and cleaning rows")
    cleaned, stats = validate_rows(out_std, remove_emojis_flag, max_len)

    # Export
    try:
        out_path = export_dataset(cleaned, OUTPUT_DIR, output_filename)
        success(f"Saved cleaned CSV to: {out_path}")
    except Exception as e:
        error(f"Failed to save cleaned CSV: {e}")
        return 4

    # Report
    generate_report(out_path, meta, used_mapping, stats)

    # Unit checks
    try:
        unit_checks(out_path)
    except Exception as e:
        error(f"Post-export checks failed: {e}")
        return 5

    # Print summary to console
    print("--- Summary ---")
    print(f"Rows processed: {stats.get('initial_rows')}")
    print(f"Rows skipped: {stats.get('rows_skipped')}")
    print(f"Duplicates removed: {stats.get('duplicates_removed')}")
    print(f"Missing values count: {stats.get('missing_values_count')}")
    print(f"Detected source columns: {used_mapping.get('source')}")

    print("\nFirst 5 cleaned rows:")
    with pd.option_context("display.max_colwidth", 200):
        print(cleaned.head(5).to_string(index=False))

    return 0


if __name__ == "__main__":
    sys.exit(main())
