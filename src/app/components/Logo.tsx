import React from 'react';

interface LogoProps {
  className?: string;
}

export default function Logo({ className = '' }: LogoProps) {
  const asciiArt = `
██████╗ ██████╗ ██╗   ██╗██╗██████╗      █████╗ ██╗
██╔══██╗██╔══██╗██║   ██║██║██╔══██╗    ██╔══██╗██║
██║  ██║██████╔╝██║   ██║██║██║  ██║    ███████║██║
██║  ██║██╔══██╗██║   ██║██║██║  ██║    ██╔══██║██║
██████╔╝██║  ██║╚█████╔╝ ██║██████╔╝    ██║  ██║██║
╚═════╝ ╚═╝  ╚═╝ ╚════╝ ╚═╝╚═════╝      ╚═╝  ╚═╝╚═╝`;

  return (
    <pre className={`text-[0.6em] sm:text-[0.8em] md:text-[1em] whitespace-pre text-center leading-none opacity-90 overflow-hidden ${className}`}>
      {asciiArt.split('\n').map((line, lineIndex) => (
        <span key={lineIndex}>
          {line.split('').map((char, charIndex) => (
            <span key={`${lineIndex}-${charIndex}`} className="animated-char">
              {char}
            </span>
          ))}
          {lineIndex < asciiArt.split('\n').length - 1 ? '\n' : ''}
        </span>
      ))}
    </pre>
  );
}
