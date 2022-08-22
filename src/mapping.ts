import parseXml = require("@rgrove/parse-xml");

export class ControllerMapping {
  private constructor(
    private readonly xmlMapping: object,
    private readonly jsMappingSrc: string,
  ) {}

  static parse(xmlMappingSrc: string, jsMappingSrc: string): ControllerMapping {
    const xmlMapping = parseXml(xmlMappingSrc);
    return new ControllerMapping(xmlMapping, jsMappingSrc);
  }
}
