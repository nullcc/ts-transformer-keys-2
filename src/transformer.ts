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
  return ts.createArrayLiteral(properties.map(property => ts.createLiteral(property)));
}

const getPropertiesOfSymbol = (symbol: any, outerLayerProperties: string[], symbolMap: any): string[] => {
  let properties: string[] = [];
  let propertyPathElements = JSON.parse(JSON.stringify(outerLayerProperties));
  const property = symbol.escapedName;
  propertyPathElements.push(property);
  properties.push(propertyPathElements.join('.'));

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

const getOutermostLayerPropertiesOfSymbol = (symbol: any, propertyPathElements: string[], symbolMap: any): string[] => {
  let properties: string[] = [];
  symbol.valueDeclaration.symbol.valueDeclaration.type.members.forEach((member: any) => {
    properties = properties.concat(getPropertiesOfSymbol(member.symbol, propertyPathElements, symbolMap));
  });
  return properties;
};

const getInnerLayerPropertiesOfSymbol = (symbol: any, propertyPathElements: string[], symbolMap: any): string[] => {
  let properties: string[] = [];
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
