"use client";

import {
  ArrowRight,
  Camera,
  Check,
  ChevronDown,
  Clock3,
  MapPin,
  Mountain,
  Phone,
  Scissors,
  Star,
} from "lucide-react";
import { useEffect, useState } from "react";

const PHONE_DISPLAY = "(503) 744-2884";
const PHONE_HREF = "tel:+15037442884";
const INSTAGRAM_URL = "https://www.instagram.com/barberonthemountain";
const REVIEWS_URL =
  "https://www.google.com/search?q=barber+on+the+mountain+welches+oregon";
const DIRECTIONS_URL =
  "https://www.google.com/maps/dir/?api=1&destination=68216%20US-26%2C%20Welches%2C%20OR%2097067";

type HoursWindow = [number, number];

const SHOP_HOURS: Record<string, HoursWindow[]> = {
  Sun: [],
  Mon: [[540, 1440]],
  Tue: [
    [0, 390],
    [540, 1110],
  ],
  Wed: [[540, 1020]],
  Thu: [[540, 1110]],
  Fri: [[540, 1110]],
  Sat: [[540, 1020]],
};

const DAY_ORDER = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DAY_NAMES: Record<string, string> = {
  Sun: "Sunday",
  Mon: "Monday",
  Tue: "Tuesday",
  Wed: "Wednesday",
  Thu: "Thursday",
  Fri: "Friday",
  Sat: "Saturday",
};

const hoursRows = [
  ["Monday", "9 AM - midnight"],
  ["Tuesday", "12 - 6:30 AM / 9 AM - 6:30 PM"],
  ["Wednesday", "9 AM - 5 PM"],
  ["Thursday", "9 AM - 6:30 PM"],
  ["Friday", "9 AM - 6:30 PM"],
  ["Saturday", "9 AM - 5 PM"],
  ["Sunday", "Closed"],
];

const serviceGroups = [
  {
    number: "01",
    title: "Cuts",
    description: "Clean shape, sharp finish, and a cut that grows out right.",
    services: [
      "Haircut",
      "Custom cut",
      "Fade cut",
      "Buzz cut",
      "Scissor cut",
      "Long haircut",
      "Curly hair",
    ],
  },
  {
    number: "02",
    title: "Shaves",
    description: "Traditional detail work with modern precision and comfort.",
    services: [
      "Beard trim",
      "Beard maintenance",
      "Hot towel shave",
      "Head shave",
      "Eyebrow trimming",
    ],
  },
  {
    number: "03",
    title: "Freshen up",
    description: "The finishing touches that leave you reset for the road ahead.",
    services: ["Kids' cuts", "Shampoo & conditioning", "Shave"],
  },
];

const reviews = [
  {
    quote: "Great vibe, great service and great haircut!",
    name: "Belinda Hughes",
    detail: "Local Guide",
  },
  {
    quote: "One of the best cuts I have gotten in years!",
    name: "Colin Schacht",
    detail: "Google review",
  },
  {
    quote: "Best haircut experience I have ever had.",
    name: "Brent Mitchell",
    detail: "Google review",
  },
];

function formatTime(minutes: number) {
  if (minutes === 1440 || minutes === 0) return "midnight";
  const hour = Math.floor(minutes / 60);
  const minute = minutes % 60;
  const suffix = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 || 12;
  return `${displayHour}${minute ? `:${String(minute).padStart(2, "0")}` : ""} ${suffix}`;
}

