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
 * Finds variables and functions bound at the top-level.
 * 
 * @param jsSrc A piece of JS source code
 * @returns Top-level bindings
 */
function findTopLevelBindings(jsSrc: string): string[] {
  const bindings: string[] = [];

  // TODO: This heuristic assumes that variables are top-level iff
  //       they have no indentation. It would be better to actually
  //       track scopes (e.g. by parsing curly brackets).
  const pattern = /^(?:var|function)\s+(\w+)/gm;

  let match: RegExpExecArray;
  while (match = pattern.exec(jsSrc)) {
    bindings.push(match[1]);
  }

  return bindings;
}

/**
 * Evaluates the given snippet of JS code and returns
 * variables and functions bound at the top level.
 * 
 * @param args Values to provide that will be in scope during execution
 * @param jsSrc A piece of JS source code
 * @returns An object holding variables and functions bound at the top level
 */
export function evalToContext(jsSrc: string, args: object = {}): object {
  // TODO: Global bindings a la 'varName = ...' still escape.
  // We should investigate isolating the execution context more
  // (web workers?) or at least rewrite them using a regex.
  const varNames = findTopLevelBindings(jsSrc);
  const argNames = Object.keys(args);
  const script = new Function(...argNames, `${jsSrc}; return { ${varNames.join(', ')} };`);
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
