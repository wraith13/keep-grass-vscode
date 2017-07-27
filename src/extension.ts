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
    var indicator : vscode.StatusBarItem;

    function getConfiguration<type>(key?: string): type
    {
        const configuration = vscode.workspace.getConfiguration("keep-grass-vscode");
        return key ?
            configuration[key] :
            configuration;
    }

    export function registerCommand(context: vscode.ExtensionContext): void
    {
        indicator = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right);
        context.subscriptions.push(indicator);
        context.subscriptions.push
        (
            vscode.commands.registerCommand
            (
                'keep-grass-vscode.update', update
            )
        );
        update();
    }

    export async function update() : Promise<void>
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
    }
    export function updateIndicator(lastUpdate : Date) : void
    {
        const day = 24 *60 *60 *1000;
        const limit = lastUpdate.getTime() +day;
        const left = limit - Date.now();
        const show = getConfiguration("show");
        const text =
        (
            ("lest stamp" !== show ? lastUpdate.toLocaleString(): "")
            +" "
            +("last stamp" !== show ? leftTimeToString(left): "") // 🚫 これダメ！！！
        )
        .trim();
        console.log(text);
        const color = makeLeftTimeColor((left *1.0) /(day *1.0));
        console.log(color);
        indicator.text = text;
        indicator.color = color;
        indicator.show();
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

    function pad(value : number) : string
    {
        return (10 <= value ? "":　"0") +value.toString();
    }
    function leftTimeToString(leftTime : number) : string
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
    }
}

export function activate(context: vscode.ExtensionContext) {
    KeepGrass.registerCommand(context);
}

export function deactivate() {
}