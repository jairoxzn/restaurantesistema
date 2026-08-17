-- CreateEnum
CREATE TYPE "TipoAccion" AS ENUM ('LOGIN', 'COMPRA', 'COBRO', 'CAJA_APERTURA', 'CAJA_CIERRE', 'GASTO');

-- CreateTable
CREATE TABLE "registro_actividad" (
    "id" SERIAL NOT NULL,
    "usuario_id" INTEGER,
    "usuario_nombre" VARCHAR(100) NOT NULL,
    "accion" "TipoAccion" NOT NULL,
    "descripcion" TEXT NOT NULL,
    "ip" VARCHAR(64),
    "fecha" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "registro_actividad_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "registro_actividad_fecha_idx" ON "registro_actividad"("fecha");

-- CreateIndex
CREATE INDEX "registro_actividad_accion_idx" ON "registro_actividad"("accion");
