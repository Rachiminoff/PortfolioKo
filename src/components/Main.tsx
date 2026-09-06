import React, { useState, useEffect, useRef, useCallback, Suspense, lazy } from "react";
import { useNavigate } from "react-router-dom";
import profilePic from '../assets/images/profile.jpeg';
import '../assets/styles/Main.scss';

/* =========================
   CONSTRUCTION GRID - ENHANCED
========================= */
function ConstructionGrid() {
    return (
        <div className="construction-grid" aria-hidden="true">
            {/* Major grid lines */}
            <div className="grid-line vertical major" style={{ left: '25%' }} />
            <div className="grid-line vertical major" style={{ left: '50%' }} />
            <div className="grid-line vertical major" style={{ left: '75%' }} />
            <div className="grid-line horizontal major" style={{ top: '25%' }} />
            <div className="grid-line horizontal major" style={{ top: '50%' }} />
            <div className="grid-line horizontal major" style={{ top: '75%' }} />
            
            {/* Minor grid lines */}
            <div className="grid-line vertical minor" style={{ left: '12.5%' }} />
            <div className="grid-line vertical minor" style={{ left: '37.5%' }} />
            <div className="grid-line vertical minor" style={{ left: '62.5%' }} />
            <div className="grid-line vertical minor" style={{ left: '87.5%' }} />
            <div className="grid-line horizontal minor" style={{ top: '12.5%' }} />
            <div className="grid-line horizontal minor" style={{ top: '37.5%' }} />
            <div className="grid-line horizontal minor" style={{ top: '62.5%' }} />
            <div className="grid-line horizontal minor" style={{ top: '87.5%' }} />
            
            {/* Diagonal connectors */}
            <div className="grid-line connector" style={{ 
                top: '50%', 
                left: '25%', 
                right: '50%',
                transform: 'rotate(15deg)',
                transformOrigin: 'left center'
            }} />
            <div className="grid-line connector" style={{ 
                top: '50%', 
                left: '50%', 
                right: '25%',
                transform: 'rotate(-15deg)',
                transformOrigin: 'right center'
            }} />
            
            {/* Vertical connectors */}
            <div className="grid-line connector-vertical" style={{ 
                top: '25%', 
                bottom: '50%', 
                left: '50%' 
            }} />
            <div className="grid-line connector-vertical" style={{ 
                top: '50%', 
                bottom: '25%', 
                left: '50%' 
            }} />
            
            {/* Grid labels */}
            <span className="grid-label" style={{ bottom: '12px', left: '16px' }}>GRID 04</span>
            <span className="grid-label" style={{ top: '12px', right: '16px' }}>BUILD v2.0</span>
            
            {/* Corner crop marks */}
            <div className="crop-mark tl" />
            <div className="crop-mark tr" />
            <div className="crop-mark bl" />
            <div className="crop-mark br" />
            
            {/* Coordinate labels */}
            <span className="coord-label" style={{ top: '12px', left: '25%' }}>X:360</span>
            <span className="coord-label" style={{ top: '12px', left: '50%' }}>X:720</span>
            <span className="coord-label" style={{ top: '12px', left: '75%' }}>X:1080</span>
            <span className="coord-label" style={{ left: '12px', top: '25%' }}>Y:180</span>
            <span className="coord-label" style={{ left: '12px', top: '50%' }}>Y:360</span>
            <span className="coord-label" style={{ left: '12px', top: '75%' }}>Y:540</span>
            
            {/* Center mark */}
            <div className="grid-center-mark" />
            
            {/* Arc guides */}
            <div className="grid-arc arc-1" />
            <div className="grid-arc arc-2" />
            <div className="grid-arc arc-3" />
        </div>
    );
}

