import { useEffect, useState } from 'react';

interface SecurityGuard {
  id: string;
  name: string;
  mac_address: string;
  mobile_number?: string;
}

export default function Guards() {
  const [guards, setGuards] = useState<SecurityGuard[]>([]);

  const [form, setForm] = useState({
    id: '',
    name: '',
    mac_address: '',
    mobile_number: '',
  });

  // Load from localStorage
  const fetchGuards = () => {
    const data = localStorage.getItem('guards');
    setGuards(data ? JSON.parse(data) : []);
  };

  useEffect(() => {
    fetchGuards();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const existing = localStorage.getItem('guards');
    const list: SecurityGuard[] = existing ? JSON.parse(existing) : [];

    const newGuard = {
      id: form.id,
      name: form.name,
      mac_address: form.mac_address,
      mobile_number: form.mobile_number,
    };

    const updated = [...list, newGuard];

    localStorage.setItem('guards', JSON.stringify(updated));

    setForm({
      id: '',
      name: '',
      mac_address: '',
      mobile_number: '',
    });

    fetchGuards();
  };

  return (
    <div className="space-y-6 text-white">
      <h1 className="text-2xl font-bold">Security Guards</h1>

      {/* FORM */}
      <form
        onSubmit={handleSubmit}
        className="grid md:grid-cols-2 gap-4 bg-gray-900 p-6 rounded-xl"
      >
        <input
          placeholder="ID"
          value={form.id}
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
          className="bg-blue-600 px-4 py-2 rounded md:col-span-2"
        >
          Add Guard
        </button>
      </form>

      {/* TABLE */}
      <div className="bg-gray-900 rounded-xl p-4">
        <h2 className="mb-3 font-semibold">
          Registered Guards
        </h2>

        <table className="w-full text-sm">
          <thead className="text-gray-400">
            <tr>
              <th className="text-left">ID</th>
              <th className="text-left">Name</th>
              <th className="text-left">MAC</th>
              <th className="text-left">Mobile</th>
            </tr>
          </thead>

          <tbody>
            {guards.map((g) => (
              <tr key={g.id} className="border-t border-gray-800">
                <td>{g.id}</td>
                <td>{g.name}</td>
                <td className="font-mono">{g.mac_address}</td>
                <td>{g.mobile_number || '--'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
