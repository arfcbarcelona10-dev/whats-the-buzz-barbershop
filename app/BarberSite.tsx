"use client";

import {
  ArrowDown,
  ArrowRight,
  Baby,
  Brush,
  CalendarDays,
  Camera,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock3,
  MapPin,
  Phone,
  Scissors,
  ScissorsLineDashed,
  Sparkles,
  SprayCan,
  Star,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

const PHONE_DISPLAY = "(715) 298-3307";
const PHONE_HREF = "tel:+17152983307";
const PROFILE_URL = "https://www.google.com/search?q=What%27s+The+Buzz+barber+shop+Schofield+WI";
const REVIEWS_URL = `${PROFILE_URL}+reviews`;
const DIRECTIONS_URL = "https://www.google.com/maps/dir/?api=1&destination=2215%20Schofield%20Ave%20%231%2C%20Schofield%2C%20WI%2054476";

type HoursWindow = [number, number];

const SHOP_HOURS: Record<string, HoursWindow[]> = {
  Sun: [],
  Mon: [[540, 1080]],
  Tue: [[540, 1080]],
  Wed: [[540, 1080]],
  Thu: [[540, 1080]],
  Fri: [[540, 1020]],
  Sat: [[540, 840]],
};

const DAY_ORDER = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DAY_NAMES: Record<string, string> = {
  Sun: "Sunday", Mon: "Monday", Tue: "Tuesday", Wed: "Wednesday",
  Thu: "Thursday", Fri: "Friday", Sat: "Saturday",
};

const hoursRows = [
  ["Monday", "9 AM - 6 PM"],
  ["Tuesday", "9 AM - 6 PM"],
  ["Wednesday", "9 AM - 6 PM"],
  ["Thursday", "9 AM - 6 PM"],
  ["Friday", "9 AM - 5 PM"],
  ["Saturday", "9 AM - 2 PM"],
  ["Sunday", "Closed"],
];

const serviceFeatures = [
  { icon: Scissors, title: "Haircuts", copy: "Classic cuts, fades, tapers, and custom shaping.", items: ["Haircut", "Custom cut", "Fade cut", "Buzz cut", "Curly hair", "Long haircut", "Scissor cut"] },
  { icon: Brush, title: "Beard trim", copy: "Precision grooming, shaping, and clean line work.", items: ["Beard trim", "Beard maintenance", "Eyebrow trimming"] },
  { icon: ScissorsLineDashed, title: "Hot towel shave", copy: "Traditional straight razor comfort and detail.", items: ["Hot towel shave", "Head shave", "Shave"] },
  { icon: SprayCan, title: "Styling", copy: "A polished reset for any look or occasion.", items: ["Shampoo & conditioning"] },
  { icon: Baby, title: "Kids' cuts", copy: "Patient, clean cuts for young guests and growing styles.", items: ["Kids' cuts"] },
];

const reviews = [
  { quote: "Great haircut, great price! I will be back, thanks Michelle!", name: "Carson Weber" },
  { quote: "Michelle was excellent! She did a great job and was able to do it quickly at a very reasonable price.", name: "Troy" },
  { quote: "Best haircut experience ever! Hot towel on face while shampooing my hair, and an excellent haircut.", name: "Scott Hafenan" },
];

const gallery = [
  { image: "/mountain-interior.jpg", alt: "Warm timber barbershop interior", label: "The chair" },
  { image: "/mountain-craft.jpg", alt: "Barber carefully finishing a haircut", label: "The craft" },
  { image: "/mountain-shop-hero.jpg", alt: "Premium barbershop exterior and interior detail", label: "The shop" },
  { image: "/barber-before-after.png", alt: "Before and after transformation from an overgrown style to a polished haircut and beard", label: "The finish" },
  { image: "/gallery-detail.png", alt: "Fresh short haircut and precisely shaped beard shown in profile", label: "The detail" },
  { image: "/gallery-style.png", alt: "Finished braided hairstyle shown in profile", label: "The style" },
  { image: "/gallery-rules.png", alt: "Vintage barbershop rules sign inside the shop", label: "The rules" },
  { image: "/gallery-storefront.png", alt: "What's The Buzz? storefront in Schofield, Wisconsin", label: "The storefront" },
];

function formatTime(minutes: number) {
  if (minutes === 1440 || minutes === 0) return "midnight";
  const hour = Math.floor(minutes / 60);
  const minute = minutes % 60;
  return `${hour % 12 || 12}${minute ? `:${String(minute).padStart(2, "0")}` : ""} ${hour >= 12 ? "PM" : "AM"}`;
}

function getShopStatus(date: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Chicago", weekday: "short", hour: "2-digit",
    minute: "2-digit", hourCycle: "h23",
  }).formatToParts(date);
  const weekday = parts.find((part) => part.type === "weekday")?.value ?? "Sun";
  const currentMinute = Number(parts.find((part) => part.type === "hour")?.value ?? 0) * 60
    + Number(parts.find((part) => part.type === "minute")?.value ?? 0);
  const today = SHOP_HOURS[weekday];
  const active = today.find(([start, end]) => currentMinute >= start && currentMinute < end);
  if (active) return { isOpen: true, label: `Open now · until ${formatTime(active[1])}` };
  const later = today.find(([start]) => start > currentMinute);
  if (later) return { isOpen: false, label: `Closed now · opens ${formatTime(later[0])}` };
  const todayIndex = DAY_ORDER.indexOf(weekday);
  for (let offset = 1; offset <= 7; offset += 1) {
    const nextDay = DAY_ORDER[(todayIndex + offset) % 7];
    const nextWindow = SHOP_HOURS[nextDay][0];
    if (nextWindow) return { isOpen: false, label: `Closed · opens ${DAY_NAMES[nextDay]} at ${formatTime(nextWindow[0])}` };
  }
  return { isOpen: false, label: "Call for availability" };
}

