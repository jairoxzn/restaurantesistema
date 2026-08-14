-- AlterTable
ALTER TABLE "caja_sesiones" ADD COLUMN     "desglose_declarado" JSONB,
ADD COLUMN     "desglose_esperado" JSONB;
