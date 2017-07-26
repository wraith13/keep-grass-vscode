'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as request from 'request';

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
    var indicator : StatusBarItem;

    function getConfiguration<type>(key?: string): type
    {
        var configuration = vscode.workspace.getConfiguration("keep-grass-vscode");
        return key ?
            configuration[key] :
            configuration;
    }

    export function registerCommand(context: vscode.ExtensionContext): void
    {
        indicator = new StatusBarItem();
        context.subscriptions.push(indicator);
        context.subscriptions.push
        (
            vscode.commands.registerCommand
            (
                'keep-grass-vscode.update', update
            )
        );
        indicator.update(null, null);
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
                    var day = 24 *60 *60 *1000;
                    var limit = lastUpdate.getTime() +day;
                    var left = limit - Date.now();
                    var color = makeLeftTimeColor((left *1.0) /(day *1.0));
                    console.log(color);
                    indicator.update(lastUpdate.toLocaleString(), color);
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
    export function makeLeftTimeColor(LeftTimeRate : number) : string
    {
        return "#"
            + numberToByteString(1.0 - LeftTimeRate)
            + numberToByteString(Math.min(0.5, LeftTimeRate))
            + numberToByteString(0.0);
    }

    class StatusBarItem
    {

        private _statusBarItem: vscode.StatusBarItem;

        public update(text : string | null, color :string | null)
        {
            if (text && color)
            {
                this._statusBarItem.text = text;
                this._statusBarItem.color = color;
                this._statusBarItem.show();
            }
            else
            {
                // Create as needed
                if (!this._statusBarItem)
                {
                    this._statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right);
                }

                this._statusBarItem.text = "🌱！！！！";
                this._statusBarItem.color = "#FF8888";
                this._statusBarItem.show();
            }
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