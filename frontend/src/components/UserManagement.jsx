import { useCallback, useEffect, useState } from 'react';
import axiosInstance from '../utils/axiosInstance';
import { getApiErrorMessage } from '../utils/formatters';

function StatusBadge({ active }) {
  if (active) {
    return (
      <span className="inline-flex rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700 dark:bg-green-500/20 dark:text-green-400">
        Active
      </span>
    );
  }
  return (
    <span className="inline-flex rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-700 dark:bg-red-500/20 dark:text-red-400">
      Inactive
    </span>
  );
}

const inputClass =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100';

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(null);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [createdCredentials, setCreatedCredentials] = useState(null);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState('');
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');

  const [form, setForm] = useState({
    uid: '',
    name: '',
    email: '',
    role: 'employee',
    active: true,
    manager_uid: '',
  });

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const response = await axiosInstance.get('/api/admin/users');
      setUsers(response.data.data.users ?? []);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to load users.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const managers = users.filter((u) => u.role === 'manager' && u.active);

  const handleDeactivate = async (uid) => {
    if (!window.confirm('Deactivate this user?')) return;

    setActionLoading(uid);
    try {
      await axiosInstance.post('/api/auth/deactivate-user', { uid });
      await fetchUsers();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to deactivate user.'));
    } finally {
      setActionLoading(null);
    }
  };

  const resetForm = () => {
    setForm({ uid: '', name: '', email: '', role: 'employee', active: true, manager_uid: '' });
    setCreateError('');
    setEditError('');
  };

  const openCreateModal = () => {
    resetForm();
    setShowCreateModal(true);
  };

  const closeCreateModal = () => {
    setShowCreateModal(false);
    resetForm();
  };

  const openEditModal = (user) => {
    setForm({
      uid: user.uid,
      name: user.name ?? '',
      email: user.email ?? '',
      role: user.role ?? 'employee',
      active: user.active ?? true,
      manager_uid: user.manager_uid ?? '',
    });
    setEditError('');
    setShowEditModal(true);
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    resetForm();
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setCreateLoading(true);
    setCreateError('');

    try {
      const body = {
        email: form.email.trim(),
        name: form.name.trim(),
        role: form.role,
      };
      if (form.role === 'employee' && form.manager_uid) {
        body.manager_uid = form.manager_uid;
      }

      const response = await axiosInstance.post('/api/auth/create-user', body);
      const data = response.data.data;

      setCreatedCredentials({
        email: data.email,
        temporary_password: data.temporary_password,
      });
      setShowCreateModal(false);
      setShowPasswordModal(true);
      await fetchUsers();
    } catch (err) {
      setCreateError(getApiErrorMessage(err, 'Failed to create user.'));
    } finally {
      setCreateLoading(false);
    }
  };

  const closePasswordModal = () => {
    setShowPasswordModal(false);
    setCreatedCredentials(null);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setEditLoading(true);
    setEditError('');

    try {
      const body = {
        uid: form.uid,
        email: form.email.trim(),
        name: form.name.trim(),
        role: form.role,
        active: form.active,
      };

      if (form.role === 'employee') {
        body.manager_uid = form.manager_uid || '';
      }

      await axiosInstance.post('/api/admin/update-user', body);
      closeEditModal();
      await fetchUsers();
    } catch (err) {
      setEditError(getApiErrorMessage(err, 'Failed to update user.'));
    } finally {
      setEditLoading(false);
    }
  };

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="page-lead">Create and manage employee accounts.</p>
        <button
          type="button"
          onClick={openCreateModal}
          className="shrink-0 rounded-lg bg-cyan-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-cyan-500"
        >
          Create user
        </button>
      </div>

      {error && (
        <div className="alert-error" role="alert">
          {error}
        </div>
      )}

      {loading && (
        <div className="flex justify-center py-12">
          <div
            className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-cyan-600 dark:border-slate-700 dark:border-t-cyan-400"
            role="status"
            aria-label="Loading users"
          />
        </div>
      )}

      {!loading && !users.length && !error && (
        <div className="panel px-6 py-12 text-center text-sm text-slate-500 dark:text-slate-400">
          No users found
        </div>
      )}

      {!loading && users.length > 0 && (
        <div className="panel overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-700">
              <thead className="bg-slate-50 dark:bg-slate-900/50">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600 dark:text-slate-300">Name</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600 dark:text-slate-300">Email</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600 dark:text-slate-300">Role</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600 dark:text-slate-300">Status</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600 dark:text-slate-300">Progress</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600 dark:text-slate-300">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {users.map((user) => (
                  <tr key={user.uid} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                    <td className="whitespace-nowrap px-4 py-3 font-medium text-slate-900 dark:text-slate-100">
                      {user.name}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-600 dark:text-slate-400">
                      {user.email}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 capitalize text-slate-700 dark:text-slate-300">
                      {user.role}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <StatusBadge active={user.active} />
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-700 dark:text-slate-300">
                      {user.modules_completed ?? 0} / 8
                      {user.certificate_earned && (
                        <span className="ml-2 text-xs font-medium text-green-600 dark:text-green-400">
                          Certified
                        </span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => openEditModal(user)}
                          className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeactivate(user.uid)}
                          disabled={!user.active || actionLoading === user.uid}
                          className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-red-500/40 dark:text-red-400 dark:hover:bg-red-500/10"
                        >
                          {actionLoading === user.uid ? 'Deactivating…' : 'Deactivate'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="panel w-full max-w-md p-6 shadow-lg" role="dialog" aria-labelledby="create-user-title">
            <h3 id="create-user-title" className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Create user
            </h3>

            {createError && (
              <div className="alert-error mt-4" role="alert">
                {createError}
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="mt-4 space-y-4">
              <div>
                <label htmlFor="create-name" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Full name
                </label>
                <input
                  id="create-name"
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className={inputClass}
                />
              </div>

              <div>
                <label htmlFor="create-email" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Email
                </label>
                <input
                  id="create-email"
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  className={inputClass}
                />
              </div>

              <div>
                <label htmlFor="create-role" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Role
                </label>
                <select
                  id="create-role"
                  value={form.role}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      role: e.target.value,
                      manager_uid: e.target.value === 'manager' ? '' : f.manager_uid,
                    }))
                  }
                  className={inputClass}
                >
                  <option value="employee">Employee</option>
                  <option value="manager">Manager</option>
                </select>
              </div>

              {form.role === 'employee' && (
                <div>
                  <label
                    htmlFor="create-manager"
                    className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300"
                  >
                    Assign manager
                  </label>
                  <select
                    id="create-manager"
                    value={form.manager_uid}
                    onChange={(e) => setForm((f) => ({ ...f, manager_uid: e.target.value }))}
                    className={inputClass}
                  >
                    <option value="">— Select manager —</option>
                    {managers.map((m) => (
                      <option key={m.uid} value={m.uid}>
                        {m.name} ({m.email})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeCreateModal}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createLoading}
                  className="rounded-lg bg-cyan-600 px-4 py-2 text-sm font-medium text-white hover:bg-cyan-500 disabled:opacity-60"
                >
                  {createLoading ? 'Creating…' : 'Create user'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="panel w-full max-w-md p-6 shadow-lg" role="dialog" aria-labelledby="edit-user-title">
            <h3 id="edit-user-title" className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Edit user
            </h3>

            {editError && (
              <div className="alert-error mt-4" role="alert">
                {editError}
              </div>
            )}

            <form onSubmit={handleEditSubmit} className="mt-4 space-y-4">
              <div>
                <label htmlFor="edit-name" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Full name
                </label>
                <input
                  id="edit-name"
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className={inputClass}
                />
              </div>

              <div>
                <label htmlFor="edit-email" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Email
                </label>
                <input
                  id="edit-email"
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  className={inputClass}
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="edit-role" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Role
                  </label>
                  <select
                    id="edit-role"
                    value={form.role}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        role: e.target.value,
                        manager_uid: e.target.value === 'manager' ? '' : f.manager_uid,
                      }))
                    }
                    className={inputClass}
                  >
                    <option value="employee">Employee</option>
                    <option value="manager">Manager</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="edit-status" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Status
                  </label>
                  <select
                    id="edit-status"
                    value={form.active ? 'active' : 'inactive'}
                    onChange={(e) => setForm((f) => ({ ...f, active: e.target.value === 'active' }))}
                    className={inputClass}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              {form.role === 'employee' && (
                <div>
                  <label htmlFor="edit-manager" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Manager
                  </label>
                  <select
                    id="edit-manager"
                    value={form.manager_uid}
                    onChange={(e) => setForm((f) => ({ ...f, manager_uid: e.target.value }))}
                    className={inputClass}
                  >
                    <option value="">No manager</option>
                    {managers.map((m) => (
                      <option key={m.uid} value={m.uid}>
                        {m.name} ({m.email})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeEditModal}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editLoading}
                  className="rounded-lg bg-cyan-600 px-4 py-2 text-sm font-medium text-white hover:bg-cyan-500 disabled:opacity-60"
                >
                  {editLoading ? 'Saving…' : 'Save changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showPasswordModal && createdCredentials && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="panel w-full max-w-md p-6 shadow-lg" role="dialog" aria-labelledby="credentials-title">
            <h3 id="credentials-title" className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              User created
            </h3>
            <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
              Share these credentials with the employee:
            </p>
            <div className="panel-muted mt-4 space-y-2 p-4 text-sm">
              <p>
                <span className="font-medium text-slate-700 dark:text-slate-300">Email:</span>{' '}
                <span className="text-slate-900 dark:text-slate-100">{createdCredentials.email}</span>
              </p>
              <p>
                <span className="font-medium text-slate-700 dark:text-slate-300">Temporary password:</span>{' '}
                <span className="font-mono text-slate-900 dark:text-slate-100">
                  {createdCredentials.temporary_password}
                </span>
              </p>
            </div>
            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={closePasswordModal}
                className="rounded-lg bg-cyan-600 px-4 py-2 text-sm font-medium text-white hover:bg-cyan-500"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
