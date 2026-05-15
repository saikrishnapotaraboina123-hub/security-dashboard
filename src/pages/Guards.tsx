import { useEffect, useState } from 'react';

interface SecurityGuard {
  id: string;
  name: string;
  mac_address: string;
  mobile_number?: string;
}

export default function Guards() {
  const [guards, setGuards] = useState<
    SecurityGuard[]
  >([]);

  const [form, setForm] = useState({
    id: '',
    name: '',
    mac_address: '',
    mobile_number: '',
  });

  const fetchGuards = async () => {
    try {
      const res = await fetch('/api/guards');
      const data = await res.json();

      setGuards(data || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchGuards();
  }, []);

  const handleSubmit = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    try {
      await fetch('/api/guards', {
        method: 'POST',
        headers: {
          'Content-Type':
            'application/json',
        },
        body: JSON.stringify(form),
      });

      setForm({
        id: '',
        name: '',
        mac_address: '',
        mobile_number: '',
      });

      fetchGuards();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">
          Security Guards
        </h1>

        <p className="text-sm text-gray-400 mt-1">
          Manage security personnel
        </p>
      </div>

      {/* Form */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-5">
          Add Guard
        </h2>

        <form
          onSubmit={handleSubmit}
          className="grid md:grid-cols-2 gap-4"
        >
          <input
            type="text"
            placeholder="Guard ID"
            required
            value={form.id}
            onChange={(e) =>
              setForm({
                ...form,
                id: e.target.value,
              })
            }
            className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white"
          />

          <input
            type="text"
            placeholder="Guard Name"
            required
            value={form.name}
            onChange={(e) =>
              setForm({
                ...form,
                name: e.target.value,
              })
            }
            className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white"
          />

          <input
            type="text"
            placeholder="MAC Address"
            required
            value={form.mac_address}
            onChange={(e) =>
              setForm({
                ...form,
                mac_address:
                  e.target.value,
              })
            }
            className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white"
          />

          <input
            type="text"
            placeholder="Mobile Number (Optional)"
            value={form.mobile_number}
            onChange={(e) =>
              setForm({
                ...form,
                mobile_number:
                  e.target.value,
              })
            }
            className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white"
          />

          <div className="md:col-span-2">
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 px-5 py-3 rounded-lg text-white font-medium"
            >
              Add Guard
            </button>
          </div>
        </form>
      </div>

      {/* Guards Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="p-5 border-b border-gray-800">
          <h2 className="font-semibold text-white">
            Registered Guards
          </h2>
        </div>

        <table className="w-full">
          <thead className="bg-gray-800">
            <tr>
              <th className="px-6 py-3 text-left text-xs text-gray-400">
                ID
              </th>

              <th className="px-6 py-3 text-left text-xs text-gray-400">
                Name
              </th>

              <th className="px-6 py-3 text-left text-xs text-gray-400">
                MAC Address
              </th>

              <th className="px-6 py-3 text-left text-xs text-gray-400">
                Mobile
              </th>
            </tr>
          </thead>

          <tbody>
            {guards.map((guard) => (
              <tr
                key={guard.id}
                className="border-t border-gray-800"
              >
                <td className="px-6 py-4 text-white">
                  {guard.id}
                </td>

                <td className="px-6 py-4 text-white">
                  {guard.name}
                </td>

                <td className="px-6 py-4 text-gray-300 font-mono">
                  {guard.mac_address}
                </td>

                <td className="px-6 py-4 text-gray-300">
                  {guard.mobile_number ||
                    '--'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
