import { useEffect, useState } from 'react';
import api from '../../api/axios.js';
import Topbar from '../../components/layout/Topbar.jsx';
import { fmt } from '../../utils/format.js';
import { FiPlus, FiMinus, FiTrash2, FiPrinter, FiSend, FiCreditCard, FiGrid, FiBookOpen, FiShoppingBag } from 'react-icons/fi';

export default function POS(){
  const [tables,setTables]=useState([]);
  const [selectedTable,setSelectedTable]=useState(null);
  const [activeOrder,setActiveOrder]=useState(null);
  const [categories,setCategories]=useState([]);
  const [items,setItems]=useState([]);
  const [catFilter,setCatFilter]=useState('');
  const [tableSearch,setTableSearch]=useState('');
  const [dishSearch,setDishSearch]=useState('');
  const [cart,setCart]=useState([]);
  const [preview,setPreview]=useState(null);
  const [payMethod,setPayMethod]=useState('cash');
  const [showPay,setShowPay]=useState(false);
  const [showBill,setShowBill]=useState(null);
  const [toast,setToast]=useState('');
  const [activeTab,setActiveTab]=useState('tables'); // mobile tabs

  const loadTables=async()=>{ const r=await api.get('/tables'); setTables(r.data.data); };
  const loadMenu=async()=>{
    const c=await api.get('/menu/categories'); setCategories(c.data.data);
    const it=await api.get('/menu/items'); setItems(it.data.data);
  };
  useEffect(()=>{ loadTables(); loadMenu(); },[]);

  const selectTable=async(t)=>{
    setSelectedTable(t);
    setCart([]); setPreview(null);
    setActiveTab('menu'); // auto switch to menu on mobile after selecting table
    try{
      const r=await api.get(`/tables/${t.id}/active-order`);
      setActiveOrder(r.data.data);
      if(r.data.data){
        const p=await api.post('/billing/preview',{ orderId:r.data.data.id });
        setPreview(p.data.data);
      }
    }catch{}
  };

  const filteredTables = tables.filter(t=>{
    const q = tableSearch.trim().toLowerCase();
    if(!q) return true;
    return t.tableNumber.toLowerCase().includes(q) ||
           (t.section && t.section.toLowerCase().includes(q)) ||
           (t.status && t.status.toLowerCase().includes(q));
  });

  const filteredItems = items.filter(i=>{
    if(catFilter && String(i.categoryId)!==String(catFilter)) return false;
    const q = dishSearch.trim().toLowerCase();
    if(!q) return true;
    return i.name.toLowerCase().includes(q) ||
           (i.description && i.description.toLowerCase().includes(q)) ||
           (i.sku && i.sku.toLowerCase().includes(q));
  });

  const addToCart=(menu)=>{
    if(activeOrder){
      (async()=>{
        await api.post(`/orders/${activeOrder.id}/items`, { items:[{ menuItemId: menu.id, quantity:1 }] });
        selectTable(selectedTable);
        showToast('Item added to order');
      })();
    } else {
      setCart(prev=>{
        const idx=prev.findIndex(p=>p.menuItemId===menu.id);
        if(idx>=0){ const n=[...prev]; n[idx].quantity+=1; return n; }
        return [...prev, { menuItemId:menu.id, name:menu.name, price:menu.price, quantity:1 }];
      });
    }
  };

  const updateCart=(i, delta)=>{
    setCart(prev=> {
      const n=[...prev]; n[i].quantity+=delta;
      if(n[i].quantity<=0) n.splice(i,1);
      return n;
    });
  };

  const saveOrder=async()=>{
    if(!selectedTable) return alert('Select a table');
    if(cart.length===0) return;
    const res=await api.post('/orders', { tableId:selectedTable.id, type:'dine_in', items: cart.map(c=>({ menuItemId:c.menuItemId, quantity:c.quantity })) });
    setActiveOrder(res.data.data);
    setCart([]);
    loadTables();
    selectTable(selectedTable);
    showToast('Order created #' + res.data.data.orderNumber);
  };

  const updateOrderItem=async(itemId, qty)=>{
    if(qty<=0){
      if(!confirm('Remove item?')) return;
    }
    await api.put(`/orders/${activeOrder.id}/items`, { items:[{ id:itemId, quantity:qty }] });
    selectTable(selectedTable);
  };

  const sendToKitchen=async()=>{
    await api.post(`/orders/${activeOrder.id}/send-to-kitchen`);
    showToast('Sent to kitchen (KOT created)');
    selectTable(selectedTable);
  };

  const generateBill=async()=>{
    const res=await api.post('/billing/finalize', { orderId:activeOrder.id, paymentMethod: payMethod });
    setShowBill(res.data.data);
    showToast('Bill generated: ' + res.data.data.billNumber);
    loadTables(); selectTable(selectedTable);
  };

  const handlePrintReceipt=()=>{
    document.body.classList.add('print-thermal-mode');
    setTimeout(()=>{ window.print(); setTimeout(()=> document.body.classList.remove('print-thermal-mode'), 500); }, 100);
  };

  const showToast=(msg)=>{ setToast(msg); setTimeout(()=>setToast(''),3000); };

  const cartPreviewCalc=()=>{
    let sub=0; cart.forEach(c=> sub+= Number(c.price)*c.quantity);
    const tax=sub*0.05; return { subtotal:sub, tax, grand: Math.round(sub+tax) };
  };
  const calc= cartPreviewCalc();

  return (
    <>
      <Topbar title="POS Billing" subtitle="Fast checkout • Table-wise isolation • Accurate tax"/>
      <div className="content" style={{padding:16}}>
        {/* Mobile tabs */}
        <div className="pos-tabs no-print">
          <button className={`pos-tab ${activeTab==='tables'?'active':''}`} onClick={()=>setActiveTab('tables')}><FiGrid/> Tables {selectedTable && `• ${selectedTable.tableNumber}`}</button>
          <button className={`pos-tab ${activeTab==='menu'?'active':''}`} onClick={()=>setActiveTab('menu')}><FiBookOpen/> Menu</button>
          <button className={`pos-tab ${activeTab==='order'?'active':''}`} onClick={()=>setActiveTab('order')}><FiShoppingBag/> Order {activeOrder ? `• ${activeOrder.orderNumber}` : cart.length ? `• ${cart.length}` : ''}</button>
        </div>

        <div className="pos-layout">
          {/* Left: Tables */}
          <div className={`pos-panel pos-panel-tables ${activeTab==='tables'?'active':''}`}>
            <header>Tables <span style={{fontSize:12,background:'var(--primary)',color:'#fff',padding:'3px 8px',borderRadius:20}}>{tables.filter(t=>t.status==='available').length} free</span></header>
            <div className="scroll">
              <input className="input" placeholder="Search table..." value={tableSearch} onChange={e=>setTableSearch(e.target.value)} style={{marginBottom:10}}/>
              {filteredTables.length===0 && <div className="empty" style={{padding:16}}>No tables match “{tableSearch}”</div>}
              <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:8}}>
                {filteredTables.map(t=>(
                  <div key={t.id} onClick={()=>selectTable(t)} style={{padding:10,borderRadius:12,border:selectedTable?.id===t.id?'2px solid var(--accent)':'1px solid var(--border)',background: t.status==='available'?'#e8f5e9': t.status==='occupied'?'#fff3e0':'#fff',cursor:'pointer'}}>
                    <div style={{fontWeight:700,fontSize:13}}>{t.tableNumber}</div>
                    <div style={{fontSize:11,color:'var(--muted)'}}>{t.capacity} pax • {t.status}</div>
                    {t.activeOrder && <div style={{fontSize:11,marginTop:4,background:'#fff',padding:4,borderRadius:6,border:'1px solid var(--border)'}}>{t.activeOrder.orderNumber} • {fmt(t.activeOrder.grandTotal)}</div>}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Center: Menu */}
          <div className={`pos-panel pos-panel-menu ${activeTab==='menu'?'active':''}`}>
            <header>
              <span>Menu {selectedTable && <small style={{fontWeight:400,color:'var(--muted)'}}>• {selectedTable.tableNumber}</small>}</span>
              <input className="input" placeholder="Search dish..." style={{width:180,height:32}} value={dishSearch} onChange={e=>setDishSearch(e.target.value)}/>
            </header>
            <div className="scroll">
              <div className="category-pills">
                <button className={`pill ${!catFilter?'active':''}`} onClick={()=>setCatFilter('')}>All</button>
                {categories.map(c=> <button key={c.id} className={`pill ${String(catFilter)===String(c.id)?'active':''}`} onClick={()=>setCatFilter(c.id)}>{c.name}</button>)}
              </div>
              {filteredItems.length===0 && <div className="empty">No menu items match “{dishSearch}”</div>}
              <div className="menu-grid">
                {filteredItems.map(m=>(
                  <div key={m.id} className="menu-card" onClick={()=>addToCart(m)} style={{opacity: m.isAvailable?1:0.5}}>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:6}}><h5 style={{flex:1}}>{m.name}</h5><span className={m.vegType==='veg'?'badge-veg':'badge-nonveg'} style={{fontSize:9,padding:'2px 6px',flexShrink:0}}>{m.vegType==='veg'?'VEG':'NON-VEG'}</span></div>
                    <div style={{fontSize:11,color:'var(--muted)',marginTop:4,lineHeight:1.3}}>{m.description?.slice(0,40)}</div>
                    <div className="price">{fmt(m.price)}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Order */}
          <div className={`pos-panel pos-panel-order ${activeTab==='order'?'active':''}`}>
            <header>
              <span>{selectedTable? `Table ${selectedTable.tableNumber}`:'Select Table'}</span>
              {activeOrder && <span style={{fontSize:11,background:'var(--primary)',color:'#fff',padding:'4px 8px',borderRadius:20}}>{activeOrder.orderNumber}</span>}
            </header>
            <div className="scroll">
              {!selectedTable && <div className="empty">Select a table to start billing</div>}
              {selectedTable && !activeOrder && cart.length===0 && <div className="empty">No active order. Add items to create one.</div>}
              {selectedTable && !activeOrder && cart.map((c,i)=>(
                <div key={i} className="order-row"><div><div style={{fontWeight:600,fontSize:13}}>{c.name}</div><div style={{fontSize:12,color:'var(--muted)'}}>{fmt(c.price)} x {c.quantity}</div></div>
                  <div className="qty"><button onClick={()=>updateCart(i,-1)}><FiMinus/></button>{c.quantity}<button onClick={()=>updateCart(i,1)}><FiPlus/></button></div>
                  <div style={{fontWeight:700,whiteSpace:'nowrap'}}>₹{(Number(c.price)*c.quantity).toFixed(2)}</div>
                </div>
              ))}

              {activeOrder && activeOrder.items?.map(it=>(
                <div key={it.id} className="order-row">
                  <div style={{minWidth:0,flex:1}}><div style={{fontWeight:600,fontSize:13,wordBreak:'break-word'}}>{it.nameSnapshot}</div><div style={{fontSize:12,color:'var(--muted)'}}>{fmt(it.unitPrice)} • {it.kotStatus}</div></div>
                  <div className="qty"><button onClick={()=>updateOrderItem(it.id, it.quantity-1)}><FiMinus/></button>{it.quantity}<button onClick={()=>updateOrderItem(it.id, it.quantity+1)}><FiPlus/></button><button onClick={()=>updateOrderItem(it.id,0)} style={{color:'var(--error)',borderColor:'var(--border)'}}><FiTrash2/></button></div>
                  <div style={{fontWeight:700,whiteSpace:'nowrap'}}>{fmt(it.lineTotal)}</div>
                </div>
              ))}

              {(preview || cart.length>0) && (
                <div className="totals">
                  {preview ? (
                    <>
                      <div className="line"><span>Subtotal</span><b>{fmt(preview.subtotal)}</b></div>
                      {preview.discountAmount>0 && <div className="line"><span>Discount</span><b>- {fmt(preview.discountAmount)}</b></div>}
                      <div className="line"><span>Taxable</span><span>{fmt(preview.taxableAmount)}</span></div>
                      <div className="line"><span>CGST / SGST</span><span>{fmt(preview.cgst)} / {fmt(preview.sgst)}</span></div>
                      {preview.serviceCharge>0 && <div className="line"><span>Service</span><span>{fmt(preview.serviceCharge)}</span></div>}
                      {preview.roundOff!==0 && <div className="line"><span>Round Off</span><span>{fmt(preview.roundOff)}</span></div>}
                      <div className="line grand"><span>Grand Total</span><span>{fmt(preview.grandTotal)}</span></div>
                    </>
                  ) : (
                    <>
                      <div className="line"><span>Subtotal</span><b>{fmt(calc.subtotal)}</b></div>
                      <div className="line"><span>GST 5%</span><span>{fmt(calc.tax)}</span></div>
                      <div className="line grand"><span>Grand Total</span><span>{fmt(calc.grand)}</span></div>
                    </>
                  )}
                </div>
              )}

              <div style={{display:'flex',flexDirection:'column',gap:8,marginTop:12}}>
                {!activeOrder && cart.length>0 && <button className="btn btn-primary" onClick={saveOrder}>Save Order • {fmt(calc.grand)}</button>}
                {activeOrder && <button className="btn btn-ghost" onClick={sendToKitchen}><FiSend/> Send to Kitchen (KOT)</button>}
                {activeOrder && <button className="btn btn-accent" onClick={()=>setShowPay(true)}><FiCreditCard/> Generate Bill • {preview? fmt(preview.grandTotal):''}</button>}
                {selectedTable && <button className="btn btn-ghost" onClick={()=>selectTable(selectedTable)}>↻ Refresh</button>}
              </div>
            </div>
          </div>
        </div>
      </div>

      {showPay && (
        <div className="modal-overlay no-print" onClick={()=>setShowPay(false)}>
          <div className="modal no-print" onClick={e=>e.stopPropagation()}>
            <header className="no-print">Confirm Bill <button onClick={()=>setShowPay(false)} className="btn btn-ghost btn-sm no-print">×</button></header>
            <div className="body no-print">
              <div style={{background:'var(--secondary)',padding:12,borderRadius:12}}>
                <div style={{display:'flex',justifyContent:'space-between'}}><span>Table</span><b>{selectedTable.tableNumber}</b></div>
                <div style={{display:'flex',justifyContent:'space-between',marginTop:6}}><span>Order</span><b>{activeOrder.orderNumber}</b></div>
                <div style={{display:'flex',justifyContent:'space-between',marginTop:6}}><span>Total</span><b>{preview && fmt(preview.grandTotal)}</b></div>
              </div>
              <div style={{marginTop:12}}><label className="label">Payment Method</label>
                <select className="input" value={payMethod} onChange={e=>setPayMethod(e.target.value)}><option value="cash">Cash</option><option value="upi">UPI</option><option value="debit_card">Debit Card</option><option value="credit_card">Credit Card</option><option value="other">Other</option></select>
              </div>
              <button className="btn btn-primary no-print" style={{width:'100%',marginTop:14,justifyContent:'center'}} onClick={generateBill}>Finalize & Print</button>
              <div style={{fontSize:11,color:'var(--muted)',marginTop:8,textAlign:'center'}}>Bill will be validated on server • No duplicate finalization</div>
            </div>
          </div>
        </div>
      )}

      {showBill && (
        <div className="modal-overlay print-overlay" onClick={()=>setShowBill(null)}>
          <div className="modal print-modal" style={{maxWidth:420}} onClick={e=>e.stopPropagation()}>
            <header className="no-print">Bill {showBill.billNumber} <button onClick={()=>setShowBill(null)} className="btn btn-ghost btn-sm no-print">×</button></header>
            <div className="body">
              <div className="print-area print-area-thermal" id="receipt">
                <div className="receipt-content">
                  <h2 style={{textAlign:'center'}}>The Emerald Grandeur</h2>
                  <div style={{textAlign:'center',fontSize:10}}>45 Residency Road, Sholapur<br/>GSTIN: 27ABCDE1234F1Z5 • +91 98765 43210</div>
                  <div style={{borderTop:'1px dashed #000',margin:'8px 0'}}/>
                  <div style={{display:'flex',justifyContent:'space-between',fontSize:11}}><span>Bill: {showBill.billNumber}</span><span>{new Date(showBill.billDate).toLocaleString()}</span></div>
                  <div style={{fontSize:11}}>Table: {selectedTable.tableNumber} • Order: {activeOrder.orderNumber}</div>
                  <div style={{borderTop:'1px dashed #000',margin:'8px 0'}}/>
                  {showBill.items?.map((it,i)=> <div key={i} style={{display:'flex',justifyContent:'space-between',fontSize:11, gap:8}}><span style={{flex:1, paddingRight:8, wordBreak:'break-word'}}>{it.name} x{it.quantity}</span><span style={{whiteSpace:'nowrap'}}>{fmt(it.lineTotal)}</span></div>)}
                  <div style={{borderTop:'1px dashed #000',margin:'8px 0'}}/>
                  <div style={{display:'flex',justifyContent:'space-between'}}><span>Subtotal</span><span>{fmt(showBill.subtotal)}</span></div>
                  <div style={{display:'flex',justifyContent:'space-between'}}><span>CGST</span><span>{fmt(showBill.cgst)}</span></div>
                  <div style={{display:'flex',justifyContent:'space-between'}}><span>SGST</span><span>{fmt(showBill.sgst)}</span></div>
                  <div style={{display:'flex',justifyContent:'space-between',fontWeight:700,borderTop:'1px solid #000',marginTop:6,paddingTop:6}}><span>Grand Total</span><span>{fmt(showBill.grandTotal)}</span></div>
                  <div style={{textAlign:'center',marginTop:8,fontSize:10}}>Thank you for dining with us! Visit again.</div>
                </div>
              </div>
              <div className="no-print" style={{display:'flex',gap:8,marginTop:12}}>
                <button className="btn btn-primary no-print" style={{flex:1}} onClick={handlePrintReceipt}><FiPrinter/> Print Receipt</button>
                <button className="btn btn-ghost no-print" onClick={()=>setShowBill(null)}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
      {toast && <div className="toast no-print">{toast}</div>}
    </>
  )
}
