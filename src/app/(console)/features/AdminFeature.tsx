"use client";

import { useCallback, useEffect, useState } from "react";
import { RefreshCw, Loader2, Users, ShieldAlert, CheckCircle2, AlertTriangle } from "lucide-react";
import { apiGet, apiPut } from "@/lib/adyen/api";
import type { ManagedUser, UserListResponse } from "@/lib/adyen/types";

type Status = { type: "ok" | "err"; msg: string };

const ROLES: ManagedUser["role"][] = ["admin", "im", "user"];

export default function AdminFeature() {
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [status, setStatus] = useState<Status | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    setStatus(null);
    apiGet<UserListResponse>("/api/admin/users")
      .then((res) => setUsers(res.users ?? []))
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  async function changeRole(user: ManagedUser, role: ManagedUser["role"]) {
    if (role === user.role) return;
    setSavingId(user.userId);
    setStatus(null);
    try {
      const updated = await apiPut<ManagedUser>(`/api/admin/users/${user.userId}/role`, { role });
      setUsers((prev) => prev.map((u) => (u.userId === updated.userId ? updated : u)));
      setStatus({ type: "ok", msg: `Updated ${updated.email} to ${updated.role}.` });
    } catch (err) {
      setStatus({ type: "err", msg: err instanceof Error ? err.message : "Failed to update role." });
    } finally {
      setSavingId(null);
    }
  }

  return (
    <div className="cb-main">
      <header className="cb-head">
        <div>
          <h1 className="cb-head__title">Users</h1>
          <p className="cb-head__sub">
            Manage every user&apos;s role. <code>admin</code> can configure credentials and sees this
            panel; <code>im</code> can configure; <code>user</code> is read-only.
          </p>
        </div>
        <button className="cb-btn" onClick={load} disabled={loading}>
          {loading ? <Loader2 size={14} className="cb-spin" /> : <RefreshCw size={14} />}
          Refresh
        </button>
      </header>

      {status && (
        <div className={`cb-banner cb-banner--${status.type === "ok" ? "ok" : "err"}`} style={{ marginBottom: 18 }}>
          {status.type === "ok" ? <CheckCircle2 size={15} /> : <AlertTriangle size={15} />}
          <span>{status.msg}</span>
        </div>
      )}

      {loading && users.length === 0 ? (
        <div className="cb-skel-list">
          {Array.from({ length: 5 }).map((_, i) => <div key={i} className="cb-skel" />)}
        </div>
      ) : error ? (
        <div className="cb-panel">
          <div className="cb-empty">
            <ShieldAlert size={22} />
            <p>{error}</p>
          </div>
        </div>
      ) : users.length === 0 ? (
        <div className="cb-panel"><div className="cb-empty"><Users size={22} /><p>No users found</p></div></div>
      ) : (
        <div className="cb-panel">
          {users.map((u) => (
            <div key={u.userId} className="cb-usrrow">
              <span className="cb-usrrow__id">
                <b>{u.email || "—"}</b>
                <span>{u.userId}</span>
              </span>
              <span className={`cb-pill cb-usrrole cb-usrrole--${u.role}`}>{u.role}</span>
              <label className="cb-usrrow__set">
                <span>Role</span>
                <select
                  className="cb-input cb-usrrow__select"
                  value={u.role}
                  disabled={savingId === u.userId}
                  onChange={(e) => changeRole(u, e.target.value as ManagedUser["role"])}
                >
                  {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
                {savingId === u.userId && <Loader2 size={13} className="cb-spin" />}
              </label>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
