const data = require('./data');
const PDFDocument = require('pdfkit');
const fs = require('fs');

const doc = new PDFDocument();

doc.pipe(fs.createWriteStream('./static/files/geidelguerra_cv_en.pdf'));

doc.image('static/images/geidel_profile.jpg', 70, 20, { fit: [70, 70] })
doc.text('Geidel Guerra', 150, 30)
doc.moveDown(0.1)

doc.fontSize(10).text('Where to find me: ', { continued: true })

data.networks.forEach((item, i) => {
  const notLast = i < data.networks.length - 1
  doc
    .text(item.label, { link: item.url, continued: notLast })
    .text('  ', { continued: notLast })
})

doc.text('', 70, 40)
doc.moveDown(5)

doc
  .fillColor('black')
  .font('assets/fonts/pdf/FiraSans-Black.ttf')
  .fontSize(18)
  .text('Who am I?')
  .moveDown(0.5)

doc
  .font('assets/fonts/pdf/FiraSans-Regular.ttf')
  .fontSize(12)
  .text(data.about, { align: 'justify' })

doc.moveDown()
doc.font('assets/fonts/pdf/FiraSans-Black.ttf').fontSize(18).text('Skills')

doc.fillColor('#888').font('assets/fonts/pdf/FiraSans-Regular.ttf').fontSize(10).text('The score\'s scale is 1 to 5. 1 been almost no experience and 5 been a lot of experience')
doc.moveDown(0.5)

doc.fillColor('black')

data.skills.forEach((item) => {
  doc
    .font('assets/fonts/pdf/FiraSans-Regular.ttf')
    .fontSize(12)
    .text(`${item.label} - ${item.score}`, { link: item.url })
})

doc.moveDown()
doc.font('assets/fonts/pdf/FiraSans-Black.ttf').fontSize(18).text('Languages').moveDown(0.5)

data.languages.forEach((item) => {
  doc
    .font('assets/fonts/pdf/FiraSans-Regular.ttf')
    .fontSize(12)
    .text(`${item.label} - ${item.score}`, { link: item.url })
})

doc.moveDown()
doc.font('assets/fonts/pdf/FiraSans-Black.ttf').fontSize(18).text('Toolkit').moveDown(0.5)

data.toolkit.forEach((item) => {
  doc
    .font('assets/fonts/pdf/FiraSans-Regular.ttf')
    .fontSize(12)
    .text(`${item.category} - ${item.name}`)
})

doc.moveDown()
doc.font('assets/fonts/pdf/FiraSans-Black.ttf').fontSize(18).text('Experience').moveDown(0.5)

data.experience.forEach((item) => {
  doc
    .font('assets/fonts/pdf/FiraSans-Bold.ttf')
    .fontSize(12)
    .text(item.name, { link: item.url })
    .font('assets/fonts/pdf/FiraSans-Regular.ttf')
    .fontSize(10)
    .fillColor('#888')
    .text(`${item.startDate} - ${item.endDate}`)
    .fillColor('black')
    .moveDown()

  if (item.description) {
    doc
      .fontSize(12)
      .font('assets/fonts/pdf/FiraSans-Regular.ttf')
      .text(item.description)
      .moveDown()
  }
})

doc.moveDown()
doc.font('assets/fonts/pdf/FiraSans-Black.ttf').fontSize(18).text('Projects').moveDown(0.5)

data.projects.forEach((item) => {
  doc
    .font('assets/fonts/pdf/FiraSans-Bold.ttf')
    .fontSize(12)
    .text(item.name, { link: item.url })
    .font('assets/fonts/pdf/FiraSans-Regular.ttf')
    .fontSize(10)
    .fillColor('#888')
    .text(`${item.startDate} - ${item.endDate}`)
    .fillColor('black')
    .moveDown()
    .fontSize(12)
    .font('assets/fonts/pdf/FiraSans-Regular.ttf')
    .text(item.description)
    .moveDown()
})

doc.save().end();