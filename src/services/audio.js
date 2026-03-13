// Audio alert system — uses Web Audio API for in-browser beeps
// Works through Tesla's car speakers via the browser

let audioCtx = null

function getAudioContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)()
  }
  return audioCtx
}

export function playAlertSound(type = 'police') {
  try {
    const ctx = getAudioContext()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.connect(gain)
    gain.connect(ctx.destination)

    if (type === 'police') {
      osc.frequency.value = 880
      gain.gain.value = 0.3
      osc.type = 'sine'
    } else if (type === 'speed_trap') {
      osc.frequency.value = 660
      gain.gain.value = 0.25
      osc.type = 'triangle'
    } else {
      osc.frequency.value = 440
      gain.gain.value = 0.2
      osc.type = 'sine'
    }

    // Quick double beep
    const now = ctx.currentTime
    gain.gain.setValueAtTime(gain.gain.value, now)
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15)
    gain.gain.setValueAtTime(gain.gain.value, now + 0.2)
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35)

    osc.start(now)
    osc.stop(now + 0.4)
  } catch {
    // Audio not available
  }
}
