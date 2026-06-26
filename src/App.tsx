import React, { useEffect } from "react";
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
        <Main />
        <Expertise />
        <Terminal />
        <Timeline />
        <Project />
        <Contact />
        <Footer />
      </FadeIn>
    </div>
  );
}

export default App;