import { XmlElement, XmlNode } from "@rgrove/parse-xml";

/**
 * A type predicate for checking whether the given node
 * is an XML element.
 */
export function isXmlElement(node: XmlNode): node is XmlElement {
  return node.type === 'element';
}

/**
 * A convenience function for converting an array of
 * XML child nodes to an object.
 * 
 * @param children The array of children to convert
 * @returns An object keyed by the name of the child elements
 */
export function xmlToObject(xml: { children: XmlNode[] } | XmlNode[]): { [name: string]: XmlElement } {
  const obj: { [name: string]: XmlElement } = {};
  const children = Array.isArray(xml) ? xml : xml.children;

  for (const child of children) {
    if (isXmlElement(child)) {
      obj[child.name] = child;
    }
  }

  return obj;
}
