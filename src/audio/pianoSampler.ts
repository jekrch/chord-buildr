import { Sampler, type SamplerOptions } from "tone"
import A2 from "tonejs-instrument-piano-mp3/A2.mp3"
import A3 from "tonejs-instrument-piano-mp3/A3.mp3"
import A4 from "tonejs-instrument-piano-mp3/A4.mp3"
import A5 from "tonejs-instrument-piano-mp3/A5.mp3"
import C2 from "tonejs-instrument-piano-mp3/C2.mp3"
import C3 from "tonejs-instrument-piano-mp3/C3.mp3"
import C4 from "tonejs-instrument-piano-mp3/C4.mp3"
import C5 from "tonejs-instrument-piano-mp3/C5.mp3"
import C6 from "tonejs-instrument-piano-mp3/C6.mp3"
import Ds2 from "tonejs-instrument-piano-mp3/Ds2.mp3"
import Ds3 from "tonejs-instrument-piano-mp3/Ds3.mp3"
import Ds4 from "tonejs-instrument-piano-mp3/Ds4.mp3"
import Ds5 from "tonejs-instrument-piano-mp3/Ds5.mp3"
import Fs2 from "tonejs-instrument-piano-mp3/Fs2.mp3"
import Fs3 from "tonejs-instrument-piano-mp3/Fs3.mp3"
import Fs4 from "tonejs-instrument-piano-mp3/Fs4.mp3"
import Fs5 from "tonejs-instrument-piano-mp3/Fs5.mp3"

/**
 * a piano sampler built from part of tonejs-instrument-piano-mp3. the
 * package's own sampler loads all 80-odd samples (about 15 MB); this
 * takes one every minor third from C2 to C6 (about 3.6 MB), which covers
 * every voicing the app plays, low guitar strings included, with no note
 * shifted more than a semitone and a half from its sample
 */
const URLS = {
  C2, "D#2": Ds2, "F#2": Fs2, A2,
  C3, "D#3": Ds3, "F#3": Fs3, A3,
  C4, "D#4": Ds4, "F#4": Fs4, A4,
  C5, "D#5": Ds5, "F#5": Fs5, A5,
  C6
}

export default class PianoSampler extends Sampler {
  constructor(options: Partial<SamplerOptions> = {}) {
    super({ ...options, urls: URLS })
  }
}
