-- CreateTable
CREATE TABLE "Testimonial" (
    "id" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "quote" TEXT NOT NULL,
    "projectId" TEXT,
    "rating" INTEGER,
    "status" "PublicationStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Testimonial_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Testimonial_status_createdAt_idx" ON "Testimonial"("status", "createdAt");

-- AddForeignKey
ALTER TABLE "Testimonial" ADD CONSTRAINT "Testimonial_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;
