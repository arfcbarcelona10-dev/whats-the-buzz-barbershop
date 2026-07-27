"use client";

import {
  ArrowLeft,
  Ban,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  Coffee,
  LayoutDashboard,
  ListFilter,
  LoaderCircle,
  LockKeyhole,
  LogOut,
  Mail,
  Menu,
  Phone,
  Plus,
  Save,
  Scissors,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  UserRound,
  UsersRound,
  X,
} from "lucide-react";
import Link from "next/link";
import { FormEvent, ReactNode, useEffect, useMemo, useState } from "react";

type Appointment = {
  id: string;
  customerName: string;
  phone: string;
  email: string;
  notes: string;
  serviceId: string;
  serviceName: string;
  date: string;
  startTime: string;
  endTime: string;
  duration: number;
  price: number;
  status: string;
  source: string;
  createdAt: string;
};

type Service = {
  id: string;
  name: string;
  category: string;
  description: string;
  duration: number;
  price: number;
  active: boolean;
  sortOrder: number;
};

type ScheduleBlock = {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  label: string;
  allDay: boolean;
};

type DashboardData = {
  appointments: Appointment[];
  services: Service[];
  blocks: ScheduleBlock[];
  settings: Record<string, string>;
};

type ViewName = "schedule" | "calendar" | "customers" | "services" | "availability" | "settings";

const demoEmail = "owner@whatsthebuzz.com";
const statusLabels: Record<string, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  completed: "Completed",
  cancelled: "Cancelled",
  no_show: "No-show",
};

const navigation: { id: ViewName; label: string; icon: typeof LayoutDashboard }[] = [
  { id: "schedule", label: "Today", icon: LayoutDashboard },
  { id: "calendar", label: "Calendar", icon: CalendarDays },
  { id: "customers", label: "Customers", icon: UsersRound },
  { id: "services", label: "Services", icon: Scissors },
  { id: "availability", label: "Availability", icon: Clock3 },
  { id: "settings", label: "Settings", icon: Settings },
];

function shopDate(offset = 0) {
  const date = new Date(Date.now() + offset * 86_400_000);
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Chicago",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function dateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function formatDate(value: string, options: Intl.DateTimeFormatOptions = { weekday: "long", month: "long", day: "numeric" }) {
  return new Intl.DateTimeFormat("en-US", options).format(new Date(`${value}T12:00:00`));
}

function formatTime(value: string) {
  const [hour, minute] = value.split(":").map(Number);
  return new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" }).format(new Date(2026, 0, 1, hour, minute));
}

function initials(name: string) {
  return name.split(" ").slice(0, 2).map((part) => part[0]).join("").toUpperCase();
}

function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <span className={`owner-brand${compact ? " is-compact" : ""}`}>
      <span className="owner-brand-mark" aria-hidden="true"><Sparkles size={24} /><Scissors size={13} /></span>
      {!compact && <span><strong>What&apos;s The Buzz?</strong><small>Barber Shop · Schofield</small></span>}
    </span>
  );
}

