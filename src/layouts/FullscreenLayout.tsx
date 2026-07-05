import React from 'react';

interface FullscreenLayoutProps {
  children: React.ReactNode;
}

const FullscreenLayout: React.FC<FullscreenLayoutProps> = ({ children }) => {
  return (
    <div className="fullscreen-layout">
      {children}
    </div>
  );
};

export default FullscreenLayout;