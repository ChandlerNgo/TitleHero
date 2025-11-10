const express = require('express');
const { getPool, getOpenAPIKey, getS3BucketName } = require('../config');
const { listFilesByPrefix, getObjectBuffer } = require('../utils/s3Utils');
const { PDFDocument } = require('pdf-lib');
const { S3Client } = require('@aws-sdk/client-s3');
const multer = require('multer');
const sharp = require('sharp');
const { OpenAI } = require('openai');
const s3 = new S3Client({ region: 'us-east-2' });

const app = express();

/* -------------------------- small helpers -------------------------- */
function nn(v) {
  // normalize: '' -> null, trim strings
  if (v === undefined || v === null) return null;
  if (typeof v === 'string') {
    const t = v.trim();
    return t.length ? t : null;
  }
  return v;
}

function toDecimalOrNull(v) {
  if (v === null || v === undefined) return null;
  if (typeof v === 'number') return Number.isFinite(v) ? v : null;
  const n = parseFloat(String(v).replace(/[,$]/g, ''));
  return Number.isFinite(n) ? n : null;
}

/** ID tables only (auto-increment PKs) */
async function ensureLookupId(pool, tableName, rawName) {
  const name = nn(rawName);
  if (!name) return null;

  const idCol = `${tableName}ID`; // e.g., BookTypeID, SubdivisionID, CountyID
  const [found] = await pool.query(
    `SELECT \`${idCol}\` AS id FROM \`${tableName}\` WHERE \`name\` = ? LIMIT 1`,
    [name]
  );
  if (found.length) return found[0].id;

  const [ins] = await pool.query(
    `INSERT INTO \`${tableName}\` (\`name\`) VALUES (?)`,
    [name]
  );
  return ins.insertId;
}

/** Abstract uses VARCHAR PK: abstractCode. Do NOT create if code is blank. */
async function ensureAbstract(pool, rawCode, rawName) {
  const code = nn(rawCode);
  const name = nn(rawName);
  if (!code) return null; // do not create empty PKs

  const [found] = await pool.query(
    'SELECT abstractCode AS id FROM Abstract WHERE abstractCode = ? LIMIT 1',
    [code]
  );
  if (found.length) return found[0].id;

  await pool.query(
    'INSERT INTO Abstract (abstractCode, name) VALUES (?, ?)',
    [code, name]
  );
  return code;
}

/* ------------------------------ routes ----------------------------- */

// GET: all documents
app.get('/documents', async (req, res) => {
  try {
    const pool = await getPool();
    const [rows] = await pool.query('SELECT * FROM Document;');
    res.status(200).json(rows);
  } catch (err) {
    console.error('Error fetching documents:', err);
    res.status(500).json({ error: 'Failed to fetch documents' });
  }
});

