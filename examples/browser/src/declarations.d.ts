// https://stackoverflow.com/questions/58149937/how-to-import-custom-file-types-in-typescript

// ...to satisfy the typechecker when importing controller mappings via
// Webpack 5 'asset/source' modules.

declare module "*.xml" {
  const value: string;
  export default value;
}

declare module "*.js" {
  const value: string;
  export default value;
}
