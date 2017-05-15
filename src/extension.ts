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

module KeepGrass {
    function getConfiguration<type>(key?: string): type
    {
        var configuration = vscode.workspace.getConfiguration("keep-grass-vscode");
        return key ?
            configuration[key] :
            configuration;
    }

    export function registerCommand(context: vscode.ExtensionContext): void
    {
        context.subscriptions.push
        (
            vscode.commands.registerCommand
            (
                'keep-grass-vscode.update', update
            )
        );
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
                console.log(body);
            }
        }
    }

}

export function activate(context: vscode.ExtensionContext) {
    KeepGrass.registerCommand(context);
}

export function deactivate() {
}