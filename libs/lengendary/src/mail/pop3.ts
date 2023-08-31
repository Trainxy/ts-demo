import { Injectable } from '@nestjs/common';
import { IPop3Config } from '../common/interface/email';
import Pop3Command from 'node-pop3';
import * as _ from 'lodash';
import { simpleParser } from 'mailparser';

@Injectable()
export class Pop3 {
    static async getLatestMailByReceiver(mailConfig: IPop3Config, receiver) {
        const pop3 = new Pop3Command(mailConfig);

        try {
            const mailList = await pop3.UIDL();
            const receiverMailList = [];
            for (let ii = 0; ii < mailList.length; ii++) {
                const mailString = await pop3.RETR(mailList[ii][0]);
                const parsedEmail = await simpleParser(mailString);
                if (receiver === parsedEmail.to.text) {
                    receiverMailList.push(parsedEmail);
                }
            }
            receiverMailList.sort(
                (d1, d2) =>
                    new Date(d1.date).getTime() - new Date(d2.date).getTime(),
            );
            return _.last(receiverMailList);
        } catch (e) {
            console.log(e);
        }
        await pop3.QUIT();
    }

    static async getMailBySubject(mailConfig: IPop3Config, subject) {
        const pop3 = new Pop3Command(mailConfig);

        try {
            const mailList = await pop3.UIDL();
            const matchedMailList = [];
            for (let ii = 0; ii < mailList.length; ii++) {
                const mailString = await pop3.RETR(mailList[ii][0]);
                const parsedEmail = await simpleParser(mailString);
                if (subject === parsedEmail.subject) {
                    matchedMailList.push(parsedEmail);
                }
            }
            matchedMailList.sort(
                (d1, d2) =>
                    new Date(d1.date).getTime() - new Date(d2.date).getTime(),
            );
            return _.last(matchedMailList);
        } catch (e) {
            console.log(e);
        }
        await pop3.QUIT();
    }

    static async getMailByReceiverAndSubject(
        mailConfig: IPop3Config,
        receiver,
        subject,
    ) {
        const pop3 = new Pop3Command(mailConfig);

        try {
            const mailList = await pop3.UIDL();
            const matchedMailList = [];
            for (let ii = 0; ii < mailList.length; ii++) {
                const mailString = await pop3.RETR(mailList[ii][0]);
                const parsedEmail = await simpleParser(mailString);
                if (
                    subject === parsedEmail.subject &&
                    parsedEmail.to.text.includes(receiver)
                ) {
                    matchedMailList.push(parsedEmail);
                }
            }
            matchedMailList.sort(
                (d1, d2) =>
                    new Date(d1.date).getTime() - new Date(d2.date).getTime(),
            );
            return _.last(matchedMailList);
        } catch (e) {
            console.log(e);
        }
        await pop3.QUIT();
    }
}
