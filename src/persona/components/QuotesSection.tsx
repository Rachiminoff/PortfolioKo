import React, { useEffect, useMemo, useState } from 'react';
import { Icon } from '@iconify/react';
import { personaQuotes } from '../data/quotes.data';
import PersonaSectionHeader from './PersonaSectionHeader';

const getTodayKey = () => {
  const today = new Date();
  return `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
};

const getDailyQuoteIndex = (total: number, key: string) => {
  if (total <= 1) return 0;
  let hash = 2166136261;
  for (let index = 0; index < key.length; index += 1) {
    hash ^= key.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) % total;
};

const QuotesSection: React.FC = () => {
  const total = personaQuotes.length;
  const [todayKey, setTodayKey] = useState(getTodayKey);
  const dailyIndex = useMemo(() => getDailyQuoteIndex(total, todayKey), [total, todayKey]);
  const [activeIndex, setActiveIndex] = useState(dailyIndex);
  const [direction, setDirection] = useState<'next' | 'prev'>('next');
  const hasQuotes = total > 0;

  useEffect(() => {
    setActiveIndex(dailyIndex);
  }, [dailyIndex]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setTodayKey((current) => {
        const next = getTodayKey();
        return current === next ? current : next;
      });
    }, 60_000);
    return () => window.clearInterval(timer);
  }, []);

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
        note="A DIFFERENT LINE, EVERY DAY"
        id="persona-quotes-title"
      />

      <div className="persona-quote-paper">
        <div className="persona-quote-paper-top" aria-hidden="true">
          <span>TODAY'S QUOTE</span>
          <span>
            {hasQuotes
              ? `ENTRY ${String(activeIndex + 1).padStart(2, '0')} / ${String(total).padStart(2, '0')}`
              : 'ENTRY 01'}
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

        {hasQuotes && total > 1 && (
          <div className="persona-quote-pagination" aria-label="Quote pagination">
            <button
              type="button"
              className="persona-quote-page-button"
              onClick={() => goToQuote(activeIndex - 1, 'prev')}
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
