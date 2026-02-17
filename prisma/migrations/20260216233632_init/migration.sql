-- CreateTable
CREATE TABLE "Site" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "repoOwner" TEXT NOT NULL,
    "repoName" TEXT NOT NULL,
    "branch" TEXT NOT NULL DEFAULT 'main',
    "contentPath" TEXT NOT NULL,
    "i18nPath" TEXT NOT NULL,
    "configPath" TEXT,
    "baseLanguage" TEXT NOT NULL DEFAULT 'en',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Language" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "siteId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nativeName" TEXT,
    "weight" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Language_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Analysis" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "siteId" TEXT NOT NULL,
    "languageCode" TEXT NOT NULL,
    "totalContentFiles" INTEGER NOT NULL,
    "translatedContentFiles" INTEGER NOT NULL,
    "contentCompletionRate" REAL NOT NULL,
    "missingContentFiles" TEXT NOT NULL,
    "totalI18nKeys" INTEGER NOT NULL DEFAULT 0,
    "translatedI18nKeys" INTEGER NOT NULL DEFAULT 0,
    "i18nCompletionRate" REAL NOT NULL DEFAULT 0.0,
    "missingI18nKeys" TEXT NOT NULL DEFAULT '[]',
    "extraI18nKeys" TEXT NOT NULL DEFAULT '[]',
    "analyzedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "durationMs" INTEGER,
    "errorMessage" TEXT,
    CONSTRAINT "Analysis_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site" ("id") ON DELETE CASCADE ON UPDATE CASCADE
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
