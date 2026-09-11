import React, { useEffect, useState } from 'react';
import { Icon } from '@iconify/react';
import { personaQuotes } from '../data/quotes.data';
import PersonaSectionHeader from './PersonaSectionHeader';

const QuotesSection: React.FC = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [direction, setDirection] = useState<'next' | 'prev'>('next');
  const hasQuotes = personaQuotes.length > 0;
  const total = personaQuotes.length;

  useEffect(() => {
    if (activeIndex >= total && total > 0) {
      setActiveIndex(total - 1);
    }
  }, [activeIndex, total]);

  const goToQuote = (nextIndex: number, nextDirection: 'next' | 'prev') => {
    if (!hasQuotes || total <= 1) return;
    setDirection(nextDirection);
    setActiveIndex((nextIndex + total) % total);
  };

  const currentQuote = hasQuotes ? personaQuotes[activeIndex] : null;

  return (
    <section className="persona-quotes" id="quotes" aria-labelledby="persona-quotes-title">
      <PersonaSectionHeader
        index="04 / QUOTATIONS"
        title="WORDS I KEEP"
        note="LINES WORTH SAVING"
        id="persona-quotes-title"
      />

      <div className="persona-quote-paper">
        <div className="persona-quote-paper-top" aria-hidden="true">
          <span>PERSONAL NOTEBOOK</span>
          <span>
            PAGE {hasQuotes ? String(activeIndex + 1).padStart(2, '0') : '01'}
            {hasQuotes && ` / ${String(total).padStart(2, '0')}`}
          </span>
        </div>

        {currentQuote ? (
          <div className="persona-quote-stage" aria-live="polite">
            <article
              key={`${currentQuote.quote}-${activeIndex}`}
              className={`persona-quote-card persona-quote-card--${direction}`}
            >
              <span className="persona-quote-mark" aria-hidden="true">
                “
              </span>
              <blockquote>{currentQuote.quote}</blockquote>
              {(currentQuote.attribution || currentQuote.source) && (
                <footer>
                  {currentQuote.attribution && <strong>— {currentQuote.attribution}</strong>}
                  {currentQuote.source && <span>{currentQuote.source}</span>}
                </footer>
              )}
              {currentQuote.note && <p className="persona-quote-note">{currentQuote.note}</p>}
            </article>
          </div>
        ) : (
          <div className="persona-quote-empty">
            <Icon icon="mdi:pen-outline" width={22} />
            <div>
              <strong>A place for words worth keeping.</strong>
              <p>
                Add your favourite quotes in <code>quotes.data.ts</code>.
              </p>
            </div>
          </div>
        )}

        {hasQuotes && (
          <div className="persona-quote-pagination" aria-label="Quote pagination">
            <button
              type="button"
              className="persona-quote-page-button"
              onClick={() => goToQuote(activeIndex - 1, 'prev')}
              disabled={total <= 1}
              aria-label="Previous quote"
            >
              <Icon icon="mdi:arrow-left" />
              <span>PREV</span>
            </button>

            <div className="persona-quote-page-dots" role="tablist" aria-label="Quotes">
              {personaQuotes.map((_, index) => (
                <button
                  key={index}
                  type="button"
                  role="tab"
                  aria-selected={activeIndex === index}
                  aria-label={`Quote ${index + 1}`}
                  className={`persona-quote-page-dot ${activeIndex === index ? 'active' : ''}`}
                  onClick={() => {
                    setDirection(index > activeIndex ? 'next' : 'prev');
                    setActiveIndex(index);
                  }}
                />
              ))}
            </div>

            <button
              type="button"
              className="persona-quote-page-button"
              onClick={() => goToQuote(activeIndex + 1, 'next')}
              disabled={total <= 1}
              aria-label="Next quote"
            >
              <span>NEXT</span>
              <Icon icon="mdi:arrow-right" />
            </button>
          </div>
        )}

        <div className="persona-quote-paper-foot">
          <span>KEEP WHAT RESONATES</span>
          <span aria-hidden="true">✦</span>
        </div>
      </div>
    </section>
  );
};

export default QuotesSection;
