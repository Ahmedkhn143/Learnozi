import { useEffect, useRef } from 'react';
import './CaptchaInput.css';

/**
 * Generate an unambiguous 5-character captcha code
 */
export function generateCaptchaCode() {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let result = '';
  for (let i = 0; i < 5; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export default function CaptchaInput({
  value,
  onChange,
  captchaCode,
  onRefresh,
  error,
  label = 'Security Verification',
  placeholder = 'Enter 5-character code',
}) {
  const canvasRef = useRef(null);

  // Draw captcha with distortion and noise on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !captchaCode) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    // Background gradient
    const bgGradient = ctx.createLinearGradient(0, 0, width, height);
    bgGradient.addColorStop(0, '#0f172a');
    bgGradient.addColorStop(1, '#1e1b4b');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, width, height);

    // Random background noise lines
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 4; i++) {
      ctx.strokeStyle = `hsla(${Math.random() * 360}, 70%, 65%, 0.35)`;
      ctx.beginPath();
      ctx.moveTo(Math.random() * width, Math.random() * height);
      ctx.bezierCurveTo(
        Math.random() * width, Math.random() * height,
        Math.random() * width, Math.random() * height,
        Math.random() * width, Math.random() * height
      );
      ctx.stroke();
    }

    // Random noise dots
    for (let i = 0; i < 30; i++) {
      ctx.fillStyle = `rgba(255, 255, 255, ${Math.random() * 0.25})`;
      ctx.beginPath();
      ctx.arc(Math.random() * width, Math.random() * height, Math.random() * 1.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw characters with distinct colors, font sizes, and rotation
    const chars = captchaCode.split('');
    const charSpacing = width / (chars.length + 1);

    chars.forEach((char, index) => {
      ctx.save();
      const x = charSpacing * (index + 0.85);
      const y = height / 2 + (Math.random() * 6 - 3);

      ctx.translate(x, y);
      // Random tilt between -22 and +22 degrees
      const angle = (Math.random() * 44 - 22) * (Math.PI / 180);
      ctx.rotate(angle);

      // Vibrant distinct font colors
      const colors = ['#38bdf8', '#818cf8', '#a78bfa', '#34d399', '#fbbf24', '#f472b6'];
      ctx.fillStyle = colors[index % colors.length];
      ctx.font = 'bold 24px "Courier New", monospace, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
      ctx.shadowBlur = 4;
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 2;

      ctx.fillText(char, 0, 0);
      ctx.restore();
    });
  }, [captchaCode]);

  return (
    <div className="captcha-group">
      <label className="form-3d-label captcha-label">
        <span>🛡️ {label}</span>
      </label>

      <div className="captcha-container">
        {/* Canvas Display */}
        <div className="captcha-visual-badge">
          <canvas
            ref={canvasRef}
            width={140}
            height={44}
            className="captcha-canvas"
            title="Captcha Verification Code"
          />
          <button
            type="button"
            className="captcha-refresh-btn"
            onClick={onRefresh}
            title="Reload new captcha"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/>
            </svg>
          </button>
        </div>

        {/* User Input */}
        <div className="captcha-input-wrapper">
          <input
            type="text"
            className={`input-3d-field captcha-input ${error ? 'input-error' : ''}`}
            placeholder={placeholder}
            maxLength={6}
            value={value}
            onChange={(e) => onChange(e.target.value.toUpperCase())}
            autoComplete="off"
            spellCheck="false"
            required
          />
        </div>
      </div>
      {error && <span className="captcha-error-text">⚠️ {error}</span>}
    </div>
  );
}
