import React, { useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import {
  Main,
  Timeline,
  Expertise,
  Terminal,
  Project,
  Navigation,
  Contact,
  Footer
} from "./components";

import FadeIn from "./components/FadeIn";
import Vault from "./Vault"; // Import Vault
import "./index.scss";

function App() {

  useEffect(() => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "smooth"
    });
  }, []);

  return (
    <div className="main-container dark-mode">
      <Navigation />

      <FadeIn transitionDuration={700}>
        <Routes>
          {/* Main route with all sections */}
          <Route path="/" element={
            <>
              <Main />
              <Expertise />
              <Terminal />
              <Timeline />
              <Project />
              <Contact />
              <Footer />
            </>
          } />
          {/* Vault route - only accessible via navigation or password */}
          <Route path="/vault" element={<Vault />} />
        </Routes>
      </FadeIn>
    </div>
  );
}

export default App;