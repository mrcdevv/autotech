import type { CannedJobDetailResponse } from "@/types/catalog";

export interface CannedJobServiceLine {
  serviceName: string;
  price: number;
}

export interface CannedJobProductLine {
  productName: string;
  quantity: number;
  unitPrice: number;
  productId?: number | null;
}

export interface AppliedCannedJob {
  services: CannedJobServiceLine[];
  products: CannedJobProductLine[];
}

/** Adds `applied` on top of `existing`: product lines pointing at the same product (by id, otherwise same name free-text lines) get their quantities summed; services always append. */
export function mergeCannedJobLines<TService extends CannedJobServiceLine, TProduct extends CannedJobProductLine>(
  existingServices: readonly TService[],
  existingProducts: readonly TProduct[],
  applied: AppliedCannedJob,
): { services: TService[]; products: TProduct[] } {
  const products: TProduct[] = existingProducts.map((p) => ({ ...p }));

  for (const line of applied.products) {
    const matchIndex = products.findIndex(
      (p) =>
        (line.productId != null && p.productId === line.productId) ||
        (line.productId == null && p.productId == null && p.productName === line.productName),
    );
    const match = matchIndex >= 0 ? products[matchIndex] : undefined;
    if (match) {
      products[matchIndex] = { ...match, quantity: match.quantity + line.quantity };
    } else {
      products.push({ ...line } as TProduct);
    }
  }

  return {
    services: [...existingServices, ...applied.services.map((s) => ({ ...s }) as TService)],
    products,
  };
}

/** Expands a canned job bundle into snapshot lines for the estimate/delivery-note grids. */
export function expandCannedJob(cannedJob: CannedJobDetailResponse): AppliedCannedJob {
  return {
    services: cannedJob.services.map((s) => ({ serviceName: s.serviceName, price: s.price })),
    products: cannedJob.products.map((p) => ({
      productName: p.productName,
      quantity: p.quantity,
      unitPrice: p.unitPrice,
      productId: p.productId ?? null,
    })),
  };
}
