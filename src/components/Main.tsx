import React, { useState, useEffect, useRef, Suspense, lazy } from "react";

import GitHubIcon from '@mui/icons-material/GitHub';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import DescriptionIcon from '@mui/icons-material/Description';

import profilePic from '../assets/images/profile.jpeg';
import '../assets/styles/Main.scss';

// Lazy load heavy components
const Vault = lazy(() => import('./Vault'));
const PDFViewer = lazy(() => import('./PDFViewer'));

/* =========================
   IMPROVED VAULT MODAL
========================= */
function VaultModal({
    open,
    onUnlock,
    onClose,
    loading,
    error,
    remainingAttempts,
    lockedUntil,
}: {
    open: boolean;
    onUnlock: (password: string) => void;
    onClose: () => void;
    loading: boolean;
    error: string | null;
    remainingAttempts?: number;
    lockedUntil?: number | null;
}) {
    const [password, setPassword] = useState("");
    const [shake, setShake] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const [showPassword, setShowPassword] = useState(false);

    // Auto-focus and reset on open
    useEffect(() => {
        if (open) {
            setTimeout(() => inputRef.current?.focus(), 100);
            setPassword("");
            setShake(false);
        }
    }, [open]);

    // Handle escape key
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && open) onClose();
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [open, onClose]);

    // Trigger shake animation on error
    useEffect(() => {
        if (error) {
            setShake(true);
            setTimeout(() => setShake(false), 500);
        }
    }, [error]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (password.trim()) {
            onUnlock(password);
        }
    };

    if (!open) return null;

    const isLocked = lockedUntil && lockedUntil > Date.now();
    const lockTimeRemaining = isLocked 
        ? Math.ceil((lockedUntil - Date.now()) / 60000) 
        : 0;

    return (
        <div 
            className="vault-modal-backdrop" 
            onClick={onClose}
            role="dialog"
            aria-modal="true"
            aria-labelledby="vault-modal-title"
        >
            <div 
                className={`vault-modal ${shake ? 'shake' : ''}`} 
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header with icon */}
                <div className="vault-modal-header">
                    <div className="vault-modal-icon">🔐</div>
                    <h2 id="vault-modal-title">Secret Vault</h2>
                    <button 
                        className="vault-modal-close"
                        onClick={onClose}
                        aria-label="Close modal"
                    >
                        ✕
                    </button>
                </div>

                {/* Description */}
                <p className="vault-modal-description">
                    Enter the secret code to unlock hidden content
                </p>

                {/* Locked state */}
                {isLocked ? (
                    <div className="vault-modal-locked">
                        <div className="lock-icon">🔒</div>
                        <p className="lock-title">Vault is locked</p>
                        <p className="lock-subtitle">
                            Too many failed attempts. 
                            Try again in <strong>{lockTimeRemaining} minute{lockTimeRemaining !== 1 ? 's' : ''}</strong>.
                        </p>
                        <p className="lock-time">
                            Unlocks at {new Date(lockedUntil).toLocaleTimeString()}
                        </p>
                        <button 
                            className="vault-modal-button secondary"
                            onClick={onClose}
                        >
                            Close
                        </button>
                    </div>
                ) : (
                    <>
                        {/* Password input */}
                        <form onSubmit={handleSubmit} className="vault-modal-form">
                            <div className="vault-input-wrapper">
                                <input
                                    ref={inputRef}
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Enter secret code..."
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className={`vault-modal-input ${error ? 'error' : ''}`}
                                    disabled={loading}
                                    autoComplete="off"
                                    aria-label="Secret code"
                                />
                                <button
                                    type="button"
                                    className="vault-toggle-visibility"
                                    onClick={() => setShowPassword(!showPassword)}
                                    aria-label={showPassword ? "Hide password" : "Show password"}
                                    tabIndex={-1}
                                >
                                    {showPassword ? "👁️" : "👁️‍🗨️"}
                                </button>
                            </div>

                            {/* Error message */}
                            {error && (
                                <div className="vault-modal-error" role="alert">
                                    <span className="error-icon">⚠️</span>
                                    <span>{error}</span>
                                    {remainingAttempts !== undefined && remainingAttempts > 0 && (
                                        <span className="attempts-badge">
                                            {remainingAttempts} attempt{remainingAttempts !== 1 ? 's' : ''} left
                                        </span>
                                    )}
                                </div>
                            )}

                            {/* Remaining attempts indicator */}
                            {remainingAttempts !== undefined && remainingAttempts > 0 && !error && (
                                <div className="vault-modal-attempts">
                                    <div className="attempts-dots">
                                        {Array.from({ length: 5 }, (_, i) => (
                                            <span 
                                                key={i} 
                                                className={`attempt-dot ${i < remainingAttempts ? 'active' : 'used'}`}
                                            />
                                        ))}
                                    </div>
                                    <span className="attempts-text">
                                        {remainingAttempts} attempt{remainingAttempts !== 1 ? 's' : ''} remaining
                                    </span>
                                </div>
                            )}

                            {/* Action buttons */}
                            <div className="vault-modal-actions">
                                <button
                                    type="button"
                                    className="vault-modal-button secondary"
                                    onClick={onClose}
                                    disabled={loading}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="vault-modal-button primary"
                                    disabled={loading || !password.trim()}
                                >
                                    {loading ? (
                                        <>
                                            <span className="spinner" />
                                            Unlocking...
                                        </>
                                    ) : (
                                        <>
                                            Unlock Vault
                                            <span className="button-arrow">→</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </>
                )}
            </div>
        </div>
    );
}

