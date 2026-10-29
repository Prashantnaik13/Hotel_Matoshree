import { useState, useMemo } from 'react';
import { FiSearch, FiArrowLeft, FiBookOpen, FiGrid, FiLayers, FiShoppingCart, FiPrinter, FiCoffee, FiBarChart2, FiUsers, FiSettings, FiAlertTriangle, FiChevronDown, FiChevronUp, FiMail, FiPhone } from 'react-icons/fi';
import Topbar from '../../components/layout/Topbar.jsx';

const helpData = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    icon: FiBookOpen,
    color: '#0d47a1',
    articles: [
      { id:'login', title:'How to log in', description:'Sign in with your role-based account', content:`1. Open http://localhost:5173\n2. Enter email/username and password (e.g., admin@emerald.com / admin123)\n3. Click Sign In — you'll be redirected based on role (Admin→Dashboard, Waiter→POS)\n4. JWT is stored securely; logout clears session.\nRoles: Super Admin, Manager, Cashier, Waiter each have different permissions enforced on both frontend and backend.` },
      { id:'nav', title:'How to navigate the dashboard', description:'Understand the sidebar and topbar', content:`Use the sidebar (left) to switch between Dashboard, Tables, POS, Menu, Orders, Kitchen, Billing, Reports, Users, Settings, Help Center. On mobile, tap hamburger menu. Topbar search finds tables, menu items, orders, bills. Bell icon shows notifications (new orders, KOT, payments) polled every 15s.` },
      { id:'roles', title:'Understanding user roles', description:'What each role can do', content:`Super Admin: full access, create users, restaurant settings, taxes. Manager: manage tables, view reports, handle discounts. Cashier: POS, billing, payments, reprint. Waiter: view tables, create orders, send to kitchen, request bill. Backend enforces permissions; hiding buttons isn't enough.` },
    ]
  },
  {
    id:'dashboard',
    title:'Dashboard',
    icon: FiGrid,
    color:'#1b5e20',
    articles:[
      { id:'dash-stats', title:'Reading dashboard statistics', description:'Today sales, active orders, tables', content:`Dashboard shows Today's sales, completed bills, active orders, available/occupied/reserved/cleaning tables, pending payments, avg bill. Data comes live from MySQL via /api/dashboard/summary. Use filters for range.` },
      { id:'dash-charts', title:'Sales charts and breakdowns', description:'Hourly/daily/monthly trends', content:`Select Daily/Monthly/Hourly to see sales trend. Payment breakdown shows cash/UPI/card totals. Top-selling items ranked by quantity. Recent orders list last 10 orders with totals.` },
    ]
  },
  {
    id:'tables',
    title:'Table Management',
    icon: FiLayers,
    color:'#e65100',
    articles:[
      { id:'tables-view', title:'View tables and statuses', description:'Grid with color-coded statuses', content:`Tables show number, capacity, section, floor, status: Available (green), Occupied (orange), Reserved (blue), Billing (pink), Cleaning (purple), Out of Service (grey). Each active table displays order number and bill subtotal.` },
      { id:'tables-add', title:'Create and manage tables', description:'Add, edit, change status', content:`Manager/Super Admin can Add Table: set table number, capacity, floor, section. Use status dropdown to mark Reserved, Cleaning, Out of Service. Floor filter and search by table number available. Prevents duplicate active orders per table via DB transaction.` },
      { id:'tables-status', title:'Interpreting table statuses', description:'What each status means', content:`Available: ready for guests. Occupied: active order in progress. Reserved: booked. Billing: bill generated, awaiting payment. Cleaning: needs cleanup after payment. Out of Service: not usable.` },
    ]
  },
  {
    id:'pos',
    title:'POS and Order Management',
    icon: FiShoppingCart,
    color:'#4a148c',
    articles:[
      { id:'pos-select', title:'Select a table and add menu items', description:'3-panel POS workflow', content:`1. Left: select table (shows status, free count). 2. Center: choose category, search dish (independent from table search), click menu card (price from DB). 3. Right: view cart or active order, adjust qty, add notes. For new table, items go to cart → Save Order creates DB order with table isolation. For occupied table, items add directly to active order.` },
      { id:'pos-kitchen', title:'Send orders to the kitchen', description:'Create KOT tickets', content:`In POS right panel, after adding items, click "Send to Kitchen (KOT)". Backend creates KOT with only new items (pending → sent), incremental tickets for later additions. Kitchen Display shows live tickets.` },
      { id:'pos-search', title:'Using POS search correctly', description:'Independent table and dish search', content:`Table search (left) filters only tables by number/section/status. Dish search (center) filters only menu by name/description/category. Both work simultaneously, case-insensitive, with separate empty states.` },
    ]
  },
  {
    id:'billing',
    title:'Billing and Payments',
    icon: FiPrinter,
    color:'#00695c',
    articles:[
      { id:'billing-gen', title:'Generate a bill', description:'From POS active order', content:`In POS, click "Generate Bill" → confirm modal → select payment method (cash/UPI/card/other) → Finalize. Backend recalculates subtotal, CGST/SGST (split 5% equally), service charge if enabled, round-off, grand total via paise-safe integer math. Bill number auto-increments (prefix EG-001001). Table moves to Billing status.` },
      { id:'billing-pay', title:'Accept cash and UPI payments', description:'Partial and split payments', content:`In Billing history → View bill → Add Payment: choose method, enter amount, idempotencyKey prevents duplicates. Status becomes partial until sum ≥ grandTotal, then paid → table goes to Cleaning. Multiple methods supported, e.g., ₹500 UPI + ₹277 cash.` },
      { id:'billing-history', title:'View billing history', description:'Search and reprint', content:`Billing page lists bill number, order, table, date, total, method, status. Search by bill number. View shows A4 invoice details with reprint flag. Reprint logs audit and increments reprintCount, never creates new bill number. Historical prices preserved via snapshots.` },
      { id:'billing-reprint', title:'Reprint a finalized bill', description:'Preserve original data', content:`Click Reprint in list or view modal → Reprint logged. Printed copy shows REPRINT badge. Never edits finalized bill; price changes don't affect past bills.` },
    ]
  },
  {
    id:'printing',
    title:'Printing Bills',
    icon: FiPrinter,
    color:'#bf360c',
    articles:[
      { id:'print-a4', title:'Print an A4 invoice', description:'Professional branded invoice', content:`In Billing View → Print A4 → Browser print dialog opens A4 portrait (210mm) with margins. Only invoice prints: header controls hidden, sidebar/navbar/backdrop hidden. Contains restaurant name/logo, GSTIN, bill/order/table/cashier, item table, CGST/SGST, round-off, grand total, payment info, thank-you footer. Multi-page orders flow without clipping.` },
      { id:'print-thermal', title:'Print an 80mm thermal receipt', description:'Compact receipt for printers', content:`In Billing View → Print Receipt (80mm) or in POS after finalize → Print Receipt → Uses 80mm width (supports 58mm via settings). Monospace, compact, prices aligned right, long names wrap. Only receipt prints, no buttons. Configure receipt width in Settings → Billing → receiptWidth.` },
      { id:'print-troubleshoot', title:'Resolve common printing problems', description:'Dialog, margins, overflow', content:`If buttons appear: ensure print CSS loaded (no-print class). If clipped: check paper size (A4 vs 80mm) matches button clicked. If blank pages: ensure print area is visible, margins set to Default. Use Save as PDF to test without printer. USB/Network printers must be default OS printer.` },
    ]
  },
  {
    id:'kitchen',
    title:'Kitchen Display (KOT)',
    icon: FiCoffee,
    color:'#795548',
    articles:[
      { id:'kot-view', title:'Use the Kitchen Display', description:'Live ticket cards', content:`Kitchen page shows tickets in grid: KOT number, order number, table (e.g., T01 or Takeaway), time, status (pending=orange, preparing=blue, ready=green). Auto-refresh every 5s. Each ticket lists items as "qty × Name" with notes, never "Item #10" — names come from orderItem.nameSnapshot via eager-loaded association.` },
      { id:'kot-status', title:'Update KOT status', description:'Preparing → Ready → Served', content:`Click Preparing, Ready, Served buttons on ticket card. Status updates via PATCH /api/kitchen/tickets/:id/status. When ready, waiter/cashier notified.` },
      { id:'kot-incremental', title:'Handle additional items', description:'Incremental tickets', content:`If waiter adds items to active order after first KOT, clicking "Send to Kitchen" creates new KOT with only pending items, not duplicating previous. History preserved.` },
    ]
  },
  {
    id:'reports',
    title:'Reports and Analytics',
    icon: FiBarChart2,
    color:'#0d47a1',
    articles:[
      { id:'reports-daily', title:'Access daily sales reports', description:'Totals, tax, discount', content:`Reports page → Daily Summary shows bills count, total sales, tax, discount from /api/reports/daily-sales. Filter by date range. Table-wise and item-wise tables show breakdowns.` },
      { id:'reports-payment', title:'View payment method reports', description:'Cash/UPI/card totals', content:`Payment Methods card aggregates bills by paymentMethod. Use for reconciliation. Category-wise reports available via same endpoint.` },
      { id:'reports-export', title:'Interpret peak hours and best sellers', description:'Insights', content:`Reports show best-selling items by qty, peak hours heuristic. Export CSV via button for Excel.` },
    ]
  },
  {
    id:'users',
    title:'User Accounts and Permissions',
    icon: FiUsers,
    color:'#37474f',
    articles:[
      { id:'users-manage', title:'Manage user accounts', description:'Create and role-assign', content:`Super Admin → Users: list name/email/username/role/status. Add User: set name, email, username, password, role. Backend hashes with bcrypt, JWT auth. Users table linked to restaurantId.` },
      { id:'users-perms', title:'Understand permissions', description:'Who can do what', content:`Permissions enforced via authorize middleware: Super Admin (all), Manager (tables/menu/orders/reports/settings), Cashier (POS/billing), Waiter (tables/orders/KOT). Frontend hides menu items but backend still checks.` },
    ]
  },
  {
    id:'settings',
    title:'Restaurant Settings',
    icon: FiSettings,
    color:'#004d40',
    articles:[
      { id:'settings-profile', title:'Configure restaurant profile', description:'Name, address, GSTIN', content:`Settings → Restaurant Profile: name, address, phone, email, GSTIN, logo, currency, footer message. Saved via PUT /api/settings. Displayed on bills.` },
      { id:'settings-billing', title:'Adjust billing settings', description:'Tax, service, receipt, round-off', content:`Billing Settings: receiptWidth (58mm/80mm/A4), taxRate, taxInclusive, GST enabled, serviceCharge, discount, billPrefix (EG), roundOff toggle. Changes affect future bills only, not historical.` },
      { id:'settings-floors', title:'Manage floors and sections', description:'Organize tables', content:`Floors: Ground, First, Rooftop etc. Assign tables to floors/sections for filtering in POS and Tables view.` },
    ]
  },
  {
    id:'troubleshooting',
    title:'Troubleshooting',
    icon: FiAlertTriangle,
    color:'#b71c1c',
    articles:[
      { id:'trouble-login', title:'Login fails', description:'Invalid credentials or inactive', content:`Check email/username case, password (admin123 default). Ensure account isActive true in DB. JWT expiry 8h, re-login if expired. Clear localStorage token if corrupted.` },
      { id:'trouble-order', title:'Cannot create order for table', description:'Table already has active order', content:`Error 409 means table's activeOrderId points to non-completed order. Complete/cancel existing order first, or transfer to available table.` },
      { id:'trouble-bill', title:'Bill already exists error', description:'Duplicate finalization', content:`Each order can have one bill (unique orderId in bills). Reprinting does not create new bill; use Reprint button.` },
      { id:'trouble-print', title:'Print shows sidebar', description:'CSS not applied', content:`Ensure print CSS loaded, body has print-a4-mode or print-thermal-mode class during print. Check @media print rules hide .sidebar, .topbar, .no-print.` },
      { id:'trouble-sidebar', title:'Sidebar not visible', description:'Mobile drawer', content:`On <1024px, sidebar is off-canvas. Tap hamburger in topbar to open. Backdrop click, close X, or Escape closes. If still hidden, check z-index and transform translateX.` },
    ]
  },
];

