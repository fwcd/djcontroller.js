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
 * @param xml The array of children or node containing children.
 * @returns An object keyed by the name of the child elements
 */
export function xmlChildrenToObject(xml: { children: XmlNode[] } | XmlNode[]): { [name: string]: XmlElement } {
  const obj: { [name: string]: XmlElement } = {};
  const children = Array.isArray(xml) ? xml : xml.children;

  for (const child of children) {
    if (isXmlElement(child)) {
      obj[child.name] = child;
    }
  }

  return obj;
}

/**
 * Evaluates the given snippet of JS code and returns
 * variables and functions bound at the top level.
 * 
 * @param args Values to provide that will be in scope during execution
 * @param jsSrc A piece of JS source code
 * @param returnVarName The variable name to return
 * @returns An object holding variables and functions bound at the top level
 */
export function evalScript(jsSrc: string, args: object = {}, returnVarName?: string): any {
  // TODO: Global bindings a la 'varName = ...' still escape.
  // We should investigate isolating the execution context more
  // (web workers?) or at least rewrite them using a regex.
  const argNames = Object.keys(args);
  const script = new Function(...argNames, `${jsSrc}; return ${returnVarName ?? 'undefined'};`);
  return script(...argNames.map(a => args[a]));
}

/**
 * Fetches a nested value by key path.
 * 
 * @param value The object to key into
 * @param keyPath The path into the object
 * @returns The value keyed by this path in `value`
 */
export function getByKeyPath(value: object, ...keyPath: string[]): any {
  return keyPath.reduce((acc, key) => acc ? acc[key] : undefined, value);
}
