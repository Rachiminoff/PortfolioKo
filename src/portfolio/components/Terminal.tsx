import React from 'react';
import '../assets/styles/Terminal.scss';

function Terminal() {
  return (
    <section className="about-section" id="about" aria-labelledby="about-title">
      <div className="about-section-grid" aria-hidden="true" />

      <div className="about-inner">
        <header className="about-section-heading section-header">
          <div className="section-header__number">03</div>
          <div className="section-header__label">ABOUT / PROCESS</div>
          <div className="section-header__rule" aria-hidden="true" />
          <div className="section-header__meta">PROFILE / PROCESS</div>
          <div className="section-header__status">PROCESS OVER POLISH</div>
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
              <span>MORE ABOUT / 03</span>
              <span className="about-copy-year">2026</span>
            </div>

            <h1 className="about-title" id="about-title">
              Built through
              <br />
              <em>iteration.</em>
            </h1>
            <p className="about-lead">
              I enjoy building software that eventually finds its way into someone else's hands.
              There is something especially rewarding about seeing people use something I made,
              whether that means receiving a quick thank-you, hearing how they use a feature, or
              getting a bug report that gives me something new to work on.
            </p>

            <div className="about-story-grid">
              <span className="story-number">01</span>
              <p>
                A project rarely comes together exactly as planned. I like figuring things out as I
                go—testing ideas, changing what doesn't work, and gradually turning scattered pieces
                into something coherent. Feedback makes that process even more meaningful because it
                gives the software a life beyond my own development environment.
              </p>
            </div>

            <div className="about-story-grid story-second">
              <span className="story-number">02</span>
              <p>
                One of my favorite parts comes near the end of a project, when most of the features
                are finally in place and I can look through the documentation. Seeing the decisions,
                features, and moving parts laid out together gives me a sense of how far the project
                has come. It's satisfying to see something that started as an idea become a
                complete, usable system.
              </p>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}

export default Terminal;
