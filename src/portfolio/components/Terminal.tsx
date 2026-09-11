import React from 'react';
import '../assets/styles/Terminal.scss';

function Terminal() {
  return (
    <div className="terminal-section">
      {/* LEFT SIDE — TERMINAL */}
      <div className="terminal-container">
        <div className="terminal-window">
          <div className="terminal-topbar">
            <div className="terminal-dots">
              <span className="dot red"></span>
              <span className="dot yellow"></span>
              <span className="dot green"></span>
            </div>
            <div className="terminal-title">td.yambao — shell</div>
            <div className="terminal-annotation">TERMINAL 01</div>
          </div>

          <div className="terminal-content">
            <div className="line blue">
              <span className="prompt-symbol">➜</span> (td@yambao)-[~/about_me]
            </div>

            <div className="line">
              <span className="cyan">└─$ </span>
              <span className="white">python about.py</span>
            </div>

            <div className="line-separator"></div>

            <div className="line gray">
              <span className="comment-symbol">#</span> loading personal profile...
            </div>

            <div className="line">
              <span className="blue">import</span> <span className="white">creativity</span>
              <span className="comma">,</span> <span className="white">engineering</span>
              <span className="comma">,</span> <span className="white">growth</span>
            </div>

            <div className="line-separator thin"></div>

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
                <span className="quote">"</span>developer focused on building meaningful systems
                <span className="quote">"</span>
              </span>
            </div>

            <div className="indent2">
              <span className="white">self.interests</span>
              <span className="operator"> = </span>
              <span className="green-text">
                <span className="quote">"</span>web apps, automation, UI/UX, scalable products
                <span className="quote">"</span>
              </span>
            </div>

            <div className="indent2">
              <span className="white">self.mindset</span>
              <span className="operator"> = </span>
              <span className="green-text">
                <span className="quote">"</span>continuous learning through practical creation
                <span className="quote">"</span>
              </span>
            </div>

            <div className="line-separator thin"></div>

            <div className="indent">
              <span className="purple">def</span> <span className="yellow-text">philosophy</span>
              <span className="parens">(</span>
              <span className="white">self</span>
              <span className="parens">)</span>
              <span className="colon">:</span>
            </div>

            <div className="indent2">
              <span className="purple">return</span>{' '}
              <span className="green-text">
                <span className="quote">"</span>build with purpose, improve with consistency
                <span className="quote">"</span>
              </span>
            </div>

            <div className="line-separator"></div>

            <div className="line">
              <span className="cyan">└─$ </span>
              <span className="white">result = AboutMe().philosophy()</span>
            </div>

            <div className="line">
              <span className="green-text output-arrow">&gt;&gt;&gt; </span>
              <span className="green-text output-value">
                <span className="brace">{`{`}</span>result<span className="brace">{`}`}</span>
              </span>
              <span className="cursor">█</span>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT SIDE — ABOUT ME */}
      <div className="about-container">
        <div className="about-header">
          <span className="about-badge">●</span>
          <h1 className="about-title">About</h1>
          <span className="about-badge">●</span>
        </div>

        <div className="about-line">
          <span className="line-glow"></span>
        </div>

        <div className="about-text-wrapper">
          <p className="about-text">
            I enjoy the process of testing and debugging, even when it gets frustrating. There is
            something satisfying about taking a broken piece of logic, tracing where it went wrong,
            and gradually getting it to work the way it was meant to. That process of figuring out
            what is happening and why is often one of the parts of development I enjoy most.
          </p>
        </div>

        <div className="about-divider"></div>

        <div className="about-text-wrapper">
          <p className="about-text">
            I feel most proud when a project is finished and I get to show it to someone else.
            Seeing all the pieces come together into something that actually works is genuinely
            satisfying, especially after going through all the iterations, mistakes, and fixes that
            got it there.
          </p>
        </div>

        <div className="about-footer">
          <span className="footer-label">IDENTITY 01</span>
          <span className="footer-divider">|</span>
          <span className="footer-label">BUILD v1.0</span>
        </div>
      </div>
    </div>
  );
}

export default Terminal;
