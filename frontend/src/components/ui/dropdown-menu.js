import React, { useState, useRef, useEffect } from 'react';

const DropdownMenu = ({ children }) => {
  return <div className="relative inline-block">{children}</div>;
};

const DropdownMenuTrigger = React.forwardRef(({ children, asChild, ...props }, ref) => {
  if (asChild) {
    return React.cloneElement(children, { ref, ...props });
  }
  return (
    <button ref={ref} {...props}>
      {children}
    </button>
  );
});

const DropdownMenuContent = ({ children, align = "start", className = "", ...props }) => {
  const alignClasses = {
    start: "left-0",
    end: "right-0",
    center: "left-1/2 transform -translate-x-1/2"
  };

  return (
    <div
      className={`absolute top-full mt-1 ${alignClasses[align]} bg-white rounded-md shadow-lg border border-gray-200 py-1 z-50 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

const DropdownMenuItem = ({ children, onClick, className = "", ...props }) => {
  return (
    <div
      className={`px-4 py-2 text-sm hover:bg-gray-100 flex items-center ${className}`}
      onClick={onClick}
      {...props}
    >
      {children}
    </div>
  );
};

// Hook para controlar o dropdown
const useDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (ref.current && !ref.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return { isOpen, setIsOpen, ref };
};

// Componente wrapper que gerencia o estado
const DropdownMenuWrapper = ({ children }) => {
  const { isOpen, setIsOpen, ref } = useDropdown();

  return (
    <div ref={ref} className="relative inline-block">
      {React.Children.map(children, (child) => {
        if (child.type === DropdownMenuTrigger) {
          return React.cloneElement(child, {
            onClick: () => setIsOpen(!isOpen),
          });
        }
        if (child.type === DropdownMenuContent) {
          return isOpen ? child : null;
        }
        return child;
      })}
    </div>
  );
};

// Exportar com o wrapper como padrão
export { 
  DropdownMenuWrapper as DropdownMenu, 
  DropdownMenuTrigger, 
  DropdownMenuContent, 
  DropdownMenuItem 
};