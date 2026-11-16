#!/usr/bin/env bash
# Prints the environment variables the app needs to run payments through your deployed contracts.
# Run it from the project root AFTER deploy-testnet.sh. Paste the output into .env.local (never commit it).
set -euo pipefail
cd "$(dirname "$0")/../.."
NET=testnet
secret() { stellar keys secret "$1" 2>/dev/null || stellar keys show "$1"; }
WASM=contracts/target/wasm32v1-none/release/carepass_pass.wasm
[ -f "$WASM" ] || (cd contracts && stellar contract build >&2)
HASH=$(stellar contract upload --wasm "$WASM" --source cp-admin --network $NET)
read_json() { node -e "console.log(JSON.parse(require('fs').readFileSync('public/testnet.json','utf8')).$1)"; }
echo "CHAIN_ADMIN_SECRET=$(secret cp-admin)"
# Test-USDC mode (default): our own issuer mints funds. For Circle/anchor USDC, run with REAL_USDC=1 and set
# CHAIN_USDC_ISSUER from the anchor's stellar.toml (https://testanchor.stellar.org/.well-known/stellar.toml, USDC entry),
# then leave CHAIN_ISSUER_SECRET and CHAIN_TOKEN_ID out (the app derives the token contract from the issuer).
if [ "${REAL_USDC:-0}" != "1" ]; then echo "CHAIN_ISSUER_SECRET=$(secret cp-issuer)"; fi
echo "CHAIN_REGISTRY_ID=$(read_json registryId)"
if [ "${REAL_USDC:-0}" != "1" ]; then echo "CHAIN_TOKEN_ID=$(read_json tokenId)"; fi
echo "CHAIN_PASS_WASM_HASH=$HASH"
