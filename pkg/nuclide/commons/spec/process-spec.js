'use babel';
/* @flow */

/*
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */

var processLib = require('../lib/process.js');
var path = require('path');

var {
  DARWIN_PATH_HELPER_REGEXP,
  createExecEnvironment,
} = processLib.__test__;

describe('process.asyncExecute', () => {

  var origPlatform;

  beforeEach(() => {
    origPlatform = process.platform;
    // Use a fake platform so the platform's PATH is not used in case the test is run on a platform
    // that requires special handling (like OS X).
    Object.defineProperty(process, 'platform', {value: 'MockMock'});
  });

  afterEach(() => {
    Object.defineProperty(process, 'platform', {value: origPlatform});
  });

  describe('createExecEnvironment()', () => {
    it('combine the existing environment variables with the common paths passed', () => {
      waitsForPromise(async () => {
        expect(
          await createExecEnvironment({foo: 'bar', PATH: '/bin'}, ['/abc/def'])
        ).toEqual({foo: 'bar', PATH: '/bin' + path.delimiter + '/abc/def'});
      });
    });
  });

  describe('OS X path_helper regexp', () => {
    it('matches and captures valid PATH', () => {
      expect(
        'PATH=\"/usr/bin:/usr/local/bin\"; export PATH; echo \"\"'.match(DARWIN_PATH_HELPER_REGEXP)[1]
      ).toEqual('/usr/bin:/usr/local/bin');
    });
  });

  if (origPlatform !== 'win32') {
    it('returns stdout of the running process', () => {
      waitsForPromise(async () => {
        var val = await processLib.asyncExecute('echo', ['-n', 'foo'], {env: process.env});
        expect(val.stdout).toEqual('foo');
      });
    });

    it('pipes stdout to stdin of `pipedCommand`', () => {
      waitsForPromise(async () => {
        var val = await processLib.asyncExecute(
            'seq',
            ['1', '100'],
            {env: process.env, pipedCommand: 'head', pipedArgs: ['-10']});
        expect(val.stdout).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10].join('\n') + '\n');
      });
    });

    describe('checkOutput', () => {
      it('returns output of the running process', () => {
        waitsForPromise(async () => {
          expect(await processLib.checkOutput('echo', ['-n', 'howdy']))
            .toEqual('howdy');
        });
      });
    });
  }
});
