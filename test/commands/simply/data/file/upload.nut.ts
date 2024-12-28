/*
 * Copyright (c) 2024, Clay Chipps; Copyright (c) 2024, Salesforce.com, Inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
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
