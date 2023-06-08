# wirestock-convert
Batch Convert and Scale your Images

I use realesrgan-ncnn-vulkan to scale the images (renamed to upscale)<br>
https://github.com/xinntao/Real-ESRGAN-ncnn-vulkan<br>

## Modifying the scaler
Modify **const upscale** to change the scaler command or get realesrgan-ncnn-vulkan and rename it to upscale

Passed arguments:<br>
{0} is the full path to the input file<br>
{1} is the full path to the output file<br>
{2} is how many times the image should be scaled. (ex. 1, 2, 3, 4)<br>

## Install
- After downloading / cloning just run **npm install**
- You wioll need an image scaler, I put the one I use above
- You will have to modify the hard coded paths, you can put the files wherever you like. (I put the image scaler in /usr/bin)
