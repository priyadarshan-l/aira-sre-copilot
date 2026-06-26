#!/bin/bash
# run_frontend.sh - Start the Next.js frontend SRE Dashboard

echo "=========================================================="
echo "          Starting AIRA Next.js SRE Dashboard"
echo "=========================================================="

cd "SRE Dashboard" || exit 1
npm run dev
