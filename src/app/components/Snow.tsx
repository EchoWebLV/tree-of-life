'use client';

import { useEffect } from 'react';

export default function Snow() {
  useEffect(() => {
    const createSnowflake = () => {
      const snowflake = document.createElement('div');
      snowflake.classList.add('snowflake');

      // Random starting position
      snowflake.style.left = Math.random() * 100 + 'vw';
      snowflake.style.animationDuration = Math.random() * 3 + 3 + 's'; // Between 3-6s
      snowflake.style.opacity = (Math.random() * 0.4 + 0.6).toString(); // Between 0.6 and 1
      snowflake.style.transform = `scale(${Math.random() * 1 + 0.5})`; // Between 0.5 and 1.5
      
      document.body.appendChild(snowflake);
      
      // Remove snowflake after animation
      const duration = parseFloat(snowflake.style.animationDuration) * 1000;
      setTimeout(() => {
        snowflake.remove();
      }, duration);
    };

    // Create snowflakes more frequently (every 50ms instead of 100ms)
    const snowInterval = setInterval(createSnowflake, 50);

    return () => clearInterval(snowInterval);
  }, []);

  return null;
}
