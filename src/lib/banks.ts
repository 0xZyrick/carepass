/** Nigerian banks with their NIP/Paystack bank codes. */
export const BANK_CODES: Record<string, string> = {
  "Access Bank": "044", "GTBank": "058", "Zenith Bank": "057", "First Bank": "011", "UBA": "033",
  "Fidelity Bank": "070", "Stanbic IBTC": "221", "Wema Bank": "035",
};
export const BANKS = [...Object.keys(BANK_CODES), "Other"];
