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

class RepeatTimer
{
    timer: NodeJS.Timer | null;

    constructor(public target: () => void, public getInterval: () => number)
    {
        this.exec();
    }

    exec = () =>
    {
        this.dispose();
        this.target();
        setTimeout
        (
            this.exec,
            this.getInterval()
        );
    }

    dispose = () =>
    {
        if (this.timer)
        {
            clearTimeout(this.timer);
            this.timer = null;
        }
    }
};

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

export const timeout = (wait: number) => new Promise((resolve) => setTimeout(resolve, wait));

export module GitHub
{
    export const getAtomUrl = (user: string) => `https://github.com/${user}.atom`;
    export const parseISODate = (source : string) : Date => new Date(Date.parse(source.replace("T", " ")));

    export const isContribution = (entry: { id: string, title: string}) =>
    {
        //console.log(`${new Date().toISOString()} keep-grass.entry: ${JSON.stringify(entry)}`);
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
        console.log(`${new Date().toISOString()} keep-grass.isContribution(${eventTypeName}): UNKNOWN EVENT!!!`);
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

    export const getLastContribute = (xml : string) : Date | null =>
    {
        const entries = parseAtom(xml);
        const lastContribute = entries.filter(entry => isContribution(entry))[0];
        if (lastContribute)
        {
            return new Date(parseISODate(lastContribute.updated));
        }
        return null;
    };
}

export module KeepGrass
{
    const day = 24 *60 *60 *1000;
    let indicator : vscode.StatusBarItem;
    let context: vscode.ExtensionContext;
    let updating: boolean = false;

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
            vscode.commands.registerCommand
            (
                "keep-grass.update", async () =>
                {
                    try
                    {
                        updating = true;
                        updateIndicator();
                        await update();
                    }
                    finally
                    {
                        //  通信が一瞬で終わった時、通信中のユーザーフィードバックが弱くなるので表示の切り替えをちょっと遅らせる。
                        await timeout(500);
                        updating = false;
                        updateIndicator();
                    }
                }
            ),
            vscode.commands.registerCommand
            (
                "keep-grass.menu", async () =>
                {
                    const selected = await vscode.window.showQuickPick
                    (
                        [
                            {
                                label: "$(sync) update",
                                description: "",
                                value: () => vscode.commands.executeCommand("keep-grass.update"),
                            },
                            {
                                label: "$(gear) set user",
                                description: "",
                                value: () => update(),
                            },
                        ]
                    );
                    if (selected)
                    {
                        selected.value();
                    }
                }
            ),
            new RepeatTimer(updateIndicator, () => 60 *1000 / 10),
            new RepeatTimer(autoUpdateLastContribute, () => 15 *60 *1000),
        );
    };
    export const autoUpdateLastContribute = async () :Promise<void> =>
    {
        const lastUpdateStamp = context.globalState.get<number>("keep-grass.last-update-stamp", 0);
        if (lastUpdateStamp +(10 *60 *1000) < (new Date()).getTime())
        {
            update();
        }
    };
    export const update = async () : Promise<void> =>
    {
        const user = getConfiguration<string>("user");
        if (user)
        {
            context.globalState.update("keep-grass.last-update-stamp", (new Date()).getTime());
            const { error, response, body } = await rx.get(GitHub.getAtomUrl(user));
            if (error)
            {
                console.log(`${new Date().toISOString()} keep-grass.get.error: ${error}`);
            }
            else
            if (response.statusCode === 200)
            {
                const lastContribute = GitHub.getLastContribute(body);
                console.log(`${new Date().toISOString()} keep-grass.lastContribute: ${lastContribute ? lastContribute.toISOString(): lastContribute}`);
                context.globalState.update("keep-grass.last-contribute-stamp", lastContribute)
            }
        }
    };
    const updateIndicator = () : void =>
    {
        const lastContributeStamp = context.globalState.get<number>("keep-grass.last-contribute-stamp", 0);
        if (lastContributeStamp)
        {
            const lastContribute = new Date(lastContributeStamp)
            const limit = lastContribute.getTime() +day;
            const left = limit - Date.now();
            indicator.text = `${getSymbol(left)} ${leftTimeToString(left)}`;
            indicator.tooltip = `last stamp: ${lastContribute.toLocaleString()}`
        }
        else
        {
            indicator.text = `${getSymbol(-1)} no data}`;
            indicator.tooltip = ``
        }
        indicator.command = "keep-grass.menu";
        indicator.show();
    };

    const getSymbol = (leftTime : number) =>
    {
        if (updating)
        {
            return "$(sync~spin)";
        }
        else
        {
            const symbols = getConfiguration<string[]>("symbols");
            let threshold = day;
            for(let i = 0; i < symbols.length -2; ++i)
            {
                threshold /= 2;
                if (threshold < leftTime)
                {
                    return symbols[i];
                }
            }
            if (0 < leftTime)
            {
                return symbols[symbols.length -2];
            }
            else
            {
                return symbols[symbols.length -1];
            }
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