function getShopStatus(date: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Los_Angeles",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);

  const weekday = parts.find((part) => part.type === "weekday")?.value ?? "Sun";
  const hour = Number(parts.find((part) => part.type === "hour")?.value ?? 0);
  const minute = Number(parts.find((part) => part.type === "minute")?.value ?? 0);
  const currentMinute = hour * 60 + minute;
  const today = SHOP_HOURS[weekday];
  const activeWindow = today.find(
    ([start, end]) => currentMinute >= start && currentMinute < end,
  );

  if (activeWindow) {
    return {
      isOpen: true,
      label: `Open now - until ${formatTime(activeWindow[1])}`,
    };
  }

  const laterToday = today.find(([start]) => start > currentMinute);
  if (laterToday) {
    return {
      isOpen: false,
      label: `Closed now - opens ${formatTime(laterToday[0])}`,
    };
  }

  const todayIndex = DAY_ORDER.indexOf(weekday);
  for (let offset = 1; offset <= 7; offset += 1) {
    const nextDay = DAY_ORDER[(todayIndex + offset) % 7];
    const nextWindow = SHOP_HOURS[nextDay][0];
    if (nextWindow) {
      return {
        isOpen: false,
        label: `Closed now - opens ${DAY_NAMES[nextDay]} at ${formatTime(nextWindow[0])}`,
      };
    }
  }

  return { isOpen: false, label: "Call for today's availability" };
}

function StarRow({ dark = false }: { dark?: boolean }) {
  return (
    <span className={`star-row${dark ? " star-row-dark" : ""}`} aria-label="5 out of 5 stars">
      {Array.from({ length: 5 }).map((_, index) => (
        <Star key={index} size={16} strokeWidth={2} fill="currentColor" aria-hidden="true" />
      ))}
    </span>
  );
}

function BrandMark() {
  return (
    <span className="brand-mark" aria-hidden="true">
      <Mountain className="brand-mountain" size={25} strokeWidth={1.8} />
      <Scissors className="brand-scissors" size={16} strokeWidth={2} />
    </span>
  );
}

