import React, { useEffect, useRef } from 'react';
import { useAppTheme } from './ThemeContext';

interface Star {
  x: number;
  y: number;
  z: number;
  pz: number;
  size: number;
  alpha: number;
  twinklePhase: number;
  twinkleSpeed: number;
  color: string;
}

export const Starfield: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { themeConfig } = useAppTheme();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Respect reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let animFrameId: number | null = null;
    let isHolding = false;
    let currentSpeed = 0;
    let targetSpeed = 0;
    let isLoopRunning = false;

    const numStars = 180;
    const maxZ = 1000;
    const fov = 250;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Color palette for stars based on theme accent
    const getStarColor = (accentHex: string) => {
      const colors = ['#ffffff', '#f0f9ff', '#e0f2fe', '#bae6fd', accentHex];
      return colors[Math.floor(Math.random() * colors.length)];
    };

    const initStar = (star?: Partial<Star>): Star => {
      return {
        x: (Math.random() - 0.5) * width * 2,
        y: (Math.random() - 0.5) * height * 2,
        z: star?.z ?? Math.random() * maxZ + 1,
        pz: star?.pz ?? maxZ,
        size: Math.random() * 1.5 + 0.8,
        alpha: Math.random() * 0.6 + 0.4,
        twinklePhase: Math.random() * Math.PI * 2,
        twinkleSpeed: Math.random() * 0.03 + 0.01,
        color: getStarColor(themeConfig.primaryHex)
      };
    };

    let stars: Star[] = Array.from({ length: numStars }, () => initStar());

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      stars = Array.from({ length: numStars }, () => initStar());
      renderFrame();
    };

    window.addEventListener('resize', handleResize);

    // Render single frame
    const renderFrame = () => {
      if (!ctx) return;

      // Deep cosmic dark background fill
      ctx.fillStyle = '#090d16';
      ctx.fillRect(0, 0, width, height);

      // Subtle radial glow at center
      const gradient = ctx.createRadialGradient(
        width / 2,
        height / 2,
        50,
        width / 2,
        height / 2,
        Math.max(width, height)
      );
      gradient.addColorStop(0, '#111827');
      gradient.addColorStop(1, '#050810');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      const cx = width / 2;
      const cy = height / 2;

      for (let i = 0; i < stars.length; i++) {
        const star = stars[i];

        // Update star depth during motion
        star.pz = star.z;
        star.z -= currentSpeed;

        // Reset if star moves past camera or out of bounds
        if (star.z <= 1) {
          star.z = maxZ;
          star.pz = maxZ;
          star.x = (Math.random() - 0.5) * width * 2;
          star.y = (Math.random() - 0.5) * height * 2;
        }

        const k = fov / star.z;
        const px = star.x * k + cx;
        const py = star.y * k + cy;

        // Skip if outside viewport
        if (px < -20 || px > width + 20 || py < -20 || py > height + 20) {
          continue;
        }

        // Twinkle factor when idle
        star.twinklePhase += star.twinkleSpeed;
        const twinkleAlpha = star.alpha * (0.8 + 0.2 * Math.sin(star.twinklePhase));

        // Draw star streak during flight vs point when idle
        if (currentSpeed > 0.2) {
          const pk = fov / star.pz;
          const prevPx = star.x * pk + cx;
          const prevPy = star.y * pk + cy;

          const streakAlpha = Math.min(1, (1 - star.z / maxZ) * 1.5 + 0.2);

          ctx.beginPath();
          ctx.moveTo(prevPx, prevPy);
          ctx.lineTo(px, py);
          ctx.strokeStyle = star.color;
          ctx.globalAlpha = streakAlpha;
          ctx.lineWidth = Math.max(0.8, star.size * (1 - star.z / maxZ) * 2.2);
          ctx.stroke();
          ctx.globalAlpha = 1.0;
        } else {
          // Point star when idle
          ctx.beginPath();
          ctx.arc(px, py, star.size * (1 - star.z / maxZ) * 1.5 + 0.5, 0, Math.PI * 2);
          ctx.fillStyle = star.color;
          ctx.globalAlpha = twinkleAlpha;
          ctx.fill();
          ctx.globalAlpha = 1.0;
        }
      }
    };

    // Animation loop
    const tick = () => {
      // Smooth lerp speed transition
      currentSpeed += (targetSpeed - currentSpeed) * 0.12;

      // Stop loop when speed drops below threshold and not holding
      if (!isHolding && currentSpeed < 0.05) {
        currentSpeed = 0;
        renderFrame(); // Final static frame
        isLoopRunning = false;
        animFrameId = null;
        return;
      }

      renderFrame();
      animFrameId = requestAnimationFrame(tick);
    };

    const startLoop = () => {
      if (!isLoopRunning && !document.hidden) {
        isLoopRunning = true;
        animFrameId = requestAnimationFrame(tick);
      }
    };

    // Check if target is an interactive button / link
    const isInteractive = (target: EventTarget | null): boolean => {
      if (!target || !(target instanceof HTMLElement)) return false;
      return !!target.closest(
        'button, [role="button"], a, input[type="button"], input[type="submit"], select'
      );
    };

    const handlePointerDown = (e: PointerEvent) => {
      if (prefersReducedMotion) return;
      if (isInteractive(e.target)) {
        isHolding = true;
        targetSpeed = 16.0; // Warp speed!
        startLoop();
      }
    };

    const handlePointerRelease = () => {
      if (isHolding) {
        isHolding = false;
        targetSpeed = 0.0;
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        isHolding = false;
        targetSpeed = 0.0;
        currentSpeed = 0;
        if (animFrameId) {
          cancelAnimationFrame(animFrameId);
          animFrameId = null;
        }
        isLoopRunning = false;
      } else {
        renderFrame();
      }
    };

    // Document level event delegation
    document.addEventListener('pointerdown', handlePointerDown, { passive: true });
    document.addEventListener('pointerup', handlePointerRelease, { passive: true });
    document.addEventListener('pointercancel', handlePointerRelease, { passive: true });
    document.addEventListener('pointerleave', handlePointerRelease, { passive: true });
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Initial render
    renderFrame();

    return () => {
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('pointerup', handlePointerRelease);
      document.removeEventListener('pointercancel', handlePointerRelease);
      document.removeEventListener('pointerleave', handlePointerRelease);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (animFrameId) {
        cancelAnimationFrame(animFrameId);
      }
    };
  }, [themeConfig]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none z-[-10]"
      style={{ background: '#090d16' }}
    />
  );
};
