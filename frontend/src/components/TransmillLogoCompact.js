import React from 'react';

const TransmillLogoCompact = ({ width = 160, height = 'auto', className = '', ...props }) => {
  return (
    <div className={`flex items-center justify-center space-x-2 ${className}`} {...props}>
      {/* Ícone com nova logo - recortado em círculo */}
      <div 
        className="w-10 h-10 rounded-full flex items-center justify-center overflow-hidden"
        style={{ backgroundColor: '#005B9C' }}
      >
        <img 
          src="/icon-96x96.png" 
          alt="Transmill" 
          className="w-10 h-10 object-cover"
        />
      </div>
      <span className="text-2xl font-bold text-[#005B9C] dark:text-[#CEAE31]">
        Transmill
      </span>
    </div>
  );
};

export default TransmillLogoCompact;