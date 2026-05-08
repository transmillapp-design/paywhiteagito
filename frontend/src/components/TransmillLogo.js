import React from 'react';

const TransmillLogo = ({ width = 150, className = '' }) => {
  const iconSize = width * 0.4;
  
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Logo/Ícone - Nova imagem */}
      <img 
        src="/icon-192x192.png" 
        alt="Transmill Logo"
        style={{ width: iconSize, height: iconSize }}
        className="object-contain rounded-full"
      />
      
      {/* Nome Transmill */}
      <div className="flex flex-col leading-tight">
        <span 
          className="font-bold text-gray-900 dark:text-white"
          style={{ fontSize: width * 0.15 }}
        >
          Transmill
        </span>
        <span 
          className="text-gray-600 dark:text-gray-400 text-xs"
          style={{ fontSize: width * 0.08 }}
        >
          Ecossistema de Consumo Militar
        </span>
      </div>
    </div>
  );
};

export default TransmillLogo;
