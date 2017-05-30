//
// Note: This example test is leveraging the Mocha test framework.
// Please refer to their documentation on https://mochajs.org/ for help.
//

// The module 'assert' provides assertion methods from node
import * as assert from 'assert';

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
//import * as vscode from 'vscode';
import * as KeepGrassVscode from '../src/extension';

// Defines a Mocha test suite to group tests of similar kind together
suite("Extension Tests", () => {

    // Defines a Mocha unit test
    test("keep.grass", () => {
        assert.equal("00", KeepGrassVscode.KeepGrass.numberToByteString(-100));
        assert.equal("00", KeepGrassVscode.KeepGrass.numberToByteString(0.0));
        assert.equal("7f", KeepGrassVscode.KeepGrass.numberToByteString(0.5));
        assert.equal("ff", KeepGrassVscode.KeepGrass.numberToByteString(1.0));
        assert.equal("ff", KeepGrassVscode.KeepGrass.numberToByteString(100));
    });
});