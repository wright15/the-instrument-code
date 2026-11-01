(() => {
  if (window.__orreryTwoTierReplay) return;

  const MICRO_STEP_SECONDS = 0.3;
  const TRANSIT_REST_SECONDS = 0.3;

  function midiToFrequency(midi) {
    return 440 * Math.pow(2, (midi - 69) / 12);
  }

  function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  function scheduleMicro(context, preset, midi, emphasis, when) {
    const oscillator = context.createOscillator();
    const envelope = context.createGain();
    const frequency = midiToFrequency(midi);
    oscillator.type = preset.waveform;
    oscillator.frequency.setValueAtTime(frequency, when);
    oscillator.detune.setValueAtTime(preset.detuneCents, when);
    envelope.gain.setValueAtTime(0.0001, when);
    envelope.gain.linearRampToValueAtTime(
      Math.max(0.0001, preset.gain * emphasis), when + preset.attackSeconds,
    );
    envelope.gain.linearRampToValueAtTime(0.0001, when + preset.releaseSeconds);
    oscillator.connect(envelope).connect(context.destination);
    oscillator.start(when);
    oscillator.stop(when + preset.releaseSeconds);
    return frequency;
  }

  async function replay(data) {
    const nav = window.__orreryNav;
    const events = window.__orreryAudioEvents || null;
    const context = new AudioContext();
    const live = data.mode === "live";
    const log = {
      trace: data.trace,
      mode: data.mode,
      microCaptures: [],
      hops: [],
      boundary: null,
      barsVisited: [],
      errors: [],
    };
    for (const step of data.steps) {
      if (step.type === "bar") {
        await nav.select(step.node);
        log.barsVisited.push(step.node);
        const preset = data.palettes[step.office];
        if (!preset) throw new Error(`missing palette ${step.office}`);
        for (const micro of step.micro) {
          if (events) events.frequencies.length = 0;
          const when = live ? context.currentTime + micro.sub * MICRO_STEP_SECONDS : 0;
          const emphasis = micro.projectionMode === "direct_orbit_pc" ? 1.0 : 0.8;
          const frequency = scheduleMicro(
            context, preset, micro.midi, emphasis, when,
          );
          const captured = events ? events.frequencies.slice() : [];
          log.microCaptures.push({
            bar: step.bar,
            sub: micro.sub,
            node: step.node,
            expectedPc: micro.emittedPc,
            midi: micro.midi,
            frequency,
            captured,
            projectionMode: micro.projectionMode,
          });
          if (live) await sleep(MICRO_STEP_SECONDS * 1000);
        }
        continue;
      }
      if (step.type === "hop") {
        if (events) events.frequencies.length = 0;
        await nav.select(step.source);
        const boundaryChip = step.sourceBoundary
          ? document.querySelector(`.orrery-nav-boundary-chip[data-phase="${step.sourcePhase}"]`)
          : null;
        const chipActive = boundaryChip ? boundaryChip.classList.contains("is-active") : null;
        const result = await nav.applyMove(step.target, step.verdict, step.citation);
        const macroFrequencies = events ? events.frequencies.slice() : [];
        const targetChip = step.targetBoundary
          ? document.querySelector(`.orrery-nav-boundary-chip[data-phase="${step.targetPhase}"]`)
          : null;
        const targetChipActive = targetChip ? targetChip.classList.contains("is-active") : null;
        const capture = {
          source: step.source,
          target: step.target,
          kind: step.kind,
          verdict: result.verdict,
          citation: result.citation,
          emission: result.emission,
          sourceBoundary: Boolean(step.sourceBoundary),
          boundaryChipActive: chipActive,
          boundaryChipPhase: step.sourceBoundary ? step.sourcePhase : null,
          targetBoundary: Boolean(step.targetBoundary),
          targetChipPhase: step.targetBoundary ? step.targetPhase : null,
          targetChipActive,
          microScheduled: 0,
          macroFrequencies,
        };
        log.hops.push(capture);
        if (step.kind === "boundary-auto-transit") {
          log.boundary = capture;
          if (live) await sleep(TRANSIT_REST_SECONDS * 1000);
        }
        continue;
      }
      throw new Error(`unknown step ${step.type}`);
    }
    const navState = nav.state();
    log.finalNode = navState.node;
    log.contexts = events.contexts;
    return log;
  }

  window.__orreryTwoTierReplay = { replay };
})();
