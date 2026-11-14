#!/usr/bin/env bash
# Deploys the CarePass contracts to Stellar TESTNET and writes ../public/testnet.json for the app.
# Needs: Rust + `rustup target add wasm32v1-none`, and the Stellar CLI (`cargo install --locked stellar-cli`).
# TESTNET ONLY — every key created here is a throwaway.
set -euo pipefail
cd "$(dirname "$0")/.."

NET=testnet
RPC=https://soroban-testnet.stellar.org
PASSPHRASE="Test SDF Network ; September 2015"
USDC=10000000 # 1 USDC in 7-decimal base units
say() { printf "\n\033[1;32m▸ %s\033[0m\n" "$*"; }

say "1/7 Creating and funding test accounts (Friendbot)"
for k in cp-admin cp-issuer cp-sponsor cp-family cp-clinic1 cp-clinic2 cp-clinic3; do
  stellar keys address "$k" >/dev/null 2>&1 || stellar keys generate "$k" --network $NET --fund
done
ADMIN=$(stellar keys address cp-admin);     ISSUER=$(stellar keys address cp-issuer)
SPONSOR=$(stellar keys address cp-sponsor); FAMILY=$(stellar keys address cp-family)
C1=$(stellar keys address cp-clinic1); C2=$(stellar keys address cp-clinic2); C3=$(stellar keys address cp-clinic3)

say "2/7 Building contracts"
stellar contract build
WASM=target/wasm32v1-none/release

say "3/7 Creating the test USDC token (issued by a throwaway test issuer)"
ASSET="USDC:$ISSUER"
stellar contract asset deploy --asset "$ASSET" --source cp-issuer --network $NET >/dev/null 2>&1 || true
TOKEN=$(stellar contract id asset --asset "$ASSET" --network $NET)
for k in cp-clinic1 cp-clinic2 cp-clinic3; do   # clinics are normal accounts, so they need a trustline to receive USDC
  stellar tx new change-trust --line "$ASSET" --source "$k" --network $NET >/dev/null
done

say "4/7 Deploying the merchant registry"
REGISTRY=$(stellar contract deploy --wasm $WASM/carepass_registry.wasm --source cp-admin --network $NET -- --admin "$ADMIN")

say "5/7 Whitelisting verified clinics (0 hospital · 1 lab · 2 pharmacy)"
add() { stellar contract invoke --id "$REGISTRY" --source cp-admin --network $NET -- add_merchant --merchant "$1" --name "$2" --category "$3" >/dev/null; }
add "$C1" "Lagoon Hospital" 0
add "$C2" "HealthPlus Pharmacy" 2
add "$C3" "PathCare Diagnostics" 1

say "6/7 Deploying the pass for the demo family member (\$300/month, \$150/payment, hospital + pharmacy only)"
PASS=$(stellar contract deploy --wasm $WASM/carepass_pass.wasm --source cp-sponsor --network $NET -- \
  --sponsor "$SPONSOR" --beneficiary "$FAMILY" --token "$TOKEN" --registry "$REGISTRY" \
  --monthly_limit $((300*USDC)) --per_tx_limit $((150*USDC)) --allowed_mask 5)
stellar contract invoke --id "$TOKEN" --source cp-issuer --network $NET -- mint --to "$PASS" --amount $((200*USDC)) >/dev/null

say "7/7 Writing ../public/testnet.json"
mkdir -p ../public
cat > ../public/testnet.json <<JSON
{
  "network": "testnet",
  "rpcUrl": "$RPC",
  "passphrase": "$PASSPHRASE",
  "passId": "$PASS",
  "registryId": "$REGISTRY",
  "tokenId": "$TOKEN",
  "decimals": 7,
  "sourcePublic": "$ADMIN",
  "familySecret": "$(stellar keys secret cp-family)",
  "merchants": [
    { "name": "Lagoon Hospital",      "category": 0, "address": "$C1" },
    { "name": "HealthPlus Pharmacy",  "category": 2, "address": "$C2" },
    { "name": "PathCare Diagnostics", "category": 1, "address": "$C3" }
  ]
}
JSON
printf "\nDone.\n  Pass:     https://stellar.expert/explorer/testnet/contract/%s\n  Registry: https://stellar.expert/explorer/testnet/contract/%s\nRestart the app and open /guardrails.\n" "$PASS" "$REGISTRY"
