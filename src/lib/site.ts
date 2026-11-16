/** Contact details used on the legal pages and footer. Change before launch. */
export const CONTACT_EMAIL = "hello@carepass.app";
export const COMPANY = "CarePass";
export const UPDATED = "15 November 2026";

/** Where network receipts open. Change to the public network address when going live. */
export const EXPLORER = "https://stellar.expert/explorer/testnet";
export const receiptUrl = (hash: string) => `${EXPLORER}/tx/${hash}`;
export const contractUrl = (id: string) => `${EXPLORER}/contract/${id}`;
