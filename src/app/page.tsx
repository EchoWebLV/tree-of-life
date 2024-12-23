"use client";

import { useRouter } from 'next/navigation';
import Logo from './components/Logo';

export default function Home() {
  const router = useRouter();

  const handleClick = () => {
    router.push('/main');
  };

  return (
    <main 
      className="min-h-screen flex flex-col items-center justify-center cursor-pointer"
      onClick={handleClick}
    >
      <Logo />
      <span className="mt-2">[ ENTER ]</span>
    </main>
  );
}
