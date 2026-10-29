import { useEffect, useState } from 'react';
import api from '../../api/axios.js';
import Topbar from '../../components/layout/Topbar.jsx';

export default function Users(){
  const [users,setUsers]=useState([]);
  const [show,setShow]=useState(false);
  const [form,setForm]=useState({ name:'', email:'', username:'', password:'', role:'waiter' });
  const load=async()=>{ const r=await api.get('/settings/users'); setUsers(r.data.data); };
  useEffect(()=>{ load(); },[]);
  const create=async(e)=>{
    e.preventDefault();
    await api.post('/settings/users', form);
    setShow(false); load();
  };
  return (
    <>
      <Topbar title="User Management" subtitle="Roles • Permissions • Activation"/>
      <div className="content">
        <button className="btn btn-primary" onClick={()=>setShow(true)}>+ Add User</button>
        <div className="card" style={{marginTop:16,padding:0,overflow:'hidden'}}>
          <table className="data-table"><thead><tr><th>Name</th><th>Email</th><th>Username</th><th>Role</th><th>Status</th></tr></thead>
          <tbody>{users.map(u=> <tr key={u.id}><td>{u.name}</td><td>{u.email}</td><td>{u.username}</td><td style={{textTransform:'capitalize'}}>{u.role.replace('_',' ')}</td><td>{u.isActive?'Active':'Inactive'}</td></tr>)}</tbody></table>
        </div>
        {show && (
          <div className="modal-overlay" onClick={()=>setShow(false)}>
            <div className="modal" onClick={e=>e.stopPropagation()}><header>Add User</header>
            <form onSubmit={create} className="body" style={{display:'flex',flexDirection:'column',gap:10}}>
              <input className="input" placeholder="Name" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} required/>
              <input className="input" placeholder="Email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} required/>
              <input className="input" placeholder="Username" value={form.username} onChange={e=>setForm({...form,username:e.target.value})} required/>
              <input className="input" placeholder="Password" type="password" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} required/>
              <select className="input" value={form.role} onChange={e=>setForm({...form,role:e.target.value})}><option value="super_admin">Super Admin</option><option value="manager">Manager</option><option value="cashier">Cashier</option><option value="waiter">Waiter</option></select>
              <button className="btn btn-primary">Create</button>
            </form>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
