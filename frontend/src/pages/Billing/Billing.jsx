import { useEffect, useState } from 'react';
import api from '../../api/axios.js';
import Topbar from '../../components/layout/Topbar.jsx';
import { fmt } from '../../utils/format.js';
import { FiPrinter, FiSearch, FiX } from 'react-icons/fi';

export default function Billing(){
  const [bills,setBills]=useState([]);
  const [search,setSearch]=useState('');
  const [selected,setSelected]=useState(null);
  const load=async()=>{ const r=await api.get('/billing'); setBills(r.data.data); };
  useEffect(()=>{ load(); },[]);
  const filtered=bills.filter(b=> !search || b.billNumber.toLowerCase().includes(search.toLowerCase()));
  const open=async(b)=>{
    const r=await api.get(`/billing/${b.id}/print-data`); setSelected(r.data.data);
  };
  const reprint=async(id)=>{ await api.post(`/billing/${id}/reprint`); load(); alert('Reprint logged - bill preserved with original data'); };
  const pay=async(b, method)=>{
    const amt=prompt('Amount to pay', b.grandTotal);
    if(!amt) return;
    await api.post(`/billing/${b.id}/payments`, { method, amount: Number(amt), idempotencyKey: b.id+'-'+Date.now() });
    load(); if(selected && selected.bill.id===b.id) open(b);
  };

  const handlePrintA4=()=>{
    document.body.classList.add('print-a4-mode');
    document.body.classList.remove('print-thermal-mode');
    setTimeout(()=>{ window.print(); setTimeout(()=> { document.body.classList.remove('print-a4-mode'); }, 500); }, 100);
  };
  const handlePrintThermal=()=>{
    document.body.classList.add('print-thermal-mode');
    document.body.classList.remove('print-a4-mode');
    setTimeout(()=>{ window.print(); setTimeout(()=> { document.body.classList.remove('print-thermal-mode'); }, 500); }, 100);
  };

  return (
    <>
      <Topbar title="Billing History" subtitle="All finalized bills • Reprint • Payments"/>
      <div className="content">
        <div style={{display:'flex',gap:10,marginBottom:16,flexWrap:'wrap'}}>
          <div style={{position:'relative',flex:'1 1 260px',maxWidth:320}}><FiSearch style={{position:'absolute',left:10,top:11,color:'var(--muted)'}}/><input className="input" placeholder="Search bill number..." value={search} onChange={e=>setSearch(e.target.value)} style={{paddingLeft:32}}/></div>
        </div>
        <div className="table-responsive card" style={{padding:0,overflow:'hidden'}}>
          <table className="data-table">
            <thead><tr><th>Bill No</th><th>Order</th><th>Table</th><th>Date</th><th>Total</th><th>Method</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>{filtered.map(b=>(
              <tr key={b.id}><td><b>{b.billNumber}</b></td><td>{b.orderId}</td><td>{b.tableId? `T${String(b.tableId).padStart(2,'0')}`:'—'}</td><td>{new Date(b.billDate).toLocaleString()}</td><td><b>{fmt(b.grandTotal)}</b></td><td style={{textTransform:'capitalize'}}>{b.paymentMethod}</td><td><span style={{padding:'4px 8px',borderRadius:20,fontSize:11,background: b.paymentStatus==='paid'?'#e8f5e9':'#fff3e0'}}>{b.paymentStatus}</span></td>
              <td style={{display:'flex',gap:6,flexWrap:'wrap'}}><button className="btn btn-ghost btn-sm" onClick={()=>open(b)}>View</button><button className="btn btn-ghost btn-sm" onClick={()=>reprint(b.id)}><FiPrinter/> Reprint</button></td></tr>
            ))}</tbody>
          </table>
          {filtered.length===0 && <div className="empty">No bills yet — finalize from POS</div>}
        </div>

        {selected && (
          <div className="modal-overlay print-overlay" onClick={()=>setSelected(null)}>
            <div className="bill-modal" onClick={e=>e.stopPropagation()}>
              <div className="bill-modal__header no-print">
                <div>
                  <div style={{fontWeight:800}}>Bill {selected.bill.billNumber}</div>
                  <div style={{fontSize:12,color:'var(--muted)',textTransform:'capitalize'}}>{selected.bill.paymentStatus} • {new Date(selected.bill.billDate).toLocaleString()}</div>
                </div>
                <button onClick={()=>setSelected(null)} className="btn btn-ghost btn-sm no-print"><FiX/></button>
              </div>
              <div className="bill-modal__body">
                {/* A4 Invoice */}
                <div className="print-area print-area-a4" id="printable-a4">
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',borderBottom:'2px solid var(--primary)',paddingBottom:12,flexWrap:'wrap',gap:12}}>
                    <div>
                      <h2 style={{fontFamily:'Playfair Display',fontSize:22,color:'var(--primary)'}}>{selected.restaurant?.name}</h2>
                      <div style={{fontSize:12,color:'var(--muted)',marginTop:4,maxWidth:320}}>{selected.restaurant?.address}<br/>{selected.restaurant?.phone} • {selected.restaurant?.email}<br/>GSTIN: {selected.restaurant?.gstin || '—'}</div>
                    </div>
                    <div style={{textAlign:'right',minWidth:140}}>
                      <div style={{fontSize:11,letterSpacing:0.8,textTransform:'uppercase',color:'var(--muted)'}}>Invoice</div>
                      <div style={{fontWeight:800,fontSize:16}}>{selected.bill.billNumber} {selected.bill.isReprint && <span style={{fontSize:11,background:'#ffebee',color:'#b71c1c',padding:'2px 6px',borderRadius:6,marginLeft:6}}>REPRINT</span>}</div>
                      <div style={{fontSize:12,marginTop:4}}>{new Date(selected.bill.billDate).toLocaleString()}</div>
                      <div style={{fontSize:11,background: selected.bill.paymentStatus==='paid'?'#e8f5e9':'#fff3e0',padding:'3px 8px',borderRadius:20,display:'inline-block',marginTop:6,textTransform:'capitalize'}}>{selected.bill.paymentStatus}</div>
                    </div>
                  </div>

                  <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(200px,1fr))',gap:16,marginTop:16,background:'#fbfaf7',padding:12,borderRadius:12,border:'1px solid var(--border)'}}>
                    <div>
                      <div style={{fontSize:11,color:'var(--muted)',letterSpacing:0.6,textTransform:'uppercase'}}>Bill To</div>
                      <div style={{fontWeight:600,marginTop:4}}>Table: {selected.table? selected.table.tableNumber:'—'} • Order: {selected.order?.orderNumber}</div>
                      <div style={{fontSize:12,color:'var(--muted)'}}>Cashier: {selected.cashier?.name || '—'}</div>
                    </div>
                    <div style={{textAlign:'right'}}>
                      <div style={{fontSize:11,color:'var(--muted)',letterSpacing:0.6,textTransform:'uppercase'}}>Payment</div>
                      <div style={{fontWeight:600,marginTop:4,textTransform:'capitalize'}}>{selected.bill.paymentMethod} • {selected.bill.paymentStatus}</div>
                      <div style={{fontSize:12}}>Received: {fmt(selected.bill.amountReceived)} | Due: {fmt(selected.bill.grandTotal - selected.bill.amountReceived)}</div>
                    </div>
                  </div>

                  <div className="table-responsive" style={{marginTop:16, border:'1px solid var(--border)', borderRadius:12}}>
                    <table style={{width:'100%',borderCollapse:'collapse', fontSize:13}}>
                      <thead><tr style={{background:'#f7f4ed'}}><th style={{textAlign:'left',padding:'8px 10px',border:'1px solid var(--border)'}}>Item</th><th style={{textAlign:'center',padding:'8px',border:'1px solid var(--border)'}}>Qty</th><th style={{textAlign:'right',padding:'8px',border:'1px solid var(--border)'}}>Unit</th><th style={{textAlign:'right',padding:'8px',border:'1px solid var(--border)'}}>Total</th></tr></thead>
                      <tbody>
                        {selected.items?.map(it=> <tr key={it.id}><td style={{padding:'8px 10px',border:'1px solid var(--border)',wordBreak:'break-word'}}>{it.name}</td><td style={{textAlign:'center',padding:8,border:'1px solid var(--border)'}}>{it.quantity}</td><td style={{textAlign:'right',padding:8,border:'1px solid var(--border)'}}>{fmt(it.unitPrice)}</td><td style={{textAlign:'right',padding:8,border:'1px solid var(--border)'}}>{fmt(it.lineTotal)}</td></tr>)}
                      </tbody>
                    </table>
                  </div>

                  <div style={{display:'flex',justifyContent:'flex-end',marginTop:16}}>
                    <div style={{width:'min(300px, 100%)',background:'#f7f4ed',padding:12,borderRadius:12,border:'1px solid var(--border)'}}>
                      <div style={{display:'flex',justifyContent:'space-between',padding:'6px 0',fontSize:13}}><span>Subtotal</span><b>{fmt(selected.bill.subtotal)}</b></div>
                      {selected.bill.discountAmount>0 && <div style={{display:'flex',justifyContent:'space-between',padding:'6px 0',fontSize:13}}><span>Discount</span><b>-{fmt(selected.bill.discountAmount)}</b></div>}
                      <div style={{display:'flex',justifyContent:'space-between',padding:'6px 0',fontSize:12,color:'var(--muted)'}}><span>CGST / SGST</span><span>{fmt(selected.bill.cgst)} / {fmt(selected.bill.sgst)}</span></div>
                      {selected.bill.roundOff!=0 && <div style={{display:'flex',justifyContent:'space-between',padding:'6px 0',fontSize:13}}><span>Round Off</span><span>{fmt(selected.bill.roundOff)}</span></div>}
                      <div style={{display:'flex',justifyContent:'space-between',padding:'10px 0',fontSize:15,fontWeight:800,borderTop:'2px solid var(--primary)',marginTop:6}}><span>Grand Total</span><span>{fmt(selected.bill.grandTotal)}</span></div>
                      <div style={{display:'flex',justifyContent:'space-between',padding:'6px 0',fontSize:12}}><span>Amount Received</span><span>{fmt(selected.bill.amountReceived)}</span></div>
                      <div style={{display:'flex',justifyContent:'space-between',padding:'6px 0',fontSize:12}}><span>Change Due</span><span>{fmt(selected.bill.changeDue)}</span></div>
                    </div>
                  </div>

                  <div style={{textAlign:'center',marginTop:20,paddingTop:12,borderTop:'1px dashed var(--border)',fontSize:11,color:'var(--muted)'}}>
                    {selected.restaurant?.footerMessage || 'Thank you for dining with us! Visit again.'}<br/>
                    This is a computer generated invoice.
                  </div>
                </div>

                {/* Thermal Receipt */}
                <div className="print-area print-area-thermal" id="printable-thermal" style={{display:'none'}}>
                  <div style={{textAlign:'center'}}>
                    <h2 style={{fontSize:14,marginBottom:4}}>{selected.restaurant?.name}</h2>
                    <div style={{fontSize:10,lineHeight:1.3}}>{selected.restaurant?.address}<br/>{selected.restaurant?.phone} • GSTIN: {selected.restaurant?.gstin}</div>
                  </div>
                  <div style={{borderTop:'1px dashed #000',margin:'8px 0'}}/>
                  <div style={{display:'flex',justifyContent:'space-between',fontSize:11}}><span>Bill: {selected.bill.billNumber}</span><span>{new Date(selected.bill.billDate).toLocaleString()}</span></div>
                  <div style={{fontSize:11}}>Table: {selected.table? selected.table.tableNumber:'—'} • Order: {selected.order?.orderNumber}</div>
                  <div style={{fontSize:11}}>Cashier: {selected.cashier?.name || '—'} {selected.bill.isReprint && <b style={{marginLeft:6}}>[REPRINT]</b>}</div>
                  <div style={{borderTop:'1px dashed #000',margin:'8px 0'}}/>
                  {selected.items?.map(it=> <div key={it.id} style={{display:'flex',justifyContent:'space-between',fontSize:11,marginBottom:4, gap:8}}><span style={{flex:1,paddingRight:8,wordBreak:'break-word'}}>{it.name} x{it.quantity}</span><span style={{whiteSpace:'nowrap'}}>{fmt(it.lineTotal)}</span></div>)}
                  <div style={{borderTop:'1px dashed #000',margin:'8px 0'}}/>
                  <div style={{display:'flex',justifyContent:'space-between',fontSize:11}}><span>Subtotal</span><span>{fmt(selected.bill.subtotal)}</span></div>
                  <div style={{display:'flex',justifyContent:'space-between',fontSize:11}}><span>CGST</span><span>{fmt(selected.bill.cgst)}</span></div>
                  <div style={{display:'flex',justifyContent:'space-between',fontSize:11}}><span>SGST</span><span>{fmt(selected.bill.sgst)}</span></div>
                  {selected.bill.discountAmount>0 && <div style={{display:'flex',justifyContent:'space-between',fontSize:11}}><span>Discount</span><span>-{fmt(selected.bill.discountAmount)}</span></div>}
                  {selected.bill.roundOff!=0 && <div style={{display:'flex',justifyContent:'space-between',fontSize:11}}><span>Round Off</span><span>{fmt(selected.bill.roundOff)}</span></div>}
                  <div style={{display:'flex',justifyContent:'space-between',fontWeight:700,borderTop:'1px solid #000',marginTop:6,paddingTop:6,fontSize:12}}><span>Grand Total</span><span>{fmt(selected.bill.grandTotal)}</span></div>
                  <div style={{display:'flex',justifyContent:'space-between',fontSize:11}}><span>Paid ({selected.bill.paymentMethod})</span><span>{fmt(selected.bill.amountReceived)}</span></div>
                  <div style={{display:'flex',justifyContent:'space-between',fontSize:11}}><span>Change</span><span>{fmt(selected.bill.changeDue)}</span></div>
                  <div style={{textAlign:'center',marginTop:10,fontSize:10}}>Thank you for dining with us! Visit again.<br/>Powered by Emerald POS</div>
                </div>
              </div>
              <div className="bill-modal__footer no-print">
                <button className="btn btn-primary" onClick={handlePrintA4}><FiPrinter/> Print A4</button>
                <button className="btn btn-accent" onClick={handlePrintThermal}><FiPrinter/> Print Receipt (80mm)</button>
                <button className="btn btn-ghost" onClick={()=>pay(selected.bill,'cash')}>Add Payment</button>
                <button className="btn btn-ghost" onClick={()=>setSelected(null)}>Close</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
