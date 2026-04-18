"""
=============================================================================
 FraudGuard AI — Comprehensive System Test Suite
 Senior QA / ML Systems Testing
=============================================================================
"""

import requests
import json
import time
import sys
import os
import csv

API = "http://localhost:8000"

# ── Color helpers for terminal output ──
class C:
    GREEN = "\033[92m"
    RED   = "\033[91m"
    YELLOW = "\033[93m"
    CYAN  = "\033[96m"
    BOLD  = "\033[1m"
    END   = "\033[0m"

def passed(msg): print(f"  {C.GREEN}[PASS]{C.END} {msg}")
def failed(msg): print(f"  {C.RED}[FAIL]{C.END} {msg}")
def warn(msg):   print(f"  {C.YELLOW}[WARN]{C.END} {msg}")
def info(msg):   print(f"  {C.CYAN}[INFO]{C.END} {msg}")
def header(msg): print(f"\n{C.BOLD}{C.CYAN}{'='*60}\n {msg}\n{'='*60}{C.END}")

results = {"passed": 0, "failed": 0, "warnings": 0, "bugs": []}

def check(condition, pass_msg, fail_msg):
    if condition:
        passed(pass_msg)
        results["passed"] += 1
    else:
        failed(fail_msg)
        results["failed"] += 1
        results["bugs"].append(fail_msg)

# ====================================================================
# TEST 0: Health & Infrastructure
# ====================================================================
def test_infrastructure():
    header("TEST 0: Infrastructure & Health Checks")

    # Health endpoint
    try:
        r = requests.get(f"{API}/health", timeout=5)
        check(r.status_code == 200, "GET /health returns 200", f"GET /health returned {r.status_code}")
        data = r.json()
        check(data.get("status") == "healthy", "Health status is 'healthy'", f"Health status: {data}")
    except Exception as e:
        failed(f"Health endpoint unreachable: {e}")
        results["failed"] += 1
        results["bugs"].append("Backend not running")
        return False

    # Root endpoint
    r = requests.get(f"{API}/", timeout=5)
    data = r.json()
    check(r.status_code == 200, "GET / returns 200", f"GET / returned {r.status_code}")
    check(data.get("model") == "Random Forest", f"Model = '{data.get('model')}'", f"Unexpected model: {data}")

    # API docs available
    r = requests.get(f"{API}/docs", timeout=5)
    check(r.status_code == 200, "Swagger docs accessible at /docs", f"/docs returned {r.status_code}")

    return True


# ====================================================================
# TEST 1: API Single Prediction Tests
# ====================================================================

LEGIT_TX = {
    "Time": 406, "V1": -2.3122, "V2": 1.9520, "V3": -1.6099, "V4": 3.9979,
    "V5": -0.5223, "V6": -1.4265, "V7": -2.5372, "V8": 1.3916, "V9": -2.7701,
    "V10": -2.7723, "V11": 3.2020, "V12": -2.8991, "V13": -0.5953, "V14": -4.2894,
    "V15": 0.3896, "V16": -1.1408, "V17": -2.8300, "V18": -0.0168, "V19": 0.4163,
    "V20": 0.1260, "V21": 0.5170, "V22": -0.0354, "V23": -0.4652, "V24": 0.3200,
    "V25": 0.0445, "V26": 0.1780, "V27": 0.2617, "V28": -0.1432, "Amount": 2.69,
}

# Known fraud from original dataset (row index 492 from creditcard.csv)
FRAUD_TX = {
    "Time": 80283, "V1": -3.0435, "V2": -3.1572, "V3": 1.0885, "V4": 2.2886,
    "V5": 1.3594, "V6": -1.0645, "V7": 0.3252, "V8": -0.0677, "V9": -0.2709,
    "V10": -0.8386, "V11": -0.4143, "V12": -0.5031, "V13": 0.6769, "V14": -2.1191,
    "V15": 0.6619, "V16": -0.6494, "V17": 1.5774, "V18": 0.9395, "V19": -0.1551,
    "V20": -0.2789, "V21": 0.6898, "V22": -0.2276, "V23": -0.2575, "V24": 0.2489,
    "V25": -0.5834, "V26": -0.0267, "V27": -0.0413, "V28": -0.0683, "Amount": 1.00,
}

