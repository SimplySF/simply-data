# summary

Download files from a Salesforce org.

# description

Downloads files specified by a where clause to a ContentVersion query from a Salesforce org. By default, the plugin uses the REST API for the download as to allow for the streaming of large files without issue. This means that each file will use one REST API request.

# flags.max-parallel-jobs.summary

Maximum number of parallel jobs.

# flags.max-parallel-jobs.description

By default the plugin will only process a single file download at a time. You can increase this value to allow for quasi concurrent downloads. Please note that setting this value too high can cause performance issues.

# flags.where.summary

WHERE clause for ContentVersion query.

# flags.where.description

Provide a WHERE clause to allow the plugin to specify which ContentVersion records should be downloaded.

# examples

- <%= config.bin %> <%= command.id %> --where 'IsLatest=true' --target-org myTargetOrg

- <%= config.bin %> <%= command.id %> --where 'IsLatest=true' --max-parallel-jobs 5 --target-org myTargetOrg

# error.targetOrgConnectionFailed

Unable to establish connection to the org.
