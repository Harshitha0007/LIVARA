import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  Heart, Utensils, House, PawPrint, MapPinned, ArrowRight, Users,
  ShieldCheck, HandHeart, Menu, X, LogIn, LogOut, Plus, MapPin,
  Clock3, CheckCircle2, AlertCircle, LocateFixed, LayoutDashboard,
  ClipboardList, UserRound, Filter, RefreshCw
} from "lucide-react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";

const API = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api";
const api = axios.create({ baseURL: API });
const categories = [
  { value: "food", label: "Food assistance", icon: Utensils },
  { value: "shelter", label: "Shelter support", icon: House },
  { value: "human_medical", label: "Human medical assistance", icon: Heart },
  { value: "animal_rescue", label: "Animal rescue", icon: PawPrint },
  { value: "road_safety", label: "Road safety", icon: MapPinned }
];
const statusLabels = {
  open: "Open", accepted: "Accepted", in_progress: "In progress",
  resolved: "Resolved", rejected: "Rejected"
};

function tokenConfig() {
  const token = localStorage.getItem("livara_access");
  return token ? { headers: { Authorization: `Bearer ${token}` } } : {};
}

function MapClick({ onPick }) {
  useMapEvents({ click(e) { onPick(e.latlng); } });
  return null;
}

function LocationMap({ position, onPick }) {
  const center = position || [12.9716, 77.5946];
  return (
    <MapContainer center={center} zoom={position ? 14 : 11} scrollWheelZoom className="pick-map">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapClick onPick={onPick} />
      {position && <Marker position={position} />}
    </MapContainer>
  );
}

