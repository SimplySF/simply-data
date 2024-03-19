/*
 * Copyright (c) 2024, Clay Chipps; Copyright (c) 2024, Salesforce.com, Inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import { createObjectCsvWriter } from 'csv-writer';
import { Schema } from 'jsforce';
import PQueue from 'p-queue';
import { Messages } from '@salesforce/core';
import { SfCommand, Flags } from '@salesforce/sf-plugins-core';
import { downloadContentVersion } from '../../../../common/contentVersionUtils.js';
import { ContentVersionDownload } from '../../../../common/contentVersionTypes.js';

Messages.importMessagesDirectoryFromMetaUrl(import.meta.url);
const messages = Messages.loadMessages('@simplysf/simply-data', 'simply.data.files.download');

export default class DataFilesDownload extends SfCommand<void> {
  public static readonly summary = messages.getMessage('summary');
  public static readonly description = messages.getMessage('description');
  public static readonly examples = messages.getMessages('examples');

  public static readonly flags = {
    'api-version': Flags.orgApiVersion(),
    'max-parallel-jobs': Flags.integer({
      summary: messages.getMessage('flags.max-parallel-jobs.summary'),
      description: messages.getMessage('flags.max-parallel-jobs.description'),
      default: 1,
    }),
    'target-org': Flags.requiredOrg(),
    where: Flags.string({
      summary: messages.getMessage('flags.where.summary'),
      description: messages.getMessage('flags.where.description'),
      required: true,
    }),
  };

  public async run(): Promise<void> {
    const { flags } = await this.parse(DataFilesDownload);

    // Authorize to the target org
    const targetOrgConnection = flags['target-org']?.getConnection(flags['api-version']);

    if (!targetOrgConnection) {
      throw messages.createError('error.targetOrgConnectionFailed');
    }

    this.spinner.start('Querying for files', '\n', { stdout: true });

    const query = await targetOrgConnection.autoFetchQuery<ContentVersionDownload & Schema>(
      `SELECT ContentDocumentId, ContentSize, Description, FileExtension, FileType, FirstPublishLocationId, Id, IsLatest, PathOnClient, Title FROM ContentVersion WHERE ${flags.where}`
    );

    const contentVersionDownloads = query.records;

    this.spinner.start('Downloading files', '\n', { stdout: true });

    const successWriter = createObjectCsvWriter({
      path: 'success.csv',
      header: [
        { id: 'Id', title: 'Id' },
        { id: 'ContentDocumentId', title: 'ContentDocumentId' },
        { id: 'ContentSize', title: 'ContentSize' },
        { id: 'Description', title: 'Description' },
        { id: 'FileExtension', title: 'FileExtension' },
        { id: 'FileType', title: 'FileType' },
        { id: 'FirstPublishLocationId', title: 'FirstPublishLocationId' },
        { id: 'IsLatest', title: 'IsLatest' },
        { id: 'PathOnClient', title: 'PathOnClient' },
        { id: 'Title', title: 'Title' },
        { id: 'FilePath', title: 'FilePath' },
      ],
    });

    const errorWriter = createObjectCsvWriter({
      path: 'error.csv',
      header: [
        { id: 'Id', title: 'Id' },
        { id: 'ContentDocumentId', title: 'ContentDocumentId' },
        { id: 'ContentSize', title: 'ContentSize' },
        { id: 'Description', title: 'Description' },
        { id: 'FileExtension', title: 'FileExtension' },
        { id: 'FileType', title: 'FileType' },
        { id: 'FirstPublishLocationId', title: 'FirstPublishLocationId' },
        { id: 'IsLatest', title: 'IsLatest' },
        { id: 'PathOnClient', title: 'PathOnClient' },
        { id: 'Title', title: 'Title' },
        { id: 'Error', title: 'Error' },
      ],
    });

    const downloadQueue = new PQueue({ concurrency: flags['max-parallel-jobs'] });

    let count = 0;
    downloadQueue.on('add', () => {
      this.spinner.status = `Completed: ${count}. Size: ${downloadQueue.size}  Pending: ${downloadQueue.pending}\n`;
    });

    downloadQueue.on('completed', () => {
      count++;
      this.spinner.status = `Completed: ${count}. Size: ${downloadQueue.size}  Pending: ${downloadQueue.pending}\n`;
    });

    for await (const contentVersionDownload of contentVersionDownloads) {
      void downloadQueue.add(async () => {
        try {
          await downloadContentVersion(targetOrgConnection, contentVersionDownload);
          await successWriter.writeRecords([contentVersionDownload]);
        } catch (error) {
          contentVersionDownload.Error = error as string;
          await errorWriter.writeRecords([contentVersionDownload]);
        }
      });
    }

    await downloadQueue.onIdle();

    this.spinner.stop();
  }
}