function BrandLogo({ footer = false }: { footer?: boolean }) {
  return (
    <span className={`alpine-logo${footer ? " alpine-logo-footer" : ""}`}>
      <span className="alpine-logo-mark" aria-hidden="true">
        <Sparkles size={footer ? 34 : 28} strokeWidth={1.25} />
        <Scissors size={footer ? 16 : 13} strokeWidth={1.5} />
      </span>
      <span className="alpine-logo-type">
        <strong>What&apos;s The Buzz?</strong>
        <span>Barber Shop · Schofield</span>
      </span>
    </span>
  );
}

function Stars() {
  return <span className="alpine-stars" aria-label="4.8 out of 5 stars">{Array.from({ length: 5 }).map((_, index) => <Star key={index} size={13} fill="currentColor" />)}</span>;
}

function PageLoader({ exiting }: { exiting: boolean }) {
  return (
    <div className={`alpine-loader${exiting ? " is-exiting" : ""}`} role="status" aria-label="Loading What's The Buzz?">
      <div className="alpine-loader-inner">
        <BrandLogo />
        <p>Schofield, Wisconsin · Barber shop</p>
        <span className="alpine-loader-line" aria-hidden="true"><i /></span>
      </div>
    </div>
  );
}

export function BarberSite() {
  const [status, setStatus] = useState({ isOpen: true, label: "Walk-ins welcome today" });
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [loaderVisible, setLoaderVisible] = useState(true);
  const [loaderExiting, setLoaderExiting] = useState(false);
  const orderedGallery = useMemo(
    () => gallery.slice(0, 4).map((_, index) => gallery[(galleryIndex + index) % gallery.length]),
    [galleryIndex],
  );

  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const exitAfter = reduceMotion ? 180 : 900;
    document.body.classList.add("alpine-loading-active");
    const exitTimer = window.setTimeout(() => setLoaderExiting(true), exitAfter);
    const doneTimer = window.setTimeout(() => {
      setLoaderVisible(false);
      document.body.classList.remove("alpine-loading-active");
    }, exitAfter + (reduceMotion ? 120 : 380));
    return () => {
      window.clearTimeout(exitTimer);
      window.clearTimeout(doneTimer);
      document.body.classList.remove("alpine-loading-active");
    };
  }, []);

  useEffect(() => {
    const updateStatus = () => setStatus(getShopStatus(new Date()));
    updateStatus();
    const timer = window.setInterval(updateStatus, 60_000);
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const items = document.querySelectorAll<HTMLElement>("[data-alpine-reveal]");
    const observer = new IntersectionObserver((entries) => entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-revealed");
        observer.unobserve(entry.target);
      }
    }), { threshold: 0.12, rootMargin: "0px 0px -8%" });
    items.forEach((item) => observer.observe(item));
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      window.requestAnimationFrame(() => {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        document.documentElement.style.setProperty("--alpine-progress", String(max > 0 ? window.scrollY / max : 0));
        if (!reduceMotion) document.documentElement.style.setProperty("--alpine-shift", `${Math.min(window.scrollY * 0.08, 64)}px`);
        ticking = false;
      });
      ticking = true;
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => { window.clearInterval(timer); observer.disconnect(); window.removeEventListener("scroll", onScroll); };
  }, []);

  return (
    <div className="alpine-site">
      {loaderVisible && <PageLoader exiting={loaderExiting} />}
      <a className="alpine-skip" href="#main-content">Skip to content</a>
      <div className="alpine-progress" aria-hidden="true" />

      <header className="alpine-header">
        <Link href="/" aria-label="What's The Buzz? home"><BrandLogo /></Link>
        <nav aria-label="Primary navigation">
          <a href="#top">Home</a><a href="#craft">About</a><a href="#services">Services</a>
          <a href="#gallery">Gallery</a><a href="#reviews">Reviews</a><a href="#visit">Contact</a>
        </nav>
        <div className="alpine-header-actions">
          <a className="alpine-header-call" href={PHONE_HREF} aria-label={`Call What's The Buzz? at ${PHONE_DISPLAY}`}><Phone size={16} /><span>{PHONE_DISPLAY}</span></a>
          <a className="alpine-header-book" href="/book"><CalendarDays size={15} /><span className="header-book-long">Book appointment</span><span className="header-book-short">Book</span></a>
        </div>
      </header>

      <main id="main-content">
        <section className="alpine-hero" id="top">
          <div className="alpine-hero-media" role="img" aria-label="Barbershop chair, storefront, and a finished haircut">
            <img className="alpine-hero-image alpine-hero-image-1" src="/mountain-interior.jpg" alt="" aria-hidden="true" />
            <img className="alpine-hero-image alpine-hero-image-2" src="/gallery-storefront.png" alt="" aria-hidden="true" />
            <img className="alpine-hero-image alpine-hero-image-3" src="/hero-barber.jpg" alt="" aria-hidden="true" />
          </div>
          <div className="alpine-hero-shade" aria-hidden="true" />
          <div className="alpine-hero-copy">
            <p className="alpine-kicker"><Sparkles size={22} /> Style, service, confidence <span>Schofield, Wisconsin</span></p>
            <h1>A cut above.<br />Built for <em>more.</em></h1>
            <p className="alpine-lede">Precision cuts. Friendly service.<br />A neighborhood shop built around you.</p>
            <div className="alpine-actions">
              <a className="alpine-button alpine-button-gold" href="/book">Book now <ArrowRight size={16} /></a>
              <a className="alpine-button alpine-button-line" href="#services">Our services</a>
            </div>
            <a className="alpine-rating" href={REVIEWS_URL} target="_blank" rel="noreferrer"><Stars /><span><strong>4.8</strong> · 39 Google reviews</span></a>
          </div>
          <div className="alpine-live" aria-live="polite"><i className={status.isOpen ? "is-open" : ""} /><span>{status.label}</span><strong>Walk-ins welcome</strong></div>
          <a className="alpine-scroll" href="#craft" aria-label="Scroll to our craft"><span>Scroll</span><i><ArrowDown size={17} /></i></a>
        </section>

        <section className="alpine-craft" id="craft">
          <img src="/mountain-craft.jpg" alt="A barber carefully finishing a precision haircut" />
          <div className="alpine-craft-shade" aria-hidden="true" />
          <div className="alpine-craft-copy" data-alpine-reveal>
            <p className="alpine-kicker"><Sparkles size={22} /> Our craft <span>Service is everything</span></p>
            <h2>More than a cut.<br />It is an <em>experience.</em></h2>
            <p>Consistent cuts, friendly service, and thoughtful finishing touches for adults, kids, and every style that walks through the door.</p>
            <div className="alpine-facts"><span><Check size={14} /> Walk-ins welcome</span><span><Check size={14} /> Good for kids</span><span><Check size={14} /> Beverages offered</span></div>
            <a className="alpine-button alpine-button-gold" href="#visit">Find the chair</a>
          </div>

          <div className="alpine-service-tray" id="services" data-alpine-reveal>
            {serviceFeatures.map((service) => {
              const Icon = service.icon;
              return <article key={service.title} tabIndex={0}><Icon size={27} strokeWidth={1.35} /><h3>{service.title}</h3><p>{service.copy}</p><div className="service-detail-popover">{service.items.map((item) => <span key={item}>{item}</span>)}</div></article>;
            })}
          </div>
        </section>

        <section className="alpine-experience" id="gallery">
          <div className="alpine-section-heading" data-alpine-reveal>
            <div><p className="alpine-kicker"><Sparkles size={22} /> The What&apos;s The Buzz? experience</p><h2>Built on quality.<br />Focused on <em>you.</em></h2></div>
            <a className="alpine-button alpine-button-line" href={PROFILE_URL} target="_blank" rel="noreferrer"><Camera size={15} /> View Google profile</a>
          </div>

          <div className="alpine-gallery-wrap" data-alpine-reveal>
            <button onClick={() => setGalleryIndex((index) => (index + gallery.length - 1) % gallery.length)} aria-label="Previous gallery image"><ChevronLeft size={20} /></button>
            <div className="alpine-gallery" key={galleryIndex}>{orderedGallery.map((item, index) => <figure className={`gallery-item gallery-item-${index + 1}`} key={item.label}><img src={item.image} alt={item.alt} /><figcaption>{item.label}</figcaption></figure>)}</div>
            <button onClick={() => setGalleryIndex((index) => (index + 1) % gallery.length)} aria-label="Next gallery image"><ChevronRight size={20} /></button>
          </div>

          <div className="alpine-reviews" id="reviews">
            <div className="alpine-review-list" data-alpine-reveal>
              <p className="alpine-subheading">What our clients say</p>
              <div>{reviews.map((review) => <article key={review.name}><Stars /><blockquote>{review.quote}</blockquote><strong>— {review.name}</strong></article>)}</div>
            </div>
            <aside className="alpine-review-cta" data-alpine-reveal><p className="alpine-kicker"><Sparkles size={20} /> Ready for the chair?</p><h2>Come get<br />sharpened up.</h2><p>Reserve your appointment and experience What&apos;s The Buzz?</p><a className="alpine-button alpine-button-gold" href="/book">Book appointment</a></aside>
          </div>
        </section>

        <section className="alpine-visit" id="visit">
          <div className="alpine-visit-info" data-alpine-reveal>
            <div><p className="alpine-kicker"><MapPin size={20} /> Find us in Schofield</p><h2>On Schofield<br /><em>Avenue.</em></h2><p>Visit Suite 1 for an easy, friendly neighborhood barbershop experience. Walk-ins and online booking are both welcome.</p><address>2215 Schofield Ave #1<br />Schofield, WI 54476</address><div className="alpine-actions"><a className="alpine-button alpine-button-gold" href={DIRECTIONS_URL} target="_blank" rel="noreferrer">Get directions</a><a className="alpine-button alpine-button-line" href={PHONE_HREF}><Phone size={15} /> {PHONE_DISPLAY}</a></div></div>
            <div className="alpine-hours"><div className="alpine-hours-head"><Clock3 size={21} /><span><small>Shop hours</small><strong>{status.label}</strong></span></div><dl>{hoursRows.map(([day, hours]) => <div key={day}><dt>{day}</dt><dd>{hours}</dd></div>)}</dl><p>Call ahead when timing matters, or reserve your chair online.</p></div>
          </div>
          <div className="alpine-map">
            <iframe title="Interactive Google Map showing What's The Buzz? in Schofield, Wisconsin" src="https://www.google.com/maps?q=2215%20Schofield%20Ave%20%231%2C%20Schofield%2C%20WI%2054476&z=15&output=embed" loading="lazy" referrerPolicy="no-referrer-when-downgrade" allowFullScreen />
            <div className="alpine-map-label"><MapPin size={19} /><span><strong>What&apos;s The Buzz?</strong><small>2215 Schofield Ave #1 · Schofield, Wisconsin</small></span><a href={DIRECTIONS_URL} target="_blank" rel="noreferrer">Open directions <ArrowRight size={15} /></a></div>
          </div>
        </section>
      </main>

      <footer className="alpine-footer">
        <div><a href="#top"><BrandLogo footer /></a><p>Friendly service. Consistent craft.<br />A cut above.</p><a href={PROFILE_URL} target="_blank" rel="noreferrer"><Camera size={17} /> Google profile</a></div>
        <div><h2>Quick links</h2><a href="#craft">About</a><a href="#services">Services</a><a href="#gallery">Gallery</a><a href="#reviews">Reviews</a><a href="#visit">Contact</a></div>
        <div><h2>Visit</h2><p>2215 Schofield Ave #1<br />Schofield, WI 54476</p><a href={PHONE_HREF}>{PHONE_DISPLAY}</a><a href="/owner">Owner studio</a></div>
        <div><h2>Ready?</h2><p>Walk-ins and appointments welcome.</p><a className="alpine-button alpine-button-gold" href="/book">Book your chair</a></div>
        <p className="alpine-copyright">© 2026 What&apos;s The Buzz? · Schofield, Wisconsin</p>
      </footer>

      <div className="alpine-mobile-actions"><a href="/book"><CalendarDays size={18} /> Book</a><a href={PHONE_HREF}><Phone size={18} /> Call</a></div>
    </div>
  );
}
