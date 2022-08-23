import mc7000XmlSrc from '../controllers/Denon-MC7000.midi.xml';
import mc7000JsSrc from '../controllers/Denon-MC7000-scripts.js';

import { MidiMessage, MixxxControllerMapping } from 'dj-controller';
import type { ControllerState } from './state';
import { controllerView } from './ui';
import { render } from './components';

// The DJ controller state.
const state: ControllerState = {
  crossfader: 0,
  decks: Array.from({ length: 4 }, () => ({ gain: 0.5, lows: 0.5, mids: 0.5, highs: 0.5, volume: 0, rate: 0.5 })),
};

// Set up an example mapping (in this case the MC7000 mapping)
const mapping = MixxxControllerMapping.parse(mc7000XmlSrc, mc7000JsSrc);

// Print some info about the mapping
console.log(JSON.stringify(mapping.info, null, 2))

function renderView() {
  const canvas = document.getElementById('controller-view') as HTMLCanvasElement;
  const view = controllerView(state);

  render(view, canvas, { resizeToFit: true });
}

function renderStatus(connectedMidiInputs: string[]) {
  const status = document.getElementById('midi-status');
  const detail = connectedMidiInputs.length > 0 ? `(${connectedMidiInputs.join(', ')})` : '';
  status.innerText = `Connected MIDI inputs: ${connectedMidiInputs.length} ${detail}`;
}

function handleMidiMessageEvent(event: any) {
  if (!('data' in event)) {
    console.warn('Ignoring MIDI event without data');
    return;
  }
  const [status, ...data] = event.data as Uint8Array;

  const midiMsg: MidiMessage = { status, data };
  const actions = mapping.handleIncoming(midiMsg);

  console.log(`MIDI message: Status: ${status.toString(16)}, data: ${data.map(n => n.toString(16))} -> ${JSON.stringify(actions)}`);

  for (const action of actions) {
    if (action.type === 'value') {
      const deck = action.deck;
      const innerState: any = deck ? state.decks[deck - 1] : state;
      if (action.control.type in innerState) {
        innerState[action.control.type] = action.value;
      }
    }
  }

  renderView();
}

async function initializeMidi() {
  if (!('requestMIDIAccess' in navigator)) {
    console.warn('Web MIDI is not supported by this browser!');
    return;
  }

  // Request access to MIDI devices
  const midiAccess = await navigator.requestMIDIAccess();

  function registerMidiListeners() {
    let inputs: string[] = [];

    midiAccess.inputs.forEach(input => {
      input.addEventListener('midimessage', handleMidiMessageEvent);
      inputs.push(input.name);
    });

    console.log(`${inputs.length} MIDI input(s) available`);
    renderStatus(inputs);
  }

  // Register MIDI input listeners
  registerMidiListeners();
  midiAccess.addEventListener('statechange', () => {
    registerMidiListeners();
  });
}

window.addEventListener('load', async () => {
  initializeMidi();
  renderView();
});
