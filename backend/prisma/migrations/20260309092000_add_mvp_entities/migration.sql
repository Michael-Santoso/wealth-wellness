-- CreateEnum
CREATE TYPE "ProjectionCase" AS ENUM ('BASE', 'OPTIMISTIC', 'CONSERVATIVE');

-- CreateEnum
CREATE TYPE "UploadSource" AS ENUM ('MANUAL', 'CSV', 'AI_EXTRACT', 'WALLET');

-- CreateEnum
CREATE TYPE "UploadStatus" AS ENUM ('PENDING', 'PROCESSED', 'FAILED');

-- CreateTable
CREATE TABLE "asset_snapshots" (
    "id" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "price" DECIMAL(14,2) NOT NULL,
    "asOf" TIMESTAMP(3) NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'DEMO',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "asset_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projection_scenarios" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "portfolioId" TEXT,
    "scenario" "ProjectionCase" NOT NULL,
    "years" INTEGER NOT NULL DEFAULT 5,
    "expectedAnnualReturn" DECIMAL(5,2) NOT NULL,
    "expectedAnnualVol" DECIMAL(5,2),
    "monthlyContribution" DECIMAL(14,2) NOT NULL,
    "projectedEndingValue" DECIMAL(14,2) NOT NULL,
    "assumptions" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "projection_scenarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "upload_jobs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "portfolioId" TEXT,
    "source" "UploadSource" NOT NULL,
    "status" "UploadStatus" NOT NULL DEFAULT 'PENDING',
    "fileName" TEXT,
    "rawInput" TEXT,
    "parsedHoldings" JSONB,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "upload_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "asset_snapshots_assetId_asOf_key" ON "asset_snapshots"("assetId", "asOf");

-- CreateIndex
CREATE INDEX "asset_snapshots_asOf_idx" ON "asset_snapshots"("asOf");

-- CreateIndex
CREATE INDEX "projection_scenarios_userId_idx" ON "projection_scenarios"("userId");

-- CreateIndex
CREATE INDEX "projection_scenarios_portfolioId_idx" ON "projection_scenarios"("portfolioId");

-- CreateIndex
CREATE INDEX "projection_scenarios_scenario_idx" ON "projection_scenarios"("scenario");

-- CreateIndex
CREATE INDEX "upload_jobs_userId_idx" ON "upload_jobs"("userId");

-- CreateIndex
CREATE INDEX "upload_jobs_portfolioId_idx" ON "upload_jobs"("portfolioId");

-- CreateIndex
CREATE INDEX "upload_jobs_status_createdAt_idx" ON "upload_jobs"("status", "createdAt");

-- AddForeignKey
ALTER TABLE "asset_snapshots" ADD CONSTRAINT "asset_snapshots_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projection_scenarios" ADD CONSTRAINT "projection_scenarios_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projection_scenarios" ADD CONSTRAINT "projection_scenarios_portfolioId_fkey" FOREIGN KEY ("portfolioId") REFERENCES "portfolios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "upload_jobs" ADD CONSTRAINT "upload_jobs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "upload_jobs" ADD CONSTRAINT "upload_jobs_portfolioId_fkey" FOREIGN KEY ("portfolioId") REFERENCES "portfolios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
