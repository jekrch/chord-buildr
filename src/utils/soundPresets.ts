import { DEFAULT_SOUND, SoundSettings, soundDiffers } from "./settings"

/**
 * named starting points: a voice and a sound. picking one writes its
 * values into the settings; only the values are saved in the url, so
 * presets can be renamed, added or retuned freely
 */
export interface SoundPreset {
  name: string
  // a SYNTH_TYPES key
  synth: string
  sound: SoundSettings
}

export const SOUND_PRESETS: readonly SoundPreset[] = [
  { name: "Classic", synth: "p", sound: { ...DEFAULT_SOUND } },
  { name: "Warm", synth: "p", sound: { tone: -3, attack: 1, length: 1, space: 3, balance: -2, play: "a" } },
  { name: "Piano", synth: "pi", sound: { tone: 0, attack: 0, length: 1, space: 3, balance: 0, play: "a" } },
  { name: "Keys", synth: "k", sound: { tone: -1, attack: 0, length: 1, space: 2, balance: -1, play: "c" } },
  { name: "Ambient", synth: "pd", sound: { tone: -2, attack: 4, length: 4, space: 7, balance: -1, play: "c" } },
  { name: "Glass", synth: "b", sound: { tone: 2, attack: -2, length: 2, space: 5, balance: 0, play: "r" } },
  // every voice of the chord, one at a time, dry and bass forward
  { name: "Study", synth: "p", sound: { tone: 0, attack: -1, length: -2, space: 0, balance: -3, play: "r" } }
]

// the preset the voice and sound match, if any
export function findPreset(synth: string, sound: SoundSettings): SoundPreset | undefined {
  return SOUND_PRESETS.find((preset) => preset.synth === synth && !soundDiffers(preset.sound, sound))
}
