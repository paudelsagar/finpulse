export const TRANSACTION_TYPES = [
  { value: 'P2P', label: 'P2P' },
  { value: 'P2M', label: 'P2M' },
  { value: 'M2P', label: 'M2P' },
  { value: 'B2B', label: 'B2B' },
  { value: 'SELF', label: 'Self' },
];

export const PAYMENT_METHODS = [
  { value: 'QR', label: 'QR Scan' },
  { value: 'IBFT', label: 'IBFT' },
  { value: 'WALLET', label: 'Wallet' },
  { value: 'BANK_TRANSFER', label: 'Bank Transfer' },
  { value: 'CARD', label: 'Card' },
];

export const CHANNELS = [
  { value: 'Mobile', label: 'Mobile' },
  { value: 'Web', label: 'Web' },
  { value: 'POS', label: 'POS' },
  { value: 'API', label: 'API' },
];

export const TRANSACTION_STATUSES = [
  { value: 'SUCCESS', label: 'Success' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'FAILED', label: 'Failed' },
  { value: 'REVERSED', label: 'Reversed' },
];

export const FLOW_TYPES = [
    { value: 'credit', label: 'Credit (In)' },
    { value: 'debit', label: 'Debit (Out)' },
];
