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
import nock from 'nock';
import { Connection, SfError } from '@salesforce/core';
import { MockTestOrgData, TestContext } from '@salesforce/core/testSetup';
import DataFilesDownload from '../../../../../src/commands/simply/data/files/download.js';
import { ContentVersionDownload } from '../../../../../src/common/contentVersionTypes.js';

const failedContentVersion = {
  Id: '068Hp00000gjxbEJAQ',
  ContentDocumentId: '069Hp00000cj9oPJAQ',
  ContentSize: '11',
  Description: 'a failed file',
  FileExtension: 'txt',
  FileType: 'TEXT',
  FirstPublishLocationId: '005Hp00000h2zSaJAI',
  IsLatest: true,
  PathOnClient: 'coolFile2.txt',
  Title: 'coolFile2',
};
const successfulContentVersion = {
  Id: '068Hp00000gjxbEIAQ',
  ContentDocumentId: '069Hp00000cj9oPIAQ',
  ContentSize: '11',
  Description: 'a successful file',
  FileExtension: 'txt',
  FileType: 'TEXT',
  FirstPublishLocationId: '005Hp00000h2zSaIAI',
  IsLatest: true,
  PathOnClient: 'coolFile.txt',
  Title: 'coolFile',
};

describe('simply data files download', () => {
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
      await DataFilesDownload.run();
      expect.fail('should have thrown NoDefaultEnvError');
    } catch (err) {
      const error = err as SfError;
      expect(error.name).to.equal('NoDefaultEnvError');
      expect(error.message).to.include('Use -o or --target-org to specify an environment.');
    }
  });

  it('should write results to csv', async () => {
    const testOrgConnection = await testOrg.getConnection();

    nock(testOrgConnection.baseUrl())
      .get(`/sobjects/ContentVersion/${successfulContentVersion.Id}/VersionData`)
      .reply(200, 'sample text')
      .persist();
    nock(testOrgConnection.baseUrl())
      .get(`/sobjects/ContentVersion/${failedContentVersion.Id}/VersionData`)
      .reply(500, 'Internal server error')
      .persist();

    $$.SANDBOX.stub(Connection.prototype, 'query').resolves({
      done: true,
      records: [successfulContentVersion, failedContentVersion],
      totalSize: 3,
    });

    await DataFilesDownload.run(['--where-content-version', 'IsLatest=true', '--target-org', testOrg.username]);

    const errorResults = parse<ContentVersionDownload>(fs.readFileSync('download/error.csv'), {
      bom: true,
      columns: true,
    });
    const successResults = parse<ContentVersionDownload>(fs.readFileSync('download/success.csv'), {
      bom: true,
      columns: true,
    });

    expect(errorResults[0].Error).to.contain('HTTPError: Request failed with status code 500 (Internal Server Error)');
    expect(successResults).to.deep.equal([
      {
        Id: '068Hp00000gjxbEIAQ',
        ContentDocumentId: '069Hp00000cj9oPIAQ',
        ContentSize: '11',
        Description: 'a successful file',
        FileExtension: 'txt',
        FilePath: 'download/069Hp00000cj9oPIAQ_coolFile.txt',
        FileType: 'TEXT',
        FirstPublishLocationId: '005Hp00000h2zSaIAI',
        IsLatest: 'true',
        PathOnClient: 'coolFile.txt',
        Title: 'coolFile',
      },
    ]);
  });
});
