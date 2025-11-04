const express = require('express');
const { getPool, getOpenAPIKey } = require('../config');
const app = express();

app.get('/documents', async (req, res) => {
    try{
        const pool = await getPool();
        const [rows] = await pool.query('SELECT * FROM Document;');
        res.status(200).json(rows);
    }catch(err){
        console.error('Error fetching documents:', err);
        res.status(500).json({ error: 'Failed to fetch documents' });
    }
});

app.post('/documents', async (req, res) => {
    try{
        const pool = await getPool();

        const {
            abstractID = null,
            bookTypeID = null,
            subdivisionID = null,
            countyID = null,
            instrumentNumber = null,
            book = null,
            volume = null,
            page = null,
            grantor = null,
            grantee = null,
            instrumentType = null,
            remarks = null,
            lienAmount = null,
            legalDescription = null,
            subBlock = null,
            abstractText = null,
            acres = null,
            fileStampDate = null,
            filingDate = null,
            nFileReference = null,
            finalizedBy = null,
            exportFlag = null,
            propertyType = null,
            GFNNumber = null,
            marketShare = null,
            sortArray = null,
            address = null,
            CADNumber = null,
            CADNumber2 = null,
            GLOLink = null,
            fieldNotes = null
        } = req.body;

        const [result] = await pool.query(
            `INSERT INTO Document (
                abstractID, bookTypeID, subdivisionID, countyID,
                instrumentNumber, book, volume, \`page\`, grantor, grantee,
                instrumentType, remarks, lienAmount, legalDescription, subBlock,
                abstractText, acres, fileStampDate, filingDate, nFileReference,
                finalizedBy, exportFlag, propertyType, GFNNumber, marketShare,
                sortArray, address, CADNumber, CADNumber2, GLOLink, fieldNotes
            ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
            [
                abstractID, bookTypeID, subdivisionID, countyID,
                instrumentNumber, book, volume, page, grantor, grantee,
                instrumentType, remarks, lienAmount, legalDescription, subBlock,
                abstractText, acres, fileStampDate, filingDate, nFileReference,
                finalizedBy, exportFlag, propertyType, GFNNumber, marketShare,
                sortArray, address, CADNumber, CADNumber2, GLOLink, fieldNotes
            ]
        );

        res.status(201).json({
            message: 'Document created successfully',
            documentID: result.insertId
        });
    }catch(err){
        console.error('Error inserting document:', err);
        res.status(500).json({ error: 'Failed to create document' });
    }
});

const multer = require('multer');
const sharp = require('sharp');
const { OpenAI } = require('openai');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });

// Helper: ensure lookup row exists and return its ID (or null if name is null/blank)
async function ensureLookupId(pool, tableName, name) {
  if (!name || (typeof name === 'string' && name.trim() === '')) return null;
  // Adjust column names if your schema differs
  const idCol = `${tableName.toLowerCase()}ID`; // e.g., 'abstractID'
  const [found] = await pool.query(`SELECT ${idCol} AS id FROM ${tableName} WHERE name = ? LIMIT 1`, [name.trim()]);
  if (found.length) return found[0].id;
  const [ins] = await pool.query(`INSERT INTO ${tableName} (name) VALUES (?)`, [name.trim()]);
  return ins.insertId;
}

// Coerce decimals or return null
function toDecimalOrNull(v) {
  if (v === null || v === undefined) return null;
  if (typeof v === 'number') return v;
  const n = parseFloat(String(v).replace(/[,$]/g, ''));
  return Number.isFinite(n) ? n : null;
}

// Accepts TIFFs in form field `files`
app.post('/documents/ocr', upload.array('files', 20), async (req, res) => {
  const openai = new OpenAI({ apiKey: await getOpenAPIKey() });
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded. Send TIFFs in `files`.' });
    }

    // 1) Convert all TIFF pages to PNG data URLs for the Vision API
    const imageParts = [];
    const pageErrors = [];

    for (const f of req.files) {
      try {
        const meta = await sharp(f.buffer, { failOnError: false }).metadata();
        const pages = Number.isFinite(meta.pages) && meta.pages > 0 ? meta.pages : 1;

        for (let i = 0; i < pages; i++) {
          try {
            const png = await sharp(f.buffer, {
                page: i,
                limitInputPixels: false,   // allow very large pages
                failOnError: false         // don’t throw on minor decode issues
              })
              // optional: if your TIFFs are 1-bit FAX/CCITT, this helps normalize
              .ensureAlpha()               // normalize channels
              .png({ compressionLevel: 9 })// lossless, smaller
              .toBuffer();

            const b64 = png.toString('base64');
            imageParts.push({ type: 'input_image', image_url: `data:image/png;base64,${b64}` });
          } catch (err) {
            pageErrors.push({ file: f.originalname, page: i, reason: String(err?.message || err) });
            // continue to next page/file
          }
        }
      } catch (err) {
        pageErrors.push({ file: f.originalname, page: 'metadata', reason: String(err?.message || err) });
      }
    }

    /* if (imageParts.length === 0) {
      return res.status(422).json({
        error: 'Failed to decode any TIFF pages',
        details: pageErrors.slice(0, 10) // include a sample for debugging
      });
    } */
    // 2) Instruction + JSON Schema for Structured Outputs
    const instruction = {
      type: 'input_text',
      text:
        'You are an expert data extraction AI specializing in Texas land title records. ' +
        'Read ALL images (they form one recorded document), perform OCR, interpret clerk stamps, handwriting, and typewritten content, ' +
        'and return ONE JSON object with exactly this structure (no extra keys): ' +
        '{ "lookups": { "Abstract": {"name": "..."}, "BookType": {"name": "..."}, "Subdivision": {"name": "..."}, "County": {"name": "..."} }, ' +
        '"document": { "instrumentNumber": "...", "book": "...", "volume": "...", "page": "...", "grantor": "...", "grantee": "...", ' +
        '"instrumentType": "...", "remarks": "...", "lienAmount": "...", "legalDescription": "...", "subBlock": "...", "abstractText": "...", ' +
        '"acres": "...", "fileStampDate": "YYYY-MM-DD", "filingDate": "YYYY-MM-DD", "nFileReference": "...", "finalizedBy": "...", "exportFlag": 0, ' +
        '"propertyType": "...", "GFNNumber": "...", "marketShare": "...", "sortArray": "...", "address": "...", "CADNumber": "...", "CADNumber2": "...", ' +
        '"GLOLink": "...", "fieldNotes": "..." }, ' +
        '"ai_extraction": { "accuracy": 0.0, "fieldsExtracted": { "supporting_keys": "..." }, "extraction_notes": [] } } ' +
        'Rules: normalize dates to YYYY-MM-DD; represent money/acreage as decimals; separate multiple parties with a semicolon; ' +
        'use null (not empty strings) if unknown; merge multi-line legal descriptions; ensure instrumentType reflects legal purpose (e.g., Warranty Deed, Lien, Release); ' +
        'fileStampDate must come from the physical clerk stamp; filingDate from the “Filed/Recorded” label; verify header stamps vs body text; output ONLY the JSON. Do not make up data. Only use data that is extracted from the uploaded files.'
    };

    const response_format = {
  type: 'json_schema',
  name: 'title_packet',
  schema: {
    type: 'object',
    additionalProperties: false,
    required: ['lookups', 'document', 'ai_extraction'],
    properties: {
      lookups: {
        type: 'object',
        additionalProperties: false,
        required: ['Abstract', 'BookType', 'Subdivision', 'County'],
        properties: {
          Abstract: {
            type: 'object',
            additionalProperties: false,
            required: ['name'],
            properties: { name: { type: ['string', 'null'] } }
          },
          BookType: {
            type: 'object',
            additionalProperties: false,
            required: ['name'],
            properties: { name: { type: ['string', 'null'] } }
          },
          Subdivision: {
            type: 'object',
            additionalProperties: false,
            required: ['name'],
            properties: { name: { type: ['string', 'null'] } }
          },
          County: {
            type: 'object',
            additionalProperties: false,
            required: ['name'],
            properties: { name: { type: ['string', 'null'] } }
          }
        }
      },

      document: {
        type: 'object',
        additionalProperties: false,
         required: [
          'instrumentNumber','book','volume','page','grantor','grantee','instrumentType',
          'remarks','lienAmount','legalDescription','subBlock','abstractText','acres',
          'fileStampDate','filingDate','nFileReference','finalizedBy','exportFlag',
          'propertyType','GFNNumber','marketShare','sortArray','address','CADNumber',
          'CADNumber2','GLOLink','fieldNotes'
        ],
        properties: {
          instrumentNumber: { type: ['string', 'null'] },
          book:             { type: ['string', 'null'] },
          volume:           { type: ['string', 'null'] },
          page:             { type: ['string', 'null'] },
          grantor:          { type: ['string', 'null'] },
          grantee:          { type: ['string', 'null'] },
          instrumentType:   { type: ['string', 'null'] },
          remarks:          { type: ['string', 'null'] },
          lienAmount:       { type: ['number', 'null'] },
          legalDescription: { type: ['string', 'null'] },
          subBlock:         { type: ['string', 'null'] },
          abstractText:     { type: ['string', 'null'] },
          acres:            { type: ['number', 'null'] },
          fileStampDate:    { type: ['string', 'null'] },
          filingDate:       { type: ['string', 'null'] },
          nFileReference:   { type: ['string', 'null'] },
          finalizedBy:      { type: ['string', 'null'] },
          exportFlag:       { type: 'integer' },
          propertyType:     { type: ['string', 'null'] },
          GFNNumber:        { type: ['string', 'null'] },
          marketShare:      { type: ['string', 'null'] },
          sortArray:        { type: ['string', 'null'] },
          address:          { type: ['string', 'null'] },
          CADNumber:        { type: ['string', 'null'] },
          CADNumber2:       { type: ['string', 'null'] },
          GLOLink:          { type: ['string', 'null'] },
          fieldNotes:       { type: ['string', 'null'] }
        }
      },

      ai_extraction: {
        type: 'object',
        additionalProperties: false,
        required: ['accuracy', 'fieldsExtracted', 'extraction_notes'],
        properties: {
          accuracy: { type: 'number' },
          fieldsExtracted: {
            type: 'object',
            additionalProperties: false,
            required: ['supporting_keys'],
            properties: {
              supporting_keys: { type: ['string', 'null'] }
            }
          },
          extraction_notes: { type: 'array', items: { type: 'string' } }
        }
      }
    }
  }
};


    // 3) Call OpenAI Responses API (Vision + Structured Outputs)
    const resp = await openai.responses.create({
      model: 'gpt-4.1-mini', // supports images + structured output
      input: [{ role: 'user', content: [instruction, ...imageParts] }],
      text: { format: response_format } // <= moved here from top-level
    });

    // You can read structured output from either place:
    const jsonText =
      resp.output_text /* convenience field when text output is present */ ||
      resp.output?.[0]?.content?.[0]?.text;

    if (!jsonText) {
      return res.status(502).json({ error: 'No JSON returned from model.' });
    }
    const extracted = JSON.parse(jsonText);


    // 4) Upsert lookup tables and insert into Document
    const pool = await getPool();
    await pool.query('START TRANSACTION');

    // NOTE: adjust table/column names here if your schema differs
    const abstractID   = await ensureLookupId(pool, 'Abstract',   extracted.lookups?.Abstract?.name || null);
    const bookTypeID   = await ensureLookupId(pool, 'BookType',   extracted.lookups?.BookType?.name || null);
    const subdivisionID= await ensureLookupId(pool, 'Subdivision',extracted.lookups?.Subdivision?.name || null);
    const countyID     = await ensureLookupId(pool, 'County',     extracted.lookups?.County?.name || null);

    const d = extracted.document || {};

    // Coerce numerics cleanly
    const lienAmount = toDecimalOrNull(d.lienAmount);
    const acres      = toDecimalOrNull(d.acres);

    const insertParams = [
      abstractID,
      bookTypeID,
      subdivisionID,
      countyID,
      d.instrumentNumber ?? null,
      d.book ?? null,
      d.volume ?? null,
      d.page ?? null,
      d.grantor ?? null,
      d.grantee ?? null,
      d.instrumentType ?? null,
      d.remarks ?? null,
      lienAmount,
      d.legalDescription ?? null,
      d.subBlock ?? null,
      d.abstractText ?? null,
      acres,
      d.fileStampDate ?? null,
      d.filingDate ?? null,
      d.nFileReference ?? null,
      d.finalizedBy ?? null,
      Number.isInteger(d.exportFlag) ? d.exportFlag : 0,
      d.propertyType ?? null,
      d.GFNNumber ?? null,
      d.marketShare ?? null,
      d.sortArray ?? null,
      d.address ?? null,
      d.CADNumber ?? null,
      d.CADNumber2 ?? null,
      d.GLOLink ?? null,
      d.fieldNotes ?? null
    ];

    const [result] = await pool.query(
      `INSERT INTO Document (
        abstractID, bookTypeID, subdivisionID, countyID,
        instrumentNumber, book, volume, \`page\`, grantor, grantee,
        instrumentType, remarks, lienAmount, legalDescription, subBlock,
        abstractText, acres, fileStampDate, filingDate, nFileReference,
        finalizedBy, exportFlag, propertyType, GFNNumber, marketShare,
        sortArray, address, CADNumber, CADNumber2, GLOLink, fieldNotes
      ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      insertParams
    );

    await pool.query('COMMIT');

    res.status(201).json({
      message: 'Document created via OCR successfully',
      documentID: result.insertId,
      ai_extraction: extracted.ai_extraction || null
    });
  } catch (err) {
    try {
      const pool = await getPool();
      await pool.query('ROLLBACK');
    } catch (_) {}
    console.error('OCR route error:', err);
    res.status(500).json({ error: 'Failed OCR/insert pipeline', details: String(err.message || err) });
  }
});

//SEARCH: GET /documents/search
app.get('/documents/search', async (req, res) => {
  try {
    const pool = await getPool();

    //fields we accept, broken into sets of either text, numbers, or dates :o
    const textLike = new Set([
      'instrumentNumber','book','volume','page','grantor','grantee','instrumentType',
      'remarks','legalDescription','subBlock','abstractText','propertyType',
      'marketShare','sortArray','address','CADNumber','CADNumber2','GLOLink','fieldNotes',
      'finalizedBy','nFileReference'
    ]);
    const numericEq = new Set([
      'documentID','abstractID','bookTypeID','subdivisionID','countyID','exportFlag','GFNNumber'
    ]);
    const dateEq = new Set(['fileStampDate','filingDate','created_at','updated_at']);

    const limit  = Math.min(parseInt(req.query.limit ?? '50', 10) || 50, 200);
    const offset = Math.max(parseInt(req.query.offset ?? '0', 10) || 0, 0);

    const where = [];
    const params = [];

    // applying those field based filters yippee
    for (const [k, vRaw] of Object.entries(req.query)) {
      if (k === 'criteria' || k === 'limit' || k === 'offset') continue;
      const v = String(vRaw).trim();
      if (!v) continue;

      if (numericEq.has(k)) {
        where.push(`\`${k}\` = ?`);
        params.push(v);
      } else if (dateEq.has(k)) {
        // allow exact date or a simple range "YYYY-MM-DD..YYYY-MM-DD"
        const range = v.split('..');
        if (range.length === 2) {
          where.push(`\`${k}\` BETWEEN ? AND ?`);
          params.push(range[0], range[1]);
        } else {
          where.push(`DATE(\`${k}\`) = DATE(?)`);
          params.push(v);
        }
      } else if (textLike.has(k)) {
        where.push(`\`${k}\` LIKE ?`);
        params.push(`%${v}%`);
      }
    }

    // general free text
    const criteria = String(req.query.criteria ?? '').trim();
    if (criteria) {
      const critCols = [
        'instrumentNumber','grantor','grantee','instrumentType','legalDescription',
        'remarks','address','CADNumber','CADNumber2','book','volume','page','abstractText','fieldNotes'
      ];
      const orParts = critCols.map(c => `\`${c}\` LIKE ?`).join(' OR ');
      where.push(`(${orParts})`);
      for (let i = 0; i < critCols.length; i++) params.push(`%${criteria}%`);
    }
    //searching 
    let sql = 'SELECT * FROM Document';
    if (where.length) sql += ' WHERE ' + where.join(' AND ');
    sql += ' ORDER BY (updated_at IS NULL), updated_at DESC, (created_at IS NULL), created_at DESC';
    sql += ' LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const [rows] = await pool.query(sql, params);
    res.status(200).json({ rows, limit, offset, count: rows.length });
  } catch (err) { // error catching :)
    console.error('Error searching documents:', err);
    res.status(500).json({ error: 'Failed to search documents' });
  }
});

