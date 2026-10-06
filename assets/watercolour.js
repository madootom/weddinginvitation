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
      const observer = new ResizeObserver(resize); observer.observe(host); resize();
      let lastPointerDrop = -Infinity, lastPointerPosition = null;
      function interact(event) {
        if (stopped || media.matches || document.hidden || !width || !height) return;
        const now = performance.now();
        const rect = host.getBoundingClientRect();
        const x = (event.clientX - rect.left) / width, y = (event.clientY - rect.top) / height;
        if (x < 0 || x > 1 || y < 0 || y > 1) return;
        const closeBy = lastPointerPosition && Math.hypot(event.clientX - lastPointerPosition.x, event.clientY - lastPointerPosition.y) < 24;
        // Tiny pointer jitter and repeated scroll events should feel like a quiet pool.
        const delay = closeBy ? 1200 : event.type === 'pointerdown' ? 80 : 160;
        if (now - lastPointerDrop < delay) return;
        lastPointerDrop = now; lastPointerPosition = {x: event.clientX, y: event.clientY}; nextDrop = now + 1800;
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
          drops = drops.slice(-4); nextDrop = now + 1000 + Math.random() * 1300;
        }
        drops = drops.filter(drop => {
          const age = (now - drop.born) / drop.duration;
          const x = drop.x * width, targetY = drop.y * height;
          if (age >= 1) { rings.push({x: drop.x, y: drop.y, born: now, radius: 38 + Math.random() * 40}); rings = rings.slice(-7); return false; }
          const y = targetY - (1 - age) * (1 - age) * 105;
          const gradient = ctx.createLinearGradient(x, y - 17, x, y + 3);
          gradient.addColorStop(0, 'rgba(150,157,151,0)'); gradient.addColorStop(1, 'rgba(145,139,113,.27)');
          ctx.strokeStyle = gradient; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x, y - 17); ctx.lineTo(x, y); ctx.stroke();
          return true;
        });
        rings = rings.filter(ring => {
          const age = (now - ring.born) / 4600;
          if (age >= 1) return false;
          for (let i = 0; i < 3; i++) {
            const t = age - i * .11; if (t <= 0) continue;
            const radius = 3 + ring.radius * (1 - Math.pow(1 - t, 2));
            const alpha = Math.sin(Math.min(1, t * 6) * Math.PI / 2) * Math.pow(1 - t, 2) * (.19 - i * .035);
            ctx.strokeStyle = `rgba(142,137,108,${alpha})`; ctx.lineWidth = .75;
            ctx.beginPath(); ctx.ellipse(ring.x * width, ring.y * height, radius, radius * .48, 0, 0, Math.PI * 2); ctx.stroke();
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
      dispose = () => { stopped = true; cancelAnimationFrame(frame); observer.disconnect(); media.removeEventListener('change', sync); document.removeEventListener('visibilitychange', sync); for (const event of ['pointermove', 'pointerdown', 'wheel']) document.removeEventListener(event, interact); canvas.remove(); };
      sync();
    }
  };
})();
