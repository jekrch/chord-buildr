import { AppState } from "../components/context/AppContext";
import { getSynthCode } from "./chordCodeHandler";

/**
 * From the provided state, generate the base URL params. Currently that's just the synth 
 * and an empty progression 
 * 
 * @param state 
 * @returns 
 */
export function generateBaseUrlParams(state: AppState): string | null {
    return `?s=${getSynthCode(state)}&p=`
}