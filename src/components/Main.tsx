import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom"; // Add this import

import GitHubIcon from '@mui/icons-material/GitHub';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import DescriptionIcon from '@mui/icons-material/Description';

import profilePic from '../assets/images/profile.jpeg';

// Remove Vault import - it will be a route
// import Vault from './Vault';
import PDFViewer from './PDFViewer';

import '../assets/styles/Main.scss';

/* =========================
   ERROR MODAL
========================= */
function ErrorModal({
    open,
    title,
    message,
    onClose
}: {
    open: boolean;
    title: string;
    message: string;
    onClose: () => void;
}) {
    if (!open) return null;

    return (
        <div className="modal-backdrop" onClick={onClose}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
                <h2>{title}</h2>
                <p style={{ whiteSpace: "pre-line" }}>
                    {message}
                </p>
                <button onClick={onClose}>
                    Close
                </button>
            </div>
        </div>
    );
}

/* =========================
   MAIN COMPONENT
========================= */
function Main() {
    const navigate = useNavigate(); // Add this
    const [clickCount, setClickCount] = useState(0);
    const [showVaultPrompt, setShowVaultPrompt] = useState(false);
    const [vaultInput, setVaultInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [viewerUrl, setViewerUrl] = useState<string | null>(null);
    const [vaultLockedUntil, setVaultLockedUntil] = useState<number | null>(null);
    const [errorModal, setErrorModal] = useState<{
        open: boolean;
        title: string;
        message: string;
    } | null>(null);
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

    // Track mouse position for glow effect
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            setMousePosition({ x: e.clientX, y: e.clientY });
        };
        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    /* =========================
       SECRET CLICK TRIGGER
    ========================= */
    const handleSecretClick = () => {
        const newCount = clickCount + 1;
        setClickCount(newCount);

        if (newCount >= 5) {
            setShowVaultPrompt(true);
            setClickCount(0);
        }
    };

    /* =========================
       VAULT SUBMIT - Navigate to /vault on success
    ========================= */
    const handleVaultSubmit = async (
        e: React.FormEvent<HTMLFormElement>
    ) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await fetch("/api/unlock", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    password: vaultInput,
                }),
            });

            const data = await response.json();
            console.log('API Response:', data);

            if (data.success) {
                console.log('Vault unlocked! Navigating to /vault');
                // Navigate to vault route instead of rendering inline
                navigate("/vault");
                setShowVaultPrompt(false);
                setVaultInput("");
            } else if (data.locked) {
                setVaultLockedUntil(data.lockedUntil);
                setErrorModal({
                    open: true,
                    title: "Vault Locked",
                    message: `Too many attempts.\nLocked until ${new Date(
                        data.lockedUntil
                    ).toLocaleString()}`
                });
            } else if (data.remaining !== undefined) {
                setErrorModal({
                    open: true,
                    title: "Incorrect Code",
                    message: `Wrong code.\n${data.remaining} attempt(s) remaining.`
                });
            } else {
                setErrorModal({
                    open: true,
                    title: "Incorrect Code",
                    message: "The code you entered is not valid."
                });
            }
        } catch (error) {
            console.error(error);
            setErrorModal({
                open: true,
                title: "Error",
                message: "Something went wrong. Please try again."
            });
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
        <div className="container">
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
                    />
                </div>

                <div className="content">
                    <div className="social_icons">
                        <a
                            href="https://github.com/Rachiminoff"
                            target="_blank"
                            rel="noreferrer"
                            className="social-link github"
                        >
                            <GitHubIcon />
                        </a>
                        <a
                            href="https://www.linkedin.com/in/tanya-denise-yambao-9677223b9/"
                            target="_blank"
                            rel="noreferrer"
                            className="social-link linkedin"
                        >
                            <LinkedInIcon />
                        </a>
                        <button className="social-link cv" onClick={openCVViewer}>
                            <DescriptionIcon />
                        </button>
                    </div>

                    <h1
                        onClick={handleSecretClick}
                        style={{ cursor: "pointer" }}
                    >
                        Tanya Denise Yambao
                    </h1>

                    <p
                        onClick={handleSecretClick}
                        style={{ cursor: "pointer" }}
                    >
                        Full-Stack Developer
                    </p>

                    <div className="mobile_social_icons">
                        <a
                            href="https://github.com/Rachiminoff"
                            target="_blank"
                            rel="noreferrer"
                            className="social-link github"
                        >
                            <GitHubIcon />
                        </a>
                        <a
                            href="https://www.linkedin.com/in/tanya-denise-yambao-9677223b9/"
                            target="_blank"
                            rel="noreferrer"
                            className="social-link linkedin"
                        >
                            <LinkedInIcon />
                        </a>
                        <button className="social-link cv" onClick={openCVViewer}>
                            <DescriptionIcon />
                        </button>
                    </div>

                    {/* =========================
                        VAULT INPUT (HIDDEN WHEN LOCKED)
                    ========================= */}
                    {showVaultPrompt && !vaultLockedUntil && (
                        <form
                            onSubmit={handleVaultSubmit}
                            className="vault-form"
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
                        LOCKED MESSAGE
                    ========================= */}
                    {showVaultPrompt && vaultLockedUntil && (
                        <div className="vault-locked">
                            <p>🔒 Vault is locked... Who are you?</p>
                            <p>
                                Unlocks at:{" "}
                                {new Date(vaultLockedUntil).toLocaleString()}
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* REMOVED: Inline Vault rendering */}
            {/* {vaultUnlocked === true && <Vault />} */}

            <PDFViewer
                url={viewerUrl}
                onClose={closeViewer}
            />

            <ErrorModal
                open={!!errorModal?.open}
                title={errorModal?.title || ""}
                message={errorModal?.message || ""}
                onClose={() => setErrorModal(null)}
            />
        </div>
    );
}

export default Main;