/*
  Warnings:

  - You are about to alter the column `billingType` on the `Payment` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Enum(EnumId(0))`.

*/
-- AlterTable
ALTER TABLE `Payment` MODIFY `billingType` ENUM('BILL', 'CREDIT_CARD', 'PIX') NOT NULL;
