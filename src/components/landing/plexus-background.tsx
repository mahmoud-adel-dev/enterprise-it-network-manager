'use client';

import { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  baseRadius: number;
  color: string;
  isHub?: boolean;
}

export function PlexusBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || window.innerWidth);
    let height = (canvas.height = canvas.parentElement?.clientHeight || 700);

    const handleResize = () => {
      if (!canvas || !canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = canvas.parentElement.clientHeight;
    };

    window.addEventListener('resize', handleResize);

    // Color palette tailored for enterprise network themes (Indigo, Cyan, Emerald, Slate)
    const colors = [
      'rgba(99, 102, 241, 0.7)',  // Indigo
      'rgba(14, 165, 233, 0.7)',  // Sky
      'rgba(16, 185, 129, 0.65)', // Emerald
      'rgba(168, 85, 247, 0.6)',  // Purple
    ];

    // Determine particle count based on screen width
    const particleCount = Math.min(Math.floor(width / 18), 75);
    const maxDistance = 140;

    const particles: Particle[] = [];

    for (let i = 0; i < particleCount; i++) {
      const isHub = i % 12 === 0;
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.45,
        vy: (Math.random() - 0.5) * 0.45,
        radius: isHub ? 3.5 : Math.random() * 1.8 + 1,
        baseRadius: isHub ? 3.5 : Math.random() * 1.8 + 1,
        color: colors[Math.floor(Math.random() * colors.length)],
        isHub,
      });
    }

    // Mouse interactivity
    const mouse = { x: -1000, y: -1000, maxRadius: 180 };

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    };

    const handleMouseLeave = () => {
      mouse.x = -1000;
      mouse.y = -1000;
    };

    const container = canvas.parentElement;
    if (container) {
      container.addEventListener('mousemove', handleMouseMove);
      container.addEventListener('mouseleave', handleMouseLeave);
    }

    // Animation Loop
    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // 1. Draw connecting lines between particles
      for (let i = 0; i < particles.length; i++) {
        const p1 = particles[i];

        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < maxDistance) {
            const alpha = (1 - dist / maxDistance) * 0.28;
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(99, 102, 241, ${alpha})`;
            ctx.lineWidth = p1.isHub || p2.isHub ? 1.2 : 0.75;
            ctx.stroke();

            // Fill subtle triangle meshes if 3 nodes are close
            for (let k = j + 1; k < particles.length; k++) {
              const p3 = particles[k];
              const d2 = Math.hypot(p2.x - p3.x, p2.y - p3.y);
              const d3 = Math.hypot(p1.x - p3.x, p1.y - p3.y);

              if (d2 < maxDistance && d3 < maxDistance) {
                const polyAlpha = (1 - Math.max(dist, d2, d3) / maxDistance) * 0.04;
                ctx.beginPath();
                ctx.moveTo(p1.x, p1.y);
                ctx.lineTo(p2.x, p2.y);
                ctx.lineTo(p3.x, p3.y);
                ctx.closePath();
                ctx.fillStyle = `rgba(99, 102, 241, ${polyAlpha})`;
                ctx.fill();
              }
            }
          }
        }

        // Connect particles to mouse cursor if within range
        const mdx = p1.x - mouse.x;
        const mdy = p1.y - mouse.y;
        const mdist = Math.sqrt(mdx * mdx + mdy * mdy);
        if (mdist < mouse.maxRadius) {
          const mAlpha = (1 - mdist / mouse.maxRadius) * 0.45;
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(mouse.x, mouse.y);
          ctx.strokeStyle = `rgba(14, 165, 233, ${mAlpha})`;
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }

      // 2. Draw nodes/particles
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // Move particle
        p.x += p.vx;
        p.y += p.vy;

        // Bounce on boundaries
        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;

        // Draw node
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();

        // If it's a hub node, draw outer glowing ring
        if (p.isHub) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius + 3.5, 0, Math.PI * 2);
          ctx.strokeStyle = 'rgba(99, 102, 241, 0.35)';
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      if (container) {
        container.removeEventListener('mousemove', handleMouseMove);
        container.removeEventListener('mouseleave', handleMouseLeave);
      }
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none z-0 opacity-80 dark:opacity-90 transition-opacity"
      style={{ width: '100%', height: '100%' }}
    />
  );
}
