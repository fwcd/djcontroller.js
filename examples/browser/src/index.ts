import { MidiMessage, MixxxControllerMapping } from 'dj-controller';
import type { ControllerMapping } from 'dj-controller';
import type { ControllerState } from './state';
import { controllerView } from './ui';
import { render } from './components';

// Load the mappings
const context = require.context('../controllers', true, /\.(midi\.xml|js)/);
const mappingFiles = new Map<string, string>();

for (const path of context.keys()) {
  const splitPath = path.split('/');
  const fileName = splitPath[splitPath.length - 1];
  mappingFiles.set(fileName, context(path));
}

// The DJ controller state.
const state: ControllerState = {
  crossfader: 0,
  decks: Array.from({ length: 4 }, () => ({ gain: 0.5, lows: 0.5, mids: 0.5, highs: 0.5, volume: 0, rate: 0.5 })),
};

// Set up an example mapping (in this case the MC7000 mapping)
let mapping: ControllerMapping | undefined;

function renderView() {
  const canvas = document.getElementById('controller-view') as HTMLCanvasElement;
  const view = controllerView(state);

  render(view, canvas, { resizeToFit: true });
}

function initializeMappingPicker() {
  const mappingPicker = document.getElementById('mapping-picker') as HTMLSelectElement;

  function reloadMapping() {
    const xmlFileName = mappingPicker.options[mappingPicker.selectedIndex].value;
    // TODO: Read scripts from XML file instead (perhaps in MixxxControllerMapping.parse
    //       by passing all mappingFiles).
    const jsFileName = xmlFileName.replace(/\.midi\.xml$/, '.js');
    const xmlMappingSrc = mappingFiles.get(xmlFileName);
    const jsMappingSrc = mappingFiles.get(jsFileName);
    mapping = MixxxControllerMapping.parse(xmlMappingSrc, jsMappingSrc);
    renderView();
  }

  for (const fileName of mappingFiles.keys()) {
    if (fileName.endsWith('.midi.xml')) {
      const mappingName = fileName.split('.')[0];
      const option = document.createElement('option');
      option.value = fileName;
      option.innerText = mappingName;
      mappingPicker.appendChild(option);
    }
  }

  mappingPicker.addEventListener('change', () => {
    reloadMapping();
  });
  reloadMapping();
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
  initializeMappingPicker();
  renderView();
});
