import { useState } from "react";

export default function App() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  // Smooth scroll helper
  const smoothScroll = (id: string) => {
    const target = document.getElementById(id);
    if (target) {
      const yOffset = -70; // adjust for sticky nav
      const y =
        target.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  };

  // Handle RSVP submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);

    const data = {
      name: formData.get("name"),
      attendance: formData.get("attendance"),
      guests: formData.get("guests"),
      message: formData.get("message"),
    };

    try {
      setLoading(true);
      await fetch("https://script.google.com/macros/s/AKfycbz84IXmW592m9OHhGdaykaX9tPJni1NAhMBF0N0hLwEgaeehOPCxklqtCcrMHoQVCRT0A/exec", {
        method: "POST",
        mode: "no-cors", // 👈 bypasses CORS
        body: JSON.stringify(data),
        headers: {
          "Content-Type": "application/json",
        },
      });

      setSubmitted(true);
    } catch (error) {
      alert("There was an issue submitting your RSVP. Please try again.");
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="font-sans text-gray-800">
      {/* Sticky Top Navigation */}
      <nav className="fixed w-full bg-white bg-opacity-80 backdrop-blur-md shadow z-20">
        <div className="max-w-4xl mx-auto flex justify-between items-center p-4">
          <div className="text-2xl font-script text-green-800">J & D</div>
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
        className="h-screen bg-[url('https://source.unsplash.com/1600x900/?wedding,green,blue')] bg-cover bg-center relative"
      >
        <div className="absolute inset-0 bg-gradient-to-t from-white/70 via-transparent to-white/70" />
        <div className="h-full flex flex-col items-center justify-center text-center px-4">
          <h1 className="font-script text-5xl md:text-7xl text-green-900">
            Jansen & Danniele
          </h1>
          <p className="mt-4 text-2xl text-green-700">December 29, 2025</p>
          <button
            onClick={() => smoothScroll("details")}
            className="mt-8 bg-blue-300 hover:bg-blue-400 text-white py-2 px-6 rounded-full transition"
          >
            View Details
          </button>
        </div>
      </section>

      {/* Details Section */}
      <section id="details" className="py-20 bg-green-50">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-script text-4xl text-green-800">Our Day</h2>
          <p className="mt-6 text-lg">
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
      <section id="rsvp" className="py-20 bg-blue-50">
        <div className="max-w-md mx-auto text-center">
          <h2 className="font-script text-4xl text-green-800">RSVP</h2>
          {!submitted ? (
            <form onSubmit={handleSubmit} className="mt-6 grid gap-4">
              <input
                type="text"
                name="name"
                placeholder="Your Full Name"
                required
                className="p-3 border rounded"
              />
              <select name="attendance" required className="p-3 border rounded">
                <option value="">Will you attend?</option>
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
              <input
                type="number"
                name="guests"
                placeholder="No. of Guests (incl. you)"
                min="1"
                className="p-3 border rounded"
              />
              <textarea
                name="message"
                rows={3}
                placeholder="Message (optional)"
                className="p-3 border rounded"
              />
              <button
                type="submit"
                disabled={loading}
                className={`mt-4 bg-green-400 hover:bg-green-500 text-white py-3 rounded-full flex items-center justify-center gap-2 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                {loading ? (
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                  </svg>
                ) : null}
                <span>{loading ? 'Submitting...' : 'Submit'}</span>
              </button>
            </form>
          ) : (
            <p className="mt-6 text-green-700 text-xl">
              Thanks! We received your RSVP.
            </p>
          )}
        </div>
      </section>

      {/* Scroll to Top Button */}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        className="fixed bottom-6 right-6 bg-green-400 hover:bg-green-500 text-white p-4 rounded-full shadow-lg transition"
      >
        ↑
      </button>
    </div>
  );
}
