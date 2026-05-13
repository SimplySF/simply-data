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
