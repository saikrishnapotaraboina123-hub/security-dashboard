import { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';

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

  // FETCH FROM SUPABASE
  const fetchGuards = async () => {
    const { data, error } = await supabase
      .from('guards')
      .select('*');

    if (error) console.error(error);

    setGuards(data || []);
  };

  useEffect(() => {
    fetchGuards();
  }, []);

  // ADD / UPDATE
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isEditing) {
      const { error } = await supabase
        .from('guards')
        .update({
          name: form.name,
          mac_address: form.mac_address,
          mobile_number: form.mobile_number,
        })
        .eq('id', form.id);

      if (error) console.error(error);
    } else {
      const { error } = await supabase.from('guards').insert([
        {
          id: form.id,
          name: form.name,
          mac_address: form.mac_address,
          mobile_number: form.mobile_number,
        },
      ]);

      if (error) console.error(error);
    }

    setForm({
      id: '',
      name: '',
      mac_address: '',
      mobile_number: '',
    });

    setIsEditing(false);
    fetchGuards();
  };

  // DELETE
  const deleteGuard = async (id: string) => {
    const { error } = await supabase
      .from('guards')
      .delete()
      .eq('id', id);

    if (error) console.error(error);

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

  // SEARCH
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
        <h1 className="text-2xl font-bold">Security Guards</h1>
        <p className="text-gray-400 text-sm">
          Cloud database powered by Supabase
        </p>
      </div>

      {/* SEARCH */}
      <input
        placeholder="Search guards..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full bg-gray-900 border border-gray-800 p-3 rounded"
      />

      {/* FORM */}
      <form
        onSubmit={handleSubmit}
        className="grid md:grid-cols-2 gap-4 bg-gray-900 p-6 rounded-xl"
      >
        <input
          placeholder="ID"
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
          placeholder="Mobile"
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
          className="md:col-span-2 bg-blue-600 hover:bg-blue-700 p-3 rounded"
        >
          {isEditing ? 'Update Guard' : 'Add Guard'}
        </button>
      </form>

      {/* TABLE */}
      <div className="bg-gray-900 rounded-xl overflow-hidden">
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
                <td className="p-3 font-mono">{g.mac_address}</td>
                <td className="p-3">{g.mobile_number || '--'}</td>

                <td className="p-3 flex gap-3">
                  <button
                    onClick={() => editGuard(g)}
                    className="text-yellow-400"
                  >
                    Edit
                  </button>

                  <button
                    onClick={() => deleteGuard(g.id)}
                    className="text-red-400"
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
