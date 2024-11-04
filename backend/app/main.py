from fastapi import FastAPI, Request
from app.api.routes.client_endpoints import router as client_router
from app.api.routes.vehicle_endpoints import router as vehicle_router

app = FastAPI(debug=True)

app.include_router(client_router, prefix="/clientes", tags=["Clientes"])
app.include_router(vehicle_router, prefix="/vehicles", tags=["Vehiculos"])
# Iniciar el servidor
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)