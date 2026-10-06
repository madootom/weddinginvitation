/* Quiet, spatially connected drops and ripples. One canvas, bounded particles, 24 fps. */
(() => {
  let dispose;
  window.InvitationAtmosphere = {
    stop() { dispose?.(); dispose = null; },
    start() {
      this.stop();
      const host = document.querySelector('.rain-garden');
      if (!host) return;
      const media = matchMedia('(prefers-reduced-motion: reduce)');
      const canvas = document.createElement('canvas');
      canvas.setAttribute('aria-hidden', 'true'); host.append(canvas);
      const ctx = canvas.getContext('2d');
      if (!ctx) { canvas.remove(); return; }
      let width = 0, height = 0, frame = 0, previous = 0, nextDrop = 0, drops = [], rings = [], stopped = false;
      function resize() {
        width = host.clientWidth; height = host.clientHeight;
        const dpr = Math.min(devicePixelRatio || 1, 1.5);
        const pixelWidth = Math.round(width * dpr), pixelHeight = Math.round(height * dpr);
        if (canvas.width !== pixelWidth) canvas.width = pixelWidth;
        if (canvas.height !== pixelHeight) canvas.height = pixelHeight;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      }
      let resizeFrame = 0;
      const observer = new ResizeObserver(() => { cancelAnimationFrame(resizeFrame); resizeFrame = requestAnimationFrame(resize); }); observer.observe(host); resize();
      let lastPointerDrop = -Infinity, lastPointerPosition = null;
      function interact(event) {
        if (stopped || media.matches || document.hidden || !width || !height) return;
        const now = performance.now();
        const rect = host.getBoundingClientRect();
        const x = (event.clientX - rect.left) / width, y = (event.clientY - rect.top) / height;
        if (x < 0 || x > 1 || y < 0 || y > 1) return;
        const closeBy = lastPointerPosition && Math.hypot(event.clientX - lastPointerPosition.x, event.clientY - lastPointerPosition.y) < 24;
        // Tiny pointer jitter and repeated scroll events should feel like a quiet pool.
        const delay = closeBy ? 2200 : 550;
        if (now - lastPointerDrop < delay) return;
        lastPointerDrop = now; lastPointerPosition = {x: event.clientX, y: event.clientY};
        drops.push({x, y, born: now, duration: event.type === 'pointerdown' ? 140 : 260});
        drops = drops.slice(-8);
      }
      for (const event of ['pointermove', 'pointerdown', 'wheel']) document.addEventListener(event, interact, {passive: true});
      function draw(now) {
        if (stopped || media.matches || document.hidden) return;
        frame = requestAnimationFrame(draw);
        if (now - previous < 1000 / 24) return;
        previous = now; ctx.clearRect(0, 0, width, height);
        if (now >= nextDrop && width && height) {
          drops.push({x: .08 + Math.random() * .84, y: .16 + Math.random() * .76, born: now, duration: 650 + Math.random() * 400});
          drops = drops.slice(-4); nextDrop = now + 8000 + Math.random() * 6000;
        }
        drops = drops.filter(drop => {
          const age = (now - drop.born) / drop.duration;
          const x = drop.x * width, targetY = drop.y * height;
          if (age >= 1) { rings.push({x: drop.x, y: drop.y, born: now, radius: 42 + Math.random() * 32, pigment: [[164, 145, 105], [137, 153, 141], [146, 160, 166]][Math.floor(Math.random() * 3)]}); rings = rings.slice(-7); return false; }
          const y = targetY - (1 - age) * (1 - age) * 105;
          const gradient = ctx.createLinearGradient(x, y - 10, x, y + 3);
          gradient.addColorStop(0, 'rgba(150,157,151,0)'); gradient.addColorStop(1, 'rgba(154,147,120,.23)');
          ctx.strokeStyle = gradient; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x, y - 10); ctx.lineTo(x, y); ctx.stroke();
          return true;
        });
        rings = rings.filter(ring => {
          const age = (now - ring.born) / 4600;
          if (age >= 1) return false;
          for (let i = 0; i < 2; i++) {
            const t = age - i * .18; if (t <= 0) continue;
            const radius = 3 + ring.radius * (1 - Math.pow(1 - t, 2));
            const alpha = Math.sin(Math.min(1, t * 6) * Math.PI / 2) * Math.pow(1 - t, 2) * (.19 - i * .035);
            const cx = ring.x * width, cy = ring.y * height;
            // Diluted pigment blooms into the paper, with a soft raised water edge.
            const pigment = ring.pigment.join(',');
            ctx.save(); ctx.translate(cx, cy); ctx.scale(1, .48);
            const wash = ctx.createRadialGradient(0, 0, radius * .2, 0, 0, radius * 1.18);
            wash.addColorStop(0, `rgba(${pigment},0)`);
            wash.addColorStop(.65, `rgba(${pigment},${alpha * .25})`);
            wash.addColorStop(.84, `rgba(${pigment},${alpha * .5})`);
            wash.addColorStop(1, `rgba(${pigment},0)`);
            ctx.fillStyle = wash; ctx.beginPath(); ctx.arc(0, 0, radius * 1.18, 0, Math.PI * 2); ctx.fill(); ctx.restore();
            for (const [offset, thickness, colour] of [[.8, 8, `rgba(${pigment},${alpha * .3})`], [.4, 3.2, `rgba(${pigment},${alpha * .95})`], [-.8, 1.4, `rgba(255,253,239,${alpha * 1.65})`], [0, .6, `rgba(${pigment},${alpha * .45})`]]) {
              ctx.strokeStyle = colour; ctx.lineWidth = thickness;
              ctx.beginPath(); ctx.ellipse(cx, cy + offset, radius, radius * .48, 0, 0, Math.PI * 2); ctx.stroke();
            }
          }
          return true;
        });
      }
      function sync() {
        cancelAnimationFrame(frame); drops = []; rings = []; previous = 0; nextDrop = 0;
        ctx.clearRect(0, 0, width, height);
        if (!media.matches && !document.hidden && !stopped) frame = requestAnimationFrame(draw);
      }
      media.addEventListener('change', sync); document.addEventListener('visibilitychange', sync);
      dispose = () => { stopped = true; cancelAnimationFrame(frame); observer.disconnect(); cancelAnimationFrame(resizeFrame); media.removeEventListener('change', sync); document.removeEventListener('visibilitychange', sync); for (const event of ['pointermove', 'pointerdown', 'wheel']) document.removeEventListener(event, interact); canvas.remove(); };
      sync();
    }
  };
})();
