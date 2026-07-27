"use client";

import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  CheckCircle2,
  Clock3,
  LoaderCircle,
  MapPin,
  Phone,
  Scissors,
  ShieldCheck,
  Sparkles,
  UserRound,
  X,
} from "lucide-react";
import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";

type Service = {
  id: string;
  name: string;
  category: string;
  description: string;
  duration: number;
  price: number;
  active: boolean;
};

type Appointment = {
  id: string;
  customerName: string;
  email: string;
  phone: string;
  notes: string;
  serviceId: string;
  serviceName: string;
  date: string;
  startTime: string;
  endTime: string;
  duration: number;
  price: number;
  status: string;
};

type CustomerDetails = {
  customerName: string;
  email: string;
  phone: string;
  notes: string;
};

const emptyDetails: CustomerDetails = {
  customerName: "",
  email: "",
  phone: "",
  notes: "",
};

function dateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function upcomingDates() {
  return Array.from({ length: 14 }, (_, index) => {
    const date = new Date();
    date.setHours(12, 0, 0, 0);
    date.setDate(date.getDate() + index);
    return {
      value: dateKey(date),
      weekday: new Intl.DateTimeFormat("en-US", { weekday: "short" }).format(date),
      day: new Intl.DateTimeFormat("en-US", { day: "numeric" }).format(date),
      month: new Intl.DateTimeFormat("en-US", { month: "short" }).format(date),
      closed: date.getDay() === 0,
    };
  });
}

function formatDate(value: string, short = false) {
  if (!value) return "Choose a date";
  return new Intl.DateTimeFormat("en-US", {
    weekday: short ? undefined : "long",
    month: "long",
    day: "numeric",
  }).format(new Date(`${value}T12:00:00`));
}

function formatTime(value: string) {
  if (!value) return "Choose a time";
  const [hours, minutes] = value.split(":").map(Number);
  return new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" }).format(
    new Date(2026, 0, 1, hours, minutes),
  );
}

function calendarUrl(appointment: Appointment) {
  const start = `${appointment.date.replaceAll("-", "")}T${appointment.startTime.replace(":", "")}00`;
  const end = `${appointment.date.replaceAll("-", "")}T${appointment.endTime.replace(":", "")}00`;
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: `${appointment.serviceName} at What's The Buzz?`,
    dates: `${start}/${end}`,
    ctz: "America/Chicago",
    location: "2215 Schofield Ave #1, Schofield, WI 54476",
    details: "Your appointment at What's The Buzz? Call (715) 298-3307 if you need help.",
  });
  return `https://calendar.google.com/calendar/render?${params}`;
}

function Brand() {
  return (
    <span className="booking-brand">
      <span className="booking-brand-mark" aria-hidden="true">
        <Sparkles size={24} strokeWidth={1.8} />
        <Scissors size={14} strokeWidth={2} />
      </span>
      <span>
        <strong>What&apos;s The Buzz?</strong>
        <small>Barber Shop · Schofield</small>
      </span>
    </span>
  );
}

