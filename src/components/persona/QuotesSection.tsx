import React from 'react';
import { Icon } from '@iconify/react';
import { personaQuotes } from './data/quotes.data';
import PersonaSectionHeader from './PersonaSectionHeader';

const QuotesSection: React.FC = () => (
  <section className="persona-quotes" aria-labelledby="persona-quotes-title">
    <PersonaSectionHeader
      index="04 / QUOTATIONS"
      title="WORDS I KEEP"
      note="LINES WORTH SAVING"
      id="persona-quotes-title"
    />

    <div className="persona-quote-paper">
      <div className="persona-quote-paper-top" aria-hidden="true">
        <span>PERSONAL NOTEBOOK</span>
        <span>PAGE 01</span>
      </div>

      {personaQuotes.length > 0 ? (
        <div className="persona-quote-list">
          {personaQuotes.map((item, index) => (
            <article className="persona-quote-card" key={`${item.quote}-${index}`}>
              <span className="persona-quote-mark" aria-hidden="true">
                “
              </span>
              <blockquote>{item.quote}</blockquote>
              {(item.attribution || item.source) && (
                <footer>
                  {item.attribution && <strong>— {item.attribution}</strong>}
                  {item.source && <span>{item.source}</span>}
                </footer>
              )}
              {item.note && <p className="persona-quote-note">{item.note}</p>}
            </article>
          ))}
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

      <div className="persona-quote-paper-foot">
        <span>KEEP WHAT RESONATES</span>
        <span aria-hidden="true">✦</span>
      </div>
    </div>
  </section>
);

export default QuotesSection;
