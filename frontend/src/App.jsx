import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import { UIProvider } from './context/UIContext.jsx';
import Sidebar from './components/layout/Sidebar.jsx';
import { Protected } from './components/common/Protect.jsx';
import Login from './pages/Auth/Login.jsx';
import Dashboard from './pages/Dashboard/Dashboard.jsx';
import Tables from './pages/Tables/Tables.jsx';
import POS from './pages/POS/POS.jsx';
import Menu from './pages/Menu/Menu.jsx';
import Orders from './pages/Orders/Orders.jsx';
import Kitchen from './pages/Kitchen/Kitchen.jsx';
import Billing from './pages/Billing/Billing.jsx';
import Reports from './pages/Reports/Reports.jsx';
import Users from './pages/Users/Users.jsx';
import Settings from './pages/Settings/Settings.jsx';
import HelpCenter from './pages/HelpCenter/HelpCenter.jsx';

function Layout({ children }){
  return (
    <div className="app-shell">
      <Sidebar/>
      <div className="main">{children}</div>
    </div>
  )
}

export default function App(){
  return (
    <AuthProvider>
      <UIProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login/>}/>
            <Route path="/" element={<Protected><Layout><Dashboard/></Layout></Protected>}/>
            <Route path="/tables" element={<Protected><Layout><Tables/></Layout></Protected>}/>
            <Route path="/pos" element={<Protected><Layout><POS/></Layout></Protected>}/>
            <Route path="/menu" element={<Protected><Layout><Menu/></Layout></Protected>}/>
            <Route path="/orders" element={<Protected><Layout><Orders/></Layout></Protected>}/>
            <Route path="/kitchen" element={<Protected><Layout><Kitchen/></Layout></Protected>}/>
            <Route path="/billing" element={<Protected><Layout><Billing/></Layout></Protected>}/>
            <Route path="/reports" element={<Protected><Layout><Reports/></Layout></Protected>}/>
            <Route path="/users" element={<Protected><Layout><Users/></Layout></Protected>}/>
            <Route path="/settings" element={<Protected><Layout><Settings/></Layout></Protected>}/>
            <Route path="/help-center" element={<Protected><Layout><HelpCenter/></Layout></Protected>}/>
            <Route path="*" element={<Navigate to="/" replace/>}/>
          </Routes>
        </BrowserRouter>
      </UIProvider>
    </AuthProvider>
  )
}