function App() {
  const [user, setUser] = useState(null);
  const [page, setPage] = useState("home");
  const [reports, setReports] = useState([]);
  const [stats, setStats] = useState({ total: 0, open: 0, in_progress: 0, resolved: 0, animal_reports: 0 });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState("login");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [form, setForm] = useState({
    title: "", category: "animal_rescue", description: "", address: "",
    latitude: "", longitude: "", photo: null
  });
  const [authForm, setAuthForm] = useState({
    username: "", email: "", first_name: "", last_name: "",
    password: "", role: "citizen", phone: "", organisation_name: ""
  });

  const isResponder = user && (user.role === "volunteer" || (user.role === "ngo" && user.is_verified) || user.is_staff);

  useEffect(() => {
    const saved = localStorage.getItem("livara_access");
    if (saved) {
      api.get("/auth/me/", tokenConfig())
        .then(res => setUser(res.data))
        .catch(() => {
          localStorage.removeItem("livara_access");
          localStorage.removeItem("livara_refresh");
        });
    }
    loadStats();
  }, []);

  useEffect(() => {
    if (page === "reports" || page === "dashboard") loadReports();
  }, [page, filter, user]);

  async function loadStats() {
    try {
      const res = await api.get("/dashboard/stats/");
      setStats(res.data);
    } catch { /* backend may not be running yet */ }
  }

  async function loadReports() {
    setLoading(true);
    try {
      const params = {};
      if (filter !== "all") params.category = filter;
      const res = await api.get("/reports/", { ...tokenConfig(), params });
      let data = res.data;
      if (page === "dashboard" && user) {
        data = data.filter(r => r.created_by === user.id || r.assigned_to === user.id);
      }
      setReports(data);
      setError("");
    } catch (err) {
      setError(err.response?.data?.detail || "Could not load reports. Please check that the backend is running.");
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    localStorage.removeItem("livara_access");
    localStorage.removeItem("livara_refresh");
    setUser(null);
    setPage("home");
    setMessage("You have signed out.");
  }

  async function submitAuth(e) {
    e.preventDefault();
    setError(""); setMessage("");
    try {
      if (authMode === "register") {
        await api.post("/auth/register/", authForm);
        setMessage("Account created. Please sign in.");
        setAuthMode("login");
        setAuthForm(f => ({ ...f, password: "" }));
        return;
      }
      const res = await api.post("/auth/token/", {
        username: authForm.username,
        password: authForm.password
      });
      localStorage.setItem("livara_access", res.data.access);
      localStorage.setItem("livara_refresh", res.data.refresh);
      const me = await api.get("/auth/me/", tokenConfig());
      setUser(me.data);
      setShowAuth(false);
      setPage("dashboard");
      setMessage("Welcome to LIVARA, " + (me.data.first_name || me.data.username) + "!");
      setAuthForm(f => ({ ...f, password: "" }));
    } catch (err) {
      const data = err.response?.data;
      setError(data ? JSON.stringify(data) : "Unable to connect to the server.");
    }
  }

  async function submitReport(e) {
    e.preventDefault();
    setError(""); setMessage("");
    if (!user) { setShowAuth(true); setAuthMode("login"); return; }
    const body = new FormData();
    Object.entries(form).forEach(([key, value]) => {
      if (value !== null && value !== "") body.append(key, value);
    });
    try {
      await api.post("/reports/", body, {
        headers: { ...tokenConfig().headers, "Content-Type": "multipart/form-data" }
      });
      setMessage("Your report has been submitted successfully.");
      setForm({ title: "", category: "animal_rescue", description: "", address: "", latitude: "", longitude: "", photo: null });
      setPage("dashboard");
      loadStats();
    } catch (err) {
      setError(err.response?.data ? JSON.stringify(err.response.data) : "Could not submit report.");
    }
  }

  async function acceptReport(id) {
    try {
      await api.post(`/reports/${id}/accept/`, {}, tokenConfig());
      setMessage("You have accepted this report.");
      await loadReports(); await loadStats();
    } catch (err) {
      setError(err.response?.data?.detail || "Unable to accept this report.");
    }
  }

  async function updateStatus(id, status) {
    try {
      await api.patch(`/reports/${id}/status/`, { status }, tokenConfig());
      setMessage("Report status updated.");
      await loadReports(); await loadStats();
    } catch (err) {
      setError(err.response?.data?.detail || "Unable to update status.");
    }
  }

  function useMyLocation() {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by this browser.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      pos => setForm(f => ({ ...f, latitude: pos.coords.latitude.toFixed(6), longitude: pos.coords.longitude.toFixed(6) })),
      () => setError("Location permission was not granted. You can click the map instead.")
    );
  }

  function chooseMapLocation(latlng) {
    setForm(f => ({ ...f, latitude: latlng.lat.toFixed(6), longitude: latlng.lng.toFixed(6) }));
  }

  function go(next) {
    setPage(next);
    setMobileOpen(false);
    setError(""); setMessage("");
  }

  const visibleReports = useMemo(() => reports, [reports]);

  return (
    <div className="app-shell">
      <header className="navbar">
        <button className="brand" onClick={() => go("home")}>LIVARA<span>.</span></button>
        <nav className={mobileOpen ? "nav-links open" : "nav-links"}>
          <button onClick={() => go("home")}>Home</button>
          <button onClick={() => go("services")}>Services</button>
          <button onClick={() => go("reports")}>Community reports</button>
          {user && <button onClick={() => go("dashboard")}>Dashboard</button>}
        </nav>
        <div className="nav-actions">
          {user ? (
            <>
              <span className="user-chip"><UserRound size={15}/>{user.first_name || user.username}</span>
              <button className="outline-btn small-btn" onClick={logout}><LogOut size={15}/> Sign out</button>
            </>
          ) : (
            <button className="solid-btn small-btn" onClick={() => { setAuthMode("login"); setShowAuth(true); }}>
              <LogIn size={15}/> Sign in
            </button>
          )}
        </div>
        <button className="menu-btn" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Toggle menu">
          {mobileOpen ? <X/> : <Menu/>}
        </button>
      </header>

      {(message || error) && (
        <div className={error ? "notice error" : "notice success"}>
          {error ? <AlertCircle size={17}/> : <CheckCircle2 size={17}/>}
          <span>{error || message}</span>
          <button onClick={() => { setError(""); setMessage(""); }}>×</button>
        </div>
      )}

      {page === "home" && <HomePage onReport={() => { if (!user) { setShowAuth(true); return; } go("create"); }} onVolunteer={() => { if (!user) { setAuthMode("register"); setShowAuth(true); } else go("dashboard"); }} onServices={() => go("services")} stats={stats} />}
      {page === "services" && <ServicesPage onReport={() => user ? go("create") : setShowAuth(true)} />}
      {page === "create" && (
        <main className="inner-page">
          <div className="page-heading">
            <span className="eyebrow">LET US KNOW</span>
            <h1>Report a need</h1>
            <p>Share the details so a registered community responder can review your request.</p>
          </div>
          <form className="form-card" onSubmit={submitReport}>
            <label>Report title<input required maxLength="160" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Example: Injured street dog near bus stop"/></label>
            <label>Assistance category<select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>{categories.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}</select></label>
            <label>Description<textarea required minLength="10" rows="4" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Describe what happened and what kind of help may be needed."/></label>
            <label>Address or landmark<input required value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} placeholder="Street, area, city"/></label>
            <div className="location-row">
              <div><label>Latitude<input type="number" step="any" value={form.latitude} onChange={e => setForm({ ...form, latitude: e.target.value })} placeholder="Optional"/></label></div>
              <div><label>Longitude<input type="number" step="any" value={form.longitude} onChange={e => setForm({ ...form, longitude: e.target.value })} placeholder="Optional"/></label></div>
            </div>
            <button type="button" className="outline-btn location-btn" onClick={useMyLocation}><LocateFixed size={16}/> Use my current location</button>
            <p className="map-help">Or click on the map to select a location (map tiles need internet).</p>
            <LocationMap position={form.latitude && form.longitude ? [Number(form.latitude), Number(form.longitude)] : null} onPick={chooseMapLocation}/>
            <label>Upload a photograph (optional)<input type="file" accept="image/*" onChange={e => setForm({ ...form, photo: e.target.files?.[0] || null })}/></label>
            <button className="solid-btn submit-btn" type="submit">Submit report <ArrowRight size={17}/></button>
            <p className="fine-print">Do not upload identifiable photos of vulnerable people without their consent. For immediate danger, contact local emergency services directly.</p>
          </form>
        </main>
      )}
      {(page === "reports" || page === "dashboard") && (
        <main className="inner-page">
          <div className="page-heading split-heading">
            <div>
              <span className="eyebrow">{page === "dashboard" ? "YOUR SPACE" : "COMMUNITY SUPPORT"}</span>
              <h1>{page === "dashboard" ? "Your dashboard" : "Community reports"}</h1>
              <p>{page === "dashboard" ? "Track reports you submitted or accepted." : "Browse open community assistance requests."}</p>
            </div>
            <button className="solid-btn" onClick={() => user ? go("create") : setShowAuth(true)}><Plus size={17}/> New report</button>
          </div>
          {page === "dashboard" && (
            <div className="stats-grid">
              <Stat label="Total reports" value={stats.total} icon={ClipboardList}/>
              <Stat label="Open requests" value={stats.open} icon={Clock3}/>
              <Stat label="Being handled" value={stats.in_progress} icon={Users}/>
              <Stat label="Resolved" value={stats.resolved} icon={CheckCircle2}/>
            </div>
          )}
          <div className="filter-row">
            <Filter size={17}/>
            <select value={filter} onChange={e => setFilter(e.target.value)}>
              <option value="all">All categories</option>
              {categories.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
            <button className="outline-btn small-btn" onClick={() => { loadReports(); loadStats(); }}><RefreshCw size={15}/> Refresh</button>
          </div>
          {loading ? <div className="empty-state">Loading reports…</div> : visibleReports.length === 0 ? (
            <div className="empty-state"><ClipboardList size={34}/><h3>No reports found</h3><p>When community members submit reports, they will appear here.</p></div>
          ) : (
            <div className="report-grid">
              {visibleReports.map(report => <ReportCard key={report.id} report={report} user={user} isResponder={isResponder} onAccept={acceptReport} onStatus={updateStatus}/>)}
            </div>
          )}
        </main>
      )}

      {showAuth && (
        <div className="modal-backdrop" onClick={() => setShowAuth(false)}>
          <div className="auth-modal" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowAuth(false)}><X/></button>
            <span className="eyebrow">WELCOME TO LIVARA</span>
            <h2>{authMode === "login" ? "Welcome back." : "Join the community."}</h2>
            <p>{authMode === "login" ? "Sign in to continue helping." : "Create an account to participate."}</p>
            <form onSubmit={submitAuth}>
              <label>Username<input required value={authForm.username} onChange={e => setAuthForm({ ...authForm, username: e.target.value })}/></label>
              {authMode === "register" && <>
                <label>Email<input type="email" required value={authForm.email} onChange={e => setAuthForm({ ...authForm, email: e.target.value })}/></label>
                <div className="location-row">
                  <label>First name<input value={authForm.first_name} onChange={e => setAuthForm({ ...authForm, first_name: e.target.value })}/></label>
                  <label>Last name<input value={authForm.last_name} onChange={e => setAuthForm({ ...authForm, last_name: e.target.value })}/></label>
                </div>
                <label>Account type<select value={authForm.role} onChange={e => setAuthForm({ ...authForm, role: e.target.value })}><option value="citizen">Citizen</option><option value="volunteer">Volunteer</option><option value="ngo">NGO / Organisation</option></select></label>
                {authForm.role === "ngo" && <label>Organisation name<input required value={authForm.organisation_name} onChange={e => setAuthForm({ ...authForm, organisation_name: e.target.value })}/></label>}
                <label>Phone (optional)<input value={authForm.phone} onChange={e => setAuthForm({ ...authForm, phone: e.target.value })}/></label>
              </>}
              <label>Password<input type="password" minLength="8" required value={authForm.password} onChange={e => setAuthForm({ ...authForm, password: e.target.value })}/></label>
              <button className="solid-btn submit-btn" type="submit">{authMode === "login" ? "Sign in" : "Create account"} <ArrowRight size={16}/></button>
            </form>
            <button className="switch-auth" onClick={() => { setAuthMode(authMode === "login" ? "register" : "login"); setError(""); }}>
              {authMode === "login" ? "New here? Create an account" : "Already registered? Sign in"}
            </button>
          </div>
        </div>
      )}

      <footer className="footer">
        <div><button className="brand footer-brand" onClick={() => go("home")}>LIVARA<span>.</span></button><p>Connecting lives. Creating care.</p></div>
        <p>© {new Date().getFullYear()} LIVARA · Every life deserves care.</p>
      </footer>
    </div>
  );
}

