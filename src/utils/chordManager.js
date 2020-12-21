import {getNoteLetter} from "./utils/noteManager"

const chordMap = {
    "maj" : [0, 4, 7],
    "min" : [0, 3, 7],
    "dim" : [0, 3, 6]
}

// returns the note numbers for the specified chord (1, 5, 8)
function getNoteNumberChord(rootNoteNumber, chordType) {
        
    var intervalList = chordMap[chordType];
    var chordNoteNumbers = []
    

    for (var i = 0; i < intervalList.length; i++) {
    
        var noteNumber = rootNoteNumber + intervalList[i] 
        chordNoteNumbers.push(noteNumber)
    }
   	
    return chordNoteNumbers;
}

// returns the note letters for the specified chord (e.g. C, E, G)
function getNoteLettersChord(rootNoteNumber, chordType) {
        
    var intervalList = chordMap[chordType];
    var chordNoteLetters = []
    
    for (var i = 0; i < intervalList.length; i++) {
    
        var noteNumber = rootNoteNumber + intervalList[i] 
        var noteLetter = getNoteLetter(noteNumber);

    	chordNoteLetters.push(noteLetter)
    }
   	
    return chordNoteLetters;
}