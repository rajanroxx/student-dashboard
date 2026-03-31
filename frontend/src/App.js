import React, { useState, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement,
  LineElement, BarElement, ArcElement, RadialLinearScale,
  Title, Tooltip, Legend, Filler,
} from 'chart.js';
import { Bar, Line, Doughnut, Radar } from 'react-chartjs-2';
import BulkMarksEntry from './components/BulkMarksEntry';
import ExcelUpload from './components/ExcelUpload';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, ArcElement, RadialLinearScale, Title, Tooltip, Legend, Filler);

const API = 'http://localhost:5000';

const fmt = d => { if (!d) return '—'; const dt = new Date(d); return isNaN(dt) ? '—' : dt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }); };
const pct = (m, t) => t > 0 ? ((m / t) * 100).toFixed(1) : '0.0';
const grade = p => p >= 90 ? { g: 'A+', c: '#10b981' } : p >= 75 ? { g: 'A', c: '#34d399' } : p >= 60 ? { g: 'B', c: '#f59e0b' } : p >= 45 ? { g: 'C', c: '#f97316' } : { g: 'F', c: '#ef4444' };

const CHART_COLORS = ['#6366f1','#10b981','#f59e0b','#ef4444','#8b5cf6','#06b6d4','#ec4899','#14b8a6'];

const chartOpts = (title, extra = {}) => ({
  responsive: true, maintainAspectRatio: false,
  plugins: { legend: { display: false }, title: { display: false },
    tooltip: { backgroundColor: '#1e293b', titleColor: '#f8fafc', bodyColor: '#cbd5e1',
      padding: 10, cornerRadius: 8, borderColor: '#334155', borderWidth: 1 } },
  scales: { x: { grid: { color: '#f1f5f9' }, ticks: { color: '#94a3b8', font: { size: 11 } } },
    y: { grid: { color: '#f1f5f9' }, ticks: { color: '#94a3b8', font: { size: 11 } }, min: 0, max: 100,
      callback: v => v + '%' } },
  ...extra,
});

