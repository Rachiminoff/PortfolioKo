import React, { useEffect } from "react";
import {
  Main,
  Timeline,
  Expertise,
  Terminal,
  Project,
  Navigation,
  Insights,
  Contact,
  Footer
} from "./components";

import FadeIn from "./components/FadeIn";
import "./index.scss";
import Certificates from "./components/Certificates";

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
        <Insights />  
        <Terminal />
        <Timeline />
        <Project />
        <Expertise />
        <Certificates/>
        <Contact />
        <Footer />
      </FadeIn>
    </div>
  );
}

export default App;