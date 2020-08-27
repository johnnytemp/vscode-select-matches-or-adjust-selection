import { ExtensionContext, commands } from 'vscode';
import { SelectMatchesOrAdjustSelectionConfig } from './SelectMatchesOrAdjustSelectionConfig';
import { SelectExprInSelectionCommand } from './SelectExprInSelectionCommand';
import { SelectNextExprFromCursorsCommand } from './SelectNextExprFromCursorsCommand';
import { SelectUpToNextExprFromCursorsCommand } from './SelectUpToNextExprFromCursorsCommand';
import { SelectExprInLineSelectionsCommand } from './SelectExprInLineSelectionsCommand';
import { SelectMatchesByPatternCommand } from './SelectMatchesByPatternCommand';
import { SelectMatchesRepeatLastCommand } from './SelectMatchesRepeatLastCommand';
import { SelectMatchesCommandBase } from './SelectMatchesCommandBase';

export class SelectMatchesOrAdjustSelectionModule {
  private _config : SelectMatchesOrAdjustSelectionConfig;
  // private _repeatLastCommand : QuickReplaceInSelectionRepeatLastCommand;
  private _lastSelectCommand : SelectMatchesCommandBase | null = null;
  private _selectExprInSelectionCommand : SelectExprInSelectionCommand;
  private _selectNextExprFromCursorsCommand : SelectNextExprFromCursorsCommand;
  private _selectUpToNextExprFromCursorsCommand : SelectUpToNextExprFromCursorsCommand;
  private _selectExprInLineSelectionsCommand : SelectExprInLineSelectionsCommand;
  private _selectMatchesByPatternCommand : SelectMatchesByPatternCommand;
  private _selectMatchesRepeatLastCommand : SelectMatchesRepeatLastCommand;

  private static _instance : SelectMatchesOrAdjustSelectionModule | undefined;

  public static getInstance() : SelectMatchesOrAdjustSelectionModule {
    if (SelectMatchesOrAdjustSelectionModule._instance === undefined) {
      SelectMatchesOrAdjustSelectionModule._instance = new SelectMatchesOrAdjustSelectionModule();
    }
    return SelectMatchesOrAdjustSelectionModule._instance;
  }

  private constructor() {
    this._config = new SelectMatchesOrAdjustSelectionConfig();
    // this._repeatLastCommand = new QuickReplaceInSelectionRepeatLastCommand();
    this._selectExprInSelectionCommand = new SelectExprInSelectionCommand();
    this._selectNextExprFromCursorsCommand = new SelectNextExprFromCursorsCommand();
    this._selectUpToNextExprFromCursorsCommand = new SelectUpToNextExprFromCursorsCommand();
    this._selectExprInLineSelectionsCommand = new SelectExprInLineSelectionsCommand();
    this._selectMatchesByPatternCommand = new SelectMatchesByPatternCommand();
    this._selectMatchesRepeatLastCommand = new SelectMatchesRepeatLastCommand();
  }

  public getConfig() : SelectMatchesOrAdjustSelectionConfig {
    return this._config;
  }

  /* public getRepeatLastCommand() : QuickReplaceInSelectionRepeatLastCommand {
    return this._repeatLastCommand;
  } */

  public getLastSelectCommand() : SelectMatchesCommandBase | null {
    return this._lastSelectCommand;
  }

  public setLastSelectCommand(command : SelectMatchesCommandBase | null) {
    this._lastSelectCommand = command;
  }

  public getSelectInSelectionCommand() : SelectExprInSelectionCommand {
    return this._selectExprInSelectionCommand;
  }

  public getSelectInLineSelectionsCommand() : SelectExprInLineSelectionsCommand {
    return this._selectExprInLineSelectionsCommand;
  }

  public getSelectNextExCommand() : SelectNextExprFromCursorsCommand {
    return this._selectNextExprFromCursorsCommand;
  }

  public getSelectUpToNextExCommand() : SelectUpToNextExprFromCursorsCommand {
    return this._selectUpToNextExprFromCursorsCommand;
  }

  public getAvailableInputAndSelectCommands() : SelectMatchesCommandBase[] {
    return [
      this.getSelectInSelectionCommand(),
      this.getSelectInLineSelectionsCommand(),
      this.getSelectNextExCommand(),
      this.getSelectUpToNextExCommand(),
    ];
  }

  public getInputAndSelectCommandById(id: string) : SelectMatchesCommandBase {
    switch (id) {
      default:
      case 'selectMatchesInSelection': return this.getSelectInSelectionCommand();
      case 'selectMatchesInLineSelections': return this.getSelectInLineSelectionsCommand();
      case 'selectNextMatchesFromCursors': return this.getSelectNextExCommand();
      case 'selectUpToNextMatchesFromCursors': return this.getSelectUpToNextExCommand();
    }
  }

  public getDefaultInputAndSelectCommand() : SelectMatchesCommandBase {
    return this.getSelectInSelectionCommand();
  }

  public getSelectMatchesByPatternCommand() : SelectMatchesByPatternCommand {
    return this._selectMatchesByPatternCommand;
  }

  public getSelectMatchesRepeatLastCommand() : SelectMatchesRepeatLastCommand {
    return this._selectMatchesRepeatLastCommand;
  }

  public clearHistory() {
    this.getSelectInSelectionCommand().clearHistory();
    this.getSelectMatchesByPatternCommand().clearHistory();
    this.setLastSelectCommand(null);
  }

  public onActivateExtension(context: ExtensionContext) {
    this.getConfig().reloadConfig();

    context.subscriptions.push(commands.registerCommand('selectMatchesOrAdjustSelection.selectMatchesInSelection', (args?: {}) => {
      this.getSelectInSelectionCommand().performCommandWithArgs(args);
    }));
    context.subscriptions.push(commands.registerCommand('selectMatchesOrAdjustSelection.selectMatchesInLineSelections', (args?: {}) => {
      this.getSelectInLineSelectionsCommand().performCommandWithArgs(args);
    }));
    context.subscriptions.push(commands.registerCommand('selectMatchesOrAdjustSelection.selectNextMatchesFromCursors', (args?: {}) => {
      this.getSelectNextExCommand().performCommandWithArgs(args);
    }));
    context.subscriptions.push(commands.registerCommand('selectMatchesOrAdjustSelection.selectUpToNextMatchesFromCursors', (args?: {}) => {
      this.getSelectUpToNextExCommand().performCommandWithArgs(args);
    }));

    context.subscriptions.push(commands.registerCommand('selectMatchesOrAdjustSelection.selectMatchesByPattern', (args?: {}) => {
      this.getSelectMatchesByPatternCommand().performCommandWithArgs(args);
    }));
    context.subscriptions.push(commands.registerCommand('selectMatchesOrAdjustSelection.repeatLastSelectMatches', () => {
      this.getSelectMatchesRepeatLastCommand().performCommand();
    }));

    context.subscriptions.push(commands.registerCommand('selectMatchesOrAdjustSelection.unselectSurroundingWhitespaces', () => {
      this.getSelectInSelectionCommand().performCommandWithArgs({
        target: "\\S+(\\s+\\S+)*"
      });
    }));
    context.subscriptions.push(commands.registerCommand('selectMatchesOrAdjustSelection.normalizeSelection', () => {
      this.getSelectInSelectionCommand().performCommandWithArgs({
        target: "?1,2;?s-g (\\s*)(.*\\S)?"
      });
    }));
  }

  public onDeactivateExtension() {
    this.clearHistory();
  }
}
