import React, { useState, useRef } from 'react';
import axios from 'axios';

const API = 'http://localhost:5000';

export default function ExcelUpload({ onUploadSuccess }) {
  const [dragging, setDragging] = useState(false);
  const [file,     setFile]     = useState(null);
  const [uploading,setUploading]= useState(false);
  const [result,   setResult]   = useState(null);
  const inputRef = useRef(null);

  const handleFile = f => {
    if (!f) return;
    const ext = f.name.split('.').pop().toLowerCase();
    if (!['xlsx','xls','csv'].includes(ext)) { setResult({ ok: false, msg: 'Only .xlsx, .xls, .csv files are supported.' }); return; }
    setFile(f); setResult(null);
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true); setResult(null);
    const fd = new FormData();
    fd.append('file', file);
    try {
      const res = await axios.post(`${API}/upload`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setResult({ ok: true, msg: res.data.message, skipped: res.data.skipped });
      setFile(null);
      onUploadSuccess?.();
    } catch (err) {
      setResult({ ok: false, msg: err.response?.data?.message || err.message, errors: err.response?.data?.errors });
    } finally { setUploading(false); }
  };

  return (
    <div style={{ maxWidth: 640 }}>
      {/* Drop zone */}
      <div
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={e => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]); }}
        onClick={() => inputRef.current?.click()}
        style={{ border: `2px dashed ${dragging ? '#6366f1' : '#e2e8f0'}`, borderRadius: 14, padding: '48px 24px',
          textAlign: 'center', background: dragging ? '#eef2ff' : '#f8fafc', cursor: 'pointer', transition: 'all 0.2s' }}>
        <input ref={inputRef} type="file" accept=".xlsx,.xls,.csv" style={{ display: 'none' }} onChange={e => handleFile(e.target.files[0])} />
        <div style={{ fontSize: 40, marginBottom: 12 }}>{file ? '📄' : '📤'}</div>
        {file
          ? <div style={{ fontWeight: 600, color: '#1e293b', fontSize: 14 }}>{file.name}<span style={{ marginLeft: 10, color: '#94a3b8', fontWeight: 400 }}>({(file.size / 1024).toFixed(1)} KB)</span></div>
          : <>
              <div style={{ fontWeight: 600, color: '#1e293b', fontSize: 14, marginBottom: 6 }}>Drop your Excel file here, or click to browse</div>
              <div style={{ fontSize: 12, color: '#94a3b8' }}>Supports .xlsx, .xls, .csv</div>
            </>
        }
      </div>

      {/* Expected columns */}
      <div style={{ background: '#fff', borderRadius: 12, padding: '16px 20px', marginTop: 16, border: '1px solid #f1f5f9' }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Expected Column Headers</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {['Student Name','Subject','Test','Obtained Marks','Total Marks','Date','Class'].map(col => (
            <span key={col} style={{ background: '#f1f5f9', color: '#475569', padding: '3px 10px', borderRadius: 6, fontSize: 12, fontFamily: 'monospace' }}>{col}</span>
          ))}
        </div>
      </div>

      {file && (
        <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
          <button onClick={handleUpload} disabled={uploading}
            style={{ flex: 1, padding: '11px', borderRadius: 10, background: '#6366f1', color: '#fff', border: 'none', fontWeight: 700, fontSize: 14,
              cursor: uploading ? 'not-allowed' : 'pointer', opacity: uploading ? 0.6 : 1, boxShadow: '0 2px 8px rgba(99,102,241,0.3)' }}>
            {uploading ? 'Uploading…' : 'Upload File'}
          </button>
          <button onClick={() => { setFile(null); setResult(null); }}
            style={{ padding: '11px 18px', borderRadius: 10, border: '1px solid #e2e8f0', background: '#fff', color: '#64748b', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
            Clear
          </button>
        </div>
      )}

      {result && (
        <div style={{ marginTop: 14, padding: '12px 16px', borderRadius: 10, border: '1px solid',
          background: result.ok ? '#f0fdf4' : '#fef2f2', borderColor: result.ok ? '#bbf7d0' : '#fecaca', color: result.ok ? '#166534' : '#991b1b' }}>
          <div style={{ fontWeight: 600, fontSize: 13 }}>{result.msg}</div>
          {result.skipped?.length > 0 && (
            <div style={{ marginTop: 8, fontSize: 12 }}>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>Skipped rows:</div>
              {result.skipped.slice(0, 5).map((e, i) => (
                <div key={i} style={{ color: '#92400e' }}>Row {e.row}: {e.reason}</div>
              ))}
              {result.skipped.length > 5 && <div style={{ color: '#92400e' }}>…and {result.skipped.length - 5} more</div>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
