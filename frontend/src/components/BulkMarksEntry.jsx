import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const API = 'http://localhost:5000';
const today = () => new Date().toISOString().split('T')[0];
const clamp = (v, min, max) => Math.min(Math.max(Number(v), min), max);
const pct = (m, t) => t > 0 ? ((m / t) * 100).toFixed(1) : '—';
const gradeColor = p => p >= 75 ? '#10b981' : p >= 50 ? '#f59e0b' : '#ef4444';

const Field = ({ label, error, children }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
    <label style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
      {label} <span style={{ color: '#ef4444' }}>*</span>
    </label>
    {children}
    {error && <span style={{ fontSize: 11, color: '#ef4444' }}>{error}</span>}
  </div>
);

const inp = err => ({
  padding: '9px 12px', borderRadius: 9, border: `1.5px solid ${err ? '#f87171' : '#e2e8f0'}`,
  fontSize: 13, color: '#1e293b', background: '#fff', outline: 'none', width: '100%', boxSizing: 'border-box',
});

export default function BulkMarksEntry({ onSaveSuccess, classes = [] }) {
  const [header, setHeader] = useState({ class: '', subject: '', test: '', date: today(), total: '' });
  const [rows,   setRows]   = useState([]);
  const [newName, setNewName] = useState('');
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState(null);
  const [errors, setErrors] = useState({});
  const newNameRef = useRef(null);

  useEffect(() => {
    if (!header.class) { setRows([]); return; }
    setLoadingStudents(true);
    axios.get(`${API}/marks/${header.class}`)
      .then(r => {
        const names = [...new Set((r.data.data || []).map(d => d.name).filter(Boolean))].sort();
        setRows(names.map((name, i) => ({ id: i, name, marks: '', isNew: false })));
      })
      .catch(() => setRows([]))
      .finally(() => setLoadingStudents(false));
  }, [header.class]);

  const setH = (k, v) => { setHeader(h => ({ ...h, [k]: v })); setErrors(e => ({ ...e, [k]: null })); setResult(null); };
  const setMarks = (id, v) => {
    const t = Number(header.total);
    const safe = v === '' ? '' : String(t > 0 ? clamp(v, 0, t) : Math.max(0, Number(v)));
    setRows(rs => rs.map(r => r.id === id ? { ...r, marks: safe } : r));
    setResult(null);
  };

  const addStudent = () => {
    const name = newName.trim();
    if (!name) return;
    if (rows.some(r => r.name.toLowerCase() === name.toLowerCase())) {
      setErrors(e => ({ ...e, newName: 'Already in list' })); return;
    }
    setRows(rs => [...rs, { id: Date.now(), name, marks: '', isNew: true }]);
    setNewName(''); setErrors(e => ({ ...e, newName: null }));
    setTimeout(() => newNameRef.current?.focus(), 50);
  };

  const fillAll = val => {
    const t = Number(header.total);
    setRows(rs => rs.map(r => ({ ...r, marks: String(t > 0 ? clamp(val, 0, t) : Math.max(0, Number(val))) })));
  };

  const validate = () => {
    const e = {};
    if (!header.class)   e.class   = 'Required';
    if (!header.subject) e.subject = 'Required';
    if (!header.test)    e.test    = 'Required';
    if (!header.date)    e.date    = 'Required';
    if (!header.total || isNaN(Number(header.total)) || Number(header.total) <= 0) e.total = 'Must be > 0';
    if (!rows.some(r => r.marks !== '')) e.rows = 'Enter marks for at least one student';
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true); setResult(null);
    const records = rows.filter(r => r.marks !== '').map(r => ({
      name: r.name, subject: header.subject, test: header.test,
      date: header.date, marks: Number(r.marks), total: Number(header.total), class: header.class,
    }));
    try {
      const res = await axios.post(`${API}/marks/bulk`, { records });
      setResult({ ok: true, msg: res.data.message });
      setRows(rs => rs.map(r => ({ ...r, marks: '' })));
      onSaveSuccess?.();
    } catch (err) {
      setResult({ ok: false, msg: err.response?.data?.message || err.message });
    } finally { setSaving(false); }
  };

  const filled = rows.filter(r => r.marks !== '').length;
  const totalN = Number(header.total);

  return (
    <div style={{ background: '#fff', borderRadius: 16, padding: '28px 32px', border: '1px solid #f1f5f9', boxShadow: '0 1px 6px rgba(0,0,0,0.06)', maxWidth: 900 }}>
      {/* Header fields */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(155px, 1fr))', gap: '12px 16px', padding: 20, background: '#f8fafc', borderRadius: 12, marginBottom: 24, border: '1px solid #f1f5f9' }}>
        <Field label="Class" error={errors.class}>
          <select style={inp(errors.class)} value={header.class} onChange={e => setH('class', e.target.value)}>
            <option value="">— Select —</option>
            {classes.map(c => <option key={c}>{c}</option>)}
          </select>
          <input style={{ ...inp(false), marginTop: 6 }} placeholder="Or type new class…" value={header.class} onChange={e => setH('class', e.target.value)} />
        </Field>
        <Field label="Subject" error={errors.subject}>
          <input style={inp(errors.subject)} placeholder="e.g. Maths" value={header.subject} onChange={e => setH('subject', e.target.value)} />
        </Field>
        <Field label="Test / DPP" error={errors.test}>
          <input style={inp(errors.test)} placeholder="e.g. DPP 3" value={header.test} onChange={e => setH('test', e.target.value)} />
        </Field>
        <Field label="Date" error={errors.date}>
          <input type="date" style={inp(errors.date)} value={header.date} onChange={e => setH('date', e.target.value)} />
        </Field>
        <Field label="Total Marks" error={errors.total}>
          <input type="number" min={1} style={inp(errors.total)} placeholder="e.g. 100" value={header.total} onChange={e => setH('total', e.target.value)} />
        </Field>
      </div>

      {/* Table controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontWeight: 700, fontSize: 14, color: '#1e293b' }}>Students</span>
          {loadingStudents
            ? <span style={{ fontSize: 12, color: '#94a3b8' }}>Loading…</span>
            : rows.length > 0 && <span style={{ background: '#eef2ff', color: '#4338ca', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20 }}>{rows.length} loaded · {filled} filled</span>}
        </div>
        {rows.length > 0 && totalN > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#64748b' }}>
            Quick fill:
            {[0, 25, 50, 75, 100].map(p => (
              <button key={p} onClick={() => fillAll((totalN * p / 100).toFixed(0))}
                style={{ padding: '3px 10px', borderRadius: 20, border: '1px solid #e2e8f0', background: '#fff', fontSize: 11, fontWeight: 600, color: '#475569', cursor: 'pointer' }}>
                {p}%
              </button>
            ))}
          </div>
        )}
      </div>

      {!header.class && (
        <div style={{ padding: 36, textAlign: 'center', color: '#94a3b8', background: '#f8fafc', borderRadius: 10, border: '1px dashed #e2e8f0', fontSize: 13 }}>
          Select a class above to load students
        </div>
      )}

      {header.class && rows.length > 0 && (
        <div style={{ overflowX: 'auto', borderRadius: 10, border: '1px solid #f1f5f9' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #f1f5f9' }}>
                {['#', 'Student Name', `Marks${totalN > 0 ? ` / ${totalN}` : ''}`, '%', ''].map((h, i) => (
                  <th key={i} style={{ padding: '9px 14px', textAlign: 'left', fontWeight: 700, fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, idx) => {
                const mn = Number(row.marks);
                const p = row.marks !== '' ? parseFloat(pct(mn, totalN)) : null;
                return (
                  <tr key={row.id} style={{ borderBottom: '1px solid #f8fafc', background: idx % 2 === 0 ? '#fff' : '#fafafa' }}>
                    <td style={{ padding: '8px 14px', color: '#cbd5e1', fontSize: 12 }}>{idx + 1}</td>
                    <td style={{ padding: '8px 14px' }}>
                      <span style={{ fontWeight: 600, color: '#1e293b' }}>{row.name}</span>
                      {row.isNew && <span style={{ marginLeft: 7, background: '#ede9fe', color: '#7c3aed', fontSize: 10, fontWeight: 700, padding: '1px 7px', borderRadius: 20 }}>new</span>}
                    </td>
                    <td style={{ padding: '8px 14px' }}>
                      <input type="number" min={0} max={totalN || undefined} value={row.marks} placeholder="—"
                        onChange={e => setMarks(row.id, e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter' || e.key === 'Tab') {
                            e.preventDefault();
                            const all = document.querySelectorAll('[data-marks]');
                            const i = [...all].indexOf(e.target);
                            all[i + 1]?.focus();
                          }
                        }}
                        data-marks
                        style={{ width: 88, padding: '6px 10px', borderRadius: 7, border: '1.5px solid #e2e8f0', fontSize: 13, textAlign: 'center', outline: 'none' }} />
                    </td>
                    <td style={{ padding: '8px 14px', fontWeight: 700, color: p === null ? '#cbd5e1' : gradeColor(p) }}>
                      {p === null ? '—' : `${p}%`}
                    </td>
                    <td style={{ padding: '8px 14px' }}>
                      <button onClick={() => setRows(rs => rs.filter(r => r.id !== row.id))}
                        style={{ background: 'none', border: 'none', color: '#e2e8f0', cursor: 'pointer', fontSize: 15 }}
                        onMouseEnter={e => e.target.style.color = '#ef4444'}
                        onMouseLeave={e => e.target.style.color = '#e2e8f0'}>✕</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {errors.rows && <div style={{ fontSize: 12, color: '#ef4444', marginTop: 8 }}>{errors.rows}</div>}

      {header.class && (
        <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
          <input ref={newNameRef} value={newName} placeholder="Add student name…"
            onChange={e => { setNewName(e.target.value); setErrors(v => ({ ...v, newName: null })); }}
            onKeyDown={e => e.key === 'Enter' && addStudent()}
            style={{ flex: 1, padding: '9px 12px', borderRadius: 9, border: `1.5px solid ${errors.newName ? '#f87171' : '#e2e8f0'}`, fontSize: 13, outline: 'none' }} />
          <button onClick={addStudent}
            style={{ padding: '9px 20px', borderRadius: 9, background: '#6366f1', color: '#fff', border: 'none', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
            + Add
          </button>
        </div>
      )}
      {errors.newName && <div style={{ fontSize: 11, color: '#ef4444', marginTop: 4 }}>{errors.newName}</div>}

      {result && (
        <div style={{ marginTop: 16, padding: '11px 16px', borderRadius: 10, border: '1px solid', fontSize: 13, fontWeight: 500,
          background: result.ok ? '#f0fdf4' : '#fef2f2', borderColor: result.ok ? '#bbf7d0' : '#fecaca', color: result.ok ? '#166534' : '#991b1b' }}>
          {result.msg}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 20, paddingTop: 16, borderTop: '1px solid #f1f5f9' }}>
        <span style={{ fontSize: 13, color: '#94a3b8' }}>{filled > 0 ? `${filled} record${filled > 1 ? 's' : ''} ready` : 'Fill marks above to save'}</span>
        <button onClick={handleSave} disabled={saving || filled === 0}
          style={{ padding: '10px 28px', borderRadius: 10, background: '#6366f1', color: '#fff', border: 'none', fontWeight: 700, fontSize: 14,
            cursor: saving || filled === 0 ? 'not-allowed' : 'pointer', opacity: saving || filled === 0 ? 0.5 : 1,
            boxShadow: '0 2px 8px rgba(99,102,241,0.3)' }}>
          {saving ? 'Saving…' : `Save ${filled || ''} Record${filled !== 1 ? 's' : ''}`}
        </button>
      </div>
    </div>
  );
}
