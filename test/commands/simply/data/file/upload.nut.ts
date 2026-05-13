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

import path from 'node:path';
import { expect } from 'chai';
import { execCmd, TestSession } from '@salesforce/cli-plugins-testkit';
import { Duration } from '@salesforce/kit';
import { ContentVersion } from '../../../../../src/common/contentVersionTypes.js';

describe('simply data file upload', () => {
  let session: TestSession;

  before(async () => {
    session = await TestSession.create({
      devhubAuthStrategy: 'AUTO',
      project: {
        sourceDir: path.join(process.cwd(), 'test/reference-project'),
      },
      scratchOrgs: [
        {
          setDefault: true,
          config: path.join('config', 'project-scratch-def.json'),
        },
      ],
    });
  });

  it('should upload content version', () => {
    const username = [...session.orgs.keys()][0];
    const command = `simply data file upload --file-path test-files/watchDoge.jpg --target-org ${username} --json`;
    const output = execCmd<ContentVersion>(command, {
      ensureExitCode: 0,
      timeout: Duration.minutes(30).milliseconds,
    }).jsonOutput;

    expect(output!.result.FileExtension).equals('jpg');
    expect(output!.result.Title).equals('watchDoge.jpg');
  });

  after(async () => {
    await session?.clean();
  });
});
