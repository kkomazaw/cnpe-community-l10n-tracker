'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { AnalysisWithMetadata } from '@/lib/types/analysis.types';

interface ProgressChartProps {
  analyses: AnalysisWithMetadata[];
  languageNames: Record<string, string>;
  title?: string;
  description?: string;
}

export function ProgressChart({ analyses, languageNames, title, description }: ProgressChartProps) {
  const data = analyses.map((analysis) => ({
    language: languageNames[analysis.languageCode] || analysis.languageCode,
    content: analysis.contentCompletionRate,
    i18n: analysis.i18nCompletionRate,
  }));

  return (
    <Card>
      <CardHeader>
        {title && <CardTitle>{title}</CardTitle>}
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="language" />
            <YAxis domain={[0, 100]} />
            <Tooltip
              formatter={(value: number) => `${value.toFixed(2)}%`}
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '6px',
              }}
            />
            <Legend />
            <Bar dataKey="content" fill="hsl(var(--primary))" name="Content Completion" />
            <Bar dataKey="i18n" fill="hsl(var(--secondary))" name="i18n Completion" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
