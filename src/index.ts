import {
  ExtensionContext,
  LanguageClient,
  LanguageClientOptions,
  OutputChannel,
  RevealOutputChannelOn,
  ServerOptions,
  TransportKind,
  window,
  workspace,
} from 'coc.nvim';
import path from 'path';
import { CustomInitializationFailedHandler } from './CustomInitializationFailedHandler';

export async function activate(context: ExtensionContext): Promise<void> {
  if (!workspace.getConfiguration('graphql').get<boolean>('enable', true)) return;

  const outputChannel: OutputChannel = window.createOutputChannel('GraphQL Language Server');

  const serverModule = context.asAbsolutePath(path.join('lib', 'server', 'server.js'));

  const debug = workspace.getConfiguration('vscode-graphql').get('debug', false);

  if (debug) {
    console.log('Extension "vscode-graphql" is now active!');
  }

  const debugOptions = {
    execArgv: ['--nolazy', '--inspect=localhost:6009'],
  };

  const serverOptions: ServerOptions = {
    run: {
      module: serverModule,
      transport: TransportKind.ipc,
    },
    debug: {
      module: serverModule,
      transport: TransportKind.ipc,
      options: { ...(debug ? debugOptions : {}) },
    },
  };

  const clientOptions: LanguageClientOptions = {
    documentSelector: [
      { scheme: 'file', language: 'graphql' },
      { scheme: 'file', language: 'javascript' },
      { scheme: 'file', language: 'javascriptreact' },
      { scheme: 'file', language: 'typescript' },
      { scheme: 'file', language: 'typescriptreact' },
    ],
    synchronize: {
      // TODO: should this focus on `graphql-config` documents, schema and/or includes?
      fileEvents: [
        workspace.createFileSystemWatcher(
          '/{graphql.config.*,.graphqlrc,.graphqlrc.*,package.json}',
          false,
          // ignore change events for graphql config, we only care about create, delete and save events
          true
        ),
        // these ignore node_modules and .git by default
        workspace.createFileSystemWatcher(
          '**/{*.graphql,*.graphqls,*.gql,*.js,*.mjs,*.cjs,*.esm,*.es,*.es6,*.jsx,*.ts,*.tsx}'
        ),
      ],
    },
    outputChannel: outputChannel,
    outputChannelName: 'GraphQL Language Server',
    revealOutputChannelOn: RevealOutputChannelOn.Never,
    initializationFailedHandler: CustomInitializationFailedHandler(outputChannel),
  };

  const client = new LanguageClient('vscode-graphql', 'GraphQL Language Server', serverOptions, clientOptions, debug);

  const clientLSPDisposable = client.start();
  context.subscriptions.push(clientLSPDisposable);
}
