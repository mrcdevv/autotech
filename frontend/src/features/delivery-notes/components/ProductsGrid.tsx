import { ProductLinesGrid } from "@/features/catalog/components/ProductLinesGrid";

import type { DeliveryNoteProductRequest } from "@/types/deliveryNote";

interface ProductsGridProps {
  products: DeliveryNoteProductRequest[];
  onChange: (products: DeliveryNoteProductRequest[]) => void;
  readonly?: boolean;
  showErrors?: boolean;
}

export function ProductsGrid(props: ProductsGridProps) {
  return <ProductLinesGrid {...props} />;
}
