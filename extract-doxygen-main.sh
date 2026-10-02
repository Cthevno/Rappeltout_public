#!/usr/bin/env bash

INPUT='README.md'
OUTPUT='sveltekit/src/doxygen-main.md'

extract-section () {
	awk "/^## ${1}/ {p=1; print; next} p && /^## / {exit} p" "$INPUT" >> "$OUTPUT"
}

echo '# Rappeltout' > "$OUTPUT"
extract-section 'Description'
extract-section 'Instructions'
extract-section 'Technical Stack'
extract-section 'Database Schema'
