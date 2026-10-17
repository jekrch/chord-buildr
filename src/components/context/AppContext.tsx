import { getScaleAdjustedNoteLetter } from "../../utils/chordManager"
import {
  transposePianoBoard,
  selectChordKeys,
  ChordPiano,
  SelectedChord,
  SelectedKey
} from "../../utils/chordPianoHandler"
  // @ts-ignore
import { pianoGenerator } from "../../utils/pianoHelper"
import {
  updateFlatOrSharpLetter,
  updateUrlProgressionCode, buildProgFromCode
} from "../../utils/chordCodeHandler"
import React, { useReducer, createContext, useEffect, ReactNode } from "react";
import { DEFAULT_EQ, EQSettings } from "../../utils/synthPlayer";
import {
  ProgressionItem,
  arrangeProgression,
  removeChord,
  toggleBreakAfter
} from "../../utils/sectionBreaks";


export interface AppState {
  history: any | null;
  previousProgCodes: string[];
  currentProgCode: string | null;
  building: boolean;
  chordPianoSet?: ChordPiano[];
  synth: string;
  format: string;
  // how guitar/ukulele chords are shown: "f" full cards, "t" a compact tab chart
  fretView: string;
  volume: number;
  changed?: number;
  refreshBoard?: number; 
  eq: EQSettings;
}

type PianoAction =
  | { type: "UPDATE_PIANO"; id?: number; payload: ChordPiano }
  | { type: "UPDATE_KEY"; id?: number; payload: SelectedKey }
  | { type: "UPDATE_SYNTH"; synth: string }
  | { type: "UPDATE_SYNTH_VOLUME"; volume: number }
  | { type: "UPDATE_EQ"; eq: EQSettings }
  | { type: "UPDATE_CHORD_TYPE"; id?: number; chordType: string }
  | { type: "UPDATE_SLASH_CHORD"; id?: number; isSlashChord: boolean; slashNote: string }
  | { type: "UPDATE_SHOW_FLATS"; id?: number; showFlats: boolean }
  | { type: "UPDATE_UX_FORMAT"; format: string }
  | { type: "UPDATE_FRET_VIEW"; fretView: string }
  | { type: "ADD_CHORD_PIANO"; payload: any }
  | { type: "REMOVE_PIANO"; id: number }
  | { type: "ARRANGE_PROGRESSION"; items: ProgressionItem[] }
  | { type: "TOGGLE_SECTION_BREAK"; id: number }
  | { type: "ADD_SECTION_BREAK" }
  | { type: "REFRESH_BOARD"; }
  | { type: "REFRESH_PIANO"; id: number, payload: ChordPiano }
  | { type: "SET_PROG_KEY"; id: number; keyChecked: boolean }
  | { type: "BUILD_PROG_FROM_CODE"; payload: string | null }
  | { type: "LOAD_PREVIOUS_PROG_CODE" };

interface PianoContextType {
  state: AppState;
  dispatch: React.Dispatch<PianoAction>;
}

// Constants
export const STATE_NAME = "PIANO_STATE";

const initialState: AppState = {
  history: null,
  previousProgCodes: [],
  currentProgCode: null,
  building: false,
  chordPianoSet: undefined,
  synth: "p",  // plumber
  format: "p", // piano
  fretView: "f", // full
  volume: 80,
  eq: DEFAULT_EQ
};

// Helper Functions
function getChordPiano(pianoId: number): ChordPiano {
  return {
    id: pianoId,
    piano: pianoGenerator(), 
    selectedKey: { noteLetter: "C", octave: 0 },
    selectedChord: {
      noteLetter: "C",
      type: "",
      octave: 1
    }
  };
}

export function getPianoById(state: AppState, pianoId: number): ChordPiano | null {
  return state.chordPianoSet?.find((chordPiano) => chordPiano.id === pianoId) || null;
}

export function clearProgKey(state: AppState): void {
  state.chordPianoSet?.forEach((chordPiano) => {
    chordPiano.isProgKey = false;
  });
}

export function getProgKeyChord(state: AppState): SelectedChord | undefined {
  const progKeyPiano = state.chordPianoSet?.find((chordPiano) => chordPiano.isProgKey);
  return progKeyPiano?.selectedChord;
}

