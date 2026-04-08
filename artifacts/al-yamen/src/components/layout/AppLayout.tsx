import React, { useState } from "react";
import { useLocation } from "wouter";
import { useLogout, useGetMe } from "@workspace/api-client-react";
import { useLanguage, type Language } from "@/hooks/use-language";
import {
  LayoutDashboard, ShoppingCart, Truck, Package, Users,
  Wallet, BarChart2, ChevronDown, Menu, X, LogOut,
  Bell, Search, TrendingUp, CalendarCheck, Banknote,
  Building, Plus, UserCircle
} from "lucide-react";

interface NavItem {
  label: string;
  icon?: React.ReactNode;
  path?: string;
  children?: NavItem[];
}

function NavLink({ item, depth = 0, onClick }: { item: NavItem; depth?: number; onClick?: () => void }) {
  const [location, setLocation] = useLocation();
  const [open, setOpen] = useState(() => {
    if (item.children) return item.children.some(c => c.path && location.startsWith(c.path));
    return false;
  });
  const hasChildren = item.children && item.children.length > 0;
  const isActive = item.path ? location === item.path || location.startsWith(item.path + '/') : false;
  const anyChildActive = hasChildren && item.children!.some(c => c.path && location.startsWith(c.path));

  if (hasChildren) {
    return (
      <div>
        <button
          onClick={() => setOpen(!open)}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group
            ${anyChildActive ? 'text-white' : 'text-white/55 hover:text-white/90 hover:bg-white/5'}`}
        >
          {item.icon && (
            <span className={`flex-shrink-0 transition-colors ${anyChildActive ? 'text-cyan-400' : 'text-white/35 group-hover:text-white/60'}`}>
              {item.icon}
            </span>
          )}
          <span className="flex-1 text-left">{item.label}</span>
          <ChevronDown className={`h-3.5 w-3.5 text-white/25 transition-transform duration-200 ${open || anyChildActive ? 'rotate-180' : ''}`} />
        </button>
        {(open || anyChildActive) && (
          <div className="mt-0.5 space-y-0.5 ml-5 pl-3 border-l border-white/8">
            {item.children!.map((child) => (
              <NavLink key={child.label} item={child} depth={depth + 1} onClick={onClick} />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <button
      onClick={() => { if (item.path) { setLocation(item.path); onClick?.(); } }}
      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-200 group
        ${isActive
          ? 'bg-cyan-500/15 text-cyan-400 font-semibold border border-cyan-500/20'
          : 'text-white/55 hover:text-white/90 hover:bg-white/5 font-medium'}`}
    >
      {item.icon && (
        <span className={`flex-shrink-0 transition-colors ${isActive ? 'text-cyan-400' : 'text-white/30 group-hover:text-white/60'}`}>
          {item.icon}
        </span>
      )}
      <span>{item.label}</span>
      {isActive && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-cyan-400" />}
    </button>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const { t, language, setLanguage } = useLanguage();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const { data: me } = useGetMe({ query: { retry: false } });
  const logoutMutation = useLogout();

  const handleLogout = async () => {
    await logoutMutation.mutateAsync({});
    setLocation("/login");
  };

  React.useEffect(() => {
    if (!me && !window.location.pathname.includes('/login')) {
      setLocation('/login');
    }
  }, [me]);

  const navSections = [
    {
      title: "OPERATIONS",
      items: [
        {
          label: t('nav.sales'),
          icon: <ShoppingCart className="h-4 w-4" />,
          children: [
            { label: "New Order", icon: <Plus className="h-3.5 w-3.5" />, path: "/sales" },
            { label: t('nav.customers'), icon: <Users className="h-3.5 w-3.5" />, path: "/customers" },
          ]
        },
        {
          label: t('nav.purchases'),
          icon: <Truck className="h-4 w-4" />,
          children: [
            { label: "New Purchase", icon: <Plus className="h-3.5 w-3.5" />, path: "/purchases" },
            { label: t('nav.suppliers'), icon: <Building className="h-3.5 w-3.5" />, path: "/suppliers" },
          ]
        },
        {
          label: t('nav.accounting'),
          icon: <Wallet className="h-4 w-4" />,
          children: [
            { label: "All Transactions", icon: <BarChart2 className="h-3.5 w-3.5" />, path: "/accounting" },
          ]
        },
      ]
    },
    {
      title: "STOCK & INVENTORY",
      items: [
        { label: t('nav.products'), icon: <Package className="h-4 w-4" />, path: "/products" },
      ]
    },
    {
      title: "PEOPLE & CRM",
      items: [
        {
          label: t('nav.hr'),
          icon: <UserCircle className="h-4 w-4" />,
          children: [
            { label: t('nav.employees'), icon: <Users className="h-3.5 w-3.5" />, path: "/employees" },
            { label: t('nav.attendance'), icon: <CalendarCheck className="h-3.5 w-3.5" />, path: "/attendance" },
            { label: t('nav.payroll'), icon: <Banknote className="h-3.5 w-3.5" />, path: "/payroll" },
          ]
        },
      ]
    },
    {
      title: "FINANCE",
      items: [
        { label: t('nav.reports'), icon: <BarChart2 className="h-4 w-4" />, path: "/reports" },
      ]
    },
  ];

  const langs: { code: Language; label: string; flag: string }[] = [
    { code: 'en', label: 'English', flag: '🇬🇧' },
    { code: 'bn', label: 'বাংলা', flag: '🇧🇩' },
    { code: 'ar', label: 'العربية', flag: '🇸🇦' },
  ];
  const currentLang = langs.find(l => l.code === language) || langs[0];

  const pageTitle = (() => {
    if (location.startsWith('/dashboard')) return t('nav.dashboard');
    if (location.startsWith('/customers')) return t('nav.customers');
    if (location.startsWith('/sales')) return t('nav.sales');
    if (location.startsWith('/purchases')) return t('nav.purchases');
    if (location.startsWith('/products')) return t('nav.products');
    if (location.startsWith('/suppliers')) return t('nav.suppliers');
    if (location.startsWith('/accounting')) return t('nav.accounting');
    if (location.startsWith('/employees')) return t('nav.employees');
    if (location.startsWith('/attendance')) return t('nav.attendance');
    if (location.startsWith('/payroll')) return t('nav.payroll');
    if (location.startsWith('/reports')) return t('nav.reports');
    return 'Al-Yamen';
  })();

  const SidebarContent = ({ mobile = false }) => (
    <div className="h-full flex flex-col" style={{ background: 'hsl(220 20% 8%)' }}>
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
        <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center flex-shrink-0 shadow-lg shadow-cyan-500/20">
          <TrendingUp className="h-5 w-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-white text-sm leading-tight">Al-Yamen</div>
          <div className="text-[10px] text-cyan-400 font-medium tracking-wide truncate">Business Management S...</div>
        </div>
        {mobile && (
          <button onClick={() => setSidebarOpen(false)} className="text-white/40 hover:text-white ml-1">
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Dashboard link */}
      <div className="px-3 pt-3 pb-1">
        <button
          onClick={() => { setLocation('/dashboard'); setSidebarOpen(false); }}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200
            ${location.startsWith('/dashboard')
              ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/20 shadow-sm shadow-cyan-500/10'
              : 'text-white/60 hover:text-white/90 hover:bg-white/5'}`}
        >
          <LayoutDashboard className={`h-4 w-4 flex-shrink-0 ${location.startsWith('/dashboard') ? 'text-cyan-400' : 'text-white/35'}`} />
          {t('nav.dashboard')}
          {location.startsWith('/dashboard') && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-cyan-400" />}
        </button>
      </div>

      {/* Nav sections */}
      <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-3">
        {navSections.map((section) => (
          <div key={section.title}>
            <div className="px-2 mb-1.5 text-[9px] font-bold tracking-[0.15em] uppercase" style={{ color: 'rgba(255,255,255,0.2)' }}>
              {section.title}
            </div>
            <div className="space-y-0.5">
              {section.items.map((item) => (
                <NavLink key={item.label} item={item} onClick={() => setSidebarOpen(false)} />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* User info */}
      <div className="border-t px-3 py-3" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
        <div className="flex items-center gap-2.5 px-2 py-2 rounded-xl hover:bg-white/5 cursor-pointer transition-colors">
          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center flex-shrink-0 text-white font-bold text-sm shadow-md">
            {me?.name?.[0]?.toUpperCase() || 'A'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-white truncate">{me?.name || 'Admin'}</div>
            <div className="text-[10px] capitalize" style={{ color: 'rgba(255,255,255,0.35)' }}>
              {me?.role || 'Head Office'}
            </div>
          </div>
          <button onClick={handleLogout} className="text-white/25 hover:text-red-400 transition-colors p-1" title={t('nav.logout')}>
            <LogOut className="h-3.5 w-3.5" />
          </button>
        </div>
        <div className="flex items-center gap-2 px-2 mt-1.5">
          <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[10px] font-medium text-emerald-400">System Online</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'hsl(220 20% 7%)' }}>
      {/* Desktop sidebar */}
      <div className="hidden lg:flex w-64 flex-shrink-0">
        <SidebarContent />
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <div className="absolute left-0 top-0 h-full w-72">
            <SidebarContent mobile />
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="flex-shrink-0 h-14 flex items-center gap-3 px-4 border-b" style={{ background: 'hsl(220 20% 8%)', borderColor: 'rgba(255,255,255,0.07)' }}>
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/5 transition-colors"
          >
            <Menu className="h-5 w-5" />
          </button>

          <span className="font-semibold text-white/90 text-sm hidden sm:block">{pageTitle}</span>

          <div className="flex-1" />

          {/* Search */}
          <button className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.35)' }}>
            <Search className="h-3.5 w-3.5" />
            <span className="text-xs">Search...</span>
            <kbd className="ml-2 px-1.5 py-0.5 text-[9px] rounded" style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.3)' }}>⌘K</kbd>
          </button>

          {/* Language */}
          <div className="relative">
            <button
              onClick={() => setLangMenuOpen(!langMenuOpen)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm transition-colors"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)' }}
            >
              <span className="text-base leading-none">{currentLang.flag}</span>
              <ChevronDown className="h-3 w-3" style={{ color: 'rgba(255,255,255,0.25)' }} />
            </button>
            {langMenuOpen && (
              <div className="absolute right-0 top-full mt-1 w-36 rounded-xl shadow-2xl z-50 overflow-hidden" style={{ background: 'hsl(220 18% 12%)', border: '1px solid rgba(255,255,255,0.1)' }}>
                {langs.map((l) => (
                  <button
                    key={l.code}
                    onClick={() => { setLanguage(l.code); setLangMenuOpen(false); }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-sm transition-colors
                      ${language === l.code ? 'text-cyan-400' : 'hover:bg-white/5'}`}
                    style={{ color: language === l.code ? undefined : 'rgba(255,255,255,0.65)' }}
                  >
                    <span>{l.flag}</span>
                    <span className="font-medium">{l.label}</span>
                    {language === l.code && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-cyan-400" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Notifications */}
          <button className="relative p-2 rounded-lg transition-colors hover:bg-white/5" style={{ color: 'rgba(255,255,255,0.4)' }}>
            <Bell className="h-4 w-4" />
            <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-cyan-400" />
          </button>

          {/* Avatar */}
          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0 cursor-pointer shadow-md">
            {me?.name?.[0]?.toUpperCase() || 'A'}
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 sm:p-6">
            {children}
          </div>
        </main>
      </div>

      {langMenuOpen && <div className="fixed inset-0 z-40" onClick={() => setLangMenuOpen(false)} />}
    </div>
  );
}