export default function HelpCenter(){
  const [query,setQuery]=useState('');
  const [selectedCat,setSelectedCat]=useState(null);
  const [selectedArticle,setSelectedArticle]=useState(null);
  const [expandedFaq,setExpandedFaq]=useState({});

  const filteredCats = useMemo(()=>{
    const q=query.trim().toLowerCase();
    if(!q) return helpData;
    // filter categories where title/description contains q, and filter articles within
    return helpData.map(cat=>{
      const matchingArticles = cat.articles.filter(a=> a.title.toLowerCase().includes(q) || a.description.toLowerCase().includes(q) || a.content.toLowerCase().includes(q));
      if(cat.title.toLowerCase().includes(q) || matchingArticles.length>0){
        return {...cat, articles: cat.title.toLowerCase().includes(q) ? cat.articles : matchingArticles };
      }
      return null;
    }).filter(Boolean);
  },[query]);

  const openArticle=(cat, article)=>{
    setSelectedCat(cat);
    setSelectedArticle(article);
    window.scrollTo({top:0, behavior:'smooth'});
  };

  const backToList=()=>{
    setSelectedArticle(null);
    // keep category selected to show articles, or clear to show all
  };

  return (
    <>
      <Topbar title="Help Center" subtitle="Guidance for using the Emerald Grandeur POS system"/>
      <div className="content help-center">
        {!selectedArticle ? (
          <>
            <div className="help-hero">
              <div>
                <h1>How can we help you?</h1>
                <p>Find answers for POS, billing, printing, KOT, reports, and settings.</p>
              </div>
              <div className="help-search-box">
                <FiSearch className="help-search-icon"/>
                <input className="input" placeholder="Search help articles..." value={query} onChange={e=>setQuery(e.target.value)} />
              </div>
            </div>

            {filteredCats.length===0 ? (
              <div className="help-empty">
                <FiSearch size={32} color="var(--muted)"/>
                <h3>No results for “{query}”</h3>
                <p>Try different keywords or browse categories below.</p>
              </div>
            ) : (
              <div className="help-grid">
                {filteredCats.map(cat=>{
                  const Icon=cat.icon;
                  return (
                    <div key={cat.id} className="help-category-card">
                      <div className="help-category-header">
                        <div className="help-category-icon" style={{background:cat.color}}><Icon/></div>
                        <div>
                          <h3>{cat.title}</h3>
                          <span>{cat.articles.length} articles</span>
                        </div>
                      </div>
                      <div className="help-article-list">
                        {cat.articles.map(a=>(
                          <button key={a.id} className="help-article-item" onClick={()=>openArticle(cat,a)}>
                            <div>
                              <div className="help-article-title">{a.title}</div>
                              <div className="help-article-desc">{a.description}</div>
                            </div>
                            <span className="help-article-arrow">→</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            <div className="help-support-card">
              <h3>Need more help?</h3>
              <p>Contact your restaurant administrator to configure support details. If your support email/phone is set in Restaurant Settings, it will appear here.</p>
              <div className="help-support-contacts">
                <span><FiMail/> support@emeraldgrandeur.example (configure in Settings)</span>
                <span><FiPhone/> +91 00000 00000 (configure in Settings)</span>
              </div>
            </div>
          </>
        ) : (
          <div className="help-article-page">
            <button className="btn btn-ghost" onClick={backToList}><FiArrowLeft/> Back to Help Center</button>
            <div className="help-breadcrumbs">
              <span onClick={backToList}>Help Center</span> › <span>{selectedCat.title}</span> › <span>{selectedArticle.title}</span>
            </div>
            <div className="help-article-content">
              <div className="help-article-category-badge" style={{background: selectedCat.color}}>
                <selectedCat.icon/> {selectedCat.title}
              </div>
              <h1>{selectedArticle.title}</h1>
              <p className="help-article-subtitle">{selectedArticle.description}</p>
              <div className="help-article-body">
                {selectedArticle.content.split('\n').map((line,i)=> <p key={i}>{line}</p>)}
              </div>

              {/* FAQ expandable for troubleshooting */}
              {selectedCat.id==='troubleshooting' && (
                <div className="help-faq">
                  <h3>Frequently Asked</h3>
                  {[
                    {q:'What if my table is stuck in Billing status?', a:'Complete payment via Billing → View → Add Payment. If paid but still Billing, refresh or contact manager to manually set to Cleaning.'},
                    {q:'How to enable service charge?', a:'Settings → Billing Settings → Enable Service Charge → set % → Save. Affects future bills.'},
                  ].map((faq,idx)=>(
                    <div key={idx} className="help-faq-item">
                      <button onClick={()=>setExpandedFaq(p=> ({...p, [idx]:!p[idx]}))} className="help-faq-question">
                        {faq.q} {expandedFaq[idx]?<FiChevronUp/>:<FiChevronDown/>}
                      </button>
                      {expandedFaq[idx] && <div className="help-faq-answer">{faq.a}</div>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  )
}
