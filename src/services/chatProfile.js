export async function prepareChatAvatar(file) {
  if (!file || !['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) throw new Error('Choose a PNG, JPEG or WebP image.');
  if (file.size > 5 * 1024 * 1024) throw new Error('Choose an image smaller than 5 MB.');
  const bitmap = await createImageBitmap(file).catch(() => { throw new Error('This image could not be opened. Choose another picture.'); });
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 192; canvas.height = 192;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Your browser could not prepare the image.');
    ctx.fillStyle = '#f1efff'; ctx.fillRect(0, 0, 192, 192);
    const side = Math.min(bitmap.width, bitmap.height);
    ctx.drawImage(bitmap, (bitmap.width - side) / 2, (bitmap.height - side) / 2, side, side, 0, 0, 192, 192);
    const avatar = canvas.toDataURL('image/jpeg', 0.78);
    if (avatar.length > 48000) throw new Error('This image is too detailed. Try a simpler profile picture.');
    return avatar;
  } finally { bitmap.close(); }
}
