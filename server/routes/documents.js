const express = require('express');
const getPool = require('../config');
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

module.exports = app;