import React, { useState } from 'react';
import { Icon } from '@iconify/react';
import { useInView } from 'react-intersection-observer';

import '../assets/styles/Certificates.scss';
import { certificatesData } from '../data/certificates.data';
import PDFViewer from './PDFViewer';

const INITIAL_DISPLAY = 3;

// Color variants for cards
const colorVariants = ['blue', 'purple', 'teal', 'rose', 'amber', 'emerald', 'indigo', 'slate'];

const getColorVariant = (index: number): string => {
  return colorVariants[index % colorVariants.length];
};

// Icon mapping based on organization
const getOrganizationIcon = (org: string) => {
  const orgLower = org.toLowerCase();

  if (orgLower.includes('cisco')) {
    return <Icon icon="simple-icons:cisco" />;
  }
  if (orgLower.includes('microsoft')) {
    return <Icon icon="simple-icons:microsoft" />;
  }
  if (orgLower.includes('google')) {
    return <Icon icon="simple-icons:google" />;
  }
  if (orgLower.includes('meta') || orgLower.includes('facebook')) {
    return <Icon icon="simple-icons:meta" />;
  }
  if (orgLower.includes('aws') || orgLower.includes('amazon')) {
    return <Icon icon="simple-icons:amazonaws" />;
  }
  if (orgLower.includes('ibm')) {
    return <Icon icon="simple-icons:ibm" />;
  }
  if (orgLower.includes('freecodecamp')) {
    return <Icon icon="simple-icons:freecodecamp" />;
  }

  return <Icon icon="mdi:school" />;
};

function Certificates() {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

  const { ref, inView } = useInView({
    threshold: 0.1,
    triggerOnce: true,
  });

  const displayedCertificates = showAll
    ? certificatesData
    : certificatesData.slice(0, INITIAL_DISPLAY);

  const hasMore = certificatesData.length > INITIAL_DISPLAY;

  const handleViewCertificate = (e: React.MouseEvent, url?: string) => {
    e.preventDefault();
    e.stopPropagation();

    if (url) {
      setPdfUrl(url);
    }
  };

  const closePdfViewer = () => {
    setPdfUrl(null);
  };

  const handleViewAll = () => {
    setShowAll(true);
  };

  const handleVerify = (e: React.MouseEvent, url?: string) => {
    e.preventDefault();
    e.stopPropagation();

    if (url) {
      window.open(url, '_blank');
    }
  };

  return (
    <>
      <section className={`certificates ${inView ? 'visible' : ''}`} id="certificates" ref={ref}>
        <div className="certificates__header">
          <span className="certificates__tag">CERTIFICATIONS</span>
          <h2 className="certificates__title">Certificates</h2>
          <p className="certificates__subtitle">Professional certifications and credentials</p>
        </div>

        <div className="certificates__grid">
          {displayedCertificates.map((cert, index) => {
            const colorVariant = getColorVariant(index);
            return (
              <div
                key={cert.id}
                className={`certificates__card certificates__card--${colorVariant} ${inView ? 'animate-in' : ''}`}
                style={{ animationDelay: `${index * 80}ms` } as React.CSSProperties}
              >
                <div className="certificates__card-icon">
                  {getOrganizationIcon(cert.organization)}
                </div>

                <div className="certificates__card-content">
                  <h3 className="certificates__card-title">{cert.title}</h3>

                  <div className="certificates__card-meta">
                    <span className="certificates__card-org">{cert.organization}</span>
                    <span className="certificates__card-year">{cert.year}</span>
                  </div>

                  <div className="certificates__card-tags">
                    {cert.tags?.slice(0, 3).map((tag, i) => (
                      <span key={i} className="certificates__card-tag">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="certificates__card-actions">
                  {cert.pdfUrl && (
                    <button
                      className="certificates__card-action"
                      onClick={(e) => handleViewCertificate(e, cert.pdfUrl)}
                      aria-label={`View ${cert.title} certificate`}
                    >
                      <Icon icon="mdi:eye-outline" />
                      <span>View</span>
                    </button>
                  )}

                  {cert.verifyUrl && (
                    <button
                      className="certificates__card-action certificates__card-action--verify"
                      onClick={(e) => handleVerify(e, cert.verifyUrl)}
                      aria-label={`Verify ${cert.title} credential`}
                    >
                      <Icon icon="mdi:shield-check-outline" />
                      <span>Verify</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {hasMore && !showAll && (
          <div className="certificates__view-all">
            <button className="certificates__view-all-btn" onClick={handleViewAll}>
              <span>View All Certificates</span>
              <Icon icon="mdi:arrow-right" />
            </button>
          </div>
        )}
      </section>

      <PDFViewer url={pdfUrl} onClose={closePdfViewer} />
    </>
  );
}

export default Certificates;
