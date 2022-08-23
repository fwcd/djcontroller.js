import mc7000XmlSrc from '../controllers/Denon-MC7000.midi.xml';
import mc7000JsSrc from '../controllers/Denon-MC7000-scripts.js';

import { MidiMessage, MixxxControllerMapping } from 'dj-controller';
import { Component, hStack, padding, rectangle, render, spacer, translation, Vec2, vStack, zStack } from './components';

interface DeckState {
  lows: number;
  mids: number;
  highs: number;
  volume: number;
  rate: number;
}

interface ControllerState {
  crossfader: number;
  decks: DeckState[];
}

// The DJ controller state.
const state: ControllerState = {
  crossfader: 0,
  decks: Array.from({ length: 4 }, () => ({ lows: 0, mids: 0, highs: 0, volume: 0, rate: 0.5 })),
};

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

  for (const action of actions) {
    if (action.type === 'value') {
      const deck = action.deck;
      const innerState: any = deck ? state.decks[deck - 1] : state;
      if (action.control.type in innerState) {
        innerState[action.control.type] = action.value;
      }
    }
  }
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

function faderView(
  value: number,
  options: {
    thumbWidth?: number;
    trackHeight?: number,
    inverted?: boolean,
  } = {}
): Component {
  const thumbSize = { x: options.thumbWidth ?? 40, y: 10 };
  const trackSize = { x: 5, y: options.trackHeight ?? 100 };
  return zStack([
    rectangle(trackSize, { fill: 'gray' }),
    translation(
      rectangle(thumbSize, { fill: 'black' }),
      { y: options.inverted ? value * trackSize.y : (1 - value) * trackSize.y }
    ),
  ], {
    vAlignment: 'top',
  });
}

function deckView(deckState: DeckState): Component {
  return hStack([
    faderView(deckState.rate),
  ]);
}

function eqView(deckState: DeckState): Component {
  // TODO
  return spacer();
}

function mixerView(deckState: DeckState): Component {
  return vStack([
    eqView(deckState),
    faderView(deckState.volume),
  ]);
}

function controllerView(state: ControllerState): Component {
  return hStack([
    padding(vStack([
      deckView(state.decks[0]),
      deckView(state.decks[1]),
    ])),
    ...state.decks.map(d => padding(mixerView(d))),
    padding(vStack([
      deckView(state.decks[1]),
      deckView(state.decks[2]),
    ])),
  ]);
}

function initializeView() {
  const canvas = document.getElementById('controller-view') as HTMLCanvasElement;
  const view = controllerView(state);

  render(view, canvas, { resizeToFit: true });
}

window.addEventListener('load', async () => {
  initializeMidi();
  initializeView();
});