// POST: create document manually
app.post('/documents', async (req, res) => {
  try {
    const pool = await getPool();

    const {
      abstractCode = null,
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
    } = req.body || {};

    const params = [
      nn(abstractCode),
      nn(bookTypeID),
      nn(subdivisionID),
      nn(countyID),
      nn(instrumentNumber),
      nn(book),
      nn(volume),
      nn(page),
      nn(grantor),
      nn(grantee),
      nn(instrumentType),
      nn(remarks),
      toDecimalOrNull(lienAmount),
      nn(legalDescription),
      nn(subBlock),
      nn(abstractText),
      toDecimalOrNull(acres),
      nn(fileStampDate),
      nn(filingDate),
      nn(nFileReference),
      nn(finalizedBy),
      Number.isInteger(exportFlag) ? exportFlag : (exportFlag ? 1 : 0),
      nn(propertyType),
      nn(GFNNumber),
      nn(marketShare),
      nn(sortArray),
      nn(address),
      nn(CADNumber),
      nn(CADNumber2),
      nn(GLOLink),
      nn(fieldNotes)
    ];

    const [result] = await pool.query(
      `INSERT INTO Document (
        abstractCode, bookTypeID, subdivisionID, countyID,
        instrumentNumber, book, volume, \`page\`, grantor, grantee,
        instrumentType, remarks, lienAmount, legalDescription, subBlock,
        abstractText, acres, fileStampDate, filingDate, nFileReference,
        finalizedBy, exportFlag, propertyType, GFNNumber, marketShare,
        sortArray, address, CADNumber, CADNumber2, GLOLink, fieldNotes
      ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      params
    );

    res.status(201).json({
      message: 'Document created successfully',
      documentID: result.insertId
    });
  } catch (err) {
    console.error('Error inserting document:', err);
    res.status(500).json({ error: 'Failed to create document' });
  }
});

/* ---------------------------- OCR pipeline ---------------------------- */
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });

app.post('/documents/ocr', upload.array('files', 20), async (req, res) => {
  const openai = new OpenAI({ apiKey: await getOpenAPIKey() });

  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded. Send TIFFs in `files`.' });
    }

    // Convert TIFF/PDF pages → PNG data URLs
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
              limitInputPixels: false,
              failOnError: false
            })
              .ensureAlpha()
              .png({ compressionLevel: 9 })
              .toBuffer();

            const b64 = png.toString('base64');
            imageParts.push({ type: 'input_image', image_url: `data:image/png;base64,${b64}` });
          } catch (err) {
            pageErrors.push({ file: f.originalname, page: i, reason: String(err?.message || err) });
          }
        }
      } catch (err) {
        pageErrors.push({ file: f.originalname, page: 'metadata', reason: String(err?.message || err) });
      }
    }

    // Instruction + schema (kept close to your current version).
    const instruction = {
      type: 'input_text',
      text:
        'You are an expert data extraction AI specializing in Texas land title records. ' +
        'Read ALL images (they form one recorded document), perform OCR, and return ONLY JSON with this shape: ' +
        '{ "lookups": { "Abstract": {"name": "...", "code": null }, "BookType": {"name": "..."}, "Subdivision": {"name": "..."}, "County": {"name": "..."} }, ' +
        '"document": { /* fields as specified */ }, "ai_extraction": { "accuracy": 0.0, "fieldsExtracted": { "supporting_keys": "..." }, "extraction_notes": [] } } ' +
        'Rules: normalize dates to YYYY-MM-DD; decimals for money/acreage; nulls for unknown; do not invent data.'
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
            // ⬇⬇⬇ FIX: include ALL property keys here
            required: ['name', 'code'],
            properties: {
              name: { type: ['string', 'null'] },
              code: { type: ['string', 'null'] } // can be null if unknown
            }
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

    const resp = await openai.responses.create({
      model: 'gpt-4.1-mini',
      input: [{ role: 'user', content: [instruction, ...imageParts] }],
      text: { format: response_format }
    });

    const jsonText =
      resp.output_text ||
      resp.output?.[0]?.content?.[0]?.text;

    if (!jsonText) {
      return res.status(502).json({ error: 'No JSON returned from model.' });
    }

    const extracted = JSON.parse(jsonText);
    const pool = await getPool();
    await pool.query('START TRANSACTION');

    // Lookups
    const absName = extracted?.lookups?.Abstract?.name ?? null;
    const absCodeFromModel = extracted?.lookups?.Abstract?.code ?? null; // may be null
    const abstractCode = await ensureAbstract(pool, absCodeFromModel, absName); // returns code or null

    const bookTypeID    = await ensureLookupId(pool, 'BookType',    extracted?.lookups?.BookType?.name);
    const subdivisionID = await ensureLookupId(pool, 'Subdivision', extracted?.lookups?.Subdivision?.name);
    const countyID      = await ensureLookupId(pool, 'County',      extracted?.lookups?.County?.name);

    const d = extracted.document || {};
    const insertParams = [
      nn(abstractCode),
      nn(bookTypeID),
      nn(subdivisionID),
      nn(countyID),
      nn(d.instrumentNumber),
      nn(d.book),
      nn(d.volume),
      nn(d.page),
      nn(d.grantor),
      nn(d.grantee),
      nn(d.instrumentType),
      nn(d.remarks),
      toDecimalOrNull(d.lienAmount),
      nn(d.legalDescription),
      nn(d.subBlock),
      nn(d.abstractText),
      toDecimalOrNull(d.acres),
      nn(d.fileStampDate),
      nn(d.filingDate),
      nn(d.nFileReference),
      nn(d.finalizedBy),
      Number.isInteger(d.exportFlag) ? d.exportFlag : 0,
      nn(d.propertyType),
      nn(d.GFNNumber),
      nn(d.marketShare),
      nn(d.sortArray),
      nn(d.address),
      nn(d.CADNumber),
      nn(d.CADNumber2),
      nn(d.GLOLink),
      nn(d.fieldNotes)
    ];

    const [result] = await pool.query(
      `INSERT INTO Document (
        abstractCode, bookTypeID, subdivisionID, countyID,
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

/* ------------------------------- search ------------------------------- */
app.get('/documents/search', async (req, res) => {
  try {
    const pool = await getPool();

    // text / numeric / dates
    const textLike = new Set([
      'instrumentNumber','book','volume','page','grantor','grantee','instrumentType',
      'remarks','legalDescription','subBlock','abstractText','propertyType',
      'marketShare','sortArray','address','CADNumber','CADNumber2','GLOLink','fieldNotes',
      'finalizedBy','nFileReference','abstractCode' // abstractCode is VARCHAR
    ]);
    const numericEq = new Set([
      'documentID','bookTypeID','subdivisionID','countyID','exportFlag','GFNNumber'
    ]);
    const dateEq = new Set(['fileStampDate','filingDate','created_at','updated_at']);

    const limit  = Math.min(parseInt(req.query.limit ?? '50', 10) || 50, 200);
    const offset = Math.max(parseInt(req.query.offset ?? '0', 10) || 0, 0);

    const where = [];
    const params = [];

    for (const [k, vRaw] of Object.entries(req.query)) {
      if (k === 'criteria' || k === 'limit' || k === 'offset') continue;
      const v = String(vRaw ?? '').trim();
      if (!v) continue;

      if (numericEq.has(k)) {
        where.push(`\`${k}\` = ?`);
        params.push(v);
      } else if (dateEq.has(k)) {
        const range = v.split('..');
        if (range.length === 2) {
          where.push(`\`${k}\` BETWEEN ? AND ?`);
          params.push(range[0], range[1]);
        } else {
          where.push(`DATE(\`${k}\`) = DATE(?)`);
          params.push(v);
        }
      } else if (textLike.has(k)) {
        // exact match for abstractCode if you prefer:
        if (k === 'abstractCode') {
          where.push('`abstractCode` = ?');
          params.push(v);
        } else {
          where.push(`\`${k}\` LIKE ?`);
          params.push(`%${v}%`);
        }
      }
    }

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

    let sql = 'SELECT * FROM Document';
    if (where.length) sql += ' WHERE ' + where.join(' AND ');
    sql += ' ORDER BY (updated_at IS NULL), updated_at DESC, (created_at IS NULL), created_at DESC';
    sql += ' LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const [rows] = await pool.query(sql, params);
    res.status(200).json({ rows, limit, offset, count: rows.length });
  } catch (err) {
    console.error('Error searching documents:', err);
    res.status(500).json({ error: 'Failed to search documents' });
  }
});

/* -------------------------- update / delete --------------------------- */
app.put('/documents/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'Invalid documentID' });
    }

    const pool = await getPool();

    const updatable = new Set([
      'abstractCode','bookTypeID','subdivisionID','countyID',
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
      sets.push(`\`${k}\` = ?`);
      if (k === 'lienAmount' || k === 'acres') {
        params.push(toDecimalOrNull(v));
      } else if (k === 'exportFlag') {
        params.push(Number.isInteger(v) ? v : (v ? 1 : 0));
      } else {
        params.push(nn(v));
      }
    }

    if (sets.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

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

app.get('/documents/pdf', async (req, res) => {
  try {
    const userPrefix = req.query.prefix || '';
    if (!userPrefix) {
      return res.status(400).json({ error: 'prefix query param is required' });
    }

    const prefix = `Washington/${userPrefix}.`;
    const keys = await listFilesByPrefix(prefix);

    if (keys.length === 0) {
      return res.status(404).json({ error: 'No files found for prefix' });
    }

    const pdfDoc = await PDFDocument.create();

    for (const key of keys) {
      // Download TIFF from S3
      const tiffBuffer = await getObjectBuffer(key);
      
      // Create sharp instance per file
      const image = sharp(tiffBuffer);

      // Get number of pages in the TIFF
      const metadata = await image.metadata();
      const pageCount = metadata.pages;

      for (let pageIndex = 0; pageIndex < pageCount; pageIndex++) {
        // Extract single page from multi-page TIFF
        const pngBuffer = await sharp(tiffBuffer, { page: pageIndex }).png().toBuffer();

        // Embed PNG in PDF
        const pngImage = await pdfDoc.embedPng(pngBuffer);

        // Add a page and draw the image full page
        const page = pdfDoc.addPage([pngImage.width, pngImage.height]);
        page.drawImage(pngImage, {
          x: 0,
          y: 0,
          width: pngImage.width,
          height: pngImage.height,
        });
      }
    }

    // Save and send the PDF
    const pdfBytes = await pdfDoc.save();

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${userPrefix}.pdf"`);
    res.send(Buffer.from(pdfBytes));
  } catch (error) {
    console.error('Error generating PDF:', error);
    res.status(500).json({ error: 'Failed to generate PDF' });
  }
});

module.exports = app;
