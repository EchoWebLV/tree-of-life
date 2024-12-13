'use client';

import { useEffect } from 'react';

export default function Snow() {
  useEffect(() => {
    const createSnowflake = () => {
      const snowflake = document.createElement('div');
      snowflake.classList.add('snowflake');

      // Random starting position
      snowflake.style.left = Math.random() * 100 + 'vw';
      snowflake.style.animationDuration = Math.random() * 3 + 2 + 's'; // Between 2-5s
      snowflake.style.opacity = (Math.random() * 0.6 + 0.4).toString(); // Between 0.4 and 1
      snowflake.style.transform = `scale(${Math.random() * 0.6 + 0.4})`; // Between 0.4 and 1
      
      document.body.appendChild(snowflake);
      
      // Remove snowflake after animation
      const duration = parseFloat(snowflake.style.animationDuration) * 1000;
      setTimeout(() => {
        snowflake.remove();
      }, duration);
    };

    const snowInterval = setInterval(createSnowflake, 100);

    return () => clearInterval(snowInterval);
  }, []);

  return null;
}
