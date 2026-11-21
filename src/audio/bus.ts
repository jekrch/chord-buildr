import * as Tone from "tone"
import { EQSettings, hasFlatEq } from "../utils/settings"
import { debug } from "../utils/debug"
import { spaceMix } from "./mix"

/**
 * the one path every voice takes to the speakers. the only place
 * anything is connected to the destination:
 *
 *   voice → input → eq (left out while it's flat) → tone lowpass
 *     ├→ dry ────────────┐
 *     └→ send → reverb ──┴→ master volume → glue compressor → limiter → out
 *
 * the levels are set so chords stay under full scale before the
 * compressor and limiter (see mix.ts). those only catch the rare peak, so
 * the sound stays clean rather than squashed
 */

export interface BusSettings {
  eq: EQSettings
  // the tone lowpass's cutoff, in Hz
  cutoff: number
  // 0-10
  space: number
  // the master level
  volumeDb: number
}

// how long parameter changes glide, so a change doesn't click
const RAMP_SECONDS = 0.04

// log the levels each play reaches, in the dev server only
const METER = import.meta.env.DEV && import.meta.env.MODE !== "test"
const METER_MS = 1500

class Bus {
  readonly input = new Tone.Gain()
  private readonly eq = new Tone.EQ3({ lowFrequency: 250, highFrequency: 2500 })
  private eqInUse = false
  private readonly filter = new Tone.Filter({ type: "lowpass", rolloff: -12, Q: 0.5, frequency: 6000 })
  private readonly dry = new Tone.Gain(1)
  private readonly send = new Tone.Gain(0)
  private reverb: Tone.Reverb | undefined
  private readonly master = new Tone.Volume(0)
  // gentle, slow and mostly idle: a little glue on the loudest chords
  private readonly glue = new Tone.Compressor({ threshold: -20, ratio: 2, knee: 10, attack: 0.01, release: 0.25 })
  // a hard knee, unlike Tone.Limiter's 30 dB one, so it only acts near the top
  private readonly limiter = new Tone.Compressor({ threshold: -3, ratio: 20, knee: 0, attack: 0.001, release: 0.1 })

  private meters: { preDynamics: Tone.Analyser; output: Tone.Analyser } | undefined
  private meterTimer: ReturnType<typeof setInterval> | undefined

  constructor() {
    this.input.connect(this.filter)
    this.eq.connect(this.filter)
    this.filter.fan(this.dry, this.send)
    this.dry.connect(this.master)
    this.master.chain(this.glue, this.limiter, Tone.getDestination())
  }

  apply({ eq, cutoff, space, volumeDb }: BusSettings): void {
    this.applyEq(eq)
    this.filter.frequency.rampTo(cutoff, RAMP_SECONDS)
    this.applySpace(space)

    if (volumeDb === -Infinity) {
      this.master.mute = true
    } else {
      this.master.mute = false
      this.master.volume.rampTo(volumeDb, RAMP_SECONDS)
    }
  }

  /**
   * sets the eq's bands, and leaves it out of the path entirely while
   * it's flat, where it would only color the sound
   */
  private applyEq(eq: EQSettings) {
    this.eq.low.value = eq.low
    this.eq.mid.value = eq.mid
    this.eq.high.value = eq.high

    const useEq = !hasFlatEq(eq)
    if (useEq === this.eqInUse) return

    this.input.disconnect()
    this.input.connect(useEq ? this.eq : this.filter)
    this.eqInUse = useEq
  }

  /**
   * the reverb is only built the first time it's wanted. its impulse is
   * generated in the background, and the send is silent until it's ready
   */
  private applySpace(space: number) {
    const { dry, wet } = spaceMix(space)

    if (wet > 0 && !this.reverb) {
      this.reverb = new Tone.Reverb({ decay: 2.8, preDelay: 0.02, wet: 1 })
      this.send.chain(this.reverb, this.master)
    }

    this.dry.gain.rampTo(dry, RAMP_SECONDS)
    this.send.gain.rampTo(wet, RAMP_SECONDS)
  }

  /**
   * in the dev server, logs the highest peak (in dBFS) a play reaches
   * before the compressor and limiter, and at the output, for tuning
   * voice trims and levels. the first should stay under about -3
   */
  watchLevels(): void {
    if (!METER) return

    if (!this.meters) {
      this.meters = {
        preDynamics: new Tone.Analyser("waveform", 1024),
        output: new Tone.Analyser("waveform", 1024)
      }
      this.master.connect(this.meters.preDynamics)
      this.limiter.connect(this.meters.output)
    }

    const { preDynamics, output } = this.meters
    const peaks = { preDynamics: 0, output: 0 }
    const peakOf = (analyser: Tone.Analyser) => {
      const values = analyser.getValue()
      if (!(values instanceof Float32Array)) return 0
      return values.reduce((peak, value) => Math.max(peak, Math.abs(value)), 0)
    }
    const toDb = (peak: number) => (20 * Math.log10(peak || 1e-6)).toFixed(1)

    clearInterval(this.meterTimer)
    const started = Date.now()
    this.meterTimer = setInterval(() => {
      peaks.preDynamics = Math.max(peaks.preDynamics, peakOf(preDynamics))
      peaks.output = Math.max(peaks.output, peakOf(output))

      if (Date.now() - started >= METER_MS) {
        clearInterval(this.meterTimer)
        debug(`audio peaks: ${toDb(peaks.preDynamics)} dBFS before dynamics, ${toDb(peaks.output)} dBFS out`)
      }
    }, 20)
  }
}

let bus: Bus | undefined

// the bus, built on first use
export function getBus(): Bus {
  bus ??= new Bus()
  return bus
}
