/*
 * Copyright (c) 2026, Clay Chipps; Copyright (c) 2026 Salesforce, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import fs from 'node:fs';
import { expect } from 'chai';
import { parse } from 'csv-parse/sync';
import got from 'got';
import { Connection, SfError } from '@salesforce/core';
import { MockTestOrgData, TestContext } from '@salesforce/core/testSetup';
import DataFilesUpload from '../../../../../src/commands/simply/data/files/upload.js';
import { ContentVersionToUpload } from '../../../../../src/common/contentVersionTypes.js';

describe('simply data files upload', () => {
  const $$ = new TestContext();
  const testOrg = new MockTestOrgData();

  beforeEach(async () => {
    await $$.stubAuths(testOrg);
  });

  afterEach(() => {
    $$.restore();
  });

  it('should error without required --target-org flag', async () => {
    try {
      await DataFilesUpload.run();
      expect.fail('should have thrown NoDefaultEnvError');
    } catch (err) {
      const error = err as SfError;
      expect(error.name).to.equal('NoDefaultEnvError');
      expect(error.message).to.include('Use -o or --target-org to specify an environment.');
    }
  });

  it('should write results to csv', async () => {
    $$.SANDBOX.stub(got, 'post').resolves({ id: '123', success: true });

    $$.SANDBOX.stub(Connection.prototype, 'singleRecordQuery').resolves({
      Id: '123',
      ContentDocumentId: '123',
      FileExtension: '.json',
      Title: 'coolFile',
    });

    await DataFilesUpload.run([
      '--file-path',
      './test/reference-project/test-files/simply.data.files.upload.csv',
      '--target-org',
      testOrg.username,
    ]);

    const errorResults = parse<ContentVersionToUpload>(fs.readFileSync('upload/error.csv'), {
      bom: true,
      columns: true,
    });
    const successResults = parse<ContentVersionToUpload>(fs.readFileSync('upload/success.csv'), {
      bom: true,
      columns: true,
    });

    expect(errorResults[0].Error).to.contain('Error: ENOENT: no such file or directory');
    expect(successResults).to.deep.equal([
      {
        ContentDocumentId: '123',
        FirstPublishLocationId: '',
        PathOnClient: 'test/reference-project/test-files/basicTextFile.txt',
        Title: 'Basic Text File',
      },
      {
        ContentDocumentId: '123',
        FirstPublishLocationId: '',
        PathOnClient: 'test/reference-project/test-files/watchDoge.jpg',
        Title: 'Watch Doges',
      },
    ]);
  });
});
