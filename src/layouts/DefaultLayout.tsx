import React from 'react';
import { Navigation } from '../components';

interface DefaultLayoutProps {
  children: React.ReactNode;
}

const DefaultLayout: React.FC<DefaultLayoutProps> = ({ children }) => {
  return (
    <div className="default-layout">
      <Navigation />
      <main className="default-layout-main">
        {children}
      </main>
    </div>
  );
};

export default DefaultLayout;