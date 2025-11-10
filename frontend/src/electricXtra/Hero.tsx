import React, { useEffect, useRef, useState } from 'react';
import './electricXtra.css';

type RotatorItem = {
  lines: string[];
};

const ROTATOR_CONTENT: RotatorItem[] = [
  {
    lines: ['AI-POWERED', 'VIOLENCE DETECTION'],
  },
  {
    lines: ['INTELLIGENCE WATCHING', 'OVER YOU'],
  },
  {
    lines: ['SMARTER EYES', 'THAT PROTECT'],
  },
];

type RotatorState = {
  active: number;
  previous: number | null;
};

interface HeroProps {
  onGetStarted?: () => void;
  onDetect?: () => void;
  detectDisabled?: boolean;
}

function ElectricHero({ onGetStarted, onDetect, detectDisabled }: HeroProps) {
  const particlesRef = useRef<HTMLDivElement | null>(null);
  const [rotatorState, setRotatorState] = useState<RotatorState>({
    active: 0,
    previous: null,
  });

  // Rotate hero text
  useEffect(() => {
    const interval = window.setInterval(() => {
      setRotatorState((prev) => {
        const nextIndex = (prev.active + 1) % ROTATOR_CONTENT.length;
        return {
          active: nextIndex,
          previous: prev.active,
        };
      });
    }, 5000);

    return () => window.clearInterval(interval);
  }, []);

  // Create floating particles
  useEffect(() => {
    const container = particlesRef.current;
    if (!container) {
      return;
    }

    const particles: HTMLDivElement[] = [];
    const particleCount = 30;

    for (let i = 0; i < particleCount; i += 1) {
      const particle = document.createElement('div');
      particle.className = 'particle';
      particle.style.left = `${Math.random() * 100}%`;
      particle.style.animationDelay = `${Math.random() * 15}s`;
      particle.style.animationDuration = `${Math.random() * 10 + 15}s`;

      if (Math.random() > 0.5) {
        particle.dataset.colorVariant = 'blue';
      }

      container.appendChild(particle);
      particles.push(particle);
    }

    return () => {
      particles.forEach((particle) => {
        container.removeChild(particle);
      });
    };
  }, []);

  // Menu toggle, smooth scroll, and active link handling
  useEffect(() => {
    const menuToggle = document.getElementById('menuToggle');
    const navLinks = document.getElementById('navLinks');
    const navbar = document.getElementById('navbar');
    if (!menuToggle || !navLinks || !navbar) {
      return undefined;
    }

    const linkElements = Array.from(
      navLinks.querySelectorAll<HTMLAnchorElement>('a'),
    );

    const handleToggle = () => {
      menuToggle.classList.toggle('active');
      navLinks.classList.toggle('active');
    };

    const handleLinkClick = (event: Event) => {
      event.preventDefault();
      const target = event.currentTarget as HTMLAnchorElement;
      const href = target.getAttribute('href');
      if (href && href.startsWith('#')) {
        const section = document.querySelector<HTMLElement>(href);
        section?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      menuToggle.classList.remove('active');
      navLinks.classList.remove('active');
    };

    const sectionIds = ['home', 'detector'];

    const handleScroll = () => {
      if (window.scrollY > 50) {
        navbar.classList.add('scrolled');
      } else {
        navbar.classList.remove('scrolled');
      }

      const scrollPosition = window.scrollY + 120;
      linkElements.forEach((link) => link.classList.remove('active'));

      sectionIds.forEach((sectionId) => {
        const section = document.getElementById(sectionId);
        if (!section) {
          return;
        }
        const sectionTop = section.offsetTop;
        const sectionHeight = section.offsetHeight;

        if (
          scrollPosition >= sectionTop &&
          scrollPosition < sectionTop + sectionHeight
        ) {
          linkElements.forEach((link) => {
            if (link.hash === `#${sectionId}`) {
              link.classList.add('active');
            }
          });
        }
      });
    };

    menuToggle.addEventListener('click', handleToggle);
    linkElements.forEach((link) =>
      link.addEventListener('click', handleLinkClick),
    );
    window.addEventListener('scroll', handleScroll);

    // Initialize state
    handleScroll();

    return () => {
      menuToggle.removeEventListener('click', handleToggle);
      linkElements.forEach((link) =>
        link.removeEventListener('click', handleLinkClick),
      );
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <>
      <div className="grid-bg" />
      <div className="gradient-overlay" />
      <div className="scanlines" />

      <div className="shapes-container">
        <div className="shape shape-circle" />
        <div className="shape shape-triangle" />
        <div className="shape shape-square" />
      </div>

      <div id="particles" ref={particlesRef} />

      <nav id="navbar">
        <div className="nav-container">
          <span className="logo-text">SafrSight</span>
          <div className="menu-toggle" id="menuToggle">
            <span />
            <span />
            <span />
          </div>
        </div>
      </nav>

      <section className="hero" id="home">
        <div className="hero-content">
          <div className="text-rotator">
            {ROTATOR_CONTENT.map((item, index) => {
              const isActive = index === rotatorState.active;
              const isLeaving = index === rotatorState.previous;
              const classes = ['text-set'];
              if (isActive) {
                classes.push('active');
              }
              if (isLeaving) {
                classes.push('leaving');
              }
              let charCounter = 0;
              return (
                <div
                  className={classes.join(' ')}
                  key={item.lines.join('-')}
                >
                  <h1
                    className="glitch-text"
                    data-text={item.lines.join('\n')}
                  >
                    {item.lines.map((line, lineIndex) => (
                      <span className="line" key={`${lineIndex}-${line}`}>
                        {Array.from(line).map((char, charIndex) => {
                          const currentIndex = charCounter;
                          charCounter += 1;
                          return (
                            <span
                              key={`${lineIndex}-${charIndex}`}
                              className="char"
                              style={{
                                ['--char-index' as any]: `${currentIndex}`,
                              }}
                            >
                              {char === ' ' ? '\u00A0' : char}
                            </span>
                          );
                        })}
                      </span>
                    ))}
                  </h1>
                </div>
              );
            })}
          </div>
          <p className="subtitle visible">Choose a video and see what SafrSight sees.</p>
        </div>
        <div className="cta-container">
          <a
            href="#detector"
            className="cta-button cta-primary"
            onClick={(event) => {
              if (onGetStarted) {
                event.preventDefault();
                onGetStarted();
              }
            }}
          >
            Get Started
          </a>
          <a
            href="#detector"
            className={`cta-button cta-secondary ${
              detectDisabled ? 'disabled' : 'active'
            }`}
            aria-disabled={detectDisabled}
            onClick={(event) => {
              if (detectDisabled) {
                event.preventDefault();
                return;
              }
              if (onDetect) {
                event.preventDefault();
                onDetect();
              }
            }}
          >
            Detect
          </a>
        </div>
      </section>
    </>
  );
}

export default ElectricHero;

