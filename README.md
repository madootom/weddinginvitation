# Ardra & Melvin's invitation

This repository contains an exported HTML bundle, its original embedded assets and runtime, and small local enhancements in `assets/invitation.css` and `assets/invitation.js`. It has no npm dependencies or build step. Vercel's existing root rewrite is unchanged.

## Local preview and validation

Run `python3 -m http.server 4173 --bind 127.0.0.1` and open `/Ardra%20%26%20Melvin%20Wedding%20Invite.html`. Python does not apply Vercel rewrites.

Run `node tests/check.mjs`, `node --check assets/invitation.js`, and `git diff --check`.

For UI testing without live guest data, run `python3 tests/prepare-preview.py`, then serve `/tmp/wedding-preview` on a separate loopback port. That temporary fixture substitutes TEST-ENGAGEMENT, TEST-WEDDING, TEST-BOTH, and TEST-ORGANISER and disables Supabase. Do not deploy the fixture. Browser tests use this fixture for valid password and RSVP flows; live backend writes are intentionally untested.

Use `python3 scripts/template.py extract /tmp/template.html` to edit the component markup/controller, then `python3 scripts/template.py pack /tmp/template.html` to rebuild the bundle. Extracted source retains existing client-side configuration; keep it private. Packing escapes closing script tags and preserves the resource manifest.

## Experience

Responsive layouts tested at 320×568, 390×844, and 1280×900. The ivory-and-gold rounded-wing butterflies take about three seconds to disperse. One transient canvas draws up to 1200 butterflies on desktop, 340 on mobile, or 160 on constrained devices, with capped pixel density. It clears itself after completion, a hidden tab, or a reduced-motion change. Reduced motion bypasses the reveal. The visible sound and motion controls were removed at the couple’s request. System reduced-motion preferences still apply.

The soundtrack attempts autoplay at low volume. Browser restrictions can require the first tap or keypress; this resumes music without a separate prompt. Audio pauses in hidden tabs; old saved mute preferences are ignored on initialization. No whole-file preload runs before the attempt. The recording and linked CC BY credit are described in `assets/MUSIC-LICENSE.txt`.

The couple supplied updated family and venue details. Engagement/betrothal is one event: 28 December 2026 at 11:30 AM, reception at noon. Wedding: 9 January 2027 at 2:45 PM, reception at 6 PM. The countdown now targets the ceremony time in India. Existing RSVP field mappings and Supabase endpoint configuration remain unchanged.

## Existing security limitations

The original exported bundle included raw guest and organiser passcodes. The local update replaces the guest passcode with three SHA-256 digests; the organiser passcode remains client-readable. These are cosmetic gates, not server authentication. Its Supabase JWT is an anonymous public client key, not a service-role key. No tracked `.env` files or guest-record fixtures were found. Supabase policies were not audited or changed.

This change removes pre-unlock RSVP reads and stops rendering hidden invitation controls while locked. The backend must independently restrict reads/deletes and validate writes before the public site can be considered private. No guest records were fetched deliberately and no production RSVPs were submitted during testing.

## Validation notes

Browser checks: empty/wrong/valid guest passcodes, repeated taps, cover focus handoff, mobile scrolling, music start/pause, required RSVP fields, isolated double-submit, organiser error/success, and visible credit. Node checks exercise reduced-motion bypass/cleanup, mocked network failure and duplicate submission, gate isolation, original-asset preservation, and pending audio cancellation. OS-level reduced-motion emulation and physical iOS/Android testing remain unverified. No package lint/build/typecheck configuration exists.

Local screenshots are in `qa/`; test and QA files are excluded from future Vercel uploads. Deployment requires explicit approval from the couple.

## Invitation groups

All guests use one URL. The entered passcode selects engagement, wedding, or both; query parameters do not choose access. Each has its own guest code; the existing shared guest code has been replaced in this local version. One organiser tracker is shared. Scoped views and RSVP row flags are validated on the frontend only.

User-selected codes and local links are in `.private/invitation-links.txt` (mode 0600, ignored by Git and Vercel); they are not printed in test output. Only digests are included in `assets/invitation-access.js`. Do not publish the private folder. Engagement and wedding views preselect only their matching RSVP event; the combined view offers both.

The grandparents blessing section was removed at the couple’s request. RSVP deadline is consistently 15 November 2026, confirmed by the couple.

The engagement card includes the couple-supplied church watercolour. Rain uses random drops with ripples at the exact impact points, a bounded canvas at 24 fps, and reduced-motion/hidden-tab cleanup.

Music attribution is retained under an expandable Music credits disclosure. The organiser tracker uses a quiet For the organisers link. Pointer movement, clicking and wheel scrolling create drops at the pointer position using passive, throttled listeners.

Pointer movement within 24 pixels of the last drop is limited to one drop per 1.2 seconds; movement beyond that area retains the existing responsive rate.
