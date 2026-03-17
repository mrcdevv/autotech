import { useState } from "react";

import { Box, Typography, Button, TextField, Alert, Snackbar, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";

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
    <Box sx={{ px: 3, py: 2.5 }}>
      <Typography variant="h3" sx={{ mb: 2 }}>
        Productos
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2, gap: 2 }}>
        <TextField
          placeholder="Buscar por nombre o descripción..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setPage(0);
          }}
          size="small"
          sx={{ minWidth: 300 }}
        />
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleCreate}>
          Agregar producto
        </Button>
      </Box>

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

      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Confirmar eliminación</DialogTitle>
        <DialogContent>
          <DialogContentText>
            ¿Estás seguro de que deseas eliminar este producto? Esta acción no se puede deshacer.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancelar</Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>

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
    </Box>
  );
}
