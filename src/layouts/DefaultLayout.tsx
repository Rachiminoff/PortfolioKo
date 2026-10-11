import React from 'react';
import { Navigation } from '../portfolio/components';

interface DefaultLayoutProps {
  children: React.ReactNode;
  hideNavigation?: boolean;
}

const DefaultLayout: React.FC<DefaultLayoutProps> = ({ children, hideNavigation = false }) => {
  return (
    <div className="default-layout">
      {!hideNavigation && <Navigation />}
      <main className="default-layout-main">{children}</main>
    </div>
  );
};

export default DefaultLayout;
