import React, { useState, useEffect, useRef, Suspense, lazy, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Icon } from "@iconify/react";

import profilePic from '../assets/images/profile.jpeg';
import '../assets/styles/Main.scss';

// Lazy load components
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
    const navigate = useNavigate();
    
    // State for secret click trigger
    const [clickCount, setClickCount] = useState(0);
    const [ripples, setRipples] = useState<Array<{ id: number; x: number; y: number }>>([]);
    const rippleIdRef = useRef(0);
    
    // Shared state
    const [viewerUrl, setViewerUrl] = useState<string | null>(null);
    const [pdfLoading, setPdfLoading] = useState(false);
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    const [isLoaded, setIsLoaded] = useState(false);
    
    const imageRef = useRef<HTMLImageElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Timer for resetting click counter
    const clickTimerRef = useRef<NodeJS.Timeout | null>(null);

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

    /* =========================
       SECRET TRIGGER - Click name/role 5 times
       Navigates to /archive instead of opening modal
    ========================= */
    const handleSecretClick = useCallback((e: React.MouseEvent) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // Clear existing timer
        if (clickTimerRef.current) {
            clearTimeout(clickTimerRef.current);
            clickTimerRef.current = null;
        }

        const newCount = clickCount + 1;
        setClickCount(newCount);

        // Ripple effect
        const newRipple = {
            id: rippleIdRef.current++,
            x: x,
            y: y
        };
        setRipples(prev => [...prev, newRipple]);
        
        setTimeout(() => {
            setRipples(prev => prev.filter(r => r.id !== newRipple.id));
        }, 800);

        if (newCount >= 5) {
            // Reset counter and navigate to archive
            setClickCount(0);
            if (clickTimerRef.current) {
                clearTimeout(clickTimerRef.current);
                clickTimerRef.current = null;
            }
            // Navigate to archive page
            navigate('/archive');
        } else {
            // Reset counter after 2 seconds of inactivity
            clickTimerRef.current = setTimeout(() => {
                setClickCount(0);
                clickTimerRef.current = null;
            }, 2000);
        }
    }, [clickCount, navigate]);

    /* =========================
       CV VIEWER
    ========================= */
    const openCVViewer = useCallback(() => {
        setPdfLoading(true);
        setViewerUrl("/YambaoResume.pdf");
        setTimeout(() => {
            setPdfLoading(false);
        }, 500);
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
                id="main"
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
                        >
                            <div className="profile-halo" />
                            <img
                                ref={imageRef}
                                src={profilePic}
                                alt="Tanya Denise Yambao"
                                loading="eager"
                                className="profile-image"
                            />
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
                                    <Icon icon="mdi:github" />
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
                                    <Icon icon="mdi:linkedin" />
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
                                    <Icon icon="mdi:file-document" />
                                    <span className="tooltip">Resume</span>
                                    {pdfLoading && <span className="button-loader" />}
                                </button>
                            </div>

                            <h1
                                onClick={handleSecretClick}
                                className="name-title"
                            >
                                Tanya Denise Yambao
                            </h1>

                            <p
                                onClick={handleSecretClick}
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
                                    <Icon icon="mdi:github" />
                                </a>
                                <a
                                    href="https://www.linkedin.com/in/tanya-denise-yambao-9677223b9/"
                                    target="_blank"
                                    rel="noreferrer"
                                    className="social-link linkedin"
                                    aria-label="LinkedIn Profile"
                                    title="LinkedIn"
                                >
                                    <Icon icon="mdi:linkedin" />
                                </a>
                                <button 
                                    className="social-link cv" 
                                    onClick={openCVViewer}
                                    aria-label="View Resume"
                                    title="Resume"
                                    disabled={pdfLoading}
                                    tabIndex={0}
                                >
                                    <Icon icon="mdi:file-document" />
                                    {pdfLoading && <span className="button-loader" />}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Secret click ripples */}
                {ripples.map(ripple => (
                    <div
                        key={ripple.id}
                        className="click-ripple"
                        style={{
                            left: ripple.x,
                            top: ripple.y,
                        }}
                    />
                ))}
            </section>

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