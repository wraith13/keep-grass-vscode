'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
//import * as request from 'request';
var request = require('request');

module rx {
    export function get(url: string)
        : Thenable<{ error: any, response: any, body: any }>
    {
        return new Promise
        (
            resolve => request.get
            (
                url,
                (error : string, response : string, body : string) => resolve
                (
                    {
                        error,
                        response,
                        body
                    }
                )
            )
        );
    }
    export function execute(data: any)
        : Thenable<{ error: any, response: any, body: any }>
    {
        return new Promise
        (
            resolve => request
            (
                data,
                (error : string, response : string, body : string) => resolve
                (
                    {
                        error,
                        response,
                        body
                    }
                )
            )
        );
    }
}

export module KeepGrass
{
    function getConfiguration<type>(key?: string): type
    {
        var configuration = vscode.workspace.getConfiguration("keep-grass-vscode");
        return key ?
            configuration[key] :
            configuration;
    }

    export function registerCommand(context: vscode.ExtensionContext): void
    {
        var statusBarItem = new StatusBarItem();
        context.subscriptions.push(statusBarItem);
        context.subscriptions.push
        (
            vscode.commands.registerCommand
            (
                'keep-grass-vscode.update', update
            )
        );
        statusBarItem.updateWordCount();
    }

    export async function update() : Promise<void>
    {
        var user = getConfiguration("user");
        if (null !== user && undefined !== user)
        {
            let { error, response, body } = await rx.get(`https://github.com/${user}.atom`);
            if (error)
            {
                console.error(error);
            }
            else
            if (response.statusCode === 200)
            {
                //console.log(body);
                var lastUpdate = getLastUpdate(body);
                console.log(lastUpdate);
                if (lastUpdate)
                {
                    console.log(lastUpdate.toLocaleString());
                }
            }
        }
    }

    function parseISODate(source : string) : Date
    {
        return new Date(Date.parse(source.replace("T", " ")));
    }

    function getLastUpdate(xml : string) : Date | null
    {
        var match = /<updated>(.*?)<\/updated>/.exec(xml);
        //console.log(match ? `${match[1]} ${match[2]}`: null);
        return match ? new Date(parseISODate(match[1])): null;
    }

    export function numberToByteString(value : number) : string
    {
        if (value <= 0.0)
        {
            return "00";
        }
        if (1.0 <= value)
        {
            return "ff";
        }
        return ("00" +Math.floor(value *255).toString(16)).substr(-2);
    }
    export function MakeLeftTimeColor(LeftTimeRate : number) : string
    {
        return numberToByteString(1.0 - LeftTimeRate)
            + numberToByteString(Math.min(0.5, LeftTimeRate))
            + numberToByteString(0.0);
    }

    class StatusBarItem
    {

        private _statusBarItem: vscode.StatusBarItem;

        public updateWordCount()
        {

            // Create as needed
            if (!this._statusBarItem)
            {
                this._statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right);
            }

            this._statusBarItem.text = "🌱！！！！";
            this._statusBarItem.color = "#FF8888";
            this._statusBarItem.show();

            /*
            // Get the current text editor
            let editor = vscode.window.activeTextEditor;
            if (!editor) {
                this._statusBarItem.hide();
                return;
            }

            let doc = editor.document;

            // Only update status if an Markdown file
            if (doc.languageId === "markdown") {
                let wordCount = this._getWordCount(doc);

                // Update the status bar
                this._statusBarItem.text = wordCount !== 1 ? `${wordCount} Words` : '1 Word';
                this._statusBarItem.show();
            } else {
                this._statusBarItem.hide();
            }*/
        }

        public _getWordCount(doc: vscode.TextDocument): number
        {

            let docContent = doc.getText();

            // Parse out unwanted whitespace so the split is accurate
            docContent = docContent.replace(/(< ([^>]+)<)/g, '').replace(/\s+/g, ' ');
            docContent = docContent.replace(/^\s\s*/, '').replace(/\s\s*$/, '');
            let wordCount = 0;
            if (docContent !== "")
            {
                wordCount = docContent.split(" ").length;
            }

            return wordCount;
        }

        dispose()
        {
            this._statusBarItem.dispose();
        }
    }
}

export function activate(context: vscode.ExtensionContext) {
    KeepGrass.registerCommand(context);
}

export function deactivate() {
}