# CarePass Soroban contracts (Stellar **testnet** demo)

| Contract | Purpose |
|---|---|
| `registry` | Verified-merchant whitelist. Only the registry admin can add/remove clinics. |
| `pass` | One vault per family member. Holds the USDC. The beneficiary can only `pay` whitelisted merchants within the rules; the sponsor sets rules, freezes the pass, and can withdraw unspent funds. |

Rules enforced by `pass.pay` (in order): pass not frozen → merchant on whitelist → care type allowed → ≤ per-payment cap → ≤ rolling 30-day limit → enough balance. A failed check reverts the whole transaction, so no funds move.
`pass.check_payment` runs the same checks read-only (the app uses it to show *why* something would be blocked).

## Test (no network needed)
```bash
cd contracts && cargo test        # 17 tests
```

## Deploy to testnet
```bash
rustup target add wasm32v1-none
cargo install --locked stellar-cli
./scripts/deploy-testnet.sh       # creates throwaway keys, deploys, whitelists clinics, writes ../public/testnet.json
npm run dev                       # (restart it if it was running) then open http://localhost:3000/guardrails — a "Live · Stellar testnet" panel appears
```
Delete `public/testnet.json` to return the app to fully simulated mode.

## Status / caveats
- **Unaudited. Testnet only. Never put a real key in `public/testnet.json`.**
- The deploy script and the in-browser `pay` transaction were written against the Stellar docs but could not be run in the build sandbox (no access to the test network). The contract logic itself is covered by the unit tests above. If a command fails on your machine, the CLI flags are the first suspect — paste the error and it is a quick fix.
- Blocked payments revert on-chain, so a *blocked attempt* leaves no on-chain record; the app logs it from the failed simulation.
- The asset is a self-issued test `USDC`, not Circle's. On mainnet the token address would be Circle's USDC contract.
