import { XmlDocument, XmlElement } from "@rgrove/parse-xml";
import parseXml = require("@rgrove/parse-xml");
import { ControllerMapping, MappingInfo } from ".";
import { Action, BaseAction, PressAction, PressControl, ValueAction, ValueControl } from "../action";
import { MidiMessage } from "../midi";
import { Output } from "../output";
import { evalToContext, getByKeyPath, isXmlElement, xmlToObject } from "../utils";

interface BaseMapping {
  group: string;
  key: string;
  status: number;
  midino: number;
}

interface ControlMapping extends BaseMapping {
  options: string[];
}

interface OutputMapping extends BaseMapping {
  minimum?: number;
  maximum?: number;
  on?: number;
  off?: number;
}

interface MidiMapping {
  info: MappingInfo;
  // TODO: Use Maps for efficiency?
  // Or perhaps only internally in ControllerMapping since it's
  // an implementation detail?
  controls: ControlMapping[];
  outputs: OutputMapping[];
}

function parseMappingInfo(xml: XmlElement): MappingInfo {
  const childs = xmlToObject(xml);
  return {
    name: childs.name?.text,
    author: childs.author?.text,
    description: childs.description?.text,
  };
}

function parseBaseMapping(xml: XmlElement): BaseMapping {
  const childs = xmlToObject(xml);
  return {
    group: childs.group.text,
    key: childs.key.text,
    status: parseInt(childs.status.text),
    midino: parseInt(childs.midino.text),
  };
}

function parseControlMapping(xml: XmlElement): ControlMapping {
  const childs = xmlToObject(xml);
  return {
    ...parseBaseMapping(xml),
    options: childs.options.children.flatMap(c => isXmlElement(c) ? [c.name.toLowerCase()] : []),
  };
}

function parseOutputMapping(xml: XmlElement): OutputMapping {
  // TODO
  const childs = xmlToObject(xml);
  return {
    ...parseBaseMapping(xml),
  };
}

function parseMidiMapping(xml: XmlDocument): MidiMapping {
  const preset = xml.root;
  const childs = isXmlElement(preset) ? xmlToObject(preset) : null;
  const controller = childs.controller ? xmlToObject(childs.controller.children) : {};
  return {
    info: childs.info ? parseMappingInfo(childs.info) : {},
    controls: controller?.controls.children.flatMap(c => isXmlElement(c) ? [parseControlMapping(c)] : []) ?? [],
    outputs: controller?.outputs.children.flatMap(c => isXmlElement(c) ? [parseOutputMapping(c)] : []) ?? [],
  };
}

function deckFromGroup(group: string): number | null {
  const match = /\[Channel(\d+)\]/.exec(group);
  return match ? parseInt(match[1]) : null;
}

/** Creates a `PressAction` from the given mapping and `down` state. */
function makePressAction(group: string, key: string, down: boolean): PressAction | null {
  const deck = deckFromGroup(group);
  let control: PressControl | undefined;

  switch (key) {
  case 'play':              control = { type: 'play' };                    break;
  case 'cue_default':       control = { type: 'cue' };                     break;
  case 'start_stop':        control = { type: 'stopAtStart' };             break;
  case 'loop_halve':        control = { type: 'loopResize', factor: 0.5 }; break;
  case 'loop_double':       control = { type: 'loopResize', factor: 2 };   break;
  case 'beatloop_activate': control = { type: 'loopToggle' };              break;
  case 'sync_enabled':      control = { type: 'sync' };                    break;
  default:                                                                 break;
  }

  // Handle parameterized keys
  // TODO: Deal with fractions?
  const beatloopToggle = /beatloop_(\d+)_toggle/.exec(key);
  if (beatloopToggle) {
    control = { type: 'loopToggle', beats: parseInt(beatloopToggle[1]) };
  }

  return control ? { type: 'press', control, deck, down } : null;
}

