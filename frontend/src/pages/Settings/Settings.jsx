import { useEffect, useState } from 'react';
import api from '../../api/axios.js';
import Topbar from '../../components/layout/Topbar.jsx';

export default function Settings(){
  const [data,setData]=useState(null);
  const [form,setForm]=useState({ restaurant:{}, setting:{} });
  useEffect(()=>{ (async()=>{
    const r=await api.get('/settings'); setData(r.data.data);
    setForm({ restaurant: r.data.data.restaurant||{}, setting: r.data.data.setting||{} });
  })();},[]);
  const save=async()=>{
    await api.put('/settings', form);
    alert('Settings saved');
  };
  if(!data) return <div className="loading">Loading...</div>;
  return (
    <>
      <Topbar title="Restaurant Settings" subtitle="Profile • Billing • Taxes • Printer"/>
      <div className="content">
        <div className="grid-2">
          <div className="card"><h4>Restaurant Profile</h4>
            <div style={{display:'flex',flexDirection:'column',gap:10,marginTop:12}}>
              <div><label className="label">Name</label><input className="input" value={form.restaurant.name||''} onChange={e=>setForm({...form, restaurant:{...form.restaurant, name:e.target.value}})}/></div>
              <div><label className="label">Address</label><input className="input" value={form.restaurant.address||''} onChange={e=>setForm({...form, restaurant:{...form.restaurant, address:e.target.value}})}/></div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}><div><label className="label">Phone</label><input className="input" value={form.restaurant.phone||''} onChange={e=>setForm({...form, restaurant:{...form.restaurant, phone:e.target.value}})}/></div><div><label className="label">Email</label><input className="input" value={form.restaurant.email||''} onChange={e=>setForm({...form, restaurant:{...form.restaurant, email:e.target.value}})}/></div></div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}><div><label className="label">GSTIN</label><input className="input" value={form.restaurant.gstin||''} onChange={e=>setForm({...form, restaurant:{...form.restaurant, gstin:e.target.value}})}/></div><div><label className="label">Footer Message</label><input className="input" value={form.restaurant.footerMessage||''} onChange={e=>setForm({...form, restaurant:{...form.restaurant, footerMessage:e.target.value}})}/></div></div>
            </div>
          </div>
          <div className="card"><h4>Billing Settings</h4>
            <div style={{display:'flex',flexDirection:'column',gap:10,marginTop:12}}>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}><div><label className="label">Receipt Width</label><select className="input" value={form.setting.receiptWidth||'80mm'} onChange={e=>setForm({...form, setting:{...form.setting, receiptWidth:e.target.value}})}><option>58mm</option><option>80mm</option><option>A4</option></select></div><div><label className="label">Tax Rate %</label><input type="number" step="0.01" className="input" value={form.setting.taxRate||5} onChange={e=>setForm({...form, setting:{...form.setting, taxRate:e.target.value}})}/></div></div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}><div><label className="label">Bill Prefix</label><input className="input" value={form.setting.billPrefix||''} onChange={e=>setForm({...form, setting:{...form.setting, billPrefix:e.target.value}})}/></div><div><label className="label">Service Charge %</label><input className="input" value={form.setting.serviceChargePercent||0} onChange={e=>setForm({...form, setting:{...form.setting, serviceChargePercent:e.target.value}})}/></div></div>
              <label style={{display:'flex',gap:8,alignItems:'center',marginTop:6}}><input type="checkbox" checked={!!form.setting.roundOffEnabled} onChange={e=>setForm({...form, setting:{...form.setting, roundOffEnabled:e.target.checked}})} /> Enable Round-Off (to nearest ₹1)</label>
              <label style={{display:'flex',gap:8,alignItems:'center'}}><input type="checkbox" checked={!!form.setting.serviceChargeEnabled} onChange={e=>setForm({...form, setting:{...form.setting, serviceChargeEnabled:e.target.checked}})} /> Enable Service Charge</label>
            </div>
          </div>
        </div>
        <div style={{marginTop:16}}><button className="btn btn-primary" onClick={save}>Save Settings</button></div>

        <div className="card" style={{marginTop:16}}>
          <h4>Floors / Sections</h4>
          <div style={{display:'flex',gap:8,marginTop:12,flexWrap:'wrap'}}>
            {data.floors?.map(f=> <div key={f.id} style={{background:'var(--secondary)',padding:'8px 14px',borderRadius:20,border:'1px solid var(--border)'}}>{f.name}</div>)}
          </div>
        </div>
      </div>
    </>
  )
}
