import parseXml = require("@rgrove/parse-xml");
import { ControllerMapping } from ".";
import { Action } from "../action";
import { MidiMessage } from "../midi";

interface ControlMapping {
  group: string;
  key: string;
  status: number;
  midino: number;
}

interface MidiMapping {
  // TODO: Use Maps for efficiency?
  // Or perhaps only internally in ControllerMapping since it's
  // an implementation detail?
  controls: ControlMapping[];

  // TODO: Output mappings
  // output: OutputMapping[];
}

/**
 * Represents a DJ controller mapping using Mixxx's
 * mapping format.
 */
export class MixxxControllerMapping implements ControllerMapping {
  private constructor(
    private readonly xmlMapping: object,
    private readonly jsMappingSrc: string,
  ) {}

  /**
   * Parses a Mixxx-style controller mapping.
   * 
   * @param xmlMappingSrc The XML source of the mapping
   * @param jsMappingSrc The JS source of the mapping (if present)
   * @returns The controller mapping proxy
   */
  static parse(xmlMappingSrc: string, jsMappingSrc?: string): ControllerMapping {
    const xmlMapping = parseXml(xmlMappingSrc);
    return new MixxxControllerMapping(xmlMapping, jsMappingSrc);
  }

  toMidi(output: never): MidiMessage[] {
    // TODO
    return [];
  }

  fromMidi(msg: MidiMessage): Action[] {
    // TODO
    return [];
  }
}
