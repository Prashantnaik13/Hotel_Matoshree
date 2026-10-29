import { createContext, useContext, useState, useEffect } from 'react';

const UIContext = createContext(null);
export const useUI = ()=> useContext(UIContext);

export function UIProvider({ children }){
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const openSidebar = ()=> setSidebarOpen(true);
  const closeSidebar = ()=> setSidebarOpen(false);
  const toggleSidebar = ()=> setSidebarOpen(v=> !v);

  // prevent background scroll when drawer open on mobile/tablet
  useEffect(()=>{
    if(sidebarOpen){
      document.body.style.overflow='hidden';
    } else {
      document.body.style.overflow='';
    }
    return ()=> { document.body.style.overflow=''; };
  },[sidebarOpen]);

  // close on escape
  useEffect(()=>{
    const h=(e)=>{ if(e.key==='Escape' && sidebarOpen) closeSidebar(); };
    window.addEventListener('keydown', h);
    return ()=> window.removeEventListener('keydown', h);
  },[sidebarOpen]);

  return (
    <UIContext.Provider value={{ sidebarOpen, openSidebar, closeSidebar, toggleSidebar }}>
      {children}
    </UIContext.Provider>
  )
}
