import parseXml = require("@rgrove/parse-xml");

/**
 * Represents a Mixxx-style DJ controller mapping.
 * Usually a long-lived object since many controller scripts
 * maintain internal state.
 */
export class ControllerMapping {
  private constructor(
    private readonly xmlMapping: object,
    private readonly jsMappingSrc?: string,
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
    return new ControllerMapping(xmlMapping, jsMappingSrc);
  }
}
