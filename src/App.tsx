import { useEffect, useState } from "react";
import "./invitation.css";

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
  // Validation errors (allow undefined so individual keys can be cleared)
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});


  // Persist form in localStorage
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

  // (toasts removed — using inline validation and alerts only)

  // Smooth scroll helper
  const smoothScroll = (id: string) => {
    const target = document.getElementById(id);
    if (target) {
      const yOffset = -70; // adjust for sticky nav
      const y = target.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  };

  // Handle RSVP submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Basic validation (inline)
    const nextErrors: { [k: string]: string } = {};
    if (!lastName.trim()) nextErrors.lastName = "Please enter your last name.";
    if (!firstName.trim()) nextErrors.firstName = "Please enter your first name.";
    if (!attendance) nextErrors.attendance = "Please select whether you'll attend.";
    if (attendance === "Yes" && (guests === "" || Number(guests) < 1))
      nextErrors.guests = "Please provide the number of guests (minimum 1) when attending.";
    if (attendance === 'Yes' && !highChair) nextErrors.highChair = 'Please indicate whether you need a high chair.';
    if (attendance === 'Yes' && highChair === 'Yes' && (highChairCount === '' || Number(highChairCount) < 1))
      nextErrors.highChairCount = 'Please provide how many high chairs you need.';

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      // validation errors are shown inline
      return;
    }

    const fullName = `${lastName.trim()}, ${firstName.trim()}`;
    const data = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      name: fullName,
      attendance,
      guests: guests === "" ? null : guests,
      highChair: highChair || '',
      highChairCount: highChairCount === '' ? null : highChairCount,
      message,
    };

    try {
      setLoading(true);
      // Send as form-encoded to avoid CORS preflight (Apps Script accepts form data)
      const url = "https://script.google.com/macros/s/AKfycbwETT8PYztSE02YihPf4wHl2CNSKqzT0IIAK5L-EsIZ83RpnFcKFzdqKyJKWhNWyBFVaA/exec";
      const params = new URLSearchParams();
      Object.entries(data).forEach(([k, v]) => {
        params.append(k, v == null ? "" : String(v));
      });

      const resp = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: params.toString(),
      });

      if (!resp.ok) {
        throw new Error(`Server returned ${resp.status}`);
      }

      const result = await resp.json().catch(() => ({}));

      if (result && result.success === true) {
        setSubmitted(true);
      } else {
        console.warn("Server did not return success", result);
        setSubmitted(true);
      }

      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch (e) {}
    } catch (error) {
      alert("There was an issue submitting your RSVP. Please try again.");
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="app-content font-sans text-gray-800 relative z-10">
      {/* Sticky Top Navigation */}
  <nav className="fixed w-full bg-white/60 backdrop-blur-md shadow z-20 theme-invitation-bg">
        <div className="max-w-4xl mx-auto flex justify-between items-center p-4">
          <div className="text-2xl font-script text-4xl theme-text-muted">Jansen & Danniele — RSVP</div>
          <div className="space-x-6">
            {["Home", "Details", "RSVP"].map((label) => (
              <button
                key={label}
                onClick={() => smoothScroll(label.toLowerCase())}
                className="cursor-pointer hover:text-green-600"
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section
        id="home"
        className="invitation-bg invitation-hero h-screen bg-cover bg-center relative"
      >
        <div className="h-full flex flex-col items-center justify-center text-center px-4">
            <h1 className="font-script hero-title">
              Jansen & Danniele
            </h1>
            <p className="hero-date">December 29, 2025</p>
          <button
            onClick={() => smoothScroll("details")}
            className="mt-8 theme-btn hover:brightness-95 text-white py-2 px-6 rounded-full transition"
          >
            View Details
          </button>
        </div>
      </section>

  {/* Details Section */}
  <section id="details" className="py-20 bg-transparent">
        <div className="max-w-3xl mx-auto text-center theme-panel backdrop-blur-sm p-8 rounded-xl">
          <h2 className="font-script invitation-heading">Our Day</h2>
          <p className="mt-6 text-lg theme-text-muted">
            December 29, 2025
            <br />
            Ceremony: 2:30 PM at St. Ferdinand Cathedral, Quezon Avenue, Lucena
            City
            <br />
            Reception: 5:30 PM at Potch Restaurant, Salinas, Lucena City
          </p>
        </div>
      </section>

  {/* RSVP Section */}
  <section id="rsvp" className="py-20 bg-transparent">
        <div className="max-w-md mx-auto text-center">
          <h2 className="font-script invitation-heading">RSVP</h2>
          {!submitted ? (
            <div className="mt-6 theme-panel backdrop-blur-sm p-8 rounded-xl shadow-md">
              <form onSubmit={handleSubmit} className="grid gap-4">
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  name="lastName"
                  placeholder="Last Name"
                  className="p-3 border rounded focus:outline-none focus:ring-2 focus:ring-green-300 transition"
                  value={lastName}
                  onChange={(e) => {
                    setLastName(e.target.value);
                    if (errors.lastName) setErrors((s) => ({ ...s, lastName: undefined }));
                  }}
                />
                <input
                  type="text"
                  name="firstName"
                  placeholder="First Name"
                  className="p-3 border rounded focus:outline-none focus:ring-2 focus:ring-green-300 transition"
                  value={firstName}
                  onChange={(e) => {
                    setFirstName(e.target.value);
                    if (errors.firstName) setErrors((s) => ({ ...s, firstName: undefined }));
                  }}
                />
              </div>
              {errors.lastName ? (
                <div className="text-sm text-red-600 text-left">{errors.lastName}</div>
              ) : null}
              {errors.firstName ? (
                <div className="text-sm text-red-600 text-left">{errors.firstName}</div>
              ) : null}
                <select
                name="attendance"
                className="p-3 border rounded focus:outline-none focus:ring-2 focus:ring-green-300 transition"
                value={attendance}
                onChange={(e) => {
                  const val = e.target.value;
                    setAttendance(val);
                    if (val !== "Yes") {
                      setGuests("");
                      setHighChair("");
                      setHighChairCount("");
                    }
                  if (errors.attendance) setErrors((s) => ({ ...s, attendance: undefined }));
                }}
              >
                <option value="">Will you attend?</option>
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
              {errors.attendance ? (
                <div className="text-sm text-red-600 text-left">{errors.attendance}</div>
              ) : null}
              {attendance === 'Yes' ? (
                <>
                  <input
                    type="number"
                    name="guests"
                    placeholder="No. of Guests (incl. you)"
                    min={1}
                    className="p-3 border rounded focus:outline-none focus:ring-2 focus:ring-green-300 transition"
                    value={guests}
                    onChange={(e) => {
                      const v = e.target.value === '' ? '' : Number(e.target.value);
                      setGuests(v);
                      if (errors.guests) setErrors((s) => ({ ...s, guests: undefined }));
                    }}
                  />
                  {errors.guests ? (
                    <div className="text-sm text-red-600 text-left">{errors.guests}</div>
                  ) : null}

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
                        />
                        No
                      </label>
                    </div>
                    {errors.highChair ? (
                      <div className="text-sm text-red-600">{errors.highChair}</div>
                    ) : null}

                    {highChair === 'Yes' ? (
                      <>
                        <input
                          type="number"
                          name="highChairCount"
                          placeholder="How many?"
                          min={1}
                          className="mt-2 p-3 border rounded focus:outline-none focus:ring-2 focus:ring-green-300 transition w-full"
                          value={highChairCount}
                          onChange={(e) => {
                            const v = e.target.value === '' ? '' : Number(e.target.value);
                            setHighChairCount(v);
                            if (errors.highChairCount) setErrors((s) => ({ ...s, highChairCount: undefined }));
                          }}
                        />
                        {errors.highChairCount ? (
                          <div className="text-sm text-red-600">{errors.highChairCount}</div>
                        ) : null}
                      </>
                    ) : null}
                  </div>
                </>
              ) : null}
              <textarea
                name="message"
                rows={3}
                placeholder="Message (optional)"
                className="p-3 border rounded focus:outline-none focus:ring-2 focus:ring-green-300 transition"
                value={message}
                onChange={(e) => {
                  setMessage(e.target.value);
                  if (errors.message) setErrors((s) => ({ ...s, message: undefined }));
                }}
              />
              <button
                type="submit"
                disabled={loading}
                className={`mt-4 justify-self-center w-auto min-w-[9rem] theme-btn text-white py-2 px-5 text-base rounded-full inline-flex items-center justify-center gap-3 shadow-sm hover:shadow-md focus:outline-none ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                {loading ? (
                  <svg className="animate-spin h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                  </svg>
                ) : null}
                <span>{loading ? 'Submitting...' : 'Submit'}</span>
              </button>
              </form>
            </div>
          ) : (
            <p className="mt-6 theme-text-muted text-xl">
                Thanks! We received your RSVP.
              </p>
          )}
          {/* no toasts (inline errors only) */}
        </div>
      </section>

      {/* Scroll to Top Button */}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        className="scroll-top-btn"
        aria-label="Scroll to top"
      >
        ↑
      </button>
    </div>
  );
}
