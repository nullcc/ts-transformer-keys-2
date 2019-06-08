import * as ts from 'typescript';
import transformer from './transformer';

export default function compile(filePaths: string[], writeFileCallback?: ts.WriteFileCallback) {
  const program = ts.createProgram(filePaths, {
    strict: true,
    noEmitOnError: true,
    suppressImplicitAnyIndexErrors: true,
    target: ts.ScriptTarget.ES5,
  });

  const tramsformers: ts.CustomTransformers = {
    before: [transformer(program)],
    after: [],
  };

  const { emitSkipped, diagnostics } = program.emit(undefined, writeFileCallback, undefined, false, tramsformers);

  if (emitSkipped) {
    throw new Error(diagnostics.map(diagnostic => diagnostic.messageText).join('\n'));
  }
}