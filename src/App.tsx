import { useEffect, useState, useRef } from "react";
import "./invitation.css";

type ImageItem = { src: string; alt?: string };

function Lightbox({ images, index, onClose, onPrev, onNext }: { images: ImageItem[]; index: number; onClose: () => void; onPrev: () => void; onNext: () => void; }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') onPrev();
      if (e.key === 'ArrowRight') onNext();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, onPrev, onNext]);

  const img = images[index];
  return (
    <div className="lightbox-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
        <button className="lightbox-close" onClick={onClose} aria-label="Close">✕</button>
        <button className="lightbox-prev" onClick={onPrev} aria-label="Previous">‹</button>
        <img src={img.src} alt={img.alt || ""} className="lightbox-img" />
        <button className="lightbox-next" onClick={onNext} aria-label="Next">›</button>
      </div>
    </div>
  );
}

function Gallery({ images, galleryId }: { images: ImageItem[]; galleryId?: string }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const idxRef = useRef(0);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 640px)');
    const upd = () => setIsMobile(mq.matches);
    upd();
    mq.addEventListener?.('change', upd);
    return () => mq.removeEventListener?.('change', upd);
  }, []);

  useEffect(() => {
    // autoplay only on mobile
    if (isMobile) {
      intervalRef.current = window.setInterval(() => {
        idxRef.current = (idxRef.current + 1) % images.length;
        setOpenIndex(idxRef.current);
      }, 3000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setOpenIndex(null);
    }
    return () => { if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; } };
  }, [isMobile, images.length]);

  const open = (i: number) => { setOpenIndex(i); idxRef.current = i; };
  const close = () => setOpenIndex(null);
  const prev = () => setOpenIndex((v) => { if (v == null) return 0; return (v - 1 + images.length) % images.length; });
  const next = () => setOpenIndex((v) => { if (v == null) return 0; return (v + 1) % images.length; });

  if (isMobile) {
    // show single autoplaying image strip (still clickable to open lightbox)
    return (
      <div id={galleryId} className="gallery-carousel">
        {images.map((img, i) => (
          <img key={i} src={img.src} alt={img.alt || ''} loading="lazy" className={`carousel-img ${openIndex === i ? 'active' : ''}`} onClick={() => open(i)} />
        ))}
        {openIndex !== null && <Lightbox images={images} index={openIndex} onClose={close} onPrev={prev} onNext={next} />}
      </div>
    );
  }

  return (
    <div id={galleryId} className="gallery-grid">
      {images.map((img, i) => (
        <img key={i} src={img.src} alt={img.alt || ''} loading="lazy" className="rounded-lg gallery-img shadow-md" onClick={() => open(i)} />
      ))}
      {openIndex !== null && <Lightbox images={images} index={openIndex} onClose={close} onPrev={prev} onNext={next} />}
    </div>
  );
}

export default function App() {
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

  // Gifts state
  const [giftName, setGiftName] = useState<string>("");
  const [giftAmount, setGiftAmount] = useState<string>("");
  const [giftNote, setGiftNote] = useState<string>("");
  const [giftSaved, setGiftSaved] = useState(false);
  const [copied, setCopied] = useState<Record<string, boolean>>({});

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
      // ignore
    }
  }, []);

  useEffect(() => {
    const payload = { firstName, lastName, attendance, guests, highChair, highChairCount, message };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch (e) {
      // ignore
    }
  }, [firstName, lastName, attendance, guests, highChair, highChairCount, message]);

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
          <div className="text-2xl font-script text-4xl theme-text-muted">Jansen & Danniele</div>
          <div className="space-x-6">
            {['Home', 'Details', 'Venues', 'Entourage', 'Dress Code', 'Gifts', 'RSVP'].map((label) => {
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

      <section id="home" className="invitation-hero py-24">
        <div className="max-w-4xl mx-auto text-center px-4">
          <h1 className="font-script hero-title">Jansen & Danniele</h1>
          <p className="sub-hero">are Getting Married!</p>
          <p className="hero-date">December 29, 2025</p>
          <button onClick={() => smoothScroll("details")} className="mt-6 theme-btn hover:brightness-95 text-white py-2 px-6 rounded-full transition">View Details</button>
        </div>
      </section>

      <section id="details" className="py-20 bg-transparent">
        <div className="max-w-3xl mx-auto text-center theme-panel p-8 rounded-xl">
          <h2 className="font-script invitation-heading">Our Day</h2>
          <p className="mt-6 text-lg theme-text-muted">December 29, 2025<br/>Ceremony: 2:30 PM at St. Ferdinand Cathedral, Quezon Avenue, Lucena City<br/>Reception: 5:30 PM at Potch Restaurant, Salinas, Lucena City</p>
        </div>
      </section>

      <section id="venues" className="py-12 bg-transparent">
        <div className="max-w-4xl mx-auto text-center theme-panel p-8 rounded-xl">
          <h2 className="font-script invitation-heading">Venues</h2>
          <p className="mt-4 theme-text-muted">Ceremony: St. Ferdinand Cathedral — 2:30 PM<br/>Reception: Potch Restaurant — 5:30 PM</p>

          <div className="venue-gallery mt-6">
            <Gallery galleryId="venue-gallery" images={[
              { src: '/assets/venue-mood1.svg', alt: 'Venue mood board' },
              { src: '/assets/venue-sketch.svg', alt: 'Venue sketch' },
              { src: '/assets/palette.svg', alt: 'Color palette' },
            ]} />
          </div>

          <p className="mt-4 text-left theme-text-muted text-base">Directions and parking: street and lot parking are available near the reception venue. We recommend carpooling or rideshare for evening departures. If you need accessibility assistance or directions, contact us and we’ll help arrange transport.</p>
        </div>
      </section>

      <section id="dress-code" className="py-12 bg-transparent">
        <div className="max-w-4xl mx-auto text-center theme-panel p-8 rounded-xl">
          <h2 className="font-script invitation-heading">Dress Code</h2>
        
          <div className="mt-6 text-left theme-text-muted dress-guidance">
            <p className="lead">We invite you to celebrate with dress that honors Filipino tradition — light, elegant, and festive.</p>

            <div className="dress-callout mt-4 p-4 rounded-md">
              <p className="mb-1"><strong>Guests are warmly encouraged to attend in Filipino-themed formal attire.</strong></p>
              <p className="mb-0">Ladies: Filipiniana or puffed-sleeved dress/top — Gentlemen: Traditional Barong or Polo.</p>
            </div>

            <div className="mt-4">
              <p className="mb-2">We'd love to see you in any happy or pastel color — please avoid Black or White tops so photos stay soft and cohesive.</p>
              <ul className="list-disc ml-5">
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
            <Gallery galleryId="dress-gallery" images={[
              { src: '/assets/dress-guest-sketch.jpg', alt: 'Guest outfit ideas (illustration)' },
            ]} />
          </div>
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

