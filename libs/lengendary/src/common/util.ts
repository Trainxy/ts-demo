import * as _ from 'lodash';
import moment from 'moment';
import { By, Key } from 'selenium-webdriver';
import HttpProxyAgent from 'http-proxy-agent';
import HttpsProxyAgent from 'https-proxy-agent';
import { SocksProxyAgent } from 'socks-proxy-agent';
import fs from 'fs';
import https from 'https';
import util from 'util';
import { exec } from 'child_process';
import SSH2Promise from 'ssh2-promise';
import { IProxy, Srt, SrtSegment } from './interface';
import axios from 'axios';
import path from 'path';
import { promisify } from 'util';
import stream from 'stream';

// import { translate } from '@vitalets/google-translate-api';

export class Util {
    async sleep(ms) {
        return new Promise((r) => setTimeout(r, ms));
    }

    async elementExists(driver, id) {
        try {
            await driver.findElement(By.id(id));
        } catch (e) {
            return false;
        }
        return true;
    }

    assembleAxiosAgent(proxy: IProxy) {
        if (_.startsWith(proxy.protocol, 'sock')) {
            const agent = new SocksProxyAgent({
                hostname: proxy.host,
                port: proxy.port,
            });
            return {
                httpsAgent: agent,
                httpAgent: agent,
            };
        }
        if (proxy.protocol === 'http') {
            return {
                httpAgent: HttpProxyAgent(
                    'http://' + proxy.host + ':' + proxy.port,
                ),
            };
        }
        if (proxy.protocol === 'https') {
            return {
                httpsAgent: HttpsProxyAgent(
                    'https://' + proxy.host + ':' + proxy.port,
                ),
            };
        }
    }

    randomStr(length) {
        let result = '';
        const characters =
            'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        const charactersLength = characters.length;
        for (let ii = 0; ii < length; ii++) {
            result += characters.charAt(
                Math.floor(Math.random() * charactersLength),
            );
        }
        return result;
    }

    randomNum(min, max) {
        return Math.floor(Math.random() * (max - min + 1) + min);
    }

    writeData(name, content, timestamp = true) {
        if (timestamp) {
            fs.appendFileSync(
                './data/' + name + '.txt',
                '[' +
                    moment().format('YYYY-MM-DD HH:mm:ss') +
                    ']' +
                    content +
                    '\n',
                'utf8',
            );
        } else {
            fs.appendFileSync(
                './data/' + name + '.txt',
                content + '\n',
                'utf8',
            );
        }
    }

    colors() {
        return {
            Reset: '\x1b[0m',
            Bright: '\x1b[1m',
            Dim: '\x1b[2m',
            Underscore: '\x1b[4m',
            Blink: '\x1b[5m',
            Reverse: '\x1b[7m',
            Hidden: '\x1b[8m',

            FgBlack: '\x1b[30m',
            FgRed: '\x1b[31m',
            FgGreen: '\x1b[32m',
            FgYellow: '\x1b[33m',
            FgBlue: '\x1b[34m',
            FgMagenta: '\x1b[35m',
            FgCyan: '\x1b[36m',
            FgWhite: '\x1b[37m',

            BgBlack: '\x1b[40m',
            BgRed: '\x1b[41m',
            BgGreen: '\x1b[42m',
            BgYellow: '\x1b[43m',
            BgBlue: '\x1b[44m',
            BgMagenta: '\x1b[45m',
            BgCyan: '\x1b[46m',
            BgWhite: '\x1b[47m',
        };
    }

    parseTernimalLastResp(context) {
        const terminalTitle = '@Azure:~$';
        const contextArr = _.filter(context.split('\n'), (row) => {
            return (
                _.trim(row) !== '' && !_.endsWith(_.trimEnd(row), terminalTitle)
            );
        });
        let respArr = _.map(contextArr, (row) => {
            return _.trimStart(row);
        });
        const terminalTitleIndexList = [];
        for (const [index, row] of respArr.entries()) {
            if (_.includes(row, terminalTitle)) {
                terminalTitleIndexList.push(index);
            }
        }
        respArr = respArr.slice(_.last(terminalTitleIndexList) + 1);

        let jsonFirstRow;
        let jsonLastRow;
        for (const [index, row] of respArr.entries()) {
            if (_.startsWith(row, '{') || _.startsWith(row, '[')) {
                if (undefined === jsonFirstRow) {
                    jsonFirstRow = index;
                }
            }
            if (_.startsWith(row, '}') || _.startsWith(row, ']')) {
                jsonLastRow = index + 1;
            }
        }
        const jsonArr = respArr.slice(jsonFirstRow, jsonLastRow);
        const jsonString = jsonArr.join('');
        try {
            return JSON.parse(jsonString);
        } catch (e) {
            console.log('===== invalid json string arr =====');
            console.log(jsonArr);
            console.log('===== invalid json string arr =====');
        }

        return false;
    }

