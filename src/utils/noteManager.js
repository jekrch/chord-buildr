
const noteLetterMap = {
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

const noteNumberMap = {
    "C":  1,
    "C#": 2,
    "D":  3,
    "D#": 4,
    "E":  5,
    "F":  6,
    "F#": 7,
    "G":  8,
    "G#": 9,
    "A":  10,
    "A#": 11,
    "B":  12,
}


// Get the number corresponding to the provide note letter
function getNoteNumber(letter) {
        
    return noteNumberMap[letter.toUpperCase()]
}

// get the letter corresponding to the provided note number
function getNoteLetter(number) {
    
    var noteIndex = number;
    
    if (number > 12) {
    
      var modulo = (number % 12);
     
      if (modulo === 0)
      	noteIndex = 12;
      else 
      	noteIndex = modulo;  	
    }
    
    return noteLetterMap[noteIndex]
}