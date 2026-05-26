function formatIssuedDate(issuedAt) {
  const date = new Date(issuedAt);
  if (Number.isNaN(date.getTime())) return issuedAt || '';
  return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

function drawCenteredText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = String(text || '').split(/\s+/);
  const lines = [];
  let line = '';

  words.forEach((word) => {
    const nextLine = line ? `${line} ${word}` : word;
    if (ctx.measureText(nextLine).width > maxWidth && line) {
      lines.push(line);
      line = word;
      return;
    }
    line = nextLine;
  });

  if (line) lines.push(line);

  lines.forEach((lineText, index) => {
    ctx.fillText(lineText, x, y + index * lineHeight);
  });

  return lines.length * lineHeight;
}

function drawShield(ctx, x, y, size) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(size / 24, size / 24);
  ctx.beginPath();
  ctx.moveTo(12, 1);
  ctx.lineTo(3, 5);
  ctx.lineTo(3, 11);
  ctx.bezierCurveTo(3, 16.55, 6.84, 21.74, 12, 23);
  ctx.bezierCurveTo(17.16, 21.74, 21, 16.55, 21, 11);
  ctx.lineTo(21, 5);
  ctx.closePath();
  ctx.fill();
  ctx.globalCompositeOperation = 'destination-out';
  ctx.beginPath();
  ctx.moveTo(12, 3.18);
  ctx.lineTo(19, 6.29);
  ctx.lineTo(19, 12);
  ctx.bezierCurveTo(19, 16.54, 15.93, 20.83, 12, 21.93);
  ctx.bezierCurveTo(8.07, 20.83, 5, 16.54, 5, 12);
  ctx.lineTo(5, 6.29);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

async function saveCanvas(canvas, filename) {
  const blob = await new Promise((resolve, reject) => {
    canvas.toBlob((result) => {
      if (result) {
        resolve(result);
        return;
      }
      reject(new Error('Could not create certificate image.'));
    }, 'image/png');
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.download = filename;
  link.href = url;
  link.style.display = 'none';

  document.body.appendChild(link);
  link.click();
  link.remove();

  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function downloadCertificate(certificateData) {
  if (!certificateData) {
    throw new Error('Certificate is not ready to download.');
  }

  if (document.fonts?.ready) {
    await document.fonts.ready;
  }

  const scale = 2;
  const width = 842;
  const height = 595;
  const canvas = document.createElement('canvas');
  canvas.width = width * scale;
  canvas.height = height * scale;

  const ctx = canvas.getContext('2d');
  ctx.scale(scale, scale);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = '#f59e0b';
  ctx.lineWidth = 4;
  ctx.strokeRect(32, 32, width - 64, height - 64);
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 2;
  ctx.strokeRect(42, 42, width - 84, height - 84);

  ctx.fillStyle = '#0f172a';
  drawShield(ctx, width / 2 - 28, 74, 56);

  ctx.textAlign = 'center';
  ctx.fillStyle = '#0f172a';
  ctx.font = '700 24px Arial, sans-serif';
  ctx.fillText('CyberShield', width / 2, 156);

  ctx.font = '700 46px Arial, sans-serif';
  ctx.fillText('Certificate of Completion', width / 2, 246);

  ctx.fillStyle = '#b45309';
  ctx.font = '600 20px Arial, sans-serif';
  ctx.fillText('in Cyber Security Awareness Training', width / 2, 284);

  ctx.fillStyle = '#334155';
  ctx.font = '400 18px Arial, sans-serif';
  drawCenteredText(
    ctx,
    `This certifies that ${certificateData.employee_name} has successfully completed all ${certificateData.modules_completed} modules of the CyberShield Cyber Security Awareness Training Program`,
    width / 2,
    360,
    620,
    28,
  );

  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(82, 474);
  ctx.lineTo(width - 82, 474);
  ctx.stroke();

  ctx.textAlign = 'left';
  ctx.fillStyle = '#64748b';
  ctx.font = '700 12px Arial, sans-serif';
  ctx.fillText('ISSUED BY', 82, 506);
  ctx.fillStyle = '#0f172a';
  ctx.font = '600 18px Arial, sans-serif';
  ctx.fillText(certificateData.tenant_name || 'Group SNS', 82, 530);

  ctx.textAlign = 'right';
  ctx.fillStyle = '#64748b';
  ctx.font = '700 12px Arial, sans-serif';
  ctx.fillText('DATE', width - 82, 506);
  ctx.fillStyle = '#0f172a';
  ctx.font = '600 18px Arial, sans-serif';
  ctx.fillText(formatIssuedDate(certificateData.issued_at), width - 82, 530);

  ctx.textAlign = 'center';
  ctx.fillStyle = '#94a3b8';
  ctx.font = '400 12px Arial, sans-serif';
  ctx.fillText(`Certificate ID: ${certificateData.certificate_id}`, width / 2, 562);

  const safeName = (certificateData.employee_name || 'Employee')
    .trim()
    .replace(/[^\w-]+/g, '_')
    .replace(/^_+|_+$/g, '') || 'Employee';

  await saveCanvas(canvas, `CyberShield_Certificate_${safeName}.png`);
}
