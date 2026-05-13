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

import { expect } from 'chai';
import got from 'got';
import { Connection, SfError } from '@salesforce/core';
import { MockTestOrgData, TestContext } from '@salesforce/core/testSetup';
import DataFileUpload from '../../../../../src/commands/simply/data/file/upload.js';

describe('simply data file upload', () => {
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
      await DataFileUpload.run();
      expect.fail('should have thrown NoDefaultEnvError');
    } catch (err) {
      const error = err as SfError;
      expect(error.name).to.equal('NoDefaultEnvError');
      expect(error.message).to.include('Use -o or --target-org to specify an environment.');
    }
  });

  it('should return content version successfully', async () => {
    $$.SANDBOX.stub(got, 'post').resolves({ id: '123', success: true });

    $$.SANDBOX.stub(Connection.prototype, 'singleRecordQuery').resolves({
      Id: '123',
      ContentDocumentId: '123',
      FileExtension: 'json',
      Title: 'coolFile',
    });

    const response = await DataFileUpload.run([
      '--file-path',
      'package.json',
      '--title',
      'coolFile',
      '--target-org',
      testOrg.username,
    ]);

    expect(response.Title).to.equal('coolFile');
    expect(response.FileExtension).to.equal('json');
  });
});
