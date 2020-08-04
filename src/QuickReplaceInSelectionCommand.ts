import { window, TextEditor, TextDocument, Selection, Position, Range } from 'vscode';

/**
 * QuickReplaceInSelectionCommand class
 */
export class QuickReplaceInSelectionCommand {
  public performCommand() {
    window.showInputBox().then((target: string | undefined) => {
      if (target !== undefined) {
        window.showInputBox().then((replacement: string | undefined) => {
          if (replacement !== undefined) {
            this.performReplacement(target, replacement);
          }
        })
      }
    });
  }

  public performReplacement(target: string, replacement: string) {
    let editor = window.activeTextEditor;
    if (!editor) {
      return;
    }

    let document = editor.document;
    let selections = editor.selections;
    let numSelections = selections.length;
    if (numSelections <= 1 && (numSelections == 0 || editor.selections[0].isEmpty)) {
      selections = [this.getWholeDocumentSelection(document)];
    }

    let ranges : Range[] = [];
    let texts : string[] = [];
    this.computeReplacements(target, replacement, document, selections, ranges, texts);
    console.log(ranges, texts);

    // do editor text replacements in a batch
    this.replaceTexts(editor, ranges, texts);

    // window.showInformationMessage("Replaced from \"" + target + "\" to \"" + replacement + "\"");
  }

  public getWholeDocumentSelection(document: TextDocument) {
    let documentLastPosition = document.lineAt(document.lineCount - 1).rangeIncludingLineBreak.end;
    return new Selection(new Position(0, 0), documentLastPosition);
  }

  public computeReplacements(target : string, replacement : string, document : TextDocument, selections : Selection[], ranges : Range[], texts : string[]) {
    let regex = new RegExp(target, 'g');
    let numSelections = selections.length;
    for (let i: number = 0; i < numSelections; i++) { // replace all selections or whole document
      let sel = selections[i];
      let text = document.getText(sel);
      text = text.replace(regex, replacement);
      ranges.push(sel);
      texts.push(text);
    }
  }

  public replaceTexts(editor: TextEditor, ranges: Range[], texts: string[]) : Thenable<boolean> {
    return editor.edit(editBuilder => {
      ranges.forEach((range, index) => {
          editBuilder.replace(range, texts[index]);
      });
  });
  }
}