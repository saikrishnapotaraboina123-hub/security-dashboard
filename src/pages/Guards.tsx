import { useEffect, useState } from 'react';

interface SecurityGuard {
  id: string;
  name: string;
  mac_address: string;
  mobile_number?: string;
}

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

  // LOAD GUARDS
  const fetchGuards = () => {
    const data = localStorage.getItem('guards');
    setGuards(data ? JSON.parse(data) : []);
  };

  useEffect(() => {
    fetchGuards();
  }, []);

  // ADD / UPDATE
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const data = localStorage.getItem('guards');
    const list: SecurityGuard[] = data ? JSON.parse(data) : [];

    if (isEditing) {
      const updated = list.map((g) =>
        g.id === form.id
          ? {
              ...g,
              id: form.id,
              name: form.name,
              mac_address: form.mac_address,
              mobile_number: form.mobile_number,
            }
          : g
      );

      localStorage.setItem('guards', JSON.stringify(updated));
      setIsEditing(false);
    } else {
      const exists = list.find(
        (g) => g.mac_address === form.mac_address
      );

      if (exists) {
        alert('MAC Address already exists!');
        return;
      }

      const newGuard: SecurityGuard = {
        id: form.id,
        name: form.name,
        mac_address: form.mac_address,
        mobile_number: form.mobile_number,
      };

      localStorage.setItem(
        'guards',
        JSON.stringify([...list, newGuard])
      );
    }

    setForm({
      id: '',
      name: '',
      mac_address: '',
      mobile_number: '',
    });

    fetchGuards();
  };

  // DELETE
  const deleteGuard = (id: string) => {
    const data = localStorage.getItem('guards');
    const list: SecurityGuard[] = data ? JSON.parse(data) : [];

    const updated = list.filter((g) => g.id !== id);

    localStorage.setItem('guards', JSON.stringify(updated));
    fetchGuards();
  };

  // EDIT
  const editGuard = (guard: SecurityGuard) => {
    setForm({
      id: guard.id,
      name: guard.name,
      mac_address: guard.mac_address,
      mobile_number: guard.mobile_number || '',
    });

    setIsEditing(true);
  };

  // SEARCH FILTER
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

      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-bold">
          Security Guards
        </h1>
        <p className="text-sm text-gray-400">
          Manage security personnel
        </p>
      </div>

      {/* SEARCH */}
      <input
        type="text"
        placeholder="Search by ID, Name, MAC..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full bg-gray-900 border border-gray-800 p-3 rounded-lg text-white"
      />

      {/* FORM */}
      <form
        onSubmit={handleSubmit}
        className="grid md:grid-cols-2 gap-4 bg-gray-900 p-6 rounded-xl border border-gray-800"
      >
        <input
          placeholder="Guard ID"
          value={form.id}
          disabled={isEditing}
          onChange={(e) =>
            setForm({ ...form, id: e.target.value })
          }
          className="bg-gray-800 p-3 rounded"
        />

        <input
          placeholder="Name"
          value={form.name}
          onChange={(e) =>
            setForm({ ...form, name: e.target.value })
          }
          className="bg-gray-800 p-3 rounded"
        />

        <input
          placeholder="MAC Address"
          value={form.mac_address}
          onChange={(e) =>
            setForm({
              ...form,
              mac_address: e.target.value,
            })
          }
          className="bg-gray-800 p-3 rounded"
        />

        <input
          placeholder="Mobile (optional)"
          value={form.mobile_number}
          onChange={(e) =>
            setForm({
              ...form,
              mobile_number: e.target.value,
            })
          }
          className="bg-gray-800 p-3 rounded"
        />

        <button
          type="submit"
          className={`px-4 py-2 rounded md:col-span-2 ${
            isEditing
              ? 'bg-yellow-600 hover:bg-yellow-700'
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {isEditing ? 'Update Guard' : 'Add Guard'}
        </button>
      </form>

      {/* TABLE */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">

        <div className="p-5 border-b border-gray-800">
          <h2 className="font-semibold">
            Registered Guards ({filteredGuards.length})
          </h2>
        </div>

        <table className="w-full text-sm">
          <thead className="bg-gray-800 text-gray-400">
            <tr>
              <th className="px-6 py-3 text-left">ID</th>
              <th className="px-6 py-3 text-left">Name</th>
              <th className="px-6 py-3 text-left">MAC</th>
              <th className="px-6 py-3 text-left">Mobile</th>
              <th className="px-6 py-3 text-left">Actions</th>
            </tr>
          </thead>

          <tbody>
            {filteredGuards.map((guard) => (
              <tr
                key={guard.id}
                className="border-t border-gray-800"
              >
                <td className="px-6 py-4">{guard.id}</td>
                <td className="px-6 py-4">{guard.name}</td>
                <td className="px-6 py-4 font-mono text-gray-300">
                  {guard.mac_address}
                </td>
                <td className="px-6 py-4 text-gray-300">
                  {guard.mobile_number || '--'}
                </td>

                <td className="px-6 py-4 flex gap-3">
                  <button
                    onClick={() => editGuard(guard)}
                    className="text-yellow-400 hover:text-yellow-600"
                  >
                    Edit
                  </button>

                  <button
                    onClick={() => deleteGuard(guard.id)}
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
