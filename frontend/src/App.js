import { useCallback, useEffect, useState } from 'react';

const API = (process.env.REACT_APP_API_URL || 'http://localhost:5000').replace(/\/$/, '');

async function request(path, options) {
  const res = await fetch(`${API}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `Request failed (${res.status})`);
  }
  return res.status === 204 ? null : res.json();
}

export default function App() {
  const [notes, setNotes] = useState([]);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setNotes(await request('/api/notes'));
      setError('');
    } catch (e) {
      setError(`Can't reach the notes service: ${e.message}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const act = async (fn) => {
    try { await fn(); await load(); } catch (e) { setError(e.message); }
  };

  const add = (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    act(async () => {
      await request('/api/notes', { method: 'POST', body: JSON.stringify({ title, body }) });
      setTitle('');
      setBody('');
    });
  };

  const open = notes.filter((n) => !n.done).length;

  return (
    <main className="page">
      <header className="masthead">
        <h1>Three tier Notes App</h1>
        <p>{loading ? 'Loading…' : `${open} open, ${notes.length - open} done`}</p>
      </header>

      <form className="entry" onSubmit={add}>
        <label htmlFor="title">Title</label>
        <input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="What do you need to remember?" />
        <label htmlFor="body">Details</label>
        <textarea id="body" rows="3" value={body} onChange={(e) => setBody(e.target.value)} placeholder="Optional" />
        <button type="submit" disabled={!title.trim()}>Add note</button>
      </form>

      {error && (
        <div className="error" role="alert">
          {error} <button onClick={load}>Retry</button>
        </div>
      )}

      {!loading && !error && notes.length === 0 && (
        <p className="empty">Nothing here yet. Write your first note above.</p>
      )}

      <ul className="notes">
        {notes.map((n) => (
          <li key={n.id} className={n.done ? 'done' : ''}>
            <div>
              <h2>{n.title}</h2>
              {n.body && <p>{n.body}</p>}
              <time dateTime={n.created_at}>{new Date(n.created_at).toLocaleDateString()}</time>
            </div>
            <div className="actions">
              <button onClick={() => act(() => request(`/api/notes/${n.id}/toggle`, { method: 'PATCH' }))}>
                {n.done ? 'Reopen' : 'Mark done'}
              </button>
              <button className="quiet" onClick={() => act(() => request(`/api/notes/${n.id}`, { method: 'DELETE' }))}>
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}