/* =========================
   PARTICLE BACKGROUND
========================= */
function ParticleBackground() {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let particles: {x: number; y: number; vx: number; vy: number; radius: number}[] = [];
        const count = 50;
        let animationId: number;

        const resize = () => {
            const rect = canvas.parentElement?.getBoundingClientRect();
            if (rect) {
                canvas.width = rect.width;
                canvas.height = rect.height;
            }
        };

        const initParticles = () => {
            particles = [];
            for (let i = 0; i < count; i++) {
                particles.push({
                    x: Math.random() * canvas.width,
                    y: Math.random() * canvas.height,
                    vx: (Math.random() - 0.5) * 0.3,
                    vy: (Math.random() - 0.5) * 0.3,
                    radius: Math.random() * 1.5 + 0.5
                });
            }
        };

        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            particles.forEach(p => {
                p.x += p.vx;
                p.y += p.vy;
                
                if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
                if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
                
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(255,255,255,0.03)';
                ctx.fill();
            });
            
            // Draw connections
            for (let i = 0; i < particles.length; i++) {
                for (let j = i + 1; j < particles.length; j++) {
                    const dx = particles[i].x - particles[j].x;
                    const dy = particles[i].y - particles[j].y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    
                    if (distance < 150) {
                        ctx.beginPath();
                        ctx.moveTo(particles[i].x, particles[i].y);
                        ctx.lineTo(particles[j].x, particles[j].y);
                        ctx.strokeStyle = `rgba(255,255,255,${0.015 * (1 - distance/150)})`;
                        ctx.lineWidth = 0.5;
                        ctx.stroke();
                    }
                }
            }
            
            animationId = requestAnimationFrame(animate);
        };
        
        resize();
        initParticles();
        animate();

        window.addEventListener('resize', () => {
            resize();
            initParticles();
        });
        
        return () => {
            cancelAnimationFrame(animationId);
            window.removeEventListener('resize', resize);
        };
    }, []);

    return <canvas 
        ref={canvasRef} 
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
   MAIN COMPONENT
