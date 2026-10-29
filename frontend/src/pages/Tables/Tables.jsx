import { useEffect, useState } from 'react';
import api from '../../api/axios.js';
import Topbar from '../../components/layout/Topbar.jsx';
import { fmt, fmtDate } from '../../utils/format.js';
import { FiPlus, FiSearch } from 'react-icons/fi';

export default function Tables(){
  const [tables,setTables]=useState([]);
  const [floors,setFloors]=useState([]);
  const [filter,setFilter]=useState({ floor:'', status:'', search:'' });
  const [show,setShow]=useState(false);
  const [form,setForm]=useState({ tableNumber:'', capacity:4, floorId:'', section:'' });

  const load=async()=>{
    const res=await api.get('/tables');
    setTables(res.data.data);
    try{ const f=await api.get('/settings/floors'); setFloors(f.data.data);}catch{}
  };
  useEffect(()=>{ load(); },[]);

  const filtered=tables.filter(t=>{
    if(filter.floor && String(t.floorId)!==filter.floor) return false;
    if(filter.status && t.status!==filter.status) return false;
    if(filter.search && !t.tableNumber.toLowerCase().includes(filter.search.toLowerCase())) return false;
    return true;
  });

  const create=async(e)=>{
    e.preventDefault();
    await api.post('/tables', { ...form, capacity:Number(form.capacity), floorId: form.floorId? Number(form.floorId): null });
    setShow(false); setForm({tableNumber:'',capacity:4,floorId:'',section:''}); load();
  };
  const setStatus=async(id,status)=>{
    await api.patch(`/tables/${id}/status`, { status });
    load();
  };

  return (
    <>
      <Topbar title="Table Management" subtitle="Interactive floor plan & real-time status"/>
      <div className="content">
        <div style={{display:'flex',gap:10,marginBottom:16,flexWrap:'wrap'}}>
          <div style={{display:'flex',alignItems:'center',gap:8,background:'#fff',padding:'6px 10px',borderRadius:10,border:'1px solid var(--border)'}}>
            <FiSearch color="var(--muted)"/><input placeholder="Search table..." value={filter.search} onChange={e=>setFilter({...filter,search:e.target.value})} style={{border:'none',outline:'none'}}/>
          </div>
          <select className="input" style={{width:160}} value={filter.floor} onChange={e=>setFilter({...filter,floor:e.target.value})}><option value="">All Floors</option>{floors.map(f=> <option key={f.id} value={f.id}>{f.name}</option>)}</select>
          <select className="input" style={{width:160}} value={filter.status} onChange={e=>setFilter({...filter,status:e.target.value})}><option value="">All Status</option><option>available</option><option>occupied</option><option>reserved</option><option>billing</option><option>cleaning</option></select>
          <div style={{marginLeft:'auto',display:'flex',gap:8}}>
            <div style={{display:'flex',gap:6,alignItems:'center',fontSize:12}}><span className="status status-available" style={{position:'static'}}>Available</span><span className="status status-occupied" style={{position:'static'}}>Occupied</span><span className="status status-reserved" style={{position:'static'}}>Reserved</span><span className="status status-billing" style={{position:'static'}}>Billing</span><span className="status status-cleaning" style={{position:'static'}}>Cleaning</span></div>
            <button className="btn btn-primary" onClick={()=>setShow(true)}><FiPlus/> Add Table</button>
          </div>
        </div>

        <div className="table-grid">
          {filtered.map(t=>(
            <div key={t.id} className={`table-card ${t.activeOrder?'selected':''}`}>
              <span className={`status status-${t.status}`}>{t.status}</span>
              <div style={{marginTop:6,display:'flex',gap:6,alignItems:'center'}}>
                <div style={{width:36,height:36,borderRadius:10,background:'var(--primary)',color:'#fff',display:'grid',placeItems:'center',fontWeight:700}}>{t.tableNumber}</div>
                <div><h4>{t.tableNumber}</h4><div style={{fontSize:12,color:'var(--muted)'}}>{t.capacity} Guests • {t.section||'Section'}</div></div>
              </div>
              <div className="meta"><span>Floor: {t.floorId? floors.find(f=>f.id===t.floorId)?.name || t.floorId : '—'}</span></div>
              {t.activeOrder ? (
                <div className="bill"><span>#{t.activeOrder.orderNumber}<br/><small>{t.activeOrder.items?.length} items</small></span><b>{fmt(t.activeOrder.grandTotal)}</b></div>
              ) : <div className="bill" style={{justifyContent:'center',color:'var(--muted)'}}>No active order</div>}
              <div style={{display:'flex',gap:6,marginTop:10}}>
                <select className="input" value={t.status} onChange={e=>setStatus(t.id,e.target.value)} style={{fontSize:12,padding:'6px 8px'}}>
                  <option value="available">Available</option><option value="occupied">Occupied</option><option value="reserved">Reserved</option><option value="billing">Billing</option><option value="cleaning">Cleaning</option><option value="out_of_service">Out of Service</option>
                </select>
              </div>
            </div>
          ))}
        </div>
        {filtered.length===0 && <div className="empty">No tables found</div>}

        {show && (
          <div className="modal-overlay" onClick={()=>setShow(false)}>
            <div className="modal" onClick={e=>e.stopPropagation()}>
              <header>Add Table <button onClick={()=>setShow(false)} className="btn btn-ghost btn-sm">×</button></header>
              <form onSubmit={create} className="body" style={{display:'flex',flexDirection:'column',gap:12}}>
                <div><label className="label">Table Number *</label><input className="input" value={form.tableNumber} onChange={e=>setForm({...form,tableNumber:e.target.value})} placeholder="T13" required/></div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
                  <div><label className="label">Capacity</label><input type="number" className="input" value={form.capacity} onChange={e=>setForm({...form,capacity:e.target.value})} min={1} /></div>
                  <div><label className="label">Section</label><input className="input" value={form.section} onChange={e=>setForm({...form,section:e.target.value})} placeholder="A / B / Garden"/></div>
                </div>
                <div><label className="label">Floor</label>
                  <select className="input" value={form.floorId} onChange={e=>setForm({...form,floorId:e.target.value})}><option value="">Select floor</option>{floors.map(f=> <option key={f.id} value={f.id}>{f.name}</option>)}</select>
                </div>
                <button className="btn btn-primary" type="submit">Create Table</button>
              </form>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
