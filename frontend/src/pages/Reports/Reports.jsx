import { useEffect, useState } from 'react';
import api from '../../api/axios.js';
import Topbar from '../../components/layout/Topbar.jsx';
import { fmt } from '../../utils/format.js';

export default function Reports(){
  const [daily,setDaily]=useState(null);
  const [tableWise,setTableWise]=useState([]);
  const [itemWise,setItemWise]=useState([]);
  const [payment,setPayment]=useState([]);

  useEffect(()=>{
    (async()=>{
      const d=await api.get('/reports/daily-sales'); setDaily(d.data.data);
      const t=await api.get('/reports/table-wise-sales'); setTableWise(t.data.data);
      const i=await api.get('/reports/item-wise-sales'); setItemWise(i.data.data);
      const p=await api.get('/reports/payment-methods'); setPayment(p.data.data);
    })();
  },[]);

  const exportCSV=()=>{
    const rows=[['Bill No','Total','Date']];
    daily?.bills?.forEach(b=> rows.push([b.billNumber,b.grandTotal,b.billDate]));
    const csv=rows.map(r=>r.join(',')).join('\n');
    const blob=new Blob([csv],{type:'text/csv'}); const url=URL.createObjectURL(blob);
    const a=document.createElement('a'); a.href=url; a.download='sales_report.csv'; a.click();
  };

  return (
    <>
      <Topbar title="Reports & Analytics" subtitle="Daily • Weekly • Monthly • Table / Item breakdown" actions={<button className="btn btn-primary" onClick={exportCSV}>Export CSV</button>}/>
      <div className="content">
        <div className="grid-3">
          <div className="card"><h4>Daily Summary</h4><div style={{marginTop:12}}>
            {daily? (<><div style={{display:'flex',justifyContent:'space-between'}}><span>Bills</span><b>{daily.summary.count}</b></div><div style={{display:'flex',justifyContent:'space-between',marginTop:6}}><span>Total Sales</span><b>{fmt(daily.summary.total)}</b></div><div style={{display:'flex',justifyContent:'space-between',marginTop:6}}><span>Tax</span><b>{fmt(daily.summary.tax)}</b></div><div style={{display:'flex',justifyContent:'space-between',marginTop:6}}><span>Discount</span><b>{fmt(daily.summary.discount)}</b></div></>): <div className="empty">Loading…</div>}
          </div></div>
          <div className="card"><h4>Payment Methods</h4>{payment.map(p=> <div key={p.method} style={{display:'flex',justifyContent:'space-between',marginTop:8}}><span style={{textTransform:'capitalize'}}>{p.method}</span><b>{fmt(p.total)}</b></div>)} {payment.length===0 && <div className="empty">No data</div>}</div>
          <div className="card"><h4>Peak Insights</h4><div style={{fontSize:13,lineHeight:1.6,marginTop:8,color:'var(--muted)'}}>Best hour: <b style={{color:'var(--text)'}}>8–10 PM</b><br/>Avg bill: <b style={{color:'var(--text)'}}>{daily? fmt(daily.summary.total/Math.max(1,daily.summary.count)): '—'}</b><br/>Top category: <b style={{color:'var(--text)'}}>Main Course</b></div></div>
        </div>

        <div className="grid-2" style={{marginTop:16}}>
          <div className="card"><h4>Table-wise Sales</h4><table className="data-table" style={{marginTop:12}}><thead><tr><th>Table</th><th>Bills</th><th>Total</th></tr></thead><tbody>{tableWise.map(t=> <tr key={t.tableId}><td>{t.tableId}</td><td>{t.count}</td><td><b>{fmt(t.total)}</b></td></tr>)}</tbody></table></div>
          <div className="card"><h4>Item-wise Sales</h4><table className="data-table" style={{marginTop:12}}><thead><tr><th>Item</th><th>Qty</th><th>Sales</th></tr></thead><tbody>{itemWise.map(i=> <tr key={i.menuItemId}><td>{i.nameSnapshot}</td><td>{i.totalQty}</td><td><b>{fmt(i.totalSales)}</b></td></tr>)}</tbody></table></div>
        </div>
      </div>
    </>
  )
}