function HomePage({ onReport, onVolunteer, onServices, stats }) {
  return <>
    <main>
      <section className="hero">
        <div className="hero-copy">
          <span className="eyebrow"><Heart size={15}/> A COMMUNITY THAT CARES</span>
          <h1>A little kindness can <em>change a life.</em></h1>
          <p>LIVARA connects people in need with compassionate communities, volunteers and organisations. Together, let's create safer and kinder streets.</p>
          <div className="hero-ctas">
            <button className="solid-btn" onClick={onReport}>Request assistance <ArrowRight size={17}/></button>
            <button className="outline-btn" onClick={onVolunteer}>Become a volunteer</button>
          </div>
          <div className="trust-line"><ShieldCheck size={17}/> Built on compassion, trust and community.</div>
        </div>
        <div className="hero-visual">
          <img src="https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=1200" alt="Friendly dog looking towards the camera"/>
          <div className="photo-caption"><Heart size={18}/><span>Every life deserves care.</span></div>
        </div>
      </section>
      <section className="impact-strip">
        <div><strong>{stats.total}</strong><span>Community reports</span></div>
        <div><strong>{stats.open}</strong><span>Open requests</span></div>
        <div><strong>{stats.resolved}</strong><span>Resolved reports</span></div>
        <small>Live counts from this LIVARA installation</small>
      </section>
      <section className="section-block" id="services">
        <div className="section-title"><span className="eyebrow">HOW WE HELP</span><h2>Care for every life.</h2><p>One platform connecting essential support to the people and animals who need it.</p></div>
        <div className="service-grid">
          {categories.slice(0, 4).map((c, i) => {
            const Icon = c.icon;
            const descriptions = [
              "Connect hungry individuals with food donors and community kitchens.",
              "Help people experiencing homelessness find shelters and essential support.",
              "Report injured street animals and connect with rescue teams.",
              "Identify accident-prone areas and promote safer streets."
            ];
            return <article className="service-card" key={c.value}><div className="service-icon"><Icon size={25}/></div><h3>{c.label}</h3><p>{descriptions[i]}</p><button className="text-link" onClick={onServices}>Explore service <ArrowRight size={15}/></button></article>;
          })}
        </div>
      </section>
      <section className="purpose-section">
        <div><span className="eyebrow">OUR PURPOSE</span><h2>Compassion should reach everyone.</h2><p>We bring communities together to support vulnerable people and street animals through accessible reporting, volunteer coordination and responsible assistance.</p></div>
        <div className="purpose-list"><div><HandHeart/> Meaningful assistance</div><div><Users/> Community participation</div><div><ShieldCheck/> Responsible coordination</div></div>
      </section>
      <section className="join-banner"><span className="eyebrow">BE PART OF THE CHANGE</span><h2>Kindness starts with you.</h2><p>Your time and compassion can make a difference in someone's life.</p><button className="light-btn" onClick={onVolunteer}>Join our community <ArrowRight size={16}/></button></section>
    </main>
  </>;
}

