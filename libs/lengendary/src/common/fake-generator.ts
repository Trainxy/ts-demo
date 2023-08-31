import * as _ from 'lodash';
import { Axios } from 'axios';
import UserAgent from 'user-agents';
import Identity from 'fake-identity';
import { Util } from './util';
import { By, until } from 'selenium-webdriver';
import { districts } from '../data/district.json';
import * as KoreanNameGenerator from 'korean-name-generator';

export class FakeGenerator {
    constructor(private util: Util) {}

    latestUserAgent() {
        const pool = [
            // win 10.
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Windows NT 10.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36',

            // mac.
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 13_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36',

            // linux.
            'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36',
        ];
        return _.sample(pool);
    }

    win32x86UserAgent() {
        const pool = [
            'Mozilla/5.0 (Windows NT 10.0; Win32; x86) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/81.0.4044.129 Safari/537.36',
            'Mozilla/5.0 (Windows NT 10.0; Win32; x86) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.66 Safari/537.36',
        ];
        return _.sample(pool);
    }

    userAgent() {
        const deviceCategoryList = ['desktop'];
        const randomUserAgent = new UserAgent({
            deviceCategory: _.sample(deviceCategoryList),
        });
        return randomUserAgent.toString();
    }

    async usAddressUseNewTab(browserDriver, backWindow) {
        await browserDriver.switchTo().newWindow('meiguodizhi');
        await browserDriver.get(
            'https://www.meiguodizhi.com/usa-address/hot-city-Los-Angeles',
        );

        await this.util.sleep(3000);
        const streetElement = await browserDriver.wait(
            until.elementLocated(
                By.xpath(
                    '/html/body/div/div[4]/div[1]/div/div/div[4]/div[3]/div[2]/strong/input',
                ),
            ),
        );
        const streetText = await streetElement.getAttribute('value');

        const cityElement = await browserDriver.findElement(
            By.xpath(
                '/html/body/div/div[4]/div[1]/div/div/div[4]/div[7]/div[2]/strong/input',
            ),
        );
        const cityText = await cityElement.getAttribute('value');

        const stateElement = await browserDriver.findElement(
            By.xpath(
                '/html/body/div/div[4]/div[1]/div/div/div[4]/div[8]/div[2]/strong/input',
            ),
        );
        const stateText = await stateElement.getAttribute('value');

        const stateFullElement = await browserDriver.findElement(
            By.xpath(
                '/html/body/div/div[4]/div[1]/div/div/div[4]/div[9]/div[2]/strong/input',
            ),
        );
        const stateFullText = await stateFullElement.getAttribute('value');

        const zipCodeElement = await browserDriver.findElement(
            By.xpath(
                '/html/body/div/div[4]/div[1]/div/div/div[4]/div[10]/div[2]/strong/input',
            ),
        );
        const zipCodeText = await zipCodeElement.getAttribute('value');

        await browserDriver.close();
        await browserDriver.switchTo().window(backWindow);
        return {
            Address: streetText,
            City: cityText,
            State: stateText,
            State_Full: stateFullText,
            Zip_Code: zipCodeText,
        };
    }

    async usAddress2() {
        const url = 'https://www.fakeaddresscopy.com/usa/';

        const resp = await new Axios().get(url, { timeout: 30000 });
        console.log(resp.data);
        return false;
    }

    async usAddress() {
        for (let ii = 0; ii < 5; ii++) {
            let address = false;
            try {
                address = await this.meiguodizhi();
            } catch (e) {
                console.log(e);
            }
            console.log(address);
            await this.util.sleep(2000);

            if (false !== address) {
                return address;
            }
        }
        console.log('get us address failed.');
    }

    async meiguodizhi() {
        const options = {
            hostname: 'www.meiguodizhi.com',
            port: 443,
            path: '/api/v1/dz',
            method: 'POST',
            headers: {
                'User-Agent':
                    'Mozilla/5.0 (Linux; Android 11; M2007J3SG) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/94.0.4606.38 Mobile Safari/537.36',
                'Content-Type': 'application/json',
            },
        };
        const data = {
            method: 'address',
            path: '/usa-address/hot-city-Los-Angeles',
        };
        const resp: any = await this.util.doRequest(
            options,
            JSON.stringify(data),
        );
        if (resp.status === 'ok') {
            return resp.address;
        }
        return false;
    }

    async userRemote(country) {
        const url = 'https://randomuser.me/api/?nat=' + country.code;

        const resp = await new Axios().get(url);
        const fakeUser = resp.data.results[0];
        fakeUser.email = fakeUser.email.replace('example.com', 'gmail.com');
        fakeUser.login.password += '@UK@MS';
        return fakeUser;
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

    user(domains = []) {
        const identity = Identity.generate();
        const password = this.randomStr(12);
        const domain = _.isEmpty(domains) ? 'gmail.com' : _.sample(domains);
        return {
            name: {
                first: identity.firstName,
                last: identity.lastName,
                display: identity.firstName + ' ' + identity.lastName,
            },
            email:
                identity.firstName.toLowerCase() +
                '_' +
                identity.lastName.toLowerCase() +
                '_' +
                _.random(1000, 9999) +
                '@' +
                domain,
            login: {
                username:
                    identity.firstName.toLowerCase() +
                    '_' +
                    identity.lastName.toLowerCase(),
                password,
            },
        };
    }

    randomKoreanName(male = true) {
        return KoreanNameGenerator.generate(male);
    }

    randomDistrict() {
        const countyList = _.filter(districts, (district) => {
            return district['cidx'] === undefined;
        });
        const county = _.sample(countyList);
        const city = _.find(
            districts,
            (district) => district.id === county.id.substr(0, 4) + '00',
        );
        const province = _.find(
            districts,
            (district) => district.id === county.id.substr(0, 2) + '0000',
        );
        return {
            address:
                province.fullname +
                (undefined === city ? '' : city.fullname) +
                county.fullname,
            zipCode: county.id,
            province,
            city,
            county,
        };
    }

    birthday() {
        return {
            year: _.random(1998, 2006),
            month: _.random(1, 12),
            day: _.random(13, 28),
        };
    }
}
