import path = require('path');
import { StatusCodes, getReasonPhrase } from 'http-status-codes';
import fastify from 'fastify';
import * as moment from 'moment';
import cronjob from './nodecron';
const fs = require('node:fs');

const serveStatic = require('serve-static');
var crypto = require('crypto');

require('dotenv').config({ path: path.join(__dirname, '../config') });

import helmet = require('@fastify/helmet');
const { name, version, subVersion } = require('./../package.json');

// const fastifySession = require('fastify-session');
// const fastifyCookie = require('@fastify/cookie');
// var cron = require('node-cron');
// var shell = require("shelljs");

var serverOption = {}
if (process.env.SSL_ENABLE && process.env.SSL_ENABLE == '1' && process.env.SSL_KEY) {
  serverOption = {
    logger: {
      level: 'error',
    },
    bodyLimit: 5 * 1048576,
    http2: true,
    https: {
      key: fs.readFileSync(process.env.SSL_KEY),
      cert: fs.readFileSync(process.env.SSL_CRT)
    }
    }
} else {
  serverOption = {
    logger: {
      level: 'error',
    },
    bodyLimit: 5 * 1048576
  }
}
const app = fastify(serverOption);

global.appDetail = { name, subVersion, version };

app.register(require('@fastify/formbody'));
app.register(require('@fastify/cors'), {});
app.register(require('fastify-no-icon'));
app.register(helmet, {});
app.register(require('@fastify/rate-limit'), {
  max: +process.env.MAX_CONNECTION_PER_MINUTE || 100,
  // skipOnError: true,
  // cache: 10000,
  timeWindow: '1 minute'
});
app.register(serveStatic(path.join(__dirname, '../public')));

app.register(require('@fastify/view'), {
  engine: {
    ejs: require('ejs')
  }
})

// app.register(fastifyCookie);
// app.register(fastifySession, { secret: process.env.SECRET_KEY });

app.register(require('@fastify/jwt'), {
  secret: process.env.SECRET_KEY
});

// app.register(require('@fastify/cookie'), {
//   secret: "hisConnectCookies",
//   hook: 'onRequest',
//   parseOptions: {}
// })
// app.register(require('fastify-ws'), {});
global.ipAddr = require('./routes/main/local-server')(global.ipAddr, {});

// set MOPH Url =========================================
global.mophService = require('./routes/main/crontab')(global.mophService, {});
global.firstProcessPid = 0;
global.mophService = null;

// if (!app.mophService) {
//   getmophUrl();
// }

// DB connection =========================================
const dbConnection = require('./plugins/db');
global.dbHIS = dbConnection('HIS');
global.dbRefer = dbConnection('REFER');
global.dbIs = dbConnection('ISONLINE');
global.dbISOnline = global.dbIs;

// check token ===========================================================
app.decorate("authenticate", async (request: any, reply: any) => {
  if (request.body && request.body.token) {
    let token = await request.body.token;
    request.headers.authorization = 'Bearer ' + token;
  }

  try {
    await request.jwtVerify();
  } catch (err) {
    let ipAddr: any = request.headers["x-real-ip"] || request.headers["x-forwarded-for"] || request.ip;
    console.log(moment().format('HH:mm:ss.SSS'), ipAddr, 'error:' + StatusCodes.UNAUTHORIZED, err.message);
    reply.send({
      statusCode: StatusCodes.UNAUTHORIZED,
      message: getReasonPhrase(StatusCodes.UNAUTHORIZED)
    });
  }
});
// end: check token ===========================================================

app.decorate("checkRequestKey", async (request, reply) => {
  let skey = null;
  if (request.headers.localkey) {
    skey = request.headers.localkey;
  }
  var requestKey = crypto.createHash('md5').update(process.env.REQUEST_KEY).digest('hex');
  if (!skey || skey !== requestKey) {
    console.log('invalid key', requestKey);
    reply.send({
      statusCode: StatusCodes.UNAUTHORIZED,
      message: getReasonPhrase(StatusCodes.UNAUTHORIZED) + ' or invalid key'
    });
  }

});

// Add Route path ================================
var geoip = require('geoip-lite');
app.addHook('preHandler', async (request, reply) => {
  const headers = {
    "Cache-Control": "no-store",
    Pragma: "no-cache",
  };
  reply.headers(headers);

  let ipAddr: any = request.headers["x-real-ip"] || request.headers["x-forwarded-for"] || request.ip;
  ipAddr = ipAddr ? ipAddr.split(',') : [''];
  const ip = ipAddr[0].trim();
  var geo = geoip.lookup(ip);
  if (geo && geo.country && geo.country != 'TH') {
    console.log(`Unacceptable country: ${geo.country}`);
    reply.status(StatusCodes.NOT_ACCEPTABLE).send(StatusCodes.NOT_ACCEPTABLE);
  }
  console.log(moment().format('HH:mm:ss'), geo ? geo.country : 'unk', ip, request.url);
});
app.register(require('./route'));

app.register(cronjob);

var options: any = {
  port: process.env.PORT || 3001,
  host: process.env.HOST || '0.0.0.0'
}

// Fix การอ่านข้อมูลย้อนหลัง มติที่ประชุม จ.ขอนแก่น ให้อ่านย้อนหลัง 1 เดือน
if (typeof process.env.NREFER_DATA_BACKWARD_MONTH == 'undefined'){ // กรณีไม่ได้ set
  if (['10670','11000','11001','11002','11003','11004','11005'].indexOf(process.env.HOSPCODE)>=0){
    process.env.NREFER_DATA_BACKWARD_MONTH = '1';
  } else {
    process.env.NREFER_DATA_BACKWARD_MONTH = '0';  // Set ให้เป็น 0=ไม่อ่านย้อนหลัง
  }
}

app.listen(options, (err) => {
  if (err) throw err;
  console.log('>>> ', `HIS Connection API (${global.appDetail.version}) started on`, app.addresses(), 'PID', process.pid);
});