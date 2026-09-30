-- Precio de venta llevado a UF, para filtrar y ordenar ventas publicadas en UF o en pesos.
ALTER TABLE "Property" ADD COLUMN "precioRefUf" DECIMAL(12,2);

-- Hasta ahora toda venta tenía precio en UF: la referencia es ese mismo valor.
UPDATE "Property" SET "precioRefUf" = "precioUf" WHERE "tipoOperacion" = 'VENTA' AND "precioUf" IS NOT NULL;

CREATE INDEX "Property_precioRefUf_idx" ON "Property"("precioRefUf");
