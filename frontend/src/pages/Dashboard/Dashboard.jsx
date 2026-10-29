import { useEffect, useState } from 'react';
import api from '../../api/axios.js';
import Topbar from '../../components/layout/Topbar.jsx';
import { FiDollarSign, FiShoppingBag, FiGrid, FiAlertCircle } from 'react-icons/fi';
import { fmt } from '../../utils/format.js';

export default function Dashboard(){
  const [summary,setSummary]=useState(null);
  const [sales,setSales]=useState([]);
  const [recent,setRecent]=useState([]);
  const [top,setTop]=useState([]);
  const [pay,setPay]=useState([]);
  const [range,setRange]=useState('daily');

  const load= async()=>{
    const s=await api.get('/dashboard/summary');
    setSummary(s.data.data);
    const sa=await api.get('/dashboard/sales?range='+range);
    setSales(sa.data.data);
    const r=await api.get('/dashboard/recent-orders');
    setRecent(r.data.data);
    const t=await api.get('/dashboard/top-items');
    setTop(t.data.data);
    const p=await api.get('/dashboard/payment-breakdown');
    setPay(p.data.data);
  };
  useEffect(()=>{ load(); },[range]);

  if(!summary) return <div className="loading">Loading dashboard...</div>;
  return (
    <>
      <Topbar title="Dashboard" subtitle="Welcome back — here's what's happening today"/>
      <div className="content">
        <div className="stat-grid">
          <div className="stat-card">
            <div className="top"><div><p>Today's Sales</p><h3>{fmt(summary.todaySales)}</h3></div><div className="icon-box" style={{background:'#e8f5e9',color:'var(--success)'}}><FiDollarSign/></div></div>
            <small style={{color:'var(--muted)'}}>{summary.billsCount} bills completed • Avg {fmt(summary.avgBill)}</small>
          </div>
          <div className="stat-card">
            <div className="top"><div><p>Active Orders</p><h3>{summary.activeOrders}</h3></div><div className="icon-box" style={{background:'#fff3e0',color:'#e65100'}}><FiShoppingBag/></div></div>
            <small style={{color:'var(--muted)'}}>Pending payments {fmt(summary.pendingAmount)}</small>
          </div>
          <div className="stat-card">
            <div className="top"><div><p>Tables Occupied</p><h3>{summary.occupied} / {summary.totalTables}</h3></div><div className="icon-box" style={{background:'#e3f2fd',color:'#0d47a1'}}><FiGrid/></div></div>
            <small style={{color:'var(--muted)'}}>{summary.available} available • {summary.reserved} reserved</small>
          </div>
          <div className="stat-card">
            <div className="top"><div><p>Cleaning / Billing</p><h3>{summary.cleaning} • {summary.billing}</h3></div><div className="icon-box" style={{background:'#fce4ec',color:'#ad1457'}}><FiAlertCircle/></div></div>
            <small style={{color:'var(--muted)'}}>Tables needing attention</small>
          </div>
        </div>

        <div className="dashboard-main">
          <div className="card">
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:8}}>
              <h4>Sales Trend</h4>
              <select className="input" style={{width:140}} value={range} onChange={e=>setRange(e.target.value)}>
                <option value="daily">Daily</option>
                <option value="monthly">Monthly</option>
                <option value="hourly">Hourly</option>
              </select>
            </div>
            <div style={{marginTop:12,display:'flex',gap:8,overflowX:'auto',paddingBottom:8}}>
              {sales.length===0 && <div className="empty">No sales data yet</div>}
              {sales.map(s=>(
                <div key={s.date} style={{minWidth:110,background:'var(--secondary)',padding:12,borderRadius:12,textAlign:'center',border:'1px solid var(--border)',flexShrink:0}}>
                  <div style={{fontSize:11,color:'var(--muted)'}}>{s.date}</div>
                  <div style={{fontWeight:700,marginTop:6}}>{fmt(s.total)}</div>
                </div>
              ))}
            </div>
            <div className="dashboard-bottom-grid">
              <div style={{background:'#f7f4ed',padding:12,borderRadius:12}}><div style={{fontSize:12,color:'var(--muted)'}}>Payment Mix</div>{pay.map(p=> <div key={p.method} style={{display:'flex',justifyContent:'space-between',fontSize:13,marginTop:6, flexWrap:'wrap', gap:4}}><span style={{textTransform:'capitalize'}}>{p.method}</span><b>{fmt(p.total)}</b></div>)}</div>
              <div style={{background:'#f7f4ed',padding:12,borderRadius:12}}><div style={{fontSize:12,color:'var(--muted)'}}>Top Selling</div>{top.map(t=> <div key={t.menuItemId} style={{display:'flex',justifyContent:'space-between',fontSize:13,marginTop:6, flexWrap:'wrap', gap:4}}><span>{t.nameSnapshot}</span><b>x{t.totalQty}</b></div>)}</div>
              <div style={{background:'#f7f4ed',padding:12,borderRadius:12}}><div style={{fontSize:12,color:'var(--muted)'}}>Table Status</div><div style={{fontSize:13,marginTop:6,lineHeight:1.8}}>Available: <b>{summary.available}</b><br/>Occupied: <b>{summary.occupied}</b><br/>Reserved: <b>{summary.reserved}</b></div></div>
            </div>
          </div>
          <div className="card">
            <h4>Recent Orders</h4>
            <div style={{marginTop:12}}>
              {recent.map(o=>(
                <div key={o.id} style={{display:'flex',justifyContent:'space-between',padding:'10px 0',borderBottom:'1px solid var(--border)',gap:8,flexWrap:'wrap'}}>
                  <div style={{minWidth:0}}><div style={{fontWeight:600,fontSize:14}}>{o.orderNumber} <span style={{fontWeight:400,color:'var(--muted)',fontSize:12}}>• {o.type}</span></div><div style={{fontSize:12,color:'var(--muted)'}}>{o.items?.length} items • {o.status}</div></div>
                  <div style={{fontWeight:700,whiteSpace:'nowrap'}}>{fmt(o.grandTotal)}</div>
                </div>
              ))}
              {recent.length===0 && <div className="empty">No orders yet</div>}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
