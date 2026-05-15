import { useEffect, useState } from 'react';

import {
  fetchGuards,
  addGuard,
  updateGuard,
  deleteGuard,
} from '../services/supabase';

import type {
  SecurityGuard,
} from '../types';

import {
  Plus,
  Trash2,
  Pencil,
  Save,
  X,
} from 'lucide-react';

export default function Guards() {

  // ======================================
  // STATES
  // ======================================
  const [guards, setGuards] = useState<
    SecurityGuard[]
  >([]);

  const [loading, setLoading] =
    useState(true);

  const [editingId, setEditingId] =
    useState<string | null>(null);

  const [formData, setFormData] =
    useState<SecurityGuard>({
      id: '',
      name: '',
      mac_address: '',
      mobile_number: '',
    });

  // ======================================
  // LOAD GUARDS
  // ======================================
  const loadGuards = async () => {

    try {

      const data =
        await fetchGuards();

      setGuards(data);

    } catch (error) {

      console.error(error);

    } finally {

      setLoading(false);
    }
  };

  useEffect(() => {

    loadGuards();

  }, []);

  // ======================================
  // HANDLE INPUT
  // ======================================
  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement
    >
  ) => {

    setFormData({
      ...formData,
      [e.target.name]:
        e.target.value,
    });
  };

  // ======================================
  // ADD GUARD
  // ======================================
  const handleAdd = async () => {

    try {

      await addGuard(formData);

      setFormData({
        id: '',
        name: '',
        mac_address: '',
        mobile_number: '',
      });

      loadGuards();

    } catch (error) {

      console.error(error);
    }
  };

  // ======================================
  // EDIT
  // ======================================
  const handleEdit = (
    guard: SecurityGuard
  ) => {

    setEditingId(guard.id);

    setFormData(guard);
  };

  // ======================================
  // UPDATE
  // ======================================
  const handleUpdate = async () => {

    try {

      await updateGuard(formData);

      setEditingId(null);

      setFormData({
        id: '',
        name: '',
        mac_address: '',
        mobile_number: '',
      });

      loadGuards();

    } catch (error) {

      console.error(error);
    }
  };

  // ======================================
  // DELETE
  // ======================================
  const handleDelete = async (
    id: string
  ) => {

    const confirmDelete =
      confirm(
        'Delete this guard?'
      );

    if (!confirmDelete) {
      return;
    }

    try {

      await deleteGuard(id);

      loadGuards();

    } catch (error) {

      console.error(error);
    }
  };

  return (

    <div className="space-y-6">

      {/* HEADER */}
      <div>

        <h1 className="text-2xl font-bold text-white">

          Guard Management

        </h1>

        <p className="text-gray-400 mt-1">

          Manage registered guards
          and BLE devices

        </p>

      </div>

      {/* FORM */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">

        <div className="grid md:grid-cols-4 gap-4">

          <input
            type="text"
            name="id"
            placeholder="Guard ID"
            value={formData.id}
            onChange={handleChange}
            className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
          />

          <input
            type="text"
            name="name"
            placeholder="Guard Name"
            value={formData.name}
            onChange={handleChange}
            className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
          />

          <input
            type="text"
            name="mac_address"
            placeholder="BLE MAC Address"
            value={formData.mac_address}
            onChange={handleChange}
            className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
          />

          <input
            type="text"
            name="mobile_number"
            placeholder="Mobile Number"
            value={formData.mobile_number}
            onChange={handleChange}
            className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
          />

        </div>

        <div className="mt-4 flex gap-3">

          {editingId ? (

            <>
              <button
                onClick={handleUpdate}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white"
              >

                <Save className="w-4 h-4" />

                Update Guard

              </button>

              <button
                onClick={() => {

                  setEditingId(null);

                  setFormData({
                    id: '',
                    name: '',
                    mac_address: '',
                    mobile_number: '',
                  });

                }}

                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-white"
              >

                <X className="w-4 h-4" />

                Cancel

              </button>
            </>

          ) : (

            <button
              onClick={handleAdd}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white"
            >

              <Plus className="w-4 h-4" />

              Add Guard

            </button>

          )}

        </div>

      </div>

      {/* TABLE */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">

        <table className="w-full">

          <thead className="bg-gray-800">

            <tr>

              <th className="px-5 py-3 text-left text-xs text-gray-400 uppercase">
                ID
              </th>

              <th className="px-5 py-3 text-left text-xs text-gray-400 uppercase">
                Name
              </th>

              <th className="px-5 py-3 text-left text-xs text-gray-400 uppercase">
                MAC Address
              </th>

              <th className="px-5 py-3 text-left text-xs text-gray-400 uppercase">
                Mobile
              </th>

              <th className="px-5 py-3 text-left text-xs text-gray-400 uppercase">
                Actions
              </th>

            </tr>

          </thead>

          <tbody className="divide-y divide-gray-800">

            {loading ? (

              <tr>

                <td
                  colSpan={5}
                  className="text-center py-10 text-gray-500"
                >

                  Loading guards...

                </td>

              </tr>

            ) : guards.length === 0 ? (

              <tr>

                <td
                  colSpan={5}
                  className="text-center py-10 text-gray-500"
                >

                  No guards found

                </td>

              </tr>

            ) : (

              guards.map((guard) => (

                <tr
                  key={guard.id}
                  className="hover:bg-gray-800/50"
                >

                  <td className="px-5 py-4 text-white">
                    {guard.id}
                  </td>

                  <td className="px-5 py-4 text-white">
                    {guard.name}
                  </td>

                  <td className="px-5 py-4 text-gray-300 font-mono">
                    {guard.mac_address}
                  </td>

                  <td className="px-5 py-4 text-gray-300">
                    {guard.mobile_number}
                  </td>

                  <td className="px-5 py-4 flex gap-2">

                    <button
                      onClick={() =>
                        handleEdit(guard)
                      }

                      className="p-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white"
                    >

                      <Pencil className="w-4 h-4" />

                    </button>

                    <button
                      onClick={() =>
                        handleDelete(
                          guard.id
                        )
                      }

                      className="p-2 rounded-lg bg-red-600 hover:bg-red-700 text-white"
                    >

                      <Trash2 className="w-4 h-4" />

                    </button>

                  </td>

                </tr>
              ))
            )}

          </tbody>

        </table>

      </div>

    </div>
  );
}
