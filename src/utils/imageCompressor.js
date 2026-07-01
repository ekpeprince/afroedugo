/**
 * imageCompressor.js
 *
 * Compresses an image file client-side using HTML5 Canvas drawing.
 * Downscales images larger than 1200px and converts to a JPEG Blob at 0.75 quality.
 *
 * @param {File} file           - The input file object from a file input element.
 * @param {number} [maxWidth]   - Bounding box maximum width (default 1200).
 * @param {number} [maxHeight]  - Bounding box maximum height (default 1200).
 * @param {number} [quality]    - JPEG compression quality (0.0 to 1.0, default 0.75).
 * @returns {Promise<File>}     - A promise that resolves with the compressed File object.
 */
export function compressImage(file, maxWidth = 1200, maxHeight = 1200, quality = 0.75) {
  return new Promise((resolve) => {
    // If the file is not an image, resolve with original file immediately
    if (!file || !file.type.startsWith('image/')) {
      resolve(file);
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Calculate aspect ratio bounding scale
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(file); // fallback if canvas context is not supported
          return;
        }

        // Draw image into canvas
        ctx.drawImage(img, 0, 0, width, height);

        // Convert canvas contents to JPEG Blob
        canvas.toBlob(
          (blob) => {
            if (blob) {
              try {
                // Wrap the blob as a File object under the original file name
                const compressedFile = new File([blob], file.name, {
                  type: 'image/jpeg',
                  lastModified: Date.now(),
                });
                resolve(compressedFile);
              } catch (e) {
                resolve(file);
              }
            } else {
              resolve(file); // fallback on blob creation errors
            }
          },
          'image/jpeg',
          quality
        );
      };

      img.onerror = () => resolve(file); // fallback on image load errors
    };

    reader.onerror = () => resolve(file); // fallback on reader load errors
  });
}