export function BarberSite() {
  const [status, setStatus] = useState({
    isOpen: true,
    label: "Walk-ins welcome today",
  });

  useEffect(() => {
    const updateStatus = () => setStatus(getShopStatus(new Date()));
    updateStatus();
    const statusTimer = window.setInterval(updateStatus, 60_000);

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const revealItems = document.querySelectorAll<HTMLElement>("[data-reveal]");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -7%" },
    );

    revealItems.forEach((item) => observer.observe(item));

    let ticking = false;
    const updateScroll = () => {
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      const progress = maxScroll > 0 ? window.scrollY / maxScroll : 0;
      document.documentElement.style.setProperty(
        "--scroll-progress",
        String(Math.min(1, Math.max(0, progress))),
      );

      if (!prefersReducedMotion) {
        document.documentElement.style.setProperty(
          "--hero-shift",
          `${Math.min(window.scrollY * 0.09, 52)}px`,
        );
      }
      ticking = false;
    };

    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(updateScroll);
        ticking = true;
      }
    };

    updateScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      window.clearInterval(statusTimer);
      observer.disconnect();
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return (
    <div className="site-shell">
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <div className="scroll-progress" aria-hidden="true" />

      <div className="status-bar">
        <div className="page-width status-inner">
          <div className="live-status" aria-live="polite">
            <span className={`status-dot${status.isOpen ? " is-open" : ""}`} />
            <span>{status.label}</span>
            <span className="status-separator" aria-hidden="true" />
            <strong>Walk-ins welcome</strong>
          </div>
          <div className="status-links">
            <a href={PHONE_HREF}>
              <Phone size={14} aria-hidden="true" />
              {PHONE_DISPLAY}
            </a>
            <a href={DIRECTIONS_URL} target="_blank" rel="noreferrer">
              <MapPin size={14} aria-hidden="true" />
              Welches, Oregon
            </a>
          </div>
        </div>
      </div>

      <header className="site-header">
        <div className="page-width nav-inner">
          <a className="wordmark" href="#top" aria-label="Barber on the Mountain home">
            <BrandMark />
            <span>
              <strong>Barber</strong>
              <small>on the Mountain</small>
            </span>
          </a>

          <nav className="desktop-nav" aria-label="Primary navigation">
            <a href="#services">Services</a>
            <a href="#reviews">Reviews</a>
            <a href="#visit">Hours & location</a>
          </nav>

          <div className="nav-actions">
            <a
              className="icon-link"
              href={INSTAGRAM_URL}
              target="_blank"
              rel="noreferrer"
              aria-label="Visit Barber on the Mountain on Instagram"
              title="Instagram"
            >
              <Camera size={20} aria-hidden="true" />
            </a>
            <a className="button button-small button-dark" href={PHONE_HREF}>
              <Phone size={17} aria-hidden="true" />
              Call now
            </a>
          </div>
        </div>
      </header>

      <main id="main-content">
        <section className="hero" id="top" aria-labelledby="hero-title">
          <div className="hero-visual" aria-hidden="true">
            <img
              src="/hero-barber.jpg"
              alt=""
              width="1672"
              height="941"
              fetchPriority="high"
            />
          </div>
          <div className="hero-scrim" aria-hidden="true" />
          <div className="hero-grid" aria-hidden="true" />
          <div className="hero-side-label" aria-hidden="true">
            US-26 / WELCHES / OREGON
          </div>

          <div className="page-width hero-content">
            <div className="hero-copy">
              <div className="hero-kicker hero-enter">
                <span>Classic craft</span>
                <span className="kicker-line" />
                <span>Modern finish</span>
              </div>
              <h1 className="hero-enter hero-enter-two" id="hero-title">
                Barber on
                <span>the Mountain</span>
              </h1>
              <p className="hero-lede hero-enter hero-enter-three">
                Precision cuts, clean fades, hot towel shaves, and an easygoing
                mountain welcome. Walk in, sharpen up, and head out confident.
              </p>
              <div className="hero-actions hero-enter hero-enter-four">
                <a className="button button-primary" href={PHONE_HREF}>
                  <Phone size={19} aria-hidden="true" />
                  Call for a cut
                  <ArrowRight size={18} aria-hidden="true" />
                </a>
                <a
                  className="button button-ghost-light"
                  href={DIRECTIONS_URL}
                  target="_blank"
                  rel="noreferrer"
                >
                  <MapPin size={19} aria-hidden="true" />
                  Get directions
                </a>
              </div>
              <div className="hero-proof hero-enter hero-enter-five">
                <StarRow dark />
                <a href={REVIEWS_URL} target="_blank" rel="noreferrer">
                  <strong>5.0</strong> from 8 Google reviews
                  <ArrowRight size={15} aria-hidden="true" />
                </a>
              </div>
            </div>

            <a className="scroll-cue" href="#welcome" aria-label="Scroll to learn more">
              <span>Made for mountain life</span>
              <ChevronDown size={19} aria-hidden="true" />
            </a>
          </div>
        </section>

        <section className="proof-band" id="welcome">
          <div className="page-width proof-band-inner" data-reveal>
            <div className="proof-score">
              <span className="proof-number">5.0</span>
              <div>
                <StarRow />
                <p>Every review is five stars</p>
              </div>
            </div>
            <blockquote>
              "Great to finally have a barber on the mountain."
            </blockquote>
            <a className="text-link" href={REVIEWS_URL} target="_blank" rel="noreferrer">
              Read all reviews
              <ArrowRight size={17} aria-hidden="true" />
            </a>
          </div>
        </section>

        <section className="intro-section section-pad">
          <div className="page-width intro-grid">
            <div className="section-label" data-reveal>
              <span>01</span>
              <p>Your local chair</p>
            </div>
            <div className="intro-copy" data-reveal>
              <p className="eyebrow">Built for the mountain community</p>
              <h2>
                The cut you would drive to town for.
                <em> Now it is right here.</em>
              </h2>
              <p className="intro-body">
                A classic-meets-modern shop serving locals, visitors, skiers,
                hikers, bikers, hunters, fishermen, veterans, first responders,
                and every kid who needs a patient barber.
              </p>
            </div>
            <div className="intro-facts" data-reveal>
              <div>
                <Check size={21} aria-hidden="true" />
                <span>Walk-ins welcome</span>
              </div>
              <div>
                <Check size={21} aria-hidden="true" />
                <span>Good for kids</span>
              </div>
              <div>
                <Check size={21} aria-hidden="true" />
                <span>Appointments available</span>
              </div>
            </div>
          </div>
        </section>

        <div className="service-marquee" aria-hidden="true">
          <div className="marquee-track">
            <span>FADE CUTS</span><Scissors /><span>BEARD TRIMS</span><Scissors />
            <span>KIDS' CUTS</span><Scissors /><span>HOT TOWEL SHAVES</span><Scissors />
            <span>SCISSOR CUTS</span><Scissors /><span>BUZZ CUTS</span><Scissors />
            <span>FADE CUTS</span><Scissors /><span>BEARD TRIMS</span><Scissors />
            <span>KIDS' CUTS</span><Scissors /><span>HOT TOWEL SHAVES</span><Scissors />
            <span>SCISSOR CUTS</span><Scissors /><span>BUZZ CUTS</span><Scissors />
          </div>
        </div>

        <section className="services-section section-pad" id="services">
          <div className="page-width">
            <div className="section-heading" data-reveal>
              <div>
                <p className="eyebrow">Cuts, shaves, and clean finishes</p>
                <h2>Choose your refresh.</h2>
              </div>
              <p>
                No complicated menu. Tell us what you are after, settle into the
                chair, and leave feeling like yourself on a very good day.
              </p>
            </div>

            <div className="service-grid">
              {serviceGroups.map((group, index) => (
                <article
                  className="service-card"
                  data-reveal
                  style={{ "--delay": `${index * 90}ms` } as React.CSSProperties}
                  key={group.title}
                >
                  <div className="service-card-top">
                    <span>{group.number}</span>
                    <Scissors size={25} strokeWidth={1.6} aria-hidden="true" />
                  </div>
                  <h3>{group.title}</h3>
                  <p>{group.description}</p>
                  <ul>
                    {group.services.map((service) => (
                      <li key={service}>
                        <span>{service}</span>
                        <ArrowRight size={14} aria-hidden="true" />
                      </li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="process-section section-pad">
          <div className="ridge ridge-one" aria-hidden="true" />
          <div className="ridge ridge-two" aria-hidden="true" />
          <div className="page-width process-inner">
            <div className="process-heading" data-reveal>
              <p className="eyebrow">Simple by design</p>
              <h2>Walk in rough. Walk out ready.</h2>
            </div>
            <div className="process-list">
              <div className="process-step" data-reveal>
                <span>01</span>
                <div>
                  <h3>Drop in</h3>
                  <p>Walk-ins are welcome. Call first if you want to check the wait.</p>
                </div>
              </div>
              <div className="process-step" data-reveal>
                <span>02</span>
                <div>
                  <h3>Settle in</h3>
                  <p>Bring a reference or describe the look. We will take it from there.</p>
                </div>
              </div>
              <div className="process-step" data-reveal>
                <span>03</span>
                <div>
                  <h3>Head out sharp</h3>
                  <p>Fresh, confident, and ready for wherever the mountain takes you.</p>
                </div>
              </div>
            </div>
            <div className="process-actions" data-reveal>
              <a className="button button-primary" href={PHONE_HREF}>
                <Phone size={19} aria-hidden="true" />
                Check the wait
              </a>
              <span>No online form. Just a real person on the other end.</span>
            </div>
          </div>
        </section>

        <section className="reviews-section section-pad" id="reviews">
          <div className="page-width">
            <div className="section-heading reviews-heading" data-reveal>
              <div>
                <p className="eyebrow">Straight from the chair</p>
                <h2>Mountain-approved.</h2>
              </div>
              <div className="rating-lockup">
                <span>5.0</span>
                <div>
                  <StarRow />
                  <p>8 Google reviews</p>
                </div>
              </div>
            </div>

            <div className="review-grid">
              {reviews.map((review, index) => (
                <article
                  className="review-card"
                  data-reveal
                  style={{ "--delay": `${index * 90}ms` } as React.CSSProperties}
                  key={review.name}
                >
                  <StarRow />
                  <blockquote>"{review.quote}"</blockquote>
                  <footer>
                    <span className="review-initial">{review.name.charAt(0)}</span>
                    <div>
                      <strong>{review.name}</strong>
                      <small>{review.detail}</small>
                    </div>
                  </footer>
                </article>
              ))}
            </div>

            <div className="reviews-cta" data-reveal>
              <p>Good cuts travel by word of mouth.</p>
              <a className="text-link" href={REVIEWS_URL} target="_blank" rel="noreferrer">
                View every Google review
                <ArrowRight size={17} aria-hidden="true" />
              </a>
            </div>
          </div>
        </section>

        <section className="visit-section" id="visit">
          <div className="visit-map" aria-hidden="true">
            <div className="road road-one" />
            <div className="road road-two" />
            <div className="map-pin-graphic">
              <MapPin size={38} strokeWidth={1.6} />
            </div>
            <span className="map-label label-welches">WELCHES</span>
            <span className="map-label label-highway">US-26</span>
            <span className="map-label label-hood">MT. HOOD</span>
          </div>
          <div className="page-width visit-grid">
            <div className="visit-copy" data-reveal>
              <p className="eyebrow">Find the chair</p>
              <h2>Right off US-26.</h2>
              <p>
                Inside Hoodland Shopping Center at the Thriftway Plaza. Easy in,
                easy out, and close to the road home.
              </p>
              <address>
                68216 US-26<br />
                Welches, OR 97067
              </address>
              <div className="visit-actions">
                <a
                  className="button button-primary"
                  href={DIRECTIONS_URL}
                  target="_blank"
                  rel="noreferrer"
                >
                  <MapPin size={19} aria-hidden="true" />
                  Get directions
                </a>
                <a className="button button-outline" href={PHONE_HREF}>
                  <Phone size={19} aria-hidden="true" />
                  {PHONE_DISPLAY}
                </a>
              </div>
            </div>

            <div className="hours-panel" data-reveal>
              <div className="hours-title">
                <Clock3 size={24} aria-hidden="true" />
                <div>
                  <span>Shop hours</span>
                  <strong>{status.label}</strong>
                </div>
              </div>
              <dl>
                {hoursRows.map(([day, hours]) => (
                  <div key={day}>
                    <dt>{day}</dt>
                    <dd>{hours}</dd>
                  </div>
                ))}
              </dl>
              <p>Hours can flex with mountain life. Call ahead when timing matters.</p>
            </div>
          </div>
        </section>

        <section className="final-cta">
          <div className="cta-lines" aria-hidden="true" />
          <div className="page-width final-cta-inner" data-reveal>
            <div>
              <p className="eyebrow">Your next good hair day starts here</p>
              <h2>Come get sharpened up.</h2>
            </div>
            <div className="final-actions">
              <a className="button button-light" href={PHONE_HREF}>
                <Phone size={19} aria-hidden="true" />
                Call {PHONE_DISPLAY}
              </a>
              <a
                className="button button-ghost-light"
                href={INSTAGRAM_URL}
                target="_blank"
                rel="noreferrer"
              >
                <Camera size={19} aria-hidden="true" />
                Follow on Instagram
              </a>
            </div>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="page-width footer-top">
          <a className="wordmark wordmark-footer" href="#top" aria-label="Back to top">
            <BrandMark />
            <span>
              <strong>Barber</strong>
              <small>on the Mountain</small>
            </span>
          </a>
          <p>Classic-meets-modern barbering in Welches, Oregon.</p>
          <div className="footer-links">
            <a href="#services">Services</a>
            <a href="#reviews">Reviews</a>
            <a href="#visit">Visit</a>
            <a href={INSTAGRAM_URL} target="_blank" rel="noreferrer">Instagram</a>
          </div>
        </div>
        <div className="page-width footer-bottom">
          <span>Barber on the Mountain</span>
          <span>Walk-ins and appointments welcome</span>
        </div>
      </footer>

      <div className="mobile-action-bar" aria-label="Quick actions">
        <a href={PHONE_HREF}>
          <Phone size={19} aria-hidden="true" />
          Call now
        </a>
        <a href={DIRECTIONS_URL} target="_blank" rel="noreferrer">
          <MapPin size={19} aria-hidden="true" />
          Directions
        </a>
      </div>
    </div>
  );
}