/* =========================
   GEOMETRIC SHAPES - UNIFIED SYSTEM
========================= */
function GeometricShapes() {
    return (
        <div className="geometric-shapes" aria-hidden="true">
            {/* === LAYER 1: Foundation Grid === */}
            <div className="shape layer-foundation">
                {/* Concentric rings - centered */}
                <div className="concentric-ring ring-1" />
                <div className="concentric-ring ring-2" />
                <div className="concentric-ring ring-3" />
                <div className="concentric-ring ring-4" />
                
                {/* Cross hairs */}
                <div className="cross-hair horizontal" />
                <div className="cross-hair vertical" />
                
                {/* Diagonal cross */}
                <div className="cross-hair diagonal-1" />
                <div className="cross-hair diagonal-2" />
            </div>

            {/* === LAYER 2: Secondary Structure === */}
            <div className="shape layer-structure">
                {/* Top-left quadrant grid */}
                <div className="quadrant-grid tl">
                    <div className="grid-line h" style={{ top: '33.33%' }} />
                    <div className="grid-line h" style={{ top: '66.66%' }} />
                    <div className="grid-line v" style={{ left: '33.33%' }} />
                    <div className="grid-line v" style={{ left: '66.66%' }} />
                </div>
                
                {/* Bottom-right quadrant grid */}
                <div className="quadrant-grid br">
                    <div className="grid-line h" style={{ top: '33.33%' }} />
                    <div className="grid-line h" style={{ top: '66.66%' }} />
                    <div className="grid-line v" style={{ left: '33.33%' }} />
                    <div className="grid-line v" style={{ left: '66.66%' }} />
                </div>
            </div>

            {/* === LAYER 3: Dynamic Elements === */}
            <div className="shape layer-dynamic">
                {/* Rotating hexagon */}
                <div className="dynamic-hexagon">
                    <svg viewBox="0 0 100 100" fill="none">
                        <polygon
                            points="50,5 90,27 90,73 50,95 10,73 10,27"
                            stroke="rgba(45, 212, 191, 0.06)"
                            strokeWidth="0.5"
                        />
                        <polygon
                            points="50,15 80,32 80,68 50,85 20,68 20,32"
                            stroke="rgba(255,255,255,0.03)"
                            strokeWidth="0.3"
                        />
                    </svg>
                </div>
                
                {/* Orbiting dots */}
                <div className="orbit-dots">
                    <div className="orbit-dot dot-1" />
                    <div className="orbit-dot dot-2" />
                    <div className="orbit-dot dot-3" />
                    <div className="orbit-dot dot-4" />
                    <div className="orbit-dot dot-5" />
                    <div className="orbit-dot dot-6" />
                </div>
            </div>

            {/* === LAYER 4: Accent Geometry === */}
            <div className="shape layer-accent">
                {/* Golden spiral approximation */}
                <div className="golden-spiral">
                    <svg viewBox="0 0 200 200" fill="none">
                        <path
                            d="M100 100 L100 50 A50 50 0 0 1 150 100 L150 150 A50 50 0 0 1 100 200 L50 200 A50 50 0 0 1 0 150 L0 100 A50 50 0 0 1 50 50 L75 50 A25 25 0 0 1 100 75 L100 100"
                            stroke="rgba(255,255,255,0.03)"
                            strokeWidth="0.5"
                            fill="none"
                        />
                    </svg>
                </div>
                
                {/* Fibonacci rectangles - subtle */}
                <div className="fibonacci-rectangles">
                    <div className="fib-rect r1" />
                    <div className="fib-rect r2" />
                    <div className="fib-rect r3" />
                    <div className="fib-rect r4" />
                </div>
            </div>

            {/* === LAYER 5: Points & Markers === */}
            <div className="shape layer-points">
                <div className="point-marker p1" />
                <div className="point-marker p2" />
                <div className="point-marker p3" />
                <div className="point-marker p4" />
                <div className="point-marker p5" />
                <div className="point-marker p6" />
                <div className="point-marker p7" />
                <div className="point-marker p8" />
            </div>
        </div>
    );
}

