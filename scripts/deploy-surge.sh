#!/usr/bin/env bash
set -euo pipefail
DOMAIN="${1:-natally.surge.sh}"
: "${VITE_CHAT_API_URL:?Set the deployed hosted chat endpoint}"
: "${SURGE_TOKEN:?Load the documented Surge deployment token}"
unset VITE_LLM_API_KEY VITE_LLM_BASE_URL VITE_LLM_MODEL VITE_GEMINI_API_KEY
npm run lint
npm run build
npx --yes surge dist "$DOMAIN" --token "$SURGE_TOKEN"
