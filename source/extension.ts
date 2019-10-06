'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as request from 'request';

module rx
{
    export const get = (url: string): Thenable<{ error: any, response: any, body: any }> => new Promise
    (
        resolve => request.get
        (
            url,
            (error: any, response: request.Response, body: any) => resolve
            ({
                    error,
                    response,
                    body
            })
        )
    );
    export const execute = (data: any): Thenable<{ error: any, response: any, body: any }> => new Promise
    (
        resolve => request
        (
            data,
            (error: any, response: request.Response, body: any) => resolve
            ({
                error,
                response,
                body
            })
        )
    );
}

export module KeepGrass
{
    let indicator : vscode.StatusBarItem;

    const getConfiguration = <type>(key?: string): type =>
    {
        const configuration = vscode.workspace.getConfiguration("keep-grass-vscode");
        return key ?
            configuration[key] :
            configuration;
    };

    export const registerCommand = (context: vscode.ExtensionContext): void =>
    {
        context.subscriptions.push
        (
            indicator = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right),
            vscode.commands.registerCommand('keep-grass-vscode.update', update),
        );
        update();
    };

    export const update = async () : Promise<void> =>
    {
        const user = getConfiguration("user");
        if (user)
        {
            const { error, response, body } = await rx.get(`https://github.com/${user}.atom`);
            if (error)
            {
                console.error(error);
            }
            else
            if (response.statusCode === 200)
            {
                //console.log(body);
                const lastUpdate = getLastUpdate(body);
                console.log(lastUpdate);
                if (lastUpdate)
                {
                    updateIndicator(lastUpdate);
                }
            }
        }
    };
    const updateIndicator = (lastUpdate : Date) : void =>
    {
        const day = 24 *60 *60 *1000;
        const limit = lastUpdate.getTime() +day;
        const left = limit - Date.now();
        indicator.text = `${getSymbol(left)}${leftTimeToString(left)}`;
        indicator.tooltip = `last stamp: ${lastUpdate.toLocaleString()}`
        indicator.show();
    };

    const parseISODate = (source : string) : Date => new Date(Date.parse(source.replace("T", " ")));

    const getLastUpdate = (xml : string) : Date | null =>
    {
        const match = /<updated>(.*?)<\/updated>/.exec(xml);
        return match ? new Date(parseISODate(match[1])): null;
    };

    const getSymbol = (leftTime : number) =>
    {
        const totalHours = leftTime /(60 *60 *1000);
        if (totalHours < 0)
        {
            return "🚫";
        }
        else
        if (totalHours < 6.0)
        {
            return "🍁";
        }
        else
        if (totalHours < 12.0)
        {
            return "🍃";
        }
        else
        if (totalHours < 18.0)
        {
            return "🌱";
        }
        else
        {
            return "🍀";
        }
    };

    const pad = (value : number) : string => (10 <= value ? "":　"0") +value.toString();
    const leftTimeToString = (leftTime : number) : string =>
    {
        if (leftTime < 0)
        {
            return "-" + leftTimeToString(-leftTime);
        }
        else
        {
            const totalSeconds = Math.floor(leftTime /1000);
            //const seconds = totalSeconds % 60;
            const totalMinutes = Math.floor(totalSeconds /60);
            const minutes = totalMinutes % 60;
            const hours = Math.floor(totalMinutes /60);
            return pad(hours) +":" +pad(minutes) //+":" +pad(seconds);
        }
    };
}

export const activate = KeepGrass.registerCommand;
export const deactivate = () => { };
