import * as vscode from 'vscode';
import * as cp from 'child_process';
import * as path from 'path';
import {
    LanguageClient,
    LanguageClientOptions,
    RevealOutputChannelOn,
    ServerOptions,
    Trace
} from 'vscode-languageclient/node';

let runTerminal: vscode.Terminal | undefined;
let statusBarItem: vscode.StatusBarItem;
let diagnosticCollection: vscode.DiagnosticCollection;
let lspClient: LanguageClient | undefined;
let lspRunning = false;

export function activate(context: vscode.ExtensionContext) {
    diagnosticCollection = vscode.languages.createDiagnosticCollection('nodus');

    statusBarItem = vscode.window.createStatusBarItem(
        vscode.StatusBarAlignment.Right,
        100
    );
    statusBarItem.text = '$(play) Nodus';
    statusBarItem.tooltip = 'Run Nodus file (Ctrl+Alt+N)';
    statusBarItem.command = 'nodus.runFile';

    const runDisposable = vscode.commands.registerCommand('nodus.runFile', runFile);
    const formatDisposable = vscode.commands.registerCommand('nodus.formatFile', formatFile);
    const debugDisposable = vscode.commands.registerCommand('nodus.debugFile', debugFile);

    context.subscriptions.push(
        diagnosticCollection,
        runDisposable,
        formatDisposable,
        debugDisposable,
        statusBarItem,
        vscode.window.onDidChangeActiveTextEditor(updateStatusBar),
        vscode.window.onDidCloseTerminal(t => {
            if (t === runTerminal) {
                runTerminal = undefined;
            }
        }),
        vscode.workspace.onDidSaveTextDocument(doc => lintDocument(doc)),
        vscode.workspace.onDidOpenTextDocument(doc => lintDocument(doc)),
        vscode.workspace.onDidCloseTextDocument(doc => {
            diagnosticCollection.delete(doc.uri);
        })
    );

    // DAP: resolve config so F5 works without a launch.json
    const configProvider = vscode.debug.registerDebugConfigurationProvider('nodus', {
        resolveDebugConfiguration(
            _folder: vscode.WorkspaceFolder | undefined,
            config: vscode.DebugConfiguration
        ): vscode.DebugConfiguration {
            if (!config.type && !config.request && !config.name) {
                const editor = vscode.window.activeTextEditor;
                if (editor && editor.document.languageId === 'nodus') {
                    config.type = 'nodus';
                    config.name = 'Debug Nodus File';
                    config.request = 'launch';
                    config.program = editor.document.uri.fsPath;
                }
            }
            if (!config.program) {
                const editor = vscode.window.activeTextEditor;
                if (editor && editor.document.languageId === 'nodus') {
                    config.program = editor.document.uri.fsPath;
                }
            }
            return config;
        }
    });

    // DAP: launch `nodus dap` as the debug adapter process
    const adapterFactory = vscode.debug.registerDebugAdapterDescriptorFactory('nodus', {
        createDebugAdapterDescriptor(
            _session: vscode.DebugSession
        ): vscode.DebugAdapterDescriptor {
            const nodusPath = nodusExecutable();
            return new vscode.DebugAdapterExecutable(nodusPath, ['dap']);
        }
    });

    context.subscriptions.push(configProvider, adapterFactory);

    // LSP: start `nodus lsp` and wire it as a LanguageClient
    startLanguageServer(context);

    // Lint any already-open .nd files on activation (skipped once LSP is running)
    vscode.workspace.textDocuments.forEach(doc => lintDocument(doc));

    updateStatusBar();
}

function startLanguageServer(context: vscode.ExtensionContext) {
    const config = vscode.workspace.getConfiguration('nodus');
    const lspCommand = config.get<string[]>('lspCommand', []);

    let serverOptions: ServerOptions;
    if (lspCommand.length > 0) {
        // User-supplied override — use as-is (supports dev source path)
        serverOptions = { command: lspCommand[0], args: lspCommand.slice(1) };
    } else {
        // Default: spawn installed nodus executable
        // On Windows, .bat files can't be spawned directly; wrap in cmd /c
        const nodus = nodusExecutable();
        serverOptions = process.platform === 'win32'
            ? { command: 'cmd', args: ['/c', nodus, 'lsp'] }
            : { command: nodus, args: ['lsp'] };
    }

    const outputChannel = vscode.window.createOutputChannel('Nodus Language Server');

    const clientOptions: LanguageClientOptions = {
        documentSelector: [
            { scheme: 'file', language: 'nodus' },
            { scheme: 'file', pattern: '**/*.nd' }
        ],
        outputChannel,
        traceOutputChannel: outputChannel,
        revealOutputChannelOn: RevealOutputChannelOn.Error,
    };

    lspClient = new LanguageClient(
        'nodus-lsp',
        'Nodus Language Server',
        serverOptions,
        clientOptions
    );

    lspClient.start().then(async () => {
        lspRunning = true;
        // Show errors in output channel only; use "nodus-lsp.trace.server": "verbose" to debug
        await lspClient!.setTrace(Trace.Off);
        // LSP publishes its own diagnostics — clear Phase 2 set to avoid duplicates
        diagnosticCollection.clear();
        const openNodus = vscode.workspace.textDocuments
            .filter(d => d.languageId === 'nodus' || d.uri.fsPath.endsWith('.nd'));
        outputChannel.appendLine(
            `[nodus-lsp] Language server started. Open .nd files: ${openNodus.length}`
        );
        openNodus.forEach(d =>
            outputChannel.appendLine(`  ${d.uri.toString()} (lang=${d.languageId})`)
        );
    }).catch((err: Error) => {
        // LSP failed to start — Phase 2 (nodus check) continues as fallback
        lspRunning = false;
        outputChannel.appendLine(`[nodus-lsp] Failed to start: ${err.message}`);
        outputChannel.show();
    });

    context.subscriptions.push(lspClient, outputChannel);
}

