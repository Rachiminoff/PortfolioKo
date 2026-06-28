import React, { useState, useRef, useCallback } from "react";
import GitHubIcon from "@mui/icons-material/GitHub";
import LinkedInIcon from "@mui/icons-material/LinkedIn";
import YouTubeIcon from "@mui/icons-material/YouTube";
import LockIcon from "@mui/icons-material/Lock";
import CloseIcon from "@mui/icons-material/Close";
import { supabase } from "../lib/supabase";
import logo from "../assets/images/logo.jpg";
import "../assets/styles/Footer.scss";

type Art = { id: string; image_url: string; title: string };

function Footer() {
  const [showModal, setShowModal] = useState(false);
  const [passcode, setPasscode] = useState("");
  const [arts, setArts] = useState<Art[]>([]);
  const [index, setIndex] = useState(0);
  const [unlocked, setUnlocked] = useState(false);
  const [zoom, setZoom] = useState(1);

  // Use ref to track arts length without causing re-renders
  const artsLengthRef = useRef(0);
  artsLengthRef.current = arts.length;

  const fetchArts = async () => {
    const { data, error } = await supabase
      .from("arts")
      .select("*")
      .order("created_at", { ascending: true });
    if (!error && data) {
      setArts(data);
      setIndex(0);
    }
  };

  const handleSubmit = async () => {
    if (passcode === "sining") {
      setUnlocked(true);
      await fetchArts();
    } else {
      alert("Incorrect Passcode");
    }
  };

  // Navigation functions using ref for current length
  const nextArt = useCallback(() => {
    const len = artsLengthRef.current;
    if (len === 0) return;
    setIndex((prev) => (prev + 1) % len);
    setZoom(1);
  }, []);

  const prevArt = useCallback(() => {
    const len = artsLengthRef.current;
    if (len === 0) return;
    setIndex((prev) => (prev - 1 + len) % len);
    setZoom(1);
  }, []);

  const zoomIn = useCallback(() => {
    setZoom((prev) => Math.min(prev + 0.2, 5));
  }, []);

  const zoomOut = useCallback(() => {
    setZoom((prev) => Math.max(prev - 0.2, 0.4));
  }, []);

  const closeModal = useCallback(() => {
    setShowModal(false);
    setUnlocked(false);
    setPasscode("");
    setZoom(1);
  }, []);

  // Keyboard shortcuts - now with stable dependencies
  React.useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (!showModal || !unlocked) return;
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        prevArt();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        nextArt();
      } else if (e.key === "Escape") {
        closeModal();
      } else if (e.key === "=" || e.key === "+") {
        e.preventDefault();
        zoomIn();
      } else if (e.key === "-") {
        e.preventDefault();
        zoomOut();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [showModal, unlocked, nextArt, prevArt, closeModal, zoomIn, zoomOut]);

  // Touch events for mobile
  const [touchStartX, setTouchStartX] = useState(0);
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
  }, []);

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (!unlocked) return;
      const diff = touchStartX - e.changedTouches[0].clientX;
      if (Math.abs(diff) > 50) {
        diff > 0 ? nextArt() : prevArt();
      }
    },
    [unlocked, touchStartX, nextArt, prevArt]
  );

  return (
    <>
      <footer className="footer">
        <div className="footer-container">
          <div className="footer-logo">
            <img src={logo} alt="Logo" />
          </div>
          <div className="footer-content">
            <h2>Social Links</h2>
            <div className="footer-grid">
              <a
                href="https://github.com/Rachiminoff"
                target="_blank"
                rel="noreferrer"
                className="footer-card"
              >
                <GitHubIcon />
                <span>GitHub</span>
              </a>
              <a
                href="https://www.linkedin.com/in/tanya-denise-yambao-9677223b9/"
                target="_blank"
                rel="noreferrer"
                className="footer-card"
              >
                <LinkedInIcon />
                <span>LinkedIn</span>
              </a>
              <a
                href="https://youtube.com/@blacksheep-1g?si=-X2nDtK2kucyskWx"
                target="_blank"
                rel="noreferrer"
                className="footer-card"
              >
                <YouTubeIcon />
                <span>YouTube</span>
              </a>
              <button
                className="footer-card admin-card"
                onClick={() => setShowModal(true)}
              >
                <LockIcon />
                <span>ADMIN</span>
              </button>
            </div>
            <div className="footer-bottom">
              <div className="copyright-icon">©</div>
              <div>
                <h3>Tanya Denise Yambao</h3>
                <p>2026. All Rights Reserved.</p>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {showModal && (
        <div className="admin-modal-overlay">
          <div className={`admin-modal ${unlocked ? "" : "locked"}`}>
            <button className="close-btn" onClick={closeModal}>
              <CloseIcon />
            </button>

            {!unlocked ? (
              <>
                <LockIcon className="modal-lock" />
                <h2>Admin Access</h2>
                <p>Enter passcode to continue.</p>
                <input
                  type="password"
                  placeholder="Enter Passcode"
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                  autoFocus
                />
                <button className="submit-btn" onClick={handleSubmit}>
                  Unlock
                </button>
              </>
            ) : (
              <>
                <div className="viewer-topbar">
                  <div className="viewer-left">
                    <div className="viewer-controls-mac">
                      <span className="red"></span>
                      <span className="yellow"></span>
                      <span className="green"></span>
                    </div>
                    <div className="viewer-file-title">
                      {arts[index]?.title || "No artwork"}
                    </div>
                  </div>
                  <div className="viewer-actions">
                    <button className="viewer-btn" onClick={zoomOut}>
                      −
                    </button>
                    <div className="zoom-label">
                      {Math.round(zoom * 100)}%
                    </div>
                    <button className="viewer-btn" onClick={zoomIn}>
                      +
                    </button>
                  </div>
                </div>

                <div className="art-viewer">
                  <div className="art-sidebar">
                    <div className="art-list">
                      {arts.map((art, i) => (
                        <button
                          key={art.id}
                          className={`art-item ${
                            i === index ? "active" : ""
                          }`}
                          onClick={() => {
                            setIndex(i);
                            setZoom(1);
                          }}
                        >
                          <img src={art.image_url} alt={art.title} />
                          <div className="art-meta">
                            <h4>{art.title}</h4>
                            <p>#{i + 1}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="art-main">
                    <div className="viewer-toolbar">
                      <div className="viewer-toolbar-left">
                        <button className="viewer-btn" onClick={prevArt}>
                          ‹
                        </button>
                        <button className="viewer-btn" onClick={nextArt}>
                          ›
                        </button>
                      </div>
                      <div className="viewer-toolbar-right">
                        <div className="toolbar-page">
                          {arts.length > 0
                            ? `${index + 1}/${arts.length}`
                            : "0/0"}
                        </div>
                      </div>
                    </div>

                    <div
                      className="viewer-canvas"
                      onTouchStart={handleTouchStart}
                      onTouchEnd={handleTouchEnd}
                    >
                      <div className="viewer-inner">
                        {arts.length > 0 && arts[index] ? (
                          <img
                            src={arts[index].image_url}
                            alt={arts[index].title}
                            className="viewer-image"
                            draggable={false}
                            style={{ transform: `scale(${zoom})` }}
                          />
                        ) : (
                          <div style={{ color: "white", padding: "2rem" }}>
                            No artwork available
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}

export default Footer;