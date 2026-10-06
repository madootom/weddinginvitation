/* No DOM particle swarm: one disposable canvas, bounded work, no continuous idle loop. */
(() => {
  let active;
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  window.InvitationEffects = {
    cancel() { active?.(); },
    reveal(gate, done) {
      if (active) return;
      if (!gate || motion.matches || document.documentElement?.classList.contains('motion-paused')) { done(); return; }
      const canvas = document.createElement('canvas');
      canvas.className = 'origami-canvas'; canvas.setAttribute('aria-hidden', 'true');
      const rect = gate.getBoundingClientRect();
      const width = innerWidth, height = innerHeight;
      const ratio = Math.min(devicePixelRatio || 1, 1.5);
      canvas.width = width * ratio; canvas.height = height * ratio;
      const ctx = canvas.getContext('2d');
      if (!ctx) { done(); return; }
      ctx.scale(ratio, ratio);
      // Dense paper flocks on desktop; small mobile/low-memory devices get a lighter reveal.
      const low = (navigator.deviceMemory || 8) <= 4 || (navigator.hardwareConcurrency || 8) <= 4;
      const count = low ? 160 : width < 600 ? 340 : 1200;
      const particles = Array.from({ length: count }, (_, i) => ({
        x: rect.left + Math.random() * rect.width, y: rect.top + Math.random() * rect.height,
        vx: (Math.random() - .5) * width * 1.1, vy: -height * (.3 + Math.random() * .85),
        size: 2 + Math.random() * (i % 7 === 0 ? 12 : 5), phase: Math.random() * Math.PI * 2,
        turn: (Math.random() - .5) * 3, delay: Math.random() * .3,
        color: ['#c5ad7d', '#e1d3b3', '#fffaf0', '#d4c5a5'][i % 4]
      }));
      let frame, ended = false, start;
      const finish = () => {
        if (ended) return; ended = true; cancelAnimationFrame(frame); clearTimeout(fallback);
        canvas.remove(); motion.removeEventListener('change', finish);
        document.removeEventListener('visibilitychange', visibility); active = null; done();
      };
      const visibility = () => { if (document.hidden) finish(); };
      const fallback = setTimeout(finish, 3400);
      active = finish; motion.addEventListener('change', finish);
      document.addEventListener('visibilitychange', visibility);
      gate.querySelectorAll('button,input').forEach(el => { el.disabled = true; });
      gate.classList.add('is-unfolding'); document.body.append(canvas);
      function draw(now) {
        start ??= now;
        const elapsed = (now - start) / 2500;
        ctx.clearRect(0, 0, width, height);
        for (const p of particles) {
          const t = Math.max(0, elapsed - p.delay); if (!t) continue;
          ctx.save(); ctx.globalAlpha = Math.min(1, t * 12) * Math.max(0, 1 - t);
          ctx.translate(p.x + p.vx * t + Math.sin(t * 5 + p.phase) * 24, p.y + p.vy * t);
          ctx.rotate(p.turn * t + Math.sin(p.phase) * .4);
          const wing = p.size * (.25 + Math.abs(Math.sin(t * 5 + p.phase)) * .75);
          ctx.fillStyle = p.color;
          ctx.beginPath(); ctx.moveTo(0, 0);
          ctx.bezierCurveTo(-wing * .8, -p.size * 1.7, -wing * 1.8, -p.size * 1.1, -wing, 0);
          ctx.bezierCurveTo(-wing * 1.5, p.size, -wing * .3, p.size * 1.25, 0, p.size * .2);
          ctx.bezierCurveTo(wing * .3, p.size * 1.25, wing * 1.5, p.size, wing, 0);
          ctx.bezierCurveTo(wing * 1.8, -p.size * 1.1, wing * .8, -p.size * 1.7, 0, 0);
          ctx.fill(); ctx.strokeStyle = '#ac936455'; ctx.lineWidth = .4; ctx.stroke();
          ctx.beginPath(); ctx.moveTo(0, -p.size * .3); ctx.lineTo(0, p.size * .45); ctx.stroke(); ctx.restore();
        }
        if (elapsed >= 1.25) finish(); else frame = requestAnimationFrame(draw);
      }
      frame = requestAnimationFrame(draw);
    }
  };
  // Autoplay is a best effort; browser-blocked audio resumes on the first trusted gesture.
  let audio, pending = false, generation = 0, updateState = () => {}, muted = false;
  const attempt = event => { if (!muted) window.InvitationMusic.play(updateState); };
  const syncVisibility = () => {
    document.documentElement.classList.toggle('page-away', document.hidden);
    if (document.hidden) { generation++; pending = false; audio?.pause(); updateState(false); }
    else if (!muted) attempt();
  };
  window.InvitationMusic = {
    init(update) {
      updateState = update;
      muted = false; // Visible controls were removed; old saved mute settings do not apply.
      document.addEventListener('pointerdown', attempt);
      document.addEventListener('keydown', attempt);
      document.addEventListener('visibilitychange', syncVisibility);
      if (!muted) this.play(update);
    },
    isPlaying() { return pending || !!audio && !audio.paused; },
    async play(update = updateState) {
      if (pending || audio && !audio.paused) return;
      muted = false;
      if (!audio) { audio = new Audio(); audio.preload = 'none'; audio.src = '/assets/canon-in-d-for-two-harps.m4a'; audio.loop = true; }
      audio.volume = .22;
      const token = ++generation; pending = true;
      try {
        await audio.play();
        if (token === generation) { update(true); }
      } catch { if (token === generation) update(false); }
      finally { if (token === generation) pending = false; }
    },
    pause() { muted = true; generation++; pending = false; audio?.pause(); updateState(false); },
    destroy() {
      generation++; pending = false; audio?.pause();
      document.removeEventListener('pointerdown', attempt); document.removeEventListener('keydown', attempt);
      document.removeEventListener('visibilitychange', syncVisibility);
    }
  };
})();
