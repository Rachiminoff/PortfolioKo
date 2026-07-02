import React, { useState, useEffect, useRef, Suspense, lazy, useCallback } from "react";

import GitHubIcon from '@mui/icons-material/GitHub';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import DescriptionIcon from '@mui/icons-material/Description';

import profilePic from '../assets/images/profile.jpeg';
import '../assets/styles/Main.scss';

// Lazy load heavy components
const Vault = lazy(() => import('./Vault'));
const Insights = lazy(() => import('./Insights'));
const PDFViewer = lazy(() => import('./PDFViewer'));

/* =========================
   IMPROVED PARTICLE SYSTEM
========================= */
function ParticleBackground() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const particlesRef = useRef<Array<{
        x: number;
        y: number;
        vx: number;
        vy: number;
        radius: number;
        baseRadius: number;
        opacity: number;
        speed: number;
        phase: number;
    }>>([]);
    const mouseRef = useRef({ x: -1000, y: -1000 });

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationId: number;

        const resize = () => {
            const rect = canvas.parentElement?.getBoundingClientRect();
            if (rect) {
                canvas.width = rect.width;
                canvas.height = rect.height;
            }
        };

        const initParticles = () => {
            const count = 55;
            particlesRef.current = Array.from({ length: count }, () => ({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                vx: (Math.random() - 0.5) * 0.15,
                vy: (Math.random() - 0.5) * 0.15,
                radius: Math.random() * 2.5 + 0.5,
                baseRadius: Math.random() * 2.5 + 0.5,
                opacity: Math.random() * 0.4 + 0.1,
                speed: Math.random() * 0.25 + 0.05,
                phase: Math.random() * Math.PI * 2
            }));
        };

        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            const particles = particlesRef.current;
            const time = Date.now() / 1000;
            
            particles.forEach(p => {
                const dx = mouseRef.current.x - p.x;
                const dy = mouseRef.current.y - p.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < 250) {
                    const force = (250 - distance) / 250 * 0.015;
                    p.vx += dx / distance * force * p.speed;
                    p.vy += dy / distance * force * p.speed;
                }
                
                p.vx *= 0.9995;
                p.vy *= 0.9995;
                
                p.x += p.vx * p.speed * 1.5;
                p.y += p.vy * p.speed * 1.5;
                
                if (p.x < -10) p.x = canvas.width + 10;
                if (p.x > canvas.width + 10) p.x = -10;
                if (p.y < -10) p.y = canvas.height + 10;
                if (p.y > canvas.height + 10) p.y = -10;
                
                p.radius = p.baseRadius + Math.sin(time * 0.5 + p.phase) * 0.3;
                
                const gradient = ctx.createRadialGradient(
                    p.x, p.y, 0,
                    p.x, p.y, p.radius * 2
                );
                const alpha = p.opacity * (0.8 + 0.2 * Math.sin(time * 0.3 + p.phase));
                gradient.addColorStop(0, `rgba(255, 255, 255, ${alpha})`);
                gradient.addColorStop(1, `rgba(255, 255, 255, 0)`);
                
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.radius * 2, 0, Math.PI * 2);
                ctx.fillStyle = gradient;
                ctx.fill();
                
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.8})`;
                ctx.fill();
            });
            
            for (let i = 0; i < particles.length; i++) {
                for (let j = i + 1; j < particles.length; j++) {
                    const dx = particles[i].x - particles[j].x;
                    const dy = particles[i].y - particles[j].y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    
                    if (distance < 180) {
                        const opacity = 0.035 * (1 - distance/180) * 
                            (particles[i].opacity + particles[j].opacity);
                        const width = 0.5 * (1 - distance/180);
                        
                        ctx.beginPath();
                        ctx.moveTo(particles[i].x, particles[i].y);
                        ctx.lineTo(particles[j].x, particles[j].y);
                        ctx.strokeStyle = `rgba(255, 255, 255, ${opacity})`;
                        ctx.lineWidth = width;
                        ctx.stroke();
                    }
                }
            }
            
            animationId = requestAnimationFrame(animate);
        };
        
        const handleMouseMove = (e: MouseEvent) => {
            const rect = canvas.getBoundingClientRect();
            mouseRef.current.x = e.clientX - rect.left;
            mouseRef.current.y = e.clientY - rect.top;
        };
        
        resize();
        initParticles();
        animate();

        window.addEventListener('resize', () => {
            resize();
            initParticles();
        });
        window.addEventListener('mousemove', handleMouseMove);
        
        return () => {
            cancelAnimationFrame(animationId);
            window.removeEventListener('resize', resize);
            window.removeEventListener('mousemove', handleMouseMove);
        };
    }, []);

    return <canvas 
        ref={canvasRef} 
        className="particle-canvas"
        style={{
            position: 'fixed',
            top: 0,
            left: 0,
            pointerEvents: 'none',
            zIndex: 0,
            width: '100%',
            height: '100%'
        }}
    />;
}

/* =========================
   FLOATING AMBIENT SHAPES
========================= */
function AmbientShapes() {
    return (
        <div className="ambient-shapes" aria-hidden="true">
            <div className="shape shape-1" />
            <div className="shape shape-2" />
            <div className="shape shape-3" />
            <div className="shape shape-4" />
        </div>
    );
}

/* =========================
   MAIN COMPONENT
========================= */
function Main() {
    // Vault state (triggered by clicking name/title)
    const [vaultClickCount, setVaultClickCount] = useState(0);
    const [vaultUnlocked, setVaultUnlocked] = useState(false);
    const [showVaultContent, setShowVaultContent] = useState(false);
    const vaultRef = useRef<HTMLDivElement>(null);

    // Insights state (triggered by clicking profile picture)
    const [insightsClickCount, setInsightsClickCount] = useState(0);
    const [insightsUnlocked, setInsightsUnlocked] = useState(false);
    const [showInsightsContent, setShowInsightsContent] = useState(false);
    const insightsRef = useRef<HTMLDivElement>(null);

    // Shared state
    const [viewerUrl, setViewerUrl] = useState<string | null>(null);
    const [pdfLoading, setPdfLoading] = useState(false);
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    const [isLoaded, setIsLoaded] = useState(false);
    const [ripples, setRipples] = useState<Array<{ id: number; x: number; y: number; type: 'vault' | 'insights' }>>([]);
    
    const rippleIdRef = useRef(0);
    const imageRef = useRef<HTMLImageElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Smooth cursor interpolation
    const targetMouseRef = useRef({ x: 0, y: 0 });
    const currentMouseRef = useRef({ x: 0, y: 0 });

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            targetMouseRef.current = { x: e.clientX, y: e.clientY };
        };
        
        const interpolate = () => {
            currentMouseRef.current.x += (targetMouseRef.current.x - currentMouseRef.current.x) * 0.08;
            currentMouseRef.current.y += (targetMouseRef.current.y - currentMouseRef.current.y) * 0.08;
            
            setMousePosition({
                x: currentMouseRef.current.x,
                y: currentMouseRef.current.y
            });
            
            requestAnimationFrame(interpolate);
        };
        
        window.addEventListener('mousemove', handleMouseMove);
        interpolate();
        
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
        };
    }, []);

    // Entrance animation
    useEffect(() => {
        const timer = setTimeout(() => setIsLoaded(true), 50);
        return () => clearTimeout(timer);
    }, []);

    // Force vault locked on mount
    useEffect(() => {
        try {
            localStorage.removeItem('vaultUnlocked');
            sessionStorage.removeItem('vaultUnlocked');
        } catch (e) {
            // Ignore
        }
        
        setVaultUnlocked(false);
        setShowVaultContent(false);
        setInsightsUnlocked(false);
        setShowInsightsContent(false);
    }, []);

    // Handle vault unlock animation
    useEffect(() => {
        if (vaultUnlocked) {
            setTimeout(() => {
                setShowVaultContent(true);
                setTimeout(() => {
                    if (vaultRef.current) {
                        vaultRef.current.scrollIntoView({ 
                            behavior: 'smooth', 
                            block: 'start' 
                        });
                    }
                }, 500);
            }, 300);
        } else {
            setShowVaultContent(false);
        }
    }, [vaultUnlocked]);

    // Handle insights unlock animation
    useEffect(() => {
        if (insightsUnlocked) {
            setTimeout(() => {
                setShowInsightsContent(true);
                setTimeout(() => {
                    if (insightsRef.current) {
                        insightsRef.current.scrollIntoView({ 
                            behavior: 'smooth', 
                            block: 'start' 
                        });
                    }
                }, 500);
            }, 300);
        } else {
            setShowInsightsContent(false);
        }
    }, [insightsUnlocked]);

    /* =========================
       VAULT TRIGGER - Click name 5 times
    ========================= */
    const handleVaultClick = useCallback((e: React.MouseEvent) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const newCount = vaultClickCount + 1;
        setVaultClickCount(newCount);

        // Ripple effect
        const newRipple = {
            id: rippleIdRef.current++,
            x: x,
            y: y,
            type: 'vault' as const
        };
        setRipples(prev => [...prev, newRipple]);
        
        setTimeout(() => {
            setRipples(prev => prev.filter(r => r.id !== newRipple.id));
        }, 800);

        if (newCount >= 5) {
            // Unlock vault - the Vault component will handle its own password
            setVaultUnlocked(true);
            setVaultClickCount(0);
            
            // Add a subtle haptic feedback feel with a class
            const element = e.currentTarget;
            element.classList.add('vault-triggered');
            setTimeout(() => {
                element.classList.remove('vault-triggered');
            }, 1000);
        }
    }, [vaultClickCount]);

    /* =========================
       INSIGHTS TRIGGER - Click profile picture 5 times
    ========================= */
    const handleInsightsClick = useCallback((e: React.MouseEvent) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const newCount = insightsClickCount + 1;
        setInsightsClickCount(newCount);

        // Ripple effect with different color
        const newRipple = {
            id: rippleIdRef.current++,
            x: x,
            y: y,
            type: 'insights' as const
        };
        setRipples(prev => [...prev, newRipple]);
        
        setTimeout(() => {
            setRipples(prev => prev.filter(r => r.id !== newRipple.id));
        }, 800);

        if (newCount >= 5) {
            // Unlock insights - the Insights component will handle its own password
            setInsightsUnlocked(true);
            setInsightsClickCount(0);
            
            // Add a subtle haptic feedback feel with a class
            const element = e.currentTarget;
            element.classList.add('insights-triggered');
            setTimeout(() => {
                element.classList.remove('insights-triggered');
            }, 1000);
        }
    }, [insightsClickCount]);

    /* =========================
       CV VIEWER
    ========================= */
    const openCVViewer = useCallback(() => {
        setPdfLoading(true);
        setTimeout(() => {
            setViewerUrl("/YambaoResume.pdf");
            setPdfLoading(false);
        }, 300);
    }, []);

    const closeViewer = useCallback(() => {
        setViewerUrl(null);
        setPdfLoading(false);
    }, []);

    /* =========================
       PROFILE IMAGE TILT
    ========================= */
    const getImageTilt = useCallback(() => {
        if (typeof window === 'undefined') return { x: 0, y: 0 };
        
        const x = ((mousePosition.x / window.innerWidth) - 0.5) * 6;
        const y = ((mousePosition.y / window.innerHeight) - 0.5) * -6;
        return { x, y };
    }, [mousePosition]);

    const tilt = getImageTilt();

    /* =========================
       UI
    ========================= */
    return (
        <div 
            ref={containerRef}
            className={`container ${isLoaded ? 'loaded' : ''}`}
        >
            {/* Background layers */}
            <div className="bg-gradient" />
            <ParticleBackground />
            <AmbientShapes />
            <div className="noise-overlay" />
            
            {/* Cursor glow */}
            <div 
                className="cursor-glow"
                style={{
                    left: mousePosition.x,
                    top: mousePosition.y,
                }}
            />
            
            <section 
                className="about-section"
                style={{
                    '--mouse-x': `${mousePosition.x}px`,
                    '--mouse-y': `${mousePosition.y}px`
                } as React.CSSProperties}
            >
                <div className="hero-glass">
                    <div className="hero-content">
                        <div 
                            className="image-wrapper"
                            style={{
                                transform: `rotateX(${tilt.y}deg) rotateY(${tilt.x}deg)`
                            }}
                            onClick={handleInsightsClick}
                            title="Click 5 times for Insights"
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    handleInsightsClick(e as any);
                                }
                            }}
                        >
                            <div className="profile-halo" />
                            <img
                                ref={imageRef}
                                src={profilePic}
                                alt="Tanya Denise Yambao"
                                loading="eager"
                                className="profile-image"
                            />
                            {insightsClickCount > 0 && insightsClickCount < 5 && (
                                <div className="click-counter insights-counter">
                                    {5 - insightsClickCount}
                                </div>
                            )}
                        </div>

                        <div className="text-content">
                            <div className="social_icons">
                                <a
                                    href="https://github.com/Rachiminoff"
                                    target="_blank"
                                    rel="noreferrer"
                                    className="social-link github"
                                    aria-label="GitHub Profile"
                                    title="GitHub"
                                >
                                    <GitHubIcon />
                                    <span className="tooltip">GitHub</span>
                                </a>
                                <a
                                    href="https://www.linkedin.com/in/tanya-denise-yambao-9677223b9/"
                                    target="_blank"
                                    rel="noreferrer"
                                    className="social-link linkedin"
                                    aria-label="LinkedIn Profile"
                                    title="LinkedIn"
                                >
                                    <LinkedInIcon />
                                    <span className="tooltip">LinkedIn</span>
                                </a>
                                <button 
                                    className="social-link cv" 
                                    onClick={openCVViewer}
                                    aria-label="View Resume"
                                    title="Resume"
                                    disabled={pdfLoading}
                                    tabIndex={0}
                                >
                                    <DescriptionIcon />
                                    <span className="tooltip">Resume</span>
                                    {pdfLoading && <span className="button-loader" />}
                                </button>
                            </div>

                            <h1
                                onClick={handleVaultClick}
                                className="name-title"
                                style={{ cursor: "pointer" }}
                                title="Click 5 times for Vault"
                                role="button"
                                tabIndex={0}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                        e.preventDefault();
                                        handleVaultClick(e as any);
                                    }
                                }}
                            >
                                Tanya Denise Yambao
                                {vaultClickCount > 0 && vaultClickCount < 5 && (
                                    <span className="click-counter vault-counter">
                                        {5 - vaultClickCount}
                                    </span>
                                )}
                            </h1>

                            <p
                                className="subtitle"
                            >
                                Full-Stack Developer
                            </p>

                            <div className="mobile_social_icons">
                                <a
                                    href="https://github.com/Rachiminoff"
                                    target="_blank"
                                    rel="noreferrer"
                                    className="social-link github"
                                    aria-label="GitHub Profile"
                                    title="GitHub"
                                >
                                    <GitHubIcon />
                                </a>
                                <a
                                    href="https://www.linkedin.com/in/tanya-denise-yambao-9677223b9/"
                                    target="_blank"
                                    rel="noreferrer"
                                    className="social-link linkedin"
                                    aria-label="LinkedIn Profile"
                                    title="LinkedIn"
                                >
                                    <LinkedInIcon />
                                </a>
                                <button 
                                    className="social-link cv" 
                                    onClick={openCVViewer}
                                    aria-label="View Resume"
                                    title="Resume"
                                    disabled={pdfLoading}
                                    tabIndex={0}
                                >
                                    <DescriptionIcon />
                                    {pdfLoading && <span className="button-loader" />}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Click ripples */}
                {ripples.map(ripple => (
                    <div
                        key={ripple.id}
                        className={`click-ripple ${ripple.type}`}
                        style={{
                            left: ripple.x,
                            top: ripple.y,
                        }}
                    />
                ))}
            </section>

            {/* =========================
                VAULT - ANIMATED INLINE REVEAL
            ========================= */}
            <div 
                ref={vaultRef}
                className={`vault-reveal-container ${showVaultContent ? 'visible' : ''}`}
            >
                <div className="vault-reveal-divider" />
                <Suspense fallback={
                    <div className="vault-loading-state">
                        <div className="vault-loading-spinner" />
                        <p>Loading archive...</p>
                    </div>
                }>
                    {vaultUnlocked && <Vault />}
                </Suspense>
            </div>

            {/* =========================
                INSIGHTS - ANIMATED INLINE REVEAL
            ========================= */}
            <div 
                ref={insightsRef}
                className={`insights-reveal-container ${showInsightsContent ? 'visible' : ''}`}
            >
                <div className="insights-reveal-divider" />
                <Suspense fallback={
                    <div className="insights-loading-state">
                        <div className="insights-loading-spinner" />
                        <p>Loading articles...</p>
                    </div>
                }>
                    {insightsUnlocked && <Insights />}
                </Suspense>
            </div>

            <Suspense fallback={null}>
                <PDFViewer
                    url={viewerUrl}
                    onClose={closeViewer}
                />
            </Suspense>
        </div>
    );
}

export default Main;