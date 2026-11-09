import { useCallback, useEffect, useState } from "react";
import { API, adminFetch } from "../spareApi";
import "./AdminPages.css";
import "./UserManagement.css";

const emptyForm = { name: "", email: "", userId: "", password: "" };

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState("");
  const [includeDeleted, setIncludeDeleted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState(null);

  const loadUsers = useCallback(async (signal) => {
    setLoading(true);
    setError("");
    try {
      const response = await adminFetch(
        `${API}/api/admin/users${includeDeleted ? "?includeDeleted=true" : ""}`,
        { signal }
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Unable to load users.");
      if (!Array.isArray(data)) throw new Error("The server returned invalid user data.");
      setUsers(data);
    } catch (loadError) {
      if (loadError.name !== "AbortError") setError(loadError.message);
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [includeDeleted]);

  useEffect(() => {
    const controller = new AbortController();
    loadUsers(controller.signal);
    return () => controller.abort();
  }, [loadUsers]);

  const updateForm = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const generateCredentials = async () => {
    setError("");
    try {
      const response = await adminFetch(`${API}/api/admin/users/credentials`, { method: "POST" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Could not generate credentials.");
      setForm((current) => ({ ...current, userId: data.userId, password: data.password }));
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  const saveUser = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setNotice(null);
    try {
      const response = await adminFetch(
        editingId ? `${API}/api/admin/users/${editingId}` : `${API}/api/admin/users`,
        {
          method: editingId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: form.name,
            email: form.email,
            ...(editingId
              ? { userId: form.userId }
              : { userId: form.userId, ...(form.password ? { password: form.password } : {}) }),
          }),
        }
      );
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Could not save this user.");
      setForm(emptyForm);
      setEditingId("");
      setNotice(editingId
        ? { message: "User details updated.", password: "" }
        : {
          message: "User created. Share these credentials securely.",
          ...(result.generatedCredentials || (form.password
            ? { userId: result.user.userId, password: form.password }
            : {})),
        });
      await loadUsers();
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setSaving(false);
    }
  };

  const editUser = (user) => {
    setEditingId(user._id);
    setForm({ name: user.name, email: user.email, userId: user.userId, password: "" });
    setNotice(null);
    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const cancelEdit = () => {
    setEditingId("");
    setForm(emptyForm);
  };

  const performAction = async (user, action, options = {}) => {
    setError("");
    setNotice(null);
    try {
      const response = await adminFetch(`${API}/api/admin/users/${user._id}${action.path}`, {
        method: action.method,
        ...(options.body ? {
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(options.body),
        } : {}),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || `Could not ${action.label.toLowerCase()} user.`);
      if (result.password) {
        setNotice({
          message: `${action.label} complete. Share the temporary password securely.`,
          userId: user.userId,
          password: result.password,
        });
      }
      await loadUsers();
    } catch (actionError) {
      setError(actionError.message);
    }
  };

  const resetPassword = (user) => {
    void performAction(user, { path: "/reset-password", method: "POST", label: "Password reset" });
  };

  const toggleStatus = (user) => {
    const status = user.status === "active" ? "inactive" : "active";
    void performAction(user, { path: "/status", method: "PATCH", label: status === "active" ? "Activation" : "Deactivation" }, {
      body: { status },
    });
  };

  const deleteUser = (user) => {
    if (!window.confirm(`Soft-delete ${user.name}'s account? You can restore it later.`)) return;
    void performAction(user, { path: "", method: "DELETE", label: "Deletion" });
  };

  const restoreUser = (user) => {
    void performAction(user, { path: "/restore", method: "PATCH", label: "Restoration" });
  };

  return (
    <div className="admin-page user-management-page">
      <div className="page-title">
        <div>
          <h1>User Management</h1>
          <p>Create customer accounts, manage access, and recover deleted accounts.</p>
        </div>
        <button type="button" className="primary-btn" onClick={() => loadUsers()} disabled={loading}>
          {loading ? "Refreshing…" : "Refresh"}
        </button>
      </div>

      {error && <div className="um-alert um-alert-error" role="alert">{error}</div>}
      {notice && (
        <div className="um-alert um-alert-success" role="status">
          <p>{notice.message}</p>
          {notice.userId && <p><strong>User ID:</strong> <code>{notice.userId}</code></p>}
          {notice.password && <p><strong>Temporary password:</strong> <code>{notice.password}</code></p>}
        </div>
      )}

      <section className="admin-form-card">
        <h2>{editingId ? "Edit user" : "Create user"}</h2>
        <form onSubmit={saveUser}>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="um-name">Name</label>
              <input id="um-name" name="name" value={form.name} onChange={updateForm} minLength="2" maxLength="120" required />
            </div>
            <div className="form-group">
              <label htmlFor="um-email">Email</label>
              <input id="um-email" name="email" type="email" value={form.email} onChange={updateForm} maxLength="254" required />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="um-user-id">User ID</label>
              <div className="um-input-action">
                <input id="um-user-id" name="userId" value={form.userId} onChange={updateForm} minLength="2" maxLength="40" pattern="[A-Za-z0-9][A-Za-z0-9_-]{1,39}" placeholder="Leave blank to generate automatically" required={Boolean(editingId)} />
                {!editingId && (
                  <button type="button" className="edit-btn" onClick={generateCredentials}>
                    Generate ID &amp; password
                  </button>
                )}
              </div>
            </div>
            {!editingId && (
              <div className="form-group">
                <label htmlFor="um-password">Password <span>(leave blank to generate securely)</span></label>
                <input id="um-password" name="password" type="text" value={form.password} onChange={updateForm} minLength="12" maxLength="72" autoComplete="new-password" />
              </div>
            )}
          </div>
          <div className="um-form-actions">
            <button type="submit" className="primary-btn" disabled={saving}>
              {saving ? "Saving…" : editingId ? "Save changes" : "Create user"}
            </button>
            {editingId && <button type="button" className="edit-btn" onClick={cancelEdit}>Cancel</button>}
          </div>
        </form>
      </section>

      <section className="admin-table-card">
        <div className="table-header">
          <h2>Customer accounts</h2>
          <span>{users.length} accounts</span>
        </div>
        <div className="um-list-filter">
          <label>
            <input type="checkbox" checked={includeDeleted} onChange={(event) => setIncludeDeleted(event.target.checked)} />
            Include soft-deleted accounts
          </label>
        </div>
        {loading && users.length === 0 ? (
          <p className="um-empty">Loading users…</p>
        ) : !users.length ? (
          <p className="um-empty">No user accounts found.</p>
        ) : (
          <div className="table-wrapper">
            <table className="um-table">
              <thead>
                <tr><th>Name</th><th>Email</th><th>User ID</th><th>Status</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {users.map((user) => {
                  const deleted = Boolean(user.deletedAt);
                  return (
                    <tr key={user._id}>
                      <td><strong>{user.name}</strong></td>
                      <td>{user.email}</td>
                      <td><code>{user.userId || "—"}</code></td>
                      <td>
                        <span className={`um-status um-status-${deleted ? "deleted" : user.status}`}>
                          {deleted ? "Deleted" : user.status}
                        </span>
                      </td>
                      <td className="um-actions">
                        {deleted ? (
                          <button type="button" className="edit-btn" onClick={() => restoreUser(user)}>Restore</button>
                        ) : (
                          <>
                            <button type="button" className="edit-btn" onClick={() => editUser(user)}>Edit</button>
                            <button type="button" className="edit-btn" onClick={() => resetPassword(user)}>Reset password</button>
                            <button type="button" className="edit-btn" onClick={() => toggleStatus(user)}>
                              {user.status === "active" ? "Deactivate" : "Activate"}
                            </button>
                            <button type="button" className="delete-btn" onClick={() => deleteUser(user)}>Delete</button>
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
