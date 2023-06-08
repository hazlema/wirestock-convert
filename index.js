/* Batch Convert and Scale your Images
 * Frosty (06/08/23)
 *
 * I use realesrgan-ncnn-vulkan to scale the images (renamed to upscale)
 * https://github.com/xinntao/Real-ESRGAN-ncnn-vulkan
 * 
 * To reprocess an image delete the jpg files
 * 
 * Modifying the scaler
 * --------------------
 * Modify ''const upscale'' to change the scaler command or get 
 * realesrgan-ncnn-vulkan and rename it to upscale
 * 
 * Passed arguments:
 *      {0} is the full path to the input file
 *      {1} is the full path to the output file
 *      {2} is how many times the image should be scaled. (ex. 1, 2, 3, 4)
 *      - Math.floor(Math.log(4194304 / newSize.size)) + 2
 *      - Number of XX times till the resulting size is over 4mb
 */
const fs       = require('fs');
const path     = require('path');
const sharp    = require('sharp');
const { exec } = require('child_process');

const directoryPath = process.argv[2] || '.';
const upscale       = '/usr/bin/upscale -i "{0}" -o "{1}" -s {2} -m "/usr/share/models" -f jpg'

var app        = require('./package.json');
console.log(`\n${app.name}, (${app.version})\n${app.description}\n`)

async function convertJpeg(inFile, outFile) {
    await sharp(inFile).toFormat('jpeg').toFile(outFile);
    return Promise.resolve();
}

async function execScale(cmd) {
    await exec(cmd, (error, stdout, stderr) => {
        if (error) {
            throw('Error executing scaler shell command:', error);
        }
    })
    return Promise.resolve();
}

fs.readdir(directoryPath, async (error, files) => {
    if (error) {
        throw('Error reading directory:', error);
    }
    
    // Filter Array
    let filtered = files.filter(files => {
        return /\.(png|tif|tiff|gif|svg|raw)$/i.test(files)
    })

    if (filtered.length == 0) {
        console.log("Nothing to process, supported extensions: png, tiff, tif, gif, svg, raw")
    }

    for (const file of filtered) {
        // File Details
        let process  = path.join(directoryPath, file);
        let fileExt  = path.extname(process);
        let fileName = path.basename(process, fileExt);
        let filePath = path.dirname(process);
        
        // File Paths
        let fileJpg       = `${fileName}.jpg`;
        let fileJpgPath   = path.join(filePath, fileJpg);
        let fileScalePath = path.join(filePath, '000-pub-' + fileName + '.jpg');
        
        console.log(`Processing (${filePath}, ${fileName}, ${fileExt})`);
            
        // Do I need to create a jpeg?
        const jpgExists = files.some((file) => {
            return file.toLowerCase() === fileJpg.toLowerCase();
        });
            
        // Create a jpeg
        if (!jpgExists) {
            console.log(`Converting to ${fileJpgPath}`);
            await convertJpeg(process, fileJpgPath);
        }
            
        // Do I need to create an upscale?
        const scaleExists = files.some((file) => {
            return (file.toLowerCase() === fileScalePath.toLowerCase());
        });
                
        // Upscale
        if (!scaleExists) {
            const newSize = await fs.promises.stat(process);
                   
            // Copy JPG to Published
            if (newSize.size >= 4194304) {
                console.log(`No scaling needed on ${fileJpgPath}`);
                fs.copyFile(fileJpgPath, fileScalePath, (err) => {
                    if (err) throw err;
                });
                console.log(`Published ${fileJpgPath} -> ${fileScalePath}`);
            } else {
                // Upscale
                var resize = Math.floor(Math.log(4194304 / newSize.size)) + 2;
                console.log(`Scale ${fileJpgPath} x`, resize);
                            
                let cmd = upscale;
                cmd = cmd.replace('{0}', fileJpgPath);
                cmd = cmd.replace('{1}', fileScalePath);
                cmd = cmd.replace('{2}', resize);
                await execScale(cmd)
                console.log(`Published ${fileJpgPath} -> ${fileScalePath}`);
            }
        }
        console.log()
    }
});