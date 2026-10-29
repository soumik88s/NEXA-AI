import React, { useState, useEffect } from 'react';
import {
  Database,
  Search,
  Filter,
  ExternalLink,
  BarChart2,
  FileSpreadsheet,
  CheckCircle2,
  Globe2,
  Calendar,
  Layers,
  X,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { api } from '../lib/api';
import { Dataset } from '../types';

interface GlobalDataViewProps {
  onUseInAnalysis: (dataset: Dataset) => void;
}

export const GlobalDataView: React.FC<GlobalDataViewProps> = ({ onUseInAnalysis }) => {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedFormat, setSelectedFormat] = useState('All');
  const [apiOnly, setApiOnly] = useState(false);
  const [activeModalDataset, setActiveModalDataset] = useState<Dataset | null>(null);

  const categories = [
    'All',
    'Economics',
    'Climate',
    'Health',
    'Finance',
    'Energy',
    'Environment',
    'Government',
    'Population',
    'Science',
  ];

  const formats = ['All', 'CSV', 'JSON', 'API', 'GeoJSON', 'Parquet'];

  useEffect(() => {
    loadDatasets();
  }, [selectedCategory, selectedFormat, apiOnly]);

  const loadDatasets = async () => {
    setLoading(true);
    try {
      const res = await api.datasets.list({
        search: searchQuery,
        category: selectedCategory,
        format: selectedFormat,
        apiAvailable: apiOnly ? 'true' : undefined,
      });
      setDatasets(res.datasets || []);
    } catch (err) {
      console.error('Failed to load datasets:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadDatasets();
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#050505] overflow-y-auto">
      {/* Top Banner Header */}
      <div className="p-6 md:p-8 border-b border-white/10 bg-[#070709]/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-emerald-400 mb-2">
            <span></span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-bold text-white tracking-tight">
            Authoritative Worldwide Datasets.
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-2 max-w-2xl leading-relaxed">
            Discover datasets and authoritative data sources from around the world. Verified metadata, direct repository
            access, and 1-click import into the NEXA Data Analysis engine.
          </p>

          {/* Search Bar */}
          <form onSubmit={handleSearchSubmit} className="mt-6 flex items-center gap-2 max-w-3xl">
            <div className="flex-1 flex items-center gap-2.5 glass-input rounded-xl px-3.5 py-2.5">
              <Search className="w-4 h-4 text-zinc-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search datasets, organizations, topics, countries (e.g. World Bank, CO2, GDP)..."
                className="w-full bg-transparent text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none font-sans"
              />
            </div>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-white text-black font-semibold text-xs tracking-wider uppercase hover:bg-zinc-200 transition-all shrink-0"
            >
              Search
            </button>
          </form>

          {/* Category Filter Pills */}
          <div className="flex flex-wrap items-center gap-2 mt-4">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-full text-xs transition-colors font-medium ${
                  selectedCategory === cat
                    ? 'bg-white text-black font-semibold'
                    : 'bg-zinc-900/90 text-zinc-400 hover:text-white border border-white/5'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Secondary Format & API Toggles */}
          <div className="flex flex-wrap items-center gap-4 mt-3 pt-3 border-t border-white/5 text-xs text-zinc-400 font-mono">
            <div className="flex items-center gap-2">
              <span>Format:</span>
              <div className="flex items-center gap-1">
                {formats.map((fmt) => (
                  <button
                    key={fmt}
                    onClick={() => setSelectedFormat(fmt)}
                    className={`px-2 py-0.5 rounded text-[11px] ${
                      selectedFormat === fmt ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    {fmt}
                  </button>
                ))}
              </div>
            </div>

            <label className="flex items-center gap-2 cursor-pointer ml-auto">
              <input
                type="checkbox"
                checked={apiOnly}
                onChange={(e) => setApiOnly(e.target.checked)}
                className="rounded bg-zinc-900 border-white/20 text-white focus:ring-0"
              />
              <span className="text-[11px]">API Available Only</span>
            </label>
          </div>
        </div>
      </div>

      {/* Dataset Grid */}
      <div className="flex-1 p-6 md:p-8 max-w-6xl mx-auto w-full">
        {loading ? (
          <div className="py-20 text-center space-y-3">
            <div className="w-8 h-8 rounded-full border-2 border-white/20 border-t-white animate-spin mx-auto" />
            <p className="text-xs text-zinc-400 font-mono">Querying authoritative data index...</p>
          </div>
        ) : datasets.length === 0 ? (
          <div className="p-12 text-center text-xs text-zinc-500 rounded-2xl glass-panel">
            No datasets matched the specified query or filters. Try adjusting your parameters.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {datasets.map((dataset) => (
              <div
                key={dataset.id}
                className="p-5 rounded-2xl glass-panel border border-white/10 hover:border-white/25 transition-all flex flex-col justify-between group shadow-sm hover:shadow-xl"
              >
                <div>
                  {/* Category and Badges */}
                  <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400 mb-2.5">
                    <span className="px-2 py-0.5 rounded bg-zinc-900 border border-white/10 text-zinc-300">
                      {dataset.category}
                    </span>
                    <span className="flex items-center gap-1 text-emerald-400">
                      
                      
                    </span>
                  </div>

                  <h3 className="text-sm font-semibold text-white group-hover:text-zinc-100 transition-colors line-clamp-1">
                    {dataset.name}
                  </h3>
                  <div className="text-[11px] font-mono text-zinc-400 mt-1">
                    {dataset.publisher} {dataset.year ? `(${dataset.year})` : ''}
                  </div>

                  <p className="text-xs text-zinc-400 mt-3 line-clamp-3 leading-relaxed">
                    {dataset.description}
                  </p>
                </div>

                <div className="mt-5 pt-4 border-t border-white/5 space-y-3">
                  {/* Badges */}
                  <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-mono text-zinc-400">
                    <span className="px-1.5 py-0.5 rounded bg-zinc-900 border border-white/5 text-zinc-300">
                      {dataset.format}
                    </span>
                    {dataset.apiAvailable && (
                      <span className="px-1.5 py-0.5 rounded bg-zinc-900 border border-white/5 text-blue-400">
                        API
                      </span>
                    )}
                    {dataset.license && (
                      <span className="truncate max-w-[120px] text-zinc-500">
                        {dataset.license}
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setActiveModalDataset(dataset)}
                      className="flex-1 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-xs font-medium text-zinc-200 border border-white/5 transition-colors"
                    >
                      View Details
                    </button>
                    <button
                      onClick={() => onUseInAnalysis(dataset)}
                      className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-white text-black hover:bg-zinc-200 text-xs font-semibold transition-colors"
                      title="Import dataset into Data Analysis workspace"
                    >
                      <BarChart2 className="w-3.5 h-3.5" />
                      <span>Use in Analysis</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Dataset Details Modal */}
      {activeModalDataset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
          <div
            className="w-full max-w-3xl rounded-2xl glass-panel border border-white/15 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-6 border-b border-white/10 flex items-start justify-between bg-zinc-950/60">
              <div>
                <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 mb-1">
                  <span>{activeModalDataset.category}</span>
                  <span>•</span>
                  <span>{activeModalDataset.format}</span>
                  {activeModalDataset.apiAvailable && <span>• API Enabled</span>}
                </div>
                <h2 className="text-xl font-bold text-white tracking-tight">
                  {activeModalDataset.name}
                </h2>
                <div className="text-xs text-zinc-400 font-mono mt-0.5">
                  Authority: {activeModalDataset.publisher}
                </div>
              </div>

              <button
                onClick={() => setActiveModalDataset(null)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 text-xs text-zinc-300">
              <div>
                <h4 className="font-mono uppercase tracking-wider text-[11px] text-zinc-400 mb-1.5">Overview</h4>
                <p className="leading-relaxed">{activeModalDataset.description}</p>
              </div>

              {/* Metadata Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 rounded-xl bg-zinc-950/80 border border-white/5 font-mono text-[11px]">
                <div>
                  <div className="text-zinc-500">Coverage</div>
                  <div className="text-white mt-0.5">{activeModalDataset.geographicCoverage || 'Global'}</div>
                </div>
                <div>
                  <div className="text-zinc-500">Time Range</div>
                  <div className="text-white mt-0.5">{activeModalDataset.timeCoverage || 'Continuous'}</div>
                </div>
                <div>
                  <div className="text-zinc-500">Frequency</div>
                  <div className="text-white mt-0.5">{activeModalDataset.updateFrequency || 'Periodic'}</div>
                </div>
                <div>
                  <div className="text-zinc-500">License</div>
                  <div className="text-white mt-0.5">{activeModalDataset.license || 'Open Data'}</div>
                </div>
              </div>

              {/* Columns / Schema Table */}
              {activeModalDataset.columns && (
                <div>
                  <h4 className="font-mono uppercase tracking-wider text-[11px] text-zinc-400 mb-2">Schema Fields</h4>
                  <div className="border border-white/10 rounded-lg overflow-hidden bg-zinc-950/50">
                    <table className="w-full text-left font-mono text-[11px]">
                      <thead className="bg-zinc-900 border-b border-white/10 text-zinc-400">
                        <tr>
                          <th className="p-2">Field Name</th>
                          <th className="p-2">Data Type</th>
                          <th className="p-2">Description</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {activeModalDataset.columns.map((c, i) => (
                          <tr key={i}>
                            <td className="p-2 font-semibold text-white">{c.name}</td>
                            <td className="p-2 text-zinc-400">{c.type}</td>
                            <td className="p-2 text-zinc-300">{c.description || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Sample Data Preview Table */}
              {activeModalDataset.sampleData && activeModalDataset.sampleData.length > 0 && (
                <div>
                  <h4 className="font-mono uppercase tracking-wider text-[11px] text-zinc-400 mb-2">
                    Verified Sample Data
                  </h4>
                  <div className="border border-white/10 rounded-lg overflow-x-auto bg-zinc-950/50 max-h-48">
                    <table className="w-full text-left font-mono text-[11px]">
                      <thead className="bg-zinc-900 border-b border-white/10 text-zinc-400 sticky top-0">
                        <tr>
                          {Object.keys(activeModalDataset.sampleData[0] || {}).map((col) => (
                            <th key={col} className="p-2 whitespace-nowrap">
                              {col}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {activeModalDataset.sampleData.map((row, rIdx) => (
                          <tr key={rIdx} className="hover:bg-zinc-900/30">
                            {Object.values(row).map((val: any, cIdx) => (
                              <td key={cIdx} className="p-2 whitespace-nowrap text-zinc-300">
                                {String(val)}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="p-4 border-t border-white/10 bg-zinc-950/80 flex items-center justify-between">
              <a
                href={activeModalDataset.sourceUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white"
              >
                <span>Open Official Repository</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveModalDataset(null)}
                  className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-xs text-zinc-300"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    const ds = activeModalDataset;
                    setActiveModalDataset(null);
                    onUseInAnalysis(ds);
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white text-black font-semibold text-xs hover:bg-zinc-200 transition-colors"
                >
                  <BarChart2 className="w-3.5 h-3.5" />
                  <span>Import into Data Analysis</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
