require('ansi-console-colors')

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const app = require('./package.json');
const { promisify } = require('util');
const exec = promisify(require('child_process').exec);
const upscaleCmd = '/usr/bin/upscale -i "{input}" -o "{output}" -s {factor} -m "/usr/share/models" -f jpg'

// Production
const MAX_FILE_SIZE = 4 * 1024 * 1024; // 4MB

// Testing
//const MAX_FILE_SIZE = 796620

function replaceTokens(string, replacements) {
    const regex = new RegExp(Object.keys(replacements).join('|'), 'g');
    return string.replace(regex, (matched) => replacements[matched]);
}

async function convertResize(directoryPath) {
    var convertCount = 0
    var publishCount = 0

    try {
        const files = await fs.promises.readdir(directoryPath);
        
        for (const file of files) {
            if (/^(?!111-stage-|000-publish-)(.*)(\.(png|jpg|jpeg|tif|tiff|gif|svg|raw)$)/i.test(file)) {
                const filePath      = path.join(directoryPath, file);
                const outputFile    = path.parse(file).name
                const textJpgFile   = `111-stage-${outputFile}.jpg`
                const textPubFile   = `000-publish-${outputFile}.jpg`
                const outputFileJpg = path.join(directoryPath, `111-stage-${outputFile}.jpg`);
                const outputFilePub = path.join(directoryPath, `000-publish-${outputFile}.jpg`);
                
                if (!fs.existsSync(outputFileJpg)) {
                    convertCount += 1
                    console.print(`@X0BConverting @X0F${file} @X0B-> @X0F${textJpgFile}`);
                    await sharp(filePath).toFormat('jpeg').toFile(outputFileJpg);
                }
                
                if (!fs.existsSync(outputFilePub)) {
                    publishCount += 1
                    const { size } = await fs.promises.stat(outputFileJpg);
                    let factor = 0
                    if (size <= MAX_FILE_SIZE) {
                        factor = Math.floor(Math.log(MAX_FILE_SIZE / size)) + 1
                        const resizeCommand = replaceTokens(upscaleCmd, {
                            '{input}':  outputFileJpg,
                            '{output}': outputFilePub,
                            '{factor}': factor
                        })
                        
                        console.print(`@X0BResizing @X0F${textPubFile} @X0Ax@X0B@X0F${factor} @X0B-> @X0F${textPubFile}@X0B`);
                        await exec(resizeCommand);
                    } else {
                        console.print(`@X0BCopying @X0F${textJpgFile} @X0B/ @X0F${size} @X0Bbytes -> @X0F${textPubFile}@X0B, @X0C(exceeds ${MAX_FILE_SIZE})`);
                        await fs.promises.copyFile(outputFileJpg, outputFilePub)
                    }
                }
            }
        }
        console.log()
        console.print(`@X0BFiles Converted: @X0F${convertCount}`);
        console.print(`@X0BFiles Published: @X0F${publishCount}`);
    } catch (error) {
        console.error('Error:', error);
    }
}

console.print(`@X0B${app.name}, (@X0Cv@X0F${app.version}@X0B)\n@X0E${app.description}\n`)

let dirPath = process.argv[2] || process.cwd()

if (dirPath == "--help") {
    console.print(`@X0F> @X0Bnode index.js`)
    console.print(`@X0F> @X0Bnode index.js <path>`)
} else if (fs.existsSync(dirPath)) {
    console.print(`@X0BDirectory @X0F${dirPath}\n`)
    convertResize(dirPath);
} else {
    console.print(`@X0BInvalid Directory: @X0F${dirPath}`)
}
