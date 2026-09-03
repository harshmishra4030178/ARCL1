

const Modal = ({ isOpen, onClose, children, title }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50">

      {/* Modal Box */}
      <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6 relative">

        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button onClick={onClose} className="text-gray-500 cursor-pointer">✕</button>
        </div>

        {/* Content */}
        {children}
      </div>
    </div>
  );
};

export default Modal;