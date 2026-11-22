import { useCallback, useEffect, useMemo, useState } from "react";
import {
  LifeBuoy, Send, RefreshCw, MessageSquare, Clock, CheckCircle2,
  Search, Ticket, AlertCircle, ShieldCheck, Filter, CalendarDays
} from "lucide-react";
import api from "../services/api";
import Toast from "../components/Toast";
import "./Support.css";

const categories = ["General", "Policy", "Claims", "Payments", "Technical", "Account"];
const priorities = ["Low", "Medium", "High", "Urgent"];
const statuses = ["Open", "InProgress", "Resolved", "Closed"];

function formatStatus(status) {
  return status === "InProgress" ? "In Progress" : status || "Open";
}

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString();
}

function getErrorMessage(error) {
  return error.response?.data?.message ||
    error.response?.data?.title ||
    error.message ||
    "Something went wrong. Please try again.";
}

export default function Support() {
  const userRole = localStorage.getItem("userRole");
  const isAdmin = userRole === "Admin";
  const isClaimsManager = userRole === "ClaimsManager";
  const roleLabel = isAdmin ? "Administrator" : isClaimsManager ? "Claims Manager" : "Customer";

  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [savingId, setSavingId] = useState(null);
  const [error, setError] = useState("");
  const [toast, setToast] = useState(null);
  const [drafts, setDrafts] = useState({});
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [showForm, setShowForm] = useState(false);

  const emptyForm = {
    subject: "",
    category: "General",
    priority: "Medium",
    description: "",
  };

  const [form, setForm] = useState(emptyForm);

  const loadTickets = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await api.get("/support");
      setTickets(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTickets();
  }, [loadTickets]);

  const stats = useMemo(() => ({
    total: tickets.length,
    open: tickets.filter(t => t.status === "Open").length,
    progress: tickets.filter(t => t.status === "InProgress").length,
    resolved: tickets.filter(t => ["Resolved", "Closed"].includes(t.status)).length,
    urgent: tickets.filter(t => t.priority === "Urgent" && !["Resolved", "Closed"].includes(t.status)).length,
  }), [tickets]);

  const filteredTickets = useMemo(() => {
    const term = search.trim().toLowerCase();

    return tickets.filter(ticket => {
      const matchesSearch = !term ||
        String(ticket.ticketId).includes(term) ||
        (ticket.subject || "").toLowerCase().includes(term) ||
        (ticket.description || "").toLowerCase().includes(term) ||
        (ticket.userName || "").toLowerCase().includes(term);

      const matchesStatus = statusFilter === "All" || ticket.status === statusFilter;
      const matchesCategory = categoryFilter === "All" || ticket.category === categoryFilter;
      const matchesPriority = priorityFilter === "All" || ticket.priority === priorityFilter;

      return matchesSearch && matchesStatus && matchesCategory && matchesPriority;
    });
  }, [tickets, search, statusFilter, categoryFilter, priorityFilter]);

  const handleCreate = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    setToast(null);

    try {
      await api.post("/support", form);
      setForm(emptyForm);
      setShowForm(false);
      setToast({ type: "success", message: "Your support ticket has been submitted successfully.", title: "Ticket Submitted Successfully" });
      await loadTickets();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const updateDraft = (ticket, field, value) => {
    setDrafts(current => ({
      ...current,
      [ticket.ticketId]: {
        status: current[ticket.ticketId]?.status ?? ticket.status,
        adminResponse: current[ticket.ticketId]?.adminResponse ?? ticket.adminResponse ?? "",
        [field]: value,
      },
    }));
  };

  const handleAdminSave = async (ticket) => {
    const draft = drafts[ticket.ticketId] || {
      status: ticket.status,
      adminResponse: ticket.adminResponse || "",
    };

    setSavingId(ticket.ticketId);
    setError("");
    setToast(null);

    try {
      await api.patch(`/support/${ticket.ticketId}/status`, {
        status: draft.status,
        adminResponse: draft.adminResponse,
      });
      setToast({ type: "success", message: `Ticket #${ticket.ticketId} was updated successfully.`, title: "Ticket Updated Successfully" });
      await loadTickets();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSavingId(null);
    }
  };

  const resetFilters = () => {
    setSearch("");
    setStatusFilter("All");
    setCategoryFilter("All");
    setPriorityFilter("All");
  };

  return (
    <div className="page-section support-page">
      <div className="support-hero">
        <div>
          <span className="support-eyebrow"><LifeBuoy size={14} /> SUPPORT & ASSISTANCE</span>
          <h1>{isAdmin ? "Support Management" : "Support Center"}</h1>
          <p>
            {isAdmin
              ? "Manage requests, assist users and keep every support issue moving."
              : "We're here to help with your insurance policies, claims and account."}
          </p>
          <span className="support-role-label"><ShieldCheck size={13} /> {roleLabel} portal</span>
        </div>
        <div className="support-hero-icon"><LifeBuoy size={34} /></div>
      </div>

      {error && <div className="support-alert support-error" role="alert"><AlertCircle size={17} /> {error}</div>}
      <Toast message={toast?.message} type={toast?.type} title={toast?.title} onClose={() => setToast(null)} />

      <div className="support-stats-grid">
        <div className="support-stat-card">
          <span className="support-stat-icon stat-blue"><Ticket size={19} /></span>
          <div><strong>{stats.total}</strong><span>{isAdmin ? "Total tickets" : "My tickets"}</span></div>
        </div>
        <div className="support-stat-card">
          <span className="support-stat-icon stat-orange"><Clock size={19} /></span>
          <div><strong>{stats.open}</strong><span>Open</span></div>
        </div>
        <div className="support-stat-card">
          <span className="support-stat-icon stat-purple"><RefreshCw size={19} /></span>
          <div><strong>{stats.progress}</strong><span>In progress</span></div>
        </div>
        <div className="support-stat-card">
          <span className="support-stat-icon stat-green"><CheckCircle2 size={19} /></span>
          <div><strong>{stats.resolved}</strong><span>Resolved / Closed</span></div>
        </div>
        {isAdmin && (
          <div className="support-stat-card">
            <span className="support-stat-icon stat-red"><AlertCircle size={19} /></span>
            <div><strong>{stats.urgent}</strong><span>Urgent pending</span></div>
          </div>
        )}
      </div>

      {!isAdmin && (
        <section className="panel support-form-panel">
          <div className="support-section-heading">
            <div>
              <h2><MessageSquare size={19} /> Need assistance?</h2>
              <p>Create a request and our administration team will review it.</p>
            </div>
            <button
              className="primary-button support-create-toggle"
              type="button"
              onClick={() => setShowForm(value => !value)}
            >
              <Send size={15} /> {showForm ? "Cancel" : "Create Ticket"}
            </button>
          </div>

          {showForm && (
            <form className="support-form" onSubmit={handleCreate}>
              <div className="support-form-grid">
                <div className="support-field">
                  <label htmlFor="support-subject">Subject</label>
                  <input id="support-subject" type="text" maxLength={120} minLength={3}
                    required value={form.subject}
                    onChange={e => setForm({ ...form, subject: e.target.value })}
                    placeholder="Briefly describe your issue" />
                </div>

                <div className="support-field">
                  <label htmlFor="support-category">Category</label>
                  <select id="support-category" value={form.category}
                    onChange={e => setForm({ ...form, category: e.target.value })}>
                    {categories.map(category => <option key={category}>{category}</option>)}
                  </select>
                </div>

                <div className="support-field">
                  <label htmlFor="support-priority">Priority</label>
                  <select id="support-priority" value={form.priority}
                    onChange={e => setForm({ ...form, priority: e.target.value })}>
                    {priorities.map(priority => <option key={priority}>{priority}</option>)}
                  </select>
                </div>

                <div className="support-field support-description-field">
                  <label htmlFor="support-description">Describe your issue</label>
                  <textarea id="support-description" minLength={10} maxLength={2000}
                    required rows={5} value={form.description}
                    onChange={e => setForm({ ...form, description: e.target.value })}
                    placeholder="Provide details so our team can help you..." />
                  <small>{form.description.length}/2000 characters</small>
                </div>
              </div>
              <button className="primary-button support-submit" type="submit" disabled={submitting}>
                <Send size={15} /> {submitting ? "Submitting..." : "Submit Support Ticket"}
              </button>
            </form>
          )}
        </section>
      )}

      <section className="panel support-tickets-panel">
        <div className="support-section-heading">
          <div>
            <h2><Ticket size={19} /> {isAdmin ? "All Support Requests" : "My Support Requests"}</h2>
            <p>{isAdmin
              ? "Review requests from customers and claims managers."
              : "Track your requests and read responses from the support team."}</p>
          </div>
          <button className="support-refresh" type="button" onClick={loadTickets} disabled={loading}>
            <RefreshCw size={15} className={loading ? "support-spinning" : ""} /> Refresh
          </button>
        </div>

        <div className="support-filters">
          <div className="support-search">
            <Search size={16} />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder={isAdmin ? "Search ticket, subject or user..." : "Search your tickets..."} />
          </div>
          <select aria-label="Filter by status" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="All">All statuses</option>
            {statuses.map(status => <option key={status} value={status}>{formatStatus(status)}</option>)}
          </select>
          <select aria-label="Filter by category" value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}>
            <option value="All">All categories</option>
            {categories.map(category => <option key={category}>{category}</option>)}
          </select>
          <select aria-label="Filter by priority" value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)}>
            <option value="All">All priorities</option>
            {priorities.map(priority => <option key={priority}>{priority}</option>)}
          </select>
          <button className="support-clear-filters" type="button" onClick={resetFilters}>
            <Filter size={14} /> Clear
          </button>
        </div>

        {loading ? (
          <div className="support-empty"><RefreshCw size={25} className="support-spinning" /><strong>Loading requests...</strong></div>
        ) : filteredTickets.length === 0 ? (
          <div className="support-empty">
            <LifeBuoy size={32} />
            <strong>{tickets.length === 0 ? "No support tickets yet" : "No matching tickets"}</strong>
            <span>{tickets.length === 0
              ? isAdmin ? "New customer and claims manager requests will appear here." : "Create a support ticket whenever you need assistance."
              : "Try changing your search or filters."}</span>
            {tickets.length > 0 && <button className="support-clear-filters" type="button" onClick={resetFilters}>Clear filters</button>}
          </div>
        ) : (
          <div className="support-ticket-list">
            {filteredTickets.map(ticket => {
              const draft = drafts[ticket.ticketId] || {
                status: ticket.status,
                adminResponse: ticket.adminResponse || "",
              };

              return (
                <article className="support-ticket-card" key={ticket.ticketId}>
                  <div className="support-ticket-top">
                    <div>
                      <span className="support-ticket-number">TICKET #{ticket.ticketId}</span>
                      <h3>{ticket.subject}</h3>
                    </div>
                    <span className={`support-status status-${ticket.status?.toLowerCase()}`}>
                      {formatStatus(ticket.status)}
                    </span>
                  </div>

                  {isAdmin && (
                    <div className="support-ticket-owner">
                      Submitted by <strong>{ticket.userName}</strong>
                      <span className="support-owner-role">{ticket.userRole}</span>
                    </div>
                  )}

                  <div className="support-ticket-meta">
                    <span>Category: <strong>{ticket.category}</strong></span>
                    <span>Priority: <strong className={`priority-${ticket.priority?.toLowerCase()}`}>{ticket.priority}</strong></span>
                    <span><CalendarDays size={13} /> {formatDate(ticket.createdAt)}</span>
                  </div>

                  <p className="support-ticket-description">{ticket.description}</p>

                  {ticket.adminResponse && (
                    <div className="support-admin-response">
                      <strong><MessageSquare size={15} /> Admin response</strong>
                      <p>{ticket.adminResponse}</p>
                    </div>
                  )}

                  {isAdmin && (
                    <div className="support-admin-controls">
                      <div className="support-field">
                        <label htmlFor={`status-${ticket.ticketId}`}>Ticket status</label>
                        <select id={`status-${ticket.ticketId}`} value={draft.status}
                          onChange={e => updateDraft(ticket, "status", e.target.value)}>
                          {statuses.map(status => <option key={status} value={status}>{formatStatus(status)}</option>)}
                        </select>
                      </div>
                      <div className="support-field">
                        <label htmlFor={`response-${ticket.ticketId}`}>Response to user</label>
                        <textarea id={`response-${ticket.ticketId}`} rows={3} maxLength={2000}
                          value={draft.adminResponse}
                          onChange={e => updateDraft(ticket, "adminResponse", e.target.value)}
                          placeholder="Write an update or response..." />
                      </div>
                      <button className="primary-button support-submit" type="button"
                        disabled={savingId === ticket.ticketId}
                        onClick={() => handleAdminSave(ticket)}>
                        <CheckCircle2 size={15} />
                        {savingId === ticket.ticketId ? "Saving..." : "Save Ticket Update"}
                      </button>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
        <div className="support-results-count">
          Showing {filteredTickets.length} of {tickets.length} tickets
        </div>
      </section>
    </div>
  );
}