// ── Stat Card ─────────────────────────────────────────────────────────────────
const StatCard = ({ label, value, sub, icon, color, trend }) => (
  <div style={{ background: '#fff', borderRadius: 16, padding: '20px 24px', border: '1px solid #f1f5f9',
    boxShadow: '0 1px 4px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', gap: 4 }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
      <span style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
      <span style={{ fontSize: 22, lineHeight: 1 }}>{icon}</span>
    </div>
    <div style={{ fontSize: 28, fontWeight: 800, color: color || '#1e293b', fontFamily: "'Sora', sans-serif", lineHeight: 1.1 }}>{value}</div>
    {sub && <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>{sub}</div>}
    {trend != null && (
      <div style={{ fontSize: 12, color: trend >= 0 ? '#10b981' : '#ef4444', fontWeight: 600, marginTop: 4 }}>
        {trend >= 0 ? '▲' : '▼'} {Math.abs(trend).toFixed(1)}% vs last test
      </div>
    )}
  </div>
);

// ── Filter Bar ────────────────────────────────────────────────────────────────
const Sel = ({ label, value, onChange, options, disabled }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
    <label style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</label>
    <select value={value} onChange={onChange} disabled={disabled}
      style={{ padding: '8px 32px 8px 12px', borderRadius: 9, border: '1.5px solid #e2e8f0', fontSize: 13,
        color: '#1e293b', background: '#fff', cursor: 'pointer', outline: 'none', minWidth: 130,
        appearance: 'none', backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%2394a3b8' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`,
        backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center' }}>
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  </div>
);

// ── Chart Card ────────────────────────────────────────────────────────────────
const ChartCard = ({ title, subtitle, children, height = 260, fullWidth }) => (
  <div style={{ background: '#fff', borderRadius: 16, padding: '22px 24px', border: '1px solid #f1f5f9',
    boxShadow: '0 1px 4px rgba(0,0,0,0.05)', gridColumn: fullWidth ? '1 / -1' : undefined }}>
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 14, fontWeight: 700, color: '#1e293b' }}>{title}</div>
      {subtitle && <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>{subtitle}</div>}
    </div>
    <div style={{ height }}>{children}</div>
  </div>
);

// ── Badge ─────────────────────────────────────────────────────────────────────
const Badge = ({ pctVal }) => {
  const { g, c } = grade(pctVal);
  return <span style={{ background: c + '20', color: c, padding: '2px 9px', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>{g}</span>;
};

// ─────────────────────────────────────────────────────────────────────────────
export default function App() {
  const [allData, setAllData]         = useState([]);
  const [classes, setClasses]         = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState(null);
  const [activeTab, setActiveTab]     = useState('dashboard'); // dashboard | bulk | upload | table
  const [studentView, setStudentView] = useState(null); // null or student name

  // Filters
  const [fClass,   setFClass]   = useState('');
  const [fSubject, setFSubject] = useState('');
  const [fTest,    setFTest]    = useState('');
  const [fStudent, setFStudent] = useState('');
  const [fDateFrom,setFDateFrom]= useState('');
  const [fDateTo,  setFDateTo]  = useState('');
  const [chartType,setChartType]= useState('bar'); // bar | line
  const [sortCol,  setSortCol]  = useState('name');
  const [sortDir,  setSortDir]  = useState('asc');
  const [search,   setSearch]   = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const [cr, mr] = await Promise.all([
        axios.get(`${API}/classes`),
        axios.get(`${API}/marks`),
      ]);
      const cls = cr.data.classes || [];
      setClasses(cls);
      setAllData(mr.data.data || []);
      if (cls.length && !fClass) setFClass('');
    } catch {
      setError('Cannot reach backend. Make sure server is running on port 5000.');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── derived filter options ──────────────────────────────────────────────────
  const subjectOpts = useMemo(() => ['', ...[...new Set(allData.map(d => d.subject).filter(Boolean))].sort()], [allData]);
  const testOpts    = useMemo(() => ['', ...[...new Set(allData.map(d => d.test).filter(Boolean))].sort()], [allData]);
  const studentOpts = useMemo(() => ['', ...[...new Set(allData.map(d => d.name).filter(Boolean))].sort()], [allData]);

  // ── filtered data ───────────────────────────────────────────────────────────
  const filtered = useMemo(() => allData.filter(d => {
    if (fClass   && d.class   !== fClass)   return false;
    if (fSubject && d.subject !== fSubject) return false;
    if (fTest    && d.test    !== fTest)    return false;
    if (fStudent && d.name    !== fStudent) return false;
    if (fDateFrom && new Date(d.date) < new Date(fDateFrom)) return false;
    if (fDateTo   && new Date(d.date) > new Date(fDateTo))   return false;
    if (search && !d.name?.toLowerCase().includes(search.toLowerCase()) &&
        !d.subject?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }), [allData, fClass, fSubject, fTest, fStudent, fDateFrom, fDateTo, search]);

  const clearFilters = () => { setFClass(''); setFSubject(''); setFTest(''); setFStudent(''); setFDateFrom(''); setFDateTo(''); setSearch(''); };

  // ── stats ───────────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    if (!filtered.length) return { avg: 0, totalM: 0, totalT: 0, records: 0, students: 0, top: null, low: null };
    const totalM = filtered.reduce((s, d) => s + d.marks, 0);
    const totalT = filtered.reduce((s, d) => s + d.total, 0);
    const avg = totalT > 0 ? (totalM / totalT) * 100 : 0;
    const studentMap = {};
    filtered.forEach(d => {
      if (!studentMap[d.name]) studentMap[d.name] = { marks: 0, total: 0 };
      studentMap[d.name].marks += d.marks; studentMap[d.name].total += d.total;
    });
    const ranked = Object.entries(studentMap)
      .map(([name, v]) => ({ name, pct: v.total > 0 ? (v.marks / v.total) * 100 : 0 }))
      .sort((a, b) => b.pct - a.pct);
    return { avg, totalM, totalT, records: filtered.length, students: ranked.length, top: ranked[0], low: ranked[ranked.length - 1] };
  }, [filtered]);

  // ── chart data ──────────────────────────────────────────────────────────────
  // Per-student performance
  const studentChartData = useMemo(() => {
    const map = {};
    filtered.forEach(d => {
      if (!map[d.name]) map[d.name] = { marks: 0, total: 0 };
      map[d.name].marks += d.marks; map[d.name].total += d.total;
    });
    const entries = Object.entries(map).map(([name, v]) => ({ name, pct: v.total > 0 ? (v.marks / v.total) * 100 : 0 }))
      .sort((a, b) => b.pct - a.pct).slice(0, 20);
    return {
      labels: entries.map(e => e.name),
      datasets: [{ label: 'Performance %', data: entries.map(e => parseFloat(e.pct.toFixed(1))),
        backgroundColor: entries.map((e, i) => CHART_COLORS[i % CHART_COLORS.length] + 'cc'),
        borderColor: entries.map((e, i) => CHART_COLORS[i % CHART_COLORS.length]),
        borderWidth: 1.5, borderRadius: 6 }],
    };
  }, [filtered]);

  // Per-subject performance
  const subjectChartData = useMemo(() => {
    const map = {};
    filtered.forEach(d => {
      if (!map[d.subject]) map[d.subject] = { marks: 0, total: 0 };
      map[d.subject].marks += d.marks; map[d.subject].total += d.total;
    });
    const entries = Object.entries(map).map(([sub, v]) => ({ sub, pct: v.total > 0 ? (v.marks / v.total) * 100 : 0 }));
    return {
      labels: entries.map(e => e.sub),
      datasets: [{ label: 'Avg %', data: entries.map(e => parseFloat(e.pct.toFixed(1))),
        backgroundColor: entries.map((_, i) => CHART_COLORS[i % CHART_COLORS.length] + 'cc'),
        borderColor: entries.map((_, i) => CHART_COLORS[i % CHART_COLORS.length]),
        borderWidth: 1.5, borderRadius: 6 }],
    };
  }, [filtered]);

  // Per-test performance
  const testChartData = useMemo(() => {
    const map = {};
    filtered.forEach(d => {
      if (!map[d.test]) map[d.test] = { marks: 0, total: 0 };
      map[d.test].marks += d.marks; map[d.test].total += d.total;
    });
    const entries = Object.entries(map).map(([t, v]) => ({ t, pct: v.total > 0 ? (v.marks / v.total) * 100 : 0 }));
    return {
      labels: entries.map(e => e.t),
      datasets: [{ label: 'Avg %', data: entries.map(e => parseFloat(e.pct.toFixed(1))),
        backgroundColor: '#6366f1cc', borderColor: '#6366f1', borderWidth: 1.5, borderRadius: 6, fill: true,
        tension: 0.4 }],
    };
  }, [filtered]);

  // Grade distribution doughnut
  const gradeDistData = useMemo(() => {
    const bins = { 'A+ (≥90)': 0, 'A (75-89)': 0, 'B (60-74)': 0, 'C (45-59)': 0, 'F (<45)': 0 };
    const studentMap = {};
    filtered.forEach(d => {
      if (!studentMap[d.name]) studentMap[d.name] = { marks: 0, total: 0 };
      studentMap[d.name].marks += d.marks; studentMap[d.name].total += d.total;
    });
    Object.values(studentMap).forEach(v => {
      const p = v.total > 0 ? (v.marks / v.total) * 100 : 0;
      if (p >= 90) bins['A+ (≥90)']++;
      else if (p >= 75) bins['A (75-89)']++;
      else if (p >= 60) bins['B (60-74)']++;
      else if (p >= 45) bins['C (45-59)']++;
      else bins['F (<45)']++;
    });
    return {
      labels: Object.keys(bins),
      datasets: [{ data: Object.values(bins),
        backgroundColor: ['#10b981','#34d399','#f59e0b','#f97316','#ef4444'],
        borderWidth: 0 }],
    };
  }, [filtered]);

  // Student progress over time (single student view)
  const progressData = useMemo(() => {
    if (!studentView) return null;
    const pts = {};
    allData.filter(d => d.name === studentView).forEach(d => {
      const key = fmt(d.date);
      if (!pts[key]) pts[key] = { marks: 0, total: 0, rawDate: d.date };
      pts[key].marks += d.marks; pts[key].total += d.total;
    });
    const sorted = Object.entries(pts).sort((a, b) => new Date(a[1].rawDate) - new Date(b[1].rawDate));
    return {
      labels: sorted.map(([k]) => k),
      datasets: [{ label: 'Performance %', data: sorted.map(([, v]) => parseFloat(pct(v.marks, v.total))),
        borderColor: '#6366f1', backgroundColor: '#6366f120', borderWidth: 2.5, pointRadius: 5,
        pointBackgroundColor: '#6366f1', fill: true, tension: 0.4 }],
    };
  }, [studentView, allData]);

  // Radar per student (subjects)
  const radarData = useMemo(() => {
    if (!studentView) return null;
    const subs = {};
    allData.filter(d => d.name === studentView).forEach(d => {
      if (!subs[d.subject]) subs[d.subject] = { marks: 0, total: 0 };
      subs[d.subject].marks += d.marks; subs[d.subject].total += d.total;
    });
    const labels = Object.keys(subs);
    return {
      labels,
      datasets: [{ label: 'Score %', data: labels.map(s => parseFloat(pct(subs[s].marks, subs[s].total))),
        backgroundColor: '#6366f130', borderColor: '#6366f1', borderWidth: 2, pointBackgroundColor: '#6366f1' }],
    };
  }, [studentView, allData]);

  // Table data + sort
  const tableData = useMemo(() => {
    const map = {};
    filtered.forEach(d => {
      if (!map[d.name]) map[d.name] = { name: d.name, class: d.class, marks: 0, total: 0, subjects: new Set(), tests: new Set() };
      map[d.name].marks += d.marks; map[d.name].total += d.total;
      map[d.name].subjects.add(d.subject); map[d.name].tests.add(d.test);
    });
    let rows = Object.values(map).map(r => ({ ...r, pctVal: r.total > 0 ? (r.marks / r.total) * 100 : 0,
      subjects: [...r.subjects], tests: [...r.tests] }));
    rows.sort((a, b) => {
      const av = sortCol === 'pctVal' ? a.pctVal : a[sortCol] || '';
      const bv = sortCol === 'pctVal' ? b.pctVal : b[sortCol] || '';
      return sortDir === 'asc' ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1);
    });
    return rows;
  }, [filtered, sortCol, sortDir]);

  const toggleSort = col => { setSortDir(sortCol === col && sortDir === 'asc' ? 'desc' : 'asc'); setSortCol(col); };
  const SortIcon = ({ col }) => sortCol === col ? (sortDir === 'asc' ? ' ↑' : ' ↓') : ' ↕';

  const hasFilters = fClass || fSubject || fTest || fStudent || fDateFrom || fDateTo || search;

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 48, height: 48, border: '4px solid #e2e8f0', borderTopColor: '#6366f1', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
        <div style={{ color: '#64748b', fontWeight: 500 }}>Loading dashboard…</div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: "'DM Sans', 'Segoe UI', sans-serif", color: '#1e293b' }}>
      <link href="https://fonts.googleapis.com/css2?family=Sora:wght@700;800&family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />

      {/* ── Sidebar ── */}
      <div style={{ position: 'fixed', top: 0, left: 0, width: 220, height: '100vh', background: '#1e293b', display: 'flex', flexDirection: 'column', zIndex: 100, padding: '0 0 24px' }}>
        <div style={{ padding: '24px 20px 20px', borderBottom: '1px solid #334155' }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#f8fafc', fontFamily: "'Sora', sans-serif", lineHeight: 1.2 }}>📚 EduTrack</div>
          <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>Performance Dashboard</div>
        </div>
        {[
          { id: 'dashboard', icon: '📊', label: 'Dashboard' },
          { id: 'table',     icon: '📋', label: 'Student Table' },
          { id: 'bulk',      icon: '✏️',  label: 'Bulk Entry' },
          { id: 'upload',    icon: '📤', label: 'Upload Excel' },
        ].map(t => (
          <button key={t.id} onClick={() => { setActiveTab(t.id); setStudentView(null); }}
            style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 20px', margin: '2px 10px', borderRadius: 10,
              background: activeTab === t.id ? '#6366f1' : 'transparent', color: activeTab === t.id ? '#fff' : '#94a3b8',
              border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, textAlign: 'left', transition: 'all 0.15s' }}>
            <span style={{ fontSize: 16 }}>{t.icon}</span>{t.label}
          </button>
        ))}
        <div style={{ marginTop: 'auto', padding: '16px 20px', borderTop: '1px solid #334155' }}>
          <button onClick={fetchData} style={{ width: '100%', padding: '9px', borderRadius: 9, background: '#334155',
            color: '#94a3b8', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
            🔄 Refresh Data
          </button>
        </div>
      </div>

      {/* ── Main area ── */}
      <div style={{ marginLeft: 220, padding: '28px 32px', minHeight: '100vh' }}>

        {/* Error */}
        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', padding: '12px 16px', borderRadius: 10, marginBottom: 20, fontSize: 13 }}>
            ⚠️ {error}
          </div>
        )}

        {/* ── DASHBOARD TAB ── */}
        {activeTab === 'dashboard' && !studentView && (
          <>
            <div style={{ marginBottom: 24 }}>
              <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, fontFamily: "'Sora', sans-serif" }}>Performance Dashboard</h1>
              <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 13 }}>{filtered.length} records · {stats.students} students</p>
            </div>

            {/* Filter bar */}
            <div style={{ background: '#fff', borderRadius: 14, padding: '18px 20px', marginBottom: 24, border: '1px solid #f1f5f9', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
              <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '12px 16px' }}>
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍  Search student or subject…"
                  style={{ padding: '8px 14px', borderRadius: 9, border: '1.5px solid #e2e8f0', fontSize: 13, color: '#1e293b', outline: 'none', minWidth: 200 }} />
                <Sel label="Class"   value={fClass}   onChange={e => setFClass(e.target.value)}   options={[{value:'',label:'All Classes'},   ...classes.map(c => ({value:c,label:c}))]} />
                <Sel label="Subject" value={fSubject} onChange={e => setFSubject(e.target.value)} options={[{value:'',label:'All Subjects'}, ...subjectOpts.filter(Boolean).map(s => ({value:s,label:s}))]} />
                <Sel label="Test"    value={fTest}    onChange={e => setFTest(e.target.value)}    options={[{value:'',label:'All Tests'},    ...testOpts.filter(Boolean).map(t => ({value:t,label:t}))]} />
                <Sel label="Student" value={fStudent} onChange={e => setFStudent(e.target.value)} options={[{value:'',label:'All Students'}, ...studentOpts.filter(Boolean).map(s => ({value:s,label:s}))]} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Date From</label>
                  <input type="date" value={fDateFrom} onChange={e => setFDateFrom(e.target.value)}
                    style={{ padding: '8px 10px', borderRadius: 9, border: '1.5px solid #e2e8f0', fontSize: 13, color: '#1e293b', outline: 'none' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Date To</label>
                  <input type="date" value={fDateTo} onChange={e => setFDateTo(e.target.value)}
                    style={{ padding: '8px 10px', borderRadius: 9, border: '1.5px solid #e2e8f0', fontSize: 13, color: '#1e293b', outline: 'none' }} />
                </div>
                {hasFilters && (
                  <button onClick={clearFilters} style={{ marginTop: 18, padding: '8px 14px', borderRadius: 9, border: '1px solid #e2e8f0', background: '#fff', color: '#64748b', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                    ✕ Clear
                  </button>
                )}
              </div>
            </div>

            {/* Stat cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16, marginBottom: 28 }}>
              <StatCard label="Avg Performance" value={`${stats.avg.toFixed(1)}%`} icon="📈" color="#6366f1" sub={`${stats.records} entries`} />
              <StatCard label="Total Students"  value={stats.students}  icon="👥" sub="Unique students" />
              <StatCard label="Total Marks"     value={stats.totalM}    icon="✏️" sub={`of ${stats.totalT} possible`} />
              <StatCard label="Top Performer"   value={stats.top?.name || '—'} icon="🏆" color="#10b981" sub={stats.top ? `${parseFloat(pct(0,0)) || stats.top.pct.toFixed(1)}%` : ''} />
              <StatCard label="Needs Attention" value={stats.low?.name || '—'} icon="⚠️" color="#f59e0b" sub={stats.low ? `${stats.low.pct.toFixed(1)}%` : ''} />
            </div>

            {/* Charts grid */}
            {filtered.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 20 }}>
                {/* Student performance */}
                <ChartCard title="Student Performance" subtitle="Overall % per student" fullWidth={studentChartData.labels.length > 8}>
                  <Bar data={studentChartData} options={chartOpts('Student Performance', { onClick: (_, el) => { if (el[0]) { setStudentView(studentChartData.labels[el[0].index]); } } })} />
                </ChartCard>

                {/* Subject breakdown */}
                <ChartCard title="Subject Breakdown" subtitle="Average % per subject">
                  <Bar data={subjectChartData} options={chartOpts('Subject')} />
                </ChartCard>

                {/* Test trend */}
                <ChartCard title="Test-wise Trend" subtitle="Performance across tests">
                  <Line data={testChartData} options={chartOpts('Test')} />
                </ChartCard>

                {/* Grade distribution */}
                <ChartCard title="Grade Distribution" subtitle="Students by grade band">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 24 }}>
                    <div style={{ width: 200, height: 200, flexShrink: 0 }}>
                      <Doughnut data={gradeDistData} options={{ responsive: true, maintainAspectRatio: false,
                        plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => ` ${ctx.label}: ${ctx.raw} students` } } },
                        cutout: '70%' }} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {gradeDistData.labels.map((l, i) => (
                        <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                          <span style={{ width: 10, height: 10, borderRadius: 3, background: gradeDistData.datasets[0].backgroundColor[i], flexShrink: 0 }} />
                          <span style={{ color: '#475569' }}>{l}</span>
                          <span style={{ fontWeight: 700, color: '#1e293b', marginLeft: 'auto' }}>{gradeDistData.datasets[0].data[i]}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </ChartCard>

                {/* Leaderboard */}
                <div style={{ background: '#fff', borderRadius: 16, padding: '22px 24px', border: '1px solid #f1f5f9', boxShadow: '0 1px 4px rgba(0,0,0,0.05)', gridColumn: '1 / -1' }}>
                  <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>🏆 Class Leaderboard</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 10 }}>
                    {tableData.slice(0, 10).map((s, i) => (
                      <div key={s.name} onClick={() => setStudentView(s.name)}
                        style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 10,
                          background: i === 0 ? '#fef9c3' : i === 1 ? '#f1f5f9' : '#f8fafc',
                          border: '1px solid #f1f5f9', cursor: 'pointer', transition: 'box-shadow 0.15s' }}>
                        <span style={{ fontSize: 18, width: 28, textAlign: 'center' }}>{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i+1}.`}</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 600, fontSize: 13, color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name}</div>
                          <div style={{ fontSize: 11, color: '#94a3b8' }}>{s.class}</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontWeight: 800, fontSize: 15, color: '#6366f1', fontFamily: "'Sora', sans-serif" }}>{s.pctVal.toFixed(1)}%</div>
                          <Badge pctVal={s.pctVal} />
                        </div>
                        <div style={{ width: 48, height: 48, flexShrink: 0 }}>
                          <svg viewBox="0 0 36 36" style={{ transform: 'rotate(-90deg)' }}>
                            <circle cx="18" cy="18" r="15.9" fill="none" stroke="#f1f5f9" strokeWidth="3" />
                            <circle cx="18" cy="18" r="15.9" fill="none" stroke="#6366f1" strokeWidth="3"
                              strokeDasharray={`${s.pctVal} ${100 - s.pctVal}`} strokeLinecap="round" />
                          </svg>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ background: '#fff', borderRadius: 16, padding: 60, textAlign: 'center', border: '1px solid #f1f5f9' }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>📭</div>
                <div style={{ color: '#64748b', fontSize: 15 }}>No data matches your filters. Try clearing some filters or add data.</div>
              </div>
            )}
          </>
        )}

        {/* ── STUDENT DRILL-DOWN ── */}
        {activeTab === 'dashboard' && studentView && (
          <>
            <button onClick={() => setStudentView(null)} style={{ marginBottom: 20, padding: '8px 16px', borderRadius: 9, border: '1px solid #e2e8f0', background: '#fff', color: '#475569', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
              ← Back to Dashboard
            </button>
            <div style={{ marginBottom: 24 }}>
              <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, fontFamily: "'Sora', sans-serif" }}>{studentView}</h1>
              <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 13 }}>Individual performance breakdown</p>
            </div>

            {/* Mini stat row */}
            {(() => {
              const sd = allData.filter(d => d.name === studentView);
              const tm = sd.reduce((s, d) => s + d.marks, 0);
              const tt = sd.reduce((s, d) => s + d.total, 0);
              const ap = tt > 0 ? (tm / tt) * 100 : 0;
              const { g, c } = grade(ap);
              return (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 14, marginBottom: 24 }}>
                  <StatCard label="Overall %" value={`${ap.toFixed(1)}%`} icon="📊" color={c} />
                  <StatCard label="Grade"     value={g}          icon="🎓" color={c} />
                  <StatCard label="Tests Taken" value={[...new Set(sd.map(d => d.test))].length} icon="📝" />
                  <StatCard label="Subjects"   value={[...new Set(sd.map(d => d.subject))].length} icon="📚" />
                </div>
              );
            })()}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
              {progressData && (
                <ChartCard title="Progress Over Time" subtitle="Daily aggregated performance" fullWidth>
                  <Line data={progressData} options={chartOpts('Progress')} />
                </ChartCard>
              )}
              {radarData && (
                <ChartCard title="Subject Radar" subtitle="Strength across subjects">
                  <Radar data={radarData} options={{ responsive: true, maintainAspectRatio: false,
                    scales: { r: { min: 0, max: 100, ticks: { stepSize: 25, color: '#94a3b8', font: { size: 10 } }, grid: { color: '#f1f5f9' }, pointLabels: { color: '#475569', font: { size: 11 } } } },
                    plugins: { legend: { display: false } } }} />
                </ChartCard>
              )}
            </div>

            {/* Detailed records table */}
            <div style={{ background: '#fff', borderRadius: 16, padding: '22px 24px', border: '1px solid #f1f5f9', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>All Records</div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead><tr style={{ borderBottom: '2px solid #f1f5f9' }}>
                    {['Subject','Test','Marks','Total','%','Grade','Date'].map(h => (
                      <th key={h} style={{ padding: '8px 14px', textAlign: 'left', fontWeight: 700, color: '#94a3b8', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {allData.filter(d => d.name === studentView).sort((a, b) => new Date(b.date) - new Date(a.date)).map((d, i) => {
                      const p = parseFloat(pct(d.marks, d.total));
                      const { g, c } = grade(p);
                      return (
                        <tr key={i} style={{ borderBottom: '1px solid #f8fafc', background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                          <td style={{ padding: '10px 14px', fontWeight: 500 }}>{d.subject}</td>
                          <td style={{ padding: '10px 14px', color: '#64748b' }}>{d.test}</td>
                          <td style={{ padding: '10px 14px', fontWeight: 700, color: '#1e293b' }}>{d.marks}</td>
                          <td style={{ padding: '10px 14px', color: '#94a3b8' }}>{d.total}</td>
                          <td style={{ padding: '10px 14px', fontWeight: 700, color: c }}>{p}%</td>
                          <td style={{ padding: '10px 14px' }}><Badge pctVal={p} /></td>
                          <td style={{ padding: '10px 14px', color: '#94a3b8' }}>{fmt(d.date)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* ── TABLE TAB ── */}
        {activeTab === 'table' && (
          <>
            <div style={{ marginBottom: 24 }}>
              <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, fontFamily: "'Sora', sans-serif" }}>Student Table</h1>
              <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 13 }}>{tableData.length} students · click a row to view details</p>
            </div>

            {/* Search + filters */}
            <div style={{ background: '#fff', borderRadius: 14, padding: '16px 20px', marginBottom: 20, border: '1px solid #f1f5f9', display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
              <div style={{ flex: 1, minWidth: 200 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 4 }}>Search</label>
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Name or subject…"
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 9, border: '1.5px solid #e2e8f0', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <Sel label="Class"   value={fClass}   onChange={e => setFClass(e.target.value)}   options={[{value:'',label:'All Classes'},   ...classes.map(c => ({value:c,label:c}))]} />
              <Sel label="Subject" value={fSubject} onChange={e => setFSubject(e.target.value)} options={[{value:'',label:'All Subjects'}, ...subjectOpts.filter(Boolean).map(s => ({value:s,label:s}))]} />
              <Sel label="Test"    value={fTest}    onChange={e => setFTest(e.target.value)}    options={[{value:'',label:'All Tests'},    ...testOpts.filter(Boolean).map(t => ({value:t,label:t}))]} />
              {hasFilters && <button onClick={clearFilters} style={{ padding: '8px 14px', borderRadius: 9, border: '1px solid #e2e8f0', background: '#fff', color: '#64748b', cursor: 'pointer', fontSize: 12, fontWeight: 600, alignSelf: 'flex-end' }}>✕ Clear</button>}
            </div>

            <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #f1f5f9', boxShadow: '0 1px 4px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead><tr style={{ background: '#f8fafc', borderBottom: '2px solid #f1f5f9' }}>
                    {[['name','Student'],['class','Class'],['subjects','Subjects'],['pctVal','Performance'],['marks','Marks']].map(([col, label]) => (
                      <th key={col} onClick={() => toggleSort(col)}
                        style={{ padding: '11px 16px', textAlign: 'left', fontWeight: 700, color: '#64748b', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', cursor: 'pointer', whiteSpace: 'nowrap', userSelect: 'none' }}>
                        {label}<SortIcon col={col} />
                      </th>
                    ))}
                    <th style={{ padding: '11px 16px', textAlign: 'left', fontWeight: 700, color: '#64748b', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Grade</th>
                  </tr></thead>
                  <tbody>
                    {tableData.map((s, i) => (
                      <tr key={s.name} onClick={() => { setStudentView(s.name); setActiveTab('dashboard'); }}
                        style={{ borderBottom: '1px solid #f8fafc', background: i % 2 === 0 ? '#fff' : '#fafafa', cursor: 'pointer', transition: 'background 0.1s' }}
                        onMouseEnter={e => e.currentTarget.style.background = '#f0f4ff'}
                        onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? '#fff' : '#fafafa'}>
                        <td style={{ padding: '12px 16px', fontWeight: 600, color: '#1e293b' }}>{s.name}</td>
                        <td style={{ padding: '12px 16px', color: '#64748b' }}>{s.class}</td>
                        <td style={{ padding: '12px 16px', color: '#64748b', fontSize: 12 }}>{s.subjects.join(', ')}</td>
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ flex: 1, height: 6, background: '#f1f5f9', borderRadius: 3, minWidth: 80 }}>
                              <div style={{ height: '100%', borderRadius: 3, width: `${Math.min(s.pctVal, 100)}%`, background: grade(s.pctVal).c, transition: 'width 0.4s' }} />
                            </div>
                            <span style={{ fontWeight: 700, color: grade(s.pctVal).c, fontSize: 13, minWidth: 44 }}>{s.pctVal.toFixed(1)}%</span>
                          </div>
                        </td>
                        <td style={{ padding: '12px 16px', color: '#64748b' }}>{s.marks} / {s.total}</td>
                        <td style={{ padding: '12px 16px' }}><Badge pctVal={s.pctVal} /></td>
                      </tr>
                    ))}
                    {tableData.length === 0 && (
                      <tr><td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>No records found</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* ── BULK ENTRY TAB ── */}
        {activeTab === 'bulk' && (
          <>
            <div style={{ marginBottom: 24 }}>
              <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, fontFamily: "'Sora', sans-serif" }}>Bulk Marks Entry</h1>
              <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 13 }}>Enter marks for an entire class at once</p>
            </div>
            <BulkMarksEntry onSaveSuccess={fetchData} classes={classes} />
          </>
        )}

        {/* ── UPLOAD TAB ── */}
        {activeTab === 'upload' && (
          <>
            <div style={{ marginBottom: 24 }}>
              <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, fontFamily: "'Sora', sans-serif" }}>Upload Excel</h1>
              <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 13 }}>Bulk import from .xlsx / .xls files</p>
            </div>
            <ExcelUpload onUploadSuccess={fetchData} />
          </>
        )}

      </div>
    </div>
  );
}
