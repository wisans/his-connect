// ห้ามแก้ไข file นี้ // 
import { StatusCodes, getReasonPhrase } from 'http-status-codes';
import * as moment from 'moment';
var crypto = require('crypto');

import { HisEzhospModel } from '../../models/refer/his_ezhosp';
import { HisThiadesModel } from '../../models/refer/his_thiades';
import { HisHosxpv3Model } from '../../models/refer/his_hosxpv3';
import { HisHosxpv4Model } from '../../models/refer/his_hosxpv4';
import { HisJhcisModel } from '../../models/refer/his_jhcis';
import { HisMdModel } from '../../models/refer/his_md';
import { HisKpstatModel } from '../../models/refer/his_kpstat';
import { HisMkhospitalModel } from '../../models/refer/his_mkhospital';
import { HisModel } from '../../models/refer/his';
import { HisNemoModel } from '../../models/refer/his_nemo';
import { HisPmkModel } from '../../models/refer/his_pmk';
import { HisHosxppcuModel } from '../../models/isonline/his_hosxppcu.model';
import { HisMyPcuModel } from '../../models/refer/his_mypcu';
import { HisEmrSoftModel } from '../../models/refer/his_emrsoft';

const hisProvider = process.env.HIS_PROVIDER;
let hisModel: any;
switch (hisProvider) {
  case 'ihospital':
  case 'ezhosp':
    hisModel = new HisEzhospModel();
    break;
  case 'thiades':
    hisModel = new HisThiadesModel();
    break;
  case 'hosxpv3':
    hisModel = new HisHosxpv3Model();
    break;
  case 'hosxpv4':
    hisModel = new HisHosxpv4Model();
    break;
  case 'hosxppcu':
    hisModel = new HisHosxppcuModel();
    break;
  case 'mkhospital':
    hisModel = new HisMkhospitalModel();
    break;
  case 'nemo':
  case 'nemo_refer':
    hisModel = new HisNemoModel();
    break;
  case 'ssb':
    // hisModel = new HisSsbModel();
    break;
  case 'infod':
  case 'homc':
    // hisModel = new HisInfodModel();
    break;
  case 'hi':
    // hisModel = new HisHiModel();
    break;
  case 'himpro':
    // hisModel = new HisHimproModel();
    break;
  case 'jhcis':
    hisModel = new HisJhcisModel();
    break;
  case 'mypcu':
    hisModel = new HisMyPcuModel();
    break;
  case 'hospitalos':
    // hisModel = new HisHospitalOsModel();
    break;
  case 'jhos':
    // hisModel = new HisJhosModel();
    break;
  case 'pmk':
    hisModel = new HisPmkModel();
    break;
  case 'md':
    hisModel = new HisMdModel();
    break;
  case 'emrsoft':
    hisModel = new HisEmrSoftModel();
    break;
  case 'spdc':
  case 'kpstat':
    hisModel = new HisKpstatModel();
    break;
  default:
    hisModel = new HisModel();
}

