/*
 * Copyright (c) 2024, Clay Chipps; Copyright (c) 2024, Salesforce.com, Inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import path from 'node:path';
import { execCmd, TestSession } from '@salesforce/cli-plugins-testkit';
import { Duration } from '@salesforce/kit';

describe('simply data files upload', () => {
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

  it('should upload content versions', () => {
    const username = [...session.orgs.keys()][0];
    const command = `simply data files upload --file-path test-files/simply.data.files.upload.csv --target-org ${username}`;
    execCmd(command, { ensureExitCode: 0, timeout: Duration.minutes(30).milliseconds });
  });

  after(async () => {
    await session?.clean();
  });
});
