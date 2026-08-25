const PDFDocument = require('pdfkit');
const Certificate = require('../models/Certificate');
const Activity = require('../models/Activity');
const User = require('../models/User');

// Brand palette (kept in sync with frontend/app/globals.css)
const INK = '#1a1630'; // --navy / --plum
const PINK = '#ec1975'; // --pink / --barbie
const GOLD = '#c9a227'; // --gold
const IVORY = '#f4efe6'; // --ivory

/**
 * Renders a single-page landscape PDF certificate for the given (already
 * populated, i.e. { ...cert, activity, student }) certificate record.
 * Returns a Buffer - callers stream it back as an attachment.
 */
const renderCertificatePdf = (certificate) =>
  new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 0 });
    const chunks = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const { width: W, height: H } = doc.page;
    const studentName = certificate.student?.name || 'Katalyst Fellow';
    const activityTitle = certificate.activity?.title || certificate.title;
    const issuedDate = new Date(certificate.issuedAt || Date.now()).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    // Background + border frame
    doc.rect(0, 0, W, H).fill(IVORY);
    doc.rect(24, 24, W - 48, H - 48).lineWidth(2).stroke(GOLD);
    doc.rect(34, 34, W - 68, H - 68).lineWidth(1).stroke(PINK);

    // Header
    doc
      .fillColor(INK)
      .font('Helvetica-Bold')
      .fontSize(15)
      .text('KATALYST', 0, 58, { align: 'center', characterSpacing: 6 });
    doc
      .fillColor(PINK)
      .font('Helvetica')
      .fontSize(11)
      .text('CERTIFICATE OF COMPLETION', 0, 84, { align: 'center', characterSpacing: 3 });

    // Body
    doc
      .fillColor(INK)
      .font('Helvetica')
      .fontSize(13)
      .text('This certifies that', 0, 128, { align: 'center' });

    doc
      .fillColor(INK)
      .font('Helvetica-Bold')
      .fontSize(32)
      .text(studentName, 0, 150, { align: 'center' });

    doc
      .moveTo(W / 2 - 160, 195)
      .lineTo(W / 2 + 160, 195)
      .lineWidth(1)
      .stroke(GOLD);

    doc
      .fillColor(INK)
      .font('Helvetica')
      .fontSize(13)
      .text('has successfully completed', 0, 210, { align: 'center' });

    doc
      .fillColor(PINK)
      .font('Helvetica-Bold')
      .fontSize(21)
      .text(activityTitle, 60, 236, { align: 'center', width: W - 120 });

    doc
      .fillColor('#6a6478')
      .font('Helvetica-Oblique')
      .fontSize(10)
      .text('in recognition of dedication and achievement within the Katalyst programme', 90, 268, {
        align: 'center',
        width: W - 180,
      });

    // Seal: a gold medallion with a pink ribbon, filling the otherwise empty
    // middle of the page and giving the certificate a focal point.
    const sealCx = W / 2;
    const sealCy = 340;
    doc
      .polygon([sealCx - 20, sealCy + 22], [sealCx - 8, sealCy + 68], [sealCx, sealCy + 50])
      .fill(PINK);
    doc
      .polygon([sealCx + 20, sealCy + 22], [sealCx + 8, sealCy + 68], [sealCx, sealCy + 50])
      .fill('#c91864');
    doc.circle(sealCx, sealCy, 30).lineWidth(2).fillAndStroke(GOLD, INK);
    doc.circle(sealCx, sealCy, 23).lineWidth(1).stroke(IVORY);
    doc
      .fillColor(IVORY)
      .font('Helvetica-Bold')
      .fontSize(20)
      .text('K', sealCx - 15, sealCy - 13, { width: 30, align: 'center' });

    doc
      .fillColor(INK)
      .font('Helvetica')
      .fontSize(11)
      .text(`Issued on ${issuedDate}`, 0, H - 96, { align: 'center' });

    // Footer: signature + certificate id
    doc.font('Helvetica').fontSize(9).fillColor(INK);
    doc
      .moveTo(W / 2 - 260, H - 66)
      .lineTo(W / 2 - 140, H - 66)
      .lineWidth(0.75)
      .stroke(INK);
    doc.text('Programme Lead', W / 2 - 260, H - 60, { width: 120, align: 'center' });

    doc
      .moveTo(W / 2 + 140, H - 66)
      .lineTo(W / 2 + 260, H - 66)
      .lineWidth(0.75)
      .stroke(INK);
    doc.text('Katalyst', W / 2 + 140, H - 60, { width: 120, align: 'center' });

    doc
      .fontSize(8)
      .fillColor('#6a6478')
      .text(`Certificate ID: ${certificate.id || certificate._id}`, 0, H - 44, { align: 'center' });

    doc.end();
  });

const getCertificates = async (studentId = null) => {
  const filter = {};
  if (studentId) filter.studentId = studentId;

  const certs = await Certificate.find(filter).sort({ issuedAt: -1 });
  const activityIds = certs.map((c) => c.activityId);
  const studentIds = certs.map((c) => c.studentId);

  const [activities, users] = await Promise.all([
    Activity.find({ _id: { $in: activityIds } }),
    User.find({ _id: { $in: studentIds } })
  ]);

  const activityMap = new Map(activities.map((a) => [a.id, a]));
  const userMap = new Map(users.map((u) => [u.id, u]));

  return certs.map((c) => ({
    ...c.toJSON(),
    activity: activityMap.get(c.activityId) || null,
    student: userMap.get(c.studentId) || null
  }));
};

const getCertificateById = async (id) => {
  const cert = await Certificate.findById(id);
  if (!cert) {
    const error = new Error('Certificate not found');
    error.statusCode = 404;
    throw error;
  }

  const [activity, user] = await Promise.all([
    Activity.findById(cert.activityId),
    User.findById(cert.studentId)
  ]);

  return {
    ...cert.toJSON(),
    activity,
    student: user
  };
};

module.exports = {
  getCertificates,
  getCertificateById,
  renderCertificatePdf
};
