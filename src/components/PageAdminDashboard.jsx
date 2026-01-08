import React from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faShieldHalved, faParachuteBox, faGift, faArrowLeft, faStore, 
    faUsers, faChartLine, faCrown, faCoins, faServer, faNetworkWired
} from '@fortawesome/free-solid-svg-icons';

// --- REUSABLE COMPONENTS (CLEAN CODE) ---

const DashboardCard = ({ to, icon, title, description, colorClass, stat, colSpan = "col-span-1" }) => (
  <Link 
    to={to} 
    className={`group relative overflow-hidden bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 ${colSpan}`}
  >
    <div className={`absolute top-0 right-0 p-20 rounded-full blur-3xl opacity-10 group-hover:opacity-20 transition-opacity ${colorClass.replace('text-', 'bg-')}`}></div>
    
    <div className="relative z-10 flex flex-col h-full justify-between">
      <div>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${colorClass} bg-opacity-10 dark:bg-opacity-20`}>
          <FontAwesomeIcon icon={icon} className="text-2xl" />
        </div>
        <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-2 group-hover:text-primary transition-colors">
            {title}
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {description}
        </p>
      </div>
      
      {stat && (
        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Quick Stat</span>
            <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{stat}</span>
        </div>
      )}
    </div>
  </Link>
);

const SystemStatus = ({ label, status, color }) => (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-full border border-slate-200 dark:border-slate-700">
        <div className={`w-2 h-2 rounded-full ${color} animate-pulse`}></div>
        <span className="text-xs font-mono font-bold text-slate-600 dark:text-slate-300">{label}: {status}</span>
    </div>
);

// --- MAIN PAGE COMPONENT ---

export default function PageAdminDashboard() {
  return (
    <section className="page-content min-h-screen py-8 max-w-7xl mx-auto px-4">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
          <div>
            <Link to="/" className="text-sm text-slate-500 hover:text-primary mb-2 inline-flex items-center transition-colors">
                <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />
                Back to Home
            </Link>
            <h1 className="text-3xl md:text-4xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
                <FontAwesomeIcon icon={faShieldHalved} className="text-primary"/> 
                Admin Command Center
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">Manage ecosystem, users, and financial flows.</p>
          </div>
          
          <div className="flex gap-3">
              <SystemStatus label="NETWORK" status="BASE SEPOLIA" color="bg-blue-500" />
              <SystemStatus label="SYSTEM" status="ONLINE" color="bg-green-500" />
          </div>
      </div>

      {/* Main Grid Layout (Bento Grid) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* 1. Subscription Management (NEW - High Impact based on Contract) */}
        <DashboardCard 
            to="/admin/subscription"
            icon={faCrown}
            title="Subscription Manager"
            description="Set tier prices, withdraw treasury funds, and monitor premium users."
            colorClass="text-yellow-500 bg-yellow-500"
            stat="Treasury: 0.05 ETH"
        />

        {/* 2. User & Identity Management */}
        <DashboardCard 
            to="/admin/users"
            icon={faUsers}
            title="Identity Registry"
            description="Monitor minted identities, ban abusive users, and track reputation scores."
            colorClass="text-blue-500 bg-blue-500"
            stat="1,240 Identities"
        />

        {/* 3. Airdrops */}
        <DashboardCard 
            to="/airdrops/postairdrops"
            icon={faParachuteBox}
            title="Airdrop Operations"
            description="Create new campaigns, validate submissions, and distribute rewards."
            colorClass="text-purple-500 bg-purple-500"
            stat="5 Pending Review"
        />

        {/* 4. Events */}
        <DashboardCard 
            to="/admin/events"
            icon={faGift}
            title="Event & Giveaways"
            description="Manage community events, winners, and special reward distributions."
            colorClass="text-pink-500 bg-pink-500"
        />

        {/* 5. Warung Kripto (Expanded) */}
        <DashboardCard 
            to="/admin-warung"
            icon={faStore}
            title="Warung Kripto (P2P)"
            description="Manage P2P orders, set exchange rates, and handle dispute resolution."
            colorClass="text-green-500 bg-green-500"
            colSpan="md:col-span-2 lg:col-span-2"
            stat="3 Active Orders"
        />
        
        {/* 6. Analytics (Placeholder for future) */}
        <div className="group relative overflow-hidden bg-slate-100 dark:bg-slate-800/50 rounded-2xl p-6 border border-dashed border-slate-300 dark:border-slate-700 flex flex-col items-center justify-center text-center opacity-70 hover:opacity-100 transition-opacity">
            <FontAwesomeIcon icon={faChartLine} className="text-3xl text-slate-400 mb-2" />
            <h3 className="font-bold text-slate-500 dark:text-slate-400">Global Analytics</h3>
            <p className="text-xs text-slate-400">Coming Soon</p>
        </div>

      </div>
    </section>
  );
}
