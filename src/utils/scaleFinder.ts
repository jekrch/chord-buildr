

// types for our musical elements
type Note = 'C' | 'C#' | 'D' | 'D#' | 'E' | 'F' | 'F#' | 'G' | 'G#' | 'A' | 'A#' | 'B';
const notes: Note[] = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

const scales: Map<string, number[]> = new Map([
    ['Major', [0, 2, 4, 5, 7, 9, 11]],
    ['Minor', [0, 2, 3, 5, 7, 8, 10]], // actually this is the Natural Minor
    // ['Harmonic Minor', [0, 2, 3, 5, 7, 8, 11]],
    // ['Melodic Minor', [0, 2, 3, 5, 7, 9, 11]]
    // ['Dorian', [0, 2, 3, 5, 7, 9, 10]],
    // ['Phrygian', [0, 1, 3, 5, 7, 8, 10]],
    // ['Lydian', [0, 2, 4, 6, 7, 9, 11]],
    // ['Mixolydian', [0, 2, 4, 5, 7, 9, 10]],
    // ['Locrian', [0, 1, 3, 5, 6, 8, 10]],
    // ['Whole Tone', [0, 2, 4, 6, 8, 10]],
    // ['Diminished', [0, 1, 3, 4, 6, 7, 9, 10]],
    // ['Blues', [0, 3, 5, 6, 7, 10]],
    // ['Pentatonic Major', [0, 2, 4, 7, 9]],
    // ['Pentatonic Minor', [0, 3, 5, 7, 10]]
]);

export function generateKeyString(closestKeys: Note[], closestScales: string[]): string[] {
    const closestKeyScales: string[] = [];

    for (let i = 0; i < closestKeys.length; i++) {
        closestKeyScales.push(`${closestKeys[i]} ${closestScales[i]}`);
    }

    return closestKeyScales;
}

/**
 * calculates the distance between a chord and a scale
 */
function distance(chordNotes: number[], scaleNotes: number[]): number {
    let totalDistance = 0;

    for (const note of chordNotes) {
        const distances = scaleNotes.map(scaleNote => 
            Math.abs((note - scaleNote + 6) % 12 - 6)
        );
        totalDistance += Math.min(...distances);
    }

    return totalDistance;
}

/**
 * finds the closest key/scale combinations to the provided chords
 */
export function findScale(chords: number[][]): string[] {
    if (!chords?.length) {
        return [];
    }

    const chordNotes: number[] = chords.flatMap(chord => 
        chord.map(note => note - 1)
    );

    let closestKeys: Note[] = [];
    let closestScales: string[] = [];
    let closestDistance = Infinity;
    
    for (let i = 0; i < notes.length; i++) {
        for (const [scale, intervals] of scales) {
            // calculate the notes in the current scale based on the 
            // current key
            const scaleNotes = intervals.map(interval => 
                (i + interval) % 12
            );

            // calculate the distance between the current chord and scale
            const chordScaleDistance = distance(chordNotes, scaleNotes);

            if (chordScaleDistance < closestDistance) {
                closestDistance = chordScaleDistance;
                closestKeys = [notes[i]];
                closestScales = [scale];
            } else if (chordScaleDistance === closestDistance) {
                // if the current scale is equally close to the previous closest one(s),
                // add the current key/scale combination to the closest keys/scales arrays
                closestKeys.push(notes[i]);
                closestScales.push(scale);
            }
        }
    }

    return generateKeyString(closestKeys, closestScales);
}