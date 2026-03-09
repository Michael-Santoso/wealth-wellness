const ASSET_TYPES = new Set(["STOCK", "ETF", "BOND", "CASH", "CRYPTO", "OTHER"] as const);

export type HoldingAssetType = "STOCK" | "ETF" | "BOND" | "CASH" | "CRYPTO" | "OTHER";

export type RawHoldingInput = {
  symbol: unknown;
  name: unknown;
  assetType: unknown;
  currency?: unknown;
  quantity: unknown;
  averageCost: unknown;
  currentPrice?: unknown;
};

export type NormalizedHoldingInput = {
  symbol: string;
  name: string;
  assetType: HoldingAssetType;
  currency: string;
  quantity: number;
  averageCost: number;
  currentPrice: number;
};

function toNumber(value: unknown, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function round(value: number, digits: number) {
  return Number(value.toFixed(digits));
}

function normalizeAssetType(value: unknown): HoldingAssetType {
  const normalized = String(value ?? "OTHER")
    .trim()
    .toUpperCase() as HoldingAssetType;
  return ASSET_TYPES.has(normalized) ? normalized : "OTHER";
}

function normalizeCurrency(value: unknown, fallbackCurrency: string) {
  const candidate = String(value ?? "")
    .trim()
    .toUpperCase();
  if (candidate.length === 3) {
    return candidate;
  }
  return fallbackCurrency;
}

function normalizeSymbol(value: unknown) {
  return String(value ?? "")
    .trim()
    .toUpperCase();
}

function normalizeName(value: unknown, symbol: string) {
  const candidate = String(value ?? "").trim();
  return candidate.length > 0 ? candidate : symbol;
}

export const holdingsNormalizationService = {
  normalizeHolding(input: RawHoldingInput, baseCurrency = "USD"): NormalizedHoldingInput {
    const fallbackCurrency = baseCurrency.trim().toUpperCase() || "USD";
    const symbol = normalizeSymbol(input.symbol);
    const averageCost = Math.max(0, round(toNumber(input.averageCost, 0), 2));
    const currentPrice = Math.max(0, round(toNumber(input.currentPrice, averageCost), 2));

    return {
      symbol,
      name: normalizeName(input.name, symbol),
      assetType: normalizeAssetType(input.assetType),
      currency: normalizeCurrency(input.currency, fallbackCurrency),
      quantity: Math.max(0, round(toNumber(input.quantity, 0), 6)),
      averageCost,
      currentPrice,
    };
  },

  normalizeHoldings(inputs: RawHoldingInput[], baseCurrency = "USD"): NormalizedHoldingInput[] {
    return inputs
      .map((item) => this.normalizeHolding(item, baseCurrency))
      .filter((item) => item.symbol.length > 0 && item.quantity > 0);
  },
};

