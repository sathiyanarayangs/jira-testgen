import React, { useState, useMemo } from 'react';

const PRIORITY_COLORS = {
  Critical: { bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.35)', text: '#fca5a5' },
  High:     { bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.35)', text: '#fcd34d' },
  Medium:   { bg: 'rgba(124,58,237,0.12)', border: 'rgba(124,58,237,0.35)', text: '#c4b5fd' },
  Low:      { bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.35)', text: '#6ee7b7' },
};

const TYPE_ICONS = {
  Positive: '✓',
  Negative: '✗',
  'Edge Case': '◈',
  Security: '⬡',
  Performance: '◎',
};

function Pill({ text, scheme }) {
  const c = scheme || { bg: 'rgba(100,100,100,0.1)', border: 'rgba(100,100,100,0.2)', text: '#94a3b8' };
  return (
    <span style={{
      background: c.bg,
      border: `1px solid ${c.border}`,
      color: c.text,
      fontSize: 9,
      padding: '2px 7px',
      borderRadius: 3,
      fontFamily: 'var(--font-mono)',
      fontWeight: 700,
      letterSpacing: '0.06em',
      whiteSpace: 'nowrap',
    }}>{text}</span>
  );
}

function TestCaseCard({ tc, index }) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const prioColor = PRIORITY_COLORS[tc.priority] || PRIORITY_COLORS.Medium;
  const typeIcon = TYPE_ICONS[tc.type] || '◇';

  const copyText = () => {
    const text = [
      `ID: ${tc.id}`,
      `Title: ${tc.title}`,
      `Type: ${tc.type} | Priority: ${tc.priority} | Category: ${tc.category}`,
      `Preconditions: ${tc.preconditions}`,
      `Steps:\n${tc.steps?.map((s, i) => `  ${i + 1}. ${s}`).join('\n')}`,
      `Expected Result: ${tc.expectedResult}`,
      `Tags: ${tc.tags?.join(', ')}`,
    ].join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ ...s.card, ...(expanded ? s.cardExpanded : {}) }}>
      {/* Card header */}
      <div style={s.cardTop} onClick={() => setExpanded(v => !v)} role="button" tabIndex={0}
        onKeyDown={e => e.key === 'Enter' && setExpanded(v => !v)}>
        <div style={s.tcId}>{tc.id}</div>
        <div style={s.tcTitle}>{tc.title}</div>
        <div style={s.pills}>
          <Pill text={tc.priority} scheme={prioColor} />
          <Pill text={tc.type} />
          <Pill text={tc.category} />
        </div>
        <div style={s.typeIcon}>{typeIcon}</div>
        <div style={s.expandIcon}>{expanded ? '▲' : '▼'}</div>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div style={s.details}>
          <button onClick={copyText} style={s.copyBtn}>
            {copied ? '✓ Copied' : '⎘ Copy'}
          </button>

          {tc.preconditions && (
            <div style={s.section}>
              <div style={s.sectionLabel}>PRECONDITIONS</div>
              <div style={s.sectionContent}>{tc.preconditions}</div>
            </div>
          )}

          {tc.steps?.length > 0 && (
            <div style={s.section}>
              <div style={s.sectionLabel}>TEST STEPS</div>
              <ol style={s.stepList}>
                {tc.steps.map((step, i) => (
                  <li key={i} style={s.stepItem}>
                    <span style={s.stepNum}>{i + 1}</span>
                    <span style={s.stepText}>{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {tc.expectedResult && (
            <div style={s.section}>
              <div style={s.sectionLabel}>EXPECTED RESULT</div>
              <div style={{ ...s.sectionContent, borderLeft: '3px solid var(--success)', paddingLeft: 12 }}>
                {tc.expectedResult}
              </div>
            </div>
          )}

          {tc.tags?.length > 0 && (
            <div style={s.tagRow}>
              {tc.tags.map((t, i) => <Pill key={i} text={`#${t}`} />)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function TestCaseResults({ result, onReset, onRegenerate }) {
  const [filter, setFilter] = useState({ priority: '', type: '', category: '', search: '' });
  const [activeTab, setActiveTab] = useState('all');

  const testCases = result?.testCases || [];
  const storyInfo = result?.storyInfo || {};

  const filtered = useMemo(() => {
    return testCases.filter(tc => {
      if (filter.priority && tc.priority !== filter.priority) return false;
      if (filter.type && tc.type !== filter.type) return false;
      if (filter.category && tc.category !== filter.category) return false;
      if (filter.search && !tc.title?.toLowerCase().includes(filter.search.toLowerCase()) &&
          !tc.expectedResult?.toLowerCase().includes(filter.search.toLowerCase())) return false;
      if (activeTab === 'positive' && tc.type !== 'Positive') return false;
      if (activeTab === 'negative' && tc.type !== 'Negative') return false;
      if (activeTab === 'edge' && tc.type !== 'Edge Case') return false;
      return true;
    });
  }, [testCases, filter, activeTab]);

  const stats = useMemo(() => ({
    total: testCases.length,
    positive: testCases.filter(t => t.type === 'Positive').length,
    negative: testCases.filter(t => t.type === 'Negative').length,
    edge: testCases.filter(t => t.type === 'Edge Case').length,
    critical: testCases.filter(t => t.priority === 'Critical').length,
    high: testCases.filter(t => t.priority === 'High').length,
  }), [testCases]);

  const exportCSV = () => {
    const header = ['ID', 'Title', 'Category', 'Priority', 'Type', 'Preconditions', 'Steps', 'Expected Result', 'Tags'];
    const rows = testCases.map(tc => [
      tc.id, tc.title, tc.category, tc.priority, tc.type,
      tc.preconditions,
      tc.steps?.join(' | '),
      tc.expectedResult,
      tc.tags?.join(', '),
    ].map(v => `"${(v || '').replace(/"/g, '""')}"`));
    const csv = [header, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${storyInfo.storyId || 'testcases'}_test_cases.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const TABS = [
    { id: 'all', label: `All (${stats.total})` },
    { id: 'positive', label: `Positive (${stats.positive})` },
    { id: 'negative', label: `Negative (${stats.negative})` },
    { id: 'edge', label: `Edge (${stats.edge})` },
  ];

  return (
    <div style={s.wrap}>
      {/* Story Info Header */}
      <div style={s.storyCard}>
        <div style={s.storyHeader}>
          <div>
            <div style={s.storyId}>{storyInfo.storyId}</div>
            <div style={s.storySummary}>{storyInfo.summary}</div>
          </div>
          <div style={s.actionBtns}>
            <button onClick={exportCSV} style={s.exportBtn}>⬇ Export CSV</button>
            <button onClick={onRegenerate} style={s.regenBtn}>↻ Regenerate</button>
            <button onClick={onReset} style={s.resetBtn}>← New Story</button>
          </div>
        </div>

        <div style={s.storyMeta}>
          {storyInfo.status && <Pill text={`Status: ${storyInfo.status}`} />}
          {storyInfo.priority && <Pill text={`Priority: ${storyInfo.priority}`} />}
          {storyInfo.type && <Pill text={`Type: ${storyInfo.type}`} />}
          {storyInfo.confluencePages?.length > 0 && (
            <Pill text={`${storyInfo.confluencePages.length} Confluence pages`} scheme={{
              bg: 'rgba(6,182,212,0.1)', border: 'rgba(6,182,212,0.3)', text: 'var(--accent3)'
            }} />
          )}
        </div>

        {result.summary && <p style={s.summaryText}>{result.summary}</p>}
      </div>

      {/* Stats row */}
      <div style={s.statsRow}>
        {[
          { label: 'Total', val: stats.total, color: 'var(--accent2)' },
          { label: 'Positive', val: stats.positive, color: 'var(--success)' },
          { label: 'Negative', val: stats.negative, color: '#f87171' },
          { label: 'Edge', val: stats.edge, color: 'var(--accent3)' },
          { label: 'Critical', val: stats.critical, color: '#ef4444' },
          { label: 'High', val: stats.high, color: '#f59e0b' },
        ].map(item => (
          <div key={item.label} style={s.statCard}>
            <div style={{ ...s.statVal, color: item.color }}>{item.val}</div>
            <div style={s.statLabel}>{item.label}</div>
          </div>
        ))}
      </div>

      {/* Filter & Tabs */}
      <div style={s.controls}>
        <div style={s.tabs}>
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              style={activeTab === tab.id ? s.tabActive : s.tab}>
              {tab.label}
            </button>
          ))}
        </div>
        <input
          placeholder="Search test cases..."
          value={filter.search}
          onChange={e => setFilter(f => ({ ...f, search: e.target.value }))}
          style={s.searchInput}
        />
        <select value={filter.priority} onChange={e => setFilter(f => ({ ...f, priority: e.target.value }))}
          style={s.select}>
          <option value="">All Priorities</option>
          {['Critical', 'High', 'Medium', 'Low'].map(p => <option key={p}>{p}</option>)}
        </select>
        <select value={filter.category} onChange={e => setFilter(f => ({ ...f, category: e.target.value }))}
          style={s.select}>
          <option value="">All Categories</option>
          {['Functional', 'Integration', 'Security', 'Performance', 'UI'].map(c => <option key={c}>{c}</option>)}
        </select>
      </div>

      {/* Test case list */}
      <div style={s.list}>
        {filtered.length === 0 ? (
          <div style={s.empty}>No test cases match your filters.</div>
        ) : (
          filtered.map((tc, i) => <TestCaseCard key={tc.id || i} tc={tc} index={i} />)
        )}
      </div>
    </div>
  );
}

const s = {
  wrap: { display: 'flex', flexDirection: 'column', gap: 16 },
  storyCard: {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 8,
    padding: '20px 24px',
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  storyHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: 12,
  },
  storyId: {
    fontFamily: 'var(--font-mono)',
    fontSize: 11,
    color: 'var(--accent2)',
    fontWeight: 700,
    letterSpacing: '0.1em',
    marginBottom: 4,
  },
  storySummary: {
    fontFamily: 'var(--font-head)',
    fontSize: 18,
    fontWeight: 700,
    color: 'var(--text)',
  },
  actionBtns: { display: 'flex', gap: 8, flexWrap: 'wrap' },
  exportBtn: {
    background: 'rgba(16,185,129,0.1)',
    border: '1px solid rgba(16,185,129,0.3)',
    color: 'var(--success)',
    padding: '8px 14px',
    borderRadius: 4,
    fontFamily: 'var(--font-mono)',
    fontSize: 11,
    cursor: 'pointer',
    fontWeight: 700,
  },
  regenBtn: {
    background: 'rgba(124,58,237,0.1)',
    border: '1px solid rgba(124,58,237,0.3)',
    color: 'var(--accent2)',
    padding: '8px 14px',
    borderRadius: 4,
    fontFamily: 'var(--font-mono)',
    fontSize: 11,
    cursor: 'pointer',
    fontWeight: 700,
  },
  resetBtn: {
    background: 'var(--surface2)',
    border: '1px solid var(--border)',
    color: 'var(--text2)',
    padding: '8px 14px',
    borderRadius: 4,
    fontFamily: 'var(--font-mono)',
    fontSize: 11,
    cursor: 'pointer',
    fontWeight: 700,
  },
  storyMeta: { display: 'flex', gap: 8, flexWrap: 'wrap' },
  summaryText: { fontSize: 11, color: 'var(--text3)', fontFamily: 'var(--font-mono)' },
  statsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(6, 1fr)',
    gap: 10,
  },
  statCard: {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 6,
    padding: '14px 10px',
    textAlign: 'center',
  },
  statVal: { fontFamily: 'var(--font-head)', fontSize: 28, fontWeight: 800 },
  statLabel: { fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text3)', marginTop: 2, letterSpacing: '0.06em' },
  controls: {
    display: 'flex',
    gap: 10,
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  tabs: { display: 'flex', gap: 4 },
  tab: {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    color: 'var(--text3)',
    padding: '7px 12px',
    borderRadius: 4,
    fontFamily: 'var(--font-mono)',
    fontSize: 11,
    cursor: 'pointer',
    fontWeight: 700,
  },
  tabActive: {
    background: 'rgba(124,58,237,0.15)',
    border: '1px solid rgba(124,58,237,0.4)',
    color: 'var(--accent2)',
    padding: '7px 12px',
    borderRadius: 4,
    fontFamily: 'var(--font-mono)',
    fontSize: 11,
    cursor: 'pointer',
    fontWeight: 700,
  },
  searchInput: {
    flex: 1,
    minWidth: 180,
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 4,
    padding: '8px 12px',
    color: 'var(--text)',
    fontFamily: 'var(--font-mono)',
    fontSize: 11,
    outline: 'none',
  },
  select: {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 4,
    padding: '8px 10px',
    color: 'var(--text2)',
    fontFamily: 'var(--font-mono)',
    fontSize: 11,
    outline: 'none',
    cursor: 'pointer',
  },
  list: { display: 'flex', flexDirection: 'column', gap: 8 },
  card: {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 6,
    overflow: 'hidden',
    transition: 'border-color 0.15s',
  },
  cardExpanded: { borderColor: 'rgba(124,58,237,0.4)' },
  cardTop: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '12px 16px',
    cursor: 'pointer',
    flexWrap: 'wrap',
    userSelect: 'none',
  },
  tcId: {
    fontFamily: 'var(--font-mono)',
    fontSize: 10,
    fontWeight: 700,
    color: 'var(--accent)',
    background: 'rgba(124,58,237,0.1)',
    padding: '2px 8px',
    borderRadius: 3,
    flexShrink: 0,
    letterSpacing: '0.06em',
  },
  tcTitle: {
    flex: 1,
    fontFamily: 'var(--font-mono)',
    fontSize: 12,
    color: 'var(--text)',
    minWidth: 150,
  },
  pills: { display: 'flex', gap: 5, flexWrap: 'wrap' },
  typeIcon: { fontSize: 14, color: 'var(--text3)', flexShrink: 0 },
  expandIcon: { fontSize: 10, color: 'var(--text3)', flexShrink: 0 },
  details: {
    padding: '0 16px 16px',
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    borderTop: '1px solid var(--border)',
    paddingTop: 14,
    position: 'relative',
  },
  copyBtn: {
    position: 'absolute',
    top: 14,
    right: 0,
    background: 'rgba(6,182,212,0.1)',
    border: '1px solid rgba(6,182,212,0.2)',
    color: 'var(--accent3)',
    padding: '4px 10px',
    borderRadius: 4,
    fontFamily: 'var(--font-mono)',
    fontSize: 10,
    cursor: 'pointer',
    fontWeight: 700,
  },
  section: { display: 'flex', flexDirection: 'column', gap: 6 },
  sectionLabel: {
    fontFamily: 'var(--font-mono)',
    fontSize: 9,
    fontWeight: 700,
    letterSpacing: '0.12em',
    color: 'var(--text3)',
  },
  sectionContent: {
    fontFamily: 'var(--font-mono)',
    fontSize: 11,
    color: 'var(--text2)',
    lineHeight: 1.6,
  },
  stepList: { display: 'flex', flexDirection: 'column', gap: 8, paddingLeft: 0, listStyle: 'none' },
  stepItem: { display: 'flex', gap: 10, alignItems: 'flex-start' },
  stepNum: {
    fontFamily: 'var(--font-mono)',
    fontSize: 9,
    fontWeight: 700,
    color: 'var(--accent)',
    background: 'rgba(124,58,237,0.1)',
    padding: '2px 6px',
    borderRadius: 3,
    flexShrink: 0,
    marginTop: 1,
    minWidth: 26,
    textAlign: 'center',
  },
  stepText: {
    fontFamily: 'var(--font-mono)',
    fontSize: 11,
    color: 'var(--text2)',
    lineHeight: 1.5,
  },
  tagRow: { display: 'flex', gap: 6, flexWrap: 'wrap' },
  empty: {
    textAlign: 'center',
    padding: '40px',
    color: 'var(--text3)',
    fontFamily: 'var(--font-mono)',
    fontSize: 12,
  },
};
