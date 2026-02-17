'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import type { SiteWithLanguages } from '@/lib/types/site.types';
import type { AnalysisWithMetadata } from '@/lib/types/analysis.types';
import { exportAnalysisToCSV } from '@/lib/utils/csv-export';
import { Download } from 'lucide-react';

export default function SiteDetailPage() {
  const params = useParams();
  const router = useRouter();
  const t = useTranslations('siteDetail');
  const tAnalysis = useTranslations('analysis');
  const tCommon = useTranslations('common');
  const tLanguages = useTranslations('languages');

  const siteId = params.id as string;

  const [site, setSite] = useState<SiteWithLanguages | null>(null);
  const [analyses, setAnalyses] = useState<AnalysisWithMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSiteAndAnalysis();
  }, [siteId]);

  const fetchSiteAndAnalysis = async () => {
    try {
      setLoading(true);

      // サイト情報を取得
      const siteResponse = await fetch(`/api/sites/${siteId}`);
      const siteData = await siteResponse.json();

      if (!siteData.success) {
        setError(siteData.error?.message || 'Failed to fetch site');
        return;
      }

      setSite(siteData.data);

      // 分析結果を取得
      const analysisResponse = await fetch(`/api/sites/${siteId}/analysis`);
      const analysisData = await analysisResponse.json();

      if (analysisData.success) {
        setAnalyses(analysisData.data);
      }
    } catch (err) {
      setError('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const runAnalysis = async () => {
    try {
      setAnalyzing(true);
      const response = await fetch(`/api/sites/${siteId}/analyze`, {
        method: 'POST',
      });

      const data = await response.json();

      if (data.success) {
        // 分析結果を再取得
        await fetchSiteAndAnalysis();
      } else {
        setError(data.error?.message || 'Analysis failed');
      }
    } catch (err) {
      setError('Analysis failed');
    } finally {
      setAnalyzing(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-10">
        <p className="text-muted-foreground">{tCommon('loading')}</p>
      </div>
    );
  }

  if (error || !site) {
    return (
      <div className="container mx-auto py-10">
        <Card>
          <CardHeader>
            <CardTitle>{tCommon('error')}</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10">
      <div className="mb-8">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-bold tracking-tight">{site.name}</h1>
            <p className="text-muted-foreground mt-2">
              <code>
                {site.repoOwner}/{site.repoName}
              </code>{' '}
              • <Badge variant="outline">{site.branch}</Badge>
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={runAnalysis} disabled={analyzing}>
              {analyzing ? tAnalysis('runAnalysis') + '...' : tAnalysis('runAnalysis')}
            </Button>
            {analyses.length > 0 && (
              <Button
                variant="outline"
                onClick={() => exportAnalysisToCSV(site, analyses)}
              >
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            )}
            <Button variant="outline" onClick={() => router.back()}>
              {tCommon('back')}
            </Button>
          </div>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">{t('overview')}</TabsTrigger>
          <TabsTrigger value="analysis">{t('analysis')}</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('repository')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <span className="font-medium">Repository:</span>{' '}
                <code>
                  {site.repoOwner}/{site.repoName}
                </code>
              </div>
              <div>
                <span className="font-medium">{t('contentPath')}:</span> <code>{site.contentPath}</code>
              </div>
              <div>
                <span className="font-medium">{t('i18nPath')}:</span> <code>{site.i18nPath}</code>
              </div>
              <div>
                <span className="font-medium">{t('baseLanguage')}:</span>{' '}
                <Badge>{site.baseLanguage}</Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Languages</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 flex-wrap">
                {site.languages.map((lang) => (
                  <Badge key={lang.code} variant="secondary">
                    {tLanguages(lang.code)} ({lang.code})
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analysis" className="space-y-4">
          {analyses.length === 0 ? (
            <Card>
              <CardContent className="py-10">
                <div className="text-center">
                  <p className="text-muted-foreground">{tAnalysis('noData')}</p>
                  <Button onClick={runAnalysis} className="mt-4" disabled={analyzing}>
                    {tAnalysis('runAnalysis')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {analyses.map((analysis) => {
                const language = site.languages.find((l) => l.code === analysis.languageCode);
                return (
                  <Dialog key={analysis.id}>
                    <DialogTrigger asChild>
                      <Card className="cursor-pointer hover:bg-accent/50 transition-colors">
                        <CardHeader>
                          <CardTitle className="flex items-center justify-between">
                            {tLanguages(analysis.languageCode)}
                            <Badge>{analysis.languageCode}</Badge>
                          </CardTitle>
                          <CardDescription>
                            {new Date(analysis.analyzedAt).toLocaleString()}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div>
                            <div className="flex justify-between text-sm mb-2">
                              <span>{tAnalysis('contentCompletion')}</span>
                              <span className="font-medium">{analysis.contentCompletionRate}%</span>
                            </div>
                            <Progress value={analysis.contentCompletionRate} />
                            <p className="text-xs text-muted-foreground mt-1">
                              {analysis.translatedContentFiles} / {analysis.totalContentFiles} files
                            </p>
                          </div>

                          <div>
                            <div className="flex justify-between text-sm mb-2">
                              <span>{tAnalysis('i18nCompletion')}</span>
                              <span className="font-medium">{analysis.i18nCompletionRate}%</span>
                            </div>
                            <Progress value={analysis.i18nCompletionRate} />
                            <p className="text-xs text-muted-foreground mt-1">
                              {analysis.translatedI18nKeys} / {analysis.totalI18nKeys} keys
                            </p>
                          </div>

                          {analysis.missingContentFiles.length > 0 && (
                            <div>
                              <p className="text-sm font-medium mb-1">
                                {tAnalysis('missingFiles')} ({analysis.missingContentFiles.length})
                              </p>
                              <div className="text-xs text-muted-foreground max-h-20 overflow-y-auto">
                                {analysis.missingContentFiles.slice(0, 3).map((file, idx) => (
                                  <div key={idx}>{file}</div>
                                ))}
                                {analysis.missingContentFiles.length > 3 && (
                                  <div>...and {analysis.missingContentFiles.length - 3} more</div>
                                )}
                              </div>
                            </div>
                          )}

                          {analysis.missingI18nKeys.length > 0 && (
                            <div>
                              <p className="text-sm font-medium mb-1">
                                {tAnalysis('missingKeys')} ({analysis.missingI18nKeys.length})
                              </p>
                              <div className="text-xs text-muted-foreground max-h-20 overflow-y-auto">
                                {analysis.missingI18nKeys.slice(0, 3).map((key, idx) => (
                                  <div key={idx}><code>{key}</code></div>
                                ))}
                                {analysis.missingI18nKeys.length > 3 && (
                                  <div>...and {analysis.missingI18nKeys.length - 3} more</div>
                                )}
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </DialogTrigger>
                    <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>
                          {tLanguages(analysis.languageCode)} ({analysis.languageCode}) - {tAnalysis('title')}
                        </DialogTitle>
                        <DialogDescription>
                          {tAnalysis('analyzedAt')}: {new Date(analysis.analyzedAt).toLocaleString()}
                        </DialogDescription>
                      </DialogHeader>

                      <div className="space-y-6">
                        {/* コンテンツ完成率 */}
                        <div>
                          <h3 className="text-lg font-semibold mb-2">{tAnalysis('contentCompletion')}</h3>
                          <div className="flex justify-between text-sm mb-2">
                            <span>{tAnalysis('completionRate')}</span>
                            <span className="font-medium">{analysis.contentCompletionRate}%</span>
                          </div>
                          <Progress value={analysis.contentCompletionRate} />
                          <p className="text-sm text-muted-foreground mt-1">
                            {analysis.translatedContentFiles} / {analysis.totalContentFiles} files
                          </p>
                        </div>

                        {/* 未翻訳ファイル一覧 */}
                        {analysis.missingContentFiles.length > 0 && (
                          <div>
                            <h3 className="text-lg font-semibold mb-2">
                              {tAnalysis('missingFiles')} ({analysis.missingContentFiles.length})
                            </h3>
                            <div className="border rounded-md p-4 max-h-60 overflow-y-auto">
                              <ul className="space-y-1">
                                {analysis.missingContentFiles.map((file, idx) => (
                                  <li key={idx} className="text-sm font-mono">
                                    {file}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        )}

                        {/* i18n完成率 */}
                        <div>
                          <h3 className="text-lg font-semibold mb-2">{tAnalysis('i18nCompletion')}</h3>
                          <div className="flex justify-between text-sm mb-2">
                            <span>{tAnalysis('completionRate')}</span>
                            <span className="font-medium">{analysis.i18nCompletionRate}%</span>
                          </div>
                          <Progress value={analysis.i18nCompletionRate} />
                          <p className="text-sm text-muted-foreground mt-1">
                            {analysis.translatedI18nKeys} / {analysis.totalI18nKeys} keys
                          </p>
                        </div>

                        {/* 未翻訳キー一覧 */}
                        {analysis.missingI18nKeys.length > 0 && (
                          <div>
                            <h3 className="text-lg font-semibold mb-2">
                              {tAnalysis('missingKeys')} ({analysis.missingI18nKeys.length})
                            </h3>
                            <div className="border rounded-md p-4 max-h-60 overflow-y-auto">
                              <ul className="space-y-1">
                                {analysis.missingI18nKeys.map((key, idx) => (
                                  <li key={idx} className="text-sm">
                                    <code className="bg-muted px-1 py-0.5 rounded">{key}</code>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        )}

                        {/* 余分なキー一覧 */}
                        {analysis.extraI18nKeys.length > 0 && (
                          <div>
                            <h3 className="text-lg font-semibold mb-2">
                              {tAnalysis('extraKeys')} ({analysis.extraI18nKeys.length})
                            </h3>
                            <div className="border rounded-md p-4 max-h-60 overflow-y-auto">
                              <ul className="space-y-1">
                                {analysis.extraI18nKeys.map((key, idx) => (
                                  <li key={idx} className="text-sm">
                                    <code className="bg-muted px-1 py-0.5 rounded">{key}</code>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        )}
                      </div>
                    </DialogContent>
                  </Dialog>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