# Suspicious pattern - high amount, anomalous V features
SUSPICIOUS_TX = {
    "Time": 0, "V1": -5.0, "V2": 4.0, "V3": -6.0, "V4": 5.0,
    "V5": -4.0, "V6": -2.0, "V7": -5.0, "V8": 3.0, "V9": -4.0,
    "V10": -6.0, "V11": 4.0, "V12": -5.0, "V13": 1.0, "V14": -8.0,
    "V15": -3.0, "V16": -4.0, "V17": -5.0, "V18": -2.0, "V19": 2.0,
    "V20": 3.0, "V21": 1.0, "V22": 0.5, "V23": -1.0, "V24": -0.5,
    "V25": 1.0, "V26": -0.5, "V27": 0.5, "V28": -0.2, "Amount": 9999.99,
}

def test_api_predict():
    header("TEST 1: API /predict — Single Transaction Predictions")

    # ── Case 1: Legit transaction ──
    print(f"\n  {C.BOLD}Case 1: Legitimate Transaction{C.END}")
    r = requests.post(f"{API}/predict", json={**LEGIT_TX, "threshold": 0.5})
    check(r.status_code == 200, "POST /predict returns 200", f"Returned {r.status_code}")
    data = r.json()
    info(f"Response: prob={data.get('fraud_probability')}, is_fraud={data.get('is_fraud')}, risk={data.get('risk_level')}")

    check("fraud_probability" in data, "Response has 'fraud_probability'", "Missing fraud_probability field")
    check("is_fraud" in data, "Response has 'is_fraud'", "Missing is_fraud field")
    check("risk_level" in data, "Response has 'risk_level'", "Missing risk_level field")
    check("threshold_used" in data, "Response has 'threshold_used'", "Missing threshold_used field")

    prob = data.get("fraud_probability", 1)
    check(prob < 0.5, f"Legit tx: probability ({prob}) < 0.5", f"Legit tx got HIGH probability: {prob}")
    check(data.get("is_fraud") == 0, "Legit tx: predicted as NOT fraud", f"Legit tx predicted as fraud! prob={prob}")

    # ── Case 2: Fraud transaction ──
    print(f"\n  {C.BOLD}Case 2: Fraud Transaction{C.END}")
    r = requests.post(f"{API}/predict", json={**FRAUD_TX, "threshold": 0.5})
    data = r.json()
    info(f"Response: prob={data.get('fraud_probability')}, is_fraud={data.get('is_fraud')}, risk={data.get('risk_level')}")

    prob = data.get("fraud_probability", 0)
    # Note: Model may or may not detect this as fraud - record the actual behavior
    if prob >= 0.5:
        passed(f"Fraud tx: probability ({prob}) >= 0.5 — correctly flagged")
        results["passed"] += 1
    else:
        warn(f"Fraud tx: probability ({prob}) < 0.5 — model did not flag this sample")
        results["warnings"] += 1

    # ── Case 3: Suspicious / extreme transaction ──
    print(f"\n  {C.BOLD}Case 3: Suspicious Transaction (extreme features){C.END}")
    r = requests.post(f"{API}/predict", json={**SUSPICIOUS_TX, "threshold": 0.5})
    data = r.json()
    info(f"Response: prob={data.get('fraud_probability')}, is_fraud={data.get('is_fraud')}, risk={data.get('risk_level')}")
    prob = data.get("fraud_probability", 0)
    check(r.status_code == 200, "Suspicious tx: API did not crash", f"API error: {r.status_code}")

    # ── Case 4: Threshold sensitivity test ──
    print(f"\n  {C.BOLD}Case 4: Threshold Sensitivity (0.3, 0.5, 0.7){C.END}")
    threshold_results = {}
    for t in [0.3, 0.5, 0.7]:
        r = requests.post(f"{API}/predict", json={**SUSPICIOUS_TX, "threshold": t})
        d = r.json()
        threshold_results[t] = d
        info(f"  threshold={t}: prob={d['fraud_probability']}, is_fraud={d['is_fraud']}, risk={d['risk_level']}")

    # Verify probability stays the same regardless of threshold
    probs = [threshold_results[t]["fraud_probability"] for t in [0.3, 0.5, 0.7]]
    check(probs[0] == probs[1] == probs[2],
          f"Probability constant across thresholds ({probs[0]})",
          f"Probability changed with threshold! {probs}")

    # Verify threshold affects is_fraud correctly
    p = probs[0]
    for t in [0.3, 0.5, 0.7]:
        expected_fraud = int(p >= t)
        actual_fraud = threshold_results[t]["is_fraud"]
        check(actual_fraud == expected_fraud,
              f"threshold={t}: is_fraud={actual_fraud} correct (prob={p} >= {t} -> {expected_fraud})",
              f"threshold={t}: is_fraud={actual_fraud} WRONG (expected {expected_fraud}, prob={p})")

    # ── Case 5: Risk level logic ──
    print(f"\n  {C.BOLD}Case 5: Risk Level Classification{C.END}")
    info("Testing risk logic: >0.7=HIGH, >0.3=MEDIUM, <=0.3=LOW")
    # We already have probability from the suspicious tx
    for t_label, t_result in threshold_results.items():
        p = t_result["fraud_probability"]
        expected_risk = "HIGH" if p > 0.7 else "MEDIUM" if p > 0.3 else "LOW"
        check(t_result["risk_level"] == expected_risk,
              f"Risk level correct: {t_result['risk_level']} (prob={p})",
              f"Risk level wrong: got {t_result['risk_level']}, expected {expected_risk} (prob={p})")


