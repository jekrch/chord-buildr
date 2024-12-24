import { AppState } from "../components/context/AppContext";

/**
 * From the provided state, generate the base URL params. Currently that's just the synth 
 * and an empty progression 
 * 
 * @param state 
 * @returns 
 */
export function generateBaseUrlParams(state: AppState): string | null {
    return `?s=${state.synth ?? "p"}:${state.volume ?? 80}:${state.format ?? "p"}&p=`
}