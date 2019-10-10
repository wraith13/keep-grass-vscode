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
    let context: vscode.ExtensionContext;

    const getConfiguration = <type>(key?: string): type =>
    {
        const configuration = vscode.workspace.getConfiguration("keep-grass");
        return key ?
            configuration[key] :
            configuration;
    };

    export const registerCommand = (aContext: vscode.ExtensionContext): void =>
    {
        context = aContext;
        context.subscriptions.push
        (
            indicator = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right),
            vscode.commands.registerCommand('keep-grass.update', update),
        );
        autoUpdate();
    };

    export const autoUpdate = async () :Promise<void> =>
    {
        const lastUpdateStamp = context.globalState.get<number>("keep-grass.last-update-stamp", 0);
        if (lastUpdateStamp +(5 *60 *1000) < (new Date()).getTime())
        {
            update();
        }
        else
        {
            const lastContribute = context.globalState.get<number>("keep-grass.last-contribute-stamp", 0);
            if (lastContribute)
            {
                updateIndicator(new Date(lastContribute));
            }
        }
    };
    export const update = async () : Promise<void> =>
    {
        const user = getConfiguration("user");
        if (user)
        {
            context.globalState.update("keep-grass.last-update-stamp", (new Date()).getTime());
            const { error, response, body } = await rx.get(`https://github.com/${user}.atom`);
            if (error)
            {
                console.error(error);
            }
            else
            if (response.statusCode === 200)
            {
                //console.log(body);
                const lastContribute = getLastContribute(body);
                console.log(lastContribute);
                if (lastContribute)
                {
                    context.globalState.update("keep-grass.last-contribute-stamp", lastContribute.getTime());
                    updateIndicator(lastContribute);
                }
            }
        }
        else
        {
            indicator.text = "no user";
            indicator.tooltip = ""
            indicator.show();
        }
    };
    const updateIndicator = (lastContribute : Date) : void =>
    {
        const day = 24 *60 *60 *1000;
        const limit = lastContribute.getTime() +day;
        const left = limit - Date.now();
        indicator.text = `${getSymbol(left)}${leftTimeToString(left)}`;
        indicator.tooltip = `last stamp: ${lastContribute.toLocaleString()}`
        indicator.show();
    };

    const parseISODate = (source : string) : Date => new Date(Date.parse(source.replace("T", " ")));

    export const regExpExecToArray = (regexp: RegExp, text: string) =>
    {
        const result: RegExpExecArray[] = [];
        while(true)
        {
            const match = regexp.exec(text);
            if (null === match)
            {
                break;
            }
            result.push(match);
        }
        return result;
    };

    export const isContribution = (entry: { id: string, title: string}) =>
    {
        console.log(`entry: ${JSON.stringify(entry)}`);
        const eventTypeName = (/([A-Za-z0-9]+Event)/.exec(entry.id)||[])[0];
        switch (eventTypeName)
        {
        //  現状、まだ確認がとれてないモノをコメントアウトしている
        case "GollumEvent":
            return false;
        case "PullRequestReviewCommentEvent":
            return true;
        case "IssueCommentEvent":
            return false;
        case "CreateEvent":
            return 0 <= entry.title.indexOf(" created a repository ");
        case "ForkEvent":
            return true;
        case "DeleteEvent":
            return false;
        case "PushEvent":
            return true;
        case "PullRequestEvent":
            return true; // false の場合もある？
        case "IssuesEvent":
            return  0 <= entry.title.indexOf(" opened an issue in ") ||
                    0 <= entry.title.indexOf(" opened issue ") ;
        case "MemberEvent":
            return false;
        case "WatchEvent":
            return false;
        }
        console.error(`isContribution(${eventTypeName}): UNKNOWN EVENT!!!`);
        return false;
    };
    export const parseAtom = (xml : string) => regExpExecToArray(/<entry>(.*?)<\/entry>/gm, xml.replace(/\s+/gm, " ").trim())
        .map
        (
            entry =>
            ({
                id: (/<id>(.*?)<\/id>/.exec(entry[1])||[])[1],
                updated: (/<updated>(.*?)<\/updated>/.exec(entry[1])||[])[1],
                title: (/<title(.*?)>(.*?)<\/title>/.exec(entry[1])||[])[2],
            })
        );

    const getLastContribute = (xml : string) : Date | null =>
    {
        const entries = parseAtom(xml);
        const lastContribute = entries.filter(entry => isContribution(entry))[0];
        if (lastContribute)
        {
            return new Date(parseISODate(lastContribute.updated));
        }
        return null;
    };

    const getSymbol = (leftTime : number) =>
    {
        const totalHours = leftTime /(60 *60 *1000);
        const symbols = [ "🍀", "🌱", "🍃", "⚠️", "🔥️", "💤" ];
        let threshold = 24;
        for(let i = 0; i < symbols.length -2; ++i)
        {
            threshold /= 2;
            if (threshold < totalHours)
            {
                return symbols[i];
            }
        }
        if (0 < totalHours)
        {
            return symbols[symbols.length -2];
        }
        else
        {
            return symbols[symbols.length -1];
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
