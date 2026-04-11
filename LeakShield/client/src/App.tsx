import { useEffect, useState, useMemo, useRef } from "react"; // Added useRef

// --- Icons (Same as yours) ---
const IconGithub = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>;
const IconFile = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/></svg>;
const IconShield = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>;
const IconWarning = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="#58a6ff"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01"/></svg>;

function App() {
  const [view, setView] = useState("explorer");
  const [repoUrl, setRepoUrl] = useState("");
  const [results, setResults] = useState([]);
  const [history, setHistory] = useState([]);
  const [isScanning, setIsScanning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [selectedResult, setSelectedResult] = useState(null);
  const [fileLines, setFileLines] = useState([]);

  // --- THE CRITICAL FIX ---
  // We need a ref because state updates are too slow for the scan-finish event
  const resultsRef = useRef([]);

  useEffect(() => {
    window.electronAPI.getHistory().then(setHistory);
  }, []);

  useEffect(() => {
    const unbindResults = window.electronAPI.onScanResult((data) => {
      const newResult = { ...data, id: Math.random().toString(36).substr(2, 9) };
      
      // Update Ref immediately
      resultsRef.current = [...resultsRef.current, newResult];
      
      // Update State for UI
      setResults(prev => [...prev, newResult]);
      setProgress(p => Math.min(p + 2, 98));
    });

    const handleScanFinished = async () => {
      setIsScanning(false);
      setProgress(100);
      
      // Use the Ref value instead of the state variable
      const finalCount = resultsRef.current.length;
      
      await window.electronAPI.saveToHistory({ 
        url: repoUrl, 
        leakCount: finalCount 
      });
      
      const updatedHistory = await window.electronAPI.getHistory();
      setHistory(updatedHistory);

      setTimeout(() => setProgress(0), 3000);
    };

    const unbindDone = window.electronAPI.onScanDone(handleScanFinished);

    return () => { 
      unbindResults(); 
      unbindDone(); 
    };
  }, [repoUrl]); 

  // Load Snippet Logic
  useEffect(() => {
    let isMounted = true;
    async function loadSnippet() {
      if (!selectedResult?.fullPath) return;
      const res = await window.electronAPI.getFileContent(selectedResult.fullPath);
      if (isMounted && res.success) setFileLines(res.content.split('\n'));
    }
    loadSnippet();
    return () => { isMounted = false; };
  }, [selectedResult]);

  const snippet = useMemo(() => {
    if (!selectedResult || fileLines.length === 0) return [];
    const target = selectedResult.line - 1; 
    const start = Math.max(0, target - 15); 
    const end = Math.min(fileLines.length, target + 16); 
    return fileLines.slice(start, end).map((text, i) => ({
      originalIndex: start + i + 1,
      text,
      isTarget: (start + i) === target
    }));
  }, [selectedResult, fileLines]);

  const handleScan = async () => {
    if (!repoUrl.trim() || isScanning) return;
    setView("explorer");
    setResults([]); 
    resultsRef.current = []; // Reset the ref for new scan
    setSelectedResult(null); 
    setFileLines([]); 
    setProgress(5); 
    setIsScanning(true);
    await window.electronAPI.scanRepo(repoUrl.trim());
  };

  // ... (rest of your return statement and styles remain exactly the same)
  return (
    <div style={styles.appContainer}>
      <div style={styles.activityBar}>
        <div style={view === "explorer" ? styles.activityItemActive : styles.activityItem} onClick={() => setView("explorer")}><IconShield /></div>
        <div style={view === "history" ? styles.activityItemActive : styles.activityItem} onClick={() => setView("history")}><IconGithub /></div>
      </div>

      <aside style={styles.sidebar}>
        <div style={styles.sidebarTitle}>{view === "explorer" ? "SECURITY EXPLORER" : "SCAN HISTORY"}</div>
        <div style={styles.scrollArea}>
          {view === "explorer" ? (
            results.length === 0 && !isScanning ? (
              <div style={styles.emptyPrompt}>Ready for deep analysis...</div>
            ) : (
              results.map((item) => (
                <div key={item.id} style={{...styles.resultCard, backgroundColor: selectedResult?.id === item.id ? '#162e4a' : 'transparent', borderLeft: selectedResult?.id === item.id ? '2px solid #58a6ff' : '2px solid transparent'}} onClick={() => setSelectedResult(item)}>
                  <div style={styles.resultTitle}><IconWarning /><span style={styles.detectorText}>{item.detector}</span></div>
                  <div style={styles.resultMeta}>{item.path.split(/[\\/]/).pop()} • Line {item.line}</div>
                </div>
              ))
            )
          ) : (
            history.length === 0 ? (
              <div style={styles.emptyPrompt}>No previous scans found.</div>
            ) : (
              history.map((h, i) => (
                <div key={i} style={styles.historyCard}>
                  <div style={styles.historyUrl}>{h.url}</div>
                  <div style={styles.historyMeta}>
                    {h.timestamp} • <span style={{color: h.leakCount > 0 ? '#f85149' : '#58a6ff'}}>{h.leakCount} leaks</span>
                  </div>
                </div>
              ))
            )
          )}
        </div>

        {progress > 0 && (
          <div style={styles.progressContainer}>
            <div style={styles.progressLabel}><span>Scanning...</span><span>{progress}%</span></div>
            <div style={styles.progressTrack}><div style={{...styles.progressFill, width: `${progress}%`}} /></div>
          </div>
        )}
      </aside>

      <main style={styles.main}>
        <header style={styles.topBar}>
          <div style={styles.inputGroup}>
            <div style={styles.inputPrefix}><IconGithub /></div>
            <input style={styles.mainInput} placeholder="Paste Repo URL..." value={repoUrl} onChange={(e) => setRepoUrl(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleScan()}/>
          </div>
          <button style={isScanning ? styles.btnDisabled : styles.btnPrimary} onClick={handleScan}>{isScanning ? "Analyzing..." : "Run Scan"}</button>
        </header>

        <div style={styles.editorView}>
          {selectedResult ? (
            <div style={styles.codeContainer}>
              <div style={styles.editorHeader}><div style={{display:'flex', alignItems:'center', gap:'10px'}}><IconFile /><span style={styles.fileName}>{selectedResult.path}</span></div></div>
              <div style={styles.codeWindowOuter}>
                <div style={styles.codeWindowInner}>
                  {snippet.map((line) => (
                    <div key={line.originalIndex} style={{...styles.codeLine, backgroundColor: line.isTarget ? 'rgba(88, 166, 255, 0.12)' : 'transparent'}}>
                      <div style={{...styles.lineNum, color: line.isTarget ? '#58a6ff' : '#484f58', borderRight: line.isTarget ? '2px solid #58a6ff' : '1px solid #21262d'}}>{line.originalIndex}</div>
                      <div style={{...styles.lineText, color: line.isTarget ? '#ffffff' : '#8b949e'}}>{line.text || " "}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div style={styles.welcomeView}>
              <div style={styles.shieldHero}><IconShield /></div>
              <h2 style={{color: '#ffffff'}}>LeakShield Security</h2>
              <p style={{color: '#8b949e'}}>{view === 'history' ? "Browse your history." : "Select a vulnerability to inspect."}</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

// (Styles block is the same as your input)
const styles = {
    appContainer: { display: 'flex', height: '100vh', backgroundColor: '#010409', color: '#c9d1d9', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', overflow: 'hidden' },
    activityBar: { width: '54px', backgroundColor: '#0d1117', display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '15px', borderRight: '1px solid #21262d' },
    activityItem: { padding: '12px', color: '#30363d', cursor: 'pointer' },
    activityItemActive: { padding: '12px', color: '#58a6ff', borderLeft: '2px solid #58a6ff', cursor: 'pointer' },
    sidebar: { width: '300px', backgroundColor: '#0d1117', display: 'flex', flexDirection: 'column', borderRight: '1px solid #21262d' },
    sidebarTitle: { padding: '12px 20px', fontSize: '11px', fontWeight: '700', color: '#58a6ff', letterSpacing: '1px' },
    resultsHeader: { padding: '8px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#161b22', fontSize: '12px', borderBottom: '1px solid #21262d' },
    badge: { backgroundColor: '#1f6feb', color: 'white', padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold' },
    scrollArea: { flex: 1, overflowY: 'auto' },
    emptyPrompt: { padding: '40px 20px', textAlign: 'center', fontSize: '13px', color: '#484f58' },
    resultCard: { padding: '14px 16px', cursor: 'pointer', borderBottom: '1px solid #21262d' },
    resultTitle: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' },
    detectorText: { fontSize: '13px', fontWeight: '600', color: '#58a6ff' },
    resultMeta: { fontSize: '11px', color: '#8b949e' },
    historyCard: { padding: '14px 16px', borderBottom: '1px solid #21262d' },
    historyUrl: { fontSize: '12px', fontWeight: '600', color: '#c9d1d9', overflow: 'hidden', textOverflow: 'ellipsis' },
    historyMeta: { fontSize: '10px', color: '#8b949e', marginTop: '4px' },
    progressContainer: { padding: '16px', backgroundColor: '#0d1117', borderTop: '1px solid #21262d' },
    progressLabel: { display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#8b949e', marginBottom: '8px' },
    progressTrack: { height: '4px', backgroundColor: '#21262d', borderRadius: '2px', overflow: 'hidden' },
    progressFill: { height: '100%', backgroundColor: '#58a6ff', transition: 'width 0.4s' },
    main: { flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 },
    topBar: { height: '64px', backgroundColor: '#0d1117', display: 'flex', alignItems: 'center', padding: '0 24px', gap: '16px', borderBottom: '1px solid #21262d' },
    inputGroup: { flex: 1, display: 'flex', backgroundColor: '#010409', border: '1px solid #30363d', borderRadius: '6px' },
    inputPrefix: { padding: '0 12px', display: 'flex', alignItems: 'center', color: '#30363d' },
    mainInput: { flex: 1, background: 'transparent', border: 'none', color: '#c9d1d9', padding: '10px', outline: 'none' },
    btnPrimary: { backgroundColor: '#1f6feb', color: 'white', border: 'none', padding: '8px 20px', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' },
    btnDisabled: { backgroundColor: '#21262d', color: '#484f58', padding: '8px 20px', borderRadius: '6px' },
    editorView: { flex: 1, backgroundColor: '#010409', display: 'flex', flexDirection: 'column', overflow: 'hidden' },
    codeContainer: { flex: 1, display: 'flex', flexDirection: 'column', margin: '20px', border: '1px solid #30363d', borderRadius: '6px', backgroundColor: '#0d1117', overflow: 'hidden' },
    editorHeader: { padding: '12px 16px', backgroundColor: '#161b22', borderBottom: '1px solid #30363d', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    fileName: { fontSize: '13px', color: '#c9d1d9', fontWeight: '500' },
    snippetMarker: { fontFamily: 'monospace', color: '#58a6ff', fontSize: '11px', backgroundColor: 'rgba(88, 166, 255, 0.1)', padding: '2px 8px', borderRadius: '4px' },
    codeWindowOuter: { flex: 1, overflow: 'auto', backgroundColor: '#0d1117' }, 
    codeWindowInner: { display: 'table', minWidth: '100%', padding: '10px 0' },
    codeLine: { display: 'table-row', lineHeight: '22px' },
    lineNum: { display: 'table-cell', width: '50px', textAlign: 'right', paddingRight: '15px', userSelect: 'none', fontSize: '12px', fontFamily: 'monospace' },
    lineText: { display: 'table-cell', whiteSpace: 'pre', fontSize: '13px', paddingLeft: '15px', fontFamily: 'SFMono-Regular, Consolas, "Liberation Mono", Menlo, monospace' },
    welcomeView: { height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' },
    shieldHero: { color: '#1f6feb', marginBottom: '20px', transform: 'scale(1.5)' }
};

export default App;