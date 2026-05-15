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

  // Load guards from localStorage
  const fetchGuards = () => {
    const data = localStorage.getItem('guards');
    setGuards(data ? JSON.parse(data) : []);
  };

  useEffect(() => {
    fetchGuards();
  }, []);

  // ADD GUARD
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const data = localStorage.getItem('guards');
    const list: SecurityGuard[] = data ? JSON.parse(data) : [];

    // prevent duplicate MAC
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

  // DELETE GUARD
  const deleteGuard = (id: string) => {
    const data = localStorage.getItem('guards');
    const list: SecurityGuard[] = data ? JSON.parse(data) : [];

    const updated = list.filter((g) => g.id !== id);

    localStorage.setItem('guards', JSON.stringify(updated));

    fetchGuards();
  };

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

      {/* FORM */}
      <form
        onSubmit={handleSubmit}
        className="grid md:grid-cols-2 gap-4 bg-gray-900 p-6 rounded-xl border border-gray-800"
      >
        <input
          placeholder="Guard ID"
          value={form.id}
          onChange={(e) =>
            setForm({ ...form, id: e.target.value })
          }
          className="bg-gray-800 p-3 rounded text-white"
          required
        />

        <input
          placeholder="Name"
          value={form.name}
          onChange={(e) =>
            setForm({ ...form, name: e.target.value })
          }
          className="bg-gray-800 p-3 rounded text-white"
          required
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
          className="bg-gray-800 p-3 rounded text-white"
          required
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
          className="bg-gray-800 p-3 rounded text-white"
        />

        <button
          type="submit"
          className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded md:col-span-2"
        >
          Add Guard
        </button>
      </form>

      {/* TABLE */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="p-5 border-b border-gray-800">
          <h2 className="font-semibold">
            Registered Guards
          </h2>
        </div>

        <table className="w-full text-sm">
          <thead className="bg-gray-800 text-gray-400">
            <tr>
              <th className="text-left px-6 py-3">ID</th>
              <th className="text-left px-6 py-3">Name</th>
              <th className="text-left px-6 py-3">
                MAC Address
              </th>
              <th className="text-left px-6 py-3">
                Mobile
              </th>
              <th className="text-left px-6 py-3">
                Actions
              </th>
            </tr>
          </thead>

          <tbody>
            {guards.map((guard) => (
              <tr
                key={guard.id}
                className="border-t border-gray-800"
              >
                <td className="px-6 py-4">
                  {guard.id}
                </td>

                <td className="px-6 py-4">
                  {guard.name}
                </td>

                <td className="px-6 py-4 font-mono text-gray-300">
                  {guard.mac_address}
                </td>

                <td className="px-6 py-4 text-gray-300">
                  {guard.mobile_number || '--'}
                </td>

                {/* DELETE BUTTON */}
                <td className="px-6 py-4">
                  <button
                    onClick={() =>
                      deleteGuard(guard.id)
                    }
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
