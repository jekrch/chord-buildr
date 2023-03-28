


const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const scales = new Map([
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

export function generateKeyString(closestKeys, closestScales) {
    const closestKeyScales = [];
    for (let i = 0; i < closestKeys.length; i++) {
        closestKeyScales.push(`${closestKeys[i]} ${closestScales[i]}`);
    }
    return closestKeyScales;
}

/**
 * Calculates the distance between a chord and a scale
 * @param {*} chordNotes 
 * @param {*} scaleNotes 
 * @returns 
 */
function distance(chordNotes, scaleNotes) {
    let distance = 0;
    for (let note of chordNotes) {
        let distances = scaleNotes.map(scaleNote => Math.abs((note - scaleNote + 6) % 12 - 6));
        distance += Math.min(...distances);
    }
    return distance;
}


/**
 * finds the closest key/scale combinations to the provided chords
 * @returns 
 */
export function findScale(chords) {

    if (!chords?.length) {
        return ''
    }

    let chordNotes = [];
    for (let chord of chords) {
        for (let note of chord) {
            chordNotes.push(note - 1);
        }
    }

    let closestKeys = [];
    let closestScales = [];
    let closestDistance = Infinity;
    
    for (let i = 0; i < notes.length; i++) {
        for (let [scale, intervals] of scales) {

            // Calculate the notes in the current scale based on the 
            // current key
            let scaleNotes = [];
            for (let interval of intervals) {
                let note = (i + interval) % 12;
                scaleNotes.push(note);
            }

            // Calculate the distance between the current chord and scale
            var chordScaleDistance = distance(chordNotes, scaleNotes);
            if (chordScaleDistance < closestDistance) {
                closestDistance = chordScaleDistance;
                closestKeys = [notes[i]];
                closestScales = [scale];
            } else if (chordScaleDistance === closestDistance) {

                // If the current scale is equally close to the previous closest one(s),
                // add the current key/scale combination to the closest keys/scales arrays
                closestKeys.push(notes[i]);
                closestScales.push(scale);
            }
        }
    }

    // Combine the closest keys and scales into a single string
    return generateKeyString(closestKeys, closestScales);
}

