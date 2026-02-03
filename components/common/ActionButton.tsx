import React from 'react';

interface ActionButtonProps {
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}

export const ActionButton: React.FC<ActionButtonProps> = ({ onClick, icon, label }) => (
  <button 
    onClick={onClick}
    className="flex flex-col items-center justify-center w-12 h-14 bg-[#2d2d39] rounded-md border border-gray-700 hover:bg-[#363642] hover:border-gray-500 hover:shadow-md transition-all active:scale-95 group"
  >
    <div className="text-gray-400 group-hover:text-white mb-1">{icon}</div>
    <span className="text-[10px] text-gray-500 font-medium group-hover:text-gray-300">{label}</span>
  </button>
);