# keep.grass for vscode README

[![Visual Studio Marketplace](https://vsmarketplacebadge.apphb.com/version/wraith13.keep-grass-vscode.svg) ![installs](https://vsmarketplacebadge.apphb.com/installs/wraith13.keep-grass-vscode.svg) ![rating](https://vsmarketplacebadge.apphb.com/rating/wraith13.keep-grass-vscode.svg)](https://marketplace.visualstudio.com/items?itemName=wraith13.keep-grass-vscode)

This vscode extion shows the last commit timestamp in order to keep your github active. ( keep.grass for vscode )

GitHub のプロフィールページで Contributions が緑で埋まっているのってやっぱり格好いいですよね！
keep.grass は *毎日欠かさず* 進捗を出し続け GitHub 上の Contributions を緑で埋め続けようとする開発者の為に最後の Activity から24時間が経過するまでの残り時間を知らせる為のアプリです。
残り時間が少なくなってきた場合や、生活サイクルに合わせて決まった時間に残り時間を通知することもできます。

【お断り】
GitHub は Activity がどのように Contributions に反映されるか詳細な仕様を公開していないようで、 keep.grass もただ最終 Activity の日時を元に残り時間を表示するだけとなりますので、あくまで *目安* としてご利用頂ければ幸いです。

> * [keep.grass for iOS](https://itunes.apple.com/us/app/keep.grass/id1170833136?l=ja&ls=1&mt=8)
> * [keep.grass for Android](https://play.google.com/store/apps/details?id=net.trickpalace.keep_grass)
> * [keep.grass for UWP](https://www.microsoft.com/store/apps/9nblggh51p1m)

## Features

keep.grass shows the last commit timestamp and/or left time.

[`settings.json`](#extension-settings)

## Tutorial

### 0. ⬇️ Install keep.grass for vscode:

Launch VS Code Quick Open(Mac:<kbd>Command</kbd>+<kbd>P</kbd>, Windows and Linux: <kbd>Ctrl</kbd>+<kbd>P</kbd>), Type `ext install keep-grass-vscode` and press <kbd>Enter</kbd> and click <kbd>Install</kbd>.  Restart VS Code when installation is completed.

### 2. 🔧 Configure keep.grass for vscode:

This extension contributes the following settings by [`settings.json`](https://code.visualstudio.com/docs/customization/userandworkspace#_creating-user-and-workspace-settings)( Mac: <kbd>Command</kbd>+<kbd>,</kbd>, Windows / Linux: <kbd>File</kbd> -> <kbd>Preferences</kbd> -> <kbd>User Settings</kbd> ):

* `keep-grass-vscode.user`: Your GitHub account
* `keep-grass-vscode.show`: Select show item on status bar from `left time`, `last stamp`, `both`.

Enjoy!

## Command

* `Update keep.grass status` : Update keep.grass status by GitHub feed.

## Keyboard shortcut Settings

In default, keep.grass's command doesn't apply keyboard shortcuts. Althogh,
you can apply keyboard shortcuts by [`keybindings.json`](https://code.visualstudio.com/docs/customization/keybindings#_customizing-shortcuts)
( Mac: <kbd>Code</kbd> -> <kbd>Preferences</kbd> -> <kbd>Keyboard Shortcuts</kbd>, Windows / Linux: <kbd>File</kbd> -> <kbd>Preferences</kbd> -> <kbd>Keyboard Shortcuts</kbd>).

Command name on `keybindings.json` is diffarent from on Command Pallete. See below table.

|on Command Pallete|on keybindings.json|
|-|-|
|`Update keep.grass status`|`keep-grass-vscode.update`|

## Release Notes

see ChangLog on [marketplace](https://marketplace.visualstudio.com/items/wraith13.keep-grass-vscode/changelog) or [github](https://github.com/wraith13/keep-grass-vscode/blob/master/CHANGELOG.md)


## Support

[GitHub Issues](https://github.com/wraith13/keep-grass-vscode/issues)

## License

[Boost Software License](https://github.com/wraith13/keep-grass-vscode/blob/master/LICENSE_1_0.txt)