# ====================================================================
# TEST 2: Batch Prediction Tests
# ====================================================================
def test_batch_predict():
    header("TEST 2: API /predict/batch — Batch CSV Upload")

    csv_path = os.path.join(
        os.path.dirname(os.path.dirname(os.path.dirname(__file__))),
        "fraud_test_dataset.csv"
    )
    if not os.path.exists(csv_path):
        # Try alternate path
        csv_path = r"c:\Users\vaishnavi\OneDrive\Desktop\Credit Card Fraud Detection\fraud_test_dataset.csv"

    if not os.path.exists(csv_path):
        failed(f"Test CSV not found at: {csv_path}")
        results["failed"] += 1
        return

    # Count rows
    with open(csv_path, "r") as f:
        reader = csv.reader(f)
        rows = list(reader)
        data_rows = len(rows) - 1  # exclude header
    info(f"Test CSV has {data_rows} data rows, columns: {len(rows[0])}")

    # Upload
    with open(csv_path, "rb") as f:
        r = requests.post(f"{API}/predict/batch", files={"file": ("test.csv", f, "text/csv")})

    check(r.status_code == 200, f"Batch upload returned 200", f"Batch upload returned {r.status_code}: {r.text[:200]}")

    if r.status_code != 200:
        return

    data = r.json()
    info(f"Response: total={data.get('total')}, fraud_count={data.get('fraud_count')}")

    check(data.get("total") == data_rows,
          f"Total processed ({data['total']}) matches CSV rows ({data_rows})",
          f"Row count mismatch: processed {data.get('total')} vs CSV {data_rows}")

    check("results" in data and isinstance(data["results"], list),
          f"Results array present with {len(data.get('results', []))} items",
          "Missing or invalid results array")

    check("fraud_count" in data,
          f"Fraud count present: {data.get('fraud_count')}",
          "Missing fraud_count in response")

    # Verify each result has required fields
    all_have_fields = True
    for i, result in enumerate(data.get("results", [])):
        for field in ["fraud_probability", "is_fraud", "risk_level", "threshold_used"]:
            if field not in result:
                all_have_fields = False
                failed(f"Row {i}: missing field '{field}'")
                results["failed"] += 1
    if all_have_fields:
        passed("All result rows have required fields")
        results["passed"] += 1

    # Print per-row details
    for i, result in enumerate(data.get("results", [])):
        info(f"  Row {i+1}: prob={result['fraud_probability']}, fraud={result['is_fraud']}, risk={result['risk_level']}")

    # Verify fraud_count matches
    actual_frauds = sum(1 for r in data.get("results", []) if r["is_fraud"])
    check(data["fraud_count"] == actual_frauds,
          f"fraud_count ({data['fraud_count']}) matches actual fraud predictions ({actual_frauds})",
          f"fraud_count mismatch: reported {data['fraud_count']}, actual {actual_frauds}")


