import {getNoteLetter} from "./utils/noteManager"

const chordMap = {
    "" : [0, 4, 7],
    "m" : [0, 3, 7],
    "m7" : [0, 3, 6, 10],
    "maj7" : [0, 4, 7, 11],
    "7" : [0, 4, 7, 10],
    "9" : [0, 4, 7, 10, 14],
    "maj9" : [0, 4, 7, 11, 14],
    "6" : [0, 4, 7, 9],
    "dim" : [0, 3, 6],
    "dim7" : [0, 3, 6, 9],
    "sus4" : [0, 5, 7],
    "sus2" : [0, 2, 7],
    "aug" : [0, 4, 8],
    "add9" : [0, 4, 7, 14],
    "add2" : [0, 2, 4, 7],
    "5" : [0, 7]
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