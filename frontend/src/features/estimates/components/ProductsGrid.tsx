import { ProductLinesGrid } from "@/features/catalog/components/ProductLinesGrid";

import type { EstimateProductRequest } from "@/types/estimate";

interface ProductsGridProps {
  products: EstimateProductRequest[];
  onChange: (products: EstimateProductRequest[]) => void;
  readonly?: boolean;
  showErrors?: boolean;
}

export function ProductsGrid(props: ProductsGridProps) {
  return <ProductLinesGrid {...props} />;
}
