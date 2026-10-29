import { useEffect, useState } from 'react';
import api from '../../api/axios.js';
import Topbar from '../../components/layout/Topbar.jsx';
import { fmt } from '../../utils/format.js';
import { FiPlus } from 'react-icons/fi';

export default function Menu(){
  const [cats,setCats]=useState([]);
  const [items,setItems]=useState([]);
  const [filterCat,setFilterCat]=useState('');
  const [showCat,setShowCat]=useState(false);
  const [catForm,setCatForm]=useState({ name:'', description:'' });
  const [showItem,setShowItem]=useState(false);
  const [itemForm,setItemForm]=useState({ name:'', categoryId:'', price:'', description:'', vegType:'veg' });

  const load=async()=>{
    const c=await api.get('/menu/categories'); setCats(c.data.data);
    const it=await api.get('/menu/items' + (filterCat? `?categoryId=${filterCat}`:'')); setItems(it.data.data);
  };
  useEffect(()=>{ load(); },[filterCat]);

  const addCat=async(e)=>{
    e.preventDefault();
    await api.post('/menu/categories', catForm);
    setShowCat(false); setCatForm({name:'',description:''}); load();
  };
  const addItem=async(e)=>{
    e.preventDefault();
    await api.post('/menu/items', { ...itemForm, price:Number(itemForm.price), categoryId:Number(itemForm.categoryId) });
    setShowItem(false); setItemForm({name:'',categoryId:'',price:'',description:'',vegType:'veg'}); load();
  };
  const toggleAvail=async(id, v)=>{
    await api.patch(`/menu/items/${id}/status`, { isAvailable: !v });
    load();
  };

  return (
    <>
      <Topbar title="Menu Management" subtitle="Categories • Products • Pricing (DB-trusted)"/>
      <div className="content">
        <div style={{display:'flex',gap:10,marginBottom:16}}>
          <select className="input" style={{width:200}} value={filterCat} onChange={e=>setFilterCat(e.target.value)}><option value="">All Categories</option>{cats.map(c=> <option key={c.id} value={c.id}>{c.name}</option>)}</select>
          <button className="btn btn-ghost" onClick={()=>setShowCat(true)}><FiPlus/> Category</button>
          <button className="btn btn-primary" onClick={()=>setShowItem(true)}><FiPlus/> Menu Item</button>
        </div>

        <div style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:16}}>
          {cats.map(c=> <div key={c.id} style={{background:'#fff',border:'1px solid var(--border)',padding:'8px 14px',borderRadius:20,fontSize:13}}>{c.name} {filterCat==c.id && '•'}</div>)}
        </div>

        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))',gap:14}}>
          {items.map(it=>(
            <div key={it.id} className="card" style={{padding:14}}>
              <div style={{display:'flex',justifyContent:'space-between'}}>
                <h4 style={{fontSize:15}}>{it.name}</h4><span className={it.vegType==='veg'?'badge badge-veg':'badge badge-nonveg'}>{it.vegType}</span>
              </div>
              <div style={{fontSize:12,color:'var(--muted)',marginTop:6}}>{it.description}</div>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:10}}>
                <b style={{color:'var(--primary)',fontSize:16}}>{fmt(it.price)}</b>
                <span style={{fontSize:11,background: it.isAvailable?'#e8f5e9':'#ffebee',padding:'4px 8px',borderRadius:20}}>{it.isAvailable?'Available':'Unavailable'}</span>
              </div>
              <div style={{display:'flex',gap:8,marginTop:10}}>
                <button className="btn btn-ghost btn-sm" onClick={()=>toggleAvail(it.id, it.isAvailable)}>{it.isAvailable?'Disable':'Enable'}</button>
              </div>
            </div>
          ))}
        </div>

        {showCat && (
          <div className="modal-overlay" onClick={()=>setShowCat(false)}>
            <div className="modal" onClick={e=>e.stopPropagation()}><header>Add Category</header>
              <form onSubmit={addCat} className="body" style={{display:'flex',flexDirection:'column',gap:12}}>
                <input className="input" placeholder="Name" value={catForm.name} onChange={e=>setCatForm({...catForm,name:e.target.value})} required/>
                <input className="input" placeholder="Description" value={catForm.description} onChange={e=>setCatForm({...catForm,description:e.target.value})}/>
                <button className="btn btn-primary">Create</button>
              </form>
            </div>
          </div>
        )}
        {showItem && (
          <div className="modal-overlay" onClick={()=>setShowItem(false)}>
            <div className="modal" onClick={e=>e.stopPropagation()}><header>Add Menu Item</header>
              <form onSubmit={addItem} className="body" style={{display:'flex',flexDirection:'column',gap:12}}>
                <input className="input" placeholder="Item name" value={itemForm.name} onChange={e=>setItemForm({...itemForm,name:e.target.value})} required/>
                <select className="input" value={itemForm.categoryId} onChange={e=>setItemForm({...itemForm,categoryId:e.target.value})} required><option value="">Select category</option>{cats.map(c=> <option key={c.id} value={c.id}>{c.name}</option>)}</select>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}><input className="input" placeholder="Price" type="number" step="0.01" value={itemForm.price} onChange={e=>setItemForm({...itemForm,price:e.target.value})} required/>
                <select className="input" value={itemForm.vegType} onChange={e=>setItemForm({...itemForm,vegType:e.target.value})}><option value="veg">Veg</option><option value="non_veg">Non-Veg</option><option value="egg">Egg</option></select></div>
                <textarea className="input" placeholder="Description" value={itemForm.description} onChange={e=>setItemForm({...itemForm,description:e.target.value})}/>
                <button className="btn btn-primary">Create</button>
              </form>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
