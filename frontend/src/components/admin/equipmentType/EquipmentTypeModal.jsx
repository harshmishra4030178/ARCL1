import { useState } from "react";
import Modal from "../common/Modal.jsx";
import { useEquipmentTypeStore } from "../../../store/useEquipmentTypeStore.js";
import { toast } from "react-toastify";

const EquipmentTypeModal = ({ isOpen, onClose }) => {
  const { addEquipmentType } = useEquipmentTypeStore();

  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name.trim()) {
      setError("Name is required");
      return;
    }

    try {
      setLoading(true);
      setError("");

      await addEquipmentType({ name: name.trim() });
      toast.success("Equipment type created successfully!");
      setName("");
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Create failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Equipment Type">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            Equipment Type Name *
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border border-gray-200 p-3 rounded-xl outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition text-sm"
            placeholder="e.g. Civil and Mechanical Laboratory Equipment"
            autoFocus
          />
        </div>

        {error && <p className="text-red-500 text-xs">{error}</p>}

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium hover:bg-gray-50 transition cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition disabled:opacity-50 cursor-pointer shadow-xs"
          >
            {loading ? "Creating..." : "Create Equipment Type"}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default EquipmentTypeModal;