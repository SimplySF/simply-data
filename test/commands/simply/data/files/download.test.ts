/*
 * Copyright (c) 2024, Clay Chipps; Copyright (c) 2024, Salesforce.com, Inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
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

    const errorResults = parse(fs.readFileSync('download/error.csv'), {
      bom: true,
      columns: true,
    }) as ContentVersionDownload[];
    const successResults = parse(fs.readFileSync('download/success.csv'), {
      bom: true,
      columns: true,
    }) as ContentVersionDownload[];

    expect(errorResults[0].Error).to.contain('HTTPError: Response code 500 (Internal Server Error)');
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
