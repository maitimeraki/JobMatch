-- CreateTable
CREATE TABLE "candidate_shortlists" (
    "id" TEXT NOT NULL,
    "recruiterId" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "jobId" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "candidate_shortlists_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "candidate_shortlists_recruiterId_idx" ON "candidate_shortlists"("recruiterId");

-- CreateIndex
CREATE UNIQUE INDEX "candidate_shortlists_recruiterId_candidateId_key" ON "candidate_shortlists"("recruiterId", "candidateId");

-- AddForeignKey
ALTER TABLE "candidate_shortlists" ADD CONSTRAINT "candidate_shortlists_recruiterId_fkey" FOREIGN KEY ("recruiterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "candidate_shortlists" ADD CONSTRAINT "candidate_shortlists_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "candidate_shortlists" ADD CONSTRAINT "candidate_shortlists_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "JobListing"("id") ON DELETE SET NULL ON UPDATE CASCADE;
