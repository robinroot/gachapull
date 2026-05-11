import crypto from "crypto";
import { db, paymentSettingsTable } from "@workspace/db";

export interface DuitkuConfig {
  merchantCode: string;
  apiKey: string;
  isProduction: boolean;
}

export interface CreateInvoiceParams {
  merchantOrderId: string;
  paymentAmount: number;
  productDetails: string;
  email: string;
  customerVaName: string;
  paymentMethod: string;
  returnUrl: string;
  callbackUrl: string;
  expiryPeriod?: number;
}

export interface DuitkuInvoiceResponse {
  paymentUrl: string;
  reference: string;
  vaNumber?: string;
  qrString?: string;
  statusCode: string;
  statusMessage: string;
}

export const DUITKU_METHODS: Record<string, { code: string; label: string }> = {
  qris:       { code: "NQ", label: "QRIS" },
  gopay:      { code: "GZ", label: "GoPay" },
  ovo:        { code: "OV", label: "OVO" },
  dana:       { code: "DA", label: "DANA" },
  shopeepay:  { code: "SP", label: "ShopeePay" },
  bca:        { code: "BC", label: "Transfer BCA" },
  bni:        { code: "I1", label: "Transfer BNI" },
  bri:        { code: "BR", label: "Transfer BRI" },
  mandiri:    { code: "M2", label: "Transfer Mandiri" },
  bsi:        { code: "SY", label: "Transfer BSI" },
};

function getBaseUrl(isProduction: boolean) {
  return isProduction
    ? "https://api.duitku.com/api/merchant"
    : "https://api-sandbox.duitku.com/api/merchant";
}

export function makeSignature(merchantCode: string, merchantOrderId: string, paymentAmount: number, apiKey: string): string {
  return crypto.createHash("md5")
    .update(`${merchantCode}${merchantOrderId}${paymentAmount}${apiKey}`)
    .digest("hex");
}

export function verifyCallbackSignature(
  merchantCode: string,
  amount: string,
  merchantOrderId: string,
  apiKey: string,
  signature: string,
): boolean {
  const expected = crypto.createHash("md5")
    .update(`${merchantCode}${amount}${merchantOrderId}${apiKey}`)
    .digest("hex");
  return expected === signature;
}

export async function createDuitkuInvoice(
  config: DuitkuConfig,
  params: CreateInvoiceParams,
): Promise<DuitkuInvoiceResponse> {
  const baseUrl = getBaseUrl(config.isProduction);
  const signature = makeSignature(config.merchantCode, params.merchantOrderId, params.paymentAmount, config.apiKey);

  const body = {
    merchantCode: config.merchantCode,
    paymentAmount: params.paymentAmount,
    merchantOrderId: params.merchantOrderId,
    productDetails: params.productDetails,
    email: params.email,
    customerVaName: params.customerVaName,
    paymentMethod: params.paymentMethod,
    returnUrl: params.returnUrl,
    callbackUrl: params.callbackUrl,
    signature,
    expiryPeriod: params.expiryPeriod ?? 60,
  };

  const response = await fetch(`${baseUrl}/v2/inquiry`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = await response.json();

  if (!response.ok || data.statusCode !== "00") {
    throw new Error(`Duitku error: ${data.statusMessage || response.statusText}`);
  }

  return data as DuitkuInvoiceResponse;
}

export async function getDuitkuConfig(): Promise<DuitkuConfig | null> {
  const rows = await db.select().from(paymentSettingsTable);
  const map: Record<string, string> = {};
  for (const row of rows) map[row.key] = row.value;

  const merchantCode = map["duitku_merchant_code"] || "";
  const apiKey = map["duitku_api_key"] || "";
  const enabled = map["duitku_enabled"] === "true";
  const isProduction = map["duitku_is_production"] === "true";

  if (!enabled || !merchantCode || !apiKey) return null;
  return { merchantCode, apiKey, isProduction };
}