export function BookingApp() {
  const dates = useMemo(() => upcomingDates(), []);
  const [services, setServices] = useState<Service[]>([]);
  const [serviceId, setServiceId] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [slots, setSlots] = useState<string[]>([]);
  const [details, setDetails] = useState<CustomerDetails>(emptyDetails);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [confirmation, setConfirmation] = useState<Appointment | null>(null);
  const [manageToken, setManageToken] = useState("");
  const [managedAppointment, setManagedAppointment] = useState<Appointment | null>(null);
  const [manageLoading, setManageLoading] = useState(false);
  const [isRescheduling, setIsRescheduling] = useState(false);

  const selectedService = services.find((service) => service.id === serviceId) ?? null;

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get("manage") ?? "";
    const url = token ? `/api/booking?token=${encodeURIComponent(token)}` : "/api/booking";
    fetch(url)
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error);
        setManageToken(token);
        if (token) setManagedAppointment(data.appointment);
        else {
          setServices(data.services);
          if (data.services[0]) setServiceId(data.services[0].id);
        }
      })
      .catch((cause) => setError(cause instanceof Error ? cause.message : "Booking is unavailable."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!date || !serviceId || manageToken && !isRescheduling) return;
    let cancelled = false;
    async function loadSlots() {
      await Promise.resolve();
      if (cancelled) return;
      setManageLoading(true);
      setTime("");
      try {
        const response = await fetch(`/api/booking?date=${encodeURIComponent(date)}&serviceId=${encodeURIComponent(serviceId)}`);
        const data = await response.json();
        if (!response.ok) throw new Error(data.error);
        if (!cancelled) setSlots(data.slots);
      } catch (cause) {
        if (!cancelled) setError(cause instanceof Error ? cause.message : "Times are unavailable.");
      } finally {
        if (!cancelled) setManageLoading(false);
      }
    }
    void loadSlots();
    return () => { cancelled = true; };
  }, [date, serviceId, manageToken, isRescheduling]);

  async function submitBooking(event: FormEvent) {
    event.preventDefault();
    if (!selectedService || !date || !time) return;
    setSaving(true);
    setError("");
    try {
      const response = await fetch("/api/booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...details, serviceId, date, startTime: time }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setConfirmation(data.appointment);
      setManageToken(data.manageToken);
      setStep(4);
      window.history.replaceState({}, "", `/book?manage=${data.manageToken}`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "We could not finish your booking.");
    } finally {
      setSaving(false);
    }
  }

  async function updateManagedAppointment(action: "cancel" | "reschedule") {
    if (!managedAppointment) return;
    setSaving(true);
    setError("");
    try {
      const response = await fetch("/api/booking", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: manageToken,
          action,
          serviceId,
          date,
          startTime: time,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setManagedAppointment(data.appointment);
      setIsRescheduling(false);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "We could not update your appointment.");
    } finally {
      setSaving(false);
    }
  }

  function beginReschedule() {
    if (!managedAppointment) return;
    setIsRescheduling(true);
    setLoading(true);
    fetch("/api/booking")
      .then((response) => response.json())
      .then((data) => {
        setServices(data.services);
        setServiceId(managedAppointment.serviceId);
        setDate("");
        setTime("");
      })
      .finally(() => setLoading(false));
  }

  if (loading) {
    return (
      <main className="booking-loading" role="status">
        <LoaderCircle className="spin" size={28} />
        <p>Preparing the chair...</p>
      </main>
    );
  }

  if (manageToken && managedAppointment && !isRescheduling) {
    const isCancelled = managedAppointment.status === "cancelled";
    return (
      <div className="booking-shell">
        <BookingHeader />
        <main className="manage-page">
          <section className="manage-hero">
            <div className={`manage-status-mark${isCancelled ? " is-cancelled" : ""}`}>
              {isCancelled ? <X size={30} /> : <Check size={30} />}
            </div>
            <p className="booking-eyebrow">Appointment details</p>
            <h1>{isCancelled ? "Appointment cancelled" : "You are on the books."}</h1>
            <p>{isCancelled ? "This time has been released for another guest." : `We will see you ${formatDate(managedAppointment.date)}.`}</p>
          </section>
          <section className="manage-detail-band">
            <div className="manage-detail-inner">
              <div><Scissors size={19} /><span>Service</span><strong>{managedAppointment.serviceName}</strong></div>
              <div><CalendarDays size={19} /><span>Date</span><strong>{formatDate(managedAppointment.date, true)}</strong></div>
              <div><Clock3 size={19} /><span>Time</span><strong>{formatTime(managedAppointment.startTime)}</strong></div>
              <div><UserRound size={19} /><span>Guest</span><strong>{managedAppointment.customerName}</strong></div>
            </div>
          </section>
          {!isCancelled && (
            <section className="manage-actions-panel">
              <div>
                <p className="booking-eyebrow">Need to make a change?</p>
                <h2>Plans shift. No problem.</h2>
              </div>
              <div className="manage-buttons">
                <button className="book-button book-button-primary" onClick={beginReschedule}>Reschedule <ArrowRight size={18} /></button>
                <a className="book-button book-button-outline" href={calendarUrl(managedAppointment)} target="_blank" rel="noreferrer"><CalendarDays size={18} /> Add to calendar</a>
                <button className="book-text-danger" onClick={() => updateManagedAppointment("cancel")} disabled={saving}>Cancel appointment</button>
              </div>
            </section>
          )}
          {error && <p className="booking-error" role="alert">{error}</p>}
        </main>
      </div>
    );
  }

  if (manageToken && managedAppointment && isRescheduling) {
    return (
      <div className="booking-shell">
        <BookingHeader />
        <main className="reschedule-page">
          <button className="book-back" onClick={() => setIsRescheduling(false)}><ArrowLeft size={18} /> Keep current time</button>
          <p className="booking-eyebrow">Reschedule appointment</p>
          <h1>Choose a better time.</h1>
          <p>Your current appointment stays in place until you confirm a new one.</p>
          <ServiceAndTimePicker
            services={services}
            serviceId={serviceId}
            onService={setServiceId}
            dates={dates}
            date={date}
            onDate={setDate}
            slots={slots}
            time={time}
            onTime={setTime}
            loading={manageLoading}
          />
          {error && <p className="booking-error" role="alert">{error}</p>}
          <button className="book-button book-button-primary" disabled={!date || !time || saving} onClick={() => updateManagedAppointment("reschedule")}>
            {saving ? <LoaderCircle className="spin" size={19} /> : <Check size={19} />} Confirm new time
          </button>
        </main>
      </div>
    );
  }

  if (confirmation) {
    return (
      <div className="booking-shell booking-confirm-shell">
        <BookingHeader />
        <main className="booking-confirmation">
          <div className="confirmation-orbit" aria-hidden="true"><Scissors size={27} /></div>
          <p className="booking-eyebrow">Appointment confirmed</p>
          <h1>You are officially ready for the chair.</h1>
          <p className="confirmation-lede">A confirmation has been prepared for <strong>{confirmation.email}</strong>. Your private management link is this page.</p>
          <div className="confirmation-ticket">
            <div><span>Service</span><strong>{confirmation.serviceName}</strong></div>
            <div><span>Date</span><strong>{formatDate(confirmation.date, true)}</strong></div>
            <div><span>Time</span><strong>{formatTime(confirmation.startTime)}</strong></div>
            <div><span>Total</span><strong>${confirmation.price}</strong></div>
          </div>
          <div className="confirmation-actions">
            <a className="book-button book-button-primary" href={calendarUrl(confirmation)} target="_blank" rel="noreferrer"><CalendarDays size={18} /> Add to calendar</a>
            <Link className="book-button book-button-outline" href="/"><ArrowLeft size={18} /> Back to the shop</Link>
          </div>
          <p className="confirmation-foot"><ShieldCheck size={17} /> Save this page to reschedule or cancel securely.</p>
        </main>
      </div>
    );
  }

  return (
    <div className="booking-shell">
      <BookingHeader />
      <main className="booking-main">
        <section className="booking-intro">
          <div>
            <p className="booking-eyebrow">Reserve your chair</p>
            <h1>Good cuts happen on your time.</h1>
          </div>
          <div className="booking-progress" aria-label={`Step ${step} of 3`}>
            {[1, 2, 3].map((item) => <span className={item <= step ? "is-active" : ""} key={item}>{item < step ? <Check size={14} /> : item}</span>)}
            <p>Step {step} of 3</p>
          </div>
        </section>

        <div className="booking-workspace">
          <section className="booking-flow" aria-live="polite">
            {step === 1 && (
              <div className="booking-step booking-step-enter">
                <p className="booking-step-number">01 / Service</p>
                <h2>What are we sharpening up?</h2>
                <div className="service-picker">
                  {services.map((service) => (
                    <button className={`service-choice${service.id === serviceId ? " is-selected" : ""}`} onClick={() => setServiceId(service.id)} key={service.id}>
                      <span className="service-choice-check">{service.id === serviceId && <Check size={15} />}</span>
                      <span className="service-choice-main"><strong>{service.name}</strong><small>{service.description}</small></span>
                      <span className="service-choice-meta"><strong>${service.price}</strong><small>{service.duration} min</small></span>
                    </button>
                  ))}
                </div>
                <button className="book-button book-button-primary booking-next" disabled={!serviceId} onClick={() => setStep(2)}>Choose a time <ArrowRight size={19} /></button>
              </div>
            )}

            {step === 2 && (
              <div className="booking-step booking-step-enter">
                <button className="book-back" onClick={() => setStep(1)}><ArrowLeft size={18} /> Service</button>
                <p className="booking-step-number">02 / Date & time</p>
                <h2>When should we hold the chair?</h2>
                <ServiceAndTimePicker
                  services={services}
                  serviceId={serviceId}
                  onService={setServiceId}
                  dates={dates}
                  date={date}
                  onDate={setDate}
                  slots={slots}
                  time={time}
                  onTime={setTime}
                  loading={manageLoading}
                  hideServices
                />
                <button className="book-button book-button-primary booking-next" disabled={!date || !time} onClick={() => setStep(3)}>Your details <ArrowRight size={19} /></button>
              </div>
            )}

            {step === 3 && (
              <form className="booking-step booking-step-enter" onSubmit={submitBooking}>
                <button className="book-back" type="button" onClick={() => setStep(2)}><ArrowLeft size={18} /> Date & time</button>
                <p className="booking-step-number">03 / Your details</p>
                <h2>Who are we getting ready?</h2>
                <div className="booking-form-grid">
                  <label><span>Full name *</span><input required autoComplete="name" value={details.customerName} onChange={(event) => setDetails({ ...details, customerName: event.target.value })} placeholder="Your name" /></label>
                  <label><span>Phone number *</span><input required type="tel" autoComplete="tel" value={details.phone} onChange={(event) => setDetails({ ...details, phone: event.target.value })} placeholder="(715) 555-0123" /></label>
                  <label className="booking-form-wide"><span>Email address *</span><input required type="email" autoComplete="email" value={details.email} onChange={(event) => setDetails({ ...details, email: event.target.value })} placeholder="you@example.com" /></label>
                  <label className="booking-form-wide"><span>Notes for your barber</span><textarea value={details.notes} onChange={(event) => setDetails({ ...details, notes: event.target.value })} placeholder="Style goals, accessibility needs, or anything useful to know." /></label>
                </div>
                <label className="booking-consent"><input type="checkbox" required /><span>I agree to receive appointment confirmations and reminders. Standard messaging rates may apply.</span></label>
                {error && <p className="booking-error" role="alert">{error}</p>}
                <button className="book-button book-button-primary booking-next" disabled={saving} type="submit">
                  {saving ? <LoaderCircle className="spin" size={19} /> : <CheckCircle2 size={19} />} Confirm appointment
                </button>
              </form>
            )}
          </section>

          <aside className="booking-summary">
            <div className="summary-image"><img src="/hero-barber.jpg" alt="Barber finishing a precision haircut" /></div>
            <div className="summary-content">
              <p className="booking-eyebrow">Your appointment</p>
              <h2>{selectedService?.name ?? "Choose a service"}</h2>
              <dl>
                <div><dt><CalendarDays size={17} /> Date</dt><dd>{formatDate(date, true)}</dd></div>
                <div><dt><Clock3 size={17} /> Time</dt><dd>{formatTime(time)}</dd></div>
                <div><dt><Sparkles size={17} /> Duration</dt><dd>{selectedService ? `${selectedService.duration} min` : "-"}</dd></div>
              </dl>
              <div className="summary-total"><span>Due at appointment</span><strong>{selectedService ? `$${selectedService.price}` : "-"}</strong></div>
              <div className="summary-location"><MapPin size={18} /><span>2215 Schofield Ave #1<br />Schofield, WI 54476</span></div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}

function BookingHeader() {
  return (
    <header className="booking-header">
      <Link href="/" aria-label="What's The Buzz? home"><Brand /></Link>
      <nav aria-label="Booking navigation">
        <span className="booking-open"><i /> Walk-ins welcome</span>
        <a href="tel:+17152983307"><Phone size={17} /> (715) 298-3307</a>
        <Link className="booking-owner-link" href="/owner">Owner sign in</Link>
      </nav>
    </header>
  );
}

function ServiceAndTimePicker({
  services,
  serviceId,
  onService,
  dates,
  date,
  onDate,
  slots,
  time,
  onTime,
  loading,
  hideServices = false,
}: {
  services: Service[];
  serviceId: string;
  onService: (value: string) => void;
  dates: ReturnType<typeof upcomingDates>;
  date: string;
  onDate: (value: string) => void;
  slots: string[];
  time: string;
  onTime: (value: string) => void;
  loading: boolean;
  hideServices?: boolean;
}) {
  const morning = slots.filter((slot) => slot < "12:00");
  const afternoon = slots.filter((slot) => slot >= "12:00");
  return (
    <div className="time-picker">
      {!hideServices && (
        <label className="reschedule-service"><span>Service</span><select value={serviceId} onChange={(event) => onService(event.target.value)}>{services.map((service) => <option value={service.id} key={service.id}>{service.name} · ${service.price}</option>)}</select></label>
      )}
      <div className="date-strip" aria-label="Available dates">
        {dates.map((item) => (
          <button className={date === item.value ? "is-selected" : ""} disabled={item.closed} onClick={() => onDate(item.value)} key={item.value} type="button">
            <small>{item.weekday}</small><strong>{item.day}</strong><span>{item.month}</span>
          </button>
        ))}
      </div>
      {!date ? (
        <div className="time-empty"><CalendarDays size={27} /><p>Choose a date to see available times.</p></div>
      ) : loading ? (
        <div className="time-empty"><LoaderCircle className="spin" size={27} /><p>Checking the chair...</p></div>
      ) : !slots.length ? (
        <div className="time-empty"><Clock3 size={27} /><p>No openings that day. Try another date or call for walk-in availability.</p></div>
      ) : (
        <div className="time-groups">
          {[{ label: "Morning", values: morning }, { label: "Afternoon", values: afternoon }].filter((group) => group.values.length).map((group) => (
            <div key={group.label}><p>{group.label}</p><div>{group.values.map((slot) => <button className={time === slot ? "is-selected" : ""} onClick={() => onTime(slot)} type="button" key={slot}>{formatTime(slot)}</button>)}</div></div>
          ))}
        </div>
      )}
    </div>
  );
}
