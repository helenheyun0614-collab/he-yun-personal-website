'use client';

import { useEffect, useRef } from 'react';

export default function BackgroundAtmosphere() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 呼吸光晕效果
    const glows = containerRef.current?.querySelectorAll('.atmosphere-glow');
    glows?.forEach((glow, index) => {
      (glow as HTMLElement).style.animationDelay = `${index * 1.5}s`;
    });
  }, []);

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 pointer-events-none overflow-hidden z-0"
      aria-hidden="true"
    >
      {/* 网格背景 */}
      <div 
        className="absolute inset-0 opacity-[0.015]"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(127, 231, 196, 0.5) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(127, 231, 196, 0.5) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
          maskImage: 'radial-gradient(ellipse 80% 50% at 50% 0%, black 0%, transparent 100%)',
        }}
      />
      
      {/* 呼吸光晕 - 左上 */}
      <div 
        className="atmosphere-glow absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(127, 231, 196, 0.08) 0%, transparent 70%)',
          animation: 'breathGlow 6s ease-in-out infinite',
        }}
      />
      
      {/* 呼吸光晕 - 右下 */}
      <div 
        className="atmosphere-glow absolute -bottom-40 -right-40 w-[600px] h-[600px] rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(139, 233, 253, 0.06) 0%, transparent 70%)',
          animation: 'breathGlow 8s ease-in-out infinite',
          animationDelay: '2s',
        }}
      />
      
      {/* 呼吸光晕 - 中间偏上 */}
      <div 
        className="atmosphere-glow absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full"
        style={{
          background: 'radial-gradient(ellipse, rgba(127, 231, 196, 0.05) 0%, transparent 60%)',
          animation: 'breathGlow 10s ease-in-out infinite',
          animationDelay: '4s',
        }}
      />

      {/* 微粒子 */}
      {[...Array(20)].map((_, i) => (
        <div
          key={i}
          className="absolute w-1 h-1 rounded-full"
          style={{
            background: 'rgba(127, 231, 196, 0.3)',
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animation: `float ${8 + Math.random() * 4}s ease-in-out infinite`,
            animationDelay: `${Math.random() * 5}s`,
          }}
        />
      ))}
    </div>
  );
}
