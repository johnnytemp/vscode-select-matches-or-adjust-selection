import { window } from 'vscode';
import { SelectRule } from './SelectMatchesOrAdjustSelectionConfig';
import { SelectMatchesCommandBase } from './SelectMatchesCommandBase';
import { SelectMatchesOrAdjustSelectionModule } from './SelectMatchesOrAdjustSelectionModule';
import { SelectNextExprFromCursorsCommand } from './SelectNextExprFromCursorsCommand';
import { SelectUpToNextExprFromCursorsCommand } from './SelectUpToNextExprFromCursorsCommand';
import * as helper from './helper';

/**
 * SelectMatchesByPatternCommand class
 */
export class SelectMatchesByPatternCommand extends SelectMatchesCommandBase {
  private _lastRuleName : string = '';
  private _lastPatternSelectMethod : SelectMatchesCommandBase | null;
  private _underlyingCommand : SelectMatchesCommandBase | undefined;
  private _lastExtraOptions : string = '';

  public constructor(command?: SelectMatchesCommandBase) {
    super();
    this._lastPatternSelectMethod = null;
    this._underlyingCommand = command;
  }

  protected getSelectMatchesCommand(args? : any) : SelectMatchesCommandBase {
    if (this._underlyingCommand) {
      return this._underlyingCommand;
    }
    let module = this.getModule();
    return module.getInputAndSelectCommandById(args ? args.selectScope : '');
  }

  public getCommandType() : string {
    return 'rule';
  }

  protected allowSpecialPrefixInRegex() {
    return true;
  }

  protected getLastSelectRuleName() {
    return this._lastRuleName;
  }

  protected setLastSelectRuleName(name: string) {
    this._lastRuleName = name;
  }

  protected getLastPatternSelectMethod() : SelectMatchesCommandBase | null {
    return this._lastPatternSelectMethod;
  }

  protected setLastPatternSelectMethod(command : SelectMatchesCommandBase | null) {
    this._lastPatternSelectMethod = command;
  }

  public clearHistory() {
    this.setLastSelectRuleName('');
    this.setLastPatternSelectMethod(null);
    this._lastExtraOptions = '';
  }

  public performCommandWithArgs(args : any) {
    if (typeof args === 'object' && args.patternName !== undefined) {
      this.handleError(this.performSelectionWithRule(args.patternName, this.getSelectMatchesCommand(args), false, args.extraOptions));
      return;
    }
    let selectScopeCommand = args && args.selectScope ? this.getSelectMatchesCommand(args) : undefined;
    this.performCommand(selectScopeCommand);
  }

  public repeatCommand() {
    let module = this.getModule();
    let lastRuleName = this.getLastSelectRuleName();
    let lastSelectCommand = this.getLastPatternSelectMethod();
    this.handleError(this.performSelectionWithRule(lastRuleName, lastSelectCommand || module.getDefaultInputAndSelectCommand(), false, this._lastExtraOptions));
  }

  public performCommand(selectScopeCommand? : SelectMatchesCommandBase | undefined) {
    if (this._underlyingCommand !== undefined) {
      return this.performCommandWithSelectCommand(this._underlyingCommand);
    }
    if (selectScopeCommand) {
      return this.performCommandWithSelectCommand(selectScopeCommand);
    }
    let selectCommands = this.getModule().getAvailableInputAndSelectCommands();
    let lastSelectCommand = this.getLastPatternSelectMethod();
    if (lastSelectCommand) {
      let lastIndex = selectCommands.indexOf(lastSelectCommand);
      if (lastIndex !== -1) {
        selectCommands.splice(lastIndex, 1);
        selectCommands = [lastSelectCommand].concat(selectCommands);
      }
    }

    let commandsMap : { [name: string] : SelectMatchesCommandBase } = {};
    let methodNames = [];
    for (let command of selectCommands) {
      let name = command.getMethodName();
      methodNames.push(name);
      commandsMap[name] = command;
    }

    window.showQuickPick(methodNames, {
      placeHolder: 'Choose Select Scope or Esc to cancel...'
    }).then((methodName : string | undefined) => {
      if (methodName === undefined) {
        return;
      }
      let selectedCommand = commandsMap[methodName];
      this.setLastPatternSelectMethod(selectedCommand);
      this.performCommandWithSelectCommand(selectedCommand);
    });
  }

  public performCommandWithSelectCommand(selectMatchesCommand: SelectMatchesCommandBase) {
    let module = this.getModule();
    let lastRuleName = this.getLastSelectRuleName();

    let editor = window.activeTextEditor;
    let shouldShowUseSelectedText = false;
    if ((selectMatchesCommand instanceof SelectNextExprFromCursorsCommand || selectMatchesCommand instanceof SelectUpToNextExprFromCursorsCommand) &&
        editor &&
        editor.selections.length === 1 &&
        !editor.selection.isEmpty /* &&
        editor.selection.isSingleLine */) {
      shouldShowUseSelectedText = true;
    }

    this.showRuleChooser(module, shouldShowUseSelectedText, lastRuleName, false).then((ruleName : string | undefined) => {
      if (ruleName === '( Additional Options for Pattern... )') {
        this.showRuleChooser(module, shouldShowUseSelectedText, lastRuleName, true).then((ruleName : string | undefined) => {
          this.onRuleChosen(module, shouldShowUseSelectedText, selectMatchesCommand, ruleName, lastRuleName, true);
        });
        return;
      }
      this.onRuleChosen(module, shouldShowUseSelectedText, selectMatchesCommand, ruleName, lastRuleName, false);
    });
  }

