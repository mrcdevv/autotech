import { useState } from "react";

import { Button, Alert, Snackbar } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";

import { AppConfirmDialog } from "@/components/AppConfirmDialog";
import { AppSearchField } from "@/components/AppSearchField";
import { PageShell } from "@/components/PageShell";
import { PageToolbar } from "@/components/PageToolbar";
import { useProducts } from "@/features/catalog/hooks/useProducts";
import { ProductsDataGrid } from "@/features/catalog/components/ProductsDataGrid";
import { ProductFormDialog } from "@/features/catalog/components/ProductFormDialog";

import type { ProductResponse, ProductRequest } from "@/types/catalog";

export default function ProductsPage() {
  const {
    products,
    loading,
    error,
    totalCount,
    page,
    setPage,
    pageSize,
    setPageSize,
    query,
    setQuery,
    createProduct,
    updateProduct,
    deleteProduct,
  } = useProducts();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductResponse | null>(null);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: "success" | "error" }>({
    open: false,
    message: "",
    severity: "success",
  });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<number | null>(null);

  const showSnackbar = (message: string, severity: "success" | "error") => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCreate = () => {
    setEditingProduct(null);
    setDialogOpen(true);
  };

  const handleEdit = (id: number) => {
    const product = products.find((p) => p.id === id);
    if (product) {
      setEditingProduct(product);
      setDialogOpen(true);
    }
  };

  const handleSave = async (data: ProductRequest) => {
    try {
      if (editingProduct) {
        await updateProduct(editingProduct.id, data);
        showSnackbar("Producto actualizado", "success");
      } else {
        await createProduct(data);
        showSnackbar("Producto creado", "success");
      }
      setDialogOpen(false);
    } catch {
      showSnackbar("Error al guardar el producto", "error");
    }
  };

  const confirmDelete = (id: number) => {
    setProductToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (productToDelete === null) return;
    try {
      await deleteProduct(productToDelete);
      showSnackbar("Producto eliminado", "success");
    } catch {
      showSnackbar("Error al eliminar el producto", "error");
    } finally {
      setDeleteDialogOpen(false);
      setProductToDelete(null);
    }
  };

  return (
    <PageShell title="Productos">
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <PageToolbar
        filters={
          <AppSearchField
            placeholder="Buscar por nombre o descripción..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(0);
            }}
          />
        }
        actions={
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleCreate}>
            Agregar producto
          </Button>
        }
      />

      <ProductsDataGrid
        rows={products}
        loading={loading}
        totalCount={totalCount}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        onEditRow={handleEdit}
        onDeleteRow={confirmDelete}
      />

      <ProductFormDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSave={handleSave}
        initialData={editingProduct}
      />

      <AppConfirmDialog
        open={deleteDialogOpen}
        title="Eliminar producto"
        message="¿Estás seguro de que deseas eliminar este producto? Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
        destructive
        onConfirm={handleDelete}
        onCancel={() => setDeleteDialogOpen(false)}
      />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
          severity={snackbar.severity}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </PageShell>
  );
}