/* =========================
   PDF VIEWER LAZY LOAD
========================= */
const PDFViewer = lazy(() => import('./PDFViewer'));

/* =========================
   MAIN COMPONENT
========================= */
function Main() {
    const navigate = useNavigate();
    const [isLoaded, setIsLoaded] = useState(false);
    const [viewerUrl, setViewerUrl] = useState<string | null>(null);
    const [pdfLoading, setPdfLoading] = useState(false);
    const [clickCount, setClickCount] = useState(0);
    const [ripples, setRipples] = useState<Array<{ id: number; x: number; y: number }>>([]);
    const rippleIdRef = useRef(0);
    const clickTimerRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        const timer = setTimeout(() => setIsLoaded(true), 200);
        return () => clearTimeout(timer);
    }, []);

    const handleSecretClick = useCallback((e: React.MouseEvent) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        if (clickTimerRef.current) {
            clearTimeout(clickTimerRef.current);
            clickTimerRef.current = null;
        }

        const newCount = clickCount + 1;
        setClickCount(newCount);

        const newRipple = { id: rippleIdRef.current++, x, y };
        setRipples(prev => [...prev, newRipple]);
        setTimeout(() => {
            setRipples(prev => prev.filter(r => r.id !== newRipple.id));
        }, 800);

        if (newCount >= 5) {
            setClickCount(0);
            if (clickTimerRef.current) {
                clearTimeout(clickTimerRef.current);
                clickTimerRef.current = null;
            }
            navigate('/archive');
        } else {
            clickTimerRef.current = setTimeout(() => {
                setClickCount(0);
                clickTimerRef.current = null;
            }, 2000);
        }
    }, [clickCount, navigate]);

    const openCVViewer = useCallback(() => {
        setPdfLoading(true);
        setViewerUrl("/YambaoResume.pdf");
        setTimeout(() => setPdfLoading(false), 500);
    }, []);

    const closeViewer = useCallback(() => {
        setViewerUrl(null);
        setPdfLoading(false);
    }, []);

    return (
        <div className={`main-container ${isLoaded ? 'loaded' : ''}`}>
            <ConstructionGrid />
            <GeometricShapes />

            <section className="hero-section">
                <div className="hero-content">
                    {/* Left Column - Typography */}
                    <div className="hero-left">
                        <div className="hero-meta">
                            <span className="meta-label">FULL-STACK ARCHITECT</span>
                            <span className="meta-dot">●</span>
                            <span className="meta-label">TDY.dev</span>
                        </div>
                        
                        <h1 className="hero-title">
                            <span className="title-line" onClick={handleSecretClick}>
                                TANYA
                            </span>
                            <span className="title-line" onClick={handleSecretClick}>
                                DENISE
                            </span>
                            <span className="title-line" onClick={handleSecretClick}>
                                YAMBAO
                            </span>
                        </h1>

                        <div className="hero-subtitle">
                            <p className="subtitle-primary">Computer Science Student</p>
                            <p className="subtitle-secondary">Full-Stack Developer</p>
                        </div>

                        <div className="hero-actions">
                            <button
                                className="action-link primary"
                                onClick={openCVViewer}
                                disabled={pdfLoading}
                            >
                                <span className="action-text">Resume→</span>
                            </button>
                            <a
                                href="https://github.com/Rachiminoff"
                                target="_blank"
                                rel="noreferrer"
                                className="action-link"
                            >
                                <span className="action-text">GitHub→</span>
                            </a>
                            <a
                                href="https://www.linkedin.com/in/tanya-denise-yambao-9677223b9/"
                                target="_blank"
                                rel="noreferrer"
                                className="action-link"
                            >
                                <span className="action-text">LinkedIn→</span>
                            </a>
                        </div>

                        <div className="hero-annotations">
                            <span className="annotation">SECTION A</span>
                            <span className="annotation">ALIGNMENT LOCK</span>
                            <span className="annotation">ID: TDY-001</span>
                        </div>
                    </div>

                    {/* Right Column - Profile Module */}
                    <div className="hero-right">
                        <div className="profile-module">
                            {/* Module header */}
                            <div className="module-header">
                                <span className="module-label">PROFILE 01</span>
                                <span className="module-status">● AVAILABLE</span>
                            </div>

                            {/* Module content - the framed portrait */}
                            <div className="module-content">
                                {/* Construction frame - SQUARE/RECTANGULAR */}
                                <div className="profile-frame">
                                    {/* Outer square frame */}
                                    <div className="frame-square outer" />
                                    <div className="frame-square inner" />
                                    
                                    {/* Construction circles (now as guides inside square) */}
                                    <div className="frame-circle primary" />
                                    <div className="frame-circle secondary" />
                                    
                                    {/* Halftone background */}
                                    <div className="profile-halftone" />
                                    
                                    {/* Portrait - now larger, filling the frame */}
                                    <div className="profile-image-wrapper">
                                        <div className="profile-image-container">
                                            <img
                                                src={profilePic}
                                                alt="Tanya Denise Yambao"
                                                className="profile-image"
                                            />
                                            <div className="profile-image-overlay" />
                                            <div className="profile-image-border" />
                                        </div>
                                    </div>
                                    
                                    {/* Construction brackets - larger */}
                                    <div className="frame-bracket tl" />
                                    <div className="frame-bracket tr" />
                                    <div className="frame-bracket bl" />
                                    <div className="frame-bracket br" />
                                    
                                    {/* Guide lines - extended */}
                                    <div className="frame-guide vertical" />
                                    <div className="frame-guide horizontal" />
                                    <div className="frame-guide diagonal-1" />
                                    <div className="frame-guide diagonal-2" />
                                    
                                    {/* Measurement ticks - larger */}
                                    <div className="measurement-tick top" />
                                    <div className="measurement-tick bottom" />
                                    <div className="measurement-tick left" />
                                    <div className="measurement-tick right" />
                                    
                                    {/* Coordinate labels */}
                                    <span className="frame-coord" style={{ top: '-36px', right: '-24px' }}>
                                        X:420
                                    </span>
                                    <span className="frame-coord" style={{ bottom: '-36px', left: '-24px' }}>
                                        Y:180
                                    </span>
                                    <span className="frame-coord" style={{ top: '50%', right: '-56px', transform: 'translateY(-50%)' }}>
                                        R=280
                                    </span>
                                    <span className="frame-coord" style={{ top: '-36px', left: '-24px' }}>
                                        W:320
                                    </span>
                                    <span className="frame-coord" style={{ bottom: '-36px', right: '-24px' }}>
                                        H:320
                                    </span>
                                </div>
                            </div>

                            {/* Module footer - metadata */}
                            <div className="module-footer">
                                <div className="footer-item">
                                    <span className="footer-label">STATUS</span>
                                    <span className="footer-value">ACTIVE</span>
                                </div>
                                <div className="footer-divider" />
                                <div className="footer-item">
                                    <span className="footer-label">ROLE</span>
                                    <span className="footer-value">FULL-STACK</span>
                                </div>
                                <div className="footer-divider" />
                                <div className="footer-item">
                                    <span className="footer-label">LOCATION</span>
                                    <span className="footer-value">PHILIPPINES</span>
                                </div>
                                <div className="footer-divider" />
                                <div className="footer-item">
                                    <span className="footer-label">VERSION</span>
                                    <span className="footer-value">2026</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Secret click ripples */}
                {ripples.map(ripple => (
                    <div
                        key={ripple.id}
                        className="click-ripple"
                        style={{ left: ripple.x, top: ripple.y }}
                    />
                ))}
            </section>

            <Suspense fallback={null}>
                <PDFViewer url={viewerUrl} onClose={closeViewer} />
            </Suspense>
        </div>
    );
}

export default Main;