========================= */
function Main() {
    const [clickCount, setClickCount] = useState(0);
    const [showVaultPrompt, setShowVaultPrompt] = useState(false);
    const [vaultInput, setVaultInput] = useState("");
    const [vaultUnlocked, setVaultUnlocked] = useState(false);
    const [loading, setLoading] = useState(false);
    const [viewerUrl, setViewerUrl] = useState<string | null>(null);
    const [vaultLockedUntil, setVaultLockedUntil] = useState<number | null>(null);
    const [vaultModalOpen, setVaultModalOpen] = useState(false);
    const [vaultError, setVaultError] = useState<string | null>(null);
    const [remainingAttempts, setRemainingAttempts] = useState<number | undefined>(undefined);
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    const [isLoaded, setIsLoaded] = useState(false);

    // Track mouse position for glow effect
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            setMousePosition({ x: e.clientX, y: e.clientY });
        };
        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    // Trigger entrance animation
    useEffect(() => {
        setIsLoaded(true);
    }, []);

    // Track scroll for parallax
    useEffect(() => {
        const handleScroll = () => {
            const scrollY = window.scrollY;
            const section = document.querySelector('.about-section') as HTMLElement;
            if (section) {
                section.style.setProperty('--scroll-offset', `${scrollY}`);
            }
        };
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // FORCE VAULT TO BE LOCKED ON MOUNT
    useEffect(() => {
        try {
            localStorage.removeItem('vaultUnlocked');
            sessionStorage.removeItem('vaultUnlocked');
        } catch (e) {
            // Ignore errors if localStorage is not available
        }
        
        setVaultUnlocked(false);
        setShowVaultPrompt(false);
        
        console.log('Vault forcefully locked on mount');
    }, []);

    // Monitor vault state changes for debugging
    useEffect(() => {
        console.log('vaultUnlocked is now:', vaultUnlocked);
    }, [vaultUnlocked]);

    /* =========================
       SECRET CLICK TRIGGER
    ========================= */
    const handleSecretClick = () => {
        const newCount = clickCount + 1;
        setClickCount(newCount);

        if (newCount >= 5) {
            setVaultModalOpen(true);
            setClickCount(0);
            setVaultError(null);
            setRemainingAttempts(undefined);
            setVaultLockedUntil(null);
        }
    };

    /* =========================
       VAULT SUBMIT
    ========================= */
    const handleVaultSubmit = async (password: string) => {
        setLoading(true);
        setVaultError(null);

        try {
            const response = await fetch("/api/unlock", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ password }),
            });

            const data = await response.json();
            console.log('API Response:', data);

            if (data.success) {
                console.log('Vault unlocked successfully!');
                setVaultUnlocked(true);
                setVaultModalOpen(false);
                setVaultError(null);
                setRemainingAttempts(undefined);
            } else if (data.locked) {
                setVaultLockedUntil(data.lockedUntil);
                setVaultError("Too many failed attempts");
            } else if (data.remaining !== undefined) {
                setRemainingAttempts(data.remaining);
                setVaultError("Wrong code");
            } else {
                setVaultError("The code you entered is not valid.");
            }
        } catch (error) {
            console.error(error);
            setVaultError("Something went wrong. Please try again.");
        }

        setLoading(false);
        setVaultInput("");
    };

    /* =========================
       CV VIEWER
    ========================= */
    const openCVViewer = () => {
        setViewerUrl("/YambaoResume.pdf");
    };

    const closeViewer = () => {
        setViewerUrl(null);
    };

    /* =========================
       UI
    ========================= */
    return (
        <div className={`container ${isLoaded ? 'loaded' : ''}`}>
            <ParticleBackground />
            
            <div 
                className="about-section"
                style={{
                    '--mouse-x': `${mousePosition.x}px`,
                    '--mouse-y': `${mousePosition.y}px`
                } as React.CSSProperties}
            >
                <div className="image-wrapper">
                    <img
                        src={profilePic}
                        alt="Tanya Denise Yambao"
                        loading="lazy"
                    />
                </div>

                <div className="content">
                    <div className="social_icons">
                        <a
                            href="https://github.com/Rachiminoff"
                            target="_blank"
                            rel="noreferrer"
                            className="social-link github"
                            data-label="GitHub"
                            aria-label="GitHub Profile"
                        >
                            <GitHubIcon />
                        </a>
                        <a
                            href="https://www.linkedin.com/in/tanya-denise-yambao-9677223b9/"
                            target="_blank"
                            rel="noreferrer"
                            className="social-link linkedin"
                            data-label="LinkedIn"
                            aria-label="LinkedIn Profile"
                        >
                            <LinkedInIcon />
                        </a>
                        <button 
                            className="social-link cv" 
                            onClick={openCVViewer}
                            data-label="Resume"
                            aria-label="View Resume"
                            tabIndex={0}
                        >
                            <DescriptionIcon />
                        </button>
                    </div>

                    <h1
                        onClick={handleSecretClick}
                        style={{ cursor: "pointer" }}
                        title="Click 5 times for a secret"
                    >
                        Tanya Denise Yambao
                    </h1>

                    <p
                        onClick={handleSecretClick}
                        style={{ cursor: "pointer" }}
                        title="Click 5 times for a secret"
                    >
                        Full-Stack Developer
                    </p>

                    <div className="mobile_social_icons">
                        <a
                            href="https://github.com/Rachiminoff"
                            target="_blank"
                            rel="noreferrer"
                            className="social-link github"
                            data-label="GitHub"
                            aria-label="GitHub Profile"
                        >
                            <GitHubIcon />
                        </a>
                        <a
                            href="https://www.linkedin.com/in/tanya-denise-yambao-9677223b9/"
                            target="_blank"
                            rel="noreferrer"
                            className="social-link linkedin"
                            data-label="LinkedIn"
                            aria-label="LinkedIn Profile"
                        >
                            <LinkedInIcon />
                        </a>
                        <button 
                            className="social-link cv" 
                            onClick={openCVViewer}
                            data-label="Resume"
                            aria-label="View Resume"
                            tabIndex={0}
                        >
                            <DescriptionIcon />
                        </button>
                    </div>

                    {/* =========================
                        VAULT INPUT (HIDDEN WHEN LOCKED)
                    ========================= */}
                    {showVaultPrompt && !vaultLockedUntil && (
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                handleVaultSubmit(vaultInput);
                            }}
                            className="vault-form"
                            role="search"
                        >
                            <input
                                type="password"
                                placeholder="Enter secret code"
                                value={vaultInput}
                                onChange={(e) =>
                                    setVaultInput(e.target.value)
                                }
                                autoFocus
                                className="vault-input"
                                aria-label="Secret code input"
                                autoComplete="off"
                            />
                            <button
                                type="submit"
                                className="vault-button"
                                disabled={loading}
                            >
                                {loading ? "Checking..." : "Unlock →"}
                            </button>
                        </form>
                    )}

                    {/* =========================
                        LOADING SKELETON
                    ========================= */}
                    {loading && (
                        <div className="vault-loading" role="status" aria-label="Loading">
                            <div className="skeleton-shimmer"></div>
                        </div>
                    )}

                    {/* =========================
                        LOCKED MESSAGE
                    ========================= */}
                    {showVaultPrompt && vaultLockedUntil && (
                        <div className="vault-locked" role="alert">
                            <p>🔒 Vault is locked... Who are you?</p>
                            <p>
                                Unlocks at:{" "}
                                {new Date(vaultLockedUntil).toLocaleString()}
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* =========================
                ONLY RENDER VAULT IF UNLOCKED
            ========================= */}
            <Suspense fallback={null}>
                {vaultUnlocked === true && <Vault />}
            </Suspense>

            <Suspense fallback={null}>
                <PDFViewer
                    url={viewerUrl}
                    onClose={closeViewer}
                />
            </Suspense>

            {/* =========================
                IMPROVED VAULT MODAL
            ========================= */}
            <VaultModal
                open={vaultModalOpen}
                onUnlock={handleVaultSubmit}
                onClose={() => {
                    setVaultModalOpen(false);
                    setVaultError(null);
                    setRemainingAttempts(undefined);
                }}
                loading={loading}
                error={vaultError}
                remainingAttempts={remainingAttempts}
                lockedUntil={vaultLockedUntil}
            />
        </div>
    );
}

export default Main;