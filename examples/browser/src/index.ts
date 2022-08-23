import mc7000XmlSrc from '../controllers/Denon-MC7000.midi.xml';
import mc7000JsSrc from '../controllers/Denon-MC7000-scripts.js';

import { MidiMessage, MixxxControllerMapping } from 'dj-controller';
import { Component, hStack, padding, rectangle, vStack } from './components';

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
  const actions = mapping.handleIncoming(midiMsg);

  console.log(`MIDI message: Status: ${status.toString(16)}, data: ${data.map(n => n.toString(16))} -> ${JSON.stringify(actions)}`);
}

async function initializeMidi() {
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
}

function controllerView(): Component {
  // TODO: An actual view
  return vStack([
    hStack([
      rectangle({ x: 10, y: 30 }, { fill: 'red' }),
      rectangle({ x: 23, y: 15 }, { fill: 'orange' }),
    ]),
    hStack([
      rectangle({ x: 90, y: 20 }, { fill: 'yellow' }),
      padding(rectangle({ x: 90, y: 42 }, { fill: 'green' }), { vertical: false }),
      rectangle({ x: 90, y: 30 }, { fill: 'blue' }),
    ]),
  ], { alignment: 'leading' });
}

function initializeView() {
  const canvas = document.getElementById('controller-view') as HTMLCanvasElement;
  const ctx = canvas.getContext('2d');

  controllerView()(ctx, { x: 0, y: 0 });
}

window.addEventListener('load', async () => {
  initializeMidi();
  initializeView();
});
