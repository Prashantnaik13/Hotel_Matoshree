import React, { createContext, useContext, useEffect, useState } from 'react';
import api from '../api/axios.js';

const AuthContext = createContext(null);
export const useAuth = ()=> useContext(AuthContext);

export function AuthProvider({ children }){
  const [user, setUser] = useState(()=>{
    const s=localStorage.getItem('user');
    return s? JSON.parse(s): null;
  });
  const [loading, setLoading]=useState(false);

  const login = async (email,password)=>{
    setLoading(true);
    try{
      const res=await api.post('/auth/login', { email, password });
      const { token, user } = res.data.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      setUser(user);
      return user;
    }finally{ setLoading(false); }
  };

  const logout= async()=>{
    try{ await api.post('/auth/logout'); }catch{}
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const fetchMe= async()=>{
    try{
      const res=await api.get('/auth/me');
      setUser(res.data.data);
      localStorage.setItem('user', JSON.stringify(res.data.data));
    }catch{
      // ignore
    }
  };

  useEffect(()=>{ if(localStorage.getItem('token')) fetchMe(); },[]);

  return <AuthContext.Provider value={{ user, login, logout, loading, setUser }}>{children}</AuthContext.Provider>
}
