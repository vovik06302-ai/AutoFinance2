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
  const { themeConfig, bgMode, animateBackground } = useAppTheme();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const canAnimate = animateBackground && !prefersReducedMotion;

    let animFrameId: number | null = null;
    let isHolding = false;
    let currentSpeed = 0;
    let targetSpeed = 0;
    let isLoopRunning = false;

    const numStars = bgMode === 'STARFIELD' ? 180 : 0;
    const maxZ = 1000;
    const fov = 250;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

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

    const renderFrame = () => {
      if (!ctx) return;

      if (bgMode === 'LIGHT') {
        // Light clean daytime background
        const lightGrad = ctx.createLinearGradient(0, 0, 0, height);
        lightGrad.addColorStop(0, '#f8fafc');
        lightGrad.addColorStop(1, '#e2e8f0');
        ctx.fillStyle = lightGrad;
        ctx.fillRect(0, 0, width, height);

        // Subtle accent aura at top right
        const aura = ctx.createRadialGradient(
          width * 0.8,
          height * 0.15,
          40,
          width * 0.8,
          height * 0.15,
          width * 0.6
        );
        aura.addColorStop(0, `${themeConfig.primaryHex}18`);
        aura.addColorStop(1, 'transparent');
        ctx.fillStyle = aura;
        ctx.fillRect(0, 0, width, height);
        return;
      }

      if (bgMode === 'DARK') {
        // Deep matte carbon/graphite background
        const darkGrad = ctx.createLinearGradient(0, 0, 0, height);
        darkGrad.addColorStop(0, '#0f172a');
        darkGrad.addColorStop(1, '#020617');
        ctx.fillStyle = darkGrad;
        ctx.fillRect(0, 0, width, height);

        // Soft ambient radial glow with theme color
        const glow = ctx.createRadialGradient(
          width / 2,
          height * 0.35,
          60,
          width / 2,
          height * 0.35,
          width * 0.8
        );
        glow.addColorStop(0, `${themeConfig.primaryHex}1A`);
        glow.addColorStop(1, 'transparent');
        ctx.fillStyle = glow;
        ctx.fillRect(0, 0, width, height);
        return;
      }

      // STARFIELD MODE
      ctx.fillStyle = '#090d16';
      ctx.fillRect(0, 0, width, height);

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

        star.pz = star.z;
        star.z -= currentSpeed;

        if (star.z <= 1) {
          star.z = maxZ;
          star.pz = maxZ;
          star.x = (Math.random() - 0.5) * width * 2;
          star.y = (Math.random() - 0.5) * height * 2;
        }

        const k = fov / star.z;
        const px = star.x * k + cx;
        const py = star.y * k + cy;

        if (px < -20 || px > width + 20 || py < -20 || py > height + 20) {
          continue;
        }

        star.twinklePhase += star.twinkleSpeed;
        const twinkleAlpha = star.alpha * (0.8 + 0.2 * Math.sin(star.twinklePhase));

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
          ctx.beginPath();
          ctx.arc(px, py, star.size * (1 - star.z / maxZ) * 1.5 + 0.5, 0, Math.PI * 2);
          ctx.fillStyle = star.color;
          ctx.globalAlpha = twinkleAlpha;
          ctx.fill();
          ctx.globalAlpha = 1.0;
        }
      }
    };

    // Animation loop (only for STARFIELD when canAnimate is true)
    const tick = () => {
      currentSpeed += (targetSpeed - currentSpeed) * 0.12;

      if (!isHolding && currentSpeed < 0.05) {
        currentSpeed = 0;
        renderFrame();
        isLoopRunning = false;
        animFrameId = null;
        return;
      }

      renderFrame();
      animFrameId = requestAnimationFrame(tick);
    };

    const startLoop = () => {
      if (!isLoopRunning && !document.hidden && canAnimate && bgMode === 'STARFIELD') {
        isLoopRunning = true;
        animFrameId = requestAnimationFrame(tick);
      }
    };

    const isInteractive = (target: EventTarget | null): boolean => {
      if (!target || !(target instanceof HTMLElement)) return false;
      return !!target.closest(
        'button, [role="button"], a, input[type="button"], input[type="submit"], select'
      );
    };

    const handlePointerDown = (e: PointerEvent) => {
      if (!canAnimate || bgMode !== 'STARFIELD') return;
      if (isInteractive(e.target)) {
        isHolding = true;
        targetSpeed = 16.0;
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
  }, [themeConfig, bgMode, animateBackground]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none z-[-10]"
      style={{
        background: bgMode === 'LIGHT' ? '#f8fafc' : bgMode === 'DARK' ? '#0f172a' : '#090d16'
      }}
    />
  );
};
