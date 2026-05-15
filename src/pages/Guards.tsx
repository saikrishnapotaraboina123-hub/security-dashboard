import { useEffect, useState } from 'react';
import {
  fetchGuards,
  addGuard,
  updateGuard,
  deleteGuard,
} from '../services/supabase';
import type { SecurityGuard } from '../types';

export default function Guards() {
  const [guards, setGuards] = useState<SecurityGuard[]>([]);
  const [search, setSearch] = useState('');

  const [form, setForm] = useState({
    id: '',
    name: '',
    mac_address: '',
    mobile_number: '',
  });

  const [isEditing, setIsEditing] = useState(false);

  // Load all guards from Supabase
  const loadGuards = async () => {
    try {
      const data = await fetchGuards();
      setGuards(data);
    } catch (err) {
      console.error('Error fetching guards:', err);
    }
  };

  useEffect(() => {
    loadGuards();
  }, []);

  // Add or Update guard
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (isEditing) {
        await updateGuard(form);
        setIsEditing(false);
      } else {
        await addGuard(form);
      }

      setForm({
        id: '',
        name: '',
        mac_address: '',
        mobile_number: '',
      });

      await loadGuards();
    } catch (err) {
      console.error('Error saving guard:', err);
      alert('Something went wrong. Check console.');
    }
  };

  // Delete guard
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this guard?')) return;

    try {
      await deleteGuard(id);
      await loadGuards();
    } catch (err) {
      console.error('Error deleting guard:', err);
    }
  };

  // Edit guard (load data into form)
  const handleEdit = (guard: SecurityGuard) => {
    setForm({
      id: guard.id,
      name: guard.name,
      mac_address: guard.mac_address,
      mobile_number: guard.mobile_number || '',
    });
    setIsEditing(true);
  };

  // Filter guards by search
  const filteredGuards = guards.filter((g) => {
    const q = search.toLowerCase();
    return (
      g.id.toLowerCase().includes(q) ||
      g.name.toLowerCase().includes(q) ||
      g.mac_address.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 text-white">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Security Guards</h1>
        <p className="text-sm text-gray-400">
          Cloud-backed guard management
        </p>
      </div>

      {/* Search */}
      <input
        type="text"
        placeholder="Search by ID, Name, or MAC"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full bg-gray-900 border border-gray-800 p-3 rounded-lg"
      />

      {/* Add / Edit Form */}
      <form
        onSubmit={handleSubmit}
        className="grid md:grid-cols-2 gap-4 bg-gray-900 p-6 rounded-xl border border-gray-800"
      >
        <input
          type="text"
          placeholder="Guard ID"
          value={form.id}
          disabled={isEditing}
          onChange={(e) => setForm({ ...form, id: e.target.value })}
          className="bg-gray-800 p-3 rounded"
          required
        />

        <input
          type="text"
          placeholder="Name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="bg-gray-800 p-3 rounded"
          required
        />

        <input
          type="text"
          placeholder="MAC Address"
          value={form.mac_address}
          onChange={(e) => setForm({ ...form, mac_address: e.target.value })}
          className="bg-gray-800 p-3 rounded"
          required
        />

        <input
          type="text"
          placeholder="Mobile (optional)"
          value={form.mobile_number}
          onChange={(e) =>
            setForm({ ...form, mobile_number: e.target.value })
          }
          className="bg-gray-800 p-3 rounded"
        />

        <button
          type="submit"
          className={`md:col-span-2 p-3 rounded text-white ${
            isEditing ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {isEditing ? 'Update Guard' : 'Add Guard'}
        </button>
      </form>

      {/* Guards Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="p-5 border-b border-gray-800">
          <h2 className="font-semibold">
            Registered Guards ({filteredGuards.length})
          </h2>
        </div>

        <table className="w-full text-sm">
          <thead className="bg-gray-800 text-gray-400">
            <tr>
              <th className="p-3 text-left">ID</th>
              <th className="p-3 text-left">Name</th>
              <th className="p-3 text-left">MAC</th>
              <th className="p-3 text-left">Mobile</th>
              <th className="p-3 text-left">Actions</th>
            </tr>
          </thead>

          <tbody>
            {filteredGuards.map((g) => (
              <tr key={g.id} className="border-t border-gray-800">
                <td className="p-3">{g.id}</td>
                <td className="p-3">{g.name}</td>
                <td className="p-3 font-mono text-gray-300">{g.mac_address}</td>
                <td className="p-3 text-gray-300">{g.mobile_number || '--'}</td>
                <td className="p-3 flex gap-3">
                  <button
                    onClick={() => handleEdit(g)}
                    className="text-yellow-400 hover:text-yellow-600"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(g.id)}
                    className="text-red-400 hover:text-red-600"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