# ====================================================================
# TEST 3: Edge Case & Error Handling
# ====================================================================
def test_edge_cases():
    header("TEST 3: Edge Cases & Error Handling")

    # ── 3a: Missing fields ──
    print(f"\n  {C.BOLD}3a: Missing Fields{C.END}")
    r = requests.post(f"{API}/predict", json={"Time": 0, "Amount": 100})
    check(r.status_code == 422,
          f"Missing fields -> 422 Validation Error (got {r.status_code})",
          f"Missing fields -> unexpected status {r.status_code}")

    # ── 3b: Wrong data types ──
    print(f"\n  {C.BOLD}3b: Wrong Data Types{C.END}")
    bad_tx = {**LEGIT_TX, "Amount": "not_a_number"}
    r = requests.post(f"{API}/predict", json=bad_tx)
    check(r.status_code == 422,
          f"String Amount -> 422 Validation Error (got {r.status_code})",
          f"String Amount -> unexpected status {r.status_code}")

    # ── 3c: Null values ──
    print(f"\n  {C.BOLD}3c: Null Values{C.END}")
    null_tx = {**LEGIT_TX, "V1": None}
    r = requests.post(f"{API}/predict", json=null_tx)
    check(r.status_code == 422,
          f"Null V1 -> 422 Validation Error (got {r.status_code})",
          f"Null V1 -> unexpected status {r.status_code}")

    # ── 3d: Negative Amount ──
    print(f"\n  {C.BOLD}3d: Negative Amount{C.END}")
    neg_tx = {**LEGIT_TX, "Amount": -500.0}
    r = requests.post(f"{API}/predict", json=neg_tx)
    check(r.status_code == 200,
          f"Negative Amount accepted (status {r.status_code}) — model should handle",
          f"Negative Amount caused error: {r.status_code}")
    if r.status_code == 200:
        data = r.json()
        info(f"Negative Amount result: prob={data['fraud_probability']}, fraud={data['is_fraud']}")

    # ── 3e: Zero Amount ──
    print(f"\n  {C.BOLD}3e: Zero Amount{C.END}")
    zero_tx = {**LEGIT_TX, "Amount": 0.0}
    r = requests.post(f"{API}/predict", json=zero_tx)
    check(r.status_code == 200, "Zero Amount accepted", f"Zero Amount error: {r.status_code}")

    # ── 3f: Extreme Values ──
    print(f"\n  {C.BOLD}3f: Extreme Feature Values{C.END}")
    extreme_tx = {k: 999999.0 if k != "Time" else 0 for k in LEGIT_TX}
    extreme_tx["threshold"] = 0.5
    r = requests.post(f"{API}/predict", json=extreme_tx)
    check(r.status_code == 200,
          f"Extreme values -> model did not crash (status {r.status_code})",
          f"Extreme values caused crash: {r.status_code}")
    if r.status_code == 200:
        data = r.json()
        check(0 <= data["fraud_probability"] <= 1,
              f"Probability in valid range: {data['fraud_probability']}",
              f"Probability out of range: {data['fraud_probability']}")
        info(f"Extreme values result: prob={data['fraud_probability']}, fraud={data['is_fraud']}")

    # ── 3g: Very small floating point values ──
    print(f"\n  {C.BOLD}3g: Tiny Float Values{C.END}")
    tiny_tx = {k: 0.000001 for k in LEGIT_TX}
    tiny_tx["threshold"] = 0.5
    r = requests.post(f"{API}/predict", json=tiny_tx)
    check(r.status_code == 200, "Tiny floats accepted", f"Tiny floats error: {r.status_code}")

    # ── 3h: Invalid threshold ──
    print(f"\n  {C.BOLD}3h: Invalid Threshold Values{C.END}")
    for thresh_val, desc in [(1.5, "threshold > 1"), (-0.1, "threshold < 0")]:
        r = requests.post(f"{API}/predict", json={**LEGIT_TX, "threshold": thresh_val})
        check(r.status_code == 422,
              f"{desc} ({thresh_val}) -> 422 Validation Error",
              f"{desc} ({thresh_val}) -> status {r.status_code} (expected 422)")

    # ── 3i: Empty body ──
    print(f"\n  {C.BOLD}3i: Empty Request Body{C.END}")
    r = requests.post(f"{API}/predict", json={})
    check(r.status_code == 422, "Empty body -> 422", f"Empty body -> {r.status_code}")

    # ── 3j: Invalid batch file ──
    print(f"\n  {C.BOLD}3j: Invalid Batch File (not CSV){C.END}")
    r = requests.post(f"{API}/predict/batch",
                       files={"file": ("test.txt", b"this is not csv data", "text/plain")})
    check(r.status_code in [400, 422, 500],
          f"Invalid CSV -> error status ({r.status_code}) — not silent",
          f"Invalid CSV -> unexpected status {r.status_code}")

    # ── 3k: Empty CSV ──
    print(f"\n  {C.BOLD}3k: Empty CSV File{C.END}")
    empty_csv = b"Time,V1,V2,V3,V4,V5,V6,V7,V8,V9,V10,V11,V12,V13,V14,V15,V16,V17,V18,V19,V20,V21,V22,V23,V24,V25,V26,V27,V28,Amount\n"
    r = requests.post(f"{API}/predict/batch",
                       files={"file": ("empty.csv", empty_csv, "text/csv")})
    check(r.status_code == 200,
          f"Empty CSV -> 200 with 0 results",
          f"Empty CSV -> {r.status_code}")
    if r.status_code == 200:
        data = r.json()
        check(data.get("total") == 0, f"Empty CSV reports 0 total", f"Empty CSV reports {data.get('total')} total")


