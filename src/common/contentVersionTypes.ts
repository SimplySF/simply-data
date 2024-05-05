/*
 * Copyright (c) 2024, Clay Chipps; Copyright (c) 2024, Salesforce.com, Inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

export type ContentVersion = {
  ContentDocumentId: string;
  ContentSize: string;
  Description: string;
  FileExtension: string;
  FileType: string;
  FirstPublishLocationId: string;
  Id: string;
  IsLatest: string;
  PathOnClient: string;
  Title: string;
};

export type ContentVersionCreateRequest = {
  FirstPublishLocationId?: string;
  PathOnClient: string;
  Title?: string;
};

export type ContentVersionCreateResult = {
  id: string;
  success: boolean;
  errors: string[];
  name: string;
  message: string;
};

export type ContentVersionDownload = ContentVersion & {
  Error?: string;
  FilePath?: string;
};

export type ContentVersionToUpload = {
  ContentDocumentId?: string;
  Error?: string;
  FirstPublishLocationId?: string;
  PathOnClient: string;
  Title: string;
};