// --- Run ---

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

// --- Format ---

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
            vscode.commands.executeCommand('workbench.action.revertFile');
        }
    });
}

// --- Debug ---

async function debugFile() {
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
    await vscode.debug.startDebugging(undefined, {
        type: 'nodus',
        request: 'launch',
        name: 'Debug Nodus File',
        program: filePath
    });
}

// --- Diagnostics ---

function nodusExecutable(): string {
    return vscode.workspace.getConfiguration('nodus').get<string>('executablePath', 'nodus');
}

function lintDocument(document: vscode.TextDocument) {
    if (lspRunning) {
        return; // LSP publishes diagnostics via textDocument/publishDiagnostics
    }
    if (document.languageId !== 'nodus' || document.uri.scheme !== 'file') {
        return;
    }

    const filePath = document.uri.fsPath;
    const nodusPath = nodusExecutable();

    const cmd = process.platform === 'win32'
        ? `"${nodusPath}" check "${filePath}"`
        : `'${nodusPath}' check '${filePath}'`;

    cp.exec(cmd, (_error, _stdout, stderr) => {
        if (!stderr.trim()) {
            diagnosticCollection.delete(document.uri);
            return;
        }
        const diagnostics = parseNodusErrors(stderr, filePath, document);
        diagnosticCollection.set(document.uri, diagnostics);
    });
}

function parseNodusErrors(
    stderr: string,
    filePath: string,
    document: vscode.TextDocument
): vscode.Diagnostic[] {
    const diagnostics: vscode.Diagnostic[] = [];

    for (const line of stderr.split('\n')) {
        const trimmed = line.trim();
        if (!trimmed) {
            continue;
        }

        // "Prefix at /path/to/file.nd:LINE:COL: message"
        // Escape path for regex — handles Windows drive colons and spaces
        const escapedPath = filePath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const withPath = new RegExp(
            `at ${escapedPath}:(\\d+):(\\d+): (.+)$`
        );
        let m = trimmed.match(withPath);
        if (m) {
            diagnostics.push(makeDiagnostic(
                parseInt(m[1], 10) - 1,
                parseInt(m[2], 10) - 1,
                m[3],
                document
            ));
            continue;
        }

        // "Prefix at line N, col M: message" (no path in output)
        m = trimmed.match(/at line (\d+), col (\d+): (.+)$/);
        if (m) {
            diagnostics.push(makeDiagnostic(
                parseInt(m[1], 10) - 1,
                parseInt(m[2], 10) - 1,
                m[3],
                document
            ));
            continue;
        }

        // "Prefix: message" with no location — pin to first line
        m = trimmed.match(/^(?:Syntax error|Runtime error|Sandbox error|Error|[A-Za-z]+ error): (.+)$/);
        if (m) {
            diagnostics.push(makeDiagnostic(0, 0, m[1], document));
        }
    }

    return diagnostics;
}

function makeDiagnostic(
    line: number,
    col: number,
    message: string,
    document: vscode.TextDocument
): vscode.Diagnostic {
    const safeLine = Math.max(0, Math.min(line, document.lineCount - 1));
    const lineText = document.lineAt(safeLine);
    const safeCol = Math.max(0, Math.min(col, lineText.text.length));
    // Highlight from the error column to end of line
    const range = new vscode.Range(safeLine, safeCol, safeLine, lineText.text.length);
    return new vscode.Diagnostic(range, message, vscode.DiagnosticSeverity.Error);
}

// --- Status bar ---

function updateStatusBar() {
    const editor = vscode.window.activeTextEditor;
    if (editor && editor.document.languageId === 'nodus') {
        statusBarItem.show();
    } else {
        statusBarItem.hide();
    }
}

export async function deactivate() {
    runTerminal = undefined;
    if (lspClient) {
        await lspClient.stop();
    }
}