function ServicesPage({ onReport }) {
  return <main className="inner-page"><div className="page-heading"><span className="eyebrow">OUR SERVICES</span><h1>Ways to make a difference</h1><p>Choose the kind of assistance you want to report. A registered responder can review the request.</p></div><div className="service-grid service-grid-page">{categories.map(c => { const Icon = c.icon; return <article className="service-card" key={c.value}><div className="service-icon"><Icon size={25}/></div><h3>{c.label}</h3><p>Share the location and details so the community can understand the need and respond where possible.</p><button className="text-link" onClick={onReport}>Create a report <ArrowRight size={15}/></button></article>; })}</div></main>;
}

function Stat({ label, value, icon: Icon }) {
  return <div className="stat-card"><Icon size={21}/><strong>{value}</strong><span>{label}</span></div>;
}

function ReportCard({ report, user, isResponder, onAccept, onStatus }) {
  const cat = categories.find(c => c.value === report.category);
  const Icon = cat?.icon || ClipboardList;
  const canUpdate = user && (user.is_staff || report.assigned_to === user.id);
  return <article className="report-card">
    {report.photo_url && <img className="report-photo" src={report.photo_url} alt="Report attachment"/>}
    <div className="report-card-body">
      <div className="report-meta"><span className="category-tag"><Icon size={14}/>{report.category_display}</span><span className={`status-tag ${report.status}`}>{statusLabels[report.status]}</span></div>
      <h3>{report.title}</h3>
      <p>{report.description}</p>
      <div className="report-detail"><MapPin size={15}/>{report.address}</div>
      <div className="report-detail"><UserRound size={15}/>Reported by {report.created_by_name}</div>
      {report.assigned_to_name && <div className="report-detail"><Users size={15}/>Responder: {report.assigned_to_name}</div>}
      <div className="report-date"><Clock3 size={14}/>{new Date(report.created_at).toLocaleString()}</div>
      {isResponder && report.status === "open" && <button className="solid-btn card-action" onClick={() => onAccept(report.id)}>Accept request <ArrowRight size={15}/></button>}
      {canUpdate && ["accepted", "in_progress"].includes(report.status) && <div className="status-actions">
        {report.status === "accepted" && <button className="outline-btn card-action" onClick={() => onStatus(report.id, "in_progress")}>Start progress</button>}
        <button className="solid-btn card-action" onClick={() => onStatus(report.id, "resolved")}>Mark resolved</button>
      </div>}
    </div>
  </article>;
}

export default App;
