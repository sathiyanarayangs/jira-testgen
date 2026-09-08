import React, { useState, useCallback } from 'react';
import api from './services/api';
import ConfigPanel from './components/ConfigPanel';
import TestCaseResults from './components/TestCaseResults';
import LoadingScreen from './components/LoadingScreen';

export default function App() {
  const [config, setConfig] = useState({
      jiraStoryId: '',
      additionalContext: '',
      confluenceUrls: [''],   // start with one empty input
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [step, setStep] = useState('config'); // config | loading | results

  const handleGenerate = useCallback(async () => {
    setError(null);
    setLoading(true);
    setStep('loading');

    try {
      const payload = {
          jiraStoryId: config.jiraStoryId.trim(),
          additionalContext: config.additionalContext.trim(),
          confluenceUrls: config.confluenceUrls.filter(u => u.trim() !== ''),
      };

      const data = await api.generateTestCases(payload);
      setResult(data);
      setStep('results');
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Unknown error occurred';
      setError(msg);
      setStep('config');
    } finally {
      setLoading(false);
    }
  }, [config]);

  const handleReset = () => {
    setResult(null);
    setError(null);
    setStep('config');
  };

  return (
    <div style={styles.app}>
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerInner}>
          <div style={styles.logo}>
            <span style={styles.logoText}>TESTGEN</span>
          </div>
        </div>
        <div style={styles.headerSub}>
          AI-powered test case generation from your Jira stories & Confluence docs
        </div>
      </header>

      {/* Main Content */}
      <main style={styles.main}>
        {step === 'loading' && <LoadingScreen />}

        {step === 'config' && (
          <ConfigPanel
            config={config}
            setConfig={setConfig}
            onGenerate={handleGenerate}
            error={error}
          />
        )}

        {step === 'results' && result && (
          <TestCaseResults
            result={result}
            onReset={handleReset}
            onRegenerate={handleGenerate}
          />
        )}
      </main>

      {/* Footer */}
      <footer style={styles.footer}>
        <span>TestGen</span>
      </footer>
    </div>
  );
}

const styles = {
  app: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    background: 'var(--bg)',
  },
  header: {
    borderBottom: '1px solid var(--border)',
    padding: '20px 32px',
    background: 'var(--surface)',
    position: 'sticky',
    top: 0,
    zIndex: 100,
    backdropFilter: 'blur(12px)',
  },
  headerInner: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    maxWidth: 1400,
    margin: '0 auto',
  },
  logo: {
    fontSize: 22,
    fontFamily: 'var(--font-head)',
    fontWeight: 800,
    letterSpacing: '0.05em',
  },
  logoBracket: { color: 'var(--accent2)' },
  logoText: { color: 'var(--text)', margin: '0 2px' },
  logoAi: {
    color: 'var(--accent3)',
    fontSize: 16,
    fontFamily: 'var(--font-mono)',
    fontWeight: 700,
  },
  headerRight: {
    display: 'flex',
    gap: 8,
    flexWrap: 'wrap',
  },
  badge: {
    background: 'rgba(124,58,237,0.15)',
    border: '1px solid rgba(124,58,237,0.4)',
    color: 'var(--accent2)',
    padding: '4px 10px',
    borderRadius: 4,
    fontSize: 10,
    fontFamily: 'var(--font-mono)',
    fontWeight: 700,
    letterSpacing: '0.08em',
  },
  badge2: {
    background: 'rgba(6,182,212,0.1)',
    border: '1px solid rgba(6,182,212,0.3)',
    color: 'var(--accent3)',
    padding: '4px 10px',
    borderRadius: 4,
    fontSize: 10,
    fontFamily: 'var(--font-mono)',
    fontWeight: 700,
    letterSpacing: '0.08em',
  },
  headerSub: {
    color: 'var(--text3)',
    fontSize: 11,
    marginTop: 6,
    maxWidth: 1400,
    margin: '6px auto 0',
    fontFamily: 'var(--font-mono)',
  },
  main: {
    flex: 1,
    padding: '32px',
    maxWidth: 1400,
    margin: '0 auto',
    width: '100%',
  },
  footer: {
    borderTop: '1px solid var(--border)',
    padding: '16px 32px',
    display: 'flex',
    gap: 12,
    alignItems: 'center',
    fontSize: 11,
    color: 'var(--text2)',
    fontFamily: 'var(--font-mono)',
    justifyContent: 'center',
  },
};
