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
      let lastPointerDrop = -Infinity, occupied = [];
      function addDrop(x, y, now, duration) {
        occupied = occupied.filter(point => point.until > now);
        // Reserve the entire watercolor bloom until it has faded, including drops in flight.
        if (occupied.some(point => Math.hypot((x - point.x) * width, (y - point.y) * height / .48) < 175)) return false;
        occupied.push({x, y, until: now + duration + 4600});
        drops.push({x, y, born: now, duration});
        return true;
      }
      function interact(event) {
        if (stopped || media.matches || document.hidden || !width || !height) return;
        const now = performance.now();
        const rect = host.getBoundingClientRect();
        const x = (event.clientX - rect.left) / width, y = (event.clientY - rect.top) / height;
        if (x < 0 || x > 1 || y < 0 || y > 1) return;
        if (now - lastPointerDrop < 550) return;
        if (addDrop(x, y, now, 1500)) lastPointerDrop = now;
      }
      for (const event of ['pointermove', 'pointerdown', 'wheel']) document.addEventListener(event, interact, {passive: true});
      function draw(now) {
        if (stopped || media.matches || document.hidden) return;
        frame = requestAnimationFrame(draw);
        if (now - previous < 1000 / 24) return;
        previous = now; ctx.clearRect(0, 0, width, height);
        if (now >= nextDrop && width && height) {
          for (let attempt = 0; attempt < 6; attempt++) {
            if (addDrop(.08 + Math.random() * .84, .2 + Math.random() * .68, now, 1800 + Math.random() * 600)) break;
          }
          nextDrop = now + 8000 + Math.random() * 6000;
        }
        drops = drops.filter(drop => {
          const age = (now - drop.born) / drop.duration;
          const x = drop.x * width, targetY = drop.y * height;
          if (age >= 1) { rings.push({x: drop.x, y: drop.y, born: now, radius: 42 + Math.random() * 32, pigment: [[164, 145, 105], [137, 153, 141], [146, 160, 166]][Math.floor(Math.random() * 3)]}); rings = rings.slice(-7); return false; }
          const y = targetY - (1 - age) * 110;
          // A diffused bead of water: no pointed streak or directional tail.
          const opacity = Math.min(1, age * 5) * .3;
          const bead = ctx.createRadialGradient(x - .5, y - .6, .2, x, y, 4.5);
          bead.addColorStop(0, `rgba(255,253,241,${opacity * 1.3})`);
          bead.addColorStop(.38, `rgba(154,164,149,${opacity})`);
          bead.addColorStop(1, 'rgba(154,164,149,0)');
          ctx.fillStyle = bead; ctx.beginPath(); ctx.arc(x, y, 4.5, 0, Math.PI * 2); ctx.fill();
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
        cancelAnimationFrame(frame); drops = []; rings = []; occupied = []; previous = 0; nextDrop = 0;
        ctx.clearRect(0, 0, width, height);
        if (!media.matches && !document.hidden && !stopped) frame = requestAnimationFrame(draw);
      }
      media.addEventListener('change', sync); document.addEventListener('visibilitychange', sync);
      dispose = () => { stopped = true; cancelAnimationFrame(frame); observer.disconnect(); cancelAnimationFrame(resizeFrame); media.removeEventListener('change', sync); document.removeEventListener('visibilitychange', sync); for (const event of ['pointermove', 'pointerdown', 'wheel']) document.removeEventListener(event, interact); canvas.remove(); };
      sync();
    }
  };
})();
