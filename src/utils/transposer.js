
// returns the note numbers for the specified chord with the indicated 
// transposition applied to each note 
export function shiftChord(originalKeyNumber, newKeyNumber, chordNoteNumbers) {
        
    var negativeTransposeModifier = originalKeyNumber - newKeyNumber;

    // determine whether the new chord needs to shift up or down 
    // and octave in order to stay within the keyboard range 
    var requiredOctaveModifier = getRequiredOctaveModifier(negativeTransposeModifier, chordNoteNumbers);
    
    var newChordNoteNumbers = [];

    for (var i = 0; i < chordNoteNumbers.length; i++) {
    
        var noteNumber = chordNoteNumbers[i] - negativeTransposeModifier;

        // if the chord needed to be shifted up or down and octave 
        // apply that here
        noteNumber = noteNumber + requiredOctaveModifier;
        
        // in the rare case that we're still outside the range 
        // address that here
        noteNumber = sanitizeKeyLocation(noteNumber);

        newChordNoteNumbers.push(noteNumber)
    }
   	
    return newChordNoteNumbers;
}

// if the note goes above or below the keyboard range, move it
function sanitizeKeyLocation(noteNumber) {
    if (noteNumber < 0)
        return (noteNumber + 12);

    if (noteNumber > 24)
        return (noteNumber - 12);

    return noteNumber;
}

// provides a modifier for all transposed notes based on whether 
// the required transposition would produce any notes that either 
// go below or above the available keyboard range (24)
function getRequiredOctaveModifier(negativeTransposeModifier, chordNoteNumbers) {

    var tooLow;
    var tooHigh;
    
    for (var i = 0; i < chordNoteNumbers.length; i++) {
    
        var noteNumber = chordNoteNumbers[i] - negativeTransposeModifier;

        if (noteNumber < 0)
            tooLow = true;

        if (noteNumber > 24)
            tooLow = true;
    }

    if (tooLow && !tooHigh)
        return 12;

    if (tooHigh && !tooLow)
        return -12;

    // by default, handle this case by case
    return 0;
}