    /**
     * Do a request with options provided.
     *
     * @param {Object} options
     * @param {Object} data
     * @return {Promise} a promise of request
     */
    doRequest(options, data) {
        return new Promise((resolve, reject) => {
            const req = https.request(options, (res) => {
                res.setEncoding('utf8');
                let responseBody = '';

                res.on('data', (chunk) => {
                    responseBody += chunk;
                });

                res.on('end', () => {
                    resolve(JSON.parse(responseBody));
                });
            });

            req.on('error', (err) => {
                reject(err);
            });

            req.write(data);
            req.end();
        });
    }

    async parseCsvFile(file) {
        const csvData = await fs.readFileSync(file, 'utf8');
        const csvRows = _.compact(_.split(csvData, '\r\n'));
        const keys = csvRows.shift().split(',');

        const dataList = [];
        for (const row of csvRows) {
            const dataArr = row.split(',');
            const dataObj = {};
            for (let ii = 0; ii < dataArr.length; ii++) {
                dataObj[keys[ii]] = dataArr[ii];
            }
            dataList.push(dataObj);
        }
        return dataList;
    }

    async clearInput(driver, element) {
        await driver.executeScript((elt) => elt.select(), element);
        await this.sleep(500);
        await driver.executeScript((elt) => elt.select(), element);
        await this.sleep(500);

        let ii = 100;
        while (ii > 0) {
            await element.sendKeys(Key.BACK_SPACE);
            await this.sleep(10);
            ii--;
        }
    }

    async execTerminalCommand(cmd) {
        const asyncExec = util.promisify(exec);
        const { stdout, stderr } = await asyncExec(cmd);
        console.log(stderr);
        return stdout;
    }

    async execRemoteShell(sshConfig, cmd) {
        const ssh = new SSH2Promise(sshConfig);
        const output = await ssh.exec(cmd);
        await ssh.close();
        return output;
    }

    execTerminalCommandSync(cmd) {
        const command = exec(cmd);

        command.on('data', (data) => {
            console.log('child process stdout:' + data);
        });
        command.on('close', (code) => {
            console.log(`child process exited with code ${code}`);
        });
        return command;
    }

    async proxyIpTest(proxy: IProxy) {
        const curl = `curl -s --proxy ${proxy.protocol}://${proxy.host}:${proxy.port} http://myip.ipip.net`;
        return this.execTerminalCommand(curl);
    }

    async proxyIpTestWithAxios(proxy: IProxy) {
        const proxyAgent = this.assembleAxiosAgent(proxy);
        const proxyAxios = axios.create(proxyAgent);
        const result = await proxyAxios.get('http://myip.ipip.net');
        return result.data;
    }

    stringContainsChinese(str: string): boolean {
        const regExp = /[\u4e00-\u9fa5]/;
        return regExp.test(str);
    }

    /**
    async googleTranslateToEn(str: string): Promise<string> {
        const { text } = await translate(str, {
            to: 'en',
        });
        return text;
    }
    */

    getFileSize(file: string): number {
        const stat = fs.statSync(file);
        return stat.size;
    }

    byteToMb(byte: number): number {
        return _.round(byte / 1024 / 1024, 2);
    }

    scatterNumberToArr(total: number, min: number, max: number): number[] {
        const count = Math.floor(
            Math.random() * (total / min - total / max) + total / max + 1,
        );
        const avg = total / count;
        const remainder = total - avg * count;
        const arr = [];

        for (let i = 0; i < count; i++) {
            const maxNum = i === count - 1 ? remainder : Math.round(avg);
            const num = Math.floor(Math.random() * (maxNum - min + 1) + min);
            arr.push(num);
            total -= num;
        }

        while (total > 0) {
            const i = Math.floor(Math.random() * arr.length);
            const inc = Math.min(Math.round(avg - arr[i] + min), total);
            arr[i] += inc;
            total -= inc;
        }

        return arr;
    }

