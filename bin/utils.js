'use strict';

const fs = require('fs');
const isutf8 = require('isutf8');
const lint = require('./lint');
const TypografObj = require('typograf');

const typograf = new TypografObj();

function processText(text, prefs) {
    if (prefs.lint) {
        lint.process(text, prefs);
    } else {
        process.stdout.write(typograf.execute(text, prefs));
    }
}

module.exports = {
    getConfig(file) {
        if (!file) {
            return null;
        }

        if (fs.existsSync(file) && fs.statSync(file).isFile()) {
            const text = fs.readFileSync(file, 'utf8');
            let config;
            try {
                config = JSON.parse(text);
            } catch(e) {
                console.error(`${file}: error parsing.`);
                return null;
            }

            return config;
        } else {
            console.error(`${file}: no such file.`);
        }

        return null;
    },

    getPrefs(program, config) {
        const prefs = {
            lint: program.lint,
            locale: [],
            htmlEntity: {}
        };

        for (const key of ['enableRule', 'disableRule', 'locale']) {
            if (typeof program[key] !== 'undefined') {
                prefs[key] = program[key];
            }

            if (config && typeof config[key] !== 'undefined') {
                prefs[key] = config[key];
            }
        }

        if (typeof program.htmlEntityType !== 'undefined') {
            prefs.htmlEntity.type = program.htmlEntityType;
        }

        if (typeof program.htmlEntityOnlyVisible !== 'undefined') {
            prefs.htmlEntity.onlyVisible = program.htmlEntityOnlyVisible;
        }

        if (config && config.htmlEntity) {
            prefs.htmlEntity = Object.assign(prefs.htmlEntity, config.htmlEntity);
        }

        return prefs;
    },

    processStdin(prefs, callback) {
        let text = '';

        process.stdin
            .setEncoding('utf8')
            .on('readable', () => {
                const chunk = process.stdin.read();
                if (chunk !== null) {
                    text += chunk;
                }
            })
            .on('end', () => {
                processText(text, prefs);
                callback();
            });
    },

    processFile(prefs, callback) {
        const file = prefs.filename;

        if (fs.existsSync(file) && fs.statSync(file).isFile()) {
            const text = fs.readFileSync(file);
            if (isutf8(text)) {
                processText(text.toString(), prefs);
            } else {
                callback(true, `${file}: is not UTF-8.`);
            }
        } else {
            callback(true, `${file}: no such file.`);
        }

        callback(false);
    }
};
