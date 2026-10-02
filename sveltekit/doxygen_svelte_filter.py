#!/usr/bin/env python3
import sys
import re

with open(sys.argv[1], 'r', encoding='utf-8') as f:
    content = f.read()

m = re.search(r'<script[^>]*>(.*?)</script>', content, re.DOTALL)
code = m.group(1) if m else content

# ---------------------------------------------------------------
# 1. JSDoc -> Doxygen : "@param task (Task)" becomes "@param task"
#    (it's the same @returns / @return)
# ---------------------------------------------------------------
code = re.sub(r'(@(?:param|returns?))\s*\{[^}]*\}', r'\1', code)

# ---------------------------------------------------------------
# 2. Remove typescript's types signatures from functions
#    "function f(choice: string, table: FilterOption[])"
#    becomes "function f(choice, table)"
# ---------------------------------------------------------------
TYPE = r'[\w$.]+(?:<[^<>]*>)?(?:\[\])*'                 # Task, string, Map<K,V>, FilterOption[]
TYPE_UNION = TYPE + r'(?:\s*\|\s*' + TYPE + r')*'       # string | null

def clean_signature(match):
    params = match.group('params')
    # Removes "?: Type" or ": Type" from each parameters
    params = re.sub(r'\??\s*:\s*' + TYPE_UNION, '', params)
    return match.group('head') + params + ')'

code = re.sub(
    r'(?P<head>function\s+[\w$]+\s*\()(?P<params>[^()]*)\)',
    clean_signature,
    code,
)

# return type : "): string {" -> ") {"  (et "): T =>" -> ") =>")
code = re.sub(r'\)\s*:\s*' + TYPE_UNION + r'(\s*(?:\{|=>))', r')\1', code)

print(code)
