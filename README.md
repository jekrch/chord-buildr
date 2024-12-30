![Version](https://img.shields.io/badge/version-4.1-blue)
[![Run Tests](https://github.com/jekrch/chord-buildr/actions/workflows/test_on_push.yml/badge.svg)](https://github.com/jekrch/chord-buildr/actions/workflows/test_on_push.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

# Chord Buildr :musical_keyboard:

[www.chordbuildr.com](https://www.chordbuildr.com)

Chord Buildr was created to make it easy for musicians and music enthusiasts to explore and share chord progressions. Users can specify a series of chords, see their notes displayed on interactive keyboards or guitar/ukulele chord diagrams, transpose them, and play audio. Progressions are encoded in the URL, which can be saved for future reference or shared with others.

Chord Buildr is implemented in React and uses Tone.js for audio playback.


<p float="left">
  <img height="300" src="https://github.com/user-attachments/assets/dab4d48f-c686-4a53-b9a3-45180aef4ffd" alt="Chord Buildr Desktop View"/>
  &nbsp;&nbsp;&nbsp;
  <img height="300" src="https://github.com/user-attachments/assets/8dd0f3ac-b4bb-4e74-a3f7-688627b22608" alt="Chord Buildr Mobile View"/>
</p>
  <img height="260" src="https://github.com/user-attachments/assets/5089b2c4-d26a-4f8c-be41-23c0ae9dbff8" alt="Chord Buildr Guitar Chords"/>
  
## Features

### Core Functionality
- **Chord Progression Creation**: Specify chords either through text input, dropdown selection, and/or click on notes.
- **Interactive Keyboard Display**: Visualize chord notes on interactive piano keyboards.
- **Audio Playback**: Listen to your chord progressions by clicking on the progression or chord play buttons.
- **Transposition**: Effortlessly transpose your progressions to different keys.
- **Shareable URLs**: Save and share your progressions through encoded URLs.
- **Guitar/Ukulele Chord Diagrams**: Display guitar chord diagrams with multiple positions to choose from. Chords can be displayed for either standard six-string or ukulele
 
### Music Theory Integration
- **Roman Numeral Notation**: View chord progressions in roman numeral notation when a key is selected.
- **Key-Aware Notation**: Note letters adjust to display the correct notation given the selected key.

### Customization Options
- **Synth Settings**: Adjust volume, EQ, and choose from multiple synth voice options.
- **Note Display**: Option to show notes as flats or sharps.

### User Interface
- **Mobile-Responsive Design**: Optimized interface for both desktop and mobile use.
- **Direct Progression Editing**: Edit your chord progression directly in text format.
- **Playback Controls**: Cycle through chords with a play button in the header.

## Tech Stack

- Typescript
- React
- Tailwind
- Shadcn
- Tone.js
- chords-db  

## Getting Started

To run Chord Buildr locally:

1. Install dependencies with `npm install`
2. Start with `npm run start`
3. Execute tests with `npm run test`

## License

This project is open source and available under the [MIT License](LICENSE).
