import React, { useState, useEffect } from 'react';

const STEPS = [
  { icon: '⬡', label: 'Connecting to Jira...', color: '#0052cc' },
  { icon: '◎', label: 'Fetching story data...', color: '#0052cc' },
  { icon: '⬡', label: 'Searching Confluence docs...', color: '#172b4d' },
  { icon: '◈', label: 'Analyzing with Gemini 2.5 Flash...', color: '#a855f7' },
  { icon: '✦', label: 'Generating test cases...', color: '#7c3aed' },
  { icon: '◇', label: 'Structuring results...', color: '#06b6d4' },
];

export default function LoadingScreen() {
  const [currentStep, setCurrentStep] = useState(0);
  const [dots, setDots] = useState('');

  useEffect(() => {
    const stepTimer = setInterval(() => {
      setCurrentStep(p => Math.min(p + 1, STEPS.length - 1));
    }, 3000);
    const dotTimer = setInterval(() => {
      setDots(d => d.length >= 3 ? '' : d + '.');
    }, 400);
    return () => { clearInterval(stepTimer); clearInterval(dotTimer); };
  }, []);

  const step = STEPS[currentStep];

  return (
    <div style={s.wrap}>
      {/* Animated core */}
      <div style={s.core}>
        <div style={s.ring1} />
        <div style={s.ring2} />
        <div style={s.ring3} />
        <div style={s.center}>
          <span style={{ ...s.icon, color: step.color }}>{step.icon}</span>
        </div>
      </div>

      <div style={s.label}>{step.label}{dots}</div>

      {/* Progress steps */}
      <div style={s.steps}>
        {STEPS.map((st, i) => (
          <div key={i} style={s.stepRow}>
            <div style={{
              ...s.dot,
              background: i < currentStep ? 'var(--success)' : i === currentStep ? 'var(--accent2)' : 'var(--border)',
              boxShadow: i === currentStep ? '0 0 8px var(--accent2)' : 'none',
            }} />
            <span style={{
              ...s.stepLabel,
              color: i <= currentStep ? 'var(--text2)' : 'var(--text3)',
            }}>{st.label.replace('...', '')}</span>
            {i < currentStep && <span style={s.check}>✓</span>}
          </div>
        ))}
      </div>

      <p style={s.note}>This may take 15–60 seconds depending on story complexity...</p>
    </div>
  );
}

const pulse = `
  @keyframes pulse-ring {
    0% { transform: scale(1); opacity: 0.6; }
    50% { transform: scale(1.08); opacity: 0.3; }
    100% { transform: scale(1); opacity: 0.6; }
  }
  @keyframes spin-slow {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;

// inject styles
if (!document.getElementById('loading-keyframes')) {
  const el = document.createElement('style');
  el.id = 'loading-keyframes';
  el.textContent = pulse;
  document.head.appendChild(el);
}

const s = {
  wrap: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '60vh',
    gap: 24,
  },
  core: {
    position: 'relative',
    width: 120,
    height: 120,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring1: {
    position: 'absolute',
    inset: 0,
    borderRadius: '50%',
    border: '2px solid rgba(124,58,237,0.3)',
    animation: 'pulse-ring 2s ease-in-out infinite',
  },
  ring2: {
    position: 'absolute',
    inset: 16,
    borderRadius: '50%',
    border: '2px solid rgba(168,85,247,0.5)',
    animation: 'spin-slow 4s linear infinite',
    borderTopColor: 'var(--accent2)',
  },
  ring3: {
    position: 'absolute',
    inset: 32,
    borderRadius: '50%',
    border: '1px solid rgba(6,182,212,0.3)',
    animation: 'spin-slow 6s linear infinite reverse',
    borderRightColor: 'var(--accent3)',
  },
  center: {
    position: 'relative',
    zIndex: 1,
    fontSize: 28,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: { fontSize: 28, transition: 'color 0.5s' },
  label: {
    fontFamily: 'var(--font-mono)',
    fontSize: 13,
    color: 'var(--text2)',
    letterSpacing: '0.05em',
    minWidth: 280,
    textAlign: 'center',
  },
  steps: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 8,
    padding: '20px 28px',
    minWidth: 320,
  },
  stepRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: '50%',
    flexShrink: 0,
    transition: 'all 0.3s',
  },
  stepLabel: {
    fontFamily: 'var(--font-mono)',
    fontSize: 11,
    flex: 1,
    transition: 'color 0.3s',
  },
  check: { color: 'var(--success)', fontSize: 11 },
  note: {
    fontFamily: 'var(--font-mono)',
    fontSize: 10,
    color: 'var(--text3)',
    textAlign: 'center',
  },
};
