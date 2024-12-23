"use client";

import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  const asciiArt = `
██████╗ ██████╗ ██╗   ██╗██╗██████╗      █████╗ ██╗
██╔══██╗██╔══██╗██║   ██║██║██╔══██╗    ██╔══██╗██║
██║  ██║██████╔╝██║   ██║██║██║  ██║    ███████║██║
██║  ██║██╔══██╗██║   ██║██║██║  ██║    ██╔══██║██║
██████╔╝██║  ██║╚█████╔╝ ██║██████╔╝    ██║  ██║██║
╚═════╝ ╚═╝  ╚═╝ ╚════╝ ╚═╝╚═════╝      ╚═╝  ╚═╝╚═╝`;

  const handleClick = () => {
    router.push('/main');
  };

  return (
    <main 
      className="min-h-screen flex flex-col items-center justify-center cursor-pointer"
      onClick={handleClick}
    >
      <pre className="text-[0.6em] sm:text-[0.8em] md:text-[1em] whitespace-pre text-center leading-none opacity-90">
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
      <span className="mt-2">[ ENTER ]</span>
    </main>
  );
}
