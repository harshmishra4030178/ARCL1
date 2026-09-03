const Tooltip = ({ text, position = "top", children }) => {
  const positionClasses = {
    top: "-top-8 left-1/2 -translate-x-1/2",
    bottom: "-bottom-8 left-1/2 -translate-x-1/2",
    left: "right-full mr-2 top-1/2 -translate-y-1/2",
    right: "left-full ml-2 top-1/2 -translate-y-1/2",
  };

  return (
    <div className="relative group inline-block">
      {children}

      <span
        className={`absolute ${positionClasses[position]}
        bg-black text-white text-xs px-2 py-1 rounded
        opacity-0 group-hover:opacity-100 transition whitespace-nowrap`}
      >
        {text}
      </span>
    </div>
  );
};

export default Tooltip;