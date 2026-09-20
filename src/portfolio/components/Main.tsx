import React, { useState, useCallback, Suspense, lazy } from 'react';
import profilePic from '../assets/images/profile.jpeg';
import '../assets/styles/Main.scss';

const PDFViewer = lazy(() => import('./PDFViewer'));

function Main() {
  const [viewerUrl, setViewerUrl] = useState<string | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);

  const openCVViewer = useCallback(() => {
    setPdfLoading(true);
    setViewerUrl('/YambaoResume.pdf');
    window.setTimeout(() => setPdfLoading(false), 500);
  }, []);

  const closeViewer = useCallback(() => {
    setViewerUrl(null);
    setPdfLoading(false);
  }, []);

  return (
    <main className="main-container" id="home">
      <div className="main-grid" aria-hidden="true" />
      <div className="main-registration" aria-hidden="true">
        <span>TDY—001</span>
        <span>PORTFOLIO / 2026</span>
      </div>

      <section className="hero-section" aria-labelledby="hero-title">
        <div className="hero-content">
          <div className="hero-left">
            <div className="hero-kicker">
              <span className="kicker-index">01</span>
              <span>FULL-STACK DEVELOPER</span>
              <span className="kicker-status">
                <i /> AVAILABLE
              </span>
            </div>

            <div className="hero-title-wrap">
              <span className="hero-side-note">
                COMPUTER
                <br />
                SCIENCE / PH
              </span>
              <h1 className="hero-title" id="hero-title">
                <span className="title-line">TANYA</span>
                <span className="title-line title-offset">DENISE</span>
                <span className="title-line">YAMBAO</span>
              </h1>
            </div>

            <div className="hero-intro">
              <span className="intro-mark" aria-hidden="true" />
              <div>
                <p className="subtitle-primary">Computer Science Student</p>
                <p className="subtitle-secondary">Full-Stack Developer</p>
              </div>
            </div>

            <div className="hero-actions" aria-label="Profile links">
              <button
                className="action-link action-primary"
                onClick={openCVViewer}
                disabled={pdfLoading}
              >
                <span>{pdfLoading ? 'Opening…' : 'Resume'}</span>
                <b>↗</b>
              </button>
              <a
                href="https://github.com/Rachiminoff"
                target="_blank"
                rel="noreferrer"
                className="action-link"
              >
                <span>GitHub</span>
                <b>↗</b>
              </a>
              <a
                href="https://www.linkedin.com/in/tanya-denise-yambao-9677223b9/"
                target="_blank"
                rel="noreferrer"
                className="action-link"
              >
                <span>LinkedIn</span>
                <b>↗</b>
              </a>
            </div>

            <div className="hero-specs">
              <div>
                <span>DISCIPLINE</span>
                <strong>SOFTWARE / UI</strong>
              </div>
              <div>
                <span>FOCUS</span>
                <strong>WEB / SYSTEMS</strong>
              </div>
              <div>
                <span>BASED IN</span>
                <strong>PHILIPPINES</strong>
              </div>
            </div>
          </div>

          <div className="hero-right">
            <div className="profile-module">
              <div className="module-header">
                <span>PROFILE 01</span>
                <span className="module-status">
                  <i /> AVAILABLE
                </span>
              </div>

              <div className="module-content">
                <div className="profile-frame">
                  <div className="frame-label frame-label-top">PORTRAIT / A</div>
                  <div className="frame-label frame-label-bottom">W: 320 / H: 320</div>
                  <div className="frame-corner frame-corner-tl" />
                  <div className="frame-corner frame-corner-tr" />
                  <div className="frame-corner frame-corner-bl" />
                  <div className="frame-corner frame-corner-br" />
                  <div className="frame-crosshair" />
                  <div className="profile-image-wrapper">
                    <div className="profile-image-container">
                      <img src={profilePic} alt="Tanya Denise Yambao" className="profile-image" />
                    </div>
                  </div>
                  <div className="frame-slice" />
                  <span className="frame-dot" />
                </div>
              </div>

              <div className="module-footer">
                <div>
                  <span>STATUS</span>
                  <strong>ACTIVE</strong>
                </div>
                <div>
                  <span>ROLE</span>
                  <strong>FULL-STACK</strong>
                </div>
                <div>
                  <span>VERSION</span>
                  <strong>2026.01</strong>
                </div>
              </div>
            </div>

            <div className="hero-coordinate" aria-hidden="true">
              <span>AXIS / 00</span>
              <span>◼</span>
              <span>BUILD WITH PURPOSE</span>
            </div>
          </div>
        </div>
      </section>

      <Suspense fallback={null}>
        <PDFViewer url={viewerUrl} onClose={closeViewer} />
      </Suspense>
    </main>
  );
}

export default Main;