export function setProgKey(state: AppState, pianoId: number): void {
  clearProgKey(state);
  const chordPiano = getPianoById(state, pianoId);
  if (chordPiano) {
    chordPiano.isProgKey = true;
  }
}

function getNextId(state: AppState): number {
  const maxId = Math.max(...state.chordPianoSet?.map((chordPiano) => chordPiano.id) ?? [0]);
  return maxId === -Infinity ? 0 : maxId + 1;
}

function getKeyRelativeLetter(state: AppState, letter: string): string {
  const key = getProgKeyChord(state);
  return key ? getScaleAdjustedNoteLetter(key, letter) : letter;
}

// Reducer
const pianoReducer = (state: AppState, action: PianoAction): AppState => {
  const pianoId = 'id' in action ? action.id : 0;

  switch (action.type) {

    case "REFRESH_BOARD": {
      return {
        ...state,
        refreshBoard: Math.random()
      };
    }

    case "UPDATE_PIANO": {
      const updatedSet = state.chordPianoSet?.map((chordPiano) =>
        chordPiano.id === pianoId
          ? action.payload 
          : chordPiano
      );
      
      return {
        ...state,
        chordPianoSet: updatedSet as any
      };
    }

    case "UPDATE_KEY": {
      const chordPiano = getPianoById(state, pianoId!);
      
      if (!chordPiano) {
        console.log("Piano not found:", pianoId);
        return state;
      }

      const noteLetter = updateFlatOrSharpLetter(
        chordPiano.showFlats ?? false,
        action.payload.noteLetter
      );

      if (chordPiano.isProgKey) {
        transposePianoBoard(
          pianoId!,
          state.chordPianoSet,
          chordPiano,
          action.payload
        );
      }

      const adjustedNoteLetter = chordPiano.isProgKey
        ? noteLetter
        : getKeyRelativeLetter(state, noteLetter);

      chordPiano.selectedKey = {
        ...action.payload,
        noteLetter: adjustedNoteLetter
      };
      chordPiano.selectedChord = {
        ...chordPiano.selectedChord,
        noteLetter: adjustedNoteLetter,
        octave: action.payload.octave
      };
      chordPiano.rendered = false;

      selectChordKeys(chordPiano);
      updateUrlProgressionCode(state);

      return { ...state };
    }

    case "UPDATE_SYNTH":
      return {
        ...state,
        synth: action.synth
      };
      
    case "UPDATE_UX_FORMAT":
      return {
        ...state,
        format: action.format
      };

    case "UPDATE_FRET_VIEW":
      return {
        ...state,
        fretView: action.fretView
      };

    case "REFRESH_PIANO":
      return {
        ...state,
        chordPianoSet: state.chordPianoSet?.map(piano => 
          piano.id === action?.id ? { ...piano, ...action.payload } : piano
        )
      }

    case "UPDATE_SYNTH_VOLUME":

      return {
        ...state,
        volume: action.volume
      };

    case "UPDATE_EQ":

      return {
        ...state,
        eq: action.eq
      };

    case "UPDATE_CHORD_TYPE": {
      const chordPiano = getPianoById(state, pianoId!);
      
      if (chordPiano) {
        chordPiano.selectedChord.type = action.chordType;
        chordPiano.rendered = false;
        selectChordKeys(chordPiano);
      }

      updateUrlProgressionCode(state);
      return { ...state };
    }

    case "UPDATE_SLASH_CHORD": {
      const chordPiano = getPianoById(state, pianoId!);
      
      if (chordPiano) {
        chordPiano.selectedChord.slash = action.isSlashChord;
        chordPiano.selectedChord.slashNote = action.slashNote;
        chordPiano.rendered = false;
        selectChordKeys(chordPiano);
      }

      updateUrlProgressionCode(state);
      return { ...state };
    }

    case "UPDATE_SHOW_FLATS": {
      const chordPiano = getPianoById(state, pianoId!);
      
      if (chordPiano) {
        chordPiano.showFlats = action.showFlats;
        let newNoteLetter = updateFlatOrSharpLetter(
          chordPiano.showFlats,
          chordPiano.selectedKey.noteLetter
        );
        newNoteLetter = getKeyRelativeLetter(state, newNoteLetter);
        
        chordPiano.selectedKey.noteLetter = newNoteLetter;
        chordPiano.selectedChord.noteLetter = newNoteLetter;
      }

      updateUrlProgressionCode(state);
      return { ...state };
    }

    case "ADD_CHORD_PIANO": {
      if (action.payload !== null) {
        const nextChordPianoId = getNextId(state);
        state.chordPianoSet = [...state.chordPianoSet ?? [], getChordPiano(nextChordPianoId)];
        
        updateUrlProgressionCode(state);
        
        return {
          ...state          
        };
      }
      return state;
    }

    case "REMOVE_PIANO": {
      const updatedSet = removeChord(state.chordPianoSet ?? [], action.id);
      updateUrlProgressionCode(state);
      
      return {
        ...state,
        chordPianoSet: updatedSet
      };
    }

    /**
     * lays the chords and section breaks out in a new order, e.g. after
     * one is dragged to a new spot
     */
    case "ARRANGE_PROGRESSION": {
      const chordPianoSet = arrangeProgression(state.chordPianoSet ?? [], action.items);

      const newState = { ...state, chordPianoSet };
      updateUrlProgressionCode(newState);
      return newState;
    }

    // adds or removes the section break right after a chord
    case "TOGGLE_SECTION_BREAK": {
      const chordPianoSet = toggleBreakAfter(state.chordPianoSet ?? [], action.id);

      const newState = { ...state, chordPianoSet };
      updateUrlProgressionCode(newState);
      return newState;
    }

    // ends the current section, so the next chord added starts a new one
    case "ADD_SECTION_BREAK": {
      const lastChordPiano = state.chordPianoSet?.[state.chordPianoSet.length - 1];
      if (!lastChordPiano || lastChordPiano.breakAfter !== undefined) return state;

      const chordPianoSet = toggleBreakAfter(state.chordPianoSet ?? [], lastChordPiano.id);

      const newState = { ...state, chordPianoSet };
      updateUrlProgressionCode(newState);
      return newState;
    }

    case "SET_PROG_KEY": {
      if (action.keyChecked) {
        setProgKey(state, action.id);
      } else {
        const chordPiano = getPianoById(state, action.id);
        if (chordPiano) {
          chordPiano.isProgKey = false;
        }
      }

      updateUrlProgressionCode(state);
      return { ...state };
    }

    case "BUILD_PROG_FROM_CODE": {
      if (action.payload !== null) {
        return {
          //...state,      
          ...buildProgFromCode(state, action.payload),
          building: false
        };
      }
      return state;
    }

    case "LOAD_PREVIOUS_PROG_CODE": {

      if (state.previousProgCodes.length > 0) {
        // Get the last code
        const lastProgIndex = state.previousProgCodes.length - 1;
        let previousProgCode = state.previousProgCodes[lastProgIndex];
        let stepsBack = 1;

        // create a new state with the previous code
        let newState = {
          ...state,
          building: false,
          previousProgCodes: state.previousProgCodes.slice(0, -stepsBack) // Remove the last entry
        };

        //console.log(previousProgCode)
        let builtState = buildProgFromCode(newState, previousProgCode);
        builtState.previousProgCodes = state.previousProgCodes.slice(0, -1)

        return {
          ...builtState,
        };
      }
      return state;
    }

    default:
      return state;
  }
};

// Context
export const AppContext = createContext<PianoContextType | undefined>(undefined);

interface AppProviderProps {
  children: ReactNode;
}

// Get persisted state from session storage
const getPersistedState = (): AppState => {
  const persistedStateString = sessionStorage.getItem(STATE_NAME);
  if (!persistedStateString) return initialState;
  
  try {
    return {
      ...initialState,
      ...JSON.parse(persistedStateString)
    };
  } catch {
    return initialState;
  }
};

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(pianoReducer, getPersistedState());

  useEffect(() => {
    sessionStorage.setItem(STATE_NAME, JSON.stringify(state));
  }, [state]);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
};

// Custom hook for using the piano context
export const useAppContext = () => {
  const context = React.useContext(AppContext);
  if (context === undefined) {
    throw new Error("usePianoContext must be used within a PianoProvider");
  }
  return context;
};