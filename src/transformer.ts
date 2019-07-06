import * as ts from 'typescript';
import * as path from 'path';

export default function transformer(program: ts.Program): ts.TransformerFactory<ts.SourceFile> {
  return (context: ts.TransformationContext) => (file: ts.SourceFile) => visitNodeAndChildren(file, program, context);
}

function visitNodeAndChildren(node: ts.SourceFile, program: ts.Program, context: ts.TransformationContext): ts.SourceFile;
function visitNodeAndChildren(node: ts.Node, program: ts.Program, context: ts.TransformationContext): ts.Node;
function visitNodeAndChildren(node: ts.Node, program: ts.Program, context: ts.TransformationContext): ts.Node {
  return ts.visitEachChild(visitNode(node, program), childNode => visitNodeAndChildren(childNode, program, context), context);
}

interface InterfaceProperty {
  name: string;
  optional: boolean;
  type: string;
}

let symbolMap = {};

const convertMapToObj = (aMap: any) => {
  const obj = {};
  aMap.forEach((v: any, k: any) => { obj[k] = v });
  return obj;
};

function visitNode(node: ts.Node, program: ts.Program): ts.Node {
  if (node.kind === ts.SyntaxKind.SourceFile) {
    const path = node['path'];
    // use source file path to create a namespace for symbols
    symbolMap = { ...symbolMap, [path]: convertMapToObj(node['locals']) };
  }
  const typeChecker = program.getTypeChecker();
  if (!isKeysCallExpression(node, typeChecker)) {
    return node;
  }
  if (!node.typeArguments) {
    return ts.createArrayLiteral([]);
  }
  const type = typeChecker.getTypeFromTypeNode(node.typeArguments[0]);
  let properties: any[] = [];
  const symbols = typeChecker.getPropertiesOfType(type);
  symbols.forEach(symbol => {
    properties = [ ...properties, ...getPropertiesOfSymbol(symbol, [], symbolMap) ];
  });

  return ts.createArrayLiteral(properties.map(property => ts.createRegularExpressionLiteral(JSON.stringify(property))));
}

const getPropertiesOfSymbol = (symbol: any, outerLayerProperties: InterfaceProperty[], symbolMap: any): InterfaceProperty[] => {
  let properties: InterfaceProperty[] = [];
  let propertyPathElements = JSON.parse(JSON.stringify(outerLayerProperties.map(property => property)));
  const property = symbol.escapedName;
  propertyPathElements.push(property);
  let optional = true;
  for (const declaration of symbol.declarations) {
    if (declaration.questionToken === undefined) {
      optional = false;
      break;
    }
  }
  const propertyTypes: string[] = [];
  for (const declaration of symbol.declarations) {
    const propertyType = getPropertyType(declaration.type);
    if (!propertyTypes.includes(propertyType)) {
      propertyTypes.push(propertyType);
    }
  }
  const key = {
    name: propertyPathElements.join('.'),
    optional,
    type: propertyTypes.join(' | ')
  } as InterfaceProperty;
  properties.push(key);

  if (isOutermostLayerSymbol(symbol)) {
    const outermostLayerPropertiesOfSymbol = getOutermostLayerPropertiesOfSymbol(symbol, propertyPathElements, symbolMap);
    properties = properties.concat(outermostLayerPropertiesOfSymbol);
  } else if (isInnerLayerSymbol(symbol)) {
    let internalSymbolMap = {};
    if (symbol.valueDeclaration.symbol.valueDeclaration.name.flowNode.container) {
      internalSymbolMap = {
        ...internalSymbolMap,
        ...convertMapToObj(symbol.valueDeclaration.symbol.valueDeclaration.name.flowNode.container.locals),
      };
    } else {
      internalSymbolMap = symbolMap;
    }
    const sourceFileName = getSourceFileNameOfSymbol(symbol);
    let sourceFileSymbolMap = {};
    if (sourceFileName) {
      sourceFileSymbolMap = internalSymbolMap[sourceFileName.toLowerCase()];
    } else {
      sourceFileSymbolMap = internalSymbolMap;
    }
    const innerLayerPropertiesOfSymbol = getInnerLayerPropertiesOfSymbol(symbol, propertyPathElements, sourceFileSymbolMap);
    properties = properties.concat(innerLayerPropertiesOfSymbol);
  }
  return properties;
};

