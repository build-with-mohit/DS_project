import React, { useState, useEffect, useRef } from 'react';
import {
  GitCommit,
  Play,
  RotateCcw,
  Search,
  ArrowRight,
  CheckCircle,
  XCircle,
  HelpCircle,
  Cpu,
  Layers,
  Sparkles,
  Info,
  Clock,
  ChevronRight,
  Pause,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

import api, { extractErrorMessage } from '../services/api';
import { StatusBadge, CategoryBadge } from '../components/Badge';

export const VisualizerPage = () => {
  const [visData, setVisData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Search Animation State
  const [searchIsbn, setSearchIsbn] = useState('');
  const [animating, setAnimating] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);
  const [animationLog, setAnimationLog] = useState([]);
  const [animationResult, setAnimationResult] = useState(null); // 'found' | 'not_found' | null
  const [animationSpeed, setAnimationSpeed] = useState(800); // ms per step

  const containerRef = useRef(null);

  const fetchVisualization = async () => {
    try {
      const data = await api.getLinkedListVisualization();
      setVisData(data);
    } catch (err) {
      toast.error(extractErrorMessage(err, 'Failed to fetch linked list visualization data.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVisualization();
  }, []);

  const handleReset = () => {
    setAnimating(false);
    setCurrentStepIndex(-1);
    setAnimationLog([]);
    setAnimationResult(null);
    setSearchIsbn('');
  };

  // Run animated search traversal over the actual backend nodes
  const startAnimatedSearch = async () => {
    if (!visData || !visData.nodes || visData.nodes.length === 0) {
      toast.error('Linked list is empty. Add a book first to visualize traversal.');
      return;
    }

    const targetIsbn = searchIsbn.trim();
    if (!targetIsbn) {
      toast.error('Please enter an ISBN to search and trace.');
      return;
    }

    setAnimating(true);
    setAnimationResult(null);
    setCurrentStepIndex(-1);
    setAnimationLog([
      `[START] Initializing Singly Linked List Traversal for ISBN: ${targetIsbn}`,
      `[POINTER] Setting current pointer: current = self.head`,
    ]);

    const nodes = visData.nodes;
    let found = false;

    for (let i = 0; i < nodes.length; i++) {
      setCurrentStepIndex(i);
      const currentNode = nodes[i];

      // Auto-scroll horizontal container to keep active node in view
      if (containerRef.current) {
        const nodeElem = document.getElementById(`node-card-${i}`);
        if (nodeElem) {
          nodeElem.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
        }
      }

      setAnimationLog((prev) => [
        ...prev,
        `Step ${i + 1}: Visiting Node [Index ${i}] (ISBN: ${currentNode.isbn}, Title: "${currentNode.title}")`,
      ]);

      await new Promise((resolve) => setTimeout(resolve, animationSpeed));

      if (currentNode.isbn === targetIsbn) {
        found = true;
        setAnimationResult('found');
        setAnimationLog((prev) => [
          ...prev,
          `✓ [MATCH FOUND] current.isbn == '${targetIsbn}'. Target reached in ${i + 1} step(s).`,
          `Algorithm terminated successfully with Time Complexity O(${i + 1}).`,
        ]);
        break;
      } else {
        setAnimationLog((prev) => [
          ...prev,
          `✗ '${currentNode.isbn}' != '${targetIsbn}'. Advancing: current = current.next (pointer -> ${currentNode.next_isbn || 'NULL'})`,
        ]);
      }
    }

    if (!found) {
      // Reached NULL
      setCurrentStepIndex(nodes.length); // point to NULL
      setAnimationResult('not_found');
      setAnimationLog((prev) => [
        ...prev,
        `[NULL REACHED] current == None. Reached end of Singly Linked List.`,
        `✗ Book with ISBN '${targetIsbn}' does not exist in catalog. Total comparisons: ${nodes.length} (O(n)).`,
      ]);
    }

    setAnimating(false);
  };

  const handleSelectSample = (isbn) => {
    setSearchIsbn(isbn);
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-8 max-w-7xl mx-auto animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-900">
              Interactive Data Structure
            </span>
          </div>
          <h1 className="mt-1 text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Linked List Visualizer
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Real-time memory representation of the library catalog managed by <span className="font-semibold text-slate-700 dark:text-slate-300">LibraryLinkedList</span> in Python.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            onClick={handleReset}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-800 shadow-2xs transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset View</span>
          </button>
          <button
            onClick={fetchVisualization}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm shadow-indigo-500/20 transition-all"
          >
            <GitCommit className="w-3.5 h-3.5" />
            <span>Sync Memory</span>
          </button>
        </div>
      </div>

      {/* Traversal Control Deck */}
      <div className="p-5 sm:p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Cpu className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              SLL Pointer Traversal Simulator
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Enter an ISBN to watch the while loop step through nodes starting from <span className="font-mono text-indigo-600 dark:text-indigo-400 font-semibold">self.head</span> until matching or reaching <span className="font-mono text-slate-400">NULL</span>.
            </p>
          </div>

          {/* Speed Selector */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500 dark:text-slate-400">Step Speed:</span>
            {[
              { label: '0.5x', ms: 1400 },
              { label: '1x', ms: 800 },
              { label: '2x', ms: 400 },
            ].map((spd) => (
              <button
                key={spd.label}
                type="button"
                onClick={() => setAnimationSpeed(spd.ms)}
                className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                  animationSpeed === spd.ms
                    ? 'bg-indigo-600 text-white shadow-2xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                }`}
              >
                {spd.label}
              </button>
            ))}
          </div>
        </div>

        {/* Input Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 pt-1">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Enter target ISBN (or click any node chip below)..."
              value={searchIsbn}
              onChange={(e) => setSearchIsbn(e.target.value)}
              disabled={animating}
              className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm font-mono bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <button
            type="button"
            onClick={startAnimatedSearch}
            disabled={animating || !searchIsbn.trim()}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-500/20 active:scale-95 disabled:opacity-50 transition-all shrink-0"
          >
            <Play className={`w-4 h-4 ${animating ? 'animate-spin' : ''}`} />
            <span>{animating ? 'Tracing Pointer...' : 'Traverse & Search'}</span>
          </button>
        </div>

        {/* Fast Select Node Chips */}
        {visData?.nodes && visData.nodes.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 text-xs pt-1">
            <span className="text-slate-400 text-[11px] font-medium mr-1">Select from list:</span>
            {visData.nodes.map((n, idx) => (
              <button
                key={n.isbn}
                type="button"
                onClick={() => handleSelectSample(n.isbn)}
                className={`font-mono text-[11px] px-2 py-0.5 rounded transition-all ${
                  searchIsbn === n.isbn
                    ? 'bg-indigo-600 text-white font-bold'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/40'
                }`}
              >
                #{idx} ({n.isbn.slice(-4)})
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Visualizer Chain Container (Horizontal Scroll) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              Total In-Memory Nodes: {visData?.total_nodes ?? 0}
            </span>
            <span>•</span>
            <span className="font-mono text-indigo-600 dark:text-indigo-400">
              HEAD: {visData?.head_isbn || 'None'}
            </span>
          </div>
          <span className="text-[11px] text-slate-400 hidden sm:inline">
            Scroll horizontally to inspect the full chain →
          </span>
        </div>

        <div
          ref={containerRef}
          className="p-6 bg-slate-900 rounded-2xl border border-slate-800 shadow-inner overflow-x-auto min-h-[300px] flex items-center select-none"
        >
          {loading ? (
            <div className="flex items-center justify-center w-full py-12 text-slate-400 text-sm">
              Loading in-memory node structures...
            </div>
          ) : !visData || visData.nodes.length === 0 ? (
            <div className="flex flex-col items-center justify-center w-full py-12 text-center text-slate-400 text-sm">
              <span className="font-mono text-base font-bold text-amber-400 mb-1">
                self.head = None
              </span>
              <p className="text-xs text-slate-500">
                The Singly Linked List is currently empty. Add books from the Catalog or Add Book page.
              </p>
            </div>
          ) : (
            <div className="flex items-center gap-4 py-4 px-2 shrink-0">
              {/* HEAD Pointer Tag */}
              <div className="flex flex-col items-center shrink-0">
                <span className="text-[11px] font-mono font-extrabold px-2.5 py-1 rounded bg-indigo-500 text-white shadow-md shadow-indigo-500/30">
                  HEAD
                </span>
                <div className="h-6 w-0.5 bg-indigo-500 my-1"></div>
                <ArrowRight className="w-5 h-5 text-indigo-400" />
              </div>

              {/* Node Sequence */}
              {visData.nodes.map((node, index) => {
                const isCurrentActive = currentStepIndex === index;
                const isMatch = isCurrentActive && animationResult === 'found';

                return (
                  <React.Fragment key={node.isbn}>
                    {/* Node Card */}
                    <div
                      id={`node-card-${index}`}
                      className={`relative w-64 p-4 rounded-xl border transition-all duration-300 shrink-0 ${
                        isMatch
                          ? 'bg-emerald-950/80 border-emerald-400 ring-4 ring-emerald-500/30 scale-105'
                          : isCurrentActive
                          ? 'bg-indigo-950/90 border-indigo-400 ring-4 ring-indigo-500/30 scale-105'
                          : 'bg-slate-800/90 border-slate-700/80 hover:border-slate-600'
                      }`}
                    >
                      {/* Node Header Badges */}
                      <div className="flex items-center justify-between gap-1 mb-2">
                        <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-slate-700 text-slate-200">
                          NODE #{index}
                        </span>
                        {node.is_head && (
                          <span className="font-bold text-[9px] uppercase px-1.5 py-0.5 rounded bg-indigo-500/30 text-indigo-300 border border-indigo-500/40">
                            HEAD
                          </span>
                        )}
                        {node.is_tail && (
                          <span className="font-bold text-[9px] uppercase px-1.5 py-0.5 rounded bg-amber-500/30 text-amber-300 border border-amber-500/40">
                            TAIL
                          </span>
                        )}
                      </div>

                      {/* ISBN & Title */}
                      <div className="space-y-1">
                        <p className="font-mono text-xs font-bold text-indigo-300">
                          ISBN: {node.isbn}
                        </p>
                        <h4 className="text-xs font-semibold text-white truncate" title={node.title}>
                          {node.title}
                        </h4>
                        <p className="text-[11px] text-slate-400 truncate">
                          {node.author}
                        </p>
                      </div>

                      {/* Status & Category */}
                      <div className="mt-3 pt-2.5 border-t border-slate-700/60 flex items-center justify-between text-[10px]">
                        <span className="text-slate-400">{node.category}</span>
                        <span
                          className={`font-semibold px-2 py-0.5 rounded-full ${
                            node.availability_status === 'Available'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          }`}
                        >
                          {node.availability_status}
                        </span>
                      </div>

                      {/* Next Pointer Box */}
                      <div className="mt-3 p-2 rounded-lg bg-slate-900/80 border border-slate-700 font-mono text-[11px] flex items-center justify-between">
                        <span className="text-slate-400">next:</span>
                        <span
                          className={`font-bold truncate max-w-[140px] ${
                            node.next_isbn ? 'text-indigo-400' : 'text-slate-500'
                          }`}
                        >
                          {node.next_isbn ? `-> [${node.next_isbn.slice(-4)}]` : 'None (NULL)'}
                        </span>
                      </div>

                      {/* Pointer Marker for Active Traversal */}
                      {isCurrentActive && (
                        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                          <span className="px-2 py-0.5 rounded bg-indigo-500 text-white font-mono text-[10px] font-black uppercase shadow-lg shadow-indigo-500/50 flex items-center gap-1 animate-bounce">
                            ▲ CURRENT POINTER
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Connecting Pointer Arrow */}
                    <div className="flex items-center shrink-0">
                      <div
                        className={`h-0.5 w-8 transition-colors duration-200 ${
                          isCurrentActive ? 'bg-indigo-400' : 'bg-slate-600'
                        }`}
                      />
                      <ArrowRight
                        className={`w-5 h-5 -ml-1 transition-colors duration-200 ${
                          isCurrentActive ? 'text-indigo-400' : 'text-slate-600'
                        }`}
                      />
                    </div>
                  </React.Fragment>
                );
              })}

              {/* NULL Terminator */}
              <div
                className={`p-3.5 rounded-xl border font-mono text-xs font-black tracking-widest transition-all shrink-0 ${
                  currentStepIndex === visData.nodes.length
                    ? 'bg-red-950/80 border-red-500 text-red-300 ring-4 ring-red-500/30 scale-105'
                    : 'bg-slate-800 border-slate-700 text-slate-500'
                }`}
              >
                NULL
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Traversal Execution Terminal & Algorithmic Complexity Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Traversal Console Log */}
        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs lg:col-span-2 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Python Traversal Execution Trace
                </h3>
              </div>
              <span className="text-[11px] font-mono text-slate-400">
                while current is not None:
              </span>
            </div>

            <div className="mt-3 p-3.5 bg-slate-950 rounded-xl font-mono text-xs text-slate-300 space-y-1.5 max-h-48 overflow-y-auto">
              {animationLog.length === 0 ? (
                <p className="text-slate-500 italic">
                  Press "Traverse & Search" to watch execution trace line by line.
                </p>
              ) : (
                animationLog.map((line, idx) => (
                  <div
                    key={idx}
                    className={`leading-relaxed ${
                      line.includes('✓')
                        ? 'text-emerald-400 font-bold'
                        : line.includes('✗')
                        ? 'text-amber-400'
                        : line.includes('[START]') || line.includes('[POINTER]')
                        ? 'text-indigo-400 font-semibold'
                        : 'text-slate-300'
                    }`}
                  >
                    {line}
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
            <span>Algorithm: Sequential Linear Scan</span>
            <span className="font-semibold text-indigo-600 dark:text-indigo-400">
              Status: {animating ? 'Traversing Nodes...' : animationResult ? animationResult.toUpperCase() : 'Idle'}
            </span>
          </div>
        </div>

        {/* Viva / Complexity Reference Card */}
        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
              <Info className="w-4 h-4 text-indigo-500" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Time & Space Complexity (Viva)
              </h3>
            </div>

            <div className="mt-3 space-y-2.5 text-xs">
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <span className="text-slate-600 dark:text-slate-300 font-medium">Insert at Tail:</span>
                <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">O(n)</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <span className="text-slate-600 dark:text-slate-300 font-medium">Search by ISBN:</span>
                <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">O(n)</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <span className="text-slate-600 dark:text-slate-300 font-medium">Delete by ISBN:</span>
                <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">O(n)</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <span className="text-slate-600 dark:text-slate-300 font-medium">Traverse & Display:</span>
                <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">O(n)</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <span className="text-slate-600 dark:text-slate-300 font-medium">Space Complexity:</span>
                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">O(n)</span>
              </div>
            </div>
          </div>

          <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400">
            Node: <code className="text-indigo-500 font-mono">self.next</code> reference
          </div>
        </div>
      </div>
    </div>
  );
};

export default VisualizerPage;
