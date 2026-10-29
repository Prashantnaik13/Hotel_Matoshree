import { useEffect, useState } from 'react';
import api from '../../api/axios.js';
import Topbar from '../../components/layout/Topbar.jsx';

export default function Kitchen(){
  const [tickets,setTickets]=useState([]);
  const load=async()=>{ const r=await api.get('/kitchen/tickets'); setTickets(r.data.data); };
  useEffect(()=>{ load(); const id=setInterval(load,5000); return ()=>clearInterval(id); },[]);
  const update=async(id,status)=>{ await api.patch(`/kitchen/tickets/${id}/status`, { status }); load(); };
  return (
    <>
      <Topbar title="Kitchen Display (KOT)" subtitle="Live tickets • Auto-refresh 5s"/>
      <div className="content">
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))',gap:14}}>
          {tickets.map(t=>(
            <div key={t.id} className="card" style={{borderLeft:`4px solid ${t.status==='pending'?'#D99A32':t.status==='preparing'?'#2196F3':t.status==='ready'?'#248A57':'#999'}`}}>
              <div style={{display:'flex',justifyContent:'space-between'}}><b>{t.kotNumber}</b><span style={{fontSize:11,background:'#f1f1f1',padding:'3px 8px',borderRadius:20,textTransform:'capitalize'}}>{t.status}</span></div>
              <div style={{fontSize:12,color:'var(--muted)',marginTop:4}}>Order: {t.order?.orderNumber} • Table: {t.table?.tableNumber || (t.tableId? `T${String(t.tableId).padStart(2,'0')}`:'Takeaway')} • {new Date(t.createdAt).toLocaleTimeString()}</div>
              <div style={{marginTop:10}}>
                {t.items && t.items.length>0 ? t.items.map(it=> {
                  const name = it.item_name || it.nameSnapshot || it.orderItem?.nameSnapshot || 'Unknown Item';
                  return (
                    <div key={it.id} style={{display:'flex',justifyContent:'space-between',padding:'6px 0',borderBottom:'1px solid var(--border)',fontSize:13}}>
                      <span style={{flex:1}}>{it.quantity} × {name}</span>
                      <span style={{color:'var(--muted)', fontSize:12, marginLeft:8}}>{it.notes||''}</span>
                    </div>
                  );
                }) : <div style={{padding:'8px 0', fontSize:12, color:'var(--muted)', fontStyle:'italic'}}>No items in this ticket</div>}
              </div>
              <div style={{display:'flex',gap:6,marginTop:12}}>
                <button className="btn btn-ghost btn-sm" onClick={()=>update(t.id,'preparing')}>Preparing</button>
                <button className="btn btn-ghost btn-sm" onClick={()=>update(t.id,'ready')}>Ready</button>
                <button className="btn btn-primary btn-sm" onClick={()=>update(t.id,'served')}>Served</button>
              </div>
            </div>
          ))}
        </div>
        {tickets.length===0 && <div className="empty">No KOT tickets • Send orders from POS</div>}
      </div>
    </>
  )
}