export function OwnerApp() {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [data, setData] = useState<DashboardData | null>(null);
  const [view, setView] = useState<ViewName>("schedule");
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [walkInOpen, setWalkInOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  useEffect(() => {
    fetch("/api/owner/session")
      .then((response) => response.json())
      .then((session) => {
        setAuthenticated(Boolean(session.authenticated));
        if (session.authenticated) {
          return fetch("/api/owner")
            .then((response) => response.json().then((body) => ({ response, body })))
            .then(({ response, body }) => {
              if (!response.ok) throw new Error(body.error);
              setData(body);
            });
        }
      })
      .catch(() => setAuthenticated(false));
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(""), 3500);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  async function loadDashboard() {
    const response = await fetch("/api/owner");
    const body = await response.json();
    if (!response.ok) throw new Error(body.error);
    setData(body);
  }

  async function signIn(email: string, password: string) {
    setSaving(true);
    setError("");
    try {
      const response = await fetch("/api/owner/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error);
      setAuthenticated(true);
      await loadDashboard();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Sign-in failed.");
    } finally {
      setSaving(false);
    }
  }

  async function signOut() {
    await fetch("/api/owner/session", { method: "DELETE" });
    setData(null);
    setAuthenticated(false);
  }

  async function perform(action: Record<string, unknown>, successMessage: string) {
    setSaving(true);
    setError("");
    try {
      const response = await fetch("/api/owner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(action),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error);
      setData(body);
      setSelectedAppointment((current) => current ? body.appointments.find((item: Appointment) => item.id === current.id) ?? null : null);
      setToast(successMessage);
      return true;
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The change could not be saved.");
      return false;
    } finally {
      setSaving(false);
    }
  }

  if (authenticated === null) {
    return <main className="owner-loading" role="status"><LoaderCircle className="spin" size={28} /><p>Opening the studio...</p></main>;
  }

  if (!authenticated) {
    return <OwnerLogin onSubmit={signIn} saving={saving} error={error} />;
  }

  if (!data) {
    return <main className="owner-loading" role="status"><LoaderCircle className="spin" size={28} /><p>Loading the day...</p></main>;
  }

  const currentTitle = navigation.find((item) => item.id === view)?.label ?? "Today";

  return (
    <div className="owner-shell">
      <aside className={`owner-sidebar${mobileNavOpen ? " is-open" : ""}`}>
        <div className="owner-sidebar-brand"><Link href="/" aria-label="Return to What's The Buzz? homepage"><Brand /></Link><button aria-label="Close navigation" onClick={() => setMobileNavOpen(false)}><X size={20} /></button></div>
        <div className="owner-shop-status"><span><i /> Shop open</span><small>Walk-ins welcome</small></div>
        <nav aria-label="Owner dashboard">
          {navigation.map((item) => {
            const Icon = item.icon;
            return <button className={view === item.id ? "is-active" : ""} onClick={() => { setView(item.id); setMobileNavOpen(false); }} key={item.id}><Icon size={19} />{item.label}</button>;
          })}
        </nav>
        <div className="owner-sidebar-bottom">
          <Link href="/"><ArrowLeft size={18} /> View website</Link>
          <button onClick={signOut}><LogOut size={18} /> Sign out</button>
        </div>
      </aside>

      <div className="owner-app">
        <header className="owner-topbar">
          <button className="owner-menu" onClick={() => setMobileNavOpen(true)} aria-label="Open navigation"><Menu size={22} /></button>
          <div><p>Owner studio</p><h1>{currentTitle}</h1></div>
          <div className="owner-topbar-actions">
            <label className="owner-search"><Search size={17} /><input type="search" placeholder="Search bookings" aria-label="Search bookings" /></label>
            <button className="owner-add-button" onClick={() => setWalkInOpen(true)}><Plus size={18} /> Add walk-in</button>
            <span className="owner-avatar" title={demoEmail}>MB</span>
          </div>
        </header>

        <main className="owner-main">
          {view === "schedule" && <ScheduleView data={data} onSelect={setSelectedAppointment} onAdd={() => setWalkInOpen(true)} />}
          {view === "calendar" && <CalendarView data={data} onSelect={setSelectedAppointment} />}
          {view === "customers" && <CustomersView appointments={data.appointments} onSelect={setSelectedAppointment} />}
          {view === "services" && <ServicesView services={data.services} saving={saving} perform={perform} />}
          {view === "availability" && <AvailabilityView blocks={data.blocks} saving={saving} perform={perform} />}
          {view === "settings" && <SettingsView settings={data.settings} saving={saving} perform={perform} />}
          {error && <p className="owner-error" role="alert">{error}</p>}
        </main>
      </div>

      {selectedAppointment && <AppointmentDrawer appointment={selectedAppointment} saving={saving} onClose={() => setSelectedAppointment(null)} perform={perform} />}
      {walkInOpen && <WalkInModal services={data.services.filter((service) => service.active)} saving={saving} onClose={() => setWalkInOpen(false)} perform={async (action, message) => { const saved = await perform(action, message); if (saved) setWalkInOpen(false); return saved; }} />}
      {toast && <div className="owner-toast" role="status"><CheckCircle2 size={18} />{toast}</div>}
    </div>
  );
}

function OwnerLogin({ onSubmit, saving, error }: { onSubmit: (email: string, password: string) => void; saving: boolean; error: string }) {
  const [email, setEmail] = useState(demoEmail);
  const [password, setPassword] = useState("");
  function submit(event: FormEvent) {
    event.preventDefault();
    onSubmit(email, password);
  }
  return (
    <main className="owner-login-shell">
      <section className="owner-login-brand">
        <Link href="/"><Brand /></Link>
        <div>
          <p className="owner-login-kicker">Private owner access</p>
          <h1>Run the chair.<br /><span>Own the day.</span></h1>
          <p>Appointments, walk-ins, availability, customer history, and services in one focused workspace.</p>
        </div>
        <blockquote>“The day moves fast. Your schedule should keep up.”</blockquote>
      </section>
      <section className="owner-login-panel">
        <form onSubmit={submit}>
          <span className="owner-login-icon"><LockKeyhole size={23} /></span>
          <p className="owner-login-eyebrow">Owner studio</p>
          <h2>Welcome back.</h2>
          <p>Sign in to manage What&apos;s The Buzz?</p>
          <label><span>Email</span><div><Mail size={18} /><input type="email" required autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} /></div></label>
          <label><span>Password</span><div><ShieldCheck size={18} /><input type="password" required autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} /></div></label>
          {error && <p className="owner-login-error" role="alert">{error}</p>}
          <button type="submit" disabled={saving}>{saving ? <LoaderCircle className="spin" size={19} /> : <LockKeyhole size={18} />} Enter owner studio</button>
          <div className="demo-access"><strong>Owner access</strong><span>{demoEmail}</span><span>Use your private owner password.</span></div>
        </form>
        <Link href="/"><ArrowLeft size={17} /> Return to public website</Link>
      </section>
    </main>
  );
}

function ScheduleView({ data, onSelect, onAdd }: { data: DashboardData; onSelect: (appointment: Appointment) => void; onAdd: () => void }) {
  const today = shopDate();
  const todayAppointments = data.appointments.filter((item) => item.date === today && item.status !== "cancelled");
  const completed = todayAppointments.filter((item) => item.status === "completed").length;
  const active = todayAppointments.filter((item) => !["completed", "no_show"].includes(item.status));
  const revenue = todayAppointments.filter((item) => item.status !== "no_show").reduce((total, item) => total + item.price, 0);
  const next = active.find((item) => item.status !== "completed");
  return (
    <div className="owner-view owner-view-enter">
      <section className="owner-welcome">
        <div><p>{formatDate(today)}</p><h2>Good morning. The shop is moving.</h2><span>{todayAppointments.length} appointments on the books today.</span></div>
        <button onClick={onAdd}><Plus size={18} /> Add walk-in</button>
      </section>
      <section className="owner-metrics" aria-label="Today's overview">
        <Metric icon={<CalendarDays size={20} />} label="Appointments" value={String(todayAppointments.length)} detail={`${active.length} remaining`} tone="forest" />
        <Metric icon={<CircleDollarSign size={20} />} label="Booked revenue" value={`$${revenue}`} detail="Before tips" tone="signal" />
        <Metric icon={<CheckCircle2 size={20} />} label="Completed" value={String(completed)} detail={`${Math.max(0, todayAppointments.length - completed)} to go`} tone="sky" />
        <Metric icon={<Clock3 size={20} />} label="Next up" value={next ? formatTime(next.startTime) : "Clear"} detail={next?.customerName ?? "No more bookings"} tone="brass" />
      </section>
      <section className="owner-schedule-layout">
        <div className="owner-panel schedule-panel">
          <div className="owner-panel-heading"><div><p>Live schedule</p><h3>Today’s chair</h3></div><button title="Filter appointments" aria-label="Filter appointments"><ListFilter size={18} /></button></div>
          <div className="schedule-list">
            {todayAppointments.length ? todayAppointments.map((appointment) => <AppointmentRow appointment={appointment} onClick={() => onSelect(appointment)} key={appointment.id} />) : <EmptyState icon={<CalendarDays size={27} />} title="The chair is clear" body="Add a walk-in or enjoy a rare quiet moment." action={<button onClick={onAdd}><Plus size={17} /> Add walk-in</button>} />}
          </div>
        </div>
        <aside className="owner-day-rail">
          <div className="owner-next-card">
            <p>Next guest</p>
            {next ? <><span className="large-avatar">{initials(next.customerName)}</span><h3>{next.customerName}</h3><small>{next.serviceName}</small><div><Clock3 size={17} /> {formatTime(next.startTime)} · {next.duration} min</div><button onClick={() => onSelect(next)}>View details <ChevronRight size={17} /></button></> : <><Coffee size={31} /><h3>Schedule clear</h3><small>No upcoming guests today.</small></>}
          </div>
          <div className="owner-quick-note"><Sparkles size={20} /><div><strong>Walk-in window</strong><p>Best opening today: 12:00–1:30 PM</p></div></div>
        </aside>
      </section>
    </div>
  );
}

function Metric({ icon, label, value, detail, tone }: { icon: ReactNode; label: string; value: string; detail: string; tone: string }) {
  return <article className={`owner-metric tone-${tone}`}><span>{icon}</span><div><p>{label}</p><strong>{value}</strong><small>{detail}</small></div></article>;
}

function AppointmentRow({ appointment, onClick }: { appointment: Appointment; onClick: () => void }) {
  return (
    <button className="appointment-row" onClick={onClick}>
      <time>{formatTime(appointment.startTime)}<small>{appointment.duration} min</small></time>
      <span className="appointment-avatar">{initials(appointment.customerName)}</span>
      <span className="appointment-person"><strong>{appointment.customerName}</strong><small>{appointment.serviceName}</small></span>
      <span className={`owner-status status-${appointment.status}`}><i />{statusLabels[appointment.status]}</span>
      <span className="appointment-price">${appointment.price}</span>
      <ChevronRight size={18} />
    </button>
  );
}

function CalendarView({ data, onSelect }: { data: DashboardData; onSelect: (appointment: Appointment) => void }) {
  const [mode, setMode] = useState<"day" | "week" | "month">("week");
  const [anchor, setAnchor] = useState(() => new Date(`${shopDate()}T12:00:00`));
  const days = useMemo(() => {
    if (mode === "day") return [anchor];
    if (mode === "week") {
      const start = new Date(anchor);
      start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
      return Array.from({ length: 7 }, (_, index) => { const date = new Date(start); date.setDate(start.getDate() + index); return date; });
    }
    const start = new Date(anchor.getFullYear(), anchor.getMonth(), 1, 12);
    const gridStart = new Date(start);
    gridStart.setDate(start.getDate() - start.getDay());
    return Array.from({ length: 42 }, (_, index) => { const date = new Date(gridStart); date.setDate(gridStart.getDate() + index); return date; });
  }, [anchor, mode]);
  function move(direction: number) {
    const next = new Date(anchor);
    next.setDate(next.getDate() + direction * (mode === "day" ? 1 : mode === "week" ? 7 : 30));
    setAnchor(next);
  }
  return (
    <div className="owner-view owner-view-enter">
      <div className="calendar-toolbar">
        <div><button onClick={() => move(-1)} aria-label="Previous period"><ChevronLeft size={19} /></button><button className="calendar-today" onClick={() => setAnchor(new Date(`${shopDate()}T12:00:00`))}>Today</button><button onClick={() => move(1)} aria-label="Next period"><ChevronRight size={19} /></button><h2>{new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(anchor)}</h2></div>
        <div className="owner-segmented" aria-label="Calendar view">{(["day", "week", "month"] as const).map((item) => <button className={mode === item ? "is-active" : ""} onClick={() => setMode(item)} key={item}>{item}</button>)}</div>
      </div>
      <section className={`owner-calendar mode-${mode}`}>
        {days.map((day) => {
          const key = dateKey(day);
          const items = data.appointments.filter((appointment) => appointment.date === key && appointment.status !== "cancelled");
          const blocks = data.blocks.filter((block) => block.date === key);
          const outside = mode === "month" && day.getMonth() !== anchor.getMonth();
          return <div className={`calendar-day${key === shopDate() ? " is-today" : ""}${outside ? " is-outside" : ""}`} key={key}><header><span>{new Intl.DateTimeFormat("en-US", { weekday: "short" }).format(day)}</span><strong>{day.getDate()}</strong></header><div className="calendar-day-items">{blocks.map((block) => <span className="calendar-block" key={block.id}><Ban size={12} />{block.label}</span>)}{items.map((appointment) => <button className={`calendar-appointment status-${appointment.status}`} onClick={() => onSelect(appointment)} key={appointment.id}><time>{formatTime(appointment.startTime)}</time><strong>{appointment.customerName}</strong><span>{appointment.serviceName}</span></button>)}</div></div>;
        })}
      </section>
    </div>
  );
}

function CustomersView({ appointments, onSelect }: { appointments: Appointment[]; onSelect: (appointment: Appointment) => void }) {
  const [query, setQuery] = useState("");
  const customers = useMemo(() => {
    const groups = new Map<string, Appointment[]>();
    appointments.filter((item) => item.email || item.phone).forEach((item) => {
      const key = item.email || item.phone;
      groups.set(key, [...(groups.get(key) ?? []), item]);
    });
    return Array.from(groups.values()).map((visits) => {
      const sorted = [...visits].sort((a, b) => `${b.date}${b.startTime}`.localeCompare(`${a.date}${a.startTime}`));
      return { latest: sorted[0], visits: visits.length, spend: visits.filter((item) => item.status !== "cancelled").reduce((sum, item) => sum + item.price, 0) };
    }).filter((customer) => `${customer.latest.customerName} ${customer.latest.email} ${customer.latest.phone}`.toLowerCase().includes(query.toLowerCase()));
  }, [appointments, query]);
  return (
    <div className="owner-view owner-view-enter">
      <div className="owner-section-head"><div><p>Guest book</p><h2>{customers.length} customers</h2></div><label className="customer-search"><Search size={18} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Find a customer" /></label></div>
      <section className="owner-table-panel">
        <div className="customer-table customer-table-head"><span>Customer</span><span>Contact</span><span>Visits</span><span>Last appointment</span><span>Lifetime value</span><span /></div>
        {customers.map((customer) => <button className="customer-table" onClick={() => onSelect(customer.latest)} key={customer.latest.email || customer.latest.phone}><span className="customer-name"><i>{initials(customer.latest.customerName)}</i><strong>{customer.latest.customerName}</strong></span><span><strong>{customer.latest.email || "No email"}</strong><small>{customer.latest.phone}</small></span><span>{customer.visits}</span><span>{formatDate(customer.latest.date, { month: "short", day: "numeric", year: "numeric" })}</span><span>${customer.spend}</span><ChevronRight size={18} /></button>)}
      </section>
    </div>
  );
}

function ServicesView({ services, saving, perform }: { services: Service[]; saving: boolean; perform: (action: Record<string, unknown>, message: string) => Promise<boolean> }) {
  return (
    <div className="owner-view owner-view-enter">
      <div className="owner-section-head"><div><p>Menu management</p><h2>Services & pricing</h2></div><span className="section-head-note"><Sparkles size={17} /> Changes update client booking instantly</span></div>
      <section className="service-management-grid">{services.map((service) => <ServiceEditor service={service} saving={saving} perform={perform} key={service.id} />)}</section>
    </div>
  );
}

function ServiceEditor({ service, saving, perform }: { service: Service; saving: boolean; perform: (action: Record<string, unknown>, message: string) => Promise<boolean> }) {
  const [price, setPrice] = useState(service.price);
  const [duration, setDuration] = useState(service.duration);
  const [active, setActive] = useState(service.active);
  return <article className={`service-editor${active ? "" : " is-inactive"}`}><header><span><Scissors size={18} /></span><div><small>{service.category}</small><h3>{service.name}</h3></div><label className="owner-switch"><input type="checkbox" checked={active} onChange={(event) => setActive(event.target.checked)} /><i /></label></header><p>{service.description}</p><div className="service-editor-fields"><label><span>Price</span><div>$<input type="number" min="0" value={price} onChange={(event) => setPrice(Number(event.target.value))} /></div></label><label><span>Duration</span><div><input type="number" min="15" step="15" value={duration} onChange={(event) => setDuration(Number(event.target.value))} /> min</div></label></div><button disabled={saving || price === service.price && duration === service.duration && active === service.active} onClick={() => perform({ action: "updateService", id: service.id, price, duration, active }, `${service.name} updated`)}><Save size={17} /> Save service</button></article>;
}

function AvailabilityView({ blocks, saving, perform }: { blocks: ScheduleBlock[]; saving: boolean; perform: (action: Record<string, unknown>, message: string) => Promise<boolean> }) {
  const [date, setDate] = useState(shopDate(1));
  const [startTime, setStartTime] = useState("12:00");
  const [endTime, setEndTime] = useState("13:00");
  const [label, setLabel] = useState("Lunch break");
  const [allDay, setAllDay] = useState(false);
  return (
    <div className="owner-view owner-view-enter">
      <div className="owner-section-head"><div><p>Calendar control</p><h2>Block time</h2></div><span className="section-head-note"><Clock3 size={17} /> Clients only see genuinely open times</span></div>
      <section className="availability-layout">
        <form className="availability-form" onSubmit={async (event) => { event.preventDefault(); if (await perform({ action: "createBlock", date, startTime, endTime, label, allDay }, "Time blocked")) setLabel(""); }}><div className="owner-panel-heading"><div><p>New block</p><h3>Protect your time</h3></div><Ban size={21} /></div><label><span>Reason</span><input required value={label} onChange={(event) => setLabel(event.target.value)} placeholder="Lunch, vacation, appointment..." /></label><label><span>Date</span><input type="date" min={shopDate()} required value={date} onChange={(event) => setDate(event.target.value)} /></label><label className="availability-check"><input type="checkbox" checked={allDay} onChange={(event) => setAllDay(event.target.checked)} /><span>Block the entire day</span></label>{!allDay && <div className="availability-times"><label><span>Starts</span><input type="time" value={startTime} onChange={(event) => setStartTime(event.target.value)} /></label><label><span>Ends</span><input type="time" value={endTime} onChange={(event) => setEndTime(event.target.value)} /></label></div>}<button disabled={saving}><Plus size={18} /> Add blocked time</button></form>
        <div className="owner-panel blocks-panel"><div className="owner-panel-heading"><div><p>Upcoming</p><h3>Blocked time</h3></div><span>{blocks.filter((block) => block.date >= shopDate()).length} blocks</span></div><div className="block-list">{blocks.filter((block) => block.date >= shopDate()).map((block) => <div key={block.id}><span className="block-date"><strong>{new Date(`${block.date}T12:00:00`).getDate()}</strong><small>{formatDate(block.date, { month: "short" })}</small></span><span><strong>{block.label}</strong><small>{formatDate(block.date, { weekday: "long" })} · {block.allDay ? "All day" : `${formatTime(block.startTime)}–${formatTime(block.endTime)}`}</small></span><button onClick={() => perform({ action: "deleteBlock", id: block.id }, "Blocked time removed")} aria-label={`Remove ${block.label}`}><X size={18} /></button></div>)}{!blocks.some((block) => block.date >= shopDate()) && <EmptyState icon={<Clock3 size={27} />} title="No blocked time" body="Your upcoming calendar is fully open." />}</div></div>
      </section>
    </div>
  );
}

function SettingsView({ settings, saving, perform }: { settings: Record<string, string>; saving: boolean; perform: (action: Record<string, unknown>, message: string) => Promise<boolean> }) {
  const [values, setValues] = useState({ emailReminders: settings.emailReminders !== "false", smsReminders: settings.smsReminders !== "false", autoConfirm: settings.autoConfirm !== "false", reminderLead: settings.reminderLead ?? "24", businessName: settings.businessName ?? "What's The Buzz?" });
  return (
    <div className="owner-view owner-view-enter settings-view">
      <div className="owner-section-head"><div><p>Shop preferences</p><h2>Booking settings</h2></div><button className="owner-primary-action" disabled={saving} onClick={() => perform({ action: "settings", values }, "Settings saved")}><Save size={17} /> Save changes</button></div>
      <section className="settings-section"><div><h3>Notifications</h3><p>Keep guests informed before they reach the chair.</p></div><div className="settings-controls"><SettingToggle icon={<Mail size={19} />} title="Email confirmations" body="Send booking details and change notices." checked={values.emailReminders} onChange={(checked) => setValues({ ...values, emailReminders: checked })} /><SettingToggle icon={<Phone size={19} />} title="SMS reminders" body="Send a text before each appointment." checked={values.smsReminders} onChange={(checked) => setValues({ ...values, smsReminders: checked })} /><label className="settings-select"><span><Clock3 size={19} /><i><strong>Reminder timing</strong><small>How early should reminders go out?</small></i></span><select value={values.reminderLead} onChange={(event) => setValues({ ...values, reminderLead: event.target.value })}><option value="2">2 hours before</option><option value="12">12 hours before</option><option value="24">24 hours before</option><option value="48">48 hours before</option></select></label></div></section>
      <section className="settings-section"><div><h3>Booking rules</h3><p>Control how new appointments enter your schedule.</p></div><div className="settings-controls"><SettingToggle icon={<CheckCircle2 size={19} />} title="Automatically confirm" body="New client bookings appear as confirmed." checked={values.autoConfirm} onChange={(checked) => setValues({ ...values, autoConfirm: checked })} /><label className="settings-name"><span>Business display name</span><input value={values.businessName} onChange={(event) => setValues({ ...values, businessName: event.target.value })} /></label></div></section>
      <section className="settings-note"><ShieldCheck size={22} /><div><strong>Local demo notifications</strong><p>Email and SMS controls are fully saved, but messages remain in preview mode until delivery accounts are connected.</p></div></section>
    </div>
  );
}

function SettingToggle({ icon, title, body, checked, onChange }: { icon: ReactNode; title: string; body: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return <label className="setting-toggle"><span>{icon}<i><strong>{title}</strong><small>{body}</small></i></span><span className="owner-switch"><input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} /><i /></span></label>;
}

function AppointmentDrawer({ appointment, saving, onClose, perform }: { appointment: Appointment; saving: boolean; onClose: () => void; perform: (action: Record<string, unknown>, message: string) => Promise<boolean> }) {
  return <div className="owner-overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><aside className="appointment-drawer" role="dialog" aria-modal="true" aria-labelledby="appointment-title"><header><div><p>Appointment details</p><h2 id="appointment-title">{formatTime(appointment.startTime)} · {formatDate(appointment.date, { month: "short", day: "numeric" })}</h2></div><button onClick={onClose} aria-label="Close appointment details"><X size={21} /></button></header><div className="drawer-guest"><span>{initials(appointment.customerName)}</span><div><h3>{appointment.customerName}</h3><p>{appointment.source === "walk-in" ? "Added as walk-in" : "Booked online"}</p></div><i className={`owner-status status-${appointment.status}`}>{statusLabels[appointment.status]}</i></div><dl className="drawer-details"><div><dt><Scissors size={18} /> Service</dt><dd>{appointment.serviceName}</dd></div><div><dt><Clock3 size={18} /> Duration</dt><dd>{appointment.duration} minutes</dd></div><div><dt><CircleDollarSign size={18} /> Price</dt><dd>${appointment.price}</dd></div><div><dt><Phone size={18} /> Phone</dt><dd><a href={`tel:${appointment.phone}`}>{appointment.phone}</a></dd></div><div><dt><Mail size={18} /> Email</dt><dd>{appointment.email || "Not provided"}</dd></div></dl><div className="drawer-notes"><p>Barber notes</p><span>{appointment.notes || "No notes for this appointment."}</span></div><div className="drawer-status-actions"><p>Update status</p><div>{["confirmed", "completed", "no_show", "cancelled"].map((status) => <button className={appointment.status === status ? "is-current" : ""} disabled={saving || appointment.status === status} onClick={() => perform({ action: "appointmentStatus", id: appointment.id, status }, `Marked ${statusLabels[status].toLowerCase()}`)} key={status}>{status === "confirmed" && <Check size={16} />}{status === "completed" && <CheckCircle2 size={16} />}{status === "no_show" && <UserRound size={16} />}{status === "cancelled" && <Ban size={16} />}{statusLabels[status]}</button>)}</div></div></aside></div>;
}

function WalkInModal({ services, saving, onClose, perform }: { services: Service[]; saving: boolean; onClose: () => void; perform: (action: Record<string, unknown>, message: string) => Promise<boolean> }) {
  const [form, setForm] = useState({ customerName: "", phone: "", email: "", notes: "", serviceId: services[0]?.id ?? "", date: shopDate(), startTime: "12:00" });
  return <div className="owner-overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><form className="walkin-modal" role="dialog" aria-modal="true" aria-labelledby="walkin-title" onSubmit={(event) => { event.preventDefault(); perform({ action: "walkIn", ...form }, "Walk-in added to the schedule"); }}><header><div><p>Manual appointment</p><h2 id="walkin-title">Add a walk-in</h2></div><button type="button" onClick={onClose} aria-label="Close"><X size={21} /></button></header><div className="walkin-grid"><label><span>Customer name *</span><input required value={form.customerName} onChange={(event) => setForm({ ...form, customerName: event.target.value })} /></label><label><span>Phone *</span><input required type="tel" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} /></label><label><span>Service *</span><select value={form.serviceId} onChange={(event) => setForm({ ...form, serviceId: event.target.value })}>{services.map((service) => <option value={service.id} key={service.id}>{service.name} · ${service.price}</option>)}</select></label><label><span>Email</span><input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></label><label><span>Date *</span><input type="date" required value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} /></label><label><span>Start time *</span><input type="time" required value={form.startTime} onChange={(event) => setForm({ ...form, startTime: event.target.value })} /></label><label className="walkin-wide"><span>Notes</span><textarea value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} /></label></div><footer><button type="button" onClick={onClose}>Cancel</button><button type="submit" disabled={saving}>{saving ? <LoaderCircle className="spin" size={18} /> : <Plus size={18} />} Add to schedule</button></footer></form></div>;
}

function EmptyState({ icon, title, body, action }: { icon: ReactNode; title: string; body: string; action?: ReactNode }) {
  return <div className="owner-empty">{icon}<strong>{title}</strong><p>{body}</p>{action}</div>;
}
