// the tonejs-instrument-*-mp3 packages ship no types. each default-exports
// a Tone.Sampler subclass preloaded with its samples. the pattern ends in
// -mp3 so a single sample's path (".../C4.mp3") falls through to vite's
// own *.mp3 declaration, which gives its url
declare module "tonejs-instrument-*-mp3" {
  import type { Sampler, SamplerOptions } from "tone"

  const InstrumentSampler: new (options?: Partial<SamplerOptions>) => Sampler
  export default InstrumentSampler
}
