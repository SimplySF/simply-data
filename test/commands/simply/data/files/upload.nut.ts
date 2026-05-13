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
