BEGIN;

-- contractor_embeddings: update on contractor_companies upsert
CREATE OR REPLACE FUNCTION contractor_connection.tg_update_contractor_embedding()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
PERFORM rpc_embed_text(
 NEW.id,
 'contractor',
 CONCAT_WS(' ',
   NEW.name,
   COALESCE(NEW.dba_name, ''),
   COALESCE(NEW.legal_name, ''),
   COALESCE(NEW.scope_description, ''),
   COALESCE(NEW.notes, '')
 )
);
RETURN NEW;
END
$$;

CREATE TRIGGER trg_contractor_embed
AFTER INSERT OR UPDATE ON contractor_connection.contractor_companies
FOR EACH ROW
EXECUTE PROCEDURE contractor_connection.tg_update_contractor_embedding();

-- job_note_embeddings: update on job_notes insert
CREATE OR REPLACE FUNCTION contractor_connection.tg_update_job_note_embedding()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
PERFORM rpc_embed_text(
 NEW.id,
 'job_note',
 NEW.note_text
);
RETURN NEW;
END
$$;

CREATE TRIGGER trg_job_note_embed
AFTER INSERT ON contractor_connection.job_notes
FOR EACH ROW
EXECUTE PROCEDURE contractor_connection.tg_update_job_note_embedding();

COMMIT;//
//  Untitled.swift
//  
//
//  Created by Mad Engineering on 7/8/25.
//

