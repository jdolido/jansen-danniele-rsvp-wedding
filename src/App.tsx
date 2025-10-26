import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import "./invitation.css";

type VenueDetail = {
  key: string;
  label: string;
  title: string;
  time: string;
  address: string;
  description: string;
  mapEmbed: string;
  googleLink: string;
  wazeLink: string;
  mapNote?: string;
  tips: string[];
  sketchSource?: string;
};

type EntourageSection = {
  key: string;
  title: string;
  items: string[];
  ordered?: boolean;
  columns?: boolean;
  groupHeading?: string;
};

export default function App() {

  const [welcomeStage, setWelcomeStage] = useState<'show' | 'closing' | 'hidden'>('show');
  const manualHideTimeoutRef = useRef<number | null>(null);

  // ensure larger default text size and clear legacy toggle preference
  useEffect(() => {
    document.documentElement.style.setProperty('--font-scale', '1.12');
    try { localStorage.removeItem('text_scale_v1'); } catch {}
  }, []);

  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [attendance, setAttendance] = useState<string>("");
  const [guests, setGuests] = useState<number | "">("");
  const [highChair, setHighChair] = useState<string>("");
  const [highChairCount, setHighChairCount] = useState<number | "">("");
  const [firstName, setFirstName] = useState<string>("");
  const [lastName, setLastName] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});

  const [dressModalOpen, setDressModalOpen] = useState(false);
  const [generatedSketches, setGeneratedSketches] = useState<Record<string, string>>({});
  const navContainerRef = useRef<HTMLDivElement | null>(null);
  const navScrollerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (welcomeStage === 'hidden') {
      document.body.style.overflow = '';
      return;
    }
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [welcomeStage]);

  const dismissWelcome = useCallback(() => {
    if (welcomeStage === 'hidden' || manualHideTimeoutRef.current != null) return;
    setWelcomeStage('closing');
    manualHideTimeoutRef.current = window.setTimeout(() => {
      setWelcomeStage('hidden');
      manualHideTimeoutRef.current = null;
    }, 420);
  }, [welcomeStage]);

  const updateNavGradients = useCallback(() => {
    const container = navContainerRef.current;
    const scroller = navScrollerRef.current;
    if (!container || !scroller) return;
    const atStart = scroller.scrollLeft <= 1;
    const atEnd = scroller.scrollLeft + scroller.clientWidth >= scroller.scrollWidth - 1;
    const canScroll = scroller.scrollWidth > scroller.clientWidth + 2;
    container.classList.toggle('show-left', canScroll && !atStart);
    container.classList.toggle('show-right', canScroll && !atEnd);
  }, []);

  const syncNavToPageScroll = useCallback(() => {
    const scroller = navScrollerRef.current;
    if (!scroller) return;
    const maxNavScroll = scroller.scrollWidth - scroller.clientWidth;
    const scrollablePage = document.documentElement.scrollHeight - window.innerHeight;
    if (maxNavScroll <= 0 || scrollablePage <= 0 || window.innerWidth >= 768) {
      if (scroller.scrollLeft !== 0) scroller.scrollLeft = 0;
      updateNavGradients();
      return;
    }
    const progress = Math.min(1, Math.max(0, window.scrollY / scrollablePage));
    scroller.scrollLeft = progress * maxNavScroll;
    updateNavGradients();
  }, [updateNavGradients]);

  // Simple hash-based route: '' or 'home' for main site, 'entourage' for separate page
  const initialRoute = (window.location.hash || '').replace('#/', '').replace('#', '') || 'home';
  const [route, setRoute] = useState<string>(initialRoute);

  useEffect(() => {
    const onHash = () => {
      const next = (window.location.hash || '').replace('#/', '').replace('#', '') || 'home';
      setRoute(next);
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  useEffect(() => {
    updateNavGradients();
    const scroller = navScrollerRef.current;
    if (!scroller) return;
    const handle = () => updateNavGradients();
    scroller.addEventListener('scroll', handle, { passive: true });
    window.addEventListener('resize', handle);
    return () => {
      scroller.removeEventListener('scroll', handle);
      window.removeEventListener('resize', handle);
    };
  }, [route, updateNavGradients]);

  useEffect(() => {
    const onScroll = () => syncNavToPageScroll();
    const onResize = () => syncNavToPageScroll();
    syncNavToPageScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
    };
  }, [syncNavToPageScroll]);


  // re-register fade-in observers whenever the rendered route changes
  useEffect(() => {
    const nodes = Array.from(document.querySelectorAll('[data-animate]')) as HTMLElement[];
    if (!nodes.length) return;
    const io = new IntersectionObserver((entries) => {
      entries.forEach((ent) => {
        if (ent.isIntersecting) ent.target.classList.add('in-view');
        else ent.target.classList.remove('in-view');
      });
    }, { threshold: 0.12 });
    nodes.forEach((n) => io.observe(n));
    return () => io.disconnect();
  }, [route]);

  const STORAGE_KEY = "rsvp_form_v1";

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        setFirstName(parsed.firstName || "");
        setLastName(parsed.lastName || "");
        setAttendance(parsed.attendance || "");
        setGuests(parsed.guests ?? 1);
        setHighChair(parsed.highChair || "");
        setHighChairCount(parsed.highChairCount ?? "");
        setMessage(parsed.message || "");
      }
    } catch (e) {
      // ignore parse errors
    }
  }, []);

  useEffect(() => {
    const payload = { firstName, lastName, attendance, guests, highChair, highChairCount, message };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch (e) {
      // ignore storage write errors
    }
  }, [firstName, lastName, attendance, guests, highChair, highChairCount, message]);

  const venues = useMemo<VenueDetail[]>(() => ([
    {
      key: 'ceremony',
      label: 'Ceremony',
      title: 'St. Ferdinand Cathedral',
      time: 'Processional starts at 2:00 PM • Kindly be seated by 1:30 PM',
      address: 'Quezon Ave. St, Lucena City, Quezon',
      description: 'Our vows will be held in the heart of Lucena City. Enter through the cathedral doors along Quezon Ave. Street—ushers will guide you to the reserved pews near the center aisle.',
      mapEmbed: 'https://www.google.com/maps?q=St.+Ferdinand+Cathedral,+Lucena+City&output=embed',
      googleLink: 'https://maps.google.com/?q=St.+Ferdinand+Cathedral,+Lucena+City',
      wazeLink: 'https://waze.com/ul?q=St.%20Ferdinand%20Cathedral%20Lucena&navigate=yes',
      mapNote: 'The pin lands on the Quezon Ave. Street frontage; limited paid parking is available beside the parish office and across the street near the plaza.',
      tips: [
        ],
      sketchSource: '/assets/church-image.jpg',
    },
    {
      key: 'reception',
      label: 'Reception',
      title: 'Potch Restaurant Grand Banquet Hall',
      time: 'Cocktails at 5:00 PM • Dinner program begins at 6:00 PM',
      address: 'Quezon Eco Tourism Road, Lucena City, Quezon',
      description: 'Celebrate with us at Potch Restaurant’s Grand Banquet Hall, a 20-minute drive from the cathedral. The reception gate sits along Quezon Eco Tourism Road.',
      mapEmbed: 'https://www.google.com/maps?q=Potch+Restaurant+Grand+Banquet+Hall,+Lucena+City&output=embed',
      googleLink: 'https://maps.google.com/?q=Potch+Restaurant+Grand+Banquet+Hall,+Lucena+City',
      wazeLink: 'https://waze.com/ul?q=Potch%20Restaurant%20Grand%20Banquet%20Hall%20Lucena&navigate=yes',
      mapNote: 'On-site parking is available through the main gate; attendants will direct you to the covered slots behind the hall.',
      tips: [
        'A welcome drink station opens at 5:00 PM; light snacks and "tusok-tusok" are ready for early arrivals.',
      ],
      sketchSource: '/assets/potch-grand-banquet.jpg',
    },
  ]), []);

  useEffect(() => {
    let canceled = false;

    const generateSketch = (src: string) => {
      return new Promise<string>((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = src;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Canvas context unavailable'));
            return;
          }
          ctx.drawImage(img, 0, 0);
          const { data, width, height } = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const pixelCount = width * height;
          const gray = new Float32Array(pixelCount);

          for (let i = 0; i < pixelCount; i++) {
            const idx = i * 4;
            gray[i] = data[idx] * 0.299 + data[idx + 1] * 0.587 + data[idx + 2] * 0.114;
          }

          const output = ctx.createImageData(width, height);
          const sobelX = [-1, 0, 1, -2, 0, 2, -1, 0, 1];
          const sobelY = [-1, -2, -1, 0, 0, 0, 1, 2, 1];

          for (let i = 0; i < output.data.length; i += 4) {
            output.data[i] = 255;
            output.data[i + 1] = 255;
            output.data[i + 2] = 255;
            output.data[i + 3] = 255;
          }

          for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
              const idx = y * width + x;
              let gx = 0;
              let gy = 0;
              let k = 0;

              for (let ky = -1; ky <= 1; ky++) {
                for (let kx = -1; kx <= 1; kx++) {
                  const pixel = gray[idx + ky * width + kx];
                  gx += pixel * sobelX[k];
                  gy += pixel * sobelY[k];
                  k++;
                }
              }

              let magnitude = Math.sqrt(gx * gx + gy * gy) * 0.9;
              magnitude = Math.max(0, Math.min(255, magnitude));
              const val = 255 - magnitude;
              const outIdx = idx * 4;
              output.data[outIdx] = val;
              output.data[outIdx + 1] = val;
              output.data[outIdx + 2] = val;
              output.data[outIdx + 3] = 255;
            }
          }

          ctx.putImageData(output, 0, 0);
          resolve(canvas.toDataURL('image/png'));
        };
        img.onerror = () => reject(new Error('Unable to load source image'));
      });
    };

    const sketchTargets = venues.filter((v) => v.sketchSource);
    sketchTargets.forEach((venue) => {
      const src = venue.sketchSource!;
      generateSketch(src)
        .then((url) => {
          if (!canceled) {
            setGeneratedSketches((prev) => ({ ...prev, [venue.key]: url }));
          }
        })
        .catch(() => {
          /* ignore sketch generation errors */
        });
    });

    return () => {
      canceled = true;
    };
  }, [venues]);

  const ceremonySketchUrl = generatedSketches['ceremony'];
  const receptionSketchUrl = generatedSketches['reception'];

  const smoothScroll = (id: string) => {
    const target = document.getElementById(id);
    if (target) {
      const yOffset = -70;
      const y = target.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  };

  const dressBadges = ['Filipiniana', 'Puffed Sleeves', 'Barong', 'Pastels', 'Floral Pins'];

  const qrOptions = useMemo(() => ([
    {
      key: 'bpi',
      title: 'BPI QR • Danniele',
      description: 'Scan this BPI QR using your BPI banking app and confirm the recipient name before sending.',
      src: '/assets/bpi-qr-danniele.png',
      filename: 'bpi-qr-danniele.png',
    },
    {
      key: 'gcash',
      title: 'GCash QR • Danniele',
      description: 'Use your GCash app to scan and confirm the number ends with 4487 before you finalize the transfer.',
      src: '/assets/gcash-qr-danniele.png',
      filename: 'gcash-qr-danniele.png',
    },
  ]), []);

  const [qrStatus, setQrStatus] = useState<Record<string, 'saving' | 'saved' | 'error'>>({});

  const downloadQr = useCallback(async (key: string, src: string, filename: string) => {
    setQrStatus((prev) => ({ ...prev, [key]: 'saving' }));
    const absoluteUrl = src.startsWith('http') ? src : new URL(src, window.location.origin).toString();
    try {
      const resp = await fetch(absoluteUrl);
      if (!resp.ok) throw new Error(`Failed to fetch QR (${resp.status})`);
      const blob = await resp.blob();
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = filename;
      link.rel = 'noopener';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1200);
      setQrStatus((prev) => ({ ...prev, [key]: 'saved' }));
      window.setTimeout(() => {
        setQrStatus((prev) => {
          if (prev[key] !== 'saved') return prev;
          const next = { ...prev };
          delete next[key];
          return next;
        });
      }, 4000);
    } catch (err) {
      const opened = window.open(absoluteUrl, '_blank', 'noopener');
      if (!opened) {
        alert('Please long press or take a screenshot of the QR code to save it to your device.');
      }
      setQrStatus((prev) => ({ ...prev, [key]: 'error' }));
      window.setTimeout(() => {
        setQrStatus((prev) => {
          if (prev[key] !== 'error') return prev;
          const next = { ...prev };
          delete next[key];
          return next;
        });
      }, 5000);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const nextErrors: { [k: string]: string } = {};
    if (!lastName.trim()) nextErrors.lastName = "Please enter your last name.";
    if (!firstName.trim()) nextErrors.firstName = "Please enter your first name.";
    if (!attendance) nextErrors.attendance = "Please select whether you'll attend.";
    if (attendance === "Yes" && (guests === "" || Number(guests) < 1)) nextErrors.guests = "Please provide the number of guests (minimum 1) when attending.";
    if (attendance === "Yes" && !highChair) nextErrors.highChair = "Please indicate whether you need a high chair.";
    if (attendance === "Yes" && highChair === "Yes" && (highChairCount === "" || Number(highChairCount) < 1)) nextErrors.highChairCount = "Please provide how many high chairs you need.";

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      const firstMessage = Object.values(nextErrors).find(Boolean);
      if (firstMessage) alert(firstMessage);
      return;
    }

    const fullName = `${lastName.trim()}, ${firstName.trim()}`;
    const data = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      name: fullName,
      attendance,
      guests: guests === "" ? null : guests,
      highChair: highChair || "",
      highChairCount: highChairCount === "" ? null : highChairCount,
      message,
    };

    try {
      setLoading(true);
      const url = "https://script.google.com/macros/s/AKfycbwETT8PYztSE02YihPf4wHl2CNSKqzT0IIAK5L-EsIZ83RpnFcKFzdqKyJKWhNWyBFVaA/exec";
      const params = new URLSearchParams();
      Object.entries(data).forEach(([k, v]) => params.append(k, v == null ? "" : String(v)));
      const resp = await fetch(url, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: params.toString() });
      if (!resp.ok) throw new Error(`Server returned ${resp.status}`);
      await resp.json().catch(() => ({}));
      setSubmitted(true);
      try { localStorage.removeItem(STORAGE_KEY); } catch (e) {}
    } catch (err) {
      alert("There was an issue submitting your RSVP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (route === 'entourage') {
    return <EntouragePage onBack={() => { window.location.hash = ''; setRoute('home'); }} />;
  }

  return (
    <div className="app-content font-sans text-gray-800 relative z-10">
      {welcomeStage !== 'hidden' ? (
        <div
          className={`welcome-overlay ${welcomeStage === 'closing' ? 'closing' : ''}`}
          role="dialog"
          aria-modal="true"
          aria-labelledby="welcome-dialog-title"
          aria-describedby="welcome-dialog-subtitle"
        >
          <div className={`welcome-card ${welcomeStage === 'closing' ? 'closing' : ''}`}>
            <div className="welcome-bloom" aria-hidden="true"></div>
            <p className="welcome-greeting font-script">Mabuhay &amp; Welcome</p>
            <h2 id="welcome-dialog-title" className="welcome-names font-script">Jansen &amp; Danniele</h2>
            <p id="welcome-dialog-subtitle" className="welcome-subtitle">December 29, 2025 • Lucena City</p>
            <p className="welcome-note">We’re so grateful to celebrate with you—find the schedule, venues, attire inspiration, and RSVP details inside.</p>
            <button
              type="button"
              className="welcome-skip theme-btn"
              onClick={dismissWelcome}
            >
              Enter Site
            </button>
            <p className="welcome-tip">Using Messenger or Facebook’s browser? For the best experience, open this link in Chrome so all maps and images load properly.</p>
          </div>
        </div>
      ) : null}
      <nav className="fixed w-full bg-white/60 backdrop-blur-md shadow z-20 theme-invitation-bg">
        <div className="max-w-4xl mx-auto flex justify-between items-center p-4">
          <div ref={navContainerRef} className="nav-container relative w-full">
            <div ref={navScrollerRef} className="nav-links flex gap-4 sm:gap-6 overflow-x-auto whitespace-nowrap py-1 px-1 sm:px-0">
            {['Home', 'Venues', 'Dress Code', 'Gifts', 'RSVP', 'Entourage'].map((label) => {
              const slug = label.toLowerCase().replace(/\s+/g, '-');
              if (slug === 'entourage') {
                return (
                  <button
                    key={label}
                    onClick={() => { window.location.hash = '/entourage'; }}
                    className="cursor-pointer hover:text-green-600 flex-shrink-0 px-2"
                  >
                    {label}
                  </button>
                );
              }
              return (
                <button
                  key={label}
                  onClick={() => { window.location.hash = ''; smoothScroll(slug); }}
                  className="cursor-pointer hover:text-green-600 flex-shrink-0 px-2"
                >
                  {label}
                </button>
              );
            })}
          </div>
            <div className="nav-gradient left" aria-hidden="true"></div>
            <div className="nav-gradient right" aria-hidden="true"></div>
          </div>
        </div>
      </nav>

      <section id="home" className="invitation-hero py-24" data-animate>
        <div className="hero-ribbon" aria-hidden="true"></div>
        <div className="max-w-4xl mx-auto text-center px-4">
          <h1 className="font-script hero-title anim" data-animate>Jansen & Danniele</h1>
          <p className="font-script sub-hero anim" data-animate>joyfully invite you to celebrate their union</p>
          <p className="hero-date anim" data-animate>12.29.2025</p>
        </div>
      </section>

  <section id="details" className="pt-16 pb-20 bg-transparent">
        <div className="max-w-3xl mx-auto text-center theme-panel p-8 rounded-xl">
          <h2 className="font-script invitation-heading">You are Invited!</h2>
          <p className="mt-6 text-lg theme-text-muted">With hearts full of love and gratitude,<br/><strong>Jansen</strong> and <strong>Danniele</strong> joyfully invite you to share in the celebration of their union —<br/>a day where love, faith, and family come together in timeless Filipino grace.</p>
        </div>
      </section>

      <section id="venues" className="py-12 bg-transparent">
        <div className="max-w-5xl mx-auto space-y-8">
          <div className="theme-panel p-8 rounded-xl text-center">
            <h2 className="font-script invitation-heading">Venues</h2>
            <p className="mt-4 theme-text-muted text-base">We’ll celebrate in two beautiful spots in Lucena City. Use the guides below for arrival times, parking notes, and quick links to Google Maps and Waze.</p>
            <p className="mt-2 text-sm theme-text-muted">Tap the map buttons or the embedded maps to open turn-by-turn directions on your phone.</p>
          </div>

          <div className="grid gap-8">
            {venues.map((venue) => (
              <VenueCard key={venue.key} venue={venue} />
            ))}
          </div>

          <div className="theme-panel p-6 rounded-xl text-left">
            <h3 className="font-semibold text-lg">Travel between the ceremony & reception</h3>
            <p className="mt-2 theme-text-muted text-base">Expect a smooth 10.4 km (about 20 minutes) drive: follow Quezon Eco Tourism Road, then watch for the gray Potch gate on the right.</p>
            <ul className="list-disc ml-5 mt-3 text-sm theme-text-muted space-y-1">
              <li>Share the Waze pin with your driver before leaving so navigation is ready when signal dips.</li>
              <li>Parking attendants will wave you toward the covered slots or assist with drop-offs.</li>
            </ul>
            <div className="mt-6 space-y-6">
              <div className="lg:flex lg:items-center lg:gap-6">
                <img
                  src={ceremonySketchUrl || '/assets/church-sketch.jpg'}
                  alt="Hand-drawn sketch of St. Ferdinand Cathedral in Lucena City"
                  className="venue-sketch"
                  loading="lazy"
                />
                <p className="mt-4 lg:mt-0 text-sm theme-text-muted leading-relaxed max-w-lg">A keepsake sketch of St. Ferdinand Cathedral to help guests spot its distinct façade. We’ll have signage by the main doors so you know you’re in the right place.</p>
              </div>
              <div className="lg:flex lg:items-center lg:gap-6">
                <img
                  src={receptionSketchUrl || '/assets/reception-sketch.jpg'}
                  alt="Sketch of Potch Restaurant Grand Banquet Hall"
                  className="venue-sketch"
                  loading="lazy"
                />
                <p className="mt-4 lg:mt-0 text-sm theme-text-muted leading-relaxed max-w-lg">
                  A soft sketch of Potch Restaurant’s Grand Banquet Hall to guide your eye along Quezon Eco Tourism Road. Look for the gray gate with "Potch" signage to enter the reception grounds.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="dress-code" className="py-12 bg-transparent">
        <div className="max-w-4xl mx-auto text-center theme-panel p-8 rounded-xl">
          <h2 className="font-script invitation-heading">Dress Code</h2>
          <div className="text-sm text-muted italic">Soft, festive, and traditionally inspired</div>

          <div className="mt-4 decorative-divider" aria-hidden="true">— ✶ —</div>
          <div className="mt-6 text-left theme-text-muted dress-guidance">
            <p className="lead">We invite you to celebrate with dress that honors Filipino tradition — light, elegant, and festive.</p>

              <div className="dress-callout mt-4 p-4 rounded-md anim" data-animate>
              <p className="mb-1"><strong>Guests are warmly encouraged to attend in Filipino-themed formal attire.</strong></p>
              <p className="mb-0"><b>Ladies:</b> Filipiniana or puffed-sleeved dress/top<br /><b>Gentlemen:</b> Traditional Barong or Polo.</p>
            </div>

            <div className="mt-4">
              <p className="mb-2">We'd love to see you in any pastel color — please avoid Black or White tops so photos stay soft and cohesive.</p>
              <div className="flex flex-wrap gap-2 mt-3 example-badges" data-animate>
                {dressBadges.map((b, i) => (
                  <span key={b} className="badge anim" style={{ transitionDelay: `${i * 80}ms` }}>{b}</span>
                ))}
              </div>
              <div className="mt-3">
                <p className="font-semibold">Please avoid</p>
                <ul className="list-disc ml-5">
                  <li>Casual T-shirts, athletic wear, or visible logos</li>
                  <li>Jeans, shorts, or overly casual sandals</li>
                  <li>Black or plain white tops (we prefer pastel hues)</li>
                </ul>
              </div>
            </div>
          </div>

            <div className="section-gallery mt-6">
            <img src="/assets/dress-guest-sketch.jpg" alt="Guest outfit ideas (illustration)" className="rounded-lg gallery-img shadow-md mx-auto anim img-zoom cursor-zoom-in" loading="lazy" data-animate onClick={() => setDressModalOpen(true)} />
          </div>

          {dressModalOpen && (
            <div className="image-modal-overlay" onClick={() => setDressModalOpen(false)} role="dialog" aria-modal="true">
              <div className="image-modal-content" onClick={(e) => e.stopPropagation()}>
                <button className="image-modal-close" onClick={() => setDressModalOpen(false)} aria-label="Close">✕</button>
                <img className="image-modal-img" src="/assets/dress-guest-sketch.jpg" alt="Guest outfit ideas (illustration)" />
              </div>
            </div>
          )}
          <div className="mt-4 text-right text-sm personal-sign">With love, <span className="handwritten">Jansen &amp; Danniele</span></div>
        </div>
      </section>

      <section id="gifts" className="py-12 bg-transparent">
        <div className="max-w-3xl mx-auto text-center theme-panel p-8 rounded-xl">
          <h2 className="font-script invitation-heading">Gifts</h2>
          <p className="mt-2 theme-text-muted">With all that we have, we've been truly blessed. Your presence and prayers are all that we request. But if you desire to give nonetheless, monetary gift is one we suggest.</p>

          <div className="mt-6 grid gap-6 text-left">
            <div className="grid gap-6 md:grid-cols-2">
              {qrOptions.map((qr) => {
                const status = qrStatus[qr.key];
                return (
                  <div key={qr.key} className="theme-panel bg-white/80 p-6 rounded-xl text-center">
                    <h3 className="font-semibold text-lg">{qr.title}</h3>
                    <p className="mt-2 text-sm theme-text-muted">{qr.description}</p>
                    <img src={qr.src} alt={`${qr.title} code`} className="mt-4 w-full max-w-xs mx-auto rounded-lg shadow-md" loading="lazy" />
                    <div className="mt-4 flex flex-col items-center gap-2">
                      <button
                        onClick={() => downloadQr(qr.key, qr.src, qr.filename)}
                        className="theme-btn px-4 py-2 rounded-full"
                        disabled={status === 'saving'}
                      >
                        {status === 'saving' ? 'Preparing download…' : 'Save QR to device'}
                      </button>
                      {status === 'saved' ? (
                        <span className="text-xs text-green-600">Saved! Check your downloads folder.</span>
                      ) : null}
                      {status === 'error' ? (
                        <span className="text-xs text-rose-600">Opened the QR in a new tab so you can save it manually.</span>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>

          </div>
        </div>
      </section>

      <section id="rsvp" className="py-20 bg-transparent">
        <div className="max-w-md mx-auto text-center">
      <h2 className="font-script invitation-heading">RSVP</h2>
      <p className="theme-text-muted">Please RSVP by <strong>December 1, 2025</strong>. Use the form below to confirm attendance, number of guests, and any high chair needs.</p>
          {!submitted ? (
            <div className="mt-6 theme-panel p-8 rounded-xl shadow-md">
              <form onSubmit={handleSubmit} className="grid gap-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <input
                    type="text"
                    name="lastName"
                    placeholder="Last Name"
                    className={`p-3 border rounded ${errors.lastName ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                    value={lastName}
                    onChange={(e) => { setLastName(e.target.value); if (errors.lastName) setErrors((s) => ({ ...s, lastName: undefined })); }}
                    aria-invalid={Boolean(errors.lastName)}
                    title={errors.lastName || undefined}
                  />
                  <input
                    type="text"
                    name="firstName"
                    placeholder="First Name"
                    className={`p-3 border rounded ${errors.firstName ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                    value={firstName}
                    onChange={(e) => { setFirstName(e.target.value); if (errors.firstName) setErrors((s) => ({ ...s, firstName: undefined })); }}
                    aria-invalid={Boolean(errors.firstName)}
                    title={errors.firstName || undefined}
                  />
                </div>
                <select
                  name="attendance"
                  className={`p-3 border rounded ${errors.attendance ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                  value={attendance}
                  onChange={(e) => {
                    const val = e.target.value;
                    setAttendance(val);
                    if (val !== 'Yes') {
                      setGuests('');
                      setHighChair('');
                      setHighChairCount('');
                    }
                    if (errors.attendance) setErrors((s) => ({ ...s, attendance: undefined }));
                  }}
                  aria-invalid={Boolean(errors.attendance)}
                  title={errors.attendance || undefined}
                >
                  <option value="">Will you attend?</option>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
                {attendance === 'Yes' ? (
                  <>
                    <input
                      type="number"
                      name="guests"
                      placeholder="No. of Guests (incl. you)"
                      min={1}
                      className={`p-3 border rounded ${errors.guests ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                      value={guests}
                      onChange={(e) => {
                        const v = e.target.value === '' ? '' : Number(e.target.value);
                        setGuests(v);
                        if (errors.guests) setErrors((s) => ({ ...s, guests: undefined }));
                      }}
                      aria-invalid={Boolean(errors.guests)}
                      title={errors.guests || undefined}
                    />
                    <div className="text-left mt-2">
                      <div className="mb-2">Do you need a high chair?</div>
                      <div className="flex items-center gap-4">
                        <label className="inline-flex items-center gap-2">
                          <input
                            type="radio"
                            name="highChair"
                            value="Yes"
                            checked={highChair === 'Yes'}
                            onChange={(e) => {
                              setHighChair(e.target.value);
                              if (errors.highChair) setErrors((s) => ({ ...s, highChair: undefined }));
                            }}
                            aria-invalid={Boolean(errors.highChair)}
                            title={errors.highChair || undefined}
                          />
                          Yes
                        </label>
                        <label className="inline-flex items-center gap-2">
                          <input
                            type="radio"
                            name="highChair"
                            value="No"
                            checked={highChair === 'No'}
                            onChange={(e) => {
                              setHighChair(e.target.value);
                              setHighChairCount('');
                              if (errors.highChair) setErrors((s) => ({ ...s, highChair: undefined }));
                              if (errors.highChairCount) setErrors((s) => ({ ...s, highChairCount: undefined }));
                            }}
                            aria-invalid={Boolean(errors.highChair)}
                            title={errors.highChair || undefined}
                          />
                          No
                        </label>
                      </div>
                      {highChair === 'Yes' ? (
                        <input
                          type="number"
                          name="highChairCount"
                          placeholder="How many?"
                          min={1}
                          className={`mt-2 p-3 border rounded w-full ${errors.highChairCount ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                          value={highChairCount}
                          onChange={(e) => {
                            const v = e.target.value === '' ? '' : Number(e.target.value);
                            setHighChairCount(v);
                            if (errors.highChairCount) setErrors((s) => ({ ...s, highChairCount: undefined }));
                          }}
                          aria-invalid={Boolean(errors.highChairCount)}
                          title={errors.highChairCount || undefined}
                        />
                      ) : null}
                    </div>
                  </>
                ) : null}
                <textarea
                  name="message"
                  rows={3}
                  placeholder="Message (optional)"
                  className={`p-3 border rounded ${errors.message ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                  value={message}
                  onChange={(e) => {
                    setMessage(e.target.value);
                    if (errors.message) setErrors((s) => ({ ...s, message: undefined }));
                  }}
                  aria-invalid={Boolean(errors.message)}
                  title={errors.message || undefined}
                />
                <button type="submit" disabled={loading} className={`mt-4 justify-self-center w-auto min-w-[9rem] theme-btn text-white py-2 px-5 rounded-full shadow-sm ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}>{loading ? 'Submitting...' : 'Submit'}</button>
              </form>
            </div>
          ) : (
            <p className="mt-6 theme-text-muted text-xl">Thanks! We received your RSVP.</p>
          )}
        </div>
      </section>

      <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="scroll-top-btn" aria-label="Scroll to top">↑</button>
    </div>
  );
}
function EntouragePage({ onBack }: { onBack: () => void }) {
  const sections: EntourageSection[] = ENTOURAGE_SECTIONS;
  const groupEntries = useMemo(() => {
    const grouped = sections.reduce<Record<string, EntourageSection[]>>((acc, section) => {
      const group = section.groupHeading || 'Other';
      if (!acc[group]) acc[group] = [];
      acc[group].push(section);
      return acc;
    }, {});
    return Object.entries(grouped);
  }, [sections]);
  return (
    <div className="app-content font-sans text-gray-800 relative z-10">
      <nav className="fixed w-full bg-white/60 backdrop-blur-md shadow z-20 theme-invitation-bg">
        <div className="max-w-4xl mx-auto flex justify-between items-center p-4">
          <div className="space-x-6">
            <button onClick={onBack} className="cursor-pointer hover:text-green-600">Home</button>
          </div>
        </div>
      </nav>

      <section className="py-24">
        <div className="max-w-3xl mx-auto text-center theme-panel p-8 rounded-xl">
          <h2 className="font-script invitation-heading">Entourage</h2>
          <p className="mt-4 theme-text-muted">These are the people standing with us on our wedding day — family and dear friends who have supported us through the years.</p>
          <div className="mt-6 text-left theme-text-muted">
            <p className="text-sm">We’re so grateful to have these loved ones standing with us throughout the celebration.</p>
            <div className="entourage-group-wrapper">
              {groupEntries.map(([group, list], index) => (
                <div key={group} className="entourage-group-block">
                  <div className="entourage-group-header">
                    <span className="entourage-group-label">{group}</span>
                    <div className="entourage-group-line" aria-hidden="true"></div>
                  </div>
                  <div className="entourage-groups">
                    {list.map((section) => {
                      const ListTag = section.ordered ? 'ol' : 'ul';
                      const listClass = section.columns ? 'entourage-list entourage-list-columns' : 'entourage-list';
                      return (
                        <div key={section.key} className="entourage-section anim" data-animate>
                          <h3 className="entourage-section-title">{section.title}</h3>
                          {section.items.length === 1 && !section.ordered ? (
                            <p className="mt-3">{section.items[0]}</p>
                          ) : (
                            <ListTag className={listClass}>
                              {section.items.map((item) => (
                                <li key={item}>{item}</li>
                              ))}
                            </ListTag>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  {index < groupEntries.length - 1 ? <div className="entourage-divider" aria-hidden="true"></div> : null}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function VenueCard({ venue }: { venue: VenueDetail }) {
  return (
    <div className="theme-panel p-8 rounded-xl text-left">
      <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
        <div className="lg:w-1/2 space-y-4">
          <span className="text-xs font-semibold uppercase tracking-[0.35em] text-[rgba(11,114,133,0.65)]">{venue.label}</span>
          <h3 className="text-3xl font-script text-left text-slate-900">{venue.title}</h3>
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-600">{venue.time}</p>
          <address className="not-italic theme-text-muted text-sm leading-relaxed">{venue.address}</address>
          <p className="theme-text-muted text-base leading-relaxed">{venue.description}</p>
          <ul className="list-disc ml-5 text-sm theme-text-muted space-y-1">
            {venue.tips.map((tip) => (
              <li key={tip}>{tip}</li>
            ))}
          </ul>
          <div className="flex flex-wrap gap-3 pt-2">
            <a href={venue.googleLink} target="_blank" rel="noopener noreferrer" className="theme-btn px-4 py-2 rounded-full text-sm">Open Google Maps</a>
            <a href={venue.wazeLink} target="_blank" rel="noopener noreferrer" className="px-4 py-2 rounded-full border border-dashed border-[rgba(11,114,133,0.35)] text-sm text-[rgba(11,114,133,0.85)]">Open in Waze</a>
          </div>
        </div>
        <div className="lg:w-1/2 space-y-3">
          <div className="map-frame rounded-xl">
            <iframe
              src={venue.mapEmbed}
              title={`${venue.title} map`}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
          </div>
          {venue.mapNote ? <p className="text-xs theme-text-muted leading-relaxed">{venue.mapNote}</p> : null}
        </div>
      </div>
    </div>
  );
}

const ENTOURAGE_SECTIONS: EntourageSection[] = [
  {
    key: 'parents-groom',
    title: 'Parents of the Groom',
    items: ['Leo D. Dolido', 'Julieta R. Dolido'],
    groupHeading: 'Parents',
  },
  {
    key: 'parents-bride',
    title: 'Parents of the Bride',
    items: ['Ian Lloyd M. Omaña', 'Janis S. Constantino'],
    groupHeading: 'Parents',
  },
  {
    key: 'little-bride',
    title: 'Little Bride',
    items: ['Lianna Ellise O. Dolido'],
    groupHeading: 'Special Entourage',
  },
  {
    key: 'ninong',
    title: 'Male Principal Sponsors (Ninong)',
    items: [
      'Marcial Y. Genonangan',
      'Jose Francisco O. Catipon',
      'Jimmy M. Romen',
      'Roland A. Peralta',
      'Michael M. Omaña',
      'Victor D. Dolido',
      'Ronald A. Mendiola',
    ],
    ordered: true,
    columns: true,
    groupHeading: 'Principal Sponsors',
  },
  {
    key: 'ninang',
    title: 'Female Principal Sponsors (Ninang)',
    items: [
      'Sharon D. Genonangan',
      'Ma. Lourdes C. Catipon',
      'Emma P. Romen',
      'Vicky D. Peralta',
      'Ma. Estela S. Omaña',
      'Rose F. Dolido',
      'Jennifer T. Mendiola',
    ],
    ordered: true,
    columns: true,
    groupHeading: 'Principal Sponsors',
  },
  {
    key: 'best-man',
    title: 'Best Man',
    items: ['Gel Carlo E. Marquez'],
    groupHeading: 'Principal Party',
  },
  {
    key: 'maid-matron',
    title: 'Man of Honor',
    items: ['Jann Ylo C. Omaña'],
    groupHeading: 'Principal Party',
  },
  {
    key: 'groomsmen',
    title: 'Groomsmen',
    items: [
      'Joenard L. Opalsa',
      'Jason S. Balagao',
      'Meynard John G. Panganiban',
      'Robert P. Raguindin',
      'Harold T. Malaki',
    ],
    ordered: true,
    columns: true,
    groupHeading: 'Wedding Party',
  },
  {
    key: 'bridesmaids',
    title: 'Bridesmaids',
    items: [
      'Romina Victoria D. Omaña',
      'Alexandra Nicole O. Amarillo',
      'Ianne Louise D. Omaña',
      'Pierre Mikhaela Constantino',
      'Anne Mikhail S. Omaña',
    ],
    ordered: true,
    columns: true,
    groupHeading: 'Wedding Party',
  },
  {
    key: 'candle',
    title: 'Candle Sponsors',
    items: ['Dioni Mari C. Velicaria', 'Bea Andrei V. Mancenido'],
    groupHeading: 'Secondary Sponsors',
  },
  {
    key: 'veil',
    title: 'Veil Sponsors',
    items: ['Alvin Q. Cruz', 'Alyssa Marie O. Marcelino'],
    groupHeading: 'Secondary Sponsors',
  },
  {
    key: 'cord',
    title: 'Cord Sponsors',
    items: ['Edward M. Reyteran', 'Kris Ann Geneva A. Obnial'],
    groupHeading: 'Secondary Sponsors',
  },
  {
    key: 'ring-bearer',
    title: 'Ring Bearer',
    items: ['Noah C. Malaki'],
    groupHeading: 'Processional',
  },
  {
    key: 'bible-bearer',
    title: 'Bible Bearer',
    items: ['Lucaz Gabriel D. Victorio'],
    groupHeading: 'Processional',
  },
  {
    key: 'coin-bearer',
    title: 'Coin Bearer',
    items: ['Zaion Kobe R. Grueso'],
    groupHeading: 'Processional',
  },
  {
    key: 'flower-girls',
    title: 'Flower Girls',
    items: [
      'Avery Skyler D. Espiritu',
      'Abrielle Sunshine D. Espiritu',
      'Elaiza Mari M. Velicaria',
      'Vianney Carla E. Marquez',
      'Nathalie Amara C. Malaki',
    ],
    ordered: true,
    columns: true,
    groupHeading: 'Processional',
  },
];

