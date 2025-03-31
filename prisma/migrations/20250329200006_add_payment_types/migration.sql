-- CreateEnum
CREATE TYPE "PaymentType" AS ENUM ('TUITION', 'INSCRIPTION', 'OPTIONAL');

-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "description" TEXT,
ADD COLUMN     "paymentType" "PaymentType" NOT NULL DEFAULT 'TUITION',
ALTER COLUMN "forMonth" DROP NOT NULL;
