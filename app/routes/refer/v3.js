"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const http_status_codes_1 = require("http-status-codes");
const moment = require("moment");
var crypto = require('crypto');
const his_ezhosp_1 = require("../../models/refer/his_ezhosp");
const his_thiades_1 = require("../../models/refer/his_thiades");
const his_hosxpv3_1 = require("../../models/refer/his_hosxpv3");
const his_hosxpv4_1 = require("../../models/refer/his_hosxpv4");
const his_jhcis_1 = require("../../models/refer/his_jhcis");
const his_md_1 = require("../../models/refer/his_md");
const his_kpstat_1 = require("../../models/refer/his_kpstat");
const his_mkhospital_1 = require("../../models/refer/his_mkhospital");
const his_1 = require("../../models/refer/his");
const his_nemo_1 = require("../../models/refer/his_nemo");
const his_pmk_1 = require("../../models/refer/his_pmk");
const his_hosxppcu_model_1 = require("../../models/isonline/his_hosxppcu.model");
const his_mypcu_1 = require("../../models/refer/his_mypcu");
const his_emrsoft_1 = require("../../models/refer/his_emrsoft");
const hisProvider = process.env.HIS_PROVIDER;
let hisModel;
switch (hisProvider) {
    case 'ihospital':
    case 'ezhosp':
        hisModel = new his_ezhosp_1.HisEzhospModel();
        break;
    case 'thiades':
        hisModel = new his_thiades_1.HisThiadesModel();
        break;
    case 'hosxpv3':
        hisModel = new his_hosxpv3_1.HisHosxpv3Model();
        break;
    case 'hosxpv4':
        hisModel = new his_hosxpv4_1.HisHosxpv4Model();
        break;
    case 'hosxppcu':
        hisModel = new his_hosxppcu_model_1.HisHosxppcuModel();
        break;
    case 'mkhospital':
        hisModel = new his_mkhospital_1.HisMkhospitalModel();
        break;
    case 'nemo':
    case 'nemo_refer':
        hisModel = new his_nemo_1.HisNemoModel();
        break;
    case 'ssb':
        break;
    case 'infod':
    case 'homc':
        break;
    case 'hi':
        break;
    case 'himpro':
        break;
    case 'jhcis':
        hisModel = new his_jhcis_1.HisJhcisModel();
        break;
    case 'mypcu':
        hisModel = new his_mypcu_1.HisMyPcuModel();
        break;
    case 'hospitalos':
        break;
    case 'jhos':
        break;
    case 'pmk':
        hisModel = new his_pmk_1.HisPmkModel();
        break;
    case 'md':
        hisModel = new his_md_1.HisMdModel();
        break;
    case 'emrsoft':
        hisModel = new his_emrsoft_1.HisEmrSoftModel();
        break;
    case 'spdc':
    case 'kpstat':
        hisModel = new his_kpstat_1.HisKpstatModel();
        break;
    default:
        hisModel = new his_1.HisModel();
}
const router = (fastify, {}, next) => {
    fastify.get('/', async (req, reply) => {
        reply.send({
            apiCode: 'nRefer',
            api: 'refer V.3',
            version: global.appDetail.version,
            subVersion: global.appDetail.subVersion
        });
    });
    fastify.get('/alive/:requestKey', async (req, reply) => {
        const requestKey = req.params.requestKey;
        var hashRequestKey = crypto.createHash('md5').update(process.env.REQUEST_KEY).digest('hex');
        const requestKeyVerified = requestKey === hashRequestKey;
        try {
            const result = await hisModel.getTableName(global.dbHIS);
            if (result && result.length) {
                reply.status(http_status_codes_1.StatusCodes.OK).send({
                    statusCode: http_status_codes_1.StatusCodes.OK,
                    hisProvider: hisProvider, connection: true,
                    RequestKey: requestKeyVerified,
                });
            }
            else {
                reply.status(http_status_codes_1.StatusCodes.OK).send({ statusCode: http_status_codes_1.StatusCodes.SERVICE_UNAVAILABLE, message: (0, http_status_codes_1.getReasonPhrase)(http_status_codes_1.StatusCodes.SERVICE_UNAVAILABLE), RequestKey: requestKeyVerified });
            }
        }
        catch (error) {
            console.log('alive', error.message);
            reply.status(http_status_codes_1.StatusCodes.OK).send({ statusCode: http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, message: error.message, RequestKey: requestKeyVerified });
        }
    });
    fastify.get('/tbl/:requestKey', async (req, reply) => {
        const requestKey = req.params.requestKey;
        var hashRequestKey = crypto.createHash('md5').update(process.env.REQUEST_KEY).digest('hex');
        if (requestKey !== hashRequestKey) {
            reply.status(http_status_codes_1.StatusCodes.UNAUTHORIZED).send({ statusCode: http_status_codes_1.StatusCodes.UNAUTHORIZED, message: (0, http_status_codes_1.getReasonPhrase)(http_status_codes_1.StatusCodes.UNAUTHORIZED) });
            return false;
        }
        try {
            const result = await hisModel.getTableName(global.dbHIS);
            reply.status(http_status_codes_1.StatusCodes.OK).send({ statusCode: http_status_codes_1.StatusCodes.OK, tblCount: result.length });
        }
        catch (error) {
            console.log('tbl', error.message);
            reply.status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR).send({ statusCode: http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, message: (0, http_status_codes_1.getReasonPhrase)(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR) });
        }
    });
    fastify.post('/referout', { preHandler: [fastify.authenticate] }, async (req, reply) => {
        const now = moment().locale('th').format('YYYY-MM-DD');
        const date = req.body.date || now;
        const hospcode = req.body.hospcode || process.env.HOSPCODE;
        try {
            const result = await hisModel.getReferOut(global.dbHIS, date, hospcode);
            reply.status(http_status_codes_1.StatusCodes.OK).send({ statusCode: http_status_codes_1.StatusCodes.OK, rows: result });
        }
        catch (error) {
            console.log('referout', error.message);
            reply.status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR).send({ statusCode: http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, message: error.message });
        }
    });
    fastify.post('/person', { preHandler: [fastify.authenticate] }, async (req, reply) => {
        const hn = req.body.hn || '';
        const cid = req.body.cid || '';
        const hospcode = req.body.hospcode || process.env.HOSPCODE;
        if (!hn && !cid) {
            reply.status(http_status_codes_1.StatusCodes.BAD_REQUEST).send({ statusCode: http_status_codes_1.StatusCodes.BAD_REQUEST, message: (0, http_status_codes_1.getReasonPhrase)(http_status_codes_1.StatusCodes.BAD_REQUEST) });
            return;
        }
        try {
            const now = moment().locale('th').format('YYYY-MM-DD HH:mm:ss');
            let typeSearch = 'hn';
            let textSearch = hn;
            if (cid) {
                typeSearch = 'cid';
                textSearch = cid;
            }
            const result = await hisModel.getPerson(global.dbHIS, typeSearch, textSearch, hospcode);
            reply.status(http_status_codes_1.StatusCodes.OK).send({ statusCode: http_status_codes_1.StatusCodes.OK, rows: result });
        }
        catch (error) {
            console.log('person', error.message);
            reply.status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR).send({ statusCode: http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, message: (0, http_status_codes_1.getReasonPhrase)(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR) });
        }
    });
    fastify.post('/address', { preHandler: [fastify.authenticate] }, async (req, reply) => {
        const hn = req.body.hn || '';
        const hospcode = req.body.hospcode || process.env.HOSPCODE;
        if (!hn) {
            reply.status(http_status_codes_1.StatusCodes.BAD_REQUEST).send({ statusCode: http_status_codes_1.StatusCodes.BAD_REQUEST, message: (0, http_status_codes_1.getReasonPhrase)(http_status_codes_1.StatusCodes.BAD_REQUEST) });
            return;
        }
        try {
            let typeSearch = 'hn';
            let textSearch = hn;
            const result = await hisModel.getAddress(global.dbHIS, typeSearch, textSearch, hospcode);
            reply.status(http_status_codes_1.StatusCodes.OK).send({ statusCode: http_status_codes_1.StatusCodes.OK, rows: result });
        }
        catch (error) {
            console.log('address', error.message);
            reply.status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR).send({ statusCode: http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, message: (0, http_status_codes_1.getReasonPhrase)(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR) });
        }
    });
    fastify.post('/drugallergy', { preHandler: [fastify.authenticate] }, async (req, reply) => {
        const hn = req.body.hn || '';
        const hospcode = req.body.hospcode || process.env.HOSPCODE;
        if (!hn) {
            reply.send({ statusCode: http_status_codes_1.StatusCodes.BAD_REQUEST, message: (0, http_status_codes_1.getReasonPhrase)(http_status_codes_1.StatusCodes.BAD_REQUEST) });
            return;
        }
        try {
            const result = await hisModel.getDrugAllergy(global.dbHIS, hn, hospcode);
            reply.send({ statusCode: http_status_codes_1.StatusCodes.OK, rows: result });
        }
        catch (error) {
            console.log('drug allergy', error.message);
            reply.status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR).send({ statusCode: http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, message: (0, http_status_codes_1.getReasonPhrase)(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR) });
        }
    });
    fastify.post('/service', { preHandler: [fastify.authenticate] }, async (req, reply) => {
        const hn = req.body.hn || '';
        const visitNo = req.body.visitNo || '';
        const hospcode = req.body.hospcode || process.env.HOSPCODE;
        if (!hn && !visitNo) {
            reply.status(http_status_codes_1.StatusCodes.BAD_REQUEST).send({ statusCode: http_status_codes_1.StatusCodes.BAD_REQUEST, message: (0, http_status_codes_1.getReasonPhrase)(http_status_codes_1.StatusCodes.BAD_REQUEST) });
            return;
        }
        try {
            let typeSearch = 'hn';
            let textSearch = hn;
            if (visitNo) {
                typeSearch = 'visitNo';
                textSearch = visitNo;
            }
            const result = await hisModel.getService(global.dbHIS, typeSearch, textSearch, hospcode);
            reply.status(http_status_codes_1.StatusCodes.OK).send({ statusCode: http_status_codes_1.StatusCodes.OK, rows: result });
        }
        catch (error) {
            console.log('service', error.message);
            reply.status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR).send({ statusCode: http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, message: error.message });
        }
    });
    fastify.post('/admission', { preHandler: [fastify.authenticate] }, async (req, reply) => {
        const typeSearch = req.body.typeSearch;
        const textSearch = req.body.textSearch;
        const hospcode = req.body.hospcode || process.env.HOSPCODE;
        if (!typeSearch && !textSearch) {
            reply.status(http_status_codes_1.StatusCodes.BAD_REQUEST).send({ statusCode: http_status_codes_1.StatusCodes.BAD_REQUEST, message: (0, http_status_codes_1.getReasonPhrase)(http_status_codes_1.StatusCodes.BAD_REQUEST) });
            return;
        }
        else {
            try {
                const result = await hisModel.getAdmission(global.dbHIS, typeSearch, textSearch, hospcode);
                reply.status(http_status_codes_1.StatusCodes.OK).send({ statusCode: http_status_codes_1.StatusCodes.OK, rows: result });
            }
            catch (error) {
                console.log('admission', error.message);
                reply.send({ statusCode: http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, message: error.message });
            }
        }
    });
    fastify.post('/diagnosis-opd', { preHandler: [fastify.authenticate] }, async (req, reply) => {
        const visitNo = req.body.visitNo;
        const hospcode = req.body.hospcode || process.env.HOSPCODE;
        if (!visitNo) {
            reply.status(http_status_codes_1.StatusCodes.BAD_REQUEST).send({ statusCode: http_status_codes_1.StatusCodes.BAD_REQUEST, message: (0, http_status_codes_1.getReasonPhrase)(http_status_codes_1.StatusCodes.BAD_REQUEST) });
            return;
        }
        try {
            const result = await hisModel.getDiagnosisOpd(global.dbHIS, visitNo, hospcode);
            reply.status(http_status_codes_1.StatusCodes.OK).send({ statusCode: http_status_codes_1.StatusCodes.OK, rows: result });
        }
        catch (error) {
            console.log('diagnosis_opd', error.message);
            reply.status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR).send({ statusCode: http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, message: error.message });
        }
    });
    fastify.post('/diagnosis-ipd', { preHandler: [fastify.authenticate] }, async (req, reply) => {
        const an = req.body.an;
        const hospcode = req.body.hospcode || process.env.HOSPCODE;
        if (!an) {
            reply.status(http_status_codes_1.StatusCodes.BAD_REQUEST).send({ statusCode: http_status_codes_1.StatusCodes.BAD_REQUEST, message: 'not found AN ' });
            return;
        }
        else {
            try {
                const result = await hisModel.getDiagnosisIpd(global.dbHIS, 'an', an, hospcode);
                reply.status(http_status_codes_1.StatusCodes.OK).send({ statusCode: http_status_codes_1.StatusCodes.OK, rows: result });
            }
            catch (error) {
                console.log('diagnosis_ipd', error.message);
                reply.status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR).send({ statusCode: http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, message: (0, http_status_codes_1.getReasonPhrase)(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR) });
            }
        }
    });
    fastify.post('/procedure-opd', { preHandler: [fastify.authenticate] }, async (req, reply) => {
        const visitNo = req.body.visitNo;
        const hospcode = req.body.hospcode || process.env.HOSPCODE;
        if (!visitNo) {
            reply.status(http_status_codes_1.StatusCodes.BAD_REQUEST).send({ statusCode: http_status_codes_1.StatusCodes.BAD_REQUEST, message: (0, http_status_codes_1.getReasonPhrase)(http_status_codes_1.StatusCodes.BAD_REQUEST) });
            return;
        }
        try {
            const rows = await hisModel.getProcedureOpd(global.dbHIS, visitNo, hospcode);
            reply.status(http_status_codes_1.StatusCodes.OK).send({ statusCode: http_status_codes_1.StatusCodes.OK, rows });
        }
        catch (error) {
            console.log('procudure_opd', error.message);
            reply.status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR).send({ statusCode: http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, message: error.message });
        }
    });
    fastify.post('/procedure-ipd', { preHandler: [fastify.authenticate] }, async (req, reply) => {
        const an = req.body.an;
        const hospcode = req.body.hospcode || process.env.HOSPCODE;
        if (!an) {
            reply.status(http_status_codes_1.StatusCodes.BAD_REQUEST).send({ statusCode: http_status_codes_1.StatusCodes.BAD_REQUEST, message: (0, http_status_codes_1.getReasonPhrase)(http_status_codes_1.StatusCodes.BAD_REQUEST) });
            return;
        }
        try {
            const rows = await hisModel.getProcedureIpd(global.dbHIS, an, hospcode);
            reply.status(http_status_codes_1.StatusCodes.OK).send({ statusCode: http_status_codes_1.StatusCodes.OK, rows });
        }
        catch (error) {
            console.log('procudure_opd', error.message);
            reply.status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR).send({ statusCode: http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, message: error.message });
        }
    });
    fastify.post('/drug-opd', { preHandler: [fastify.authenticate] }, async (req, reply) => {
        const visitNo = req.body.visitNo;
        const hospcode = req.body.hospcode || process.env.HOSPCODE;
        if (!visitNo) {
            reply.status(http_status_codes_1.StatusCodes.BAD_REQUEST).send({ statusCode: http_status_codes_1.StatusCodes.BAD_REQUEST, message: (0, http_status_codes_1.getReasonPhrase)(http_status_codes_1.StatusCodes.BAD_REQUEST) });
            return;
        }
        try {
            const rows = await hisModel.getDrugOpd(global.dbHIS, visitNo, hospcode);
            reply.status(http_status_codes_1.StatusCodes.OK).send({ statusCode: http_status_codes_1.StatusCodes.OK, rows });
        }
        catch (error) {
            console.log('drug_opd', error.message);
            reply.status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR).send({ statusCode: http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, message: error.message });
        }
    });
    fastify.post('/drug-ipd', { preHandler: [fastify.authenticate] }, async (req, reply) => {
        const an = req.body.an;
        const hospcode = req.body.hospcode || process.env.HOSPCODE;
        if (!an) {
            reply.status(http_status_codes_1.StatusCodes.BAD_REQUEST).send({ statusCode: http_status_codes_1.StatusCodes.BAD_REQUEST, message: (0, http_status_codes_1.getReasonPhrase)(http_status_codes_1.StatusCodes.BAD_REQUEST) });
            return;
        }
        try {
            const rows = await hisModel.getDrugIpd(global.dbHIS, an, hospcode);
            reply.status(http_status_codes_1.StatusCodes.OK).send({ statusCode: http_status_codes_1.StatusCodes.OK, rows });
        }
        catch (error) {
            console.log('drug_ipd', error.message);
            reply.status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR).send({ statusCode: http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, message: error.message });
        }
    });
    fastify.post('/charge-opd', { preHandler: [fastify.authenticate] }, async (req, reply) => {
        const visitNo = req.body.visitNo;
        const hospcode = req.body.hospcode || process.env.HOSPCODE;
        if (!visitNo) {
            reply.status(http_status_codes_1.StatusCodes.BAD_REQUEST).send({ statusCode: http_status_codes_1.StatusCodes.BAD_REQUEST, message: (0, http_status_codes_1.getReasonPhrase)(http_status_codes_1.StatusCodes.BAD_REQUEST) });
            return;
        }
        try {
            const rows = await hisModel.getChargeOpd(global.dbHIS, visitNo, hospcode);
            reply.status(http_status_codes_1.StatusCodes.OK).send({ statusCode: http_status_codes_1.StatusCodes.OK, rows });
        }
        catch (error) {
            console.log('charge_opd', error.message);
            reply.status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR).send({ statusCode: http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, message: error.message });
        }
    });
    fastify.post('/charge-ipd', { preHandler: [fastify.authenticate] }, async (req, reply) => {
        const an = req.body.an;
        const hospcode = req.body.hospcode || process.env.HOSPCODE;
        if (!an) {
            reply.status(http_status_codes_1.StatusCodes.BAD_REQUEST).send({ statusCode: http_status_codes_1.StatusCodes.BAD_REQUEST, message: (0, http_status_codes_1.getReasonPhrase)(http_status_codes_1.StatusCodes.BAD_REQUEST) });
            return;
        }
        try {
            const rows = await hisModel.getChargeIpd(global.dbHIS, an, hospcode);
            reply.status(http_status_codes_1.StatusCodes.OK).send({ statusCode: http_status_codes_1.StatusCodes.OK, rows });
        }
        catch (error) {
            console.log('charge_ipd', error.message);
            reply.status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR).send({ statusCode: http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, message: error.message });
        }
    });
    fastify.post('/accident', { preHandler: [fastify.authenticate] }, async (req, reply) => {
        const visitNo = req.body.visitNo;
        const hospcode = req.body.hospcode || process.env.HOSPCODE;
        if (!visitNo) {
            reply.status(http_status_codes_1.StatusCodes.BAD_REQUEST).send({ statusCode: http_status_codes_1.StatusCodes.BAD_REQUEST, message: (0, http_status_codes_1.getReasonPhrase)(http_status_codes_1.StatusCodes.BAD_REQUEST) });
            return;
        }
        try {
            const rows = await hisModel.getAccident(global.dbHIS, visitNo, hospcode);
            reply.status(http_status_codes_1.StatusCodes.OK).send({ statusCode: http_status_codes_1.StatusCodes.OK, rows });
        }
        catch (error) {
            console.log('accident', error.message);
            reply.status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR).send({ statusCode: http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, message: error.message });
        }
    });
    fastify.post('/appointment', { preHandler: [fastify.authenticate] }, async (req, reply) => {
        const visitNo = req.body.visitNo;
        const hospcode = req.body.hospcode || process.env.HOSPCODE;
        if (!visitNo) {
            reply.status(http_status_codes_1.StatusCodes.BAD_REQUEST).send({ statusCode: http_status_codes_1.StatusCodes.BAD_REQUEST, message: (0, http_status_codes_1.getReasonPhrase)(http_status_codes_1.StatusCodes.BAD_REQUEST) });
            return;
        }
        try {
            const rows = await hisModel.getAppointment(global.dbHIS, visitNo, hospcode);
            reply.status(http_status_codes_1.StatusCodes.OK).send({ statusCode: http_status_codes_1.StatusCodes.OK, rows });
        }
        catch (error) {
            console.log('appointment', error.message);
            reply.status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR).send({ statusCode: http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, message: error.message });
        }
    });
    fastify.post('/refer-history', { preHandler: [fastify.authenticate] }, async (req, reply) => {
        const visitNo = req.body.visitNo;
        const referNo = req.body.referNo;
        const hospcode = req.body.hospcode || process.env.HOSPCODE;
        if (!visitNo && !referNo) {
            reply.status(http_status_codes_1.StatusCodes.BAD_REQUEST).send({ statusCode: http_status_codes_1.StatusCodes.BAD_REQUEST, message: (0, http_status_codes_1.getReasonPhrase)(http_status_codes_1.StatusCodes.BAD_REQUEST) });
            return;
        }
        try {
            let typeSearch = 'referNo';
            let textSearch = referNo;
            if (visitNo) {
                typeSearch = 'visitNo';
                textSearch = visitNo;
            }
            const rows = await hisModel.getReferHistory(global.dbHIS, typeSearch, textSearch, hospcode);
            reply.status(http_status_codes_1.StatusCodes.OK).send({ statusCode: http_status_codes_1.StatusCodes.OK, rows });
        }
        catch (error) {
            console.log('refer_history', error.message);
            reply.status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR).send({ statusCode: http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, message: error.message });
        }
    });
    fastify.post('/clinical-refer', { preHandler: [fastify.authenticate] }, async (req, reply) => {
        const referNo = req.body.referNo;
        const hospcode = req.body.hospcode || process.env.HOSPCODE;
        if (!referNo) {
            reply.status(http_status_codes_1.StatusCodes.BAD_REQUEST).send({ statusCode: http_status_codes_1.StatusCodes.BAD_REQUEST, message: (0, http_status_codes_1.getReasonPhrase)(http_status_codes_1.StatusCodes.BAD_REQUEST) });
            return;
        }
        try {
            const rows = await hisModel.getClinicalRefer(global.dbHIS, referNo, hospcode);
            reply.status(http_status_codes_1.StatusCodes.OK).send({ statusCode: http_status_codes_1.StatusCodes.OK, rows });
        }
        catch (error) {
            console.log('clinical_refer', error.message);
            reply.status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR).send({ statusCode: http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, message: error.message });
        }
    });
    fastify.post('/investigation-refer', { preHandler: [fastify.authenticate] }, async (req, reply) => {
        const referNo = req.body.referNo;
        const hospcode = req.body.hospcode || process.env.HOSPCODE;
        if (!referNo) {
            reply.status(http_status_codes_1.StatusCodes.BAD_REQUEST).send({ statusCode: http_status_codes_1.StatusCodes.BAD_REQUEST, message: (0, http_status_codes_1.getReasonPhrase)(http_status_codes_1.StatusCodes.BAD_REQUEST) });
            return;
        }
        try {
            const rows = await hisModel.getInvestigationRefer(global.dbHIS, referNo, hospcode);
            reply.status(http_status_codes_1.StatusCodes.OK).send({ statusCode: http_status_codes_1.StatusCodes.OK, rows });
        }
        catch (error) {
            console.log('investigation_refer', error.message);
            reply.status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR).send({ statusCode: http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, message: error.message });
        }
    });
    fastify.post('/care-refer', { preHandler: [fastify.authenticate] }, async (req, reply) => {
        const referNo = req.body.referNo;
        const hospcode = req.body.hospcode || process.env.HOSPCODE;
        if (!referNo) {
            reply.status(http_status_codes_1.StatusCodes.BAD_REQUEST).send({ statusCode: http_status_codes_1.StatusCodes.BAD_REQUEST, message: (0, http_status_codes_1.getReasonPhrase)(http_status_codes_1.StatusCodes.BAD_REQUEST) });
            return;
        }
        try {
            const rows = await hisModel.getCareRefer(global.dbHIS, referNo, hospcode);
            reply.status(http_status_codes_1.StatusCodes.OK).send({ statusCode: http_status_codes_1.StatusCodes.OK, rows });
        }
        catch (error) {
            console.log('care_refer', error.message);
            reply.status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR).send({ statusCode: http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, message: error.message });
        }
    });
    fastify.post('/refer-result', { preHandler: [fastify.authenticate] }, async (req, reply) => {
        const hospDestination = req.body.hospDestination;
        const referNo = req.body.referNo;
        const hospcode = req.body.hospcode || process.env.HOSPCODE;
        if (!referNo && !hospDestination) {
            reply.status(http_status_codes_1.StatusCodes.BAD_REQUEST).send({ statusCode: http_status_codes_1.StatusCodes.BAD_REQUEST, message: (0, http_status_codes_1.getReasonPhrase)(http_status_codes_1.StatusCodes.BAD_REQUEST) });
            return;
        }
        try {
            const rows = await hisModel.getReferResult(global.dbHIS, hospDestination, referNo, hospcode);
            reply.status(http_status_codes_1.StatusCodes.OK).send({ statusCode: http_status_codes_1.StatusCodes.OK, rows });
        }
        catch (error) {
            console.log('refer_result', error.message);
            reply.status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR).send({ statusCode: http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, message: error.message });
        }
    });
    fastify.post('/provider', { preHandler: [fastify.authenticate] }, async (req, reply) => {
        const licenseNo = req.body.licenseNo;
        const cid = req.body.cid;
        const hospcode = req.body.hospcode || process.env.HOSPCODE;
        if (!licenseNo && !cid) {
            reply.status(http_status_codes_1.StatusCodes.BAD_REQUEST).send({ statusCode: http_status_codes_1.StatusCodes.BAD_REQUEST, message: (0, http_status_codes_1.getReasonPhrase)(http_status_codes_1.StatusCodes.BAD_REQUEST) });
            return;
        }
        let typeSearch = 'cid';
        let textSearch = cid;
        if (licenseNo) {
            typeSearch = 'licenseNo';
            textSearch = licenseNo;
        }
        try {
            const rows = await hisModel.getProvider(global.dbHIS, typeSearch, textSearch, hospcode);
            reply.status(http_status_codes_1.StatusCodes.OK).send({ statusCode: http_status_codes_1.StatusCodes.OK, rows });
        }
        catch (error) {
            console.log('provider', error.message);
            reply.status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR).send({ statusCode: http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, message: error.message });
        }
    });
    fastify.post('/department', { preHandler: [fastify.authenticate] }, async (req, reply) => {
        const depCode = req.body.depCode;
        const depName = req.body.depName;
        try {
            const rows = await hisModel.getDepartment(global.dbHIS, depCode, depName);
            reply.status(http_status_codes_1.StatusCodes.OK).send({ statusCode: http_status_codes_1.StatusCodes.OK, rows });
        }
        catch (error) {
            reply.status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR).send({ statusCode: http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, message: error.message });
        }
    });
    fastify.post('/ward', { preHandler: [fastify.authenticate] }, async (req, reply) => {
        const wardCode = req.body.wardCode;
        const wardName = req.body.wardName;
        try {
            const rows = await hisModel.getWard(global.dbHIS, wardCode, wardName);
            reply.status(http_status_codes_1.StatusCodes.OK).send({ statusCode: http_status_codes_1.StatusCodes.OK, rows });
        }
        catch (error) {
            reply.status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR).send({ statusCode: http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, message: error.message });
        }
    });
    fastify.post('/doctor', { preHandler: [fastify.authenticate] }, async (req, reply) => {
        const drCode = req.body.drCode;
        const drName = req.body.drName;
        try {
            const rows = await hisModel.getDepartment(global.dbHIS, drCode, drName);
            reply.status(http_status_codes_1.StatusCodes.OK).send({ statusCode: http_status_codes_1.StatusCodes.OK, rows });
        }
        catch (error) {
            reply.status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR).send({ statusCode: http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, message: error.message });
        }
    });
    next();
};
module.exports = router;
