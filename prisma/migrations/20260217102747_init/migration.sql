-- CreateTable
CREATE TABLE "Site" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "repoOwner" TEXT NOT NULL,
    "repoName" TEXT NOT NULL,
    "branch" TEXT NOT NULL DEFAULT 'main',
    "contentPath" TEXT NOT NULL,
    "i18nPath" TEXT NOT NULL,
    "configPath" TEXT,
    "baseLanguage" TEXT NOT NULL DEFAULT 'en',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Site_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Language" (
    "id" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nativeName" TEXT,
    "weight" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Language_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Analysis" (
    "id" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "languageCode" TEXT NOT NULL,
    "totalContentFiles" INTEGER NOT NULL,
    "translatedContentFiles" INTEGER NOT NULL,
    "contentCompletionRate" DOUBLE PRECISION NOT NULL,
    "missingContentFiles" TEXT NOT NULL,
    "totalI18nKeys" INTEGER NOT NULL DEFAULT 0,
    "translatedI18nKeys" INTEGER NOT NULL DEFAULT 0,
    "i18nCompletionRate" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "missingI18nKeys" TEXT NOT NULL DEFAULT '[]',
    "extraI18nKeys" TEXT NOT NULL DEFAULT '[]',
    "analyzedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "durationMs" INTEGER,
    "errorMessage" TEXT,

    CONSTRAINT "Analysis_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Site_name_key" ON "Site"("name");

-- CreateIndex
CREATE INDEX "Site_repoOwner_repoName_idx" ON "Site"("repoOwner", "repoName");

-- CreateIndex
CREATE INDEX "Language_siteId_idx" ON "Language"("siteId");

-- CreateIndex
CREATE UNIQUE INDEX "Language_siteId_code_key" ON "Language"("siteId", "code");

-- CreateIndex
CREATE INDEX "Analysis_siteId_languageCode_idx" ON "Analysis"("siteId", "languageCode");

-- CreateIndex
CREATE INDEX "Analysis_analyzedAt_idx" ON "Analysis"("analyzedAt");

-- AddForeignKey
ALTER TABLE "Language" ADD CONSTRAINT "Language_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Analysis" ADD CONSTRAINT "Analysis_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE CASCADE ON UPDATE CASCADE;
