import React from 'react';
import '../assets/styles/Terminal.scss';

function Terminal() {
  return (
    <section className="about-section" id="about" aria-labelledby="about-title">
      <div className="about-section-grid" aria-hidden="true" />

      <div className="about-inner">
        <header className="about-section-heading">
          <div className="about-heading-index">
            <span>02</span>
            <span>PROFILE / NOTE</span>
          </div>
          <div className="about-heading-rule" />
          <p>PROCESS OVER POLISH</p>
        </header>

        <div className="about-layout">
          <div className="about-terminal-column">
            <div className="about-terminal-label">
              <span>TDY / SYSTEM LOG</span>
              <span>01—01</span>
            </div>

            <div className="terminal-window">
              <div className="terminal-topbar">
                <div className="terminal-dots" aria-hidden="true">
                  <span className="dot red" />
                  <span className="dot yellow" />
                  <span className="dot green" />
                </div>
                <div className="terminal-title">td.yambao — shell</div>
                <div className="terminal-annotation">ABOUT.PY</div>
              </div>

              <div className="terminal-content">
                <div className="line blue">
                  <span className="prompt-symbol">➜</span> (td@yambao)-[~/about_me]
                </div>
                <div className="line">
                  <span className="cyan">└─$ </span>
                  <span className="white">python about.py</span>
                </div>

                <div className="line-separator" />

                <div className="line gray">
                  <span className="comment-symbol">#</span> loading personal profile...
                </div>
                <div className="line">
                  <span className="blue">import</span> <span className="white">creativity</span>
                  <span className="comma">, </span>
                  <span className="white">engineering</span>
                  <span className="comma">, </span>
                  <span className="white">growth</span>
                </div>

                <div className="line-separator thin" />

                <div className="line">
                  <span className="purple">class</span> <span className="yellow-text">AboutMe</span>
                  <span className="colon">:</span>
                </div>
                <div className="indent">
                  <span className="purple">def</span> <span className="yellow-text">__init__</span>
                  <span className="parens">(</span>
                  <span className="white">self</span>
                  <span className="parens">)</span>
                  <span className="colon">:</span>
                </div>
                <div className="indent2">
                  <span className="white">self.identity</span>
                  <span className="operator"> = </span>
                  <span className="green-text">
                    "developer focused on building meaningful systems"
                  </span>
                </div>
                <div className="indent2">
                  <span className="white">self.interests</span>
                  <span className="operator"> = </span>
                  <span className="green-text">
                    "web apps, automation, UI/UX, scalable products"
                  </span>
                </div>
                <div className="indent2">
                  <span className="white">self.mindset</span>
                  <span className="operator"> = </span>
                  <span className="green-text">
                    "continuous learning through practical creation"
                  </span>
                </div>

                <div className="line-separator thin" />

                <div className="indent">
                  <span className="purple">def</span>{' '}
                  <span className="yellow-text">philosophy</span>
                  <span className="parens">(</span>
                  <span className="white">self</span>
                  <span className="parens">)</span>
                  <span className="colon">:</span>
                </div>
                <div className="indent2">
                  <span className="purple">return</span>{' '}
                  <span className="green-text">"build with purpose, improve with consistency"</span>
                </div>

                <div className="line-separator" />
                <div className="line">
                  <span className="cyan">└─$ </span>
                  <span className="white">result = AboutMe().philosophy()</span>
                </div>
                <div className="line output-line">
                  <span className="green-text output-arrow">&gt;&gt;&gt; </span>
                  <span className="green-text output-value">
                    {'{'}result{'}'}
                  </span>
                  <span className="cursor">█</span>
                </div>
              </div>
            </div>
          </div>

          <article className="about-copy">
            <div className="about-copy-topline">
              <span className="about-copy-mark" aria-hidden="true">
                ●
              </span>
              <span>ABOUT / 01</span>
              <span className="about-copy-year">2026</span>
            </div>

            <h1 className="about-title" id="about-title">
              Built through
              <br />
              <em>iteration.</em>
            </h1>

            <p className="about-lead">
              I enjoy the process of testing and debugging, even when it gets frustrating. There is
              something satisfying about taking a broken piece of logic, tracing where it went
              wrong, and gradually getting it to work the way it was meant to.
            </p>

            <div className="about-story-grid">
              <span className="story-number">01</span>
              <p>
                Figuring out what is happening and why is one of the parts of development I enjoy
                most. The work is not always clean on the first pass, but every bug, experiment, and
                revision leaves the system a little clearer.
              </p>
            </div>

            <div className="about-story-grid story-second">
              <span className="story-number">02</span>
              <p>
                I feel most proud when a project is finished and I get to show it to someone else.
                Seeing all the pieces come together into something that actually works is genuinely
                satisfying, especially after all the iterations, mistakes, and fixes that got it
                there.
              </p>
            </div>

            <footer className="about-footer">
              <div>
                <span>APPROACH</span>
                <strong>MAKE → TEST → REFINE</strong>
              </div>
              <div>
                <span>IDENTITY</span>
                <strong>TDY / 01</strong>
              </div>
            </footer>
          </article>
        </div>
      </div>
    </section>
  );
}

export default Terminal;