/** Creates a `ValueAction` from the given mapping and `value`. */
function makeValueAction(group: string, key: string, value: number): ValueAction | null {
  const deck = deckFromGroup(group);
  let control: ValueControl;

  switch (key) {
  case 'volume':     control = { type: 'volume' };     break;
  case 'pregain':    control = { type: 'gain' };       break;
  case 'crossfader': control = { type: 'crossfader' }; break;
  case 'rate':       control = { type: 'rate' };       break;
  default:                                             break;
  }

  // Handle EQ
  if (group.includes('EqualizerRack')) {
    switch (key) {
    case 'parameter1': control = { type: 'lows' };  break;
    case 'parameter2': control = { type: 'mids' };  break;
    case 'parameter3': control = { type: 'highs' }; break;
    default:                                        break;
    }
  }

  return control ? { type: 'value', control, value, deck } : null;
}

/**
 * Provides the same API as the `engine` object in the script.
 * It, however, doesn't actually change any values directly,
 * instead it writes actions to the passed array (which is
 * shared with the MixxxControllerMapping instance).
 */
class InScriptEngineProxy {
  constructor(private readonly sharedActions: Action[]) {}

  getValue(group: string, key: string): number {
    // TODO: Support getValue (this would involve passing some context of the DJ
    //       application's state to the ControllerMapping and then here)
    throw new Error('engine.getValue is not supported yet!');
  }

  setValue(group: string, key: string, value: number) {
    const action = makeValueAction(group, key, value);
    if (action) {
      this.sharedActions.push(action);
    }
  }

  setParameter(group: string, key: string, value: number) {
    this.setValue(group, key, value);
  }
}

/**
 * Provides the same API as the `script` object in the script.
 */
class InScriptScriptProxy {
  deckFromGroup(group: string): number {
    return deckFromGroup(group);
  }
}

/**
 * Represents a DJ controller mapping using Mixxx's
 * mapping format.
 */
export class MixxxControllerMapping implements ControllerMapping {
  // TODO: Investigate whether MIDI message ordering is guaranteed, e.g.
  // whether multi-messages for different channels could be interleaved
  // (and thereby introduce a race condition)

  /** The last received message. Stored to handle multi-messages. */
  private lastMsg?: MidiMessage;

  private constructor(
    private readonly midiMapping: MidiMapping,
    private readonly scriptContext: object,
    private readonly sharedActions: Action[],
  ) {}

  /**
   * Parses a Mixxx controller mapping.
   * 
   * @param xmlMappingSrc The XML source of the mapping
   * @param jsMappingSrc The JS source of the mapping (if present)
   * @returns The controller mapping
   */
  static parse(xmlMappingSrc: string, jsMappingSrc?: string): MixxxControllerMapping {
    const xmlMapping = parseXml(xmlMappingSrc);
    const midiMapping = parseMidiMapping(xmlMapping);
    const sharedActions: Action[] = [];
    const scriptContext = jsMappingSrc ? evalToContext(jsMappingSrc, {
      engine: new InScriptEngineProxy(sharedActions),
      script: new InScriptScriptProxy(),
      print: console.log,
    }) : {};
    return new MixxxControllerMapping(midiMapping, scriptContext, sharedActions);
  }

  get info(): MappingInfo {
    return this.midiMapping.info;
  }

  handleIncoming(msg: MidiMessage): Action[] {
    // Update last message
    const lastMsg = this.lastMsg;
    this.lastMsg = msg;

    // Find an associated control for the message's status/no-combo
    const control = this.midiMapping.controls.find(c => c.status === msg.status && c.midino === msg.data[0]);
    if (!control) {
      return [];
    }

    // Extract some commonly used info
    const down = msg.data[1] > 0;
    const rawValue = msg.data[1];
    const value = msg.data[1] / 0x7f;
    const deck = deckFromGroup(control.group);

    if (control.options.includes('script-binding')) {
      // Handle script bindings
      const handler = getByKeyPath(this.scriptContext, ...control.key.split('.'));
      if (handler) {
        this.sharedActions.length = 0;
        // TODO: Investigate whether these parameters are actually correct
        handler(deck, control, rawValue, msg.status, control.group);
        return this.sharedActions;
      }
    } else {
      // Handle normal bindings
      const action = makePressAction(control.group, control.key, down)
                  ?? makeValueAction(control.group, control.key, value);
      if (action) {
        return [action];
      }
    }

    // Fall back to no actions
    return [];
  }

  prepareOutgoing(output: Output): MidiMessage[] {
    // TODO
    return [];
  }
}
