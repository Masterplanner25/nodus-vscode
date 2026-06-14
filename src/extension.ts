import * as vscode from 'vscode';
import * as cp from 'child_process';
import * as path from 'path';

let runTerminal: vscode.Terminal | undefined;
let statusBarItem: vscode.StatusBarItem;

export function activate(context: vscode.ExtensionContext) {
    statusBarItem = vscode.window.createStatusBarItem(
        vscode.StatusBarAlignment.Right,
        100
    );
    statusBarItem.text = '$(play) Nodus';
    statusBarItem.tooltip = 'Run Nodus file (Ctrl+Alt+N)';
    statusBarItem.command = 'nodus.runFile';

    const runDisposable = vscode.commands.registerCommand('nodus.runFile', runFile);
    const formatDisposable = vscode.commands.registerCommand('nodus.formatFile', formatFile);

    context.subscriptions.push(
        runDisposable,
        formatDisposable,
        statusBarItem,
        vscode.window.onDidChangeActiveTextEditor(updateStatusBar),
        vscode.window.onDidCloseTerminal(t => {
            if (t === runTerminal) {
                runTerminal = undefined;
            }
        })
    );

    updateStatusBar();
}

async function runFile() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showErrorMessage('Nodus: no active editor');
        return;
    }
    if (editor.document.languageId !== 'nodus') {
        vscode.window.showErrorMessage('Nodus: active file is not a .nd file');
        return;
    }

    await editor.document.save();

    const filePath = editor.document.uri.fsPath;
    const config = vscode.workspace.getConfiguration('nodus');
    const nodusPath = config.get<string>('executablePath', 'nodus');
    const reuse = config.get<boolean>('reuseTerminal', false);

    if (reuse && runTerminal && !runTerminal.exitStatus) {
        runTerminal.show();
    } else {
        runTerminal = vscode.window.createTerminal({
            name: 'Nodus Run',
            cwd: path.dirname(filePath)
        });
        runTerminal.show();
    }

    const cmd = process.platform === 'win32'
        ? `${nodusPath} run "${filePath}"`
        : `${nodusPath} run '${filePath}'`;

    runTerminal.sendText(cmd);
}

async function formatFile() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showErrorMessage('Nodus: no active editor');
        return;
    }
    if (editor.document.languageId !== 'nodus') {
        vscode.window.showErrorMessage('Nodus: active file is not a .nd file');
        return;
    }

    await editor.document.save();

    const filePath = editor.document.uri.fsPath;
    const config = vscode.workspace.getConfiguration('nodus');
    const nodusPath = config.get<string>('executablePath', 'nodus');

    const cmd = process.platform === 'win32'
        ? `"${nodusPath}" fmt "${filePath}"`
        : `'${nodusPath}' fmt '${filePath}'`;

    cp.exec(cmd, (error, _stdout, stderr) => {
        if (error) {
            vscode.window.showErrorMessage(
                `Nodus fmt failed: ${stderr.trim() || error.message}`
            );
        } else {
            // Reload editor to reflect in-place changes from nodus fmt
            vscode.commands.executeCommand('workbench.action.revertFile');
        }
    });
}

function updateStatusBar() {
    const editor = vscode.window.activeTextEditor;
    if (editor && editor.document.languageId === 'nodus') {
        statusBarItem.show();
    } else {
        statusBarItem.hide();
    }
}

export function deactivate() {
    runTerminal = undefined;
}
