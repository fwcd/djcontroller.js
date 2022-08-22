import { MidiMessage, MixxxControllerMapping } from 'dj-controller';

import mc7000XmlSrc from '../controllers/Denon-MC7000.midi.xml';
import mc7000JsSrc from '../controllers/Denon-MC7000-scripts.js';

// Set up an example mapping (in this case the MC7000 mapping)
const mapping = MixxxControllerMapping.parse(mc7000XmlSrc, mc7000JsSrc);

// Print some info about the mapping
console.log(JSON.stringify(mapping.info, null, 2))

function handleMidiMessageEvent(event: any) {
  if (!('data' in event)) {
    console.warn('Ignoring MIDI event without data');
    return;
  }
  const [status, ...data] = event.data as Uint8Array;

  const midiMsg: MidiMessage = { status, data };
  const actions = mapping.fromMidi(midiMsg);

  console.log(`MIDI message: Status: ${status.toString(16)}, data: ${data.map(n => n.toString(16))} -> ${JSON.stringify(actions)}`);
}

window.addEventListener('load', async () => {
  if (!('requestMIDIAccess' in navigator)) {
    console.warn('Web MIDI is not supported by this browser!');
    return;
  }

  // Request access to MIDI devices
  const midiAccess = await navigator.requestMIDIAccess();

  function registerMidiListeners() {
    let inputCount = 0;
    midiAccess.inputs.forEach(input => {
      input.addEventListener('midimessage', handleMidiMessageEvent);
      inputCount++;
    });
    console.log(`${inputCount} MIDI input(s) available`);
  }

  // Register MIDI input listeners
  registerMidiListeners();
  midiAccess.addEventListener('statechange', () => {
    registerMidiListeners();
  });
});
