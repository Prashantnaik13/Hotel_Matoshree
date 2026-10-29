import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { FiEye, FiEyeOff } from 'react-icons/fi';

export default function Login(){
  const { login, loading } = useAuth();
  const nav=useNavigate();
  const [form,setForm]=useState({ email:'admin@emerald.com', password:'admin123' });
  const [show,setShow]=useState(false);
  const [err,setErr]=useState('');
  const submit=async(e)=>{
    e.preventDefault();
    setErr('');
    try{
      const u=await login(form.email, form.password);
      if(u.role==='waiter') nav('/pos');
      else nav('/');
    }catch(e){ setErr(e.response?.data?.message||'Login failed'); }
  };
  return (
    <div className="login-wrapper">
      <div className="login-card">
        <div className="login-left">
          <div>
            <div style={{display:'flex',alignItems:'center',gap:12}}>
              <div style={{width:48,height:48,borderRadius:12,background:'#C6A15B',display:'grid',placeItems:'center',color:'#123C32',fontWeight:800,fontSize:22,fontFamily:'Playfair Display'}}>EG</div>
              <div><div style={{fontFamily:'Playfair Display',fontSize:20,fontWeight:700}}>Emerald Grandeur</div><div style={{opacity:0.7,fontSize:11,letterSpacing:1,textTransform:'uppercase'}}>Premium Hospitality</div></div>
            </div>
            <h2 style={{marginTop:32,fontFamily:'Playfair Display',fontSize:30,lineHeight:1.1}}>Elevate Your <br/>Restaurant Operations</h2>
            <p style={{opacity:0.8,marginTop:12,lineHeight:1.5}}>Secure POS, table management, accurate billing, KOT & reports — everything in one premium platform.</p>
            <div style={{marginTop:20,background:'rgba(255,255,255,0.08)',padding:14,borderRadius:12,border:'1px solid rgba(255,255,255,0.1)'}}>
              <div style={{fontSize:13,opacity:0.9}}>Demo Accounts:</div>
              <div style={{fontSize:12,marginTop:6,lineHeight:1.6,opacity:0.85}}>
                admin@emerald.com / admin123 — Super Admin<br/>
                manager@emerald.com / admin123 — Manager<br/>
                cashier@emerald.com / admin123 — Cashier<br/>
                waiter@emerald.com / admin123 — Waiter
              </div>
            </div>
          </div>
          <div style={{opacity:0.6,fontSize:12}}>© 2024 Emerald Grandeur • Sholapur, Maharashtra</div>
        </div>
        <div style={{padding:32}}>
          <h3 style={{fontSize:22,fontWeight:700}}>Welcome back</h3>
          <p style={{color:'var(--muted)',fontSize:13,marginTop:6}}>Sign in to your POS workspace</p>
          <form onSubmit={submit} style={{marginTop:20, display:'flex', flexDirection:'column', gap:14}}>
            {err && <div style={{background:'#ffebee',color:'#b71c1c',padding:10,borderRadius:10,fontSize:13}}>{err}</div>}
            <div>
              <label className="label">Email or Username</label>
              <input className="input" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} placeholder="admin@emerald.com" required/>
            </div>
            <div>
              <label className="label">Password</label>
              <div style={{position:'relative'}}>
                <input className="input" type={show?'text':'password'} value={form.password} onChange={e=>setForm({...form,password:e.target.value})} placeholder="••••••••" required/>
                <button type="button" onClick={()=>setShow(!show)} style={{position:'absolute',right:10,top:10,background:'none',border:'none',color:'var(--muted)'}}>{show?<FiEyeOff/>:<FiEye/>}</button>
              </div>
            </div>
            <div style={{display:'flex',justifyContent:'space-between',fontSize:13,flexWrap:'wrap',gap:8}}>
              <label style={{display:'flex',gap:6,alignItems:'center'}}><input type="checkbox"/> Remember me</label>
              <a href="#" style={{color:'var(--primary)',fontWeight:600}}>Forgot password?</a>
            </div>
            <button className="btn btn-primary" style={{justifyContent:'center',padding:12}} disabled={loading}>{loading?'Signing in...':'Sign In'}</button>
            <div style={{textAlign:'center',fontSize:13,color:'var(--muted)'}}>Secure JWT authentication • Role-based access</div>
          </form>
        </div>
      </div>
    </div>
  )
}
