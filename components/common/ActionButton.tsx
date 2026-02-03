import React from 'react';

interface ActionButtonProps {
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}

export const ActionButton: React.FC<ActionButtonProps> = ({ onClick, icon, label }) => (
  <button 
    onClick={onClick}
    className="flex flex-col items-center justify-center w-12 h-14 bg-element-bg rounded-md border border-border-base hover:border-border-hover hover:shadow-md transition-all active:scale-95 group"
  >
    <div className="text-text-secondary group-hover:text-text-primary mb-1">{icon}</div>
    <span className="text-[10px] text-text-secondary font-medium group-hover:text-text-primary">{label}</span>
  </button>
);