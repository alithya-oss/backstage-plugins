#!/usr/bin/env bash

# Define bold text
BOLD=$(printf '\033[1m')
RESET=$(printf '\033[0m')

printf "\n${BOLD}Docker Compose Down -- Dry-Run${RESET}\n\n"

docker compose down --rmi all -v --dry-run
echo ""

# Prompt for confirmation
read -p "${BOLD}This will delete your database container and all of its data. Are you sure?${RESET} (y/n): " response

# Convert response to lowercase
response=$(echo "$response" | tr '[:upper:]' '[:lower:]')

# Check the response
if [[ "$response" == "y" || "$response" == "yes" ]]; then
    echo "Proceeding..."
    docker compose down --rmi all -v
else
    echo "Aborting."
    exit 1
fi
