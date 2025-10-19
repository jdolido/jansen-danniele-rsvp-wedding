import { useEffect, useMemo, useState } from "react";
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

export default function App() {

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

  const [giftName, setGiftName] = useState<string>("");
  const [giftAmount, setGiftAmount] = useState<string>("");
  const [giftNote, setGiftNote] = useState<string>("");
  const [giftSaved, setGiftSaved] = useState(false);
  const [copied, setCopied] = useState<Record<string, boolean>>({});

  const [dressModalOpen, setDressModalOpen] = useState(false);
  const [generatedSketches, setGeneratedSketches] = useState<Record<string, string>>({});

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
      address: 'Granja St, Lucena City, Quezon',
      description: 'Our vows will be held in the heart of Lucena City. Enter through the cathedral doors along Granja Street—ushers will guide you to the reserved pews near the center aisle.',
      mapEmbed: 'https://www.google.com/maps?q=St.+Ferdinand+Cathedral,+Lucena+City&output=embed',
      googleLink: 'https://maps.google.com/?q=St.+Ferdinand+Cathedral,+Lucena+City',
      wazeLink: 'https://waze.com/ul?q=St.%20Ferdinand%20Cathedral%20Lucena&navigate=yes',
      mapNote: 'The pin lands on the Granja Street frontage; limited paid parking is available beside the parish office and across the street near the plaza.',
      tips: [
        'Arrive 20 minutes early to sign the guest book and settle comfortably inside the nave.',
        'Dress code reminder: Filipiniana-inspired attire in joyful, light hues.',
        'If arriving by jeepney or tricycle, ask to alight at the cathedral steps on Granja Street for the smoothest entry.',
      ],
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
        'Travel time from the cathedral is about 20 minutes without traffic.',
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

  const receptionSketchUrl = generatedSketches['reception'];

  const smoothScroll = (id: string) => {
    const target = document.getElementById(id);
    if (target) {
      const yOffset = -70;
      const y = target.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  };

  const copyToClipboard = async (key: string, text: string) => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const t = document.createElement("textarea");
        t.value = text;
        document.body.appendChild(t);
        t.select();
        document.execCommand("copy");
        document.body.removeChild(t);
      }
      setCopied((s) => ({ ...s, [key]: true }));
      setTimeout(() => setCopied((s) => ({ ...s, [key]: false })), 2000);
    } catch (e) {
      alert("Unable to copy to clipboard.");
    }
  };

  const dressBadges = ['Filipiniana', 'Puffed Sleeves', 'Barong', 'Pastels', 'Floral Pins'];

  const GIFT_KEY = "gift_intent_v1";
  const saveGiftIntent = () => {
    const name = giftName.trim();
    const amount = giftAmount.trim();
    if (!name) {
      alert("Please enter your name so we know who the gift is from.");
      return;
    }
    if (!amount || isNaN(Number(amount))) {
      alert("Please enter a valid amount.");
      return;
    }
    try {
      const raw = localStorage.getItem(GIFT_KEY);
      const existing = raw ? JSON.parse(raw) : [];
      const entry = { name, amount: Number(amount), note: giftNote || null, date: new Date().toISOString() };
      existing.push(entry);
      localStorage.setItem(GIFT_KEY, JSON.stringify(existing));
      setGiftSaved(true);
      setTimeout(() => setGiftSaved(false), 3000);
    } catch (e) {
      console.error(e);
      alert("Unable to save gift intent locally.");
    }
  };

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
    if (Object.keys(nextErrors).length > 0) return;

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
      <nav className="fixed w-full bg-white/60 backdrop-blur-md shadow z-20 theme-invitation-bg">
        <div className="max-w-4xl mx-auto flex justify-between items-center p-4">
          <div className="space-x-6">
            {['Home', 'Details', 'Venues', 'Dress Code', 'Gifts', 'RSVP', 'Entourage'].map((label) => {
              const slug = label.toLowerCase().replace(/\s+/g, '-');
              if (slug === 'entourage') {
                return (
                  <button key={label} onClick={() => { window.location.hash = '/entourage'; }} className="cursor-pointer hover:text-green-600">{label}</button>
                );
              }
              return (
                <button key={label} onClick={() => { window.location.hash = ''; smoothScroll(slug); }} className="cursor-pointer hover:text-green-600">{label}</button>
              );
            })}
          </div>
        </div>
      </nav>

      <section id="home" className="invitation-hero py-24" data-animate>
        <div className="hero-ribbon" aria-hidden="true"></div>
        <div className="max-w-4xl mx-auto text-center px-4">
          <h1 className="font-script hero-title anim" data-animate>Jansen & Danniele</h1>
          <p className="sub-hero anim" data-animate>are Getting Married!</p>
          <p className="hero-date anim" data-animate>12.29.2025</p>
        </div>
      </section>

      <section id="details" className="py-20 bg-transparent">
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
              <li>Parking attendants in teal polos will wave you toward the covered slots or assist with drop-offs.</li>
            </ul>
            <div className="mt-6 space-y-6">
              <div className="lg:flex lg:items-center lg:gap-6">
                <img src="/assets/church-sketch.jpg" alt="Hand-drawn sketch of St. Ferdinand Cathedral in Lucena City" className="venue-sketch" loading="lazy" />
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
              <p className="mb-0">Ladies: Filipiniana or puffed-sleeved dress/top — Gentlemen: Traditional Barong or Polo.</p>
            </div>

            <div className="mt-4">
              <p className="mb-2">We'd love to see you in any happy or pastel color — please avoid Black or White tops so photos stay soft and cohesive.</p>
              <div className="flex flex-wrap gap-2 mt-3 example-badges" data-animate>
                {dressBadges.map((b, i) => (
                  <span key={b} className="badge anim" style={{ transitionDelay: `${i * 80}ms` }}>{b}</span>
                ))}
              </div>
              <ul className="list-disc ml-5 mt-3">
                <li><strong>Recommended fabrics:</strong> piña, silk blends, organza, lightweight linen.</li>
                <li><strong>Accessories:</strong> delicate jewelry, floral pins, and traditional touches are encouraged.</li>
                <li><strong>Footwear:</strong> dress shoes, wedges, or elegant flats for outdoor comfort.</li>
              </ul>
              <div className="mt-3">
                <p className="font-semibold">Please avoid</p>
                <ul className="list-disc ml-5">
                  <li>Casual T-shirts, athletic wear, or visible logos</li>
                  <li>Jeans, shorts, or overly casual sandals</li>
                  <li>Black or plain white tops (we prefer joyful, pastel hues)</li>
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
          <p className="mt-2 theme-text-muted">Your presence is the greatest gift — but if you'd like to offer a monetary gift or use our registry, here are secure options and etiquette notes.</p>

          <div className="mt-6 grid gap-4 text-left">
            <div>
              <h3 className="font-semibold">Bank Transfer</h3>
              <p className="theme-text-muted">Account Name: Jansen & Danniele<br/>Account No: 1234-5678-9012 (Bank Name)</p>
              <div className="mt-2 flex gap-3">
                <button onClick={() => copyToClipboard('bank-account', 'Account Name: Jansen & Danniele\nAccount No: 1234-5678-9012 (Bank Name)')} className="theme-btn px-3 py-2 rounded">Copy details</button>
                <button onClick={() => copyToClipboard('bank-account-no', '123456789012')} className="px-3 py-2 border rounded">Copy account no.</button>
                {copied['bank-account'] ? <span className="ml-2 text-sm text-green-600">Copied!</span> : null}
              </div>
            </div>

            <div>
              <h3 className="font-semibold">GCash / Mobile Wallet</h3>
              <p className="theme-text-muted">Phone: +63 912 345 6789 (GCash)</p>
              <div className="mt-2 flex gap-3">
                <button onClick={() => copyToClipboard('gcash', '+639123456789')} className="theme-btn px-3 py-2 rounded">Copy number</button>
                {copied['gcash'] ? <span className="ml-2 text-sm text-green-600">Copied!</span> : null}
              </div>
            </div>

            <div>
              <h3 className="font-semibold">Let us know (optional)</h3>
              <p className="theme-text-muted">Tell us you sent a gift so we can properly thank you. Use the local "Save gift note" box or include your name in the transfer reference.</p>
              <div className="mt-3 grid sm:grid-cols-3 gap-3">
                <input value={giftName} onChange={(e) => setGiftName(e.target.value)} className="p-3 border rounded" placeholder="Your Name" />
                <input value={giftAmount} onChange={(e) => setGiftAmount(e.target.value)} className="p-3 border rounded" placeholder="Amount (e.g. 1500)" />
                <input value={giftNote} onChange={(e) => setGiftNote(e.target.value)} className="p-3 border rounded" placeholder="Note (optional)" />
              </div>
              <div className="mt-3 flex items-center gap-3">
                <button onClick={saveGiftIntent} className="theme-btn px-4 py-2 rounded">Save gift note</button>
                {giftSaved ? <span className="text-green-600">Saved locally</span> : null}
              </div>
              <p className="mt-2 text-sm theme-text-muted">Note: This only records an intent locally on your device. It does not send payments — choose a secure payment method above. For registry or third-party links, we recommend provider-hosted checkout (PayPal, Stripe, or registry services) for security and tracking.</p>
            </div>
          </div>
        </div>
      </section>

      <section id="rsvp" className="py-20 bg-transparent">
        <div className="max-w-md mx-auto text-center">
      <h2 className="font-script invitation-heading">RSVP</h2>
      <p className="theme-text-muted">Please RSVP by <strong>December 1, 2025</strong>. Use the form below to confirm attendance, number of guests, and any dietary or accessibility needs.</p>
          {!submitted ? (
            <div className="mt-6 theme-panel p-8 rounded-xl shadow-md">
              <form onSubmit={handleSubmit} className="grid gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <input type="text" name="lastName" placeholder="Last Name" className="p-3 border rounded" value={lastName} onChange={(e) => { setLastName(e.target.value); if (errors.lastName) setErrors((s) => ({ ...s, lastName: undefined })); }} />
                  <input type="text" name="firstName" placeholder="First Name" className="p-3 border rounded" value={firstName} onChange={(e) => { setFirstName(e.target.value); if (errors.firstName) setErrors((s) => ({ ...s, firstName: undefined })); }} />
                </div>
                <select name="attendance" className="p-3 border rounded" value={attendance} onChange={(e) => { const val = e.target.value; setAttendance(val); if (val !== 'Yes') { setGuests(''); setHighChair(''); setHighChairCount(''); } if (errors.attendance) setErrors((s) => ({ ...s, attendance: undefined })); }}>
                  <option value="">Will you attend?</option>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
                {attendance === 'Yes' ? (
                  <>
                    <input type="number" name="guests" placeholder="No. of Guests (incl. you)" min={1} className="p-3 border rounded" value={guests} onChange={(e) => { const v = e.target.value === '' ? '' : Number(e.target.value); setGuests(v); if (errors.guests) setErrors((s) => ({ ...s, guests: undefined })); }} />
                    <div className="text-left mt-2">
                      <div className="mb-2">Do you need a high chair?</div>
                      <div className="flex items-center gap-4">
                        <label className="inline-flex items-center gap-2"><input type="radio" name="highChair" value="Yes" checked={highChair === 'Yes'} onChange={(e) => { setHighChair(e.target.value); if (errors.highChair) setErrors((s) => ({ ...s, highChair: undefined })); }} /> Yes</label>
                        <label className="inline-flex items-center gap-2"><input type="radio" name="highChair" value="No" checked={highChair === 'No'} onChange={(e) => { setHighChair(e.target.value); setHighChairCount(''); if (errors.highChair) setErrors((s) => ({ ...s, highChair: undefined })); if (errors.highChairCount) setErrors((s) => ({ ...s, highChairCount: undefined })); }} /> No</label>
                      </div>
                      {highChair === 'Yes' ? (<input type="number" name="highChairCount" placeholder="How many?" min={1} className="mt-2 p-3 border rounded w-full" value={highChairCount} onChange={(e) => { const v = e.target.value === '' ? '' : Number(e.target.value); setHighChairCount(v); if (errors.highChairCount) setErrors((s) => ({ ...s, highChairCount: undefined })); }} />) : null}
                    </div>
                  </>
                ) : null}
                <textarea name="message" rows={3} placeholder="Message (optional)" className="p-3 border rounded" value={message} onChange={(e) => { setMessage(e.target.value); if (errors.message) setErrors((s) => ({ ...s, message: undefined })); }} />
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
  return (
    <div className="app-content font-sans text-gray-800 relative z-10">
      <nav className="fixed w-full bg-white/60 backdrop-blur-md shadow z-20 theme-invitation-bg">
        <div className="max-w-4xl mx-auto flex justify-between items-center p-4">
          <div className="text-2xl font-script text-4xl theme-text-muted">Jansen & Danniele</div>
          <div className="space-x-6">
            <button onClick={onBack} className="cursor-pointer hover:text-green-600">Back</button>
          </div>
        </div>
      </nav>

      <section className="py-24">
        <div className="max-w-3xl mx-auto text-center theme-panel p-8 rounded-xl">
          <h2 className="font-script invitation-heading">Entourage</h2>
          <p className="mt-4 theme-text-muted">These are the people standing with us on our wedding day — family and dear friends who have supported us through the years.</p>
          <div className="mt-6 text-left theme-text-muted">
            <ul className="list-disc ml-5">
              <li><strong>Officiant:</strong> Rev. [Name]</li>
              <li><strong>Parents:</strong> Mr. &amp; Mrs. [Parent Names]</li>
              <li><strong>Maid of Honor:</strong> [Name] — lifelong friend</li>
              <li><strong>Best Man:</strong> [Name] — longtime friend</li>
              <li><strong>Bridesmaids:</strong> [Name], [Name], [Name]</li>
              <li><strong>Groomsmen:</strong> [Name], [Name], [Name]</li>
              <li><strong>Flower Girl:</strong> [Name]</li>
              <li><strong>Ring Bearer:</strong> [Name]</li>
            </ul>
            <p className="mt-3">We’ll add short bios and photos soon so guests can recognize everyone at the ceremony.</p>
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

