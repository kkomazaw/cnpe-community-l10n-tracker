'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

export default function NewSitePage() {
  const router = useRouter();
  const t = useTranslations('sites');
  const tCommon = useTranslations('common');
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);

  const createCNPESite = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/sites', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'CNPE Community',
          repoOwner: 'Cloud-Native-Platform-Engineering',
          repoName: 'cnpe-community',
          branch: 'main',
          contentPath: 'website/content',
          i18nPath: 'website/i18n',
          baseLanguage: 'en',
          languages: [
            { code: 'ja', name: '日本語', nativeName: '日本語', weight: 1 },
            { code: 'ko', name: '韓国語', nativeName: '한국어', weight: 2 },
            { code: 'zh', name: '中国語', nativeName: '中文', weight: 3 },
            { code: 'de', name: 'ドイツ語', nativeName: 'Deutsch', weight: 4 },
            { code: 'es', name: 'スペイン語', nativeName: 'Español', weight: 5 },
            { code: 'fr', name: 'フランス語', nativeName: 'Français', weight: 6 },
          ],
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: tCommon('success'),
          description: 'CNPE Community site has been registered successfully',
        });

        // サイト詳細ページに遷移
        router.push(`/sites/${data.data.id}`);
      } else {
        toast({
          title: tCommon('error'),
          description: data.error?.message || 'Failed to create site',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: tCommon('error'),
        description: 'Network error occurred',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-10">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>{t('add')}</CardTitle>
            <CardDescription>Register CNPE Community site for L10N tracking</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <h3 className="font-semibold">CNPE Community</h3>
              <div className="text-sm text-muted-foreground space-y-1">
                <p>
                  <span className="font-medium">Repository:</span>{' '}
                  <code>Cloud-Native-Platform-Engineering/cnpe-community</code>
                </p>
                <p>
                  <span className="font-medium">Branch:</span> <code>main</code>
                </p>
                <p>
                  <span className="font-medium">Content Path:</span> <code>website/content</code>
                </p>
                <p>
                  <span className="font-medium">i18n Path:</span> <code>website/i18n</code>
                </p>
                <p>
                  <span className="font-medium">Base Language:</span> <code>en</code>
                </p>
                <p>
                  <span className="font-medium">Target Languages:</span> ja, ko, zh, de, es, fr
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={createCNPESite} disabled={loading}>
                {loading ? tCommon('loading') : 'Register CNPE Community'}
              </Button>
              <Button variant="outline" onClick={() => router.back()}>
                {tCommon('cancel')}
              </Button>
            </div>

            <div className="pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                <strong>Note:</strong> Make sure you have set the <code>GITHUB_TOKEN</code>{' '}
                environment variable in <code>.env.local</code> before registering a site.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
