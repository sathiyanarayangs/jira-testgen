import React from 'react';

const Input = ({ label, value, onChange, placeholder, hint, required }) => (
  <div style={s.inputGroup}>
    <label style={s.label}>
      {label}
      {required && <span style={s.required}> *</span>}
    </label>
    {hint && <span style={s.hint}>{hint}</span>}
    <input
      type="text"
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      style={s.input}
      autoComplete="off"
    />
  </div>
);

const Textarea = ({ label, value, onChange, placeholder, hint }) => (
  <div style={s.inputGroup}>
    <label style={s.label}>{label}</label>
    {hint && <span style={s.hint}>{hint}</span>}
    <textarea
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      style={{ ...s.input, minHeight: 80, resize: 'vertical' }}
    />
  </div>
);

export default function ConfigPanel({ config, setConfig, onGenerate, error }) {
  const set = key => val => setConfig(c => ({ ...c, [key]: val }));
  const canGenerate = !!config.jiraStoryId;

  return (
    <div style={s.wrap}>
      <div style={s.column}>
        <div style={s.card}>
          <div style={s.cardHead}>
            <span style={s.sectionIcon}>◆</span>
            <span style={s.sectionTitle}>STORY IDENTIFIER</span>
          </div>
          <Input
            label="Jira Story ID"
            value={config.jiraStoryId}
            onChange={set('jiraStoryId')}
            placeholder="e.g. PROJ-1234"
            hint="The unique issue key from your Jira board"
            required
          />
        </div>

        {/* Confluence URLs */}
<div style={s.card}>
    <div style={s.cardHead}>
        <span style={{ ...s.sectionIcon, color: '#172b4d' }}>⬡</span>
        <span style={s.sectionTitle}>CONFLUENCE PAGES (Optional)</span>
    </div>
    <p style={s.confluenceNote}>
        Paste Confluence page URLs to include their content as context for test case generation.
    </p>

    {config.confluenceUrls.map((url, i) => (
        <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input
                type="text"
                value={url}
                onChange={e => {
                    const updated = [...config.confluenceUrls];
                    updated[i] = e.target.value;
                    setConfig(c => ({ ...c, confluenceUrls: updated }));
                }}
                placeholder="https://yourcompany.atlassian.net/wiki/spaces/DEV/pages/123456/Page+Title"
                style={{ ...s.input, flex: 1 }}
            />
            {config.confluenceUrls.length > 1 && (
                <button
                    onClick={() => {
                        const updated = config.confluenceUrls.filter((_, idx) => idx !== i);
                        setConfig(c => ({ ...c, confluenceUrls: updated }));
                    }}
                    style={s.removeBtn}
                >✕</button>
            )}
        </div>
    ))}

    <button
        onClick={() => setConfig(c => ({ ...c, confluenceUrls: [...c.confluenceUrls, ''] }))}
        style={s.addBtn}
    >
        + Add another URL
    </button>
</div>

        <div style={s.card}>
          <div style={s.cardHead}>
            <span style={{ ...s.sectionIcon, color: 'var(--accent3)' }}>◇</span>
            <span style={s.sectionTitle}>ADDITIONAL CONTEXT</span>
          </div>
          <Textarea
            label="Extra Notes for AI"
            value={config.additionalContext}
            onChange={set('additionalContext')}
            placeholder="E.g.: Focus on mobile scenarios. This integrates with PaymentService v2..."
            hint="Optional — add domain knowledge or focus areas for better test cases"
          />
        </div>

        {error && (
          <div style={s.errorBox}>
            <span style={s.errorIcon}>⚠</span>
            <span>{error}</span>
          </div>
        )}

        <button
          onClick={onGenerate}
          disabled={!canGenerate}
          style={canGenerate ? s.btn : s.btnDisabled}
        >
          <span style={s.btnInner}>
            <span>◈</span>
            <span>GENERATE TEST CASES</span>
          </span>
        </button>

        {!canGenerate && (
          <p style={s.helperText}>Enter a Jira Story ID to generate.</p>
        )}
      </div>

      <div style={s.column}>
        <div style={s.infoCard}>
          <div style={s.infoTitle}>HOW IT WORKS</div>
          <div style={s.steps}>
            {[
              ['01', 'Fetches full Jira story — description & acceptance criteria'],
              ['02', 'Searches Confluence for related docs using story ID & keywords'],
              ['03', 'Sends everything to Gemini 2.5 Flash for intelligent analysis'],
              ['04', 'AI generates comprehensive test cases covering edge cases, negatives, security & more'],
              ['05', 'Export as CSV or copy individual test cases'],
            ].map(([num, text]) => (
              <div key={num} style={s.step}>
                <span style={s.stepNum}>{num}</span>
                <span style={s.stepText}>{text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

const s = {
  wrap: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))',
    gap: 24,
    alignItems: 'start',
  },
  column: { display: 'flex', flexDirection: 'column', gap: 16 },
  card: {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 8,
    padding: '20px 24px',
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
  },
  cardHead: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 },
  sectionIcon: { fontSize: 14, color: 'var(--accent2)' },
  sectionTitle: {
    fontFamily: 'var(--font-mono)',
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: '0.12em',
    color: 'var(--text2)',
  },
  inputGroup: { display: 'flex', flexDirection: 'column', gap: 5 },
  label: {
    fontSize: 11,
    fontFamily: 'var(--font-mono)',
    color: 'var(--text2)',
    letterSpacing: '0.05em',
    fontWeight: 700,
  },
  required: { color: 'var(--accent2)' },
  hint: { fontSize: 10, color: 'var(--text3)', fontFamily: 'var(--font-mono)', lineHeight: 1.4 },
  input: {
    background: 'var(--bg)',
    border: '1px solid var(--border)',
    borderRadius: 4,
    padding: '10px 12px',
    color: 'var(--text)',
    fontFamily: 'var(--font-mono)',
    fontSize: 12,
    outline: 'none',
    width: '100%',
  },
  btn: {
    background: 'linear-gradient(135deg, var(--accent), var(--accent2))',
    border: 'none',
    borderRadius: 6,
    padding: '14px 24px',
    color: '#fff',
    fontFamily: 'var(--font-mono)',
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: '0.1em',
    cursor: 'pointer',
  },
  btnDisabled: {
    background: 'var(--surface2)',
    border: '1px solid var(--border)',
    borderRadius: 6,
    padding: '14px 24px',
    color: 'var(--text3)',
    fontFamily: 'var(--font-mono)',
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: '0.1em',
    cursor: 'not-allowed',
  },
  btnInner: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 },
  helperText: { fontSize: 10, color: 'var(--text3)', fontFamily: 'var(--font-mono)', textAlign: 'center' },
  errorBox: {
    background: 'rgba(239,68,68,0.1)',
    border: '1px solid rgba(239,68,68,0.3)',
    borderRadius: 6,
    padding: '12px 16px',
    display: 'flex',
    gap: 10,
    alignItems: 'flex-start',
    color: '#fca5a5',
    fontSize: 12,
    fontFamily: 'var(--font-mono)',
  },
  errorIcon: { fontSize: 16, flexShrink: 0 },
  infoCard: {
    background: 'rgba(124,58,237,0.05)',
    border: '1px solid rgba(124,58,237,0.15)',
    borderRadius: 8,
    padding: '20px 24px',
  },
  infoTitle: {
    fontSize: 10,
    fontFamily: 'var(--font-mono)',
    fontWeight: 700,
    letterSpacing: '0.12em',
    color: 'var(--accent2)',
    marginBottom: 14,
  },
  steps: { display: 'flex', flexDirection: 'column', gap: 10 },
  step: { display: 'flex', gap: 12, alignItems: 'flex-start' },
  stepNum: {
    fontSize: 9,
    fontFamily: 'var(--font-mono)',
    fontWeight: 700,
    color: 'var(--accent)',
    background: 'rgba(124,58,237,0.15)',
    border: '1px solid rgba(124,58,237,0.3)',
    padding: '2px 6px',
    borderRadius: 3,
    flexShrink: 0,
    marginTop: 1,
  },
  stepText: { fontSize: 11, color: 'var(--text2)', fontFamily: 'var(--font-mono)', lineHeight: 1.5 },
  confluenceNote: {
    fontSize: 11,
    color: 'var(--text3)',
    fontFamily: 'var(--font-mono)',
    lineHeight: 1.6,
},
removeBtn: {
    background: 'rgba(239,68,68,0.1)',
    border: '1px solid rgba(239,68,68,0.2)',
    color: '#f87171',
    borderRadius: 4,
    padding: '8px 10px',
    cursor: 'pointer',
    fontFamily: 'var(--font-mono)',
    fontSize: 11,
    flexShrink: 0,
},
addBtn: {
    background: 'transparent',
    border: '1px dashed var(--border)',
    color: 'var(--text3)',
    borderRadius: 4,
    padding: '8px 12px',
    cursor: 'pointer',
    fontFamily: 'var(--font-mono)',
    fontSize: 11,
    textAlign: 'left',
},
};