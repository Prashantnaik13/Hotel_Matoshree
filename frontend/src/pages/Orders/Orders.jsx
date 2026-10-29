import { useEffect, useState } from 'react';
import api from '../../api/axios.js';
import Topbar from '../../components/layout/Topbar.jsx';
import { fmt } from '../../utils/format.js';

export default function Orders(){
  const [orders,setOrders]=useState([]);
  const [filter,setFilter]=useState('');
  useEffect(()=>{ api.get('/orders').then(r=> setOrders(r.data.data)); },[]);
  const filtered = filter? orders.filter(o=> o.status===filter): orders;
  const cancel=async(id)=>{ if(!confirm('Cancel order?'))return; await api.post(`/orders/${id}/cancel`); location.reload(); };
  return (
    <>
      <Topbar title="Orders" subtitle="Live order lifecycle • KOT • Transfers"/>
      <div className="content">
        <div style={{display:'flex',gap:10,marginBottom:16}}>
          <select className="input" style={{width:180}} value={filter} onChange={e=>setFilter(e.target.value)}><option value="">All Status</option><option value="draft">Draft</option><option value="confirmed">Confirmed</option><option value="preparing">Preparing</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option></select>
        </div>
        <div className="card" style={{padding:0,overflow:'hidden'}}>
          <table className="data-table">
            <thead><tr><th>Order</th><th>Table</th><th>Type</th><th>Items</th><th>Total</th><th>Status</th><th>Action</th></tr></thead>
            <tbody>
              {filtered.map(o=>(
                <tr key={o.id}><td><b>{o.orderNumber}</b><div style={{fontSize:11,color:'var(--muted)'}}>{new Date(o.createdAt).toLocaleString()}</div></td>
                <td>{o.tableId? `T${String(o.tableId).padStart(2,'0')}`:'—'}</td><td style={{textTransform:'capitalize'}}>{o.type}</td><td>{o.items?.length}</td><td><b>{fmt(o.grandTotal)}</b></td>
                <td><span style={{padding:'4px 8px',borderRadius:20,background:'#f1f1f1',fontSize:11,textTransform:'capitalize'}}>{o.status}</span></td>
                <td><button className="btn btn-ghost btn-sm" onClick={()=>cancel(o.id)}>Cancel</button></td></tr>
              ))}
            </tbody>
          </table>
          {filtered.length===0 && <div className="empty">No orders</div>}
        </div>
      </div>
    </>
  )
}
