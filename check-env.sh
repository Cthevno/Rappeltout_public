#!/usr/bin/env bash

echo "Checking env file..."

error() {
	echo "Error: ${1}"
	exit 1
}

if [[ ! -e ".env" ]]; then
	 error ".env file is missing."
elif [[ ! -f ".env" ]]; then
	 error ".env must be a file."
elif [[ ! -r ".env" ]]; then
	 error ".env must be readable."
fi

# All the needed env vars must be stored in this array.
VARIABLES=(
	"POSTGRES_DB"
	"POSTGRES_USER"
	"POSTGRES_PASSWORD"
	"DATABASE_URL"
	"EMAIL_USER"
	"EMAIL_PASS"
	"GOOGLE_CLIENT_ID"
	"GOOGLE_SECRET_ID"
	"GOOGLE_REDIRECT_URI"
)

CHECK="ok"
for var in "${VARIABLES[@]}"; do
	# Check if the variable is set excluding commented lines.
	if ! grep -E "^([^#].*)?^\s*${var}=.+$" ".env" &>/dev/null; then
		echo "Error: ${var} variable not or incorrectly set"
		CHECK="ko";
	fi
done

if [[ "${CHECK}" == "ok" ]]; then
	echo ".env file is correctly set"
else
	error "missing variables in .env"
fi