// UPDATE: PUT /documents/:id
app.put('/documents/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'Invalid documentID' });
    }

    const pool = await getPool();

    // Whitelist updatable columns
    const updatable = new Set([
      'abstractID','bookTypeID','subdivisionID','countyID',
      'instrumentNumber','book','volume','page','grantor','grantee',
      'instrumentType','remarks','lienAmount','legalDescription','subBlock',
      'abstractText','acres','fileStampDate','filingDate','nFileReference',
      'finalizedBy','exportFlag','propertyType','GFNNumber','marketShare',
      'sortArray','address','CADNumber','CADNumber2','GLOLink','fieldNotes'
    ]);

    const body = req.body || {};
    const sets = [];
    const params = [];

    for (const [k, v] of Object.entries(body)) {
      if (!updatable.has(k)) continue;
      // page is reserved word -> backtick it (we backtick all keys anyway)
      sets.push(`\`${k}\` = ?`);
      params.push(v === '' ? null : v);
    }

    if (sets.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    // touch updated_at if present in your schema (optional)
    // sets.push('`updated_at` = NOW()');

    const sql = `UPDATE Document SET ${sets.join(', ')} WHERE documentID = ?`;
    params.push(id);

    const [result] = await pool.query(sql, params);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Document not found' });
    }

    res.json({ message: 'Document updated', documentID: id });
  } catch (err) {
    console.error('Update error:', err);
    res.status(500).json({ error: 'Failed to update document' });
  }
});

// DELETE: DELETE /documents/:id
app.delete('/documents/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'Invalid documentID' });
    }

    const pool = await getPool();
    const [result] = await pool.query('DELETE FROM Document WHERE documentID = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Document not found' });
    }

    res.json({ message: 'Document deleted', documentID: id });
  } catch (err) {
    console.error('Delete error:', err);
    res.status(500).json({ error: 'Failed to delete document' });
  }
});



module.exports = app;