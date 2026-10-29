import { NavLink, useNavigate } from 'react-router-dom';
import { FiGrid, FiLayers, FiShoppingCart, FiBookOpen, FiClipboard, FiPrinter, FiBarChart2, FiSettings, FiUsers, FiLogOut, FiCoffee, FiX, FiHelpCircle } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext.jsx';
import { useUI } from '../../context/UIContext.jsx';

const nav = [
  { to:'/', icon:FiGrid, label:'Dashboard', roles:['super_admin','manager','cashier','waiter'] },
  { to:'/tables', icon:FiLayers, label:'Tables', roles:['super_admin','manager','cashier','waiter'] },
  { to:'/pos', icon:FiShoppingCart, label:'POS Billing', roles:['super_admin','manager','cashier','waiter'] },
  { to:'/menu', icon:FiBookOpen, label:'Menu', roles:['super_admin','manager'] },
  { to:'/orders', icon:FiClipboard, label:'Orders', roles:['super_admin','manager','cashier','waiter'] },
  { to:'/kitchen', icon:FiCoffee, label:'Kitchen (KOT)', roles:['super_admin','manager','waiter'] },
  { to:'/billing', icon:FiPrinter, label:'Billing History', roles:['super_admin','manager','cashier'] },
  { to:'/reports', icon:FiBarChart2, label:'Reports', roles:['super_admin','manager'] },
  { to:'/users', icon:FiUsers, label:'Users', roles:['super_admin'] },
  { to:'/settings', icon:FiSettings, label:'Settings', roles:['super_admin','manager'] },
];

export default function Sidebar(){
  const { user, logout } = useAuth();
  const { sidebarOpen, closeSidebar } = useUI();
  const navigate = useNavigate();
  const handleLogout=async()=>{ await logout(); navigate('/login'); };
  const handleNavClick=()=>{ 
    // close drawer on mobile/tablet after nav
    if(window.innerWidth < 1024) closeSidebar();
  };

  return (
    <>
      <aside className={`sidebar ${sidebarOpen?'open':''}`}>
        <div className="sidebar-brand">
          <div className="logo">EG</div>
          <div style={{flex:1}}>
            <h1>Emerald Grandeur</h1>
            <p>Premium Hospitality</p>
          </div>
          <button className="sidebar-close-btn" onClick={closeSidebar} aria-label="Close menu">
            <FiX/>
          </button>
        </div>
        <div className="nav">
          {nav.filter(n=> !user || n.roles.includes(user.role)).map(item=>(
            <NavLink key={item.to} to={item.to} onClick={handleNavClick} className={({isActive})=> 'nav-item '+(isActive?'active':'')}>
              <item.icon className="icon"/>{item.label}
            </NavLink>
          ))}
          <div className="nav-section">Support</div>
          <NavLink to="/help-center" onClick={handleNavClick} className={({isActive})=> 'nav-item '+(isActive?'active':'')}>
            <FiHelpCircle className="icon"/> Help Center
          </NavLink>
        </div>
        <div className="sidebar-footer">
          <div className="user-chip">
            <div className="avatar">{user?.name?.charAt(0)||'A'}</div>
            <div style={{flex:1, minWidth:0}}>
              <div style={{fontWeight:700,fontSize:13, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}}>{user?.name||'Guest'}</div>
              <div style={{fontSize:11,opacity:0.8,textTransform:'capitalize'}}>{user?.role?.replace('_',' ')}</div>
            </div>
            <button onClick={handleLogout} title="Logout" style={{background:'rgba(255,255,255,0.12)',border:'none',color:'#fff',width:32,height:32,borderRadius:8,display:'grid',placeItems:'center',flexShrink:0}}><FiLogOut/></button>
          </div>
        </div>
      </aside>
      {/* Backdrop for mobile/tablet */}
      <div className={`sidebar-backdrop ${sidebarOpen?'visible':''}`} onClick={closeSidebar} aria-hidden={!sidebarOpen} />
    </>
  )
}
