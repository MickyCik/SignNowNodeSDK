#!/usr/bin/env node

/**
 * to run download-document applet from the project root folder type in your console:
 * > node bin/download-document <client_id> <client_secret> <username> <password> <document_id> <path_to_save>
 * <client_id>, <client_secret>, <username>, <password>, <document_id>, <path_to_save> - are required params
 * options:
 * --with-attachments - document will be downloaded as zip package with its attachments
 * --with-history - document will be downloaded with its history
 * --dev - request will be sent to developer sandbox API
 */

'use strict';

const args = process.argv.slice(2);
const flags = args.filter(arg => /^--/.test(arg));
const params = args.filter(arg => !/^--/.test(arg));

const [
  clientId,
  clientSecret,
  username,
  password,
  documentId,
  pathToSaveFile,
] = params;

const withAttachments = flags.includes('--with-attachments');
const withHistory = flags.includes('--with-history');
const dev = flags.includes('--dev');

const fs = require('fs');
const { promisify } = require('../utils');
const api = require('../lib')({
  credentials: Buffer.from(`${clientId}:${clientSecret}`).toString('base64'),
  production: !dev,
});

const {
  oauth2: { requestToken: getAccessToken },
  document: { download: downloadDocument },
} = api;

const getAccessToken$ = promisify(getAccessToken);
const downloadDocument$ = promisify(downloadDocument);

getAccessToken$({
  username,
  password,
})
  .then(({ access_token: token }) => downloadDocument$({
    id: documentId,
    options: {
      withAttachments,
      withHistory,
    },
    token,
  }))
  .then(file => {
    const fileExtension = withAttachments ? 'zip' : 'pdf';
    const absolutePath = `${pathToSaveFile}/${documentId}.${fileExtension}`;
    fs.writeFileSync(absolutePath, file, { encoding: 'binary' });
    console.log(`Document has been downloaded. Check your '${pathToSaveFile}' directory.`);
  })
  .catch(err => console.error(err));
