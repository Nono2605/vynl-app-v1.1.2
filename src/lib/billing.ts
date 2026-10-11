// Facturation côté app auditeur : l'interrupteur et l'affichage d'un prix. La logique (Stripe,
// plans, paiements) est entièrement dans l'API ; ici on ne fait que demander une adresse de
// paiement et rediriger.

// Interrupteur : « on » pour montrer les boutons « Go Premium » et « Manage subscription ».
// Éteint par défaut : tant que les paiements ne sont pas ouverts, personne ne les voit.
export function billingEnabled(): boolean {
  return process.env.BILLING_UI === "on";
}

export interface BillingPlan {
  code: string;
  name: string;
  price_cents: number;
  currency: string;
  interval: string;
  tax_behavior: string;
  ad_supported: boolean;
  purchasable: boolean;
}

// 1000, "chf" → « CHF 10.00 ».
export function formatPrice(cents: number, currency: string): string {
  try {
    return new Intl.NumberFormat("en-CH", { style: "currency", currency: currency.toUpperCase() }).format(cents / 100);
  } catch {
    return `${(cents / 100).toFixed(2)} ${currency.toUpperCase()}`;
  }
}
