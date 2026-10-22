-- Apply once to existing installations before running the updated application.
ALTER TABLE knowledge_chunk ADD COLUMN page_start INT NULL;
ALTER TABLE knowledge_chunk ADD COLUMN page_end INT NULL;