const isOutermostLayerSymbol = (symbol: any): boolean => {
  return symbol.valueDeclaration && symbol.valueDeclaration.symbol.valueDeclaration.type.members;
};

const getOutermostLayerPropertiesOfSymbol = (symbol: any, propertyPathElements: InterfaceProperty[], symbolMap: any): InterfaceProperty[] => {
  let properties: InterfaceProperty[] = [];
  symbol.valueDeclaration.symbol.valueDeclaration.type.members.forEach((member: any) => {
    properties = properties.concat(getPropertiesOfSymbol(member.symbol, propertyPathElements, symbolMap));
  });
  return properties;
};

const getInnerLayerPropertiesOfSymbol = (symbol: any, propertyPathElements: InterfaceProperty[], symbolMap: any): InterfaceProperty[] => {
  let properties: InterfaceProperty[] = [];
  if (symbolMap && symbolMap[symbol.valueDeclaration.symbol.valueDeclaration.type.typeName.escapedText]) {
    let members = [];
    if (symbolMap[symbol.valueDeclaration.symbol.valueDeclaration.type.typeName.escapedText].members) {
      members = symbolMap[symbol.valueDeclaration.symbol.valueDeclaration.type.typeName.escapedText].members;
    } else {
      members = symbolMap[symbol.valueDeclaration.symbol.valueDeclaration.type.typeName.escapedText].declarations[0].type.members.map((member: any) => member.symbol);
    }
    members.forEach((member: any) => {
      properties = properties.concat(getPropertiesOfSymbol(member, propertyPathElements, symbolMap));
    });
  }
  return properties;
};

const isInnerLayerSymbol = (symbol: any): boolean => {
  return symbol.valueDeclaration && symbol.valueDeclaration.symbol.valueDeclaration.type.typeName;
};

const getSourceFileNameOfSymbol = (obj: any): any => {
  if (!obj) {
    return null;
  }
  const objParent = obj.parent;
  if (objParent && objParent.valueDeclaration) {
    return objParent.valueDeclaration.fileName;
  }
  return getSourceFileNameOfSymbol(objParent);
};

const getPropertyType = (propertySignature: ts.PropertySignature): string => {
  let kind;
  if (propertySignature.kind) {
    kind = propertySignature.kind;
  }
  switch (kind) {
    case ts.SyntaxKind.StringKeyword:
      return 'string';
    case ts.SyntaxKind.NumberKeyword:
      return 'number';
    case ts.SyntaxKind.BooleanKeyword:
      return 'boolean';
    case ts.SyntaxKind.FunctionKeyword:
      return 'function';
    case ts.SyntaxKind.ObjectKeyword:
      return 'object';
    case ts.SyntaxKind.AnyKeyword:
      return 'any';
    case ts.SyntaxKind.NullKeyword:
      return 'null';
    case ts.SyntaxKind.KeyOfKeyword:
      return 'keyOf';
    case ts.SyntaxKind.ArrayType:
      return `${getPropertyType((<ts.ArrayTypeNode>(propertySignature as any)).elementType as any)}[]`;
    case ts.SyntaxKind.UnionType:
      return uniq((<ts.UnionTypeNode>(propertySignature as any)).types.map(type => getPropertyType(type as any))).join(' | ');
    default:
      return 'any';
  }
};

const uniq = (array: string[]): string[] => {
  const temp = [];
  for (const e of array) {
    if(temp.indexOf(e) == -1){
      temp.push(e);
    }
  }
  return temp;
};

const indexTs = path.join(__dirname, '../index.ts');
function isKeysCallExpression(node: ts.Node, typeChecker: ts.TypeChecker): node is ts.CallExpression {
  if (!ts.isCallExpression(node)) {
    return false;
  }
  const signature = typeChecker.getResolvedSignature(node);
  if (typeof signature === 'undefined') {
    return false;
  }
  const { declaration } = signature;
  return !!declaration
    && !ts.isJSDocSignature(declaration)
    && (path.join(declaration.getSourceFile().fileName) === indexTs)
    && !!declaration.name
    && declaration.name.getText() === 'keys';
}