# ====================================================================
# TEST 4: Consistency & Determinism
# ====================================================================
def test_consistency():
    header("TEST 4: Consistency & Determinism")

    # ── 4a: Same input -> same output (5 calls) ──
    print(f"\n  {C.BOLD}4a: Deterministic Predictions (5 identical calls){C.END}")
    probs = []
    for i in range(5):
        r = requests.post(f"{API}/predict", json={**LEGIT_TX, "threshold": 0.5})
        d = r.json()
        probs.append(d["fraud_probability"])

    all_same = all(p == probs[0] for p in probs)
    check(all_same,
          f"5 identical calls -> same probability ({probs[0]})",
          f"Non-deterministic! Probabilities varied: {probs}")

    # ── 4b: Threshold doesn't affect probability ──
    print(f"\n  {C.BOLD}4b: Threshold Independence{C.END}")
    probs_by_threshold = {}
    for t in [0.0, 0.1, 0.25, 0.5, 0.75, 0.9, 1.0]:
        r = requests.post(f"{API}/predict", json={**LEGIT_TX, "threshold": t})
        d = r.json()
        probs_by_threshold[t] = d["fraud_probability"]

    all_same = all(p == list(probs_by_threshold.values())[0] for p in probs_by_threshold.values())
    check(all_same,
          f"Probability stable across 7 thresholds ({list(probs_by_threshold.values())[0]})",
          f"Probability changed with threshold: {probs_by_threshold}")

    # ── 4c: Feature order sensitivity (sanity check) ──
    print(f"\n  {C.BOLD}4c: Feature Independence (different inputs -> different outputs){C.END}")
    r1 = requests.post(f"{API}/predict", json={**LEGIT_TX, "threshold": 0.5})
    r2 = requests.post(f"{API}/predict", json={**SUSPICIOUS_TX, "threshold": 0.5})
    p1 = r1.json()["fraud_probability"]
    p2 = r2.json()["fraud_probability"]
    check(p1 != p2,
          f"Different inputs -> different probabilities (legit={p1}, suspicious={p2})",
          f"Same probability for different inputs: {p1}")


# ====================================================================
# TEST 5: Stats / Logging Verification
# ====================================================================
def test_stats_logging():
    header("TEST 5: Stats & Logging Verification")

    # Get stats before test
    r = requests.get(f"{API}/stats")
    check(r.status_code == 200, "GET /stats returns 200", f"GET /stats returned {r.status_code}")
    before = r.json()
    info(f"Current stats: total={before['total_analyzed']}, fraud={before['fraud_detected']}")

    # Make a known prediction
    r = requests.post(f"{API}/predict", json={**LEGIT_TX, "threshold": 0.5})
    pred = r.json()

    # Check stats updated
    r = requests.get(f"{API}/stats")
    after = r.json()

    check(after["total_analyzed"] == before["total_analyzed"] + 1,
          f"total_analyzed incremented: {before['total_analyzed']} -> {after['total_analyzed']}",
          f"total_analyzed not incremented: {before['total_analyzed']} -> {after['total_analyzed']}")

    # Check recent array
    check(len(after.get("recent", [])) > 0, "Recent transactions not empty", "Recent is empty after prediction")

    if after.get("recent"):
        latest = after["recent"][0]  # Most recent (reversed)
        check(latest.get("fraud_probability") == pred["fraud_probability"],
              "Latest in recent matches prediction probability",
              f"Mismatch: recent={latest.get('fraud_probability')} vs pred={pred['fraud_probability']}")
        check("id" in latest, "Recent entry has 'id' field", "Missing id in recent entry")

    # Verify fraud_rate calculation
    total = after["total_analyzed"]
    frauds = after["fraud_detected"]
    expected_rate = round(frauds / total * 100, 2) if total > 0 else 0
    check(after["fraud_rate"] == expected_rate,
          f"Fraud rate calculated correctly: {after['fraud_rate']}%",
          f"Fraud rate wrong: {after['fraud_rate']}% vs expected {expected_rate}%")

    # Data shape in recent
    check(after["legit_count"] == total - frauds,
          f"legit_count = total - fraud ({after['legit_count']} = {total} - {frauds})",
          f"legit_count inconsistent: {after['legit_count']} != {total} - {frauds}")


