// the tonejs-instrument-*-mp3 packages ship no types. each default-exports
// a Tone.Sampler subclass preloaded with its samples
declare module "tonejs-instrument-*" {
  import type { Sampler, SamplerOptions } from "tone"

  const InstrumentSampler: new (options?: Partial<SamplerOptions>) => Sampler
  export default InstrumentSampler
}