const router = (fastify, { }, next) => {

  // =============================================================
  fastify.get('/', async (req: any, reply: any) => {
    reply.send({
      apiCode: 'nRefer',
      api: 'refer V.3',
      version: global.appDetail.version,
      subVersion: global.appDetail.subVersion
    });
  });

  // =============================================================
  // ตรวจสอบฐานข้อมูล
  fastify.get('/alive/:requestKey', async (req: any, reply: any) => {
    const requestKey = req.params.requestKey;
    var hashRequestKey = crypto.createHash('md5').update(process.env.REQUEST_KEY).digest('hex');
    const requestKeyVerified = requestKey === hashRequestKey;
    try {
      const result = await hisModel.getTableName(global.dbHIS);
      if (result && result.length) {
        reply.status(StatusCodes.OK).send({
          statusCode: StatusCodes.OK,
          hisProvider: hisProvider, connection: true,
          RequestKey: requestKeyVerified,
        });
      } else {
        reply.status(StatusCodes.OK).send({ statusCode: StatusCodes.SERVICE_UNAVAILABLE, message: getReasonPhrase(StatusCodes.SERVICE_UNAVAILABLE), RequestKey: requestKeyVerified })
      }

    } catch (error) {
      console.log('alive', error.message);
      reply.status(StatusCodes.OK).send({ statusCode: StatusCodes.INTERNAL_SERVER_ERROR, message: error.message, RequestKey: requestKeyVerified })
    }
  });

  // =============================================================
  fastify.get('/tbl/:requestKey', async (req: any, reply: any) => {
    const requestKey = req.params.requestKey;
    var hashRequestKey = crypto.createHash('md5').update(process.env.REQUEST_KEY).digest('hex');
    if (requestKey !== hashRequestKey) {
      reply.status(StatusCodes.UNAUTHORIZED).send({ statusCode: StatusCodes.UNAUTHORIZED, message: getReasonPhrase(StatusCodes.UNAUTHORIZED) })
      return false;
    }

    try {
      const result = await hisModel.getTableName(global.dbHIS);
      reply.status(StatusCodes.OK).send({ statusCode: StatusCodes.OK, tblCount: result.length });
    } catch (error) {
      console.log('tbl', error.message);
      reply.status(StatusCodes.INTERNAL_SERVER_ERROR).send({ statusCode: StatusCodes.INTERNAL_SERVER_ERROR, message: getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR) })
    }
  });

  // 43 แฟ้ม =============================================================
  fastify.post('/referout', { preHandler: [fastify.authenticate] }, async (req: any, reply: any) => {

    const now = moment().locale('th').format('YYYY-MM-DD');
    const date = req.body.date || now;
    const hospcode = req.body.hospcode || process.env.HOSPCODE;

    try {
      const result = await hisModel.getReferOut(global.dbHIS, date, hospcode);
      reply.status(StatusCodes.OK).send({ statusCode: StatusCodes.OK, rows: result });
    } catch (error) {
      console.log('referout', error.message);
      reply.status(StatusCodes.INTERNAL_SERVER_ERROR).send({ statusCode: StatusCodes.INTERNAL_SERVER_ERROR, message: error.message })
    }
  })

  fastify.post('/person', { preHandler: [fastify.authenticate] }, async (req: any, reply: any) => {

    const hn = req.body.hn || '';
    const cid = req.body.cid || '';
    const hospcode = req.body.hospcode || process.env.HOSPCODE;

    if (!hn && !cid) {
      reply.status(StatusCodes.BAD_REQUEST).send({ statusCode: StatusCodes.BAD_REQUEST, message: getReasonPhrase(StatusCodes.BAD_REQUEST) })
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
      reply.status(StatusCodes.OK).send({ statusCode: StatusCodes.OK, rows: result });

    } catch (error) {
      console.log('person', error.message);
      reply.status(StatusCodes.INTERNAL_SERVER_ERROR).send({ statusCode: StatusCodes.INTERNAL_SERVER_ERROR, message: getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR) })
    }
  })

  fastify.post('/address', { preHandler: [fastify.authenticate] }, async (req: any, reply: any) => {

    const hn = req.body.hn || '';
    const hospcode = req.body.hospcode || process.env.HOSPCODE;

    if (!hn) {
      reply.status(StatusCodes.BAD_REQUEST).send({ statusCode: StatusCodes.BAD_REQUEST, message: getReasonPhrase(StatusCodes.BAD_REQUEST) })
      return;
    }

    try {
      let typeSearch = 'hn';
      let textSearch = hn;

      const result = await hisModel.getAddress(global.dbHIS, typeSearch, textSearch, hospcode);
      reply.status(StatusCodes.OK).send({ statusCode: StatusCodes.OK, rows: result });

    } catch (error) {
      console.log('address', error.message);
      reply.status(StatusCodes.INTERNAL_SERVER_ERROR).send({ statusCode: StatusCodes.INTERNAL_SERVER_ERROR, message: getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR) })
    }
  })

  fastify.post('/drugallergy', { preHandler: [fastify.authenticate] }, async (req: any, reply: any) => {

    const hn = req.body.hn || '';
    const hospcode = req.body.hospcode || process.env.HOSPCODE;

    if (!hn) {
      reply.send({ statusCode: StatusCodes.BAD_REQUEST, message: getReasonPhrase(StatusCodes.BAD_REQUEST) })
      return;
    }

    try {
      const result = await hisModel.getDrugAllergy(global.dbHIS, hn, hospcode);
      reply.send({ statusCode: StatusCodes.OK, rows: result });
    } catch (error) {
      console.log('drug allergy', error.message);
      reply.status(StatusCodes.INTERNAL_SERVER_ERROR).send({ statusCode: StatusCodes.INTERNAL_SERVER_ERROR, message: getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR) })
    }
  })

  fastify.post('/service', { preHandler: [fastify.authenticate] }, async (req: any, reply: any) => {

    const hn = req.body.hn || '';
    const visitNo = req.body.visitNo || '';
    const hospcode = req.body.hospcode || process.env.HOSPCODE;

    if (!hn && !visitNo) {
      reply.status(StatusCodes.BAD_REQUEST).send({ statusCode: StatusCodes.BAD_REQUEST, message: getReasonPhrase(StatusCodes.BAD_REQUEST) })
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
      reply.status(StatusCodes.OK).send({ statusCode: StatusCodes.OK, rows: result });

    } catch (error) {
      console.log('service', error.message);
      reply.status(StatusCodes.INTERNAL_SERVER_ERROR).send({ statusCode: StatusCodes.INTERNAL_SERVER_ERROR, message: error.message })
    }
  })

  fastify.post('/admission', { preHandler: [fastify.authenticate] }, async (req: any, reply: any) => {

    const typeSearch = req.body.typeSearch;
    const textSearch = req.body.textSearch;
    const hospcode = req.body.hospcode || process.env.HOSPCODE;

    if (!typeSearch && !textSearch) {
      reply.status(StatusCodes.BAD_REQUEST).send({ statusCode: StatusCodes.BAD_REQUEST, message: getReasonPhrase(StatusCodes.BAD_REQUEST) })
      return;
    } else {
      try {
        const result = await hisModel.getAdmission(global.dbHIS, typeSearch, textSearch, hospcode);
        reply.status(StatusCodes.OK).send({ statusCode: StatusCodes.OK, rows: result });

      } catch (error) {
        console.log('admission', error.message);
        reply.send({ statusCode: StatusCodes.INTERNAL_SERVER_ERROR, message: error.message })
      }
    }
  });

  fastify.post('/diagnosis-opd', { preHandler: [fastify.authenticate] }, async (req: any, reply: any) => {

    const visitNo = req.body.visitNo;
    const hospcode = req.body.hospcode || process.env.HOSPCODE;

    if (!visitNo) {
      reply.status(StatusCodes.BAD_REQUEST).send({ statusCode: StatusCodes.BAD_REQUEST, message: getReasonPhrase(StatusCodes.BAD_REQUEST) })
      return;
    }

    try {
      const result = await hisModel.getDiagnosisOpd(global.dbHIS, visitNo, hospcode);
      reply.status(StatusCodes.OK).send({ statusCode: StatusCodes.OK, rows: result });
    } catch (error) {
      console.log('diagnosis_opd', error.message);
      reply.status(StatusCodes.INTERNAL_SERVER_ERROR).send({ statusCode: StatusCodes.INTERNAL_SERVER_ERROR, message: error.message })
    }
  })

  fastify.post('/diagnosis-ipd', { preHandler: [fastify.authenticate] }, async (req: any, reply: any) => {

    const an = req.body.an;
    const hospcode = req.body.hospcode || process.env.HOSPCODE;

    if (!an) {
      reply.status(StatusCodes.BAD_REQUEST).send({ statusCode: StatusCodes.BAD_REQUEST, message: 'not found AN ' })
      return;
    } else {
      try {
        const result = await hisModel.getDiagnosisIpd(global.dbHIS, 'an', an, hospcode);
        reply.status(StatusCodes.OK).send({ statusCode: StatusCodes.OK, rows: result });

      } catch (error) {
        console.log('diagnosis_ipd', error.message);
        reply.status(StatusCodes.INTERNAL_SERVER_ERROR).send({ statusCode: StatusCodes.INTERNAL_SERVER_ERROR, message: getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR) })
      }
    }
  })

  fastify.post('/procedure-opd', { preHandler: [fastify.authenticate] }, async (req: any, reply: any) => {

    const visitNo = req.body.visitNo;
    const hospcode = req.body.hospcode || process.env.HOSPCODE;

    if (!visitNo) {
      reply.status(StatusCodes.BAD_REQUEST).send({ statusCode: StatusCodes.BAD_REQUEST, message: getReasonPhrase(StatusCodes.BAD_REQUEST) })
      return;
    }

    try {
      const rows = await hisModel.getProcedureOpd(global.dbHIS, visitNo, hospcode);
      reply.status(StatusCodes.OK).send({ statusCode: StatusCodes.OK, rows });

    } catch (error) {
      console.log('procudure_opd', error.message);
      reply.status(StatusCodes.INTERNAL_SERVER_ERROR).send({ statusCode: StatusCodes.INTERNAL_SERVER_ERROR, message: error.message })
    }
  })

  // =============================================================
  fastify.post('/procedure-ipd', { preHandler: [fastify.authenticate] }, async (req: any, reply: any) => {

    const an = req.body.an;
    const hospcode = req.body.hospcode || process.env.HOSPCODE;

    if (!an) {
      reply.status(StatusCodes.BAD_REQUEST).send({ statusCode: StatusCodes.BAD_REQUEST, message: getReasonPhrase(StatusCodes.BAD_REQUEST) })
      return;
    }

    try {
      const rows = await hisModel.getProcedureIpd(global.dbHIS, an, hospcode);
      reply.status(StatusCodes.OK).send({ statusCode: StatusCodes.OK, rows });
    } catch (error) {
      console.log('procudure_opd', error.message);
      reply.status(StatusCodes.INTERNAL_SERVER_ERROR).send({ statusCode: StatusCodes.INTERNAL_SERVER_ERROR, message: error.message })
    }
  })

  // =============================================================
  fastify.post('/drug-opd', { preHandler: [fastify.authenticate] }, async (req: any, reply: any) => {

    const visitNo = req.body.visitNo;
    const hospcode = req.body.hospcode || process.env.HOSPCODE;

    if (!visitNo) {
      reply.status(StatusCodes.BAD_REQUEST).send({ statusCode: StatusCodes.BAD_REQUEST, message: getReasonPhrase(StatusCodes.BAD_REQUEST) })
      return;
    }

    try {
      const rows = await hisModel.getDrugOpd(global.dbHIS, visitNo, hospcode);
      reply.status(StatusCodes.OK).send({ statusCode: StatusCodes.OK, rows });
    } catch (error) {
      console.log('drug_opd', error.message);
      reply.status(StatusCodes.INTERNAL_SERVER_ERROR).send({ statusCode: StatusCodes.INTERNAL_SERVER_ERROR, message: error.message })
    }
  })

  // =============================================================
  fastify.post('/drug-ipd', { preHandler: [fastify.authenticate] }, async (req: any, reply: any) => {

    const an = req.body.an;
    const hospcode = req.body.hospcode || process.env.HOSPCODE;

    if (!an) {
      reply.status(StatusCodes.BAD_REQUEST).send({ statusCode: StatusCodes.BAD_REQUEST, message: getReasonPhrase(StatusCodes.BAD_REQUEST) })
      return;
    }

    try {
      const rows = await hisModel.getDrugIpd(global.dbHIS, an, hospcode);
      reply.status(StatusCodes.OK).send({ statusCode: StatusCodes.OK, rows });
    } catch (error) {
      console.log('drug_ipd', error.message);
      reply.status(StatusCodes.INTERNAL_SERVER_ERROR).send({ statusCode: StatusCodes.INTERNAL_SERVER_ERROR, message: error.message })
    }
  })

  // =============================================================
  fastify.post('/charge-opd', { preHandler: [fastify.authenticate] }, async (req: any, reply: any) => {

    const visitNo = req.body.visitNo;
    const hospcode = req.body.hospcode || process.env.HOSPCODE;

    if (!visitNo) {
      reply.status(StatusCodes.BAD_REQUEST).send({ statusCode: StatusCodes.BAD_REQUEST, message: getReasonPhrase(StatusCodes.BAD_REQUEST) })
      return;
    }

    try {
      const rows = await hisModel.getChargeOpd(global.dbHIS, visitNo, hospcode);
      reply.status(StatusCodes.OK).send({ statusCode: StatusCodes.OK, rows });
    } catch (error) {
      console.log('charge_opd', error.message);
      reply.status(StatusCodes.INTERNAL_SERVER_ERROR).send({ statusCode: StatusCodes.INTERNAL_SERVER_ERROR, message: error.message })
    }
  })

  // =============================================================
  fastify.post('/charge-ipd', { preHandler: [fastify.authenticate] }, async (req: any, reply: any) => {

    const an = req.body.an;
    const hospcode = req.body.hospcode || process.env.HOSPCODE;

    if (!an) {
      reply.status(StatusCodes.BAD_REQUEST).send({ statusCode: StatusCodes.BAD_REQUEST, message: getReasonPhrase(StatusCodes.BAD_REQUEST) })
      return;
    }

    try {
      const rows = await hisModel.getChargeIpd(global.dbHIS, an, hospcode);
      reply.status(StatusCodes.OK).send({ statusCode: StatusCodes.OK, rows });
    } catch (error) {
      console.log('charge_ipd', error.message);
      reply.status(StatusCodes.INTERNAL_SERVER_ERROR).send({ statusCode: StatusCodes.INTERNAL_SERVER_ERROR, message: error.message })
    }
  })

  // =============================================================
  fastify.post('/accident', { preHandler: [fastify.authenticate] }, async (req: any, reply: any) => {

    const visitNo = req.body.visitNo;
    const hospcode = req.body.hospcode || process.env.HOSPCODE;

    if (!visitNo) {
      reply.status(StatusCodes.BAD_REQUEST).send({ statusCode: StatusCodes.BAD_REQUEST, message: getReasonPhrase(StatusCodes.BAD_REQUEST) })
      return;
    }

    try {
      const rows = await hisModel.getAccident(global.dbHIS, visitNo, hospcode);
      reply.status(StatusCodes.OK).send({ statusCode: StatusCodes.OK, rows });
    } catch (error) {
      console.log('accident', error.message);
      reply.status(StatusCodes.INTERNAL_SERVER_ERROR).send({ statusCode: StatusCodes.INTERNAL_SERVER_ERROR, message: error.message })
    }
  })

  // =============================================================
  fastify.post('/appointment', { preHandler: [fastify.authenticate] }, async (req: any, reply: any) => {

    const visitNo = req.body.visitNo;
    const hospcode = req.body.hospcode || process.env.HOSPCODE;

    if (!visitNo) {
      reply.status(StatusCodes.BAD_REQUEST).send({ statusCode: StatusCodes.BAD_REQUEST, message: getReasonPhrase(StatusCodes.BAD_REQUEST) })
      return;
    }

    try {
      const rows = await hisModel.getAppointment(global.dbHIS, visitNo, hospcode);
      reply.status(StatusCodes.OK).send({ statusCode: StatusCodes.OK, rows });

    } catch (error) {
      console.log('appointment', error.message);
      reply.status(StatusCodes.INTERNAL_SERVER_ERROR).send({ statusCode: StatusCodes.INTERNAL_SERVER_ERROR, message: error.message })
    }
  })

  // =============================================================
  fastify.post('/refer-history', { preHandler: [fastify.authenticate] }, async (req: any, reply: any) => {

    const visitNo = req.body.visitNo;
    const referNo = req.body.referNo;
    const hospcode = req.body.hospcode || process.env.HOSPCODE;

    if (!visitNo && !referNo) {
      reply.status(StatusCodes.BAD_REQUEST).send({ statusCode: StatusCodes.BAD_REQUEST, message: getReasonPhrase(StatusCodes.BAD_REQUEST) })
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
      reply.status(StatusCodes.OK).send({ statusCode: StatusCodes.OK, rows });

    } catch (error) {
      console.log('refer_history', error.message);
      reply.status(StatusCodes.INTERNAL_SERVER_ERROR).send({ statusCode: StatusCodes.INTERNAL_SERVER_ERROR, message: error.message })
    }
  })

  // =============================================================
  fastify.post('/clinical-refer', { preHandler: [fastify.authenticate] }, async (req: any, reply: any) => {

    const referNo = req.body.referNo;
    const hospcode = req.body.hospcode || process.env.HOSPCODE;

    if (!referNo) {
      reply.status(StatusCodes.BAD_REQUEST).send({ statusCode: StatusCodes.BAD_REQUEST, message: getReasonPhrase(StatusCodes.BAD_REQUEST) })
      return;
    }

    try {
      const rows = await hisModel.getClinicalRefer(global.dbHIS, referNo, hospcode);
      reply.status(StatusCodes.OK).send({ statusCode: StatusCodes.OK, rows });

    } catch (error) {
      console.log('clinical_refer', error.message);
      reply.status(StatusCodes.INTERNAL_SERVER_ERROR).send({ statusCode: StatusCodes.INTERNAL_SERVER_ERROR, message: error.message })
    }
  })

  // =============================================================
  fastify.post('/investigation-refer', { preHandler: [fastify.authenticate] }, async (req: any, reply: any) => {

    const referNo = req.body.referNo;
    const hospcode = req.body.hospcode || process.env.HOSPCODE;

    if (!referNo) {
      reply.status(StatusCodes.BAD_REQUEST).send({ statusCode: StatusCodes.BAD_REQUEST, message: getReasonPhrase(StatusCodes.BAD_REQUEST) })
      return;
    }

    try {
      const rows = await hisModel.getInvestigationRefer(global.dbHIS, referNo, hospcode);
      reply.status(StatusCodes.OK).send({ statusCode: StatusCodes.OK, rows });
    } catch (error) {
      console.log('investigation_refer', error.message);
      reply.status(StatusCodes.INTERNAL_SERVER_ERROR).send({ statusCode: StatusCodes.INTERNAL_SERVER_ERROR, message: error.message })
    }
  })

  // =============================================================
  fastify.post('/care-refer', { preHandler: [fastify.authenticate] }, async (req: any, reply: any) => {

    const referNo = req.body.referNo;
    const hospcode = req.body.hospcode || process.env.HOSPCODE;

    if (!referNo) {
      reply.status(StatusCodes.BAD_REQUEST).send({ statusCode: StatusCodes.BAD_REQUEST, message: getReasonPhrase(StatusCodes.BAD_REQUEST) })
      return;
    }

    try {
      const rows = await hisModel.getCareRefer(global.dbHIS, referNo, hospcode);
      reply.status(StatusCodes.OK).send({ statusCode: StatusCodes.OK, rows });
    } catch (error) {
      console.log('care_refer', error.message);
      reply.status(StatusCodes.INTERNAL_SERVER_ERROR).send({ statusCode: StatusCodes.INTERNAL_SERVER_ERROR, message: error.message })
    }
  })

  // =============================================================
  fastify.post('/refer-result', { preHandler: [fastify.authenticate] }, async (req: any, reply: any) => {

    const hospDestination = req.body.hospDestination;
    const referNo = req.body.referNo;
    const hospcode = req.body.hospcode || process.env.HOSPCODE;

    if (!referNo && !hospDestination) {
      reply.status(StatusCodes.BAD_REQUEST).send({ statusCode: StatusCodes.BAD_REQUEST, message: getReasonPhrase(StatusCodes.BAD_REQUEST) })
      return;
    }

    try {
      const rows = await hisModel.getReferResult(global.dbHIS, hospDestination, referNo, hospcode);
      reply.status(StatusCodes.OK).send({ statusCode: StatusCodes.OK, rows });
    } catch (error) {
      console.log('refer_result', error.message);
      reply.status(StatusCodes.INTERNAL_SERVER_ERROR).send({ statusCode: StatusCodes.INTERNAL_SERVER_ERROR, message: error.message })
    }
  })

  // =============================================================
  fastify.post('/provider', { preHandler: [fastify.authenticate] }, async (req: any, reply: any) => {

    const licenseNo = req.body.licenseNo;
    const cid = req.body.cid;
    const hospcode = req.body.hospcode || process.env.HOSPCODE;

    if (!licenseNo && !cid) {
      reply.status(StatusCodes.BAD_REQUEST).send({ statusCode: StatusCodes.BAD_REQUEST, message: getReasonPhrase(StatusCodes.BAD_REQUEST) })
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
      reply.status(StatusCodes.OK).send({ statusCode: StatusCodes.OK, rows });
    } catch (error) {
      console.log('provider', error.message);
      reply.status(StatusCodes.INTERNAL_SERVER_ERROR).send({ statusCode: StatusCodes.INTERNAL_SERVER_ERROR, message: error.message })
    }
  })

  // Lookup =============================================================
  fastify.post('/department', { preHandler: [fastify.authenticate] }, async (req: any, reply: any) => {
    const depCode = req.body.depCode;
    const depName = req.body.depName;
    try {
      const rows = await hisModel.getDepartment(global.dbHIS, depCode, depName);
      reply.status(StatusCodes.OK).send({ statusCode: StatusCodes.OK, rows });
    } catch (error) {
      reply.status(StatusCodes.INTERNAL_SERVER_ERROR).send({ statusCode: StatusCodes.INTERNAL_SERVER_ERROR, message: error.message })
    }
  })

  fastify.post('/ward', { preHandler: [fastify.authenticate] }, async (req: any, reply: any) => {
    const wardCode = req.body.wardCode;
    const wardName = req.body.wardName;
    try {
      const rows = await hisModel.getWard(global.dbHIS, wardCode, wardName);
      reply.status(StatusCodes.OK).send({ statusCode: StatusCodes.OK, rows });
    } catch (error) {
      reply.status(StatusCodes.INTERNAL_SERVER_ERROR).send({ statusCode: StatusCodes.INTERNAL_SERVER_ERROR, message: error.message })
    }
  })

  fastify.post('/doctor', { preHandler: [fastify.authenticate] }, async (req: any, reply: any) => {
    const drCode = req.body.drCode;
    const drName = req.body.drName;
    try {
      const rows = await hisModel.getDepartment(global.dbHIS, drCode, drName);
      reply.status(StatusCodes.OK).send({ statusCode: StatusCodes.OK, rows });
    } catch (error) {
      reply.status(StatusCodes.INTERNAL_SERVER_ERROR).send({ statusCode: StatusCodes.INTERNAL_SERVER_ERROR, message: error.message })
    }
  })

  next();
}


module.exports = router;
