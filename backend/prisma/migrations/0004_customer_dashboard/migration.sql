ALTER TABLE "ConsultationBooking" ADD COLUMN "selectedDesignId" TEXT;
ALTER TABLE "ConsultationBooking" ADD COLUMN "originalRoomUploadId" TEXT;
ALTER TABLE "ConsultationBooking" ADD COLUMN "aiConcept" TEXT;
ALTER TABLE "ConsultationBooking" ADD COLUMN "catalogueRecommendations" JSONB;
ALTER TABLE "ConsultationBooking" ADD COLUMN "customerPreferences" TEXT;
ALTER TABLE "ConsultationBooking" ADD COLUMN "budgetInfo" TEXT;
ALTER TABLE "ConsultationBooking" ADD COLUMN "chatSummary" TEXT;
ALTER TABLE "ConsultationBooking" ADD COLUMN "consentAt" TIMESTAMP(3);
ALTER TABLE "ConsultationBooking" ADD COLUMN "internalNotes" TEXT;

CREATE TABLE "DesignModification" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "designId" TEXT NOT NULL,
  "changes" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "DesignModification_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "DesignModification_userId_createdAt_idx" ON "DesignModification"("userId", "createdAt");
ALTER TABLE "DesignModification" ADD CONSTRAINT "DesignModification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DesignModification" ADD CONSTRAINT "DesignModification_designId_fkey" FOREIGN KEY ("designId") REFERENCES "GeneratedDesign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "AccountDeletionRequest" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "reason" TEXT,
  "status" TEXT NOT NULL DEFAULT 'REQUESTED',
  "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "processedAt" TIMESTAMP(3),
  CONSTRAINT "AccountDeletionRequest_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "AccountDeletionRequest_userId_key" ON "AccountDeletionRequest"("userId");
ALTER TABLE "AccountDeletionRequest" ADD CONSTRAINT "AccountDeletionRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