    timeStrToMs(timeStr: string): number {
        const [hh, mm, ss] = _.split(timeStr, ':');
        const [ssStr, msStr] = _.split(ss, ',');
        const hhMs = parseInt(hh) * 60 * 60 * 1000;
        const mmMs = parseInt(mm) * 60 * 1000;
        const ssMs = parseInt(ssStr) * 1000;
        const ms = parseInt(msStr);
        return hhMs + mmMs + ssMs + ms;
    }

    msToTimeStr(ms: number): string {
        if (ms < 0) {
            ms = 0;
        }
        const hh = _.padStart(
            Math.floor(ms / (60 * 60 * 1000)).toString(),
            2,
            '0',
        );
        const mm = _.padStart(
            Math.floor((ms % (60 * 60 * 1000)) / (60 * 1000)).toString(),
            2,
            '0',
        );
        const ss = _.padStart(
            Math.floor((ms % (60 * 1000)) / 1000).toString(),
            2,
            '0',
        );
        const msStr = _.padStart((ms % 1000).toString(), 3, '0');
        return `${hh}:${mm}:${ss},${msStr}`;
    }

    parseSrt(srtText: string): Srt {
        const srt: Srt = {
            durationMs: 0,
            segments: [],
        };
        const segments = _.split(srtText, '\n\n');
        segments.forEach((element) => {
            if (element === '') {
                return;
            }
            if (_.split(element, '\n').length !== 3) {
                return;
            }
            const [index, timeStr, content] = _.split(element, '\n');
            const [startTimeStr, endTimeStr] = _.split(timeStr, ' --> ');
            const srtSegment = {
                index: parseInt(index),
                startTimeMs: this.timeStrToMs(startTimeStr),
                endTimeMs: this.timeStrToMs(endTimeStr),
                content,
            };
            srt.segments.push(srtSegment);
        });
        srt.durationMs = _.last(srt.segments).endTimeMs;
        return srt;
    }

    splitStrByWordCount = (str: string, wordNumPerRow: number): string => {
        const words = _.split(_.trim(str), '');
        const rows = _.chunk(words, wordNumPerRow);
        const rowsStr = _.map(rows, (row) => _.join(row, ''));
        return _.join(rowsStr, '\n');
    };

    buildSrt(srtObj: Srt, wordNumPerRow = 13): string {
        let srtText = '';
        srtObj.segments.forEach((segment) => {
            srtText += `${segment.index}\n`;
            srtText += `${this.msToTimeStr(
                segment.startTimeMs,
            )} --> ${this.msToTimeStr(segment.endTimeMs)}\n`;
            srtText += `${this.splitStrByWordCount(
                segment.content,
                wordNumPerRow,
            )}\n\n`;
        });
        return srtText;
    }

    scatterSrtToSegment(srt: Srt, minDurationMs: number): Srt[] {
        const segSrtArr: Srt[] = [];
        let index = 1;
        let sentenceBuffer: SrtSegment[] = [];
        let srtSeparateMs = 0;

        for (const segment of srt.segments) {
            const currentSentence: SrtSegment = {
                index,
                startTimeMs: segment.startTimeMs - srtSeparateMs,
                endTimeMs: segment.endTimeMs - srtSeparateMs,
                content: segment.content,
            };
            sentenceBuffer.push(currentSentence);
            index++;
            if (currentSentence.endTimeMs > minDurationMs) {
                segSrtArr.push({
                    durationMs: currentSentence.endTimeMs,
                    segments: sentenceBuffer,
                });
                srtSeparateMs = segment.endTimeMs;
                sentenceBuffer = [];
                index = 1;
            }
        }
        if (sentenceBuffer.length > 0) {
            segSrtArr.push({
                durationMs: _.last(sentenceBuffer).endTimeMs,
                segments: sentenceBuffer,
            });
        }
        return segSrtArr;
    }

    recursiveDeleteDir(dir: string): void {
        if (fs.existsSync(dir)) {
            fs.readdirSync(dir).forEach((file) => {
                const curPath = path.join(dir, file);
                if (fs.lstatSync(curPath).isDirectory()) {
                    this.recursiveDeleteDir(curPath);
                } else {
                    fs.unlinkSync(curPath);
                }
            });
            fs.rmdirSync(dir);
        }
    }

    async downloadFile(
        fileUrl: string,
        outputLocationPath: string,
    ): Promise<any> {
        const finished = promisify(stream.finished);
        const writer = fs.createWriteStream(outputLocationPath);
        return axios({
            method: 'get',
            url: fileUrl,
            responseType: 'stream',
        }).then((response) => {
            response.data.pipe(writer);
            return finished(writer);
        });
    }
}
