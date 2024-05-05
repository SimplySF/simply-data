/*
 * Copyright (c) 2024, Clay Chipps; Copyright (c) 2024, Salesforce.com, Inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import fs from 'node:fs';
import { createObjectCsvWriter } from 'csv-writer';
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
    ...SfCommand.baseFlags,
    'api-version': Flags.orgApiVersion(),
    'max-parallel-jobs': Flags.integer({
      summary: messages.getMessage('flags.max-parallel-jobs.summary'),
      description: messages.getMessage('flags.max-parallel-jobs.description'),
      default: 1,
    }),
    'target-org': Flags.requiredOrg(),
    'where-content-version': Flags.string({
      summary: messages.getMessage('flags.where-content-version.summary'),
      description: messages.getMessage('flags.where-content-version.description'),
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

    const result = await targetOrgConnection.query<ContentVersionDownload>(
      `SELECT ContentDocumentId, ContentSize, Description, FileExtension, FileType, FirstPublishLocationId, Id, IsLatest, PathOnClient, Title FROM ContentVersion WHERE ${flags['where-content-version']}`,
      {
        autoFetch: true,
        maxFetch: (this.configAggregator.getInfo('org-max-query-limit').value as number) ?? 50_000,
        scanAll: false,
      }
    );

    const contentVersionDownloads = result.records;

    this.spinner.start('Initializing file download', '\n', { stdout: true });

    if (!fs.existsSync('download')) {
      fs.mkdirSync('download');
    }

    const successWriter = createObjectCsvWriter({
      path: 'download/success.csv',
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
      path: 'download/error.csv',
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

    this.spinner.start('Downloading files', '\n', { stdout: true });

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
          contentVersionDownload.FilePath = await downloadContentVersion(
            targetOrgConnection,
            contentVersionDownload,
            'download'
          );
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
