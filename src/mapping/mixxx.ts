import { XmlDocument, XmlElement } from "@rgrove/parse-xml";
import parseXml = require("@rgrove/parse-xml");
import { ControllerMapping, MappingInfo } from ".";
import { Action } from "../action";
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
    const scriptContext = jsMappingSrc ? evalToContext(jsMappingSrc) : {};
    return new MixxxControllerMapping(midiMapping, scriptContext);
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
    const value = msg.data[1] / 0x7f;
    const deck = deckFromGroup(control.group);

    if (control.options.includes('script-binding')) {
      // Handle script bindings
      const handler = getByKeyPath(this.scriptContext, control.key.split('.'));
      if (handler) {
        handler();
      }
    } else {
      // Handle normal bindings
      // TODO: Factor out press parsing into separate function to reduce boilerplate?

      // Parse simple events
      switch (control.key) {
      case 'play':
        return [{ type: 'press', control: { type: 'play' }, deck, down }];
      case 'cue_default':
        return [{ type: 'press', control: { type: 'cue' }, deck, down }];
      case 'start_stop':
        return [{ type: 'press', control: { type: 'stopAtStart' }, deck, down }];
      case 'loop_halve':
        return [{ type: 'press', control: { type: 'loopResize', factor: 0.5 }, deck, down }];
      case 'loop_double':
        return [{ type: 'press', control: { type: 'loopResize', factor: 2 }, deck, down }];
      case 'beatloop_activate':
        return [{ type: 'press', control: { type: 'loopToggle' }, deck, down }];
      case 'sync_enabled':
        return [{ type: 'press', control: { type: 'sync' }, deck, down }];
      case 'volume':
        return [{ type: 'value', control: { type: 'volume' }, deck, value }];
      case 'pregain':
        return [{ type: 'value', control: { type: 'gain' }, deck, value }];
      case 'crossfader':
        return [{ type: 'value', control: { type: 'crossfader' }, value }];
      default:
        break;
      }

      // Parse EQ events
      if (control.group.includes('EqualizerRack')) {
        switch (control.key) {
        case 'parameter1':
          return [{ type: 'value', control: { type: 'lows' }, deck, value }];
        case 'parameter2':
          return [{ type: 'value', control: { type: 'mids' }, deck, value }];
        case 'parameter3':
          return [{ type: 'value', control: { type: 'highs' }, deck, value }];
        }
      }

      // Parse parameterized events
      // TODO: Deal with fractions?
      const beatloopToggle = /beatloop_(\d+)_toggle/.exec(control.key);
      if (beatloopToggle) {
        return [{ type: 'press', control: { type: 'loopToggle', beats: parseInt(beatloopToggle[1]) }, deck, down }];
      }
    }

    return [];
  }

  prepareOutgoing(output: Output): MidiMessage[] {
    // TODO
    return [];
  }
}