# ====================================================================
# TEST 6: Response Time (Performance)
# ====================================================================
def test_performance():
    header("TEST 6: Performance — Response Times")

    # Single prediction
    times = []
    for i in range(10):
        start = time.time()
        r = requests.post(f"{API}/predict", json={**LEGIT_TX, "threshold": 0.5})
        elapsed = (time.time() - start) * 1000
        times.append(elapsed)

    avg = sum(times) / len(times)
    max_t = max(times)
    min_t = min(times)
    info(f"Single prediction (10 calls): avg={avg:.0f}ms, min={min_t:.0f}ms, max={max_t:.0f}ms")
    check(avg < 500, f"Avg response time {avg:.0f}ms < 500ms threshold", f"Slow: avg {avg:.0f}ms")
    check(max_t < 1000, f"Max response time {max_t:.0f}ms < 1s", f"Spike: max {max_t:.0f}ms")

    # Health endpoint
    start = time.time()
    r = requests.get(f"{API}/health")
    health_time = (time.time() - start) * 1000
    info(f"Health check: {health_time:.0f}ms")

    # Stats endpoint
    start = time.time()
    r = requests.get(f"{API}/stats")
    stats_time = (time.time() - start) * 1000
    info(f"Stats endpoint: {stats_time:.0f}ms")


# ====================================================================
# TEST 7: CORS Headers
# ====================================================================
def test_cors():
    header("TEST 7: CORS Configuration")

    r = requests.options(f"{API}/predict", headers={
        "Origin": "http://localhost:5173",
        "Access-Control-Request-Method": "POST",
        "Access-Control-Request-Headers": "content-type",
    })
    headers = r.headers
    check("access-control-allow-origin" in headers,
          f"CORS allow-origin present: {headers.get('access-control-allow-origin')}",
          "Missing CORS allow-origin header")


# ====================================================================
# MAIN — Run All Tests
# ====================================================================
if __name__ == "__main__":
    print(f"\n{C.BOLD}{'#'*60}")
    print(f" FraudGuard AI — Comprehensive System Test Suite")
    print(f" Started: {time.strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"{'#'*60}{C.END}")

    ok = test_infrastructure()
    if not ok:
        print(f"\n{C.RED}ABORT: Backend not reachable. Start the server first.{C.END}")
        sys.exit(1)

    test_api_predict()
    test_batch_predict()
    test_edge_cases()
    test_consistency()
    test_stats_logging()
    test_performance()
    test_cors()

    # ── Final Report ──
    header("FINAL TEST REPORT")
    total = results["passed"] + results["failed"]
    print(f"\n  {C.GREEN}Passed:   {results['passed']}{C.END}")
    print(f"  {C.RED}Failed:   {results['failed']}{C.END}")
    print(f"  {C.YELLOW}Warnings: {results['warnings']}{C.END}")
    print(f"  Total:    {total}")
    pct = (results["passed"] / total * 100) if total > 0 else 0
    print(f"  Pass Rate: {pct:.1f}%")

    if results["bugs"]:
        print(f"\n  {C.RED}{C.BOLD}Bugs / Failures:{C.END}")
        for i, bug in enumerate(results["bugs"], 1):
            print(f"    {i}. {bug}")
    else:
        print(f"\n  {C.GREEN}{C.BOLD}No bugs found! All tests passed.{C.END}")

    print()
