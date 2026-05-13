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

import { Messages } from '@salesforce/core';
import { SfCommand, Flags } from '@salesforce/sf-plugins-core';
import { uploadContentVersion } from '../../../../common/contentVersionUtils.js';
import { ContentVersion } from '../../../../common/contentVersionTypes.js';

Messages.importMessagesDirectoryFromMetaUrl(import.meta.url);
const messages = Messages.loadMessages('@simplysf/simply-data', 'simply.data.file.upload');

export default class DataFileUpload extends SfCommand<ContentVersion> {
  public static readonly summary = messages.getMessage('summary');
  public static readonly description = messages.getMessage('description');
  public static readonly examples = messages.getMessages('examples');

  public static readonly flags = {
    ...SfCommand.baseFlags,
    'api-version': Flags.orgApiVersion(),
    'file-path': Flags.directory({
      summary: messages.getMessage('flags.file-path.summary'),
      required: true,
    }),
    'first-publish-location-id': Flags.string({
      summary: messages.getMessage('flags.first-publish-location-id.summary'),
    }),
    'target-org': Flags.requiredOrg(),
    title: Flags.string({
      summary: messages.getMessage('flags.title.summary'),
    }),
  };

  public async run(): Promise<ContentVersion> {
    const { flags } = await this.parse(DataFileUpload);

    // Authorize to the target org
    const targetOrgConnection = flags['target-org']?.getConnection(flags['api-version']);

    if (!targetOrgConnection) {
      throw messages.createError('error.targetOrgConnectionFailed');
    }

    this.spinner.start('Uploading file', '', { stdout: true });

    const contentVersion = await uploadContentVersion(
      targetOrgConnection,
      flags['file-path'],
      flags['title'],
      flags['first-publish-location-id']
    );

    this.spinner.stop();

    return contentVersion;
  }
}
