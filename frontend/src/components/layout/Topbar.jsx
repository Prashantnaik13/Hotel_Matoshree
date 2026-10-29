import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiBell, FiSearch, FiGrid, FiBookOpen, FiClipboard, FiPrinter, FiUser, FiMenu } from 'react-icons/fi';
import api from '../../api/axios.js';
import { useUI } from '../../context/UIContext.jsx';

const typeIcons = {
  table: FiGrid,
  menu_item: FiBookOpen,
  order: FiClipboard,
  bill: FiPrinter,
  user: FiUser
};

const typeColors = {
  table: '#0d47a1',
  menu_item: '#2e7d32',
  order: '#e65100',
  bill: '#6a1b9a',
  user: '#37474f'
};

const notifIcons = {
  new_order: '🧾',
  order_update: '✏️',
  kot_new: '👨‍🍳',
  bill_generated: '🧾',
  payment_completed: '💰',
  payment_pending: '⏳',
  order_cancelled: '❌',
  table_cleaning: '🧹'
};

export default function Topbar({ title, subtitle, actions }){
  const { toggleSidebar } = useUI();
  const [query,setQuery]=useState('');
  const [results,setResults]=useState(null);
  const [searching,setSearching]=useState(false);
  const [searchError,setSearchError]=useState('');
  const [showDropdown,setShowDropdown]=useState(false);
  const [focusedIndex,setFocusedIndex]=useState(-1);
  const navigate = useNavigate();
  const searchRef = useRef(null);
  const debounceRef = useRef(null);
  const seqRef = useRef(0);

  // notifications
  const [notifications,setNotifications]=useState([]);
  const [unread,setUnread]=useState(0);
  const [showNotif,setShowNotif]=useState(false);
  const notifRef = useRef(null);
  const pollRef = useRef(null);
  const fetchingNotif = useRef(false);

  const fetchUnread=async()=>{
    if(fetchingNotif.current) return;
    fetchingNotif.current=true;
    try{
      const r=await api.get('/notifications/unread-count');
      setUnread(r.data.data.count);
    }catch{} finally { fetchingNotif.current=false; }
  };
  const fetchNotifications=async()=>{
    try{
      const r=await api.get('/notifications?limit=20');
      setNotifications(r.data.data);
    }catch{}
  };
  const openNotif=async()=>{
    const willOpen = !showNotif;
    setShowNotif(willOpen);
    if(willOpen) await fetchNotifications();
  };
  const markRead=async(id)=>{
    await api.patch(`/notifications/${id}/read`);
    setNotifications(prev=> prev.map(n=> n.id===id ? {...n, isRead:true}: n));
    setUnread(u=> Math.max(0, u-1));
  };
  const markAllRead=async()=>{
    await api.patch('/notifications/read-all');
    setNotifications(prev=> prev.map(n=> ({...n, isRead:true})));
    setUnread(0);
  };

  useEffect(()=>{
    fetchUnread();
    const id = setInterval(fetchUnread, 15000);
    pollRef.current=id;
    return ()=> clearInterval(id);
  },[]);

  // search debounce
  useEffect(()=>{
    if(debounceRef.current) clearTimeout(debounceRef.current);
    const q = query.trim();
    if(q.length < 2){
      setResults(null); setSearching(false); setSearchError(''); setShowDropdown(false);
      return;
    }
    setSearching(true); setShowDropdown(true);
    const seq = ++seqRef.current;
    debounceRef.current = setTimeout(async()=>{
      try{
        const r=await api.get(`/search?q=${encodeURIComponent(q)}`);
        if(seq !== seqRef.current) return;
        setResults(r.data.data);
        setSearchError('');
      }catch(e){
        if(seq !== seqRef.current) return;
        setSearchError(e.response?.data?.message || 'Search failed');
        setResults(null);
      }finally{
        if(seq===seqRef.current) setSearching(false);
      }
    }, 300);
    return ()=> clearTimeout(debounceRef.current);
  },[query]);

  // click outside
  useEffect(()=>{
    const h=(e)=>{
      if(searchRef.current && !searchRef.current.contains(e.target)) setShowDropdown(false);
      if(notifRef.current && !notifRef.current.contains(e.target)) setShowNotif(false);
    };
    document.addEventListener('mousedown', h);
    return ()=> document.removeEventListener('mousedown', h);
  },[]);

  const flatResults = ()=>{
    if(!results) return [];
    const all=[];
    ['tables','menuItems','orders','bills','users'].forEach(key=>{
      (results[key]||[]).forEach(r=> all.push(r));
    });
    return all;
  };
  const allFlat = flatResults();
  const hasResults = allFlat.length>0;

  const handleKey=(e)=>{
    if(!showDropdown) return;
    if(e.key==='Escape'){ setShowDropdown(false); setFocusedIndex(-1); }
    if(e.key==='ArrowDown'){ e.preventDefault(); setFocusedIndex(i=> Math.min(i+1, allFlat.length-1)); }
    if(e.key==='ArrowUp'){ e.preventDefault(); setFocusedIndex(i=> Math.max(i-1, -1)); }
    if(e.key==='Enter' && focusedIndex>=0){
      const item=allFlat[focusedIndex];
      if(item) { navigate(item.navigate); setShowDropdown(false); setQuery(''); }
    }
  };

  const groupLabels = { tables:'Tables', menuItems:'Menu Items', orders:'Orders', bills:'Bills', users:'Users' };

  return (
    <div className="topbar">
      <div className="topbar-left">
        <button className="hamburger-btn" onClick={toggleSidebar} aria-label="Toggle menu">
          <FiMenu/>
        </button>
        <div>
          <h2>{title}</h2>
          {subtitle && <div className="topbar-subtitle">{subtitle}</div>}
        </div>
      </div>
      <div className="top-actions">
        <div className="topbar-search" ref={searchRef}>
          <FiSearch className="topbar-search-icon"/>
          <input
            className="input"
            placeholder="Search bills, orders, tables..."
            value={query}
            onChange={e=>setQuery(e.target.value)}
            onFocus={()=> query.trim().length>=2 && setShowDropdown(true)}
            onKeyDown={handleKey}
          />
          {showDropdown && (
            <div className="search-dropdown">
              {searching && <div className="search-state">Searching…</div>}
              {searchError && <div className="search-state error">{searchError}</div>}
              {!searching && !searchError && !hasResults && <div className="search-state">No results for “{query}”</div>}
              {!searching && !searchError && results && Object.entries(groupLabels).map(([key,label])=>{
                const items = results[key]||[];
                if(items.length===0) return null;
                return (
                  <div key={key} className="search-group">
                    <div className="search-group-label">{label}</div>
                    {items.map((it)=>{
                      const globalIdx = allFlat.indexOf(it);
                      const Icon = typeIcons[it.type]||FiSearch;
                      return (
                        <div key={it.type+it.id} onClick={()=>{ navigate(it.navigate); setShowDropdown(false); setQuery(''); }} className={`search-item ${globalIdx===focusedIndex?'focused':''}`}>
                          <div className="search-item-icon" style={{background:typeColors[it.type]||'#123C32'}}><Icon/></div>
                          <div className="search-item-text">
                            <div className="search-item-title">{it.title}</div>
                            <div className="search-item-subtitle">{it.subtitle}</div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="notif-wrapper" ref={notifRef}>
          <button className="btn btn-ghost btn-sm notif-btn" onClick={openNotif} aria-label="Notifications">
            <FiBell/>
            {unread>0 && <span className="notif-badge">{unread>99? '99+': unread}</span>}
          </button>
          {showNotif && (
            <div className="notif-dropdown">
              <div className="notif-header">
                <b>Notifications {unread>0 && <span className="notif-count">{unread} new</span>}</b>
                <button onClick={markAllRead} className="notif-mark-all">Mark all read</button>
              </div>
              <div className="notif-body">
                {notifications.length===0 && <div className="notif-empty">No notifications yet<br/><span>Events like new orders, KOT, payments will appear here</span></div>}
                {notifications.map(n=>(
                  <div key={n.id} className={`notif-item ${n.isRead?'':'unread'}`}>
                    <div className="notif-icon">{notifIcons[n.type]||'🔔'}</div>
                    <div className="notif-content">
                      <div className="notif-title">{n.title}{!n.isRead && <span className="notif-dot"/>}</div>
                      <div className="notif-message">{n.message}</div>
                      <div className="notif-time">{new Date(n.createdAt).toLocaleString()}</div>
                      <div className="notif-actions">
                        {!n.isRead && <button onClick={()=>markRead(n.id)} className="notif-btn-read">Mark read</button>}
                        {n.relatedEntityType && n.relatedEntityId && <button onClick={()=>{ if(n.relatedEntityType==='bill') navigate(`/billing?bill=${n.relatedEntityId}`); else if(n.relatedEntityType==='order') navigate(`/orders?order=${n.relatedEntityId}`); else if(n.relatedEntityType==='kot') navigate('/kitchen'); else if(n.relatedEntityType==='table') navigate('/tables'); setShowNotif(false); }} className="notif-btn-open">Open</button>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="notif-footer">Polling every 15s • Click bell to refresh</div>
            </div>
          )}
        </div>

        {actions}
      </div>
    </div>
  )
}
