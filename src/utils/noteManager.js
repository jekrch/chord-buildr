
const noteLetterMapWithSharps = {
	1: "C",
	2: "C#",
	3: "D",
	4: "D#",
	5: "E",
	6: "F",
	7: "F#",
	8: "G",
	9: "G#",
	10: "A",
	11: "A#",
    12: "B",
}

const noteLetterMapWithFlats = {
	1: "C",
	2: "Db",
	3: "D",
	4: "Eb",
	5: "E",
	6: "F",
	7: "Gb",
	8: "G",
	9: "Ab",
	10: "A",
	11: "Bb",
    12: "B",
}

// includes both sharps and flats 
export const noteNumberMap = {
    "C":  1,
	"C#": 2,
	"Db": 2,  
	"D":  3,
	"D#": 4,
    "Eb": 4,
	"E":  5,
    "F":  6,
	"F#": 7,
	"Gb": 7,
    "G":  8,
	"G#": 9,
	"Ab": 9,
    "A":  10,
    "A#": 11,
	"Bb": 11,
    "B":  12,
}


// sharps - c / g / d / a / e / b / f# / c#
// flats  - f / Bb / Eb / Ab / Db / Gb / Cb 

export function getNoteLetterMapByKey(key) {
    
    key = formatNoteName(key);

    switch (key) {

        case "C":
        case "C#":
        case "D":
        case "E":
        case "F#":
        case "G":
        case "A":
        case "B":
            return noteLetterMapWithSharps;

        case "G#":
        case "Ab":
        case "A#":
        case "Bb":
        case "Cb":
        case "Db":
        case "D#":
        case "Eb":
        case "F":
        case "Gb":
            return noteLetterMapWithFlats;

        default: 
            return noteLetterMapWithFlats;
    }
}

// converts note letter to the correct case 
// (e.g. aB -> Ab; c# -> C#)
export function formatNoteName(letter) {
    return letter.charAt(0).toUpperCase() + letter.charAt(1).toLowerCase();
}

// Get the number corresponding to the provide note letter
export function getNoteNumber(letter) {
    
    letter = formatNoteName(letter);

    return noteNumberMap[letter]
}

// get the letter corresponding to the provided note number
export function getNoteLetter(key, number) {
    
    var noteIndex = number;
    
    if (number > 12) {
    
      var modulo = (number % 12);
     
      if (modulo === 0)
      	noteIndex = 12;
      else 
      	noteIndex = modulo;  	
    }
    
    var noteLetterMap = getNoteLetterMapByKey(key);

    var letter = noteLetterMap[noteIndex];

    return formatNoteName(letter);
}