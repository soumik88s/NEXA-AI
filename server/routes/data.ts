import { Router } from 'express';
import { authenticate } from './auth';
import { getAIProvider } from '../providers/ai/index';

export const dataRouter = Router();

// Helper: parse raw CSV to array of objects
function parseCsv(raw: string): any[] {
  const lines = raw.trim().split('\n').filter((l) => l.trim().length > 0);
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map((h) => h.trim().replace(/^["']|["']$/g, ''));
  const rows: any[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map((v) => v.trim().replace(/^["']|["']$/g, ''));
    const row: Record<string, any> = {};
    headers.forEach((h, idx) => {
      const rawVal = values[idx];
      if (rawVal === undefined || rawVal === '') {
        row[h] = null;
      } else if (!isNaN(Number(rawVal)) && rawVal.trim() !== '') {
        row[h] = Number(rawVal);
      } else {
        row[h] = rawVal;
      }
    });
    rows.push(row);
  }
  return rows;
}

// POST /api/data/analyze
dataRouter.post('/analyze', authenticate, async (req: any, res) => {
  try {
    let { data, rawText, filename } = req.body;

    if (!data && rawText) {
      if (rawText.trim().startsWith('[') || rawText.trim().startsWith('{')) {
        try {
          const parsed = JSON.parse(rawText);
          data = Array.isArray(parsed) ? parsed : [parsed];
        } catch {
          data = parseCsv(rawText);
        }
      } else {
        data = parseCsv(rawText);
      }
    }

    if (!Array.isArray(data) || data.length === 0) {
      return res.status(400).json({ error: 'No structured data provided to analyze' });
    }

    const rows = data.length;
    const columns = Object.keys(data[0] || {});
    const totalCells = rows * columns.length;

    // Detect duplicates
    const stringifiedRows = data.map((r) => JSON.stringify(r));
    const uniqueRowsCount = new Set(stringifiedRows).size;
    const duplicateCount = rows - uniqueRowsCount;

    let totalMissing = 0;
    const columnStats: Record<string, any> = {};

    columns.forEach((col) => {
      const values = data.map((d) => d[col]);
      const missing = values.filter((v) => v === null || v === undefined || v === '').length;
      totalMissing += missing;

      // Check numeric
      const numericVals = values
        .filter((v) => v !== null && v !== undefined && v !== '')
        .map((v) => Number(v))
        .filter((v) => !isNaN(v));

      const isNumeric = numericVals.length > values.length * 0.7;

      if (isNumeric && numericVals.length > 0) {
        numericVals.sort((a, b) => a - b);
        const sum = numericVals.reduce((acc, v) => acc + v, 0);
        const mean = sum / numericVals.length;
        const min = numericVals[0];
        const max = numericVals[numericVals.length - 1];
        const median = numericVals[Math.floor(numericVals.length / 2)];

        // IQR outlier detection
        const q1 = numericVals[Math.floor(numericVals.length * 0.25)];
        const q3 = numericVals[Math.floor(numericVals.length * 0.75)];
        const iqr = q3 - q1;
        const lowerBound = q1 - 1.5 * iqr;
        const upperBound = q3 + 1.5 * iqr;
        const outliers = numericVals.filter((v) => v < lowerBound || v > upperBound);

        columnStats[col] = {
          name: col,
          type: 'numeric',
          total: rows,
          missing,
          missingRate: Number(((missing / rows) * 100).toFixed(1)),
          mean: Number(mean.toFixed(2)),
          median,
          min,
          max,
          q1,
          q3,
          outlierCount: outliers.length,
        };
      } else {
        const uniqueValues = new Set(values.filter((v) => v !== null && v !== undefined && v !== ''));
        columnStats[col] = {
          name: col,
          type: 'categorical',
          total: rows,
          missing,
          missingRate: Number(((missing / rows) * 100).toFixed(1)),
          uniqueCount: uniqueValues.size,
          topCategories: Array.from(uniqueValues).slice(0, 5),
        };
      }
    });

    // Honest calculated quality score: 100 - (missingPct * 0.6) - (dupPct * 0.4)
    const missingRatio = totalMissing / (totalCells || 1);
    const duplicateRatio = duplicateCount / (rows || 1);
    const rawScore = 100 - missingRatio * 60 - duplicateRatio * 40;
    const qualityScore = Math.max(10, Math.min(100, Math.round(rawScore)));

    // Generate analytical insight using AI provider
    const aiProvider = getAIProvider();
    const summaryPrompt = `Analyze this dataset profile:
File: ${filename || 'User Dataset'}
Rows: ${rows}
Columns: ${columns.join(', ')}
Quality Score: ${qualityScore}/100
Missing Values: ${totalMissing} (${(missingRatio * 100).toFixed(1)}%)
Duplicates: ${duplicateCount}
Column Summary: ${JSON.stringify(columnStats)}

Provide 3 bullet points of empirical observations and data hygiene recommendations.`;

    let aiExplanation = '';
    try {
      const explanationPromise = aiProvider.generateChat({
        messages: [{ role: 'user', content: summaryPrompt }],
        model: 'NEXA Fast',
      });
      const timeoutPromise = new Promise<any>((_, reject) => setTimeout(() => reject(new Error('timeout')), 1500));
      const response = await Promise.race([explanationPromise, timeoutPromise]);
      aiExplanation = response.content;
    } catch {
      aiExplanation = `Dataset contains ${rows} observations across ${columns.length} features. Overall integrity is rated at ${qualityScore}% with ${totalMissing} missing values detected.`;
    }

    return res.json({
      filename: filename || 'Active Dataset',
      rows,
      columns,
      totalCells,
      totalMissing,
      duplicateCount,
      qualityScore,
      columnStats,
      preview: data.slice(0, 50),
      aiExplanation,
    });
  } catch (err: any) {
    console.error('Data analysis error:', err);
    return res.status(500).json({ error: 'Failed to analyze dataset: ' + err.message });
  }
});

// POST /api/data/query ("Ask AI about this dataset")
dataRouter.post('/query', authenticate, async (req: any, res) => {
  const { question, datasetProfile } = req.body;
  if (!question || !datasetProfile) {
    return res.status(400).json({ error: 'Question and datasetProfile are required' });
  }

  const aiProvider = getAIProvider();
  try {
    const prompt = `You are a Senior Data Scientist analyzing an inspected dataset with the following statistics:
Profile:
- Rows: ${datasetProfile.rows}
- Columns: ${datasetProfile.columns?.join(', ')}
- Quality Score: ${datasetProfile.qualityScore}/100
- Column details: ${JSON.stringify(datasetProfile.columnStats)}

User question: "${question}"

Provide a direct, mathematically grounded answer with specific column numbers, statistical measures, and clear markdown formatting.`;

    const result = await aiProvider.generateChat({
      messages: [{ role: 'user', content: prompt }],
      model: 'NEXA Reason',
    });

    return res.json({ answer: result.content, provider: result.provider });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to query dataset: ' + err.message });
  }
});