  protected showRuleChooser(module : SelectMatchesOrAdjustSelectionModule, shouldShowUseSelectedText : boolean, lastRuleName : string, isAdditionalOptionsForPattern : boolean) : Thenable<string | undefined> {
    let rules = module.getConfig().getSelectRules();
    // let lastRuleName = this.getLastSelectRuleName();

    let ruleNames = [];
    if (lastRuleName !== '') {
      ruleNames.push('( Last Pattern: ' + lastRuleName + ' )');
      if (!isAdditionalOptionsForPattern) {
        ruleNames.push('( Additional Options for Pattern... )'); // always second item for easy access with Down-Arrow, Enter
        ruleNames.push('( Input Expressions... )'); // can access by typing "in", Enter. Input expressions alerady needs typing, so shouldn't be annoyed of typing "in".
        if (shouldShowUseSelectedText) {
          ruleNames.push('( Use Selected Text )');
        }
      }
    } else if (!isAdditionalOptionsForPattern) {
      ruleNames.push('( Input Expressions... )');
      ruleNames.push('( Additional Options for Pattern... )');
      if (shouldShowUseSelectedText) {
        ruleNames.push('( Use Selected Text )');
      }
    }
    ruleNames = ruleNames.concat(Object.keys(rules));

    return window.showQuickPick(ruleNames, {
      placeHolder: 'Choose Pattern to Select or Esc to cancel...'
    });
  }

  protected onRuleChosen(module : SelectMatchesOrAdjustSelectionModule, shouldShowUseSelectedText : boolean, selectMatchesCommand : SelectMatchesCommandBase, ruleName : string | undefined, lastRuleName : string, isAdditionalOptionsForPattern : boolean) {
    if (ruleName === undefined) {
      return;
    }
    if (ruleName.startsWith('( Last Pattern: ')) {
      ruleName = lastRuleName;
    } else {
      let isUseSelectedText = shouldShowUseSelectedText && ruleName === '( Use Selected Text )';
      if (isUseSelectedText || ruleName === '( Input Expressions... )') {
        this.setLastSelectRuleName(''); // also clear last rule, so that '( Input Expressions... )' is the first item for faster re-run.
        if (module.getLastSelectCommand() === this) {
          module.setLastSelectCommand(null);  // clear because last rule name is cleared. However, now the last command is copied at setLastCommand() if "repeatCommandUseCache" is true, and so this never occur in such case.
        }
        if (isUseSelectedText) {
          let editor = window.activeTextEditor;
          let searchTarget = '';
          if (editor) {
            searchTarget = editor.document.getText(editor.selection);
            searchTarget = searchTarget.match(/\r|\n/) ?
              helper.escapeLiteralAsRegexString(searchTarget).replace(/\n/g, "\\n").replace(/\r/g, "\\r") :
              '*' + searchTarget;
          }
          selectMatchesCommand.setLastSelectSearchTarget(searchTarget);
          module.setLastSelectCommand(selectMatchesCommand);
          selectMatchesCommand.performCommandWithArgs({ find: searchTarget });
        } else {
          selectMatchesCommand.performCommand();
        }
        return;
      } else {
        this.setLastSelectRuleName(ruleName);
      }
    }
    this.setLastPatternSelectMethod(selectMatchesCommand); // set last method, because if invoked by `args: { "selectScope": "x" }` it prompts for the pattern, but I prefer the selectScope is not remembered yet until the rule is chosen here.
    if (isAdditionalOptionsForPattern) {
      window.showInputBox({
        placeHolder: 'Additional options (e.g. "4" for 4th occurrence; "4d" to delete it)',
      }).then((extraOptions : string | undefined) => {
        if (extraOptions === undefined) {
          return;
        }
        this.handleError(this.performSelectionWithRule(ruleName || '', selectMatchesCommand, true, extraOptions));
      });
      return;
    }
    this.handleError(this.performSelectionWithRule(ruleName, selectMatchesCommand, true));
  }

  public performSelectionWithRule(patternName: string, selectMatchesCommand : SelectMatchesCommandBase, fromUserInput?: boolean, extraOptions?: string | undefined) : string | null {
    if (fromUserInput) {
      this._lastExtraOptions = extraOptions || '';
      this.getModule().setLastSelectCommand(this);
    }
    let rule = this.lookupRule(patternName);
    if (!rule) {
      return 'No such pattern - ' + patternName;
    }
    let regex : string = rule.find || '';
    if (extraOptions && extraOptions.length > 0 && extraOptions.match(/^[-,=|_A-Za-z0-9]+$/)) {
      let matches = regex.match(/^\?([0-9a-zA-Z](?=[|;]))?([|])?([-,=|_A-Za-z0-9]*);/);
      if (!matches) {
        matches = [''];
      }
      regex = '?' + extraOptions + (matches[1] || '') + (matches[2] || (matches[3] ? '|' : '')) + (matches[3] || '') + ';' + regex.substr(matches[0].length);
    }
    return selectMatchesCommand.performSelection(regex, this.getFlagsFromRule(rule), false, patternName);
  }

  protected getFlagsFromRule(rule : SelectRule) : string {
    // return this.getFlagsFromFlagsString(rule.flags || '');
    return this.addDefaultFlags();
  }

  private lookupRule(ruleName : string) : SelectRule | undefined {
    let rules = this.getModule().getConfig().getSelectRules();
    return rules[ruleName];
  }

}
