import React, { useState, useEffect } from 'react';
import {
  BarChart2,
  Upload,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle2,
  TrendingUp,
  Search,
  ArrowRight,
  Database,
  Layers,
  HelpCircle,
} from 'lucide-react';
import { api } from '../lib/api';
import { DataAnalysisResult, Dataset } from '../types';
import { DataChart } from '../components/charts/DataChart';
import { MarkdownRenderer } from '../components/MarkdownRenderer';

interface DataAnalysisViewProps {
  initialDataset?: Dataset | null;
}

export const DataAnalysisView: React.FC<DataAnalysisViewProps> = ({ initialDataset }) => {
  const [analysisResult, setAnalysisResult] = useState<DataAnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Table filtering and search
  const [tableSearch, setTableSearch] = useState('');
  const [selectedColumnForStats, setSelectedColumnForStats] = useState<string | null>(null);

  // Chart axes
  const [xAxisKey, setXAxisKey] = useState<string>('');
  const [yAxisKey, setYAxisKey] = useState<string>('');

  // AI query
  const [aiQuestion, setAiQuestion] = useState('');
  const [aiAnswer, setAiAnswer] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  // Load initial dataset if provided from Global Data
  useEffect(() => {
    if (initialDataset?.sampleData && initialDataset.sampleData.length > 0) {
      handleAnalyzeRawData(initialDataset.sampleData, initialDataset.name);
    } else {
      // Default initial sample dataset: Global Renewable Shares & Economic Growth
      const defaultSample = [
        { Country: 'Sweden', Renewable_Share: 66.0, GDP_Growth: 0.8, CO2_Emissions_MT: 35.2, R_and_D_Pct_GDP: 3.4 },
        { Country: 'Finland', Renewable_Share: 47.9, GDP_Growth: 0.2, CO2_Emissions_MT: 41.5, R_and_D_Pct_GDP: 2.9 },
        { Country: 'Denmark', Renewable_Share: 41.6, GDP_Growth: 1.9, CO2_Emissions_MT: 28.1, R_and_D_Pct_GDP: 3.1 },
        { Country: 'Austria', Renewable_Share: 36.4, GDP_Growth: 0.4, CO2_Emissions_MT: 62.4, R_and_D_Pct_GDP: 3.2 },
        { Country: 'Portugal', Renewable_Share: 34.0, GDP_Growth: 2.3, CO2_Emissions_MT: 39.8, R_and_D_Pct_GDP: 1.7 },
        { Country: 'Germany', Renewable_Share: 52.8, GDP_Growth: 0.2, CO2_Emissions_MT: 650.0, R_and_D_Pct_GDP: 3.1 },
        { Country: 'United States', Renewable_Share: 21.4, GDP_Growth: 2.8, CO2_Emissions_MT: 4800.0, R_and_D_Pct_GDP: 3.5 },
        { Country: 'Japan', Renewable_Share: 23.1, GDP_Growth: 0.9, CO2_Emissions_MT: 1050.0, R_and_D_Pct_GDP: 3.3 },
      ];
      handleAnalyzeRawData(defaultSample, 'Global_Renewables_and_Macro_Sample.csv');
    }
  }, [initialDataset]);

  const handleAnalyzeRawData = async (data: any[], filename: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.data.analyze({ data, filename });
      setAnalysisResult(res);
      // Auto select first string column for X and first numeric column for Y
      if (res.columns.length > 0) {
        const numCol = res.columns.find((c) => res.columnStats[c]?.type === 'numeric') || res.columns[1] || res.columns[0];
        const strCol = res.columns.find((c) => res.columnStats[c]?.type === 'categorical') || res.columns[0];
        setXAxisKey(strCol);
        setYAxisKey(numCol);
        setSelectedColumnForStats(numCol);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to inspect dataset');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const content = reader.result as string;
      setLoading(true);
      try {
        const res = await api.data.analyze({ rawText: content, filename: file.name });
        setAnalysisResult(res);
        if (res.columns.length > 0) {
          const numCol = res.columns.find((c) => res.columnStats[c]?.type === 'numeric') || res.columns[0];
          const strCol = res.columns.find((c) => res.columnStats[c]?.type === 'categorical') || res.columns[0];
          setXAxisKey(strCol);
          setYAxisKey(numCol);
          setSelectedColumnForStats(numCol);
        }
      } catch (err: any) {
        setError(err.message || 'Error processing uploaded dataset');
      } finally {
        setLoading(false);
      }
    };
    reader.readAsText(file);
  };

  const handleAskAi = async (prompt?: string) => {
    const q = prompt || aiQuestion;
    if (!q.trim() || !analysisResult || aiLoading) return;

    setAiLoading(true);
    try {
      const res = await api.data.query({
        question: q,
        datasetProfile: analysisResult,
      });
      setAiAnswer(res.answer);
      setAiQuestion('');
    } catch (err: any) {
      console.error('AI query error:', err);
    } finally {
      setAiLoading(false);
    }
  };

  // Filter table rows
  const filteredRows = (analysisResult?.preview || []).filter((row) => {
    if (!tableSearch) return true;
    return Object.values(row).some((val) =>
      String(val).toLowerCase().includes(tableSearch.toLowerCase())
    );
  });

  return (
    <div className="flex-1 flex flex-col h-full bg-[#050505] overflow-y-auto">
      {/* Workspace Header */}
      <div className="p-6 border-b border-white/10 bg-[#070709]/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-emerald-400 mb-1">
              <BarChart2 className="w-4 h-4" />
              <span>DATA ANALYSIS WORKSPACE</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              {analysisResult ? analysisResult.filename : 'Structured Data Profiling'}
            </h1>
            <p className="text-xs text-zinc-400 mt-0.5 font-mono">
              Deterministic descriptive statistics, outlier detection, and empirical quality validation.
            </p>
          </div>

          {/* Upload Button */}
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-black font-semibold text-xs uppercase tracking-wider hover:bg-zinc-200 transition-all cursor-pointer shadow-md">
              <Upload className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Upload CSV / JSON</span>
              <input type="file" accept=".csv,.json,.txt" className="hidden" onChange={handleFileUpload} />
            </label>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-6 max-w-6xl mx-auto w-full space-y-6">
        {error && (
          <div className="p-4 rounded-xl bg-red-950/40 border border-red-800/40 text-xs text-red-200 flex items-center gap-3">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="py-24 text-center space-y-3">
            <div className="w-8 h-8 rounded-full border-2 border-white/20 border-t-white animate-spin mx-auto" />
            <p className="text-xs text-zinc-400 font-mono">Computing empirical metrics and column profiles...</p>
          </div>
        ) : analysisResult ? (
          <>
            {/* Top Metrics Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-4 rounded-xl glass-panel border border-white/10">
                <div className="text-[10px] font-mono uppercase text-zinc-500">Total Observations</div>
                <div className="text-2xl font-bold text-white mt-1 font-mono">
                  {analysisResult.rows.toLocaleString()}
                </div>
                <div className="text-[11px] text-zinc-400 mt-1">across {analysisResult.columns.length} columns</div>
              </div>

              <div className="p-4 rounded-xl glass-panel border border-white/10">
                <div className="text-[10px] font-mono uppercase text-zinc-500">Calculated Quality Score</div>
                <div className="text-2xl font-bold text-white mt-1 font-mono flex items-center gap-2">
                  <span>{analysisResult.qualityScore}%</span>
                  <span
                    className={`w-2 h-2 rounded-full ${
                      analysisResult.qualityScore > 80
                        ? 'bg-emerald-400'
                        : analysisResult.qualityScore > 60
                        ? 'bg-amber-400'
                        : 'bg-red-400'
                    }`}
                  />
                </div>
                <div className="text-[11px] text-zinc-400 mt-1">
                  {analysisResult.totalMissing} missing • {analysisResult.duplicateCount} duplicates
                </div>
              </div>

              <div className="p-4 rounded-xl glass-panel border border-white/10">
                <div className="text-[10px] font-mono uppercase text-zinc-500">Missing Values Ratio</div>
                <div className="text-2xl font-bold text-white mt-1 font-mono">
                  {((analysisResult.totalMissing / (analysisResult.totalCells || 1)) * 100).toFixed(1)}%
                </div>
                <div className="text-[11px] text-zinc-400 mt-1">of {analysisResult.totalCells} total cells</div>
              </div>

              <div className="p-4 rounded-xl glass-panel border border-white/10">
                <div className="text-[10px] font-mono uppercase text-zinc-500">Duplicate Observations</div>
                <div className="text-2xl font-bold text-white mt-1 font-mono">
                  {analysisResult.duplicateCount}
                </div>
                <div className="text-[11px] text-zinc-400 mt-1">
                  {((analysisResult.duplicateCount / (analysisResult.rows || 1)) * 100).toFixed(1)}% duplication rate
                </div>
              </div>
            </div>

            {/* AI Explanation / Data Hygiene Banner */}
            {analysisResult.aiExplanation && (
              <div className="p-4 rounded-xl glass-panel border border-white/10 bg-zinc-950/40">
                <div className="flex items-center gap-2 text-xs font-mono text-zinc-400 mb-2 border-b border-white/5 pb-2">
                  <TrendingUp className="w-4 h-4 text-white" />
                  <span className="font-semibold text-white">Statistical Hygiene & Insights</span>
                </div>
                <MarkdownRenderer content={analysisResult.aiExplanation} />
              </div>
            )}

            {/* Visualization Engine Section */}
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-sm font-semibold text-white tracking-wide flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-zinc-400" />
                  <span>Visualization Canvas</span>
                </h3>

                {/* Axes Selectors */}
                <div className="flex items-center gap-3 text-xs font-mono">
                  <div className="flex items-center gap-1.5">
                    <span className="text-zinc-500">X-Axis:</span>
                    <select
                      value={xAxisKey}
                      onChange={(e) => setXAxisKey(e.target.value)}
                      className="bg-zinc-900 border border-white/10 rounded px-2 py-1 text-white focus:outline-none"
                    >
                      {analysisResult.columns.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="text-zinc-500">Y-Axis:</span>
                    <select
                      value={yAxisKey}
                      onChange={(e) => setYAxisKey(e.target.value)}
                      className="bg-zinc-900 border border-white/10 rounded px-2 py-1 text-white focus:outline-none"
                    >
                      {analysisResult.columns.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Chart Component */}
              <DataChart
                data={analysisResult.preview}
                xAxisKey={xAxisKey}
                yAxisKey={yAxisKey}
                chartType="bar"
              />
            </div>

            {/* Column Statistics Breakdown */}
            <div className="p-4 rounded-xl glass-panel border border-white/10 space-y-3">
              <h3 className="text-xs font-mono uppercase tracking-wider text-zinc-400">
                Column Distributions & Profile
              </h3>

              <div className="flex flex-wrap gap-1.5 border-b border-white/5 pb-3">
                {analysisResult.columns.map((c) => (
                  <button
                    key={c}
                    onClick={() => setSelectedColumnForStats(c)}
                    className={`px-3 py-1 rounded-lg text-xs font-mono transition-colors ${
                      selectedColumnForStats === c
                        ? 'bg-white text-black font-semibold'
                        : 'bg-zinc-900 text-zinc-400 hover:text-white border border-white/5'
                    }`}
                  >
                    {c} ({analysisResult.columnStats[c]?.type})
                  </button>
                ))}
              </div>

              {selectedColumnForStats && analysisResult.columnStats[selectedColumnForStats] && (
                <div className="p-3 rounded-lg bg-zinc-950/60 border border-white/5 font-mono text-xs">
                  {analysisResult.columnStats[selectedColumnForStats].type === 'numeric' ? (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div>
                        <div className="text-zinc-500 text-[10px]">Mean</div>
                        <div className="text-white text-sm font-semibold">
                          {analysisResult.columnStats[selectedColumnForStats].mean}
                        </div>
                      </div>
                      <div>
                        <div className="text-zinc-500 text-[10px]">Median</div>
                        <div className="text-white text-sm font-semibold">
                          {analysisResult.columnStats[selectedColumnForStats].median}
                        </div>
                      </div>
                      <div>
                        <div className="text-zinc-500 text-[10px]">Min / Max</div>
                        <div className="text-white text-sm font-semibold">
                          {analysisResult.columnStats[selectedColumnForStats].min} /{' '}
                          {analysisResult.columnStats[selectedColumnForStats].max}
                        </div>
                      </div>
                      <div>
                        <div className="text-zinc-500 text-[10px]">IQR Outliers</div>
                        <div className="text-white text-sm font-semibold">
                          {analysisResult.columnStats[selectedColumnForStats].outlierCount} observations
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="text-zinc-500 text-[10px] mb-1">
                        Unique Categories ({analysisResult.columnStats[selectedColumnForStats].uniqueCount} distinct)
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {analysisResult.columnStats[selectedColumnForStats].topCategories?.map((cat: any) => (
                          <span
                            key={String(cat)}
                            className="px-2 py-0.5 rounded bg-zinc-900 border border-white/10 text-zinc-300 text-[11px]"
                          >
                            {String(cat)}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* "Ask AI About this Dataset" Section */}
            <div className="p-5 rounded-xl glass-panel border border-white/10 space-y-3">
              <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-zinc-400">
                <HelpCircle className="w-3.5 h-3.5 text-white" />
                <span>Ask AI About this Dataset</span>
              </div>

              <div className="flex items-center gap-2 glass-input rounded-xl p-1.5">
                <input
                  type="text"
                  value={aiQuestion}
                  onChange={(e) => setAiQuestion(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAskAi()}
                  placeholder="e.g. Which column has the highest variance? Find unusual patterns..."
                  className="w-full bg-transparent text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none px-3 py-1 font-sans"
                />
                <button
                  onClick={() => handleAskAi()}
                  disabled={!aiQuestion.trim() || aiLoading}
                  className="px-4 py-2 rounded-lg bg-white text-black font-semibold text-xs uppercase tracking-wider hover:bg-zinc-200 transition-all disabled:opacity-40 shrink-0"
                >
                  {aiLoading ? 'Thinking...' : 'Analyze'}
                </button>
              </div>

              {/* Sample quick inquiry buttons */}
              <div className="flex flex-wrap gap-2 text-xs">
                {['Find unusual patterns', 'Which column has the most missing values?', 'Summarize this dataset'].map(
                  (q) => (
                    <button
                      key={q}
                      onClick={() => handleAskAi(q)}
                      className="px-2.5 py-1 rounded bg-zinc-900 hover:bg-zinc-800 border border-white/5 text-[11px] text-zinc-400 hover:text-white transition-colors"
                    >
                      {q}
                    </button>
                  )
                )}
              </div>

              {/* AI Answer Card */}
              {aiAnswer && (
                <div className="mt-3 p-4 rounded-xl bg-zinc-950/80 border border-white/10">
                  <MarkdownRenderer content={aiAnswer} />
                </div>
              )}
            </div>

            {/* Data Inspection Table */}
            <div className="rounded-xl border border-white/10 glass-panel overflow-hidden">
              <div className="p-3.5 border-b border-white/10 flex items-center justify-between gap-3 bg-zinc-950/70">
                <div className="text-xs font-semibold text-white tracking-wide">
                  Raw Observations ({filteredRows.length} shown)
                </div>
                <div className="relative w-64">
                  <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    value={tableSearch}
                    onChange={(e) => setTableSearch(e.target.value)}
                    placeholder="Filter rows..."
                    className="w-full bg-zinc-900 border border-white/10 rounded-lg pl-8 pr-3 py-1 text-xs text-white placeholder-zinc-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="overflow-x-auto max-h-72">
                <table className="w-full text-left font-mono text-[11px]">
                  <thead className="bg-zinc-900/90 text-zinc-400 border-b border-white/10 sticky top-0">
                    <tr>
                      {analysisResult.columns.map((c) => (
                        <th key={c} className="p-2.5 whitespace-nowrap">
                          {c}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredRows.map((row, rIdx) => (
                      <tr key={rIdx} className="hover:bg-zinc-900/40">
                        {analysisResult.columns.map((col, cIdx) => (
                          <td key={cIdx} className="p-2.5 whitespace-nowrap text-zinc-300">
                            {row[col] !== null && row[col] !== undefined ? String(row[col]) : (
                              <span className="text-zinc-600 italic">null</span>
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
};
