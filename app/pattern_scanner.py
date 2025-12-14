# app/pattern_scanner.py

import re
from app.patterns import SECRET_PATTERNS, PII_PATTERNS, IGNORE_MARKER

def scan_diff_for_patterns(diff_text):
    """
    Scans the git diff for regex matches.
    Only looks at added lines (+).
    Ignores lines with 'test-data' marker.
    """
    found_issues = []
    
    # Safety Check: If diff is empty or None, return empty list
    if not diff_text:
        return []

    # Combine both dictionaries to check everything at once
    ALL_PATTERNS = {**SECRET_PATTERNS, **PII_PATTERNS}

    # Split the diff into lines to check line-by-line
    lines = diff_text.split('\n')

    for line_num, line in enumerate(lines):
        # 1. Skip Metadata and Binary file warnings
        if line.startswith('Binary files'):
            continue

        # 2. Only check added lines (Git diffs start added lines with +)
        # We also skip lines starting with '+++' (File headers)
        if not line.startswith('+') or line.startswith('+++'):
            continue

        # 3. CHECK WHITELIST: If developer marked it as test data, skip it.
        if IGNORE_MARKER in line:
            continue

        # 4. Clean the line (remove the first '+') for accurate scanning
        clean_line = line[1:]
        
        # 5. Run Regex
        for rule_name, pattern in ALL_PATTERNS.items():
            try:
                if re.search(pattern, clean_line):
                    # Determine Severity based on dictionary source
                    severity = "CRITICAL" if rule_name in SECRET_PATTERNS else "HIGH"
                    
                    found_issues.append({
                        "type": "Pattern Violation",
                        "severity": severity,
                        "rule": rule_name,
                        "line": line_num,
                        "description": f"Detected potential {rule_name}",
                        "fix_code": "Use Environment Variables (os.environ) instead of hardcoding."
                    })
            except re.error:
                continue

    return found_issues