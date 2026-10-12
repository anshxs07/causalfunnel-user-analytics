
import { useEffect, useState } from "react";
import "./App.css";

const API = "http://localhost:4000/api";

function App() {
  const [view, setView] = useState("sessions");
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState("");
  const [events, setEvents] = useState([]);
  const [pages, setPages] = useState([]);
  const [pageUrl, setPageUrl] = useState("");
  const [clicks, setClicks] = useState([]);
  const [stats, setStats] = useState({
    sessions: 0,
    events: 0,
    views: 0,
    clicks: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function request(url) {
    const response = await fetch(url);
    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.message || "Request failed");
    }

    return result;
  }

  async function loadSessions() {
    setLoading(true);
    setError("");

    try {
      const result = await request(`${API}/sessions?limit=100`);
      const list = result.data || [];

      setSessions(list);
      setStats({
        sessions: result.total_sessions || list.length,
        events: list.reduce((sum, s) => sum + s.total_events, 0),
        views: list.reduce((sum, s) => sum + s.page_views, 0),
        clicks: list.reduce((sum, s) => sum + s.clicks, 0),
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function openSession(sessionId) {
    setSelectedSession(sessionId);
    setView("journey");
    setLoading(true);
    setError("");

    try {
      const result = await request(
        `${API}/sessions/${encodeURIComponent(sessionId)}/events?limit=500`
      );
      setEvents(result.data || []);
    } catch (err) {
      setError(err.message);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }

  async function loadPages() {
    setLoading(true);
    setError("");

    try {
      const result = await request(`${API}/heatmap/pages`);
      const list = result.data || [];
      setPages(list);

      if (list.length) {
        setPageUrl((current) =>
          list.some((p) => p.page_url === current)
            ? current
            : list[0].page_url
        );
      } else {
        setPageUrl("");
        setClicks([]);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function loadHeatmap(url) {
    if (!url) return;

    setLoading(true);
    setError("");

    try {
      const result = await request(
        `${API}/heatmap?url=${encodeURIComponent(url)}`
      );
      setClicks(result.data || []);
    } catch (err) {
      setError(err.message);
      setClicks([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSessions();
  }, []);

  useEffect(() => {
    if (view === "heatmap") loadPages();
  }, [view]);

  useEffect(() => {
    if (view === "heatmap" && pageUrl) loadHeatmap(pageUrl);
  }, [view, pageUrl]);

  const date = (value) =>
    value ? new Date(value).toLocaleString() : "—";

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">C</div>
          <div>
            <strong>CausalFunnel</strong>
            <small>ANALYTICS</small>
          </div>
        </div>

        <p className="nav-heading">WORKSPACE</p>

        <button
          className={`nav-item ${view === "sessions" ? "active" : ""}`}
          onClick={() => setView("sessions")}
        >
          <span>▦</span> Sessions
        </button>

        <button
          className={`nav-item ${view === "heatmap" ? "active" : ""}`}
          onClick={() => setView("heatmap")}
        >
          <span>◉</span> Click Heatmap
        </button>

        <div className="sidebar-bottom">
          <span className="status-dot" />
          Backend API
          <span className="online-label">Connected*</span>
          <small>*Verified when requests succeed</small>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div>
            <p className="eyebrow">ANALYTICS / OVERVIEW</p>
            <h1>
              {view === "sessions"
                ? "User Analytics"
                : view === "journey"
                ? "User Journey"
                : "Click Heatmap"}
            </h1>
            <p className="subtitle">
              Understand how visitors interact with your website.
            </p>
          </div>

          <button
            className="refresh-btn"
            onClick={() =>
              view === "heatmap"
                ? loadHeatmap(pageUrl)
                : view === "journey"
                ? openSession(selectedSession)
                : loadSessions()
            }
          >
            ↻ Refresh data
          </button>
        </header>

        {error && (
          <div className="error-banner">
            <strong>Unable to load data:</strong> {error}
            <p>
              Confirm that the backend is running on port 4000 and MongoDB
              is connected.
            </p>
          </div>
        )}

        {view === "sessions" && (
          <>
            <section className="stats-grid">
              <Stat label="Total Sessions" value={stats.sessions} icon="◉" />
              <Stat label="Total Events" value={stats.events} icon="↗" />
              <Stat label="Page Views" value={stats.views} icon="▤" />
              <Stat label="Total Clicks" value={stats.clicks} icon="⌁" />
            </section>

            <section className="panel">
              <div className="panel-heading">
                <div>
                  <h2>Recent Sessions</h2>
                  <p>Click any session to explore its user journey.</p>
                </div>
                <span className="count-pill">
                  {sessions.length} sessions loaded
                </span>
              </div>

              {loading && <p className="message">Loading sessions...</p>}

              {!loading && sessions.length === 0 && !error && (
                <div className="empty-state">
                  <div className="empty-icon">◉</div>
                  <h3>No sessions found</h3>
                  <p>
                    Visit your demo website and interact with it to generate
                    analytics events.
                  </p>
                </div>
              )}

              {sessions.length > 0 && (
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>SESSION ID</th>
                        <th>EVENTS</th>
                        <th>PAGE VIEWS</th>
                        <th>CLICKS</th>
                        <th>LAST ACTIVE</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {sessions.map((session) => (
                        <tr key={session.session_id}>
                          <td>
                            <div className="session-cell">
                              <span className="avatar">
                                {session.session_id.slice(-1).toUpperCase()}
                              </span>
                              <span>{session.session_id}</span>
                            </div>
                          </td>
                          <td>
                            <strong>{session.total_events}</strong>
                          </td>
                          <td>{session.page_views}</td>
                          <td>{session.clicks}</td>
                          <td>{date(session.last_seen)}</td>
                          <td>
                            <button
                              className="text-btn"
                              onClick={() =>
                                openSession(session.session_id)
                              }
                            >
                              View journey →
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>
        )}

        {view === "journey" && (
          <section className="panel">
            <div className="panel-heading">
              <div>
                <button
                  className="back-btn"
                  onClick={() => setView("sessions")}
                >
                  ← Back to sessions
                </button>
                <h2>Session timeline</h2>
                <p className="session-id">{selectedSession}</p>
              </div>
              <span className="count-pill">
                {events.length} events loaded
              </span>
            </div>

            {loading && <p className="message">Loading journey...</p>}

            {!loading && events.length === 0 && !error && (
              <p className="message">No events found for this session.</p>
            )}

            <div className="timeline">
              {events.map((event, index) => (
                <div className="timeline-item" key={event._id || index}>
                  <div
                    className={`timeline-marker ${
                      event.event_type === "click" ? "click-marker" : ""
                    }`}
                  >
                    {event.event_type === "click" ? "↗" : "▤"}
                  </div>
                  <div className="event-card">
                    <div className="event-top">
                      <strong>
                        {event.event_type === "page_view"
                          ? "Page View"
                          : "Click"}
                      </strong>
                      <span>{date(event.timestamp)}</span>
                    </div>
                    <p className="event-url">{event.page_url}</p>
                    {event.event_type === "click" && (
                      <p className="coordinates">
                        Click coordinates: ({event.click_x}, {event.click_y})
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {view === "heatmap" && (
          <section className="panel">
            <div className="panel-heading">
              <div>
                <h2>Click activity</h2>
                <p>Explore recorded click positions for a page.</p>
              </div>
              <span className="count-pill">{clicks.length} clicks loaded</span>
            </div>

            <div className="page-selector">
              <label htmlFor="page-select">Select tracked page</label>
              <select
                id="page-select"
                value={pageUrl}
                onChange={(e) => setPageUrl(e.target.value)}
              >
                <option value="">Choose a page</option>
                {pages.map((page) => (
                  <option key={page.page_url} value={page.page_url}>
                    {page.page_url} ({page.total_clicks} clicks)
                  </option>
                ))}
              </select>
            </div>

            {!loading && pages.length === 0 && !error && (
              <div className="empty-state">
                <h3>No click data yet</h3>
                <p>Click elements on the tracked website first.</p>
              </div>
            )}

            {pageUrl && (
              <>
                <div className="heatmap-summary">
                  <div>
                    <span>Recorded clicks</span>
                    <strong>{clicks.length}</strong>
                  </div>
                  <div>
                    <span>Page URL</span>
                    <strong className="page-summary-url">{pageUrl}</strong>
                  </div>
                </div>

                <div className="heatmap-canvas">
                  <div className="heatmap-placeholder">
                    <span className="placeholder-icon">⌖</span>
                    <strong>Click position map</strong>
                    <p>
                      Markers represent recorded viewport coordinates, not a
                      screenshot of the original page.
                    </p>
                  </div>

                  {clicks.map((click, index) => {
                    const width = click.viewport_width || 1440;
                    const height = click.viewport_height || 900;

                    return (
                      <span
                        key={`${click.session_id}-${click.timestamp}-${index}`}
                        className="heat-dot"
                        title={`x: ${click.click_x}, y: ${click.click_y}`}
                        style={{
                          left: `${Math.min(
                            100,
                            Math.max(0, (click.click_x / width) * 100)
                          )}%`,
                          top: `${Math.min(
                            100,
                            Math.max(0, (click.click_y / height) * 100)
                          )}%`,
                        }}
                      />
                    );
                  })}
                </div>

                <p className="heatmap-note">
                  Coordinates are scaled against the recorded viewport. For
                  an accurate overlay, use the matching page layout and
                  viewport dimensions.
                </p>
              </>
            )}
          </section>
        )}

        <footer className="footer">
          CausalFunnel Analytics <span>•</span> User behavior insights
        </footer>
      </main>
    </div>
  );
}

function Stat({ label, value, icon }) {
  return (
    <div className="stat-card">
      <div className="stat-top">
        <span>{label}</span>
        <span className="stat-icon">{icon}</span>
      </div>
      <strong>{value.toLocaleString()}</strong>
      <span className="stat-caption">Recorded analytics data</span>
    </div>
  );
}

export default App;
