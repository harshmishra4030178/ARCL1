const StatCard = ({ title, value, icon, color }) => {
  return (
    <div className="bg-white rounded-xl shadow p-5 flex items-center gap-4 hover:shadow-lg transition">

      {/* Icon */}
      <div className={`text-white p-3 rounded-lg ${color}`}>
        {icon}
      </div>

      {/* Content */}
      <div>
        <p className="text-gray-500 text-sm">{title}</p>
        <h2 className="text-xl font-bold text-gray-800">{value}</h2>
      </div>

    </div>
  );
};

export default StatCard;