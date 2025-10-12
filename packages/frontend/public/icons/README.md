# PWA Icons

This directory should contain app icons in the following sizes:

- icon-72x72.png
- icon-96x96.png
- icon-128x128.png
- icon-144x144.png
- icon-152x152.png
- icon-192x192.png
- icon-384x384.png
- icon-512x512.png

## Generating Icons

You can generate these icons from a source SVG or PNG using tools like:

1. **PWA Asset Generator**: `npx @vite-pwa/assets-generator`
2. **Online tool**: https://www.pwabuilder.com/imageGenerator
3. **ImageMagick** (if you have a source image):

```bash
# Example with ImageMagick
convert source.png -resize 72x72 icon-72x72.png
convert source.png -resize 96x96 icon-96x96.png
convert source.png -resize 128x128 icon-128x128.png
convert source.png -resize 144x144 icon-144x144.png
convert source.png -resize 152x152 icon-152x152.png
convert source.png -resize 192x192 icon-192x192.png
convert source.png -resize 384x384 icon-384x384.png
convert source.png -resize 512x512 icon-512x512.png
```

## Temporary Placeholder

For development, you can use a simple colored square:

```bash
# Create temporary blue icons (Metra brand color)
for size in 72 96 128 144 152 192 384 512; do
  convert -size ${size}x${size} xc:"#0066CC" icon-${size}x${size}.png
done
